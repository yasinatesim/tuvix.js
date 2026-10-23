# @tuvix.js/core

> Orchestrator that loads micro apps and mounts or unmounts them as the URL changes.

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

Full documentation: [tuvix.js.org/packages/core](https://tuvix.js.org/packages/core)

## Installation

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

It depends on `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` and `@tuvix.js/sandbox`.

## Quick start

Shell:

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/settings/*', app: 'settings' }] },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

orchestrator.register({
  name: 'settings',
  entry: { scripts: ['/settings/main.js'], styles: ['/settings/main.css'] },
  container: '#main',
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Remote app (`dashboard/main.js`):

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## How apps become active

- `activeWhen: '/path'`: matched with `matchPath` from `@tuvix.js/router`. Query and hash are ignored, `'/dashboard'` and `'/dashboard/*'` match `/dashboard` and every sub-path (not `/dashboards`), `:id` matches one segment, `'/'` matches every path.
- `activeWhen: (path) => boolean`: your function decides.
- No `activeWhen`, named in `router.routes`: active while a route with `app: name` matches in full. A `'/'` route means the home page only; `'/*'` means every path.
- Neither: you call `mountApp` / `unmountApp`; reconciles leave the app alone.
- `mountWhenVisible: true`: mounts once the container is 10 % visible; `activeWhen` is ignored.

The current path comes from `connectRouter`'s `getPath()`, else the built-in router, else `window.location.pathname`. Reconciles run one at a time: inactive apps unmount first, then active apps mount. Queued navigations collapse to the newest path. An app that turns inactive while loading skips its mount; one that turns inactive mid-mount unmounts once the mount settles.

## API

### `createOrchestrator(config?)` / `new Orchestrator(config?)`

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | none | Built-in router: `mode` (`'history'` default or `'hash'`), `base`, `routes` (required). |
| `eventBus` | `EventBusOptions` | none | Private bus options. Omitted: the orchestrator uses `getGlobalBus()`. |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | Passed to the module loader, plus `globals`. |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | `immediate` on `start()`, `idle` in the first idle period, `hover` when a same-origin link that activates an app gets pointer or focus. |
| `onError` | `(error: Error, appName: string) => void` | none | Load, bootstrap, mount, update and unmount failures. |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | none | Every status change. |

### `Orchestrator` methods

| Method | Behaviour |
| --- | --- |
| `register(appConfig: MicroAppConfig): void` | Stores the config. Does not load, mount or reconcile. |
| `unregister(name): Promise<void>` | Unmounts, removes the entry's tags and cached module, forgets the app. |
| `start(): Promise<void>` | Follows the router, reconciles, starts prefetch and viewport observing. Emits `STARTED`. |
| `mountApp(name): Promise<void>` | Waits for an in-flight unmount, mounts. Rejects with the error after rendering `fallback`. |
| `unmountApp(name): Promise<void>` | Waits for an in-flight load or mount, unmounts. |
| `updateAppProps(name, props): Promise<void>` | Shallow-merges props. Calls `update({ props, container })` on a mounted app, else stores them for the next mount. |
| `reconcile(path?): Promise<void>` | Queues a reconcile against `path` or the current path. |
| `connectRouter({ subscribe, getPath }): () => void` | Follows an external router. Returns `disconnect`. |
| `navigateTo(path): Promise<void>` | `push(path)` on the built-in router. Throws `[Tuvix] No router configured.` without one. |
| `getAppStatus(name): AppStatus \| null` | Status, or `null` for unknown names. |
| `getRegisteredApps(): string[]` | Registered names. |
| `getMountedApps(): string[]` | Names with status `'mounted'`. |
| `getEventBus(): IEventBus` | `getGlobalBus()` or the private bus. |
| `getRouter(): IRouter \| null` | Built-in router or `null`. |
| `destroy(): Promise<void>` | Waits for a running reconcile, unmounts every app, stops listening, emits `DESTROYED`. Leaves the global bus alive. |

`register` options:

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | Unique; the remote registers under the same name. |
| `entry` | `Entry` | required | URL, `{ scripts, styles?, type?, integrity? }`, or `() => import('./app')`. |
| `container` | `string \| HTMLElement` | required | Selector (resolved on every mount) or element. |
| `activeWhen` | `string \| ((path: string) => boolean)` | none | Activation rule. |
| `props` | `Record<string, unknown>` | none | Passed to `mount()`. |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | Render inside a shadow root with the entry's `styles` loaded there. |
| `fallback` | `string` | none | HTML set with `innerHTML` on load, bootstrap or mount failure. |
| `mountWhenVisible` | `boolean` | `false` | Mount on 10 % viewport visibility. |

`connectRouter` with TanStack Router:

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
// later: disconnect();
```

### `defineMicroApp(definition): MicroAppModule`

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | Must equal the registered name. |
| `bootstrap` | `() => void \| Promise<void>` | none | Runs before the first mount. A failed bootstrap runs again on the next mount; a successful one runs once. |
| `mount` | `(context: MountContext) => void \| Promise<void>` | required | Receives `container`, `props`, `name` and `bus`. |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | required | Receives `container`. |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | none | Receives `props` and `container`. |
| `ssr` | `boolean` | `false` | `mount` adopts server markup; the `mounted` event reports `hydrated: true` when the container had markup. |

Publishes the module with `registerModule` from `@tuvix.js/loader` and returns it. The module dispatches `tuvix:mounted`, `tuvix:unmounted` and `tuvix:error` DOM events (bubbling to `document`), so `whenMounted`, `isMounted` and `onLifecycle` work for it. An `unmount` during a running `mount` on the same container waits for it. Throws when `name`, `mount` or `unmount` is missing.

### `OrchestratorEvent`

Events on the orchestrator's bus: `APP_REGISTERED` (`tuvix:app:registered`), `APP_BOOTSTRAP`, `APP_MOUNT`, `APP_UNMOUNT`, `APP_ERROR` (`AppErrorEvent`: `{ name, error, phase }` for `'load'`, `'bootstrap'`, `'mount'`, `'update'` or `'unmount'` failures), `APP_STATUS_CHANGE` (`{ name, status }`), `ROUTE_CHANGE` (built-in router only), `STARTED`, `DESTROYED`.

```ts
import { getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

### CSS isolation

`sandbox: true` or `{ css: true }` attaches an open shadow root to the container (reused on remount), mounts the app into a `<div data-tuvix-sandbox-root>` inside it, and loads the entry's `styles` there. The mount waits for the stylesheets up to `loader.timeout`. JavaScript is not sandboxed; `JsSandbox` from `@tuvix.js/sandbox` is a standalone utility.

### Types

`OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition`, `AppSandboxOption`, `RouterSource`, `AppErrorEvent`, `AppErrorPhase`, `AppStatus` (`registered`, `bootstrapping`, `bootstrapped`, `mounting`, `mounted`, `updating`, `unmounting`, `unmounted`, `error`), `RegisteredApp` (record shape; no method returns it).

### Re-exports

- From `@tuvix.js/event-bus`: `createEventBus`, `getGlobalBus`, types `IEventBus`, `EventHandler`, `Unsubscribe`.
- From `@tuvix.js/router`: `createRouter`, `matchPath`, `interceptLinks`, types `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions`.
- From `@tuvix.js/loader`: `createLoader`, types `Entry`, `MicroAppModule`.

## Edge cases

- `register()` after `start()` reconciles a route-managed app against the current path, so it mounts right away when active. A `mountWhenVisible` app registered after `start()` is observed right away; a container missing from the DOM then is never observed.
- Reconcile failures do not reject `start()` or `reconcile()`; they go to `onError` and the console. `mountApp` rejects.
- An app in `error` retries on the next reconcile that wants it active. `fallback` renders only for load, bootstrap and mount failures.
- Unmount removes the entry's stylesheets from `document.head`; the next mount re-adds them.
- Two orchestrators share `getGlobalBus()`. Pass `eventBus: {}` for a private bus.
- After `destroy()`, mutating methods throw `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`.

## What it does not do

- Sandbox JavaScript.
- Intercept link clicks (use `interceptLinks`).
- Render on the server (use `@tuvix.js/server`).
- Share dependencies between apps (use `@tuvix.js/module-federation` or import maps).
- Emit `tuvix:mounted` DOM events for hand-written modules; `defineMicroApp` and the framework adapters do that.

## Migrating from 0.4

- The orchestrator uses `getGlobalBus()` unless you pass `eventBus`; `destroy()` leaves the global bus alive.
- Reconciles no longer unmount manually mounted or `mountWhenVisible` apps.
- `sandbox: true` renders inside a shadow root.
- `prefetch: 'hover'` prefetches only apps a hovered or focused link activates.
- `activeWhen` uses `matchPath`: query and hash ignored, `:param` works, `.` and `(` match literally.
- `OrchestratorConfig.shared` is removed (it was never read). Use `@tuvix.js/module-federation` or import maps.
- Router `routes` match in full: a `'/'` route is the home page only; use `'/*'` for every path. `RouteConfig.exact` is removed.
- `APP_ERROR` carries `phase` and fires for update and unmount failures too.
- `connectRouter({ subscribe, getPath })` replaces the `setTimeout` + `reconcile()` bridge for external routers.

## License

MIT

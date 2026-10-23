---
title: '@tuvix.js/core'
---

<PackageHeader
  name="@tuvix.js/core"
  title="Core Orchestrator"
  description="Registers micro apps, loads their entries, and mounts or unmounts them as the URL changes. Follows the built-in router or an external one, isolates app CSS in a shadow root on request, and reports lifecycle events on a shared event bus."
  icon="⚙️"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

`@tuvix.js/core` depends on `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` and `@tuvix.js/sandbox`. Your package manager installs them with it.

## When to use it

Use the orchestrator in the host page (the shell) when several independently built apps share one page and the URL decides which of them is visible. You register each app once with its entry URL, its container and the paths it owns. The orchestrator loads the entry on first use, calls the app's `bootstrap`, `mount` and `unmount`, and keeps the page in step with every navigation.

Pick something else in these cases:

- You render one framework island per page and the server already decides what to show. The adapters (`@tuvix.js/react`, `@tuvix.js/vue`, `@tuvix.js/svelte`, `@tuvix.js/angular`) and [`@tuvix.js/vite`](/packages/vite) mount islands without an orchestrator.
- You only need to load a remote script and call its lifecycle yourself. Use [`@tuvix.js/loader`](/packages/loader).
- You want everything from one import. Install the umbrella package [`tuvix.js`](/packages/tuvix), which re-exports this package.

## Quick start

The shell registers two apps that share `#main`, follows the browser URL with the built-in router, and turns same-origin link clicks into router navigations:

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/settings/*', app: 'settings' }],
  },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

// Active on /dashboard and every path below it.
orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

// No activeWhen: the router route above activates it on /settings/*.
orchestrator.register({
  name: 'settings',
  entry: {
    scripts: ['https://cdn.example.com/settings/main.js'],
    styles: ['https://cdn.example.com/settings/main.css'],
  },
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Each remote publishes its lifecycle under the name the shell registered. `defineMicroApp` does that for plain DOM code; the framework adapters do it for React, Vue, Svelte and Angular components.

```ts
// dashboard/main.ts, built to https://cdn.example.com/dashboard/main.js
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props, bus }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
    bus?.emit('dashboard:ready', { at: Date.now() });
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## How apps become active

Every registered app follows one of five activation rules. The orchestrator picks the rule from the app's config.

| Config | The app is active when | Who unmounts it |
| --- | --- | --- |
| `activeWhen: '/path'` | `matchPath('/path', currentPath).matched` is `true` | the next reconcile where the path no longer matches |
| `activeWhen: (path) => boolean` | your function returns `true` | the next reconcile where it returns `false` |
| no `activeWhen`, named in `router.routes` | a route with `app: name` matches the path in full | the next reconcile where no such route matches |
| no `activeWhen`, no route | never by itself | you, with `mountApp` / `unmountApp` |
| `mountWhenVisible: true` | its container is at least 10 % inside the viewport | you; reconciles skip it and `activeWhen` is ignored |

`activeWhen` strings go through [`matchPath`](/packages/router) from `@tuvix.js/router`, the same matcher the router and `@tuvix.js/server` use:

- `?query` and `#hash` are ignored, so `/dashboard?tab=2` keeps the dashboard mounted.
- A plain pattern matches its sub-paths on segment boundaries: `'/dashboard'` matches `/dashboard` and `/dashboard/stats`, and does not match `/dashboards`.
- `'/dashboard/*'` matches the same paths as `'/dashboard'`.
- `:name` matches one segment: `'/users/:id'` matches `/users/42`.
- `'/'` matches every path.
- Other characters, such as `.` and `(`, match literally.

Router `routes` use a full match instead. `{ path: '/settings' }` matches `/settings` only; write `'/settings/*'` to include sub-paths. A `'/'` route activates on the home page only, and `'/*'` activates on every path. Query strings and hashes are ignored here too.

### Where the current path comes from

The orchestrator reads the path from the first source that exists:

1. The router you passed to `connectRouter` (its `getPath()`).
2. The built-in router from `config.router` (its `currentPath`).
3. `window.location.pathname`.

With `config.router` or `connectRouter`, every navigation triggers a reconcile. With neither, `start()` reconciles once against `window.location.pathname` and nothing reacts to later navigations until you call `reconcile()`.

### Reconciles run one at a time

A reconcile compares each route-managed app with the path and makes the DOM match:

1. Apps that should be inactive unmount first, all in parallel, so two apps that share a container never overlap.
2. Apps that should be active then load (first time only), bootstrap (until one `bootstrap` call succeeds) and mount, in parallel.

When a navigation arrives during a reconcile, the orchestrator queues it. If three navigations queue up, only the newest path runs next, and every caller's promise resolves when the queue drains. An app that turns inactive while its entry loads skips its mount. An app that turns inactive in the middle of `mount()` unmounts as soon as that mount settles. Navigating `/a` → `/b` → `/a` quickly leaves only `a` mounted.

## API

### `createOrchestrator`

```ts no-check
function createOrchestrator(config?: OrchestratorConfig): Orchestrator;
```

Creates an `Orchestrator`. Same as `new Orchestrator(config)`.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | none | Creates the built-in router from `@tuvix.js/router` with `mode` (`'history'` or `'hash'`, default `'history'`), `base` and `routes` (required, may be `[]`). Needed for `navigateTo` and `ROUTE_CHANGE` events. |
| `eventBus` | `EventBusOptions` | none | Options (`maxListeners`, `debug`, `logger`) for a private bus. Omit it and the orchestrator uses `getGlobalBus()`, the bus every app on the page shares. |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | Passed to the internal `ModuleLoader`. `timeout` is per attempt in ms (`0` disables it); `globals` are written to `window` before an entry's scripts run. |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | When to download entries before they are needed. See below. |
| `onError` | `(error: Error, appName: string) => void` | none | Called when an app fails to load, bootstrap, mount, update or unmount. `OrchestratorEvent.APP_ERROR` reports the same failures with the phase. |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | none | Called on every status change of every app. |

Prefetch strategies download script and style URLs with `<link rel="prefetch">` or `<link rel="modulepreload">` without running them. Loader-function entries are skipped, because calling the function would run the module.

- `'immediate'`: every registered app, during `start()`.
- `'idle'`: every registered app, in the first `requestIdleCallback` after `start()` (200 ms `setTimeout` where that API is missing).
- `'hover'`: when the pointer enters a same-origin link, or focus lands on it, the orchestrator prefetches the apps that link's path would activate. Each app is prefetched once. Hash mode and `router.base` are respected.

`destroy()` cancels pending idle and hover prefetching.

### `Orchestrator`

```ts no-check
class Orchestrator {
  constructor(config?: OrchestratorConfig);
  register(appConfig: MicroAppConfig): void;
  unregister(name: string): Promise<void>;
  start(): Promise<void>;
  mountApp(name: string): Promise<void>;
  unmountApp(name: string): Promise<void>;
  updateAppProps(name: string, props: Record<string, unknown>): Promise<void>;
  reconcile(path?: string): Promise<void>;
  connectRouter(source: RouterSource): () => void;
  navigateTo(path: string): Promise<void>;
  getAppStatus(name: string): AppStatus | null;
  getRegisteredApps(): string[];
  getMountedApps(): string[];
  getEventBus(): IEventBus;
  getRouter(): IRouter | null;
  destroy(): Promise<void>;
}
```

#### `register(appConfig)`

Stores an app's config. It does not load, mount or reconcile anything; `start()` and later navigations do that.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | Unique app name. The remote module must register under the same name (`defineMicroApp({ name })` or an adapter's `name`), or expose one new `window` global with a `mount` function. |
| `entry` | `Entry` | required | A script URL, an `EntryConfig` (`{ scripts, styles?, type?, integrity? }`), or a loader function such as `() => import('./dashboard')`. See [`@tuvix.js/loader`](/packages/loader). |
| `container` | `string \| HTMLElement` | required | CSS selector or element. A selector is resolved with `document.querySelector` on every mount. |
| `activeWhen` | `string \| ((path: string) => boolean)` | none | Activation rule. See [How apps become active](#how-apps-become-active). |
| `props` | `Record<string, unknown>` | none | Passed to `mount()`. `updateAppProps` merges into them. |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | `true` or `{ css: true }` renders the app inside a shadow root on its container. See [CSS isolation](#css-isolation). |
| `fallback` | `string` | none | HTML written to the container with `innerHTML` when loading, bootstrapping or mounting fails. Update and unmount failures leave the container alone. |
| `mountWhenVisible` | `boolean` | `false` | Mount once the container is 10 % visible, using `IntersectionObserver`. Reconciles ignore the app and its `activeWhen`. |

Throws `[Tuvix] App name is required.`, `[Tuvix] App "<name>" is already registered.`, `[Tuvix] App "<name>" requires an entry.` or `[Tuvix] App "<name>" requires a container.`.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile'),
  container: '#main',
  activeWhen: '/users/:id',
  fallback: '<p>The profile is unavailable.</p>',
});

orchestrator.register({
  name: 'comments',
  entry: 'https://cdn.example.com/comments/main.js',
  container: '#comments',
  mountWhenVisible: true,
});

await orchestrator.start();
```

#### `start()`

Subscribes to the built-in router (if any), reconciles against the current path, sets up prefetching and starts observing `mountWhenVisible` containers. Emits `OrchestratorEvent.STARTED`. Resolves after the first reconcile, including when an app in it failed; failures go to `onError`, `APP_ERROR` and the console. A second call logs `[Tuvix] Orchestrator is already started.` and returns.

#### `mountApp(name)` / `unmountApp(name)`

Mount or unmount one app by hand. Use them for apps without `activeWhen` or a route; for route-managed apps the next reconcile overrides your choice.

`mountApp` waits for an in-flight unmount, then loads and mounts. It rejects with the load or mount error after rendering `fallback`. `unmountApp` waits for an in-flight load or mount, then unmounts; called during the load, it skips the mount entirely.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'chat', entry: '/chat/main.js', container: '#chat' });
await orchestrator.start();

document.querySelector('#open-chat')?.addEventListener('click', () => {
  orchestrator.mountApp('chat').catch(() => {
    // fallback HTML is already in #chat
  });
});
```

#### `updateAppProps(name, props)`

Shallow-merges `props` into the app's current props. A mounted app with an `update` function receives the merged object as `update({ props, container })`. Otherwise the orchestrator stores the merged props and passes them to the next `mount()`. It waits for a pending mount first, so the update reaches the new instance. When `update` throws, the status turns `error`, `onError` runs, the promise rejects, and the stored props stay unchanged.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'cart', entry: '/cart/main.js', container: '#cart', activeWhen: '/' });
await orchestrator.start();

await orchestrator.updateAppProps('cart', { currency: 'EUR' });
```

#### `reconcile(path?)`

Queues a reconcile against `path`, or the current path when you omit it. Use it when no router tells the orchestrator about navigations. Queue rules from [Reconciles run one at a time](#reconciles-run-one-at-a-time) apply.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.reconcile('/dashboard?tab=stats');
```

#### `connectRouter(source)`

Follows an external router (TanStack Router, React Router, your own) instead of the built-in one. `source.subscribe(callback)` must call `callback` after every navigation and return an unsubscribe function; `source.getPath()` returns the current path. After `start()`, each callback reconciles against `getPath()`. `start()` reads `getPath()` too. Connecting an orchestrator that already started reconciles right away. Returns `disconnect()`.

```ts
import { createOrchestrator } from '@tuvix.js/core';

// TanStack Router instance created elsewhere in your shell.
declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'billing', entry: '/billing/main.js', container: '#main', activeWhen: '/billing' });

const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();

// Later, when the shell tears down:
disconnect();
```

A React Router data router (`createBrowserRouter`) fits the same shape: `subscribe: (callback) => router.subscribe(() => callback())` and `getPath: () => router.state.location.pathname`.

#### `navigateTo(path)`

Calls `push(path)` on the built-in router. The promise resolves after the URL changes; the reconcile it triggers runs in the background. Throws `[Tuvix] No router configured.` without `config.router`.

#### `getAppStatus(name)`, `getRegisteredApps()`, `getMountedApps()`

`getAppStatus` returns the app's `AppStatus`, or `null` for an unknown name. `getRegisteredApps` returns every registered name. `getMountedApps` returns names whose status is `'mounted'` (an app in `'updating'` is left out).

#### `getEventBus()`, `getRouter()`

`getEventBus` returns the bus the orchestrator emits `OrchestratorEvent`s on and passes to `mount()`: `getGlobalBus()`, or the private bus when you set `eventBus`. `getRouter` returns the built-in router, or `null`.

#### `unregister(name)`

Unmounts the app (waiting for an in-flight mount), stops observing its container, removes the entry's script and style tags, drops the cached module and forgets the app. Rejects for unknown names. Browsers run a module script once per URL, so registering a `type: 'module'` URL entry again needs a new URL or a loader function.

#### `destroy()`

Stops prefetching, unsubscribes from the built-in router and every connected router, waits for a running reconcile, unmounts every app, clears the loader cache and emits `OrchestratorEvent.DESTROYED`. It destroys a private bus and leaves the global bus alive. Repeated calls return the same promise. Afterwards `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` and `connectRouter` throw `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`.

### `defineMicroApp`

```ts no-check
function defineMicroApp(definition: MicroAppDefinition): MicroAppModule;
```

Validates a lifecycle object, publishes it with `registerModule(definition.name, module)` from `@tuvix.js/loader`, and returns it. Call it in the remote app's entry. The orchestrator finds the module by name after the entry's scripts run, whether the entry is a URL or a loader function.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | Must equal the `name` the shell registered. |
| `bootstrap` | `() => void \| Promise<void>` | none | Runs after the first load, before the first mount. When it throws, the mount fails and the next mount calls it again; after one success it never runs again for that orchestrator. |
| `mount` | `(context: MountContext) => void \| Promise<void>` | required | Render into `context.container`. |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | required | Tear down and empty `context.container`. |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | none | Apply `context.props` without a remount. Without it, new props wait for the next mount. |
| `ssr` | `boolean` | `false` | Set it when `mount` adopts server-rendered markup. The `tuvix:mounted` event then reports `hydrated: true` if the container held markup before `mount` ran. |

`MountContext` carries:

| Field | Type | Meaning |
| --- | --- | --- |
| `container` | `HTMLElement` | Element to render into. For CSS-isolated apps it is a `<div data-tuvix-sandbox-root>` inside the shadow root. |
| `props` | `Record<string, unknown> \| undefined` | Current props. |
| `name` | `string \| undefined` | The registered app name. |
| `bus` | `MicroAppBus \| undefined` | The orchestrator's event bus (`on`, `once`, `emit`, `off`). |

The returned module wraps your `mount` and `unmount` and dispatches the same DOM lifecycle events as the framework adapters, so `whenMounted(name)`, `isMounted(name)` and `onLifecycle` from `@tuvix.js/loader` work for these apps:

- `tuvix:mounted` after `mount` resolves, with `{ name, container, hydrated }`.
- `tuvix:unmounted` after `unmount` resolves.
- `tuvix:error` when either throws. The wrapper then rethrows the error.

The events bubble from the container to `document`. On a container that is not attached to the document, the runtime dispatches them on `document` directly. An `unmount` that arrives while `mount` still runs for the same container waits for that mount first.

Throws `[Tuvix] defineMicroApp requires a "name" property.`, `[Tuvix] defineMicroApp "<name>" requires a "mount" function.` or `[Tuvix] defineMicroApp "<name>" requires an "unmount" function.`.

```ts
import { defineMicroApp } from '@tuvix.js/core';

let offCart: (() => void) | undefined;

export default defineMicroApp({
  name: 'header',
  bootstrap() {
    console.log('header loaded');
  },
  mount({ container, props, bus }) {
    container.innerHTML = `<header>Hello, ${String(props?.user ?? 'guest')} <span id="count">0</span></header>`;
    offCart = bus?.on<{ count: number }>('cart:changed', ({ count }) => {
      const badge = container.querySelector('#count');
      if (badge) badge.textContent = String(count);
    });
  },
  update({ props, container }) {
    const header = container?.querySelector('header');
    if (header?.firstChild) header.firstChild.textContent = `Hello, ${String(props.user ?? 'guest')} `;
  },
  unmount({ container }) {
    offCart?.();
    container.replaceChildren();
  },
});
```

### `OrchestratorEvent`

String enum of the events the orchestrator emits on its bus. Because the default bus is `getGlobalBus()`, any app on the page can listen.

| Member | Event name | Payload |
| --- | --- | --- |
| `APP_REGISTERED` | `'tuvix:app:registered'` | `{ name }` |
| `APP_BOOTSTRAP` | `'tuvix:app:bootstrap'` | `{ name }` |
| `APP_MOUNT` | `'tuvix:app:mount'` | `{ name }` |
| `APP_UNMOUNT` | `'tuvix:app:unmount'` | `{ name }` |
| `APP_ERROR` | `'tuvix:app:error'` | `AppErrorEvent`: `{ name, error, phase }`, where `phase` is `'load'`, `'bootstrap'`, `'mount'`, `'update'` or `'unmount'` |
| `APP_STATUS_CHANGE` | `'tuvix:app:status-change'` | `{ name, status }` |
| `ROUTE_CHANGE` | `'tuvix:route:change'` | the built-in router's `NavigationEvent` (`from`, `to`, `fromRoute`, `toRoute`) |
| `STARTED` | `'tuvix:started'` | `{}` |
| `DESTROYED` | `'tuvix:destroyed'` | `{}` |

`phase: 'load'` covers resolving the container as well as loading the entry.

```ts
import { createOrchestrator, getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
```

### CSS isolation

`sandbox: true` or `sandbox: { css: true }` isolates an app's CSS:

1. On first mount the orchestrator attaches an open shadow root to the container with `CssSandbox` from [`@tuvix.js/sandbox`](/packages/sandbox) and moves existing children (server-rendered markup) into a `<div data-tuvix-sandbox-root="<name>">` inside it. The app mounts into that div.
2. The entry's `styles` load as `<link>` elements inside the shadow root instead of `document.head`. The mount waits until they load or fail, for at most `loader.timeout` ms (10000 by default; with `0` it waits without a limit).
3. Unmount keeps the shadow root. The next mount reuses it.

Page stylesheets no longer match elements inside the app, and the app's stylesheets no longer reach the page. Inherited properties such as `color` and `font-family` still cross the shadow boundary. `{ css: false }` and `false` render into the light DOM.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'checkout',
  entry: { scripts: ['/checkout/main.js'], styles: ['/checkout/main.css'] },
  container: '#checkout',
  activeWhen: '/checkout',
  sandbox: { css: true },
});

await orchestrator.start();
```

The orchestrator does not sandbox JavaScript. `JsSandbox` in [`@tuvix.js/sandbox`](/packages/sandbox) is a standalone utility you call yourself.

### Types

| Type | Meaning |
| --- | --- |
| `OrchestratorConfig` | Argument of `createOrchestrator` and `new Orchestrator`. See the table under `createOrchestrator`. |
| `MicroAppConfig` | Argument of `register`. See the table under `register`. |
| `MicroAppDefinition` | Argument of `defineMicroApp`: `name`, `bootstrap?`, `mount`, `unmount`, `update?`. |
| `AppSandboxOption` | `boolean \| { css?: boolean }`, the `sandbox` field. |
| `RouterSource` | `{ subscribe(callback: () => void): () => void; getPath(): string }`, the argument of `connectRouter`. |
| `AppErrorEvent` | `{ name: string; error: Error; phase: AppErrorPhase }`, the `APP_ERROR` payload. |
| `AppErrorPhase` | `'load' \| 'bootstrap' \| 'mount' \| 'update' \| 'unmount'`. |
| `AppStatus` | `'registered' \| 'bootstrapping' \| 'bootstrapped' \| 'mounting' \| 'mounted' \| 'updating' \| 'unmounting' \| 'unmounted' \| 'error'`. The first mount walks `registered → bootstrapping → bootstrapped → mounting → mounted`; a remount goes `unmounted → mounting → mounted`. |
| `RegisteredApp` | Shape of the orchestrator's record for one app: `config`, `status`, `module`, `container`, `error`, `lastUpdated`. No `Orchestrator` method returns it in 0.5.0. |

### Re-exports

`@tuvix.js/core` re-exports these from its dependencies, so a shell can import everything from one package. Each link documents the full API.

| Export | Kind | Source |
| --- | --- | --- |
| `createEventBus`, `getGlobalBus` | function | [`@tuvix.js/event-bus`](/packages/event-bus) |
| `IEventBus`, `EventHandler`, `Unsubscribe` | type | [`@tuvix.js/event-bus`](/packages/event-bus) |
| `createRouter`, `matchPath`, `interceptLinks` | function | [`@tuvix.js/router`](/packages/router) |
| `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions` | type | [`@tuvix.js/router`](/packages/router) |
| `createLoader` | function | [`@tuvix.js/loader`](/packages/loader) |
| `Entry`, `MicroAppModule` | type | [`@tuvix.js/loader`](/packages/loader) |

`getGlobalBus()` keeps its instance on `window.__TUVIX_GLOBAL_BUS__`, so a micro app that bundles its own copy of `@tuvix.js/event-bus` gets the same bus as the shell.

## Edge cases

- `register()` before `start()` only stores the config. After `start()`, registering a route-managed app (it has `activeWhen`, or a router route names it) reconciles against the current path, so the app mounts right away when the path activates it.
- A `mountWhenVisible` app registered after `start()` is observed right away. A container missing from the DOM at that moment (or at `start()`) is skipped and never observed. Without `IntersectionObserver` (server, old browsers) viewport apps never mount.
- A viewport app that failed to mount stays in `error`; the observer does not retry it.
- A route-managed app in `error` retries on the next reconcile that wants it active. A failed load loads again. A failed `bootstrap` runs `bootstrap` again on the retry; a successful one does not repeat, so a failed `mount` retries `mount` only.
- A missing container fails the mount with `[Tuvix] Container "#main" not found in DOM.`. On a first mount, `fallback` has nowhere to render.
- Reconcile failures do not reject `start()`, `reconcile()` or navigations. The orchestrator logs `[Tuvix] Failed to mount "<name>":` (or `unmount`) to the console and calls `onError`. `mountApp` and `unmountApp` reject.
- `APP_ERROR` fires for failures in every phase, with `phase` naming it. `fallback` renders only for `load`, `bootstrap` and `mount` failures.
- An app whose unmount throws ends in `error` and counts as unmounted.
- `fallback` goes through `innerHTML`. Pass trusted markup only.
- Unmount removes the app's entry stylesheets from `document.head`, unless another loaded app uses the same URL. The next mount adds them back and waits for them.
- Two orchestrators on one page share `getGlobalBus()` and see each other's `OrchestratorEvent`s. Pass `eventBus: {}` to give one a private bus.
- `resetGlobalBus()` from `@tuvix.js/event-bus` destroys the bus a running orchestrator holds. The orchestrator keeps the destroyed bus; call `resetGlobalBus()` only after `destroy()`, for example between tests.
- `connectRouter` callbacks that fire before `start()` are ignored. Calling `connectRouter` twice keeps both subscriptions; the newest source supplies the path for `start()` and `reconcile()`.
- With both `config.router` and `connectRouter`, each source reconciles against its own path. Use one of them.
- `activeWhen` functions receive the raw path from the source. With the built-in router or `connectRouter` that path can contain a query string; `matchPath` strips it for string patterns.
- `updateAppProps` replaces nested objects: `{ user: { id: 2 } }` overwrites the whole `user` prop.

## What it does not do

- It does not sandbox JavaScript. Globals, timers and listeners an app creates stay on `window`. Use `JsSandbox` from [`@tuvix.js/sandbox`](/packages/sandbox).
- It does not intercept link clicks. Call `interceptLinks` (re-exported here) or let your framework router navigate.
- It does not render on the server. Use [`@tuvix.js/server`](/packages/server) and the adapters' `./server` entries.
- It does not share dependencies between apps. Use [`@tuvix.js/module-federation`](/packages/module-federation) or import maps.
- It does not emit the DOM lifecycle events (`tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`) itself. Modules from `defineMicroApp` and the framework adapters emit them; a hand-written `MicroAppModule` emits none unless it calls `emitLifecycle` from `@tuvix.js/loader`.
- It does not keep an app alive when it unmounts. State inside the app is gone unless the app stores it elsewhere.

## Migrating from 0.4

Breaking changes in 0.5.0:

- **Shared event bus.** The orchestrator's bus is `getGlobalBus()` unless you pass `eventBus`. In 0.4 every orchestrator created its own bus. `destroy()` now leaves the global bus alive.

  ```ts
  import { createOrchestrator } from '@tuvix.js/core';

  // 0.5: keep a private bus as in 0.4
  const orchestrator = createOrchestrator({ eventBus: {} });
  ```

- **Manual apps stay mounted.** Reconciles no longer unmount apps that have neither `activeWhen` nor a router route, or `mountWhenVisible` apps. In 0.4 the next route change unmounted a manually mounted app. Call `unmountApp(name)` where you relied on that.
- **`sandbox: true` uses a shadow root.** Page CSS no longer reaches the app, and the entry's `styles` no longer reach the page. Remove `sandbox` or set `{ css: false }` to keep 0.4 rendering.
- **`prefetch: { strategy: 'hover' }`** prefetches only the apps a hovered or focused link activates. In 0.4 the first mouse movement anywhere prefetched every app.
- **`activeWhen` uses `matchPath`.** A query string or hash no longer unmounts an app, `:param` segments work, and characters such as `.` and `(` match literally.
- **`shared` is gone.** `OrchestratorConfig.shared` was never read and is removed from the type. Delete it; share dependencies with [`@tuvix.js/module-federation`](/packages/module-federation) or import maps.
- **Router `routes` match in full.** A `{ path: '/', app: 'home' }` route activates on `/` only. Use `'/*'` for an app that shows on every path, or `activeWhen: '/'`, which keeps prefix matching. `RouteConfig.exact` is removed; drop it.
- **`APP_ERROR` payload.** It now carries `phase` and fires for update and unmount failures too. Handlers that assumed a mount failure should check `phase`.

The 0.4 workaround for external routers can go:

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();

// 0.4:
// router.subscribe('onResolved', () => setTimeout(() => orchestrator.reconcile(location.pathname)));

// 0.5:
orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
```

Earlier versions of this page described methods and options that `Orchestrator` does not have. Use the real names:

| Old page | Real API |
| --- | --- |
| `createOrchestrator({ container })` | `container` belongs to each app in `register()` |
| `register(name, options)` | `register({ name, entry, container, ... })` |
| `mount(name, props)` | `updateAppProps(name, props)` then `mountApp(name)` |
| `unmount(name)` | `unmountApp(name)` |
| `update(name, props)` | `updateAppProps(name, props)` |
| `stop()` | `destroy()` |
| `onBeforeMount`, `onAfterMount` | `onStatusChange(name, status)` or `OrchestratorEvent.APP_MOUNT` |
| `sandbox: { js: true }` | `JsSandbox` from `@tuvix.js/sandbox` |

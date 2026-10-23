---
title: 'tuvix.js'
---

<PackageHeader
  name="tuvix.js"
  title="tuvix.js (Umbrella)"
  description="One package, one import path. Re-exports the orchestrator from @tuvix.js/core plus the public APIs of @tuvix.js/router, @tuvix.js/event-bus, @tuvix.js/loader and @tuvix.js/sandbox."
  icon="🎁"
  github="tuvix"
/>

## Installation

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

Installing `tuvix.js` installs `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` and `@tuvix.js/sandbox`. All six packages ship ES module and CommonJS builds and declare `"sideEffects": false`.

## When to use it

Install `tuvix.js` in a shell application that uses the orchestrator together with the router, the event bus or the sandbox. You get one dependency to version and one import path, and your bundler drops the exports you never import.

Install the scoped packages instead when:

- A micro app only talks to the shell. `@tuvix.js/event-bus` alone gives it `getGlobalBus()`, without pulling the orchestrator into its `node_modules`.
- You need an export the umbrella leaves out, such as `registerModule` or `emitLifecycle` from `@tuvix.js/loader`, or `pathToRegex` from `@tuvix.js/router`. See [Not included](#not-included).
- You want your `package.json` to state which parts of Tuvix.js a package depends on.

Mixing both is safe. The umbrella re-exports the same modules, so `getGlobalBus` from `tuvix.js` and from `@tuvix.js/event-bus` return the same bus, and the lifecycle helpers share one registry on `window`.

## Quick start

A shell that mounts `about` on `/about`, turns link clicks into router navigations and logs app errors:

```ts
import { createOrchestrator, getGlobalBus, interceptLinks, OrchestratorEvent, type AppErrorEvent } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

orchestrator.register({
  name: 'about',
  entry: 'https://cdn.example.com/about/main.js',
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

The `about` app, built to `https://cdn.example.com/about/main.js`:

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Clicking `<a href="/about?ref=nav">` pushes `/about?ref=nav`, and the orchestrator mounts `about` into `#main` (the query string does not affect matching).

## API

Every export below is a re-export. The linked package page documents its signature, options and edge cases.

### From `@tuvix.js/core`

Docs: [`@tuvix.js/core`](/packages/core).

| Export | Kind | What it does |
| --- | --- | --- |
| `createOrchestrator` | function | Creates an `Orchestrator`. |
| `Orchestrator` | class | Registers apps, reconciles them against the URL, follows a router (`connectRouter`), updates props, destroys. |
| `defineMicroApp` | function | Validates a `{ name, bootstrap?, mount, unmount, update?, ssr? }` object, registers it for the loader and makes it emit `tuvix:mounted` / `tuvix:unmounted` / `tuvix:error`. |
| `OrchestratorEvent` | enum | Event names the orchestrator emits on its bus (`tuvix:app:mount`, `tuvix:app:error`, ...). |
| `OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition` | type | Arguments of `createOrchestrator`, `register` and `defineMicroApp`. |
| `AppStatus`, `AppSandboxOption`, `RouterSource`, `RegisteredApp` | type | App status union, the `sandbox` option, the `connectRouter` argument, the app record shape. |
| `AppErrorEvent`, `AppErrorPhase` | type | `APP_ERROR` payload `{ name, error, phase }` and its phase union (`'load'`, `'bootstrap'`, `'mount'`, `'update'`, `'unmount'`). |

### From `@tuvix.js/event-bus`

Docs: [`@tuvix.js/event-bus`](/packages/event-bus).

| Export | Kind | What it does |
| --- | --- | --- |
| `EventBus` | class | Pub/sub bus with `on`, `once`, `emit`, `off`, `onAny`. |
| `createEventBus` | function | Creates a new, separate `EventBus`. |
| `getGlobalBus` | function | Returns the page-wide bus stored on `window.__TUVIX_GLOBAL_BUS__`. The orchestrator uses it by default. |
| `resetGlobalBus` | function | Destroys the page-wide bus; the next `getGlobalBus()` creates a new one. |
| `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` | type | Bus interface, handler signatures, unsubscribe function, constructor options. |

### From `@tuvix.js/router`

Docs: [`@tuvix.js/router`](/packages/router).

| Export | Kind | What it does |
| --- | --- | --- |
| `Router` | class | History or hash router that maps paths to app names. |
| `createRouter` | function | Creates a `Router`. |
| `matchPath` | function | Matches a path against a pattern (`:param`, `/*`, query and hash ignored). `activeWhen` strings use it. |
| `matchRoute` | function | Returns the first route in a `RouteConfig[]` that matches a path in full, with `params` and `query`. |
| `normalizePath` | function | Adds a leading slash and removes a trailing one. |
| `interceptLinks` | function | Turns same-origin link clicks into a `navigate(path)` call, with optional intent prefetch. |
| `resolveLink` | function | Returns `{ anchor, url, path }` for the HTML link an event happened on, or `null` when the browser should handle it. |
| `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute` | type | Router interface, options and route shapes. |
| `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler` | type | Navigation payload, guard and listener signatures. |
| `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` | type | `matchPath` result and options, `interceptLinks` options, `resolveLink` result and options. |

### From `@tuvix.js/loader`

Docs: [`@tuvix.js/loader`](/packages/loader).

| Export | Kind | What it does |
| --- | --- | --- |
| `ModuleLoader` | class | Loads an entry (URL, script/style config or loader function) with timeout, retries and caching. |
| `createLoader` | function | Creates a `ModuleLoader`. |
| `whenMounted` | function | Resolves when an app emits its `mounted` lifecycle event. |
| `onLifecycle` | function | Listens for `tuvix:mounted`, `tuvix:unmounted` or `tuvix:error` DOM events. |
| `isMounted` | function | `true` while any container of the app is mounted, according to the lifecycle events. |
| `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext` | type | Entry formats and the lifecycle contract a micro app implements. |
| `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy` | type | Loader options and results. |
| `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` | type | Lifecycle event names, payload and DOM event type. |

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

const off = onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer', { signal: AbortSignal.timeout(5000) });
console.log(container.id, hydrated);
off();
```

### From `@tuvix.js/sandbox`

Docs: [`@tuvix.js/sandbox`](/packages/sandbox).

| Export | Kind | What it does |
| --- | --- | --- |
| `CssSandbox` | class | Moves a container into a shadow root and loads stylesheets inside it. The orchestrator uses it for `sandbox: true`. |
| `JsSandbox` | class | Proxy `window` that keeps globals a script writes away from the real `window`. |
| `Sandbox` | class | `CssSandbox` and `JsSandbox` behind one `activate` / `deactivate` pair. |
| `createSandbox` | function | Creates a `Sandbox`. |
| `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox` | type | Options and interfaces of the sandboxes. |
| `AdoptStylesOptions`, `AdoptedStyles` | type | Argument and return value of `CssSandbox.adoptStyles`. |

### Not included

The umbrella leaves these out. Install the package that provides them.

| You need | Install |
| --- | --- |
| `registerModule`, `unregisterModule`, `getRegisteredModule`, `emitLifecycle`, `hasServerMarkup`, `normalizeEntry`, `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource`, and the types `EntryLoader`, `EntryLoaderContext`, `MicroAppBus`, `ScriptType`, `CacheEntry`, `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions` | [`@tuvix.js/loader`](/packages/loader) |
| `pathToRegex`, `parseQuery`, `isPathActive` | [`@tuvix.js/router`](/packages/router) |
| React, Vue, Svelte or Angular micro apps | [`@tuvix.js/react`](/packages/react), [`@tuvix.js/vue`](/packages/vue), [`@tuvix.js/svelte`](/packages/svelte), [`@tuvix.js/angular`](/packages/angular) |
| Server-side composition | [`@tuvix.js/server`](/packages/server) |
| Module Federation remotes | [`@tuvix.js/module-federation`](/packages/module-federation) |
| Island assets in Vite builds | [`@tuvix.js/vite`](/packages/vite) |
| The DevTools panel | [`@tuvix.js/devtools`](/packages/devtools) |
| Project scaffolding | [`create-tuvix-app`](/packages/create-tuvix-app) |

## Edge cases

- `tuvix.js` has one entry point. Subpath imports such as `tuvix.js/core` or `tuvix.js/router` fail to resolve; import from `tuvix.js` or from the scoped package.
- The umbrella pins its dependencies to the same release. Installing `tuvix.js` next to a different version of a scoped package gives you two copies of that package. `getGlobalBus()` and the lifecycle registry still share state through `window`, but `instanceof Orchestrator` or `instanceof EventBus` checks fail across the copies.
- `whenMounted`, `onLifecycle` and `isMounted` react to `tuvix:*` DOM events. Modules from `defineMicroApp` and the framework adapters emit them; a hand-written module emits none unless it calls `emitLifecycle` from `@tuvix.js/loader`. Events for a container outside the document are dispatched on `document`.
- `resetGlobalBus()` destroys the bus a running orchestrator holds. The orchestrator keeps that destroyed bus, so its events no longer reach subscribers of the next `getGlobalBus()`. Call it between tests, after `orchestrator.destroy()`.
- Behaviour changes and breaking changes in `@tuvix.js/core` and `@tuvix.js/router` apply here unchanged. See [Migrating from 0.4](/packages/core#migrating-from-0-4).

## What it does not do

- It adds no code of its own. Every export comes from one of the five scoped packages.
- It does not include the framework adapters, the server package, Module Federation, Vite or DevTools.
- It does not offer subpath entries per package.

# tuvix.js

> One package for the Tuvix.js orchestrator, router, event bus, loader and sandbox.

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

Full documentation: [tuvix.js.org/packages/tuvix](https://tuvix.js.org/packages/tuvix)

## Installation

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

This installs `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` and `@tuvix.js/sandbox`. Every package declares `"sideEffects": false`, so your bundler drops the exports you never import.

## When to use it

Use `tuvix.js` in a shell that combines the orchestrator with the router, the bus or the sandbox. Install a scoped package instead when a micro app needs only one piece (for example `@tuvix.js/event-bus` for `getGlobalBus()`), or when you need an export the umbrella leaves out (see below). Both can live in one project: `getGlobalBus()` and the lifecycle registry share state through `window`.

## Quick start

```ts
import { createOrchestrator, defineMicroApp, interceptLinks } from 'tuvix.js';

// Normally this lives in the remote app's bundle.
defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});

const orchestrator = createOrchestrator({ router: { routes: [] } });
orchestrator.register({
  name: 'about',
  entry: { scripts: [] },
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

## API

Every export is a re-export.

| Source | Runtime exports | Types |
| --- | --- | --- |
| [`@tuvix.js/core`](https://tuvix.js.org/packages/core) | `Orchestrator`, `createOrchestrator`, `defineMicroApp`, `OrchestratorEvent` | `AppStatus`, `AppErrorEvent`, `AppErrorPhase`, `AppSandboxOption`, `MicroAppConfig`, `RegisteredApp`, `RouterSource`, `OrchestratorConfig`, `MicroAppDefinition` |
| [`@tuvix.js/event-bus`](https://tuvix.js.org/packages/event-bus) | `EventBus`, `createEventBus`, `getGlobalBus`, `resetGlobalBus` | `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` |
| [`@tuvix.js/router`](https://tuvix.js.org/packages/router) | `Router`, `createRouter`, `matchPath`, `matchRoute`, `normalizePath`, `interceptLinks`, `resolveLink` | `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute`, `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` |
| [`@tuvix.js/loader`](https://tuvix.js.org/packages/loader) | `ModuleLoader`, `createLoader`, `whenMounted`, `onLifecycle`, `isMounted` | `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext`, `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` |
| [`@tuvix.js/sandbox`](https://tuvix.js.org/packages/sandbox) | `Sandbox`, `CssSandbox`, `JsSandbox`, `createSandbox` | `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles` |

Not included: `registerModule`, `emitLifecycle`, `hasServerMarkup`, the script helpers and `EntryLoader` / `MicroAppBus` types (install `@tuvix.js/loader`); `pathToRegex`, `parseQuery`, `isPathActive` (install `@tuvix.js/router`); the framework adapters, `@tuvix.js/server`, `@tuvix.js/module-federation`, `@tuvix.js/vite` and `@tuvix.js/devtools`.

## Edge cases

- There is one entry point. `tuvix.js/core` and other subpaths do not resolve.
- A scoped package at a different version than the umbrella's gives you two copies. Shared state on `window` still works; `instanceof` checks across copies fail.
- `whenMounted`, `onLifecycle` and `isMounted` see `tuvix:*` DOM events, which `defineMicroApp` modules and the framework adapters emit. `isMounted(name)` stays `true` while any container of the app is mounted.
- `resetGlobalBus()` destroys the bus a running orchestrator holds. Call it after `destroy()`.
- Breaking changes in `@tuvix.js/core` and `@tuvix.js/router` 0.5.0 apply here too.

## What it does not do

- It adds no code of its own.
- It does not include adapters, server rendering, Module Federation, Vite or DevTools.

## License

MIT

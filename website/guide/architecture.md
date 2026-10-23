# Architecture

Tuvix.js splits into small packages. The orchestrator in `@tuvix.js/core` ties them together; every other package also works on its own.

## Packages and their jobs

```text
@tuvix.js/core          createOrchestrator, defineMicroApp: registry, reconcile, props
@tuvix.js/router        createRouter, matchPath, interceptLinks
@tuvix.js/loader        ModuleLoader, registerModule, lifecycle runtime
@tuvix.js/event-bus     createEventBus, getGlobalBus
@tuvix.js/sandbox       CssSandbox (shadow DOM), JsSandbox (proxy window)
@tuvix.js/react         createReactMicroApp, TuvixReactApp, TuvixIsland
@tuvix.js/vue           createVueMicroApp, renderVueToString (/server)
@tuvix.js/svelte        createSvelteMicroApp, renderSvelteToString (/server)
@tuvix.js/angular       createAngularMicroApp, renderAngularToString (/server)
@tuvix.js/vite          Vite plugin: island CSS links for the server-rendered <head>
@tuvix.js/server        Server-side composition of HTML fragments
@tuvix.js/module-federation  Entries backed by webpack remotes
@tuvix.js/devtools      In-page debug panel
tuvix.js                Umbrella: core, router, loader, event bus, sandbox
create-tuvix-app        Project scaffolding
```

## From navigation to mount

```text
URL changes (router.push, popstate, connectRouter callback, or reconcile(path))
  │
  ▼
orchestrator queues a reconcile for the path
  │  (only the newest queued path runs next)
  ▼
for each app: should it be mounted?  activeWhen string → matchPath
  │                                   activeWhen function → your code
  │                                   no activeWhen → router routes naming it
  ▼
phase 1: unmount every app that turned inactive
phase 2: mount every app that turned active
  │
  ▼
loader.load(name, entry)   function entry → await it
  │                        URL entry → <script>/<link> tags, then registry lookup
  ▼
module.bootstrap()  (first load only)
module.mount({ container, props, name, bus })
```

Phase 1 finishes before phase 2 starts, so two apps that share `#app` never sit in it at the same time. If a new path arrives while a reconcile runs, the orchestrator finishes the current step and then reconciles the newest path. Navigating A → B → A in quick succession leaves only A mounted.

## The module contract

Every micro app, hand-written or produced by an adapter, has this shape (`MicroAppModule` from `@tuvix.js/loader`):

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  async bootstrap() {
    // once, before the first mount
  },
  async mount({ container, props, name, bus }) {
    container.textContent = `${name ?? ''}: ${JSON.stringify(props ?? {})}`;
    bus?.emit('app:ready', { name });
  },
  async update({ props, container }) {
    if (container) container.textContent = JSON.stringify(props);
  },
  async unmount({ container }) {
    container.replaceChildren();
  },
};
```

- `bootstrap` runs once per loaded module.
- `mount` receives the container, the current props, the app name and the orchestrator's event bus.
- `update` receives merged props when the shell calls `updateAppProps`. `container` tells a module mounted in several places which mount to update.
- `unmount` must remove everything `mount` created.

## How the loader finds a module

1. **Loader function entry** (`() => import('./app')`): the loader uses the resolved module, else its `default` export, else the module registered under the app name.
2. **URL entry**: the loader appends `<script>` and `<link>` tags, waits for them, and reads the module from the registry that `registerModule(name, module)` fills. Adapters and `defineMicroApp` call `registerModule` for you.
3. **UMD fallback**: if nothing registered, the loader picks a new `window` global that has a `mount` function. When several appeared, it picks the one whose name matches the app name and fails otherwise.

The registry and lifecycle state live on `window.__TUVIX_RUNTIME__`, so micro apps bundled separately, each with its own copy of `@tuvix.js/loader`, still see one registry.

Scripts load as `type="module"` when the entry sets `type: 'module'` or the URL ends in `.mjs`, `.mts`, `.ts`, `.tsx` or `.jsx`. Other URLs load as classic scripts.

## Shared runtime state

| State | Where it lives | Why |
| --- | --- | --- |
| Module registry | `window.__TUVIX_RUNTIME__` (also `window.__TUVIX_MODULES__`) | The loader finds apps from any bundle |
| Mounted apps and waiters | `window.__TUVIX_RUNTIME__` | `whenMounted` works across bundles |
| Global event bus | `window.__TUVIX_GLOBAL_BUS__` | `getGlobalBus()` returns one bus per page |

On the server, without `window`, each of these is module-scoped.

## Isolation model

- **CSS**: `sandbox: true` on `register` renders the app inside a shadow root and loads its entry `styles` there. See [Sandboxing](/guide/sandbox).
- **JavaScript**: none by default. All apps share `window`, `document` and globals. `JsSandbox` isolates only code you run through its proxy.

## Where to look next

- [Lifecycle Hooks](/guide/lifecycle): the contract in detail.
- [Lifecycle Events](/guide/lifecycle-events): find out when an app is on the page.
- [Routing](/guide/routing): pattern rules.

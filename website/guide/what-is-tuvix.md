# What is Tuvix.js?

Tuvix.js is a microfrontend toolkit for the browser. A host page (the shell) registers micro apps, and Tuvix.js loads each app's code, mounts it into a container, passes it props, and unmounts it when the URL or your code says so. Each micro app can use React, Vue, Svelte, Angular or no framework, and each team can build and deploy its app on its own schedule.

## What it does

- **Orchestrates micro apps.** `createOrchestrator()` keeps a registry of apps. For each one it decides, from the current path, whether the app should be mounted, and it runs one reconcile at a time so two apps that share a container never overlap.
- **Loads code on demand.** An app's `entry` can be a script URL, a list of scripts and stylesheets, or a function such as `() => import('./dashboard')`. The loader retries failed loads and aborts slow ones.
- **Routes by URL.** `activeWhen: '/dashboard/*'` mounts an app on `/dashboard` and every path below it. You can use the built-in router or follow TanStack Router or React Router with `connectRouter()`.
- **Adapts frameworks.** `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp` and `createAngularMicroApp` turn a root component into a module with `mount`, `update` and `unmount`.
- **Hosts islands in a React page.** `TuvixIsland` mounts a Vue, Svelte, Angular or React micro app inside a server-rendered React tree and hydrates the server HTML without sending it twice. See [SSR Islands](/guide/ssr-islands).
- **Reports lifecycle.** Adapters and `defineMicroApp` dispatch `tuvix:mounted`, `tuvix:unmounted` and `tuvix:error` DOM events, and `whenMounted(name)` resolves once an app is on the page. See [Lifecycle Events](/guide/lifecycle-events).
- **Connects apps.** All apps on a page share one event bus through `getGlobalBus()`, even when each app bundles its own copy of `@tuvix.js/event-bus`.
- **Isolates CSS on request.** `sandbox: true` renders an app inside a shadow root, so page CSS and the app's CSS stay apart.

## When to use it

Reach for Tuvix.js when several teams ship parts of one page and need to deploy them separately, or when you want to keep a legacy app running next to a rewrite in another framework. It also fits a single team that wants Vue or Svelte widgets inside a React site with server rendering.

## When not to use it

- One team, one framework, one deploy: a regular single-page app is simpler.
- You need hard security isolation between apps. Tuvix.js runs every app in the same JavaScript realm. `JsSandbox` from `@tuvix.js/sandbox` hides global writes made through its proxy, but it does not stop an app from reaching `window`. Use an `<iframe>` for untrusted code.
- You want one bundle with shared state across every app. Micro apps communicate through events and props, by design.

## Packages

| Package | Use it for |
| --- | --- |
| `tuvix.js` | One install with core, router, event bus, loader and sandbox |
| `@tuvix.js/core` | `createOrchestrator`, `defineMicroApp` |
| `@tuvix.js/router` | `createRouter`, `matchPath`, `interceptLinks` |
| `@tuvix.js/loader` | Entry loading and the lifecycle runtime (`whenMounted`, `onLifecycle`) |
| `@tuvix.js/event-bus` | `createEventBus`, `getGlobalBus` |
| `@tuvix.js/sandbox` | `CssSandbox`, `JsSandbox` |
| `@tuvix.js/react`, `vue`, `svelte`, `angular` | Framework adapters, `TuvixIsland` (React) |
| `@tuvix.js/vite` | Island stylesheet links for server-rendered `<head>` |
| `@tuvix.js/server` | Server-side composition of HTML fragments |
| `@tuvix.js/module-federation` | Entries that load from webpack Module Federation remotes |
| `@tuvix.js/devtools` | In-page debug panel |
| `create-tuvix-app` | Project scaffolding |

## Key concepts

| Term | Meaning |
| --- | --- |
| Shell | The host page that creates the orchestrator and owns the layout |
| Micro app | A module with `mount` and `unmount` (and optional `bootstrap`, `update`) |
| Entry | Where the loader gets a micro app: URL, `{ scripts, styles }`, or a loader function |
| Container | The element a micro app renders into |
| Island | A micro app the host server-renders and the client hydrates in place |
| Event bus | A pub/sub channel every app on the page shares |

## Next steps

- [Getting Started](/guide/getting-started) builds a shell and two micro apps.
- [Architecture](/guide/architecture) shows how a navigation turns into a mount.
- Coming from 0.4? Read [Migrating to 0.5](/guide/migration-0-5).

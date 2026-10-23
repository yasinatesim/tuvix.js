---
"@tuvix.js/react": minor
---

Add `TuvixIsland`, give `createReactMicroApp` one root per container, and isolate `TuvixReactApp` errors.

- New `TuvixIsland` hosts any micro app module (Vue, Svelte, Angular, React or a plain `{ mount, unmount, update? }` object) inside a React tree. On the server it renders `<div data-tuvix-app={name}>` with `ssrHtml` inside. During hydration it reads that HTML back from the page, so you can drop `ssrHtml` from client props. It creates the `{ __html }` object once, so a parent re-render never rewrites the island's DOM or drops the listeners the module attached. A shallow props change calls `app.update({ props, container })`, or unmounts and mounts again when the module has no `update`. A new `name` or `app` remounts, and removal calls `app.unmount`. If `mount` or `update` rejects, the island renders `fallback` and drops its server HTML, so a different `app` or `name` passed later mounts into an empty element. Under `<StrictMode>` the module mounts once and adopts the server markup.
- `createReactMicroApp` keeps one React root per container, so one module can mount into several containers. `update({ props, container })` re-renders one container; without `container` it re-renders all of them and keeps component state. An `unmount` that arrives while `mount` is still loading `react-dom/client` waits for it and leaves an empty container.
- `mount` resolves after React commits the first render. It dispatches `tuvix:mounted` with `hydrated`, and `unmount` dispatches `tuvix:unmounted`. The module registers through `registerModule` from `@tuvix.js/loader`.
- An error boundary wraps the app. A throw during the first render rejects `mount`, clears the container and dispatches `tuvix:error`. A throw after that blanks the app and dispatches `tuvix:error`; the host page keeps running.
- With `ssr: true`, a container holding only whitespace or comments renders fresh instead of hydrating.
- `createReactMicroApp` and `createSsrReactMicroApp` are generic over the component's props, so `App` may have required props such as `{ page: 'privacy' | 'terms' }`.
- `TuvixReactApp` takes `fallback`. It wraps `App` in `<Suspense fallback>`, so a server render error replaces only that app and React retries it on the client. On the client an error boundary shows `fallback` and dispatches `tuvix:error`, including when `App` throws on its first render. It dispatches `tuvix:mounted` (with `hydrated: true` when it hydrated server HTML) and `tuvix:unmounted`.
- `createSsrReactMicroApp` renders the same Suspense tree as `TuvixReactApp`, so it can hydrate markup `TuvixReactApp` rendered without a mismatch.

Breaking:

- `TuvixReactApp` server HTML now has Suspense comment markers (`<!--$-->…<!--/$-->`) inside the wrapper div. Hydrate it with this version of `@tuvix.js/react` on both sides.
- `mount` rejects when the first render throws. Before, the error escaped to React's root error handler and `mount` resolved.
- `unmount` on a container this module never mounted does nothing. Before, it cleared the container.
- `mount` on a container the module already holds unmounts the old root (dispatching `tuvix:unmounted`) and renders fresh, as the Vue, Svelte and Angular adapters do. In 0.4 it called `createRoot` on the same container again and left the first root orphaned. Call `update` to change props and keep component state.

# @tuvix.js/react

## 0.5.0

### Minor Changes

- cfeba90: Add `TuvixIsland`, give `createReactMicroApp` one root per container, and isolate `TuvixReactApp` errors.

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

### Patch Changes

- c131086: Fix `require()` for five packages and give every package the same `dist/` layout.

  In 0.4, `tuvix.js`, `@tuvix.js/core`, `@tuvix.js/event-bus`, `@tuvix.js/loader` and `@tuvix.js/router` pointed `main` and `exports.require` at `dist/index.cjs` and `dist/index.d.cts`, but the build wrote `dist/index.js` and `dist/index.d.ts`. `require('@tuvix.js/core')` threw `Cannot find module`, and TypeScript projects using CommonJS resolution got no types.

  Every package now ships the same layout:

  - `dist/<entry>.cjs` with `dist/<entry>.d.ts` for `require`
  - `dist/<entry>.mjs` with `dist/<entry>.d.mts` for `import`

  `@tuvix.js/vue`, `@tuvix.js/svelte` and `@tuvix.js/angular` use the same layout for their `./server` entry and add `typesVersions`, so TypeScript with `moduleResolution: "node"` finds `@tuvix.js/<adapter>/server` types. Each package also exports `./package.json`.

- Updated dependencies [5d40f9c]
- Updated dependencies [5d40f9c]
- Updated dependencies [1ec8e77]
- Updated dependencies [1ec8e77]
- Updated dependencies [c131086]
  - @tuvix.js/event-bus@0.5.0
  - @tuvix.js/loader@0.5.0

## 0.4.2

### Patch Changes

- b5a7081: Fix bugs, add missing READMEs to npm, and apply code review improvements
  - core: catch errors in updateAppProps to prevent stuck 'updating' state; exclude 'error' apps from viewport remount loop; add ensureAlive() guard to unmountApp()
  - angular: initialize **TUVIX_ANGULAR_PROPS** before writing (was always falsy, causing silent prop update drops)
  - svelte: warn instead of silent no-op when Svelte 5 $set() is missing
  - sandbox: fix CssSandbox.unwrap() to restore app content nodes (not just discard styles); add reset() to IJsSandbox interface; fix README Quick Start example (wrong API)
  - loader: remove unused createDeferred dead export
  - devtools: wire up autoOpen option (was declared but never read)
  - vue: wire up autoOpen option (was declared but never read)
  - react: : sanitize example name before tar filter to prevent path traversal
  - create-tuvix-app: sanitize example name before tar filter to prevent path traversal
  - event-bus, module-federation, router, server: publish with README (packages were previously published without one)

- Updated dependencies [b5a7081]
  - @tuvix.js/loader@0.4.2
  - @tuvix.js/event-bus@0.4.2

## 0.4.0

### Minor Changes

- 8cf0482: ## SSR Multi-Framework Support + TuvixReactApp Rename

  ### `@tuvix.js/react`
  - **Renamed** `TuvixApp` → `TuvixReactApp` for naming consistency
  - `TuvixApp` kept as `@deprecated` alias — backward compatible, removed in next major
  - **New** `TuvixSvelteApp` — React host wrapper for Svelte micro apps. Renders `ssrHtml` into a `data-tuvix-app` container; orchestrator hydrates via `createSsrSvelteMicroApp`
  - **New** `TuvixVueApp` — React host wrapper for Vue 3 micro apps
  - **New** `TuvixAngularApp` — React host wrapper for Angular micro apps

  ### `@tuvix.js/svelte` — SSR Support
  - **New** `renderSvelteToString(App, props?)` — server-side render a Svelte component to HTML string. Supports Svelte 5 (`svelte/server`) and Svelte 3/4 (`App.render()`)
  - **New** `createSsrSvelteMicroApp(config)` — orchestrator lifecycle module with hydration support. Uses `hydrate: true` when SSR content is already in the container

  ### `@tuvix.js/vue` — SSR Support
  - **New** `renderVueToString(App, props?, plugins?)` — server-side render a Vue 3 component using `@vue/server-renderer`
  - **New** `createSsrVueMicroApp(config)` — orchestrator lifecycle using `createSSRApp` for automatic Vue hydration

  ### `@tuvix.js/angular` — SSR Support (Angular 17+ Standalone)
  - **New** `renderAngularToString(component, options?)` — server-side render a standalone Angular component via `@angular/platform-server`
  - **New** `createSsrAngularMicroApp(config)` — orchestrator lifecycle with `provideClientHydration()` support
  - `createAngularMicroApp` (NgModule) kept as legacy, not removed

  ### Architecture

  Each framework package (`@tuvix.js/svelte`, `@tuvix.js/vue`, `@tuvix.js/angular`) has zero React dependency.
  React host wrappers (`TuvixSvelteApp`, `TuvixVueApp`, `TuvixAngularApp`) live in `@tuvix.js/react`.
  Angular/Vue/Svelte host wrappers will be added to their respective packages in a future release.

  ### Usage Pattern (React host — TanStack Start, Next.js, Remix)

  ```tsx
  // routes/iletisim.tsx
  export const Route = createFileRoute('/contact')({
    loader: async () => {
      const { renderVueToString } = await import('@tuvix.js/vue');
      const { default: App } = await import('~/micro-apps/contact/App.vue');
      return { ssrHtml: await renderVueToString(App) };
    },
    component: function () {
      const { ssrHtml } = Route.useLoaderData();
      return <TuvixVueApp name="contact-app" ssrHtml={ssrHtml} />;
    },
  });
  ```

## 0.3.1

### Patch Changes

- 53189df: Fix `TuvixReactApp` return type for React 19 JSX strict mode compatibility

  Changed return type from `ReactNode` to `ReactElement<any>` so `TuvixReactApp`
  can be used as a JSX component in projects with React 19 strict TypeScript
  settings (e.g. TanStack Start, Next.js 15+).

  Previously, using `<TuvixReactApp ... />` in these projects caused:

  ```
  error TS2786: 'TuvixReactApp' cannot be used as a JSX component.
    Type '...ReactNode' is not assignable to type 'ReactNode | Promise<ReactNode>'.
  ```

## 0.3.0

### Minor Changes

- e46a26e: Add SSR hydration support and `TuvixReactApp` component

  **New exports:**
  - `TuvixReactApp` — A React component that renders a React micro app inline. Use this in SSR frameworks (TanStack Start, Next.js, Remix) so micro app content is server-rendered and SEO-indexed. The orchestrator can later hydrate the rendered HTML when the IIFE bundle loads.
  - `createSsrReactMicroApp` — Convenience wrapper around `createReactMicroApp` with `ssr: true`. Uses `hydrateRoot()` instead of `createRoot()` when the container already contains server-rendered HTML.

  **Updated API:**
  - `ReactMicroAppConfig.ssr?: boolean` — When `true`, `mount()` detects existing SSR content in the container and uses `hydrateRoot()` for hydration instead of replacing it with `createRoot()`.

  **Usage with TanStack Start:**

  ```tsx
  // src/routes/github.tsx
  import { TuvixReactApp } from '@tuvix.js/react';
  import { GithubPage } from '~/micro-apps/github/App';

  export const Route = createFileRoute('/github')({
    head: () => ({ meta: [...seo({ title: 'GitHub' })] }),
    component: () => <TuvixReactApp name="github-app" App={GithubPage} />,
  });
  ```

  ```ts
  // src/micro-apps/github/index.ts — uses hydrateRoot when SSR content present
  export default createSsrReactMicroApp({ name: 'github-app', App });
  ```

## 0.1.2

### Patch Changes

- fix: provide NODE_AUTH_TOKEN to CI pipeline
- Updated dependencies
  - @tuvix.js/event-bus@0.1.2
  - @tuvix.js/loader@0.1.2

## 0.1.1

### Patch Changes

- fix: bump versions to trigger CI release flow
- Updated dependencies
  - @tuvix.js/event-bus@0.1.1
  - @tuvix.js/loader@0.1.1

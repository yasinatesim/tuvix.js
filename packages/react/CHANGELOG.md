# @tuvix.js/react

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
  export const Route = createFileRoute('/iletisim')({
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

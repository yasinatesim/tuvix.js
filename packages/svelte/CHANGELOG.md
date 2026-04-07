# @tuvix.js/svelte

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

## 0.4.1

### Patch Changes

- 5e47175: ## Fix: `svelte/server` CJS static resolution & Svelte 4 hydration

  ### `renderSvelteToString` — CJS build fix

  `dist/server.js` contained `await import('svelte/server')` as a literal string.
  Vite/Rollup's `@rollup/plugin-commonjs` statically scans all `import()` literals in CJS
  files — even inside `try/catch` — and fails with `Missing "./server" specifier in "svelte" package`
  when Svelte 4 is installed (Svelte 4 has no `svelte/server` export).

  Fix: replaced with `new Function('m', 'return import(m)')` so the specifier is opaque
  to static analyzers. The Svelte 5 path works as before; Svelte 3/4 falls through to
  `App.render()` as intended. No stub file or consumer-side alias needed.

  ### Hydration note

  Svelte 4 consumers must compile components with `hydratable: true` (via the Svelte Vite
  plugin `compilerOptions`) for `new App({ hydrate: true })` to work at runtime.

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

## 0.1.2

### Patch Changes

- fix: provide NODE_AUTH_TOKEN to CI pipeline
- Updated dependencies
  - @tuvix.js/loader@0.1.2

## 0.1.1

### Patch Changes

- fix: bump versions to trigger CI release flow
- Updated dependencies
  - @tuvix.js/loader@0.1.1

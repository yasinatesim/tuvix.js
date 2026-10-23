# @tuvix.js/svelte

## 0.5.0

### Minor Changes

- a08ac5f: Svelte adapter: Svelte 5 support, reactive prop updates, per-container instances, lifecycle events, and server CSS.

  - The adapter imports `svelte` on first mount. If the module exports `mount`, it renders with Svelte 5 `mount()`, hydrates with `hydrate()` and tears down with `unmount()`. Otherwise it uses the Svelte 3/4 class API (`new App()`, `$set`, `$destroy`). Before, every Svelte 5 component failed in `createSvelteMicroApp` because the adapter called `new App()`, and `createSsrSvelteMicroApp` passed `hydrate: true` to `mount()`, which renders a second copy instead of hydrating. A `try/catch` also swallowed real Svelte 5 mount errors and retried with `new App()`.
  - `update({ props })` re-renders Svelte 5 components. By default it remounts: it unmounts the instance, mounts a new one with the new props and dispatches `tuvix:mounted` again. To update in place, pass `SvelteMap` from `svelte/reactivity` in the config (`createSvelteMicroApp({ name, App, SvelteMap })`); the component then reads props from a `SvelteMap`-backed object, so runes (`$props()`) and legacy `export let` components keep their DOM and state. The adapter does not import `svelte/reactivity` itself, so Svelte 3/4 apps still bundle. Before, Svelte 5 updates only logged a warning. Svelte 3/4 still use `$set`; props missing from the new object are now set to `undefined`.
  - One module can mount into several containers; each gets its own instance. `update` updates every mount, or only `context.container` when the caller passes one.
  - `createSvelteMicroApp` accepts `ssr: true`, and `createSsrSvelteMicroApp(config)` is `createSvelteMicroApp({ ...config, ssr: true })`. The adapter hydrates only when the container holds elements or non-whitespace text.
  - Mount dispatches `tuvix:mounted` (with `hydrated`) after `onMount` callbacks and effects ran, unmount dispatches `tuvix:unmounted`, and a failed mount dispatches `tuvix:error` and rejects. `unmount` called while `mount` is still loading waits for it, then destroys the instance.
  - The adapter registers through `registerModule` from `@tuvix.js/loader` instead of writing `window.__TUVIX_MODULES__` itself.
  - `renderSvelteToString(App, props, { render })` returns the component's `<style>` tags followed by its markup. Svelte 5 components emit CSS when compiled with `css: 'injected'`; Svelte 3/4 `css.code` is wrapped in a `<style>` tag. Pass `render` from `svelte/server` when your server bundle includes Svelte, so the renderer and the component share one Svelte copy.
  - New `renderSvelte(App, props, options)` returns `{ html, head, css }`, so you can put `<svelte:head>` content in the document head. New exported types: `SvelteProps`, `SvelteRenderResult`, `SvelteServerRender`, `RenderSvelteOptions`.

  Breaking:

  - `createSvelteMicroApp` without `ssr` clears the container before it renders. Before, Svelte 3/4 appended the component after any markup already in the container.
  - `unmount({ container })` on a container the module never mounted (or whose mount failed) does nothing, matching the React, Vue and Angular adapters. Before, it emptied the container.
  - `renderSvelteToString` no longer falls back to `App.render` when `svelte/server` fails to load. With `render` passed it uses Svelte 5; otherwise it takes the Svelte 5 path when `svelte` exports `mount` and calls `App.render` only for Svelte 3/4. Svelte 5 components compiled with `dev: true` carry an `App.render` stub that throws, so the old check broke Vite dev SSR. A Svelte 5 import or render error now reaches you.

### Patch Changes

- c131086: Fix `require()` for five packages and give every package the same `dist/` layout.

  In 0.4, `tuvix.js`, `@tuvix.js/core`, `@tuvix.js/event-bus`, `@tuvix.js/loader` and `@tuvix.js/router` pointed `main` and `exports.require` at `dist/index.cjs` and `dist/index.d.cts`, but the build wrote `dist/index.js` and `dist/index.d.ts`. `require('@tuvix.js/core')` threw `Cannot find module`, and TypeScript projects using CommonJS resolution got no types.

  Every package now ships the same layout:

  - `dist/<entry>.cjs` with `dist/<entry>.d.ts` for `require`
  - `dist/<entry>.mjs` with `dist/<entry>.d.mts` for `import`

  `@tuvix.js/vue`, `@tuvix.js/svelte` and `@tuvix.js/angular` use the same layout for their `./server` entry and add `typesVersions`, so TypeScript with `moduleResolution: "node"` finds `@tuvix.js/<adapter>/server` types. Each package also exports `./package.json`.

- Updated dependencies [1ec8e77]
- Updated dependencies [1ec8e77]
- Updated dependencies [c131086]
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

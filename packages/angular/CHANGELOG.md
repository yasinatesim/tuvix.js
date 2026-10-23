# @tuvix.js/angular

## 0.5.0

### Minor Changes

- a08ac5f: Angular adapter: zoneless by default, per-container apps, inputs from props, and server output with styles.

  - Apps run without zone.js by default. The adapter adds `provideZonelessChangeDetection()` on Angular 20+, `provideExperimentalZonelessChangeDetection()` on Angular 18-19, and replaces `NgZone` with `ɵNoopNgZone` on Angular 15-17. It never imports zone.js, so the global `Promise` stays untouched in the browser and in Node. Pass `zone: true` to keep zone-based change detection; your client entry must import `zone.js` first, or mount rejects.
  - Each mount calls `createApplication` and bootstraps the component into a host element inside its container. Two Angular apps on one page no longer collide on the first `app-root`, and one module can mount into several containers.
  - Props reach the component through `ComponentRef.setInput`. Mount sets them before the first change detection, so `ngOnInit` sees them. `update({ props })` writes the new values and runs change detection; pass `container` to update one mount. Keys that are not component inputs are skipped. Inputs missing from the new props reset to `undefined`.
  - When the component is JIT (no compiled `ɵcmp`), the adapter loads `@angular/compiler` before `@angular/platform-browser`. It only helps when the adapter is the first code to load an Angular package other than `@angular/core`. If your component files import `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` or another Angular library, those packages evaluate before the adapter runs and fail with "JIT compilation failed". Keep `import '@angular/compiler'` as the first line of your client entry, or build AOT.
  - `createSsrAngularMicroApp` renders into the host element from `renderAngularToString` and removes the inlined server `<style>` tags after Angular adds its own. The `mounted` event reports `hydrated: true`. This replaces the server DOM; it is not Angular's non-destructive hydration.
  - Mount dispatches `tuvix:mounted`, unmount dispatches `tuvix:unmounted`, and a failure dispatches `tuvix:error` and rejects. An unmount that arrives while mount is still loading Angular waits for it and leaves an empty container. The adapter registers through `registerModule` from `@tuvix.js/loader`.
  - `renderAngularToString` runs zoneless, returns the component `<style>` tags from the rendered `<head>` before the body markup, derives the host tag from the component selector, and applies `appId` as Angular's `APP_ID`. It does not wait for HTTP requests the component starts. Call it from a server function; in a browser it returns `''`.
  - `renderAngularToString` forwards the `BootstrapContext` that `renderApplication` passes on Angular 18.2.21+, 19.2.15+ and 20.3+. Without it, those versions throw NG0401 "Missing Platform".
  - `renderAngularToString(component, { props })` sets component inputs on the server before the first change detection, like the client `mount`, so `ngOnInit` sees them on both sides. Keys that are not inputs are skipped. Pass the same props to the server render and to `mount` and both render the same markup. Calls without `props` render as before.
  - If Angular throws while `unmount` destroys the app, the adapter still empties the container and dispatches `tuvix:unmounted` after `tuvix:error`, so `isMounted(name)` turns false. `unmount` then rejects with Angular's error.
  - Peer dependencies now list `@angular/platform-browser` (>=15), plus `@angular/compiler` (>=15) and `@angular/platform-server` (>=16) as optional peers.

  Breaking:

  - Behaviour change: apps run zoneless unless you pass `zone: true`. On Angular 15-17, DOM events no longer trigger change detection on their own; call `ChangeDetectorRef.detectChanges()` in handlers or opt into zone.js.
  - `createAngularMicroApp` takes `{ name, component, module?, providers?, selector?, zone?, ssr? }`. The `platform` and `compilerOptions` fields are gone. Pass the root component as `component` and the NgModule that declares it as `module`; the adapter imports the module's providers with `importProvidersFrom`.
  - `update()` no longer writes `window.__TUVIX_ANGULAR_PROPS__`. Declare component inputs instead.
  - `createSsrAngularMicroApp` no longer adds `provideClientHydration()`.
  - `unmount()` on a container this module never mounted does nothing. Before, it cleared the container.

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

## 0.4.3

### Patch Changes

- f37039b: fix(angular): initialize `__TUVIX_ANGULAR_PROPS__` in `createSsrAngularMicroApp.update()`

  `createSsrAngularMicroApp` had a conditional guard that silently dropped prop updates when the `__TUVIX_ANGULAR_PROPS__` global registry had not yet been initialized. The registry is now always initialized on first write (matching the behavior of `createAngularMicroApp`).

  Before this fix, calling `orchestrator.updateAppProps('my-app', { ... })` on an SSR Angular micro app would silently no-op if the registry was absent — props would never reach the Angular app.

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

## 0.2.0

### Minor Changes

- 1906b14: **BREAKING:** `platform` is now a required config parameter in `createAngularMicroApp`.

  Previously, the library dynamically imported `@angular/platform-browser-dynamic` at runtime, which caused version mismatch errors in pnpm workspaces (resolving Angular 21 instead of the consumer's Angular 16). Now the consumer must pass their own `platformBrowserDynamic` function.

  Also adds optional `selector` config to match the bootstrap component's CSS selector (defaults to `'app-root'`).

  Migration:

  ```ts
  import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

  createAngularMicroApp({
    name: 'my-app',
    module: AppModule,
    platform: platformBrowserDynamic, // NEW: required
    selector: 'app-root', // NEW: optional
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

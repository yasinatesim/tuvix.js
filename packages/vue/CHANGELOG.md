# @tuvix.js/vue

## 0.5.0

### Minor Changes

- cfeba90: Vue adapter: reactive props, per-container apps, lifecycle events and server-only rendering.

  - `update({ props })` now re-renders your component. The adapter keeps props in a `shallowReactive` object, passes them through a render function, and `inject('tuvixProps')` (or `inject(TUVIX_PROPS_KEY)`) returns that same object. Keys missing from the new props are removed.
  - One module can mount into several containers. Each container gets its own Vue app and props; `update` updates every mount, or only `context.container` when the caller passes one. Mounting into a container that already holds this app unmounts the old instance first.
  - `createVueMicroApp` accepts `ssr: true`. With it, the adapter hydrates server markup through `createSSRApp` and keeps the server DOM nodes. An empty container gets a `createApp` render, so Vue no longer warns about hydrating an empty container. `createSsrVueMicroApp(config)` is now `createVueMicroApp({ ...config, ssr: true })`.
  - Mount dispatches `tuvix:mounted` (with `hydrated`), unmount dispatches `tuvix:unmounted`, and a failure dispatches `tuvix:error` and rejects. Setup, render and hook errors reject in production builds as well; a plugin's `app.config.errorHandler` still runs. When a component throws during unmount, the adapter still clears the container and dispatches `tuvix:error` then `tuvix:unmounted` before rejecting, so `isMounted(name)` turns `false`.
  - The adapter registers through `registerModule` from `@tuvix.js/loader` instead of writing `window.__TUVIX_MODULES__` itself.
  - `plugins` entries can be `[plugin, ...options]` tuples, passed to `app.use(plugin, ...options)`.
  - `renderVueToString(App, props, plugins, ssrContext)` takes an optional `ssrContext`. Read `ssrContext.teleports` and `ssrContext.modules` after the promise resolves. The server output uses the same root wrapper as the client, so `inject('tuvixProps')` works during SSR.
  - JSDoc for `renderVueToString` now says to call it from a server function. In an isomorphic route loader the browser guard returns `''` and your bundler still ships the Vue server renderer to the client.

  Breaking:

  - `update()` no longer writes `app.config.globalProperties.$tuvixProps`. Read props from component props or `inject('tuvixProps')`.
  - `unmount()` on a container this module never mounted does nothing. Before, it cleared the container.
  - `VueSsrMicroAppConfig` no longer accepts `ssr`.

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

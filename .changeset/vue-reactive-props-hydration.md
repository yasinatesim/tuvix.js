---
"@tuvix.js/vue": minor
---

Vue adapter: reactive props, per-container apps, lifecycle events and server-only rendering.

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

---
'@tuvix.js/svelte': minor
---

Svelte adapter: Svelte 5 support, reactive prop updates, per-container instances, lifecycle events, and server CSS.

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

# @tuvix.js/svelte

> Svelte 3/4/5 bindings for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

## Quick Start

```ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App });
```

The adapter registers the module with `registerModule` from `@tuvix.js/loader`, so the orchestrator finds it by name. On the first mount it imports `svelte` and checks for a `mount` export:

- **Svelte 5**: `mount()` / `hydrate()` / `unmount()` from `svelte`.
- **Svelte 3/4**: `new App({ target, props })`, `$set()` and `$destroy()`.

Your bundler must resolve `svelte` to its client build (the `browser` export condition; `@sveltejs/vite-plugin-svelte` sets it). If it picks the server build, Svelte 5 `mount()` throws `lifecycle_function_unavailable`.

## API

### `createSvelteMicroApp(config)`

| Option      | Type                          | Default  | Meaning                                                                                                      |
| ----------- | ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `name`      | `string`                      | required | App name, registered with `registerModule`                                                                   |
| `App`       | `unknown`                     | required | Svelte 5 component or Svelte 3/4 component class                                                             |
| `bootstrap` | `() => void \| Promise<void>` | none     | One-time setup                                                                                               |
| `ssr`       | `boolean`                     | `false`  | Hydrate server markup when the container holds any                                                           |
| `SvelteMap` | `SvelteMap` class             | none     | Svelte 5 only: `SvelteMap` from `svelte/reactivity`, so `update()` re-renders in place instead of remounting |

- Each container gets its own instance, so one module can mount into several containers.
- `mount` clears the container (unless it hydrates), renders, and dispatches `tuvix:mounted` after `onMount` callbacks and effects ran. A failed mount dispatches `tuvix:error` and rejects.
- `unmount` destroys the instance, empties the container and dispatches `tuvix:unmounted`. Called while `mount` is still loading, it waits for the mount and then tears it down.
- `update({ props, container? })` updates one container, or every instance without `container`. Svelte 3/4 uses `$set()`. Svelte 5 remounts by default: it unmounts the instance, mounts a new one with the new props, and dispatches `tuvix:mounted` again, so DOM nodes and component state are lost. Pass `SvelteMap` to update in place instead (works for `$props()` and `export let`):

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App, SvelteMap });
```

The adapter doesn't import `svelte/reactivity` itself: Svelte 3/4 has no such module, and that import would break Svelte 3/4 app builds.

The host sends new props through the orchestrator:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
});
await orchestrator.start();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

### `createSsrSvelteMicroApp(config)`

Same as `createSvelteMicroApp({ ...config, ssr: true })`. It hydrates when the container holds elements or non-whitespace text, and renders fresh otherwise. Svelte 5 hydration needs the comment markers that `svelte/server` writes. Compile Svelte 3/4 components with `hydratable: true`.

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString(App, props?, options?)` from `@tuvix.js/svelte/server`

| Option   | Type                 | Default | Meaning                                                                                  |
| -------- | -------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `render` | `SvelteServerRender` | none    | `render` from `svelte/server`; without it the adapter imports `svelte/server` at runtime |

Returns the component's `<style>` tags followed by its markup. With `render` passed, it always uses Svelte 5 `render`. Without it, the adapter imports `svelte`: if that module exports `mount` it loads `svelte/server` (Svelte 5), otherwise it calls `App.render(props)` (Svelte 3/4) and wraps `css.code` in `<style>`. Svelte 5 components compiled with `dev: true` (vite-plugin-svelte in serve mode) carry an `App.render` that throws, so the adapter never decides by `App.render`. Call it from a server function; in a browser it returns `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const footerHtml = await renderSvelteToString(
  Footer,
  { year: 2026 },
  { render }
);
```

### `renderSvelte(App, props?, options?)` from `@tuvix.js/svelte/server`

Same options. Returns `{ html, head, css }`, so you can put `<svelte:head>` content in the document head.

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const { html, head, css } = await renderSvelte(
  Footer,
  { year: 2026 },
  { render }
);
```

### Types

`SvelteMicroAppConfig`, `SvelteProps` (from `@tuvix.js/svelte`); `RenderSvelteOptions`, `SvelteServerRender`, `SvelteRenderResult` (from `@tuvix.js/svelte/server`).

## Edge Cases

- Svelte 5 emits CSS in the server output only when you compile with `css: 'injected'` (Vite: `svelte({ compilerOptions: { css: 'injected' } })`). With the default `css: 'external'`, your bundler writes the CSS to a file.
- Pass `render` from `svelte/server` when your server bundle includes Svelte (Nitro, Vinxi, a `noExternal` Vite SSR build). Svelte's server renderer fails when the component and the renderer come from two Svelte copies.
- Each update replaces the whole prop set. A key missing from the new props is deleted on Svelte 5 (the default applies) and set to `undefined` on Svelte 3/4.
- `mount` on a mounted container unmounts the old instance first. `unmount` on a container the module never mounted does nothing: it leaves the container's children in place and dispatches no event.
- A Svelte 5 import or render error on the server rejects; there is no fallback to `App.render`.

## What It Does Not Do

- It does not compile `.svelte` files or check which Svelte build your bundler picked.
- It passes props only: no slots, snippets or component events from the host.
- It does not write `<svelte:head>` content into the document or link `css: 'external'` stylesheets.

Full documentation: [tuvix.js.org/packages/svelte](https://tuvix.js.org/packages/svelte)

## License

MIT

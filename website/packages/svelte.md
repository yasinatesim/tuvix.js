---
title: '@tuvix.js/svelte'
---

<PackageHeader
  name="@tuvix.js/svelte"
  title="Svelte Bindings"
  description="Turns a Svelte 3, 4 or 5 component into a Tuvix.js micro app: one instance per container, in-place prop updates, hydration of server markup, and server rendering with CSS."
  icon="🔥"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

The peer range covers Svelte 3, 4 and 5. The package has two entry points: `@tuvix.js/svelte` for the browser and `@tuvix.js/svelte/server` for server rendering.

## When to use it

Use this package when a Svelte component should run as a Tuvix.js micro app: the orchestrator mounts it into a container on a route, passes props, updates them, and unmounts it when the route changes. It also covers islands: you render the component on the server, put the HTML in the page, and the client hydrates it.

You do not need it for a page that Svelte owns from top to bottom (SvelteKit). In that case Svelte mounts itself and there is no orchestrator to talk to.

## Quick start

A Svelte 5 component with props:

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { name, theme = 'light' }: { name: string; theme?: string } = $props();
</script>

<p class={theme}>Hello {name}</p>
```

The micro app entry wraps it. Passing `SvelteMap` lets prop updates re-render the component in place:

```ts
// profile-app.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

The shell registers the app and starts the orchestrator:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
  props: { name: 'Ada' },
});

await orchestrator.start();

// Later: the component re-renders in place, no remount.
await orchestrator.updateAppProps('profile', { name: 'Grace', theme: 'dark' });
```

The client bundle must resolve `svelte` to its browser build. `@sveltejs/vite-plugin-svelte` does that for you. If your setup drops the `browser` export condition, Svelte 5 `mount()` throws `lifecycle_function_unavailable` and `onMount` never runs.

## API

### `createSvelteMicroApp`

```ts no-check
function createSvelteMicroApp(config: SvelteMicroAppConfig): MicroAppModule;
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | App name. The adapter registers the module under it with `registerModule` from `@tuvix.js/loader`. |
| `App` | `unknown` | required | Root component: a compiled Svelte 5 component (a function) or a Svelte 3/4 component class. |
| `bootstrap` | `() => void \| Promise<void>` | none | One-time setup. The module's `bootstrap()` awaits it. |
| `ssr` | `boolean` | `false` | Hydrate server markup when the container holds elements or non-whitespace text. Otherwise render fresh. |
| `SvelteMap` | `SvelteMap` class from `svelte/reactivity` | none | Svelte 5 only. With it, `update()` re-renders in place; without it, a Svelte 5 `update()` remounts the component. Svelte 3/4 ignore it. |

On the first mount the adapter imports `svelte` and checks for a `mount` export. It caches the result for the page.

- **Svelte 5** (`mount` exists): renders with `mount()`, hydrates with `hydrate()`, tears down with `unmount()`. How `update()` works depends on `SvelteMap`:
  - With `SvelteMap`, the component receives a props object backed by a `SvelteMap`. `update()` writes the new values into that map, so the parts of the template that read a changed prop re-render and the component keeps its DOM nodes and state. This works for `$props()` components and for legacy `export let` components compiled by Svelte 5.
  - Without it, `update()` unmounts the instance, empties the container, mounts a new instance with the new props, and dispatches `tuvix:mounted` again with `hydrated: false`. DOM nodes, focus and component state are lost.
- **Svelte 3/4** (no `mount`): `new App({ target, props, hydrate })`, `$set()` and `$destroy()`.

The returned module works per container. Each container gets its own instance, so one module can render into three containers at once.

- `mount({ container, props })` clears the container (unless it hydrates), renders, runs `onMount` callbacks and effects, then dispatches `tuvix:mounted` on the container with `hydrated: true | false`. A failure dispatches `tuvix:error` and rejects with the original error.
- `update({ props, container? })` updates the instance in `container`, or every instance when you leave `container` out. Each update replaces the whole prop set: a key missing from the new props falls back to the component's default on Svelte 5 and becomes `undefined` on Svelte 3/4.
- `unmount({ container })` destroys the instance, empties the container and dispatches `tuvix:unmounted`.

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import { onLifecycle } from '@tuvix.js/loader';
import Cart from './Cart.svelte';

const cart = createSvelteMicroApp({ name: 'cart', App: Cart, SvelteMap });

onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} mounted`, { hydrated });
});

const header = document.querySelector<HTMLElement>('#cart-header')!;
const sidebar = document.querySelector<HTMLElement>('#cart-sidebar')!;

await cart.mount({ container: header, props: { compact: true } });
await cart.mount({ container: sidebar, props: { compact: false } });

// Updates the sidebar instance only.
await cart.update?.({ props: { compact: true }, container: sidebar });
```

### `createSsrSvelteMicroApp`

```ts no-check
function createSsrSvelteMicroApp(config: Omit<SvelteMicroAppConfig, 'ssr'>): MicroAppModule;
```

Same as `createSvelteMicroApp({ ...config, ssr: true })`. Use it on the client for islands that the server rendered with `renderSvelteToString` or `renderSvelte`.

- **Svelte 5**: `hydrate(App, { target, props })`. The markup must come from `svelte/server`, because hydration reads the comment markers (`<!--[-->`) it writes.
- **Svelte 3/4**: `new App({ target, props, hydrate: true })`. Compile the component with `hydratable: true`.

Hydration keeps the server's DOM nodes and attaches event handlers to them. A container that holds only whitespace or comments gets a fresh render.

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelteToString(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<string>;
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | none | `render` from `svelte/server`. Without it the adapter imports `svelte/server` at runtime. |

Renders the component on the server and returns its `<style>` tags followed by its markup. Put the string inside the island container and mount it with `createSsrSvelteMicroApp`. The string leaves out `<svelte:head>` content; use `renderSvelte` when you need it.

The function picks the Svelte version at runtime. With `render` passed, it always takes the Svelte 5 path and calls `render(App, { props })`. Without it, the adapter imports `svelte`: if that module exports `mount`, it loads `svelte/server` and renders with Svelte 5. Otherwise it calls `App.render(props)` (Svelte 3/4, compiled with `generate: 'ssr'`) and wraps `css.code` in a `<style>` tag. The adapter never decides by checking `App.render`, because Svelte 5 components compiled with `dev: true` (vite-plugin-svelte in serve mode) carry an `App.render` stub that throws.

Call it from a server function, not from code that also runs in the browser. In a browser it returns `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooterIsland(): Promise<string> {
  const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
  return `<footer id="footer" data-tuvix-app="footer">${html}</footer>`;
}
```

### `renderSvelte`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelte(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<SvelteRenderResult>;
```

Takes the same arguments and options as `renderSvelteToString` and returns the parts separately:

| Field | Meaning |
| --- | --- |
| `html` | Component markup. Svelte 5 output carries the hydration comments. |
| `head` | `<svelte:head>` content without the component `<style>` tags. Put it in the document `<head>`. |
| `css` | Component CSS as `<style>` tags, or `''` when the compiler emitted none. |

In a browser all three fields are `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Article from './Article.svelte';

export async function renderArticlePage(slug: string): Promise<string> {
  const { html, head, css } = await renderSvelte(Article, { slug }, { render });
  return `<!doctype html>
<html>
  <head>${head}${css}</head>
  <body>
    <main id="article" data-tuvix-app="article">${html}</main>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
}
```

### Types

| Type | Entry | Meaning |
| --- | --- | --- |
| `SvelteMicroAppConfig` | `@tuvix.js/svelte` | Options of `createSvelteMicroApp`. |
| `SvelteProps` | `@tuvix.js/svelte` | `Record<string, unknown>`: the props the orchestrator passes to the component. |
| `RenderSvelteOptions` | `@tuvix.js/svelte/server` | `{ render?: SvelteServerRender }`. |
| `SvelteServerRender` | `@tuvix.js/svelte/server` | Shape of Svelte 5 `render` from `svelte/server`. |
| `SvelteRenderResult` | `@tuvix.js/svelte/server` | `{ html, head, css }`, returned by `renderSvelte`. |

## Server rendering

An island goes through three steps: render on the server, ship the HTML inside the container, hydrate on the client.

1. Call `renderSvelteToString` (or `renderSvelte`) in a server function and put the result in the container element.
2. Load the client entry, which exports `createSsrSvelteMicroApp({ name, App })`.
3. The orchestrator mounts the app into the same container. The adapter sees markup and hydrates it.

**CSS.** Svelte 5 puts component CSS in the render output only when you compile with `css: 'injected'`. With the default `css: 'external'`, your bundler writes the CSS to a file and the string holds no `<style>` tags. In Vite:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { css: 'injected' } })],
});
```

If you keep `css: 'external'`, link the generated stylesheet from the page head. [`@tuvix.js/vite`](/packages/vite) tells your server which stylesheets an island entry needs.

**One copy of Svelte.** Pass `render` from `svelte/server` when your server bundle includes Svelte (Nitro, Vinxi, a Vite SSR build with `noExternal`). The component and the renderer then share one Svelte copy. Without the option, the adapter imports `svelte/server` at runtime, which can load a second copy from `node_modules`. Svelte's server renderer uses `instanceof` checks and fails when the component and the renderer come from different copies.

## Edge cases

- `mount` on a container that already holds an instance of the same module unmounts the old instance first.
- `unmount` called while `mount` is still loading `svelte` waits for the mount to finish, then destroys the instance. No orphan component stays behind.
- `unmount` on a container this module never mounted, or whose mount failed, does nothing: the container keeps its children and no event fires.
- `update` called while a mount is pending waits for it, then applies the props. An update for a mount that failed does nothing.
- On Svelte 3/4, a prop missing from the new props becomes `undefined`. The `export let name = 'x'` default does not come back. On Svelte 5 the default applies, with or without `SvelteMap`.
- The adapter does not import `svelte/reactivity` itself. Svelte 3/4 have no such module, and a bundler would fail to build a Svelte 3/4 app that referenced it, so the import lives in your Svelte 5 entry.
- A Svelte 5 remount (no `SvelteMap`) dispatches `tuvix:mounted` again but no `tuvix:unmounted` in between. If the new render throws, `update()` rejects with the error and the old instance is already gone.
- Without `ssr`, `mount` clears the container before rendering, so loading placeholders disappear.
- With `ssr`, the adapter hydrates when the container has an element or non-whitespace text. Comments and whitespace alone trigger a fresh render.
- The adapter detects the Svelte version once per page. If `import('svelte')` fails, the next mount retries.
- A Svelte 5 import or render error on the server reaches you as a rejected promise. The adapter does not fall back to `App.render`.
- Svelte 5 `render` may return a promise (async server rendering). Both server functions await it.

## What it does not do

- It does not compile `.svelte` files. Your bundler does that with `@sveltejs/vite-plugin-svelte` or `svelte/compiler`.
- It does not check which Svelte build your bundler picked. A client bundle that resolves `svelte` to the server build fails at mount.
- It passes props only. Slots, snippets and component events have no channel from the host. Use [`@tuvix.js/event-bus`](/packages/event-bus) to talk across apps.
- It does not write `<svelte:head>` content into the document. `renderSvelte` returns it; your server puts it in `<head>`.
- It does not link CSS compiled with `css: 'external'`. See [`@tuvix.js/vite`](/packages/vite).
- It does not wait for data on the server. Load it first and pass it as props.

## Migrating from 0.4

- **Svelte 5 works.** In 0.4 the adapter called `new App()` on every component, so Svelte 5 components failed, and `createSsrSvelteMicroApp` rendered a second copy instead of hydrating. Mounting needs no code change. For in-place prop updates, pass `SvelteMap` from `svelte/reactivity` in the config; without it, each Svelte 5 update remounts the component.
- **The container is cleared on mount.** Without `ssr`, Svelte 3/4 used to append the component after any markup already in the container. Now the adapter empties the container first. If you relied on markup staying next to the component, move it outside the container.
- **No silent fallback on the server.** `renderSvelteToString` used to fall back to `App.render` when `svelte/server` failed to load. It now takes the Svelte 5 path when you pass `render` or when `svelte` exports `mount`, calls `App.render` only on Svelte 3/4, and rejects on a Svelte 5 import or render error. Svelte 5 dev builds in Vite dev SSR take the Svelte 5 path even though they carry an `App.render` stub.
- **`unmount` on an unknown container is a no-op.** `unmount({ container })` on a container the module never mounted used to empty it. It now leaves the container alone, like the React, Vue and Angular adapters.
- **Pass `render`.** Add `{ render }` from `svelte/server` as the third argument when your server bundle includes Svelte:

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

// 0.4: await renderSvelteToString(Footer, { year: 2026 });
const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
```

See the [Svelte guide](/guide/svelte) for a full app.

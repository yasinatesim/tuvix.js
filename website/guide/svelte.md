# With Svelte

`@tuvix.js/svelte` turns a Svelte component into a micro app. It supports Svelte 5 and Svelte 3/4, hydrates server markup, and renders components to HTML on the server.

## Install

```bash
pnpm add @tuvix.js/svelte svelte
```

## Turn a component into a micro app

```ts
// src/main.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

// SvelteMap (Svelte 5 only) lets update() re-render in place; drop it for Svelte 3/4.
export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

On the first mount the adapter imports `svelte` and checks which API it has:

| Svelte | Mount | Hydrate | Update | Unmount |
| --- | --- | --- | --- | --- |
| 5 | `mount(App, { target, props })` | `hydrate(...)` | in place with `SvelteMap`, else remount | `unmount(instance)` |
| 3 / 4 | `new App({ target, props })` | `new App({ hydrate: true })` | `instance.$set(props)` | `instance.$destroy()` |

Your bundler must resolve `svelte` to its browser build. If it picks the server build, Svelte 5 `mount()` throws `lifecycle_function_unavailable`, or `onMount` callbacks never run. See [Troubleshooting](/guide/troubleshooting).

Each container gets its own component instance. `mount` dispatches `tuvix:mounted` after `onMount` callbacks and effects ran. Without `ssr`, `mount` empties the container before it renders. `unmount` on a container this module never mounted, or whose mount failed, does nothing.

## Props

Svelte 5 with runes:

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { userId, theme = 'light' }: { userId: string; theme?: string } = $props();
</script>

<div class="theme-{theme}">User {userId}</div>
```

Svelte 3/4, or Svelte 5 in legacy mode:

```svelte
<script lang="ts">
  export let userId: string;
  export let theme = 'light';
</script>

<div class="theme-{theme}">User {userId}</div>
```

On Svelte 5, pass `SvelteMap` from `svelte/reactivity` in the config. The adapter then hands the component a props object backed by a `SvelteMap`, and `update({ props })` writes the new values into it: only the parts that read a changed prop re-render, and DOM nodes and component state survive. This works for `$props()` and for `export let`. Without `SvelteMap`, a Svelte 5 `update()` unmounts the instance, mounts a new one with the new props and dispatches `tuvix:mounted` again, so local state resets. The adapter does not import `svelte/reactivity` itself, because that module does not exist in Svelte 3/4 and their builds would fail.

On Svelte 3/4, `update` calls `$set` and ignores `SvelteMap`.

Each update replaces the whole prop set. A key missing from the new props falls back to the prop's default on Svelte 5 and becomes `undefined` on Svelte 3/4. The orchestrator always sends the merged props, so this matters only when you call `update` yourself.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

## Server rendering and hydration

```ts
// server-only module
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooter(): Promise<string> {
  return renderSvelteToString(Footer, { year: 2026 }, { render });
}
```

```ts
// client
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

- `renderSvelteToString(App, props?, { render? })` returns the component's `<style>` tags followed by its markup. Call it from server code; in the browser it returns `''`.
- Pass `render` from `svelte/server` when your server bundle includes Svelte (Nitro, Vinxi, a `noExternal` Vite SSR build). Without it, the adapter imports `svelte/server` at runtime, which can load a second Svelte copy, and Svelte's server renderer fails across copies.
- `renderSvelte(App, props?, { render? })` returns `{ html, head, css }` when you need `<svelte:head>` output. Put `head` in the document `<head>` yourself; the island must not contain `<title>` or `<meta>`.
- `createSsrSvelteMicroApp` hydrates when the container holds elements or non-whitespace text, and renders fresh otherwise. Svelte 3/4 components must be compiled with `hydratable: true`.

### CSS on first paint

Pick one:

- **CSS in the HTML.** Compile with `compilerOptions: { css: 'injected' }`. Svelte 5 then puts the component CSS in the server output, and `renderSvelteToString` includes it as `<style>` tags inside the island.
- **CSS as files.** Keep the default `emitCss: true` and link the island's stylesheets in `<head>` with `@tuvix.js/vite`. See [SSR Islands](/guide/ssr-islands).

With `css: 'injected'` there is no stylesheet file, so `@tuvix.js/vite` finds nothing to link. Do not combine the two.

## Event bus

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getGlobalBus } from '@tuvix.js/event-bus';

  let count = $state(0);
  const off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
    count = itemCount;
  });
  onDestroy(off);
</script>

<span class="badge">{count}</span>
```

## What the adapter does not do

- It does not compile `.svelte` files; `@sveltejs/vite-plugin-svelte` does.
- It passes props only. No slots, snippets or component events cross from the host.
- It does not check which Svelte build your bundler picked.

## API

| Export | Purpose |
| --- | --- |
| `createSvelteMicroApp({ name, App, bootstrap?, ssr?, SvelteMap? })` | Svelte micro app module |
| `createSsrSvelteMicroApp({ name, App, bootstrap?, SvelteMap? })` | Same with `ssr: true` |
| `renderSvelteToString(App, props?, options?)` from `@tuvix.js/svelte/server` | Styles + markup |
| `renderSvelte(App, props?, options?)` from `@tuvix.js/svelte/server` | `{ html, head, css }` |

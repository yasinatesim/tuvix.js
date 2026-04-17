# With Svelte

`@tuvix.js/svelte` provides Svelte 3 / 4 / 5 bindings for Tuvix.js. The
binding auto-detects the Svelte version at runtime — no extra config needed.

## Installation

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

## createSvelteMicroApp

```ts
// src/main.ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({
  name: 'profile',
  App,
});
```

The returned module is auto-registered on `window.__TUVIX_MODULES__['profile']`.

| Svelte version | Mount API | Unmount API | Update API |
| --- | --- | --- | --- |
| 3 / 4 | `new App({ target, props })` | `instance.$destroy()` | `instance.$set(props)` |
| 5 | `mount(App, { target, props })` | `instance.unmount()` | _no built-in — see below_ |

## Props (Svelte 5)

```svelte
<!-- App.svelte -->
<script lang="ts">
  let { userId, theme = 'light' }: { userId: string; theme?: string } = $props();
</script>

<div class="theme-{theme}">User: {userId}</div>
```

## Props (Svelte 3 / 4)

```svelte
<!-- App.svelte -->
<script lang="ts">
  export let userId: string;
  export let theme: string = 'light';
</script>

<div class="theme-{theme}">User: {userId}</div>
```

## Updating Props at Runtime

```ts
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

- **Svelte 3 / 4** — props are forwarded to `instance.$set(props)` and the
  component reactively updates.
- **Svelte 5** — `$set` was removed in the rune-based API. Surface props
  through a shared store or rune-based state inside the component; the
  binding logs a warning if it cannot deliver the update.

  ```ts
  // shared.ts (imported from both shell and app)
  import { writable } from 'svelte/store';
  export const tuvixProps = writable<Record<string, unknown>>({});
  ```

  ```ts
  // shell — feed bus events into the store
  bus.on('tuvix:props:update', (next) => tuvixProps.set(next));

  // app — read reactively
  const props = $derived($tuvixProps);
  ```

## SSR / Hydration

Use `createSsrSvelteMicroApp` when the container has pre-rendered HTML —
the binding initialises with `hydrate: true`:

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App });
```

Pair with `renderSvelteToString` from `@tuvix.js/svelte/server`.

## Event Bus Integration

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { IEventBus } from '@tuvix.js/event-bus';

  export let bus: IEventBus;

  let count = 0;
  const unsub = bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
    count = itemCount;
  });

  onDestroy(unsub);
</script>

<span class="badge">{count}</span>
```

> A clean pattern is to expose `orchestrator.getEventBus()` on `window` once
> during shell startup so micro apps can grab it without prop plumbing.

## API Surface

| Export | Purpose |
| --- | --- |
| `createSvelteMicroApp({ name, App, bootstrap? })` | Client-only Svelte micro app |
| `createSsrSvelteMicroApp({ name, App, bootstrap? })` | SSR / hydration variant |
| `renderSvelteToString(...)` (from `/server`) | SSR render to HTML string |

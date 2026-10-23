# With Vue

`@tuvix.js/vue` turns a Vue 3 root component into a micro app, hydrates server-rendered markup, and renders components to HTML on the server.

## Install

```bash
pnpm add @tuvix.js/vue vue
# for renderVueToString on the server
pnpm add @vue/server-renderer
```

## Turn a component into a micro app

```ts
// src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import { createPinia } from 'pinia';
import { analytics } from './analytics-plugin';
import App from './App.vue';

export default createVueMicroApp({
  name: 'settings',
  App,
  plugins: [createPinia(), [analytics, { id: 'G-123' }]],
});
```

| Option | Type | Description |
| --- | --- | --- |
| `name` | `string` | Required. Must match the registered app name. |
| `App` | `Component` | Required. Root component. |
| `plugins` | `Array<Plugin \| [Plugin, ...options]>` | Installed with `app.use(plugin, ...options)` on every mount. |
| `bootstrap` | `() => void \| Promise<void>` | Runs once before the first mount. |
| `ssr` | `boolean` | Hydrate server markup. `createSsrVueMicroApp` sets it. |

Each container gets its own Vue app, so every mount runs each plugin's `install` again. A plugin instance such as `createPinia()` is shared by all mounts of the module. Create it inside a plugin function when every mount needs its own store.

Mounting into a container that already holds this app unmounts the old instance first. `unmount` destroys the app, empties the container and dispatches `tuvix:unmounted`.

## Props

The adapter passes props to the root component, and also provides them under `'tuvixProps'` (`TUVIX_PROPS_KEY`) for any descendant:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

defineProps<{ userId: string; theme?: 'light' | 'dark' }>();

const all = inject<Record<string, unknown>>(TUVIX_PROPS_KEY);
</script>

<template>
  <div :class="theme">User {{ userId }} ({{ Object.keys(all ?? {}).length }} props)</div>
</template>
```

`update({ props })` replaces the props in a `shallowReactive` object and waits for Vue's next tick. The root component re-renders with the new values and keeps its local state. Keys missing from the new props are removed. Without `container`, `update` updates every mount of the module.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## Server rendering and hydration

Render on the server with `renderVueToString`, and hydrate on the client with `createSsrVueMicroApp`:

```ts
// server-only module
import { renderVueToString } from '@tuvix.js/vue/server';
import Newsletter from './Newsletter.vue';

export async function renderNewsletter(list: string): Promise<string> {
  const ssrContext: { teleports?: Record<string, string> } = {};
  const html = await renderVueToString(Newsletter, { list }, [], ssrContext);
  return html; // ssrContext.teleports holds <Teleport> output
}
```

```ts
// client
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

export const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });
```

- `renderVueToString(App, props?, plugins?, ssrContext?)` wraps `App` in the same root the client uses, so `inject('tuvixProps')` works on the server and hydration matches.
- Call it from server code only: a server function, an API route, or your server entry. In the browser it returns `''`. An isomorphic route loader also runs in the browser, and the bundler then ships the Vue server renderer to the client.
- With `ssr: true` and server markup in the container, the adapter calls `createSSRApp` and keeps the server DOM nodes. An empty container gets a fresh `createApp` render.
- The HTML contains no CSS. Vite injects SFC `<style>` blocks from JavaScript, after hydration starts. Link the stylesheets in `<head>` with `@tuvix.js/vite`; see [SSR Islands](/guide/ssr-islands).

Inside a React host, mount the module with `TuvixIsland`.

## Composables

### useTuvixBus

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/vue';

const count = ref(0);
useTuvixBus<{ itemCount: number }>(getGlobalBus(), 'cart:updated', ({ itemCount }) => {
  count.value = itemCount;
});
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>
```

It subscribes in `onMounted`, unsubscribes in `onUnmounted`, and returns a function for early cleanup.

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` returns a `ShallowRef` that merges in each payload emitted on `updateEvent`. Nothing in Tuvix.js emits that event. With the adapter, props passed through `updateAppProps` already re-render the component, so you rarely need it.

## Edge cases

- Path aliases such as `~/utils` must resolve in `.vue` files too. If your alias comes from `vite-tsconfig-paths`, include `**/*.vue` in that tsconfig's `include`, or set `resolve.alias` in the Vite config. See [Troubleshooting](/guide/troubleshooting).
- A setup, render or lifecycle-hook error during mount rejects `mount` and dispatches `tuvix:error`, in production builds too. A plugin's own `app.config.errorHandler` still runs.
- `unmount` on a container this module never mounted does nothing.

## API

| Export | Purpose |
| --- | --- |
| `createVueMicroApp({ name, App, plugins?, bootstrap?, ssr? })` | Vue micro app module |
| `createSsrVueMicroApp({ name, App, plugins?, bootstrap? })` | Same with `ssr: true` |
| `TUVIX_PROPS_KEY` | Injection key (`'tuvixProps'`) for the reactive props |
| `useTuvixBus(bus, event, handler)` | Event bus subscription tied to the component |
| `useTuvixProps(initial, bus?, event?)` | `ShallowRef` merged from bus events |
| `renderVueToString(App, props?, plugins?, ssrContext?)` from `@tuvix.js/vue/server` | Server HTML |

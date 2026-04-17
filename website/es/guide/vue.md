# With Vue

`@tuvix.js/vue` provides Vue 3 bindings for Tuvix.js.

## Installation

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

## createVueMicroApp

```ts
// src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import { createPinia } from 'pinia';
import App from './App.vue';

export default createVueMicroApp({
  name: 'settings',
  App,
  plugins: [createPinia()], // optional Vue plugins
});
```

`createVueMicroApp` creates a Vue app instance via `createApp`, registers any
plugins, mounts it into the supplied container, and destroys the instance on
unmount. The returned module is auto-registered on
`window.__TUVIX_MODULES__['settings']` so the loader picks it up automatically.

### Options

| Option | Type | Description |
| --- | --- | --- |
| `name` | `string` | **Required.** Unique micro app name |
| `App` | `Component` | **Required.** Root Vue component |
| `plugins?` | `Plugin[]` | Vue plugins to install (Pinia, Vue Router, etc.) |
| `bootstrap?` | `() => void \| Promise<void>` | One-time setup before first mount |

## Props

Props from the orchestrator are passed to the root component, **and** also
exposed via `provide / inject` under the `tuvixProps` key:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { inject } from 'vue';

defineProps<{ userId: string; theme: 'light' | 'dark' }>();

const tuvixProps = inject('tuvixProps') as Record<string, unknown> | undefined;
</script>

<template>
  <div :class="`theme-${theme}`">User: {{ userId }}</div>
</template>
```

When the shell calls `orchestrator.updateAppProps('settings', { theme: 'light' })`,
the binding writes the new props onto `app.config.globalProperties.$tuvixProps`.
For reactive component-level updates, prefer `useTuvixProps` below or wire the
event bus directly.

## SSR / Hydration

Use `createSsrVueMicroApp` when the container already contains
server-rendered HTML — Vue uses `createSSRApp` so it hydrates the existing
markup instead of replacing it:

```ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createSsrVueMicroApp({ name: 'contact', App });
```

Pair with `renderVueToString` from `@tuvix.js/vue/server` on the server side.

## Composables

### `useTuvixBus(bus, event, handler)`

Subscribes inside `onMounted` and cleans up in `onUnmounted`:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';

const props = defineProps<{ bus: import('@tuvix.js/event-bus').IEventBus }>();
const count = ref(0);

useTuvixBus<{ itemCount: number }>(props.bus, 'cart:updated', ({ itemCount }) => {
  count.value = itemCount;
});
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>
```

The returned function is a manual unsubscribe handle if you need early cleanup.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Returns a `ShallowRef<T>` that merges in updates from the bus:

```vue
<script setup lang="ts">
import { useTuvixProps } from '@tuvix.js/vue';

const props = defineProps<{
  initialProps: { theme: string };
  bus: import('@tuvix.js/event-bus').IEventBus;
}>();

const tuvixProps = useTuvixProps(props.initialProps, props.bus);
</script>

<template>
  <div>Theme: {{ tuvixProps.theme }}</div>
</template>
```

`updateEvent` defaults to `'tuvix:props:update'`.

## API Surface

| Export | Purpose |
| --- | --- |
| `createVueMicroApp({ name, App, plugins?, bootstrap? })` | Vue 3 micro app |
| `createSsrVueMicroApp({ name, App, plugins?, bootstrap? })` | SSR / hydration variant |
| `useTuvixBus(bus, event, handler)` | Auto-cleaning event subscription |
| `useTuvixProps(initial, bus?, event?)` | Reactive `ShallowRef` of orchestrator props |

# @tuvix.js/vue

> Vue 3 bindings for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

## Quick Start

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import { createPinia } from 'pinia';
import App from './App.vue';

export default createVueMicroApp({
  name: 'settings',
  App,
  plugins: [createPinia()], // optional Vue plugins
});
```

The returned module is auto-registered on `window.__TUVIX_MODULES__['settings']`
so the orchestrator's loader picks it up automatically.

Inside the component, props from the orchestrator are exposed as a Vue
[provide/inject](https://vuejs.org/guide/components/provide-inject.html) value
under the `tuvixProps` key:

```ts
import { inject } from 'vue';
const props = inject('tuvixProps') as Record<string, unknown>;
```

## SSR / Hydration

Use `createSsrVueMicroApp` when the container already contains
server-rendered HTML — Vue uses `createSSRApp` so it hydrates the existing
markup instead of replacing it:

```ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createSsrVueMicroApp({ name: 'contact', App });
```

Pair this with `renderVueToString` from `@tuvix.js/vue/server` on the server
side.

## Composables

### `useTuvixBus(bus, event, handler)`

Subscribes inside `onMounted` and cleans up in `onUnmounted`:

```vue
<script setup lang="ts">
import { useTuvixBus } from '@tuvix.js/vue';

const props = defineProps<{ bus: import('@tuvix.js/event-bus').IEventBus }>();

useTuvixBus<{ items: unknown[] }>(props.bus, 'cart:update', ({ items }) => {
  console.log('cart now has', items.length, 'items');
});
</script>
```

Returns a manual unsubscribe function in case you need early cleanup.

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
| `createVueMicroApp({ name, App, plugins?, bootstrap? })` | Wrap a Vue 3 component as a micro app |
| `createSsrVueMicroApp({ name, App, plugins?, bootstrap? })` | SSR / hydration variant |
| `useTuvixBus(bus, event, handler)` | Auto-cleaning event subscription |
| `useTuvixProps(initial, bus?, event?)` | Reactive `ShallowRef` of orchestrator props |

## License

MIT

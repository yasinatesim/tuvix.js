# With Vue

`@tuvix.js/vue` provides Vue 3 bindings for Tuvix.js.

## Installation

```bash
npm install @tuvix.js/vue vue
```

## createVueMicroApp

```ts
// src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export const app = createVueMicroApp(App);
```

`createVueMicroApp` creates a Vue app instance, passes shell props as component props, and destroys the instance on unmount.

## Props

```vue
<!-- App.vue -->
<script setup lang="ts">
defineProps<{
  userId: string;
  theme: 'light' | 'dark';
}>();
</script>

<template>
  <div :class="`theme-${theme}`">User: {{ userId }}</div>
</template>
```

## useTuvixBus Composable

Subscribe to event bus events with automatic cleanup on component unmount:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const count = ref(0);
const bus = getGlobalBus();

useTuvixBus(bus, 'cart:updated', ({ itemCount }) => {
  count.value = itemCount;
});
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>
```

## Full Example

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const props = defineProps<{ apiUrl: string }>();
const theme = ref<'light' | 'dark'>('dark');
const bus = getGlobalBus();

useTuvixBus(bus, 'theme:changed', ({ theme: t }) => {
  theme.value = t;
});
</script>

<template>
  <div :class="`app theme-${theme}`">
    <h1>My Micro App</h1>
    <p>API: {{ props.apiUrl }}</p>
  </div>
</template>
```

```ts
// src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';
export const app = createVueMicroApp(App);
```

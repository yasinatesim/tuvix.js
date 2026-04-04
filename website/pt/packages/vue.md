---
title: '@tuvix.js/vue'
---

<PackageHeader
  name="@tuvix.js/vue"
  title="Vue Bindings"
  description="Vue 3 bindings for Tuvix.js. createMicroApp wrapper, useMicroApp composable, useTuvixEvent composable."
  icon="💚"
  npm="true"
/>

## Instalação

```bash
npm install @tuvix.js/vue vue
```

## API

### `createMicroApp(Component)`

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export const app = createMicroApp(App);
```

### `useMicroApp()`

```vue
<script setup>
const { name, props } = useMicroApp();
</script>
```

### `useTuvixEvent(event, handler)`

Subscribes reactively. Automatically cleaned up when the component unmounts.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';

const theme = ref<'light' | 'dark'>('dark');
useTuvixEvent('theme:changed', ({ theme: t }) => { theme.value = t; });
</script>
```

## Exemplo Completo

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const props = defineProps<{ apiUrl: string; userId: string }>();
const theme = ref<'light' | 'dark'>('dark');
const data = ref(null);

useTuvixEvent('theme:changed', ({ theme: t }) => { theme.value = t; });

onMounted(async () => {
  const res = await fetch(`${props.apiUrl}/users/${props.userId}`);
  data.value = await res.json();
});

function handleAction() {
  eventBus.emit('dashboard:action', { type: 'refresh' });
}
</script>

<template>
  <div :class="`app theme-${theme}`">
    <h1>Dashboard</h1>
    <button @click="handleAction">Refresh All</button>
    <pre v-if="data">{{ JSON.stringify(data, null, 2) }}</pre>
  </div>
</template>
```

See the [Vue Guide](/pt/guide/vue) for more details.

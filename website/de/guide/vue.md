# Mit Vue

`@tuvix.js/vue` bietet Vue 3 Bindings für Tuvix.js.

## Installation

```bash
npm install @tuvix.js/vue vue
```

## createMicroApp

```ts
// src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export const app = createMicroApp(App);
```

`createMicroApp` erstellt eine Vue-App-Instanz, übergibt Shell-Props als Komponenten-Props und zerstört die Instanz beim Unmount.

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

Abonnieren Sie Event-Bus-Events mit automatischem Cleanup beim Unmount der Komponente:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';

const count = ref(0);

useTuvixEvent('cart:updated', ({ itemCount }) => {
  count.value = itemCount;
});
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>
```

## Vollständiges Beispiel

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';

const props = defineProps<{ apiUrl: string }>();
const theme = ref<'light' | 'dark'>('dark');

useTuvixEvent('theme:changed', ({ theme: t }) => {
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
export const app = createMicroApp(App);
```

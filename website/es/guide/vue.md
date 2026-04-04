# Con Vue

`@tuvix.js/vue` proporciona bindings de Vue 3 para Tuvix.js.

## Instalación

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

`createMicroApp` crea una instancia de Vue, pasa los props del shell como props del componente, y destruye la instancia al desmontar.

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

## Composable useTuvixBus

Suscríbete a eventos del event bus con limpieza automática al desmontar el componente:

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

## Ejemplo Completo

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

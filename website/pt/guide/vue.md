# Com Vue

`@tuvix.js/vue` fornece bindings Vue 3 para Tuvix.js.

## Instalação

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

`createMicroApp` cria uma instância do app Vue, passa as props do shell como props do componente e destrói a instância na desmontagem.

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

Inscreva-se nos eventos do event bus com limpeza automática na desmontagem do componente:

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

## Exemplo Completo

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

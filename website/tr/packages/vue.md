---
title: '@tuvix.js/vue'
---

<PackageHeader
  name="@tuvix.js/vue"
  title="Vue Bağlamaları"
  description="Tuvix.js için Vue 3 bağlamaları. createMicroApp sarmalayıcı, useMicroApp composable, useTuvixEvent composable."
  icon="💚"
  npm="true"
/>

## Kurulum

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

Mevcut mikro uygulama bağlamına erişir.

### `useTuvixEvent(event, handler)`

Reaktif olarak abone olur. Bileşen unmount olduğunda otomatik olarak temizlenir.

## Tam Çalışma Örneği

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const props = defineProps<{ apiUrl: string; userId: string }>();
const theme = ref<'light' | 'dark'>('dark');
const bus = getGlobalBus();

useTuvixBus(bus, 'theme:changed', ({ theme: t }) => { theme.value = t; });
</script>

<template>
  <div :class="`app theme-${theme}`">
    <h1>Dashboard</h1>
  </div>
</template>
```

Daha fazla bilgi için [Vue Rehberi](/tr/guide/vue) sayfasına bakın.

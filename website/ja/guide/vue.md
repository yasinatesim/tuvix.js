# Vue と使う

`@tuvix.js/vue` は Tuvix.js 用の Vue 3 バインディングを提供します。

## インストール

```bash
npm install @tuvix.js/vue vue
```

## createMicroApp

```ts
// src/main.ts
import { createMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export const app = createMicroApp(App);
```

`createMicroApp` は Vue アプリインスタンスを作成し、シェルの props をコンポーネントの props として渡し、アンマウント時にインスタンスを破棄します。

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

## useMicroApp コンポーザブル

```vue
<script setup lang="ts">
import { useMicroApp } from '@tuvix.js/vue';

const { props, name } = useMicroApp();
</script>
```

## useTuvixEvent コンポーザブル

コンポーネントのアンマウント時に自動クリーンアップ付きで Event Bus イベントをサブスクライブします：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixEvent } from '@tuvix.js/vue';

const count = ref(0);

useTuvixEvent('cart:updated', ({ itemCount }) => {
  count.value = itemCount;
});
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>
```

## 完全な例

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixEvent } from '@tuvix.js/vue';

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
import { createMicroApp } from '@tuvix.js/vue';
import App from './App.vue';
export const app = createMicroApp(App);
```

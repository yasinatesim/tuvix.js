# Svelte と使う

`@tuvix.js/svelte` は Tuvix.js 用の Svelte 3、4、5 バインディングを提供します。

## インストール

```bash
npm install @tuvix.js/svelte svelte
```

## createMicroApp

```ts
// src/main.ts
import { createMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export const app = createMicroApp(App);
```

## Props (Svelte 5)

```svelte
<!-- App.svelte -->
<script lang="ts">
  let { userId, theme }: { userId: string; theme: string } = $props();
</script>

<div class="theme-{theme}">User: {userId}</div>
```

## Props (Svelte 3/4)

```svelte
<!-- App.svelte -->
<script lang="ts">
  export let userId: string;
  export let theme: string;
</script>

<div class="theme-{theme}">User: {userId}</div>
```

## Event Bus 統合

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { eventBus } from '@tuvix.js/event-bus';

  let count = 0;
  const unsub = eventBus.on('cart:updated', ({ itemCount }) => {
    count = itemCount;
  });

  onDestroy(unsub);
</script>

<span class="badge">{count}</span>
```

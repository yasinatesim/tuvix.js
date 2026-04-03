# Con Svelte

`@tuvix.js/svelte` fornisce binding Svelte 3, 4 e 5 per Tuvix.js.

## Installazione

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

## Integrazione Event Bus

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

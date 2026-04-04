---
title: '@tuvix.js/svelte'
---

<PackageHeader
  name="@tuvix.js/svelte"
  title="Svelte Bindings"
  description="Svelte 3, 4, and 5 bindings for Tuvix.js. createSvelteMicroApp wrapper with reactive lifecycle integration."
  icon="🔥"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/svelte svelte
```

## API

### `createSvelteMicroApp(Component)`

Works with Svelte 3, 4, and 5:

```ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export const app = createSvelteMicroApp(App);
```

## Full Working Example (Svelte 5)

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getGlobalBus } from '@tuvix.js/event-bus';

  let { apiUrl, userId } = $props<{ apiUrl: string; userId: string }>();
  let theme = $state<'light' | 'dark'>('dark');
  let data = $state(null);

  const bus = getGlobalBus();
  const unsub = bus.on('theme:changed', ({ theme: t }) => { theme = t; });
  onDestroy(unsub);

  $effect(() => {
    fetch(`${apiUrl}/users/${userId}`)
      .then(r => r.json())
      .then(d => data = d);
  });

  function handleAction() {
    bus.emit('dashboard:action', { type: 'refresh' });
  }
</script>

<div class="app theme-{theme}">
  <h1>Dashboard</h1>
  <button onclick={handleAction}>Refresh All</button>
  {#if data}<pre>{JSON.stringify(data, null, 2)}</pre>{/if}
</div>
```

See the [Svelte Guide](/guide/svelte) for more details.

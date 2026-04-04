---
title: '@tuvix.js/svelte'
---

<PackageHeader
  name="@tuvix.js/svelte"
  title="Svelte Bağlamaları"
  description="Tuvix.js için Svelte 3, 4 ve 5 bağlamaları. Reaktif yaşam döngüsü entegrasyonu ile createMicroApp sarmalayıcı."
  icon="🔥"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/svelte svelte
```

## API

### `createMicroApp(Component)`

Svelte 3, 4 ve 5 ile çalışır:

```ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export const app = createMicroApp(App);
```

## Tam Çalışma Örneği (Svelte 5)

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getGlobalBus } from '@tuvix.js/event-bus';

  let { apiUrl, userId } = $props<{ apiUrl: string; userId: string }>();
  let theme = $state<'light' | 'dark'>('dark');

  const bus = getGlobalBus();
  const unsub = bus.on('theme:changed', ({ theme: t }) => { theme = t; });
  onDestroy(unsub);
</script>

<div class="app theme-{theme}">
  <h1>Dashboard</h1>
</div>
```

Daha fazla bilgi için [Svelte Rehberi](/tr/guide/svelte) sayfasına bakın.

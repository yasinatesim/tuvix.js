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
import { createMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export const app = createMicroApp(App);
```

[Svelte Rehberi](/guide/svelte) sayfasına bakın.

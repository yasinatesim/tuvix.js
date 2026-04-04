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

[Vue Rehberi](/tr/guide/vue) sayfasına bakın.

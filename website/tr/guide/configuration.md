# Yapılandırma

## Orchestrator Seçenekleri

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  /**
   * Kök container seçicisi veya elementi.
   * Mikro uygulamalar bu elementin içine bağlanır.
   * @default '#app'
   */
  container: '#app',

  onBeforeMount?: (app) => void,
  onAfterMount?: (app) => void,
  onError?: (error, app) => void,
});
```

## Mikro Uygulama Kaydetme

```ts
orchestrator.register('uygulamam', {
  entry: 'https://cdn.example.com/uygulamam/main.js',
  props: {
    apiUrl: 'https://api.example.com',
  },
  sandbox: {
    css: true,
    js: false,
  },
});
```

## Router Seçenekleri

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  orchestrator,
  mode: 'history', // veya 'hash'
  routes: [
    { path: '/', app: 'ana-sayfa' },
    { path: '/panel', app: 'panel' },
    {
      path: '/yonetim',
      app: 'yonetim',
      guard: () => yetkiKontrolEt(),
    },
  ],
});
```

## Sandbox Seçenekleri

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({
  css: true,
  js: true,
});
```

## Ortam Değişkenleri

Tuvix.js'in zorunlu ortam değişkeni yoktur. Tüm yapılandırma kodda yapılır.

```ts
// vite.config.ts
export default {
  define: {
    __TUVIX_DEBUG__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
};
```

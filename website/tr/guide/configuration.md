# Yapılandırma

## Orkestratör Seçenekleri

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

İngilizce belgelerin tamamı için bakınız → [Configuration](/guide/configuration)

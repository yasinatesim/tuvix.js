---
title: '@tuvix.js/router'
---

<PackageHeader
  name="@tuvix.js/router"
  title="Yönlendirici"
  description="History ve hash modu ile URL tabanlı mikro uygulama yönlendirmesi. URL değiştikçe mikro uygulamaları mount ve unmount eder."
  icon="🔀"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/router
```

## Hızlı Başlangıç

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });

const router = createRouter({
  orchestrator,
  mode: 'history',
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

orchestrator.start();
```

## API

### `createRouter(options)`

```ts
interface RouterOptions {
  orchestrator: Orchestrator;
  mode?: 'history' | 'hash';
  routes: Route[];
}

interface Route {
  path: string;
  app: string;
  guard?: () => boolean | Promise<boolean>;
}
```

### `router.navigate(path)`

Programatik olarak gezinir.

### `router.replace(path)`

Geçmiş yığınına eklemeden gezinir.

### `router.go(n)`

Geçmişte geri (`-1`) veya ileri (`1`) gider.

### `router.currentRoute`

Şu anda aktif olan rota nesnesi.

### `router.onRouteChange(handler)`

Rota değişikliklerine abone olur.

## Rota Koruyucuları

```ts
routes: [
  {
    path: '/admin',
    app: 'admin',
    guard: async () => {
      return await checkUserIsAdmin();
    },
  },
],
```

Gezinmeyi engellemek için `false` döndürün.

## Dinamik Segmentler

```ts
{ path: '/users/:id', app: 'user-profile' }
// Eşleşme: /users/42 → props.params = { id: '42' }

{ path: '/files/*', app: 'file-browser' }
// Eşleşme: /files/a/b/c → props.params = { '*': 'a/b/c' }
```

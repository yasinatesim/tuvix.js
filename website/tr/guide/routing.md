# Yönlendirme

`@tuvix.js/router`, URL tabanlı mikro uygulama etkinleştirmesi sağlar. Bir URL bir rota ile eşleştiğinde, ilgili mikro uygulama mount edilir. URL değiştiğinde, uygulama unmount edilir.

## Kurulum

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });

const router = createRouter({
  orchestrator,
  mode: 'history', // veya 'hash'
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

orchestrator.start();
```

## Rota Eşleştirme

Rotalar sırayla eşleştirilir. İlk eşleşme kazanır.

| Desen | Eşleşir | Parametreler |
|-------|---------|-------------|
| `/` | `/` | - |
| `/dashboard` | `/dashboard` | - |
| `/users/:id` | `/users/42` | `{ id: '42' }` |
| `/files/*` | `/files/a/b/c` | `{ '*': 'a/b/c' }` |

Rota parametreleri mikro uygulamaya `props.params` olarak geçirilir:

```ts
// Mikro uygulamanızda
async mount(container, props) {
  const { id } = (props?.params ?? {}) as { id: string };
  // id ile kullanıcıyı getir
}
```

## Navigasyon Koruyucuları

Rotaları guard fonksiyonlarıyla koruyun:

```ts
routes: [
  {
    path: '/admin',
    app: 'admin',
    guard: async () => {
      const user = await getUser();
      if (!user.isAdmin) {
        router.navigate('/login');
        return false; // Navigasyonu engelle
      }
      return true;
    },
  },
],
```

## Programatik Navigasyon

```ts
// Bir yola git
router.navigate('/dashboard');

// Sorgu parametreleriyle git
router.navigate('/search?q=tuvix');

// Mevcut geçmiş girişini değiştir (geri düğmesi yok)
router.replace('/dashboard');

// Geri / ileri git
router.go(-1);
```

## Hash Modu

Sunucu tarafı URL yeniden yazma olmayan ortamlar için hash modunu kullanın (örn. SPA geri dönüşü olmayan statik barındırma):

```ts
const router = createRouter({
  orchestrator,
  mode: 'hash',
  routes: [
    { path: '/', app: 'home' },
    { path: '/about', app: 'about' },
  ],
});
// URL'ler: /#/, /#/about
```

## Aktif Rota

```ts
const currentRoute = router.currentRoute;
// { path: '/dashboard', app: 'dashboard', params: {} }

router.onRouteChange((route) => {
  console.log('Navigated to:', route.path);
});
```

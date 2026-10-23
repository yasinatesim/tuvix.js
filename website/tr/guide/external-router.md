# Harici router

Shell'inizde navigasyonu zaten TanStack Router, React Router ya da başka bir router yönetiyorsa bu görev onda kalsın. `orchestrator.connectRouter()` orchestrator'ın o router'ı takip etmesini sağlar, `interceptLinks()` ise mikro uygulamalardaki düz `<a href>` tıklamalarını o router'a yönlendirir.

## Ne zaman kullanılır

- Shell'iniz kendi router'ı olan bir React uygulamasıdır ve bazı route'lar mikro uygulama barındırır.
- Mikro uygulamalarınız sayfa yenilemeden navigasyon yapması gereken düz linkler render eder (Vue, Svelte, Angular ya da HTML şablonları).

Shell'in kendi router'ı yoksa onun yerine yerleşik router'ı kullanın; bkz. [Yönlendirme](/tr/guide/routing).

## connectRouter

```ts
import { createOrchestrator, type RouterSource } from 'tuvix.js';

const source: RouterSource = {
  // Her navigasyondan sonra `callback` çağırın; abonelikten çıkan bir fonksiyon döndürün.
  subscribe(callback) {
    window.addEventListener('popstate', callback);
    return () => window.removeEventListener('popstate', callback);
  },
  // activeWhen pattern'lerinin eşleştirildiği path.
  getPath: () => window.location.pathname,
};

const orchestrator = createOrchestrator(); // `router` seçeneği yok
const disconnect = orchestrator.connectRouter(source);
await orchestrator.start();

// daha sonra
disconnect();
```

- `start()`, `getPath()` değerine göre reconcile eder. Ardından her `subscribe` callback'i, yeni `getPath()` değeri için bir reconcile kuyruğa ekler.
- Zaten başlamış bir orchestrator'ı bağlamak hemen reconcile tetikler.
- Reconcile turları tek tek çalışır ve sıradaki tur yalnızca kuyruktaki en yeni path için çalışır. Böylece art arda gelen router olayları, son durumda kalan her path için tek bir reconcile ile sonuçlanır.
- `destroy()` bağlı bütün router'ların bağlantısını keser.

## TanStack Router

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // createRouter({ routeTree }) instance'ınız

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'blog',
  entry: () => import('./micro-apps/blog'),
  container: '#micro-app',
  activeWhen: '/blog/*',
});

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});

// Mikro uygulamalardaki düz <a href> → TanStack history.
interceptLinks({ navigate: (path) => router.history.push(path) });

await orchestrator.start();
```

`onResolved`, router yeni konumu çözümlediğinde tetiklenir. `onLoad` ile birlikte `setTimeout` kullanmak yerine bunu kullanın.

## React Router

`createBrowserRouter` ile oluşturulan bir data router ile:

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // createBrowserRouter(routes)

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'account',
  entry: () => import('./micro-apps/account'),
  container: '#micro-app',
  activeWhen: '/account/*',
});

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe(() => callback()),
  getPath: () => router.state.location.pathname,
});

interceptLinks({ navigate: (path) => router.navigate(path) });

await orchestrator.start();
```

`<BrowserRouter>` kullanıyorsanız abone olunabilecek bir router nesnesi yoktur. Köprüyü `useLocation()` okuyan bir bileşenden kurun:

```tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { Orchestrator, RouterSource } from 'tuvix.js';

export function TuvixBridge({ orchestrator }: { orchestrator: Orchestrator }) {
  const location = useLocation();
  const listeners = useRef(new Set<() => void>());
  const path = useRef<string>(location.pathname);
  path.current = location.pathname;

  useEffect(() => {
    const source: RouterSource = {
      subscribe(callback) {
        listeners.current.add(callback);
        return () => listeners.current.delete(callback);
      },
      getPath: () => path.current,
    };
    return orchestrator.connectRouter(source);
  }, [orchestrator]);

  useEffect(() => {
    for (const callback of listeners.current) callback();
  }, [location.pathname]);

  return null;
}
```

## Mikro uygulamalardaki düz linkler

Router'ınızın kendi `<Link>` bileşenleri zaten istemci tarafında navigasyon yapar. Mikro uygulamaların düz `<a href>` olarak render ettiği linkler yapmaz; `interceptLinks` olmadan sayfayı yeniden yükler. `interceptLinks`; değiştirici tuşlu tıklamaları, başka origin'leri, `target="_blank"`, `download`, `rel="external"`, `data-tuvix-reload` taşıyan linkleri ve geçerli path üzerindeki yalnızca hash içeren linkleri atlar, geri kalanlar için sizin `navigate` fonksiyonunuzu çağırır. Hover ya da focus anında sonraki route'u önceden hazırlamak için `prefetch` ekleyin. TanStack Router ile:

```ts
import { interceptLinks } from 'tuvix.js';
import { router } from './router';

const stop = interceptLinks({
  navigate: (path) => router.history.push(path),
  prefetch: (path) => void router.preloadRoute({ to: path }),
});
```

Shell unmount edildiğinde `stop()` çağırın.

## Base path'ler

`/app` gibi bir router basename'i ile:

- `activeWhen` pattern'leri, `getPath()` fonksiyonunun döndürdüğü string ile birebir eşleşir. Router'ınız path'leri `/app` ile bildiriyorsa `'/app/blog/*'` yazın ya da base'i `getPath` içinde atın.
- `interceptLinks({ base: '/app', ... })`, `/app` dışındaki linkleri yok sayar ve `navigate` çağırmadan önce `/app` kısmını atar. Router'ınızın `navigate` fonksiyonu basename'e göreli path bekliyorsa bunu kullanın (React Router'daki `router.navigate`). `navigate` tam URL path'i alıyorsa `base` vermeyin (TanStack'teki `router.history.push`).

## Route'ların render ettiği container'lar {#containers-rendered-by-routes}

Orchestrator, `container` elemanını mount anında arar. Container elemanını bir route bileşeni render ediyorsa router callback'i tetiklendiğinde eleman henüz DOM'da olmayabilir ve mount `Container "#micro-app" not found in DOM` hatasıyla başarısız olur. İki çözüm var:

- Container'ı mikro uygulama route'larının hepsinin paylaştığı bir layout'ta tutun. Böylece navigasyondan önce var olur.
- Mikro uygulamayı route bileşeninin içinden `TuvixIsland` (`@tuvix.js/react`) ile render edin ve o uygulama için orchestrator'ı kullanmayın.

## connectRouter'ın yapmadıkları

- Navigasyon yapmaz. Navigasyon sizin router'ınızda kalır.
- Route parametrelerini okumaz. Bunları `updateAppProps` ile props olarak gönderin ya da uygulamanın içinde okuyun.
- Link tıklamalarını ele almaz. Bunun için `interceptLinks` çağırın.

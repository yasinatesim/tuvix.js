# Yönlendirme

Tuvix.js hangi uygulamaların mount edileceğine geçerli path'e bakarak karar verir. Bunu her uygulamadaki `activeWhen` ile, yerleşik router'daki `routes` ile ya da ikisiyle birden tanımlarsınız. Bütün pattern'leri tek bir eşleştirici yorumlar: `@tuvix.js/router` paketindeki `matchPath`. Bu sayede `activeWhen`, router ve `@tuvix.js/server`, `/users/:id` ifadesini aynı şekilde anlar.

## Pattern kuralları

`activeWhen` string'leri önek eşleştirmesi kullanır:

| Pattern | Eşleşir | Eşleşmez | Parametreler |
| --- | --- | --- | --- |
| `/dashboard` | `/dashboard`, `/dashboard/`, `/dashboard/stats` | `/dashboards` | yok |
| `/dashboard/*` | `/dashboard` ile aynı path'ler | `/dashboards` | yok |
| `/users/:id` | `/users/42`, `/users/42/posts` | `/users` | `{ id: '42' }` |
| `/v:version/docs` | `/v2/docs` | `/2/docs` | `{ version: '2' }` |
| `/` | her path | yok | yok |

- Eşleştirici, eşleştirmeden önce `?query` ve `#hash` kısımlarını atar. Bu yüzden `/dashboard?tab=1` yine `/dashboard` ile eşleşir.
- Parametreleri decode eder: `/users/J%C3%BCrgen` sonucu `{ id: 'Jürgen' }` olur.
- `.` ve `(` gibi karakterler olduğu gibi eşleşir.
- Pattern'in ortasındaki `*` tek bir segmentle eşleşir.

Bir pattern'i kendiniz deneyin:

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/settings', '/settings/profile').matched; // true
matchPath('/settings', '/settings/profile', { end: true }).matched; // false
matchPath('/', '/about', { end: true }).matched; // false
```

## activeWhen ile uygulamaları etkinleştirme

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  activeWhen: '/users/:id',
});

orchestrator.register({
  name: 'header',
  entry: () => import('./apps/header'),
  container: '#header',
  activeWhen: '/', // her sayfa
});

await orchestrator.start();
```

Fonksiyon path'i alır ve boolean döndürür. Tam eşleşme, birden fazla önek ya da feature flag'ler için bunu kullanın.

## Yerleşik router

`createOrchestrator` fonksiyonuna `router` verin. Orchestrator, router'ın yaptığı her navigasyondan sonra reconcile eder:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/settings', app: 'settings' },
      { path: '/billing/*', app: 'billing' },
    ],
  },
});

orchestrator.register({ name: 'settings', entry: () => import('./apps/settings'), container: '#app' });
orchestrator.register({ name: 'billing', entry: () => import('./apps/billing'), container: '#app' });

await orchestrator.start();
await orchestrator.navigateTo('/billing/invoices');
```

`activeWhen` tanımlanmamış bir uygulama, kendi adını veren route'ları izler. `activeWhen` ile iki farkı vardır:

- Route path'leri tam eşleşir. `/settings`, `/settings` ve `/settings/` ile eşleşir, `/settings/profile` ile eşleşmez. Alt path'ler için `/*` ekleyin.
- Path'i `/` olan bir route, uygulamasını yalnızca `/` üzerinde etkinleştirir. Her path ile eşleşen bir route için `/*` kullanın.

Bir uygulamada `activeWhen` varsa orchestrator onu kullanır ve `routes` tanımını yok sayar.

Router, `popstate` (history modu) ya da `hashchange` (hash modu) olayını dinler. Link tıklamalarını yakalamaz; sonraki bölüme bakın.

## Link tıklamaları

`interceptLinks`, aynı origin'deki `<a href>` tıklamalarını sizin `navigate` fonksiyonunuza yapılan çağrılara dönüştürür ve bir temizleme fonksiyonu döndürür:

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

const stop = interceptLinks({
  navigate: (path) => orchestrator.navigateTo(path),
  prefetch: (path) => console.debug('user may open', path),
});

// daha sonra, shell sayfadan ayrılırken
stop();
```

Şu tıklamaları tarayıcıya bırakır:

- bir değiştirici tuşla (Ctrl, Meta, Shift, Alt) ya da birincil tuş dışındaki bir fare tuşuyla yapılanlar;
- `event.defaultPrevented` değeri zaten true olanlar;
- `target` değeri `_self` dışında olanlar, `download` niteliği, `rel="external"` ya da `data-tuvix-reload` taşıyanlar;
- başka bir origin'e ya da `base` dışındaki bir path'e gidenler;
- geçerli path üzerindeki yalnızca hash içeren linkler; böylece tarayıcı kaydırmayı kendisi yapar.

`prefetch(path)`, pointerenter ya da focus olayında her path için bir kez çalışır. `shouldIntercept(anchor, url, event)` ile kendi filtrenizi ekleyebilirsiniz; tıklamayı tarayıcıya bırakmak için `false` döndürün. `root`, dinlemeyi tek bir elemanla sınırlar.

## Navigasyon ve guard'lar

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/users/:id', app: 'user' }] });

const offGuard = router.beforeEach(async ({ to }) => {
  if (!to.startsWith('/admin')) return true;
  const response = await fetch('/api/me');
  return response.ok;
});

const offChange = router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} → ${to}`, toRoute?.params);
});

await router.push('/users/42'); // pushState
await router.replace('/users/43'); // replaceState
router.back();

router.currentPath; // '/users/43'
router.currentRoute?.params; // { id: '43' }
router.currentRoute?.query; // ayrıştırılmış ?query
router.match('/users/7'); // MatchedRoute | null, navigasyon yapmaz
router.getActiveApps('/users/7'); // ['user']

offGuard();
offChange();
router.destroy();
```

- Guard'lar `push`, `replace` ve geri/ileri navigasyonundan önce sırayla çalışır. `false` navigasyonu iptal eder. Hata fırlatan bir guard navigasyonu iptal eder ve hatayı loglar.
- İptal edilen bir geri/ileri navigasyonu, önceki URL'i `replaceState` ile geri yükler.
- Geçerli path'e yapılan `push` hiçbir şey yapmaz.
- `router.match` eşleşen ilk route'u döndürür; `getActiveApps` ise route'u eşleşen her uygulamayı döndürür.

## Base path

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { base: '/app', routes: [{ path: '/reports/*', app: 'reports' }] },
});

interceptLinks({ base: '/app', navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.navigateTo('/reports'); // URL /app/reports olur
```

`base: '/app'` ile:

- router eşleştirmeden önce `/app` kısmını atar, bu yüzden route'lar ve `activeWhen` pattern'leri bu kısmı içermez;
- `push('/x')` ve `replace('/x')`, `/app/x` yazar;
- `/application`, `/application` olarak kalır: base yalnızca segment sınırında atılır;
- `interceptLinks` aynı `base` değerine ihtiyaç duyar. Aksi halde `/app/x` path'ini `navigateTo` fonksiyonuna verir ve o da `/app/app/x` yazar.

## Hash modu

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ mode: 'hash', routes: [{ path: '/about', app: 'about' }] });
await router.push('/about'); // URL: /#/about
```

Her path'i `index.html` dosyasına yönlendiremeyen statik hosting'lerde bunu kullanın. Router, hash modunda `base` değerini yok sayar.

## Bir uygulamada parametreleri okuma

Mount context parametre içermez. Parametreleri path'ten okuyun ya da props olarak gönderin:

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { routes: [{ path: '/users/:id', app: 'user' }] },
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  props: { id: matchPath('/users/:id', location.pathname).params.id },
});

orchestrator.getRouter()?.onChange(({ toRoute }) => {
  if (toRoute?.route.app === 'user') {
    void orchestrator.updateAppProps('user', { id: toRoute.params.id });
  }
});

await orchestrator.start();
```

## Harici router'lar

Navigasyonu TanStack Router, React Router ya da başka bir router yönetiyorsa `config.router` kullanmayın ve `orchestrator.connectRouter({ subscribe, getPath })` çağırın. Bkz. [Harici router](/tr/guide/external-router).

## Yönlendirmenin yapmadıkları

- Route bileşenlerini render etmez. Uygulamalar kendilerini container'lara render eder.
- Veri yüklemez. Bir guard, `onChange` ya da uygulamanın kendi `mount` fonksiyonunu kullanın.
- `interceptLinks` çağırmadığınız sürece router link tıklamalarını ele almaz.

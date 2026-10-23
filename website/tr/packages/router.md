---
title: '@tuvix.js/router'
---

<PackageHeader
  name="@tuvix.js/router"
  title="Router"
  description="Mikro uygulamalar için history ve hash yönlendirmesi, core ve sunucuyla ortak tek bir path eşleştirici ve istemci tarafı navigasyon için link yakalama."
  icon="🔀"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

`@tuvix.js/core` bu pakete bağımlıdır ve `createRouter`, `matchPath` ile `interceptLinks` fonksiyonlarını yeniden dışa aktarır. Bu üçünü core'dan da import edebilirsiniz.

## Ne zaman kullanılır

Router, URL path'lerini mikro uygulama adlarıyla eşler ve path değiştiğinde size haber verir. Navigasyonu shell yönetiyorsa ve bir URL için hangi mikro uygulamanın aktif olacağına shell karar veriyorsa kullanın. `createOrchestrator` fonksiyonuna `router` verdiğinizde orchestrator router'ı sizin yerinize oluşturur. Bu yüzden çoğu shell router'ı elle kurmaz.

`matchPath`, Tuvix.js'teki tek pattern eşleştiricidir. Core onu `activeWhen` string'leri için, `@tuvix.js/server` ise uygulama `routes` değerleri için kullanır. Böylece bir pattern üç yerde de aynı anlama gelir. Fonksiyonu router olmadan, tek başına da çağırabilirsiniz.

Shell'iniz zaten React Router, TanStack Router ya da başka bir framework router'ı çalıştırıyorsa onu bırakmayın. `@tuvix.js/core` paketindeki `orchestrator.connectRouter({ subscribe, getPath })` ile orchestrator'a bağlayın ve bu router'ı atlayın. `matchPath` ve `interceptLinks` fonksiyonlarını onunla birlikte kullanmaya devam edebilirsiniz.

## Hızlı başlangıç

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
    { path: '/settings', app: 'settings' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

router.beforeEach(({ from }) => !from.startsWith('/settings') || confirm('Discard unsaved settings?'));

// <a href="/app/users/42"> now calls router.push('/users/42') instead of reloading.
const stopLinks = interceptLinks({
  navigate: (path) => router.push(path),
  base: '/app',
});

await router.push('/users/42?tab=posts');
console.log(router.currentPath); // '/users/42?tab=posts'
console.log(router.currentRoute?.params); // { id: '42' }
console.log(window.location.pathname); // '/app/users/42'

// On teardown:
stopLinks();
router.destroy();
```

Router, `popstate` (history modu) ya da `hashchange` (hash modu) dinleyicisini constructor içinde ekler. Ayrıca bir `start()` çağrısı yoktur.

Orchestrator ile aynı yapılandırmayı `router` olarak verin ve navigasyonu orchestrator üzerinden yapın:

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { interceptLinks } from '@tuvix.js/router';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

`activeWhen` değeri olmayan bir uygulama, kendi adını taşıyan `routes` girdilerini izler. `orchestrator.getRouter()` çağrısı `IRouter` instance'ını döndürür.

## API

### `createRouter`

```ts
import type { IRouter, RouterConfig } from '@tuvix.js/router';

declare function createRouter(config: RouterConfig): IRouter;
```

`IRouter` tipinde `new Router(config)` döndürür.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | zorunlu | Route tablosu. Router route'ları dizideki sırayla dener ve ilk eşleşen kazanır. |
| `mode` | `'history' \| 'hash'` | `'history'` | `history`, `location.pathname + location.search` değerini okur ve `pushState` ile yazar. `hash`, `#/path` biçiminde okur ve yazar. |
| `base` | `string` | `'/'` | Uygulamanın sunulduğu path öneki, yalnızca history modunda. Router URL'i okurken bu öneki çıkarır, yazarken ekler. Hash modu onu yok sayar. |

Her `RouteConfig`:

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `path` | `string` | zorunlu | `matchPath` sözdiziminde pattern, path'in tamamıyla eşleştirilir. `'/'` yalnızca ana sayfayla, `'/*'` her path'le, `'/blog/*'` ise `/blog` ve altındaki her şeyle eşleşir. |
| `app` | `string` | zorunlu | Aktif edilecek mikro uygulamanın adı. |
| `meta` | `Record<string, unknown>` | yok | Size ait veri. Router onu `MatchedRoute.route.meta` üzerinden olduğu gibi aktarır. |

### `Router`

```ts
import { Router } from '@tuvix.js/router';

const router = new Router({ routes: [{ path: '/cart', app: 'cart' }] });
```

`createRouter` fonksiyonunun arkasındaki sınıf. `IRouter` arayüzünü uygular:

| Üye | İmza | Davranış |
| --- | --- | --- |
| `currentPath` | `readonly string` | `base` olmadan, uygulamaya göreli path. History modunda query string'i de içerir. |
| `currentRoute` | `readonly MatchedRoute \| null` | `match(currentPath)` sonucu. |
| `push` | `(path: string) => Promise<void>` | Guard'ları çalıştırır, URL'i `history.pushState` ile yazar (history modunda `base + path`, hash modunda `#path`), ardından `onChange` handler'larını çalıştırır. |
| `replace` | `(path: string) => Promise<void>` | `push` ile aynıdır ama `history.replaceState` kullanır. |
| `back` | `() => void` | `window.history.back()` çağırır. |
| `forward` | `() => void` | `window.history.forward()` çağırır. |
| `onChange` | `(handler: RouteChangeHandler) => () => void` | Tamamlanan her navigasyondan sonra `handler` fonksiyonunu çalıştırır. Aboneliği iptal eden bir fonksiyon döndürür. |
| `beforeEach` | `(guard: NavigationGuard) => () => void` | Bir guard ekler. Guard'ı kaldıran bir fonksiyon döndürür. |
| `match` | `(path: string) => MatchedRoute \| null` | `path` ile eşleşen ilk route ya da `null`. |
| `getActiveApps` | `(path?: string) => string[]` | `path` değerinin tamamıyla eşleşen her route'un uygulama adı (varsayılan: `currentPath`), route sırasıyla ve tekrarsız. |
| `destroy` | `() => void` | Window dinleyicisini kaldırır, handler'ları ve guard'ları temizler. |

`push` ve `replace` fonksiyonlarına `base` değerine göreli bir path verin. `base: '/app'` ile `router.push('/x')` çağrısı `/app/x` yazar ve `currentPath` değeri `/x` olur.

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  base: '/app',
  routes: [
    { path: '/*', app: 'header' },
    { path: '/docs/*', app: 'docs' },
    { path: '/docs/:page', app: 'doc-sidebar' },
  ],
});

router.match('/docs/intro')?.route.app; // 'header' (first match wins)
router.getActiveApps('/docs/intro'); // ['header', 'docs', 'doc-sidebar']
router.getActiveApps('/'); // ['header']
await router.replace('/docs/intro'); // URL: /app/docs/intro, no new history entry
router.back();
```

`match`, `getActiveApps` ve `isPathActive` aynı tam path kurallarını uygular. `'/'` route'u yalnızca `/` üzerinde aktiftir. Her sayfada görünen bir uygulama için `'/*'` kullanın.

#### Guard'lar

Guard'lar, URL değişmeden önce eklendikleri sırayla ve tek tek çalışır. `false` ile resolve olan bir guard navigasyonu iptal eder ve kalan guard'lar atlanır. Başka her değer navigasyonun devam etmesine izin verir. Hata fırlatan ya da reject olan bir guard navigasyonu iptal eder ve router hatayı `console.error` ile loglar.

```ts
import { createRouter } from '@tuvix.js/router';

declare function isAdmin(): Promise<boolean>;

const router = createRouter({
  routes: [{ path: '/admin/*', app: 'admin' }],
});

const removeGuard = router.beforeEach(async ({ to }) => {
  if (to.startsWith('/admin')) return isAdmin();
  return true;
});

removeGuard();
```

Guard'lar tarayıcının geri ve ileri düğmelerinde de çalışır. Bu noktada tarayıcı zaten yeni adrese geçmiştir. Bu yüzden bir guard iptal ettiğinde router, önceki URL'i (`base` ile birlikte) adres çubuğuna geri koymak için `history.replaceState` çağırır. History girdisi, tarayıcının taşıdığı yerde kalır.

### `matchPath` {#matchpath}

```ts
import type { MatchPathOptions, PathMatch } from '@tuvix.js/router';

declare function matchPath(
  pattern: string,
  path: string,
  options?: MatchPathOptions
): PathMatch;
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | `true` olduğunda `/*` içermeyen bir pattern path'in tamamıyla eşleşmek zorundadır. `false` olduğunda alt path'lerle de eşleşir. |

`{ matched, params }` döndürür. Kurallar:

- Eşleştirici `path` içindeki `?query` ve `#hash` kısımlarını atar, iki taraftaki sondaki eğik çizgiyi de yok sayar.
- `:name`, boş olmayan tek bir segmenti URI-decode edip `params.name` içine alır. Percent-encoding'i bozuk olan bir değer yazıldığı gibi kalır. Bir segment metinle parametreleri karıştırabilir: `/v:version`, `/v2` ile eşleşir.
- Sondaki `/*`, temel path'le ve altındaki her şeyle eşleşir: `/docs/*`, `/docs` ve `/docs/a/b` ile eşleşir. Kalan kısım `params` içine alınmaz.
- Pattern'in ortasındaki `*` tek bir segmentle eşleşir.
- Varsayılan olarak düz bir pattern, segment sınırında kendi alt path'leriyle eşleşir: `/docs`, `/docs/intro` ile eşleşir ama `/docsify` ile eşleşmez.
- `'/'` varsayılan olarak her path'le eşleşir. `{ end: true }` ile yalnızca `/` ile eşleşir. Router route'ları her zaman `end: true` kurallarını kullanır. Core `activeWhen` string'leri ve `@tuvix.js/server` uygulama `routes` değerleri varsayılan önek kurallarını kullanır.
- Pattern'deki diğer regex karakterleri harfiyen eşleşir. Eşleştirme büyük/küçük harfe duyarlıdır.

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts#bio'); // { matched: true, params: { id: '42' } }
matchPath('/files/:name', '/files/a%20b.txt').params.name; // 'a b.txt'
matchPath('/docs', '/docs/intro').matched; // true
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
matchPath('/docs', '/docsify').matched; // false
matchPath('/', '/anything').matched; // true
matchPath('/a/*/c', '/a/b/c').matched; // true
```

Eşleştirici her pattern'i bir kez derler ve `RegExp` nesnesini önbelleğe alır. Bu yüzden onu her navigasyonda çağırabilirsiniz.

### `matchRoute`

```ts
import type { MatchedRoute, RouteConfig } from '@tuvix.js/router';

declare function matchRoute(path: string, routes: RouteConfig[]): MatchedRoute | null;
```

`path` alanı verilen `path` değerinin tamamıyla eşleşen (`end: true` kuralları) ilk route'u döndürür. Sonuçta temizlenmiş path, decode edilmiş parametreler ve ayrıştırılmış query de yer alır. `#hash` kısmını yok sayar. `Router.match` bu fonksiyonu çağırır.

```ts
import { matchRoute } from '@tuvix.js/router';

matchRoute('/users/42?tab=info', [{ path: '/users/:id', app: 'users' }]);
// { route: { path: '/users/:id', app: 'users' }, path: '/users/42', params: { id: '42' }, query: { tab: 'info' } }
```

### `isPathActive`

```ts
declare function isPathActive(path: string, pattern: string): boolean;
```

`matchPath(pattern, path, { end: true }).matched` ile aynıdır: route'ların kullandığı tam path kuralları. Bu yüzden `'/'` yalnızca `/` üzerinde aktiftir. `Router.getActiveApps` bu fonksiyonu kullanır.

```ts
import { isPathActive } from '@tuvix.js/router';

isPathActive('/settings/profile', '/settings'); // false
isPathActive('/settings/profile', '/settings/*'); // true
isPathActive('/settings/profile', '/'); // false
isPathActive('/settings/profile', '/*'); // true
```

### `pathToRegex`

```ts
declare function pathToRegex(pattern: string): { regex: RegExp; paramNames: string[] };
```

Bir pattern için derlenmiş, tam eşleşen `RegExp` nesnesini ve parametre adlarını sırasıyla döndürür. `regex` nesnesi ortak önbellekten gelir: `lastIndex` değerini ya da başka bir durumunu değiştirmeyin. Regex, query ve hash içermeyen normalize edilmiş bir path üzerinde çalışır. Path bunları içerebiliyorsa `matchPath` kullanın.

```ts
import { pathToRegex } from '@tuvix.js/router';

const { regex, paramNames } = pathToRegex('/posts/:slug');
regex.test('/posts/hello'); // true
paramNames; // ['slug']
```

### `parseQuery`

```ts
declare function parseQuery(queryString: string): Record<string, string>;
```

Baştaki `?` olsun ya da olmasın `a=1&b=2` biçimini ayrıştırır. Her çifti ilk `=` karakterinden böler. Böylece JWT gibi değerler kendi `=` karakterlerini korur. Anahtarları ve değerleri decode eder, decode başarısız olursa ham metni korur. `=` içermeyen bir anahtar `''` değerini alır. Tekrarlanan bir anahtar son değeri tutar.

```ts
import { parseQuery } from '@tuvix.js/router';

parseQuery('?token=abc.def=ghi&debug'); // { token: 'abc.def=ghi', debug: '' }
```

### `normalizePath`

```ts
declare function normalizePath(path: string): string;
```

Başa bir eğik çizgi ekler ve sondaki tek eğik çizgiyi kaldırır. Query'ye ve hash'e dokunmaz.

```ts
import { normalizePath } from '@tuvix.js/router';

normalizePath('users/42/'); // '/users/42'
```

### `interceptLinks`

```ts
import type { InterceptLinksOptions } from '@tuvix.js/router';

declare function interceptLinks(options: InterceptLinksOptions): () => void;
```

`root` altındaki `<a href>` elemanlarına yapılan tıklamaları dinler, ele aldığı tıklamalarda `preventDefault()` çağırır ve link path'ini `navigate` fonksiyonuna verir. Eklediği tüm dinleyicileri kaldıran bir fonksiyon döndürür.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | zorunlu | `base` çıkarılmış `pathname + search + hash` değerini alır. Fonksiyon, fırlatılan hatayı ya da reject olan promise'i `console.error` ile loglar. |
| `root` | `Document \| HTMLElement` | `document` | Tıklama dinleyicisinin bağlandığı eleman. |
| `base` | `string` | `'/'` | Uygulamanın sunulduğu path öneki. Bunun dışındaki linkleri tarayıcı açar. Fonksiyon, `navigate` ve `prefetch` çağırmadan önce bu öneki çıkarır. |
| `shouldIntercept` | `(anchor: HTMLAnchorElement, url: URL, event: MouseEvent) => boolean` | yok | Yerleşik kontrollerden sonra çalışır. Tıklamayı tarayıcıya bırakmak için `false` döndürün. |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | yok | Uygun bir link üzerinde `pointerenter` ya da `focusin` olduğunda, her `pathname + search` için bir kez çalışır. Path hash içermez. |

`interceptLinks`, aşağıdakilerden biri geçerliyse tıklamayı tarayıcıya bırakır:

- Başka bir handler zaten `preventDefault()` çağırmıştır.
- Basılan düğme birincil düğme değildir ya da Ctrl, Meta, Shift veya Alt basılıdır.
- Anchor'ın `_self` dışında bir `target` değeri, bir `download` attribute'u, `external` içeren bir `rel` değeri ya da bir `data-tuvix-reload` attribute'u vardır.
- Çözümlenen URL'in origin'i sayfanınkinden farklıdır.
- URL path'i `base` dışındadır (`/app`, `/app` ve `/app/...` path'lerini kapsar, `/application` path'ini kapsamaz).
- Linkte bir hash vardır ve path ile query mevcut sayfayla aynıdır. Tarayıcı sayfayı anchor'a kaydırır.
- `shouldIntercept` fonksiyonu `false` döndürür.

`prefetch`, attribute, origin ve `base` kontrollerini uygular. Modifier tuşlarını ve yalnızca hash kuralını yok sayar, mevcut sayfaya giden bir link için de tetiklenir.

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/shop/*', app: 'shop' }] });
const nav = document.querySelector('nav') ?? document;

const stop = interceptLinks({
  navigate: (path) => router.push(path),
  root: nav,
  shouldIntercept: (anchor) => !anchor.closest('[data-legacy]'),
  prefetch: (path) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.append(link);
  },
});

stop();
```

`interceptLinks` anchor'ı [`resolveLink`](#resolvelink) ile bulur. Bu sayede açık shadow root'ların içindeki linkler de çalışır, SVG `<a>` elemanları ise tarayıcıya bırakılır. `document` ya da `window` bulunmayan bir ortamda hiçbir şey yapmayan bir temizleme fonksiyonu döndürür.

### `resolveLink` {#resolvelink}

```ts
import type { ResolvedLink, ResolveLinkOptions } from '@tuvix.js/router';

declare function resolveLink(
  event: Event,
  options?: ResolveLinkOptions
): ResolvedLink | null;
```

Bir olayın gerçekleştiği `<a href>` elemanını bulur ve onu mutlak URL'i ve uygulamaya göreli path'iyle birlikte döndürür. Linki tarayıcının ele alması gerekiyorsa `null` döndürür. `interceptLinks` ve orchestrator'ın `prefetch: { strategy: 'hover' }` seçeneği bu fonksiyonu kullanır. Aynı link kurallarına ihtiyaç duyduğunuzda, örneğin hover sırasında veriyi önceden yüklemek ya da uygulama içi navigasyonu loglamak için, onu kendi dinleyicilerinizden çağırın.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `base` | `string` | `'/'` | Uygulamanın sunulduğu path öneki. Bunun dışındaki bir link için `null` döner. Fonksiyon bu öneki `path` değerinden çıkarır. |

| Alan | Tip | Anlamı |
| --- | --- | --- |
| `anchor` | `HTMLAnchorElement` | `<a>` elemanı. |
| `url` | `URL` | Linkin mutlak URL'i. |
| `path` | `string` | `base` çıkarılmış `pathname + search + hash`. |

```ts
import { resolveLink } from '@tuvix.js/router';

const warmed = new Set<string>();

function warmUp(event: Event): void {
  const link = resolveLink(event, { base: '/app' });
  if (!link || warmed.has(link.url.pathname)) return;
  warmed.add(link.url.pathname);
  void fetch(`/api/page-data?path=${encodeURIComponent(link.path)}`);
}

// pointerenter does not bubble, so listen in the capture phase.
document.addEventListener('pointerenter', warmUp, true);
document.addEventListener('focusin', warmUp);
```

`resolveLink`, aşağıdakilerden biri geçerliyse `null` döndürür:

- Olay yolundaki en yakın `<a>` bir SVG `<a>` elemanıdır, `href` içermeyen bir HTML `<a>` elemanıdır ya da hiç `<a>` yoktur. Arama, karşılaştığı ilk `<a>` elemanında durur.
- Anchor'ın `_self` dışında bir `target` değeri, bir `download` attribute'u, `external` içeren bir `rel` değeri ya da bir `data-tuvix-reload` attribute'u vardır.
- URL'in origin'i sayfanınkinden farklıdır.
- URL path'i `base` dışındadır (`/app`, `/app` ve `/app/...` path'lerini kapsar, `/application` path'ini kapsamaz).
- Sunucuda olduğu gibi `window` yoktur.

Fonksiyon `event.composedPath()` değerini okur. Bu yüzden `document` üzerindeki bir dinleyici açık shadow root'ların içindeki linkleri de bulur. Kapalı shadow root'ların içindeki linkleri göremez. Fonksiyonu olay dispatch edilirken çağırın: dispatch bittiğinde composed path boştur ve fonksiyon `event.target.closest('a')` çağrısına geri döner. Bu çağrı bir shadow root'un içine bakamaz.

Fare düğmesini, modifier tuşlarını, `defaultPrevented` değerini ve yalnızca hash kuralını kontrol etmez. `interceptLinks` tıklamalar için bunları ayrıca uygular.

### Tipler

| Tip | Anlamı |
| --- | --- |
| `RouterMode` | `'history' \| 'hash'`. |
| `RouterConfig` | `{ mode?, base?, routes }`, `createRouter` seçenekleri. |
| `RouteConfig` | `{ path, app, meta? }`, tek bir route. |
| `MatchedRoute` | `{ route, path, params, query }`. `path` temizlenmiş pathname, `params` decode edilmiş `:param` değerleri, `query` ayrıştırılmış query string'dir. |
| `NavigationEvent` | `{ from, to, fromRoute, toRoute }`. `from` ve `to`, `base` olmadan uygulamaya göreli path'lerdir. |
| `NavigationGuard` | `(event: NavigationEvent) => boolean \| Promise<boolean>`. |
| `RouteChangeHandler` | `(event: NavigationEvent) => void`. |
| `IRouter` | `Router` sınıfının uyguladığı ve `createRouter` fonksiyonunun döndürdüğü arayüz. |
| `PathMatch` | `{ matched: boolean; params: Record<string, string> }`, `matchPath` sonucu. Eşleşme yoksa `params` değeri `{}` olur. |
| `MatchPathOptions` | `{ end?: boolean }`. |
| `InterceptLinksOptions` | `interceptLinks` seçenekleri. |
| `ResolveLinkOptions` | `{ base?: string }`, `resolveLink` seçenekleri. |
| `ResolvedLink` | `{ anchor: HTMLAnchorElement; url: URL; path: string }`, `resolveLink` sonucu. |

## Sınır durumlar

- Zaten bulunduğunuz path'e (query dahil aynı string) yapılan `push` ve `replace` çağrıları guard'ları ya da handler'ları çalıştırmadan döner.
- Siz yeni bir navigasyon başlattığınızda router bekleyen navigasyonu iptal etmez. Her `push` kendi guard'larını bekler, sonra URL'i yazar. Bu yüzden en son biten guard zinciri kazanır.
- Router URL değişikliklerini kendi `push`/`replace` çağrılarından ve `popstate`/`hashchange` olaylarından öğrenir. Başka bir kod `history.pushState` çağırırsa `currentPath` bir sonraki olaya ya da router navigasyonuna kadar eski kalır.
- `destroy()` sonrasında `push`, `replace`, `back`, `forward`, `onChange` ve `beforeEach` şu hatayı fırlatır: `[Tuvix Router] Cannot use a destroyed Router. Create a new one.` `match` ve `getActiveApps` çalışmaya devam eder.
- Router, hata fırlatan bir `onChange` handler'ını `console.error` ile loglar ve diğer handler'ları yine de çağırır.
- `base: '/app'` ile router `/application` path'ini `/application` olarak okur: base'i yalnızca segment sınırında çıkarır. History modunda URL'i okurken `#hash` kısmını atar.
- Sunucuda (`window` yokken) constructor `currentPath` değerini `'/'` yapar ve dinleyici eklemez. `push`, `replace`, `back` ve `forward` için `window` gerekir.
- `/*` içeren bir pattern ile `matchPath` temel path'in kendisiyle de eşleşir: `/dashboard/*`, `/dashboard` ile eşleşir.
- Bir `<svg>` içindeki `<a>` üzerinde gerçekleşen olay, SVG'yi bir HTML `<a>` sarsa bile `null` sonucunu verir. `interceptLinks` ve orchestrator'ın hover prefetch'i bu linki tarayıcıya bırakır, tarayıcı da sayfanın tamamını yükler.

## Ne yapmaz

- Mikro uygulamaları mount ya da unmount etmez. Eşleşmeleri ve değişiklikleri bildirir. Bunlara göre `@tuvix.js/core` içindeki orchestrator hareket eder.
- Siz `interceptLinks` çağırmadıkça link tıklamalarını yakalamaz.
- İç içe route'lar, isimli route'lar, yönlendirmeler (redirect) ve route başına guard'lar yoktur. `beforeEach` kullanın ve `to` ya da `toRoute` değerini kontrol edin.
- Path'in `/*` ile eşleşen geri kalanını `params` içine almaz.
- Kaydırma konumunu geri yüklemez.

## 0.4 sürümünden geçiş

`push()` ve `replace()` artık `base` önekini ekler. `base` değerine göreli path'ler verin:

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ base: '/app', routes: [] });

// 0.4: router.push('/app/x') wrote /app/x, router.push('/x') wrote /x
// 0.5: router.push('/x') writes /app/x
await router.push('/x');
```

Diğer breaking change'ler:

- `base` yalnızca segment sınırında çıkarılır: `/application` artık `/lication` olarak okunmaz.
- Route'lar `match`, `getActiveApps` ve `isPathActive` içinde path'in tamamıyla eşleşir. 0.4'te `getActiveApps` ve `isPathActive`, `'/'` route'unu her path'te aktif sayıyordu. Her şeyi yakalayan `{ path: '/', app }` route'unu `{ path: '/*', app }` olarak değiştirin.
- `RouteConfig.exact` kaldırıldı. Kabul ediliyor ama yok sayılıyordu. Route nesnelerinizden silin.
- `pathToRegex(pattern)` ikinci argümanı olan `exact` parametresini kaybetti ve önbellekteki bir `RegExp` döndürür.
- Pattern'lerdeki regex karakterleri harfiyen eşleşir. Pattern'in ortasındaki `*` tek bir segmentle eşleşir.
- `matchRoute()` ve `isPathActive()` path içindeki `#hash` kısmını yok sayar.
- 0.4 dokümanları `navigate`, `go` ve `onRouteChange` fonksiyonlarını, bir router `orchestrator` seçeneğini ve route başına bir `guard` alanını listeliyordu. Bunların hiçbiri yok. `push`, `back`/`forward`, `onChange`, orchestrator'ın `router` yapılandırmasını ve `beforeEach` kullanın.

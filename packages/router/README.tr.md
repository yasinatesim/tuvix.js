# @tuvix.js/router

> Mikro uygulamalar için history ve hash yönlendirmesi, ortak `matchPath` eşleştirici ve link yakalama

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır. Tüm dokümanlar: [tuvix.js.org/tr/packages/router](https://tuvix.js.org/tr/packages/router).

Router, URL path'lerini mikro uygulama adlarıyla eşler ve path değiştiğinde size haber verir. `matchPath`, core `activeWhen` ve `@tuvix.js/server` paketinin de kullandığı pattern eşleştiricidir. Shell'iniz zaten React Router ya da TanStack Router çalıştırıyorsa onu bunun yerine `@tuvix.js/core` paketindeki `orchestrator.connectRouter()` ile bağlayın.

## Kurulum

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

## Hızlı başlangıç

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

const stopLinks = interceptLinks({ navigate: (path) => router.push(path), base: '/app' });

await router.push('/users/42'); // URL: /app/users/42, currentPath: '/users/42'

stopLinks();
router.destroy();
```

Constructor `popstate` ya da `hashchange` dinleyicisini ekler. Ayrıca bir `start()` çağrısı yoktur.

## API

### `createRouter(config)` ve `Router`

`createRouter(config)`, `IRouter` tipinde `new Router(config)` döndürür.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | zorunlu | `{ path, app, meta? }`. Sırayla denenir, ilk eşleşen kazanır. Path'ler path'in tamamıyla eşleşir: `'/'` yalnızca ana sayfa, `'/*'` her path, `'/blog/*'` ise `/blog` ve altı demektir. |
| `mode` | `'history' \| 'hash'` | `'history'` | `history`, `pushState` ve `location.pathname + search` kullanır. `hash`, `#/path` kullanır. |
| `base` | `string` | `'/'` | History modu öneki. Okurken çıkarılır (yalnızca segment sınırında), yazarken eklenir. |

| Üye | Davranış |
| --- | --- |
| `currentPath`, `currentRoute` | Uygulamaya göreli path (history modunda query dahil) ve onun `MatchedRoute \| null` değeri. |
| `push(path)`, `replace(path)` | `Promise<void>`. Guard'ları çalıştırır, `base + path` (ya da `#path`) yazar, `onChange` handler'larını çalıştırır. Path aynıysa hiçbir şey yapmaz. |
| `back()`, `forward()` | `window.history.back()` / `forward()`. |
| `onChange(handler)` | Tamamlanan her navigasyondan sonra çalışır. Aboneliği iptal eden bir fonksiyon döndürür. |
| `beforeEach(guard)` | Guard'lar sırayla çalışır. `false`, fırlatılan bir hata ya da reject navigasyonu iptal eder. Geri/ileri navigasyonda router önceki URL'i `replaceState` ile geri koyar. Guard'ı kaldıran bir fonksiyon döndürür. |
| `match(path)` | İlk eşleşen route ya da `null`. |
| `getActiveApps(path?)` | Path'in tamamıyla eşleşen her route'un uygulamaları, tekrarsız. `'/'` route'u yalnızca `/` üzerinde aktiftir. Her sayfa için `'/*'` kullanın. |
| `destroy()` | Dinleyicileri kaldırır. Sonraki `push`, `replace`, `back`, `forward`, `onChange`, `beforeEach` çağrıları hata fırlatır. |

### `matchPath(pattern, path, options?)`

`{ matched, params }` döndürür.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | `/*` içermeyen bir pattern'in path'in tamamıyla eşleşmesini zorunlu kılar. |

- `?query` ve `#hash` kısımlarını atar, sondaki eğik çizgiyi yok sayar.
- `:name` tek bir segmenti URI-decode ederek yakalar. Sondaki `/*`, temel path'le ve altındaki her şeyle eşleşir. Geri kalan kısım yakalanmaz. Ortadaki `*` tek bir segmentle eşleşir.
- Varsayılan olarak `/docs`, `/docs/intro` ile eşleşir ama `/docsify` ile eşleşmez. `'/'` ise her path'le eşleşir. `{ end: true }` ile `'/'` yalnızca `/` ile eşleşir. Router route'ları `end: true` kurallarını, core `activeWhen` ve `@tuvix.js/server` route'ları ise varsayılan önek kuralını kullanır.
- Derlenen pattern'ler önbelleğe alınır. Eşleştirme büyük/küçük harfe duyarlıdır.

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
```

### Yardımcılar

| Export | Davranış |
| --- | --- |
| `matchRoute(path, routes)` | İlk tam eşleşmeyi `{ route, path, params, query }` biçiminde ya da `null` döndürür. `#hash` kısmını yok sayar. |
| `isPathActive(path, pattern)` | `matchPath(pattern, path, { end: true }).matched`, yani route'ların kullandığı tam path kuralları. |
| `pathToRegex(pattern)` | Önbellekteki, tam eşleşen `{ regex, paramNames }`. `regex` nesnesini değiştirmeyin. |
| `parseQuery(query)` | `'?a=1&b'` değerini `{ a: '1', b: '' }` nesnesine çevirir. İlk `=` karakterinden böler, decode eder, encoding bozuksa ham metni korur. |
| `normalizePath(path)` | Başa bir eğik çizgi ekler, sondaki tek eğik çizgiyi kaldırır. |

### `interceptLinks(options)`

Aynı origin'deki `<a href>` tıklamalarını `navigate(path)` çağrılarına çevirir. Bir temizleme fonksiyonu döndürür.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | zorunlu | `base` olmadan `pathname + search + hash` alır. Hatalar loglanır. |
| `root` | `Document \| HTMLElement` | `document` | Tıklama dinleyicisinin bağlandığı yer. |
| `base` | `string` | `'/'` | Bunun dışındaki linkleri tarayıcı açar. `navigate`/`prefetch` çağrılmadan önce çıkarılır. |
| `shouldIntercept` | `(anchor, url, event) => boolean` | yok | Tıklamayı tarayıcıya bırakmak için `false` döndürün. Yerleşik kontrollerden sonra çalışır. |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | yok | `pointerenter` ya da `focusin` olayında, her `pathname + search` için bir kez çalışır. |

Tıklama şu durumlarda tarayıcıda kalır: başka bir handler `preventDefault()` çağırmıştır, birincil olmayan bir düğmeye ya da Ctrl/Meta/Shift/Alt tuşuna basılmıştır, `target` değeri `_self` dışındadır, `download` vardır, `rel` içinde `external` geçer, `data-tuvix-reload` vardır, link başka bir origin'e gider, path `base` dışındadır, link mevcut path ve query'ye giden bir hash linkidir ya da `shouldIntercept` `false` döndürür. Açık shadow root'ların içindeki linkler ele alınır. SVG `<a>` elemanları tarayıcıya bırakılır.

### `resolveLink(event, options?)`

Bir olayın gerçekleştiği HTML `<a href>` için `{ anchor, url, path }` döndürür. Linki tarayıcının ele alması gerekiyorsa `null` döndürür. `path`, `base` olmadan `pathname + search + hash` değeridir. `interceptLinks` ve orchestrator'ın hover prefetch'i bu fonksiyonu kullanır. Aynı kuralları uygulamak için onu kendi dinleyicilerinizden çağırın.

```ts
import { resolveLink } from '@tuvix.js/router';

document.addEventListener('focusin', (event) => {
  const link = resolveLink(event, { base: '/app' });
  if (link) console.log('next page might be', link.path);
});
```

Şu durumlarda `null` döndürür: bir SVG `<a>`, `href` içermeyen bir `<a>` ya da hiç `<a>` olmaması (olay yolundaki en yakın `<a>` belirler), `_self` dışında bir `target`, `download`, `external` içeren bir `rel`, `data-tuvix-reload`, başka bir origin, `base` dışındaki bir path, `window` olmaması. `event.composedPath()` değerini okur. Bu yüzden açık shadow root'lardaki linkleri bulur, kapalı olanlardakileri bulamaz. Fonksiyonu dispatch sırasında çağırın. Düğmeleri, modifier tuşlarını ve yalnızca hash içeren linkleri kontrol etmez.

### Tipler

`RouterMode`, `RouterConfig`, `RouteConfig`, `MatchedRoute`, `NavigationEvent` (`{ from, to, fromRoute, toRoute }`, path'ler `base` olmadan), `NavigationGuard`, `RouteChangeHandler`, `IRouter`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolveLinkOptions` (`{ base? }`), `ResolvedLink` (`{ anchor, url, path }`).

## Sınır durumlar

- Yeni bir navigasyon başladığında router bekleyen navigasyonu iptal etmez. URL'i en son biten guard zinciri yazar.
- Başka bir kod `history.pushState` çağırırsa `currentPath`, bir sonraki `popstate`, `hashchange` ya da router navigasyonuna kadar eski kalır.
- Sunucuda constructor `currentPath` değerini `'/'` yapar ve hiçbir şey eklemez. Navigasyon metotları `window` ister.
- Geri/ileri navigasyonu iptal eden bir guard adres çubuğunu düzeltir. History konumu, tarayıcının taşıdığı yerde kalır.

## Ne yapmaz

- Uygulamaları mount etmez. Bunu `@tuvix.js/core` paketindeki orchestrator, `router` yapılandırmasıyla ya da `connectRouter` ile yapar.
- Siz `interceptLinks` çağırmadıkça linkleri yakalamaz.
- İç içe route'lar, yönlendirmeler (redirect), route başına guard'lar ya da kaydırma konumunu geri yükleme yoktur.

## 0.4 sürümünden geçiş

- `push()`/`replace()` başa `base` ekler: `base: '/app'` ile `push('/x')` çağrısı `/app/x` yazar. `base` değerine göreli path'ler verin.
- `base` yalnızca segment sınırında çıkarılır.
- Route'lar `match`, `getActiveApps` ve `isPathActive` içinde path'in tamamıyla eşleşir. `'/'` route'u yalnızca `/` üzerinde aktiftir. Her şeyi yakalayan bir route için `'/*'` kullanın.
- `RouteConfig.exact` kaldırıldı (zaten yok sayılıyordu).
- `pathToRegex(pattern)` artık `exact` argümanı almaz ve önbellekteki bir `RegExp` döndürür.
- Pattern'lerdeki regex karakterleri harfiyen eşleşir. Ortadaki `*` tek bir segmentle eşleşir.
- `matchRoute()` ve `isPathActive()`, `#hash` kısmını yok sayar.

## Lisans

MIT

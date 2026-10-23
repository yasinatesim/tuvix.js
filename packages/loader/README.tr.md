# @tuvix.js/loader

> Mikro uygulama bundle'larını script URL'lerinden ya da loader fonksiyonlarından adıyla yükler. Yeniden deneme, zaman aşımı, ortak bir modül kaydı ve lifecycle olayları sunar.

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır. Tüm dokümantasyon: [tuvix.js.org/tr/packages/loader](https://tuvix.js.org/tr/packages/loader).

## Kurulum

```bash
npm install @tuvix.js/loader
# ya da pnpm add @tuvix.js/loader
```

`@tuvix.js/core` sizin için bir `ModuleLoader` oluşturur ve `createOrchestrator({ loader })` ile verdiğiniz seçenekleri ona iletir. Bu paketi bir mikro uygulama ya da adaptör yazarken, başka bir uygulamanın mount edilmesini beklerken ya da uygulamaları orchestrator olmadan yüklerken import edin.

## Hızlı başlangıç

`https://cdn.example.com/dashboard/main.js` adresine build edilen mikro uygulama:

```ts
import { registerModule } from '@tuvix.js/loader';

registerModule('dashboard', {
  mount({ container, props }) {
    container.innerHTML = `<h2>Dashboard for user ${String(props?.userId)}</h2>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Shell:

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 15000, retries: 1 });
const container = document.getElementById('dashboard')!;

const result = await loader.load('dashboard', {
  scripts: ['https://cdn.example.com/dashboard/main.js'],
  styles: ['https://cdn.example.com/dashboard/main.css'],
  type: 'module',
});

if (result.module) {
  await result.module.mount({ container, props: { userId: 42 } });
} else {
  console.error(result.error);
}
```

`load()` hiçbir zaman hata fırlatmaz. Yükleme başarısız olursa promise `status: 'error'`, `module: null` ve son hatayla resolve olur.

## Entry'ler

`Entry` şunlardan biridir:

- bir URL string'i; `{ scripts: [url] }` gibi okunur
- bir `EntryConfig`
- `() => import('./dashboard')` gibi bir loader fonksiyonu. Zaman aşımında abort edilen `{ signal }` nesnesini alır. Modülün kendisiyle, `{ default: module }` ile ya da `registerModule(name, module)` çağrısından sonra herhangi bir değerle resolve olabilir.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `scripts` | `string[]` | zorunlu | Script URL'leri, sırayla çalıştırılır. |
| `styles` | `string[]` | `[]` | Stil dosyası URL'leri, script'lerle paralel yüklenir. |
| `type` | `'module' \| 'classic'` | URL'ye göre belirlenir | `.mjs`, `.mts`, `.ts`, `.tsx`, `.jsx` modül olarak, geri kalanlar classic olarak yüklenir. Vite'ın `.js` çıktısı için `'module'` verin. |
| `integrity` | `Record<string, string>` | yok | URL'ye göre anahtarlanmış SRI hash'leri. |

## API

### `ModuleLoader` ve `createLoader`

```ts no-check
new ModuleLoader(options?: LoaderOptions);
createLoader(options?: LoaderOptions): ModuleLoader;
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Deneme başına ms; tüm script ve stil dosyalarını kapsar. `0` zaman aşımını kapatır. |
| `retries` | `number` | `2` | İlk hatadan sonra yapılacak ek deneme sayısı. |
| `retryDelay` | `number` | `1000` | Denemeler arasında beklenecek ms. |
| `globals` | `Record<string, unknown>` | `{}` | URL entry'sinin her denemesinden önce `window` üzerine atanır. |

| Metot | Davranış |
| --- | --- |
| `load(name, entry): Promise<LoadResult>` | Yükler, `mount`/`unmount` varlığını doğrular ve adına göre önbelleğe alır. Modülü önce `registerModule(name)` kaydından, bulamazsa `mount` içeren yeni bir UMD global'inden çözer. Önbellekte olan bir ad için `entry` yok sayılır; zaten yüklenmekte olan bir ad aynı promise'i döndürür. |
| `prefetch(entry)` | Modül script'leri için `<link rel="modulepreload">`, diğerleri için `<link rel="prefetch">` ekler. Loader fonksiyonlarını atlar. |
| `removeStyles(name)` | Önbellekteki başka bir uygulama kullanmıyorsa uygulamanın stil dosyalarını kaldırır. Bir sonraki `load(name)` onları yeniden ekler. |
| `unload(name)` | Stil ve script tag'lerini kaldırır, önbellek kaydını siler ve bu loader'ın çözdüğü modülün kaydını kaldırır. |
| `clearCache()` | Önbellekteki her uygulama için `unload` çağırır. |
| `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()` | Önbelleği okur. `getStatus` şunlardan birini döndürür: `'idle'`, `'loading'` ya da `'loaded'`. |

### `normalizeEntry`

```ts no-check
normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

### `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource`

```ts no-check
loadScript(url: string, options?: { type?, integrity?, signal? } | string): Promise<void>;
loadStyle(url: string, options?: { timeout?, integrity?, signal? } | number): Promise<void>;
removeScript(url: string): void;
removeStyle(url: string): void;
prefetchResource(url: string, options?: { as?, type?, integrity? }): void;
```

Her URL için tek bir tag oluşur ve aynı anda çağıranlar bu tag'i paylaşır. Başarısız bir yükleme tag'ini kaldırır ve promise `[Tuvix Loader] Failed to load script: <url>` hatasıyla reject olur. Abort edilen bir çağrı, tag'i bekleyen başka çağıran yoksa tag'i kaldırır. `loadStyle` varsayılan olarak `10000` ms sonra zaman aşımına uğrar. Her tag `crossorigin="anonymous"` alır. `loadScript` fonksiyonuna ikinci argüman olarak string verilirse bu integrity hash'idir; `loadStyle` fonksiyonuna sayı verilirse bu zaman aşımıdır (0.4 biçimleri).

### Runtime kaydı ve lifecycle

Durum `window.__TUVIX_RUNTIME__` üzerinde tutulur, böylece paketin kendi kopyasını bundle eden mikro uygulamalar da aynı durumu paylaşır. `window` yoksa durum modülün içinde tutulur.

| Export | Davranış |
| --- | --- |
| `registerModule(name, module)` | Bir modülü loader için yayınlar. Adaptörler ve `defineMicroApp` bunu çağırır. |
| `unregisterModule(name)` | Modülün kaydını kaldırır. |
| `getRegisteredModule(name)` | Modülü ya da `undefined` döndürür. |
| `emitLifecycle(type, { name, container, hydrated, error? })` | `container` üzerinde (container DOM'dan ayrılmışsa `document` üzerinde) bubble eden ve composed olan bir `tuvix:mounted`, `tuvix:unmounted` ya da `tuvix:error` `CustomEvent` tetikler ve mount edilmiş container'ları takip eder. Adaptörler ve `defineMicroApp` bunu çağırır. |
| `isMounted(name)` | Uygulamanın herhangi bir container'ı mount edilmiş durumdayken `true` döndürür. |
| `whenMounted(name, { signal? })` | İlk mount'un `LifecycleDetail` değeriyle resolve olur. Hâlâ mount edilmiş bir container varsa en eskisinin değeriyle hemen resolve olur. Abort edilirse `signal.reason` ile reject olur. |
| `onLifecycle(type, handler, target = document)` | `tuvix:<type>` olaylarını dinler; dinleyiciyi kaldıran bir fonksiyon döndürür. |
| `hasServerMarkup(el)` | Bir alt eleman ya da boşluk dışında metin varsa `true` döndürür. |

```ts
import { onLifecycle, whenMounted } from '@tuvix.js/loader';

onLifecycle('error', ({ name, error }) => console.error(name, error));
const { hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log('header hydrated:', hydrated);
```

### Tipler

`Entry`, `EntryConfig`, `EntryLoader`, `EntryLoaderContext`, `ScriptType`, `MicroAppModule`, `MountContext` (`container`, `props?`, `name?`, `bus?`), `UnmountContext`, `UpdateContext` (`props`, `container?`), `MicroAppBus` (`on`, `once`, `emit`, `off`; `IEventBus` bu arayüzü karşılar), `LoaderOptions`, `LoadResult`, `LoadStatus`, `CacheEntry`, `PrefetchStrategy` (loader bunu okumaz), `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent`.

## Sınır durumlar

- Zaman aşımı, o denemenin `signal` nesnesini abort eder, tag'lerini kaldırır ve `retryDelay` kadar bekleyip yeniden dener. `signal` nesnesini yok sayan bir loader fonksiyonu çalışmaya devam eder; loader yalnızca beklemeyi bırakır.
- `unload(name)` sonrasında, kendini kaydetmiş bir `type: 'module'` script'i aynı URL'den tekrar çalışmaz. Bir loader fonksiyonu ya da yeni bir URL kullanın.
- `unload`, entry'deki tüm script URL'lerini kaldırır. Başka uygulamaların da listelediği vendor script'leri de buna dahildir.
- Aynı anda yüklenen iki UMD bundle: loader yeni global'leri uygulama adıyla eşleştirir. Hangisinin hangisi olduğunu ayırt edemezse aday adları listeleyerek hata verir.
- Başka origin'den gelen script ve stil dosyaları `Access-Control-Allow-Origin` başlığı ister.
- Mount durumu container başına tutulur: iki container'dan birini unmount ettiğinizde `isMounted(name)` yine `true` döndürür. `whenMounted`, `tuvix:error` olayında reject olmaz.
- DOM'dan ayrılmış bir container'ın lifecycle olayı `document` üzerinde tetiklenir ve `detail.container` yine dolu gelir. `document` üzerindeki `onLifecycle` (varsayılan) her olayı bir kez alır.

## Ne yapmaz

- HTML sayfalarını çekip içlerinden script çıkarmaz.
- JavaScript'i izole etmez; script'ler sayfanın global scope'unda çalışır.
- Uygulamaları mount etmez, yönlendirme yapmaz.

## Lisans

MIT

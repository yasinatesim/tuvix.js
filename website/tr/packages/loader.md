---
title: '@tuvix.js/loader'
---

<PackageHeader
  name="@tuvix.js/loader"
  title="Loader"
  description="Mikro uygulama bundle'larını isimle, script URL'lerinden veya loader fonksiyonlarından yükler. Yeniden deneme, zaman aşımı, ortak bir modül kaydı ve lifecycle olayları sunar."
  icon="📦"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

## Ne zaman kullanılır

`@tuvix.js/loader` bir entry'yi (bir script URL'si, script ve stil listesi ya da `() => import('./app')`) `mount` ve `unmount` içeren bir mikro uygulama modülüne çevirir. `<script>` ve `<link>` etiketlerini ekler, başarısız denemeleri tekrarlar, zaman aşımında vazgeçer ve sonucu uygulama adına göre önbelleğe alır.

`@tuvix.js/core` sizin için bir `ModuleLoader` oluşturur ve `createOrchestrator` fonksiyonunun `loader` seçeneğini ona iletir. Bu yüzden çoğu shell bu paketi hiç import etmez. Şu durumlarda import edin:

- kendini `registerModule` ile yayınlayan ya da `tuvix:mounted` olayını `emitLifecycle` ile bildiren bir mikro uygulama veya adaptör yazıyorsanız
- başka bir uygulamanın ne zaman mount edildiğini bilmeniz gerekiyorsa (`whenMounted`, `onLifecycle`)
- mikro uygulamaları orchestrator olmadan, örneğin kendi router'ınızdan yüklüyorsanız
- tek bir script veya stil dosyasını tekrarları ayıklayarak yüklemek istiyorsanız (`loadScript`, `loadStyle`)

Bundler'ınız uygulamayı build sırasında import edebiliyorsa ve hiçbir zaman başka bir origin'den kod yüklemiyorsanız düz bir `import()` yeterlidir.

## Hızlı başlangıç

Mikro uygulama, modülünü bir isimle yayınlar. Bu dosyanın build çıktısı `https://cdn.example.com/dashboard/main.js` adresine gider:

```ts
// dashboard/src/main.ts
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

Shell onu isimle yükler ve mount eder:

```ts
// shell/src/main.ts
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
  container.textContent = 'The dashboard is unavailable.';
  console.error(result.error);
}
```

`load()` hiçbir zaman hata fırlatmaz. Başarısız bir yükleme `status: 'error'`, `module: null` ve son hatayla döner.

## Entry biçimleri {#entry-forms}

Bir `Entry`, loader'a uygulamanın kodunun nerede olduğunu söyler. Üç biçimi vardır.

**URL string'i.** Loader `'https://cdn.example.com/app.js'` değerini `{ scripts: ['https://cdn.example.com/app.js'] }` olarak ele alır.

**Bir `EntryConfig` nesnesi:**

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `scripts` | `string[]` | zorunlu | Script URL'leri. Loader bunları bu sırayla, birbiri ardına çalıştırır. Boş bir dizi hiçbir şey yüklemez ve modülü kayıttan çözer. |
| `styles` | `string[]` | `[]` | Stil dosyası URL'leri, script'lerle paralel yüklenir. Yükleme ikisini de bekler. |
| `type` | `'module' \| 'classic'` | URL'ye göre çıkarılır | `scripts` içindeki her URL için script tipi. Verilmezse `.mjs`, `.mts`, `.ts`, `.tsx` veya `.jsx` ile biten URL'ler `type="module"` ile, diğer tüm URL'ler klasik script olarak yüklenir. `.js` ile biten Vite veya Rollup ES çıktısı için `'module'` verin. |
| `integrity` | `Record<string, string>` | yok | URL'ye göre anahtarlanmış Subresource Integrity hash'leri. Loader bunları `<script>`, `<link>` ve prefetch etiketlerine yazar. |

**Bir loader fonksiyonu (`EntryLoader`).** Loader onu `{ signal }` ile çağırır ve üç sonucu bu sırayla kontrol ederek kabul eder:

1. `mount` fonksiyonu olan bir modül
2. `default` export'u böyle bir modül olan bir nesne (bir ES module namespace)
3. kullanılabilir hiçbir şey; bu durumda loader, import'un `registerModule(name, ...)` ile kaydettiği modülü arar

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();
```

Bundler'ınız `./dashboard` modülünü ayrı bir chunk'a böler ve ilk mount'ta indirir. [`@tuvix.js/module-federation`](/tr/packages/module-federation) de federated bir remote'u orchestrator'a loader fonksiyonlarıyla bağlar.

Deneme zaman aşımına uğradığında `signal` abort edilir. Yol üzerinde `fetch` ile çektiğiniz her şeye onu iletin:

```ts
import type { EntryLoader } from '@tuvix.js/loader';

const entry: EntryLoader = async ({ signal }) => {
  const response = await fetch('/api/manifest/dashboard.json', { signal });
  const { url } = (await response.json()) as { url: string };
  return import(/* @vite-ignore */ url);
};
```

## API

### `ModuleLoader`

```ts no-check
class ModuleLoader {
  constructor(options?: LoaderOptions);
  load(name: string, entry: Entry): Promise<LoadResult>;
  prefetch(entry: Entry): void;
  removeStyles(name: string): void;
  unload(name: string): void;
  clearCache(): void;
  isLoaded(name: string): boolean;
  getModule(name: string): MicroAppModule | null;
  getStatus(name: string): LoadStatus;
  getCachedNames(): string[];
}
```

Her `ModuleLoader`, çözülmüş modülleri uygulama adına göre kendi önbelleğinde tutar. `<script>` ve `<link>` etiketleri ise sayfa genelindedir: aynı URL'yi yükleyen iki loader tek bir etiketi paylaşır.

`LoaderOptions`:

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Tek bir deneme için ms cinsinden süre sınırı. Entry'nin tüm script ve stil dosyalarını kapsar. `0` sınırı kapatır. |
| `retries` | `number` | `2` | İlk deneme başarısız olduktan sonraki ek denemeler. `2` en fazla 3 deneme demektir. |
| `retryDelay` | `number` | `1000` | Denemeler arasında ms cinsinden bekleme. |
| `globals` | `Record<string, unknown>` | `{}` | Loader'ın bir URL entry'sinin her denemesinden önce `window` üzerine atadığı alanlar. `window.React` veya bir config nesnesi bekleyen UMD bundle'ları içindir. Loader fonksiyonu entry'leri bunu yok sayar. |

#### `load(name, entry)`

Bir `LoadResult` ile resolve olur:

| Alan | Tip | Anlamı |
| --- | --- | --- |
| `status` | `'loaded' \| 'error'` | Yüklemenin sonucu. |
| `module` | `MicroAppModule \| null` | Çözülen modül, hata durumunda `null`. |
| `error` | `Error \| null` | Son denemenin hatası. |
| `duration` | `number` | Çağrıdan sonuca kadar geçen milisaniye, `performance.now()` ile ölçülür. |

Bir URL entry'si için tek deneme şunları yapar:

1. `options.globals` değerlerini `window` üzerine atar
2. script'leri sırayla, her biri bir öncekini bekleyerek, stil dosyalarını ise paralel ekler
3. modülü kayıttan okur (`getRegisteredModule(name)`)
4. bulamazsa bir UMD global'ine döner: bu yükleme sırasında ortaya çıkan ve `mount` fonksiyonu olan bir `window` alanı

Ardından loader, modülde `mount` ve `unmount` fonksiyonları olduğunu kontrol eder ve modülü `name` altında önbelleğe alır. Aynı isimle yapılan sonraki çağrılar önbellekteki modülü döndürür ve `entry` değerini yok sayar. İlki hâlâ yüklenirken yapılan ikinci çağrı aynı promise'i döndürür. Farklı isimlerin yüklemeleri paralel çalışır.

#### `prefetch(entry)`

Tarayıcıdan bir entry'nin dosyalarını çalıştırmadan indirmesini ister. Module script'ler `<link rel="modulepreload">`, klasik script'ler ve stil dosyaları `<link rel="prefetch">` alır. Loader fonksiyonu entry'leri atlanır, çünkü fonksiyonu çağırmak modülü çalıştırır. Orchestrator bunu kendi `prefetch` ayarı için çağırır.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
loader.prefetch({ scripts: ['/apps/settings/main.js'], type: 'module' });
```

#### `removeStyles(name)`

Yüklenmiş bir uygulamanın stil dosyalarını kaldırır, böylece uygulama unmount durumdayken CSS'i uygulanmaz. Stillerini kaldırmadığınız başka bir önbellekteki uygulama aynı URL'yi listeliyorsa o stil dosyası kalır. Sonraki `load(name)` stil dosyalarını geri ekler ve resolve olmadan önce onları bekler. Orchestrator her unmount'tan sonra `removeStyles` çağırır.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
const container = document.getElementById('cart')!;
const { module } = await loader.load('cart', { scripts: ['/cart.js'], styles: ['/cart.css'] });

await module?.mount({ container });
await module?.unmount({ container });
loader.removeStyles('cart');
```

#### `unload(name)`

Bir uygulamayı unutur: stil dosyalarını ve script etiketlerini kaldırır, onu önbellekten çıkarır ve kayıtlı modül bu loader'ın çözdüğü modülse ortak kayıttan da siler. Sonraki `load(name)` entry'yi yeniden indirir ve çalıştırır. Orchestrator bunu `unregister(name)` içinden çağırır.

#### `clearCache()`

Önbellekteki her uygulama için `unload` çağırır. Orchestrator bunu `destroy()` içinden çağırır.

#### `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()`

Önbelleği okur. `getStatus` bir yükleme sürerken `'loading'`, modül önbelleğe alındıktan sonra `'loaded'`, diğer durumlarda `'idle'` döndürür. Başarısız bir yükleme durumu `'idle'` olarak bırakır.

### `createLoader`

```ts no-check
function createLoader(options?: LoaderOptions): ModuleLoader;
```

`new ModuleLoader(options)` ile aynıdır. Yukarıdaki tablodaki `LoaderOptions` değerlerini alır.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 8000, retries: 0, globals: { APP_ENV: 'production' } });
```

Bu seçenekleri orchestrator için ayarlamak için `loader` olarak verin:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({ loader: { timeout: 15000, retries: 1, retryDelay: 500 } });
```

### `normalizeEntry`

```ts no-check
function normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

Bir URL'yi `{ scripts: [url] }` biçimine çevirir, bir `EntryConfig` nesnesini olduğu gibi döndürür. Loader fonksiyonlarını kabul etmez; önce `typeof entry === 'function'` kontrolü yapın.

```ts
import { normalizeEntry } from '@tuvix.js/loader';

normalizeEntry('https://cdn.example.com/app.js'); // { scripts: ['https://cdn.example.com/app.js'] }
```

### `loadScript`

```ts no-check
function loadScript(url: string, options?: LoadScriptOptions | string): Promise<void>;
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `type` | `'module' \| 'classic'` | uzantıdan çıkarılır | Script tipi, `EntryConfig.type` ile aynı kurallarla. |
| `integrity` | `string` | yok | `integrity` attribute'u için SRI hash'i. |
| `signal` | `AbortSignal` | yok | Abort edilince beklemeyi bırakır. Promise, signal'in nedeniyle reject olur. |

`document.head` içine `<script crossorigin="anonymous">` ekler ve etiketin `load` olayında resolve olur. Aynı URL için eşzamanlı çağrılar tek bir etiketi paylaşır, zaten yüklenmiş bir URL için yapılan çağrı hemen resolve olur. Başarısız bir yükleme kendi etiketini kaldırır ve `[Tuvix Loader] Failed to load script: <url>` ile reject olur; böylece sonraki çağrı yeni bir etiketle başlar. Abort edilen bir çağrı, etiketi yalnızca onu bekleyen başka bir çağıran kalmadıysa kaldırır. `loadScript` fonksiyonunun kendi zaman aşımı yoktur; bir `signal` verin.

İkinci argüman string ise 0.4'teki gibi integrity hash'i olarak okunur.

```ts
import { loadScript } from '@tuvix.js/loader';

await loadScript('https://cdn.example.com/charts.js', { type: 'classic', signal: AbortSignal.timeout(5000) });
```

### `loadStyle`

```ts no-check
function loadStyle(url: string, options?: LoadStyleOptions | number): Promise<void>;
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Bu kadar ms sonra yüklemeyi `[Tuvix Loader] Style load timed out: <url>` ile başarısız sayar. `0` sınırı kapatır. |
| `integrity` | `string` | yok | `integrity` attribute'u için SRI hash'i. |
| `signal` | `AbortSignal` | yok | Abort edilince beklemeyi bırakır. |

`document.head` içine `<link rel="stylesheet" crossorigin="anonymous">` ekler. Paylaşım, hata ve abort kuralları `loadScript` ile aynıdır. İkinci argüman sayı ise 0.4'teki gibi zaman aşımı olarak okunur.

```ts
import { loadStyle } from '@tuvix.js/loader';

await loadStyle('https://cdn.example.com/app.css', { timeout: 5000 });
```

### `removeScript`

```ts no-check
function removeScript(url: string): void;
```

`loadScript` fonksiyonunun `url` için eklediği etiketi ve `src` attribute'u `url` değerine eşit olan her `<script>` etiketini kaldırır. O URL için hâlâ süren bir yükleme `[Tuvix Loader] Removed before load: <url>` ile reject olur. Sonraki `loadScript(url)` yeni bir etiket ekler. Script'in daha önce çalıştırdığı kod bellekte kalır.

### `removeStyle`

```ts no-check
function removeStyle(url: string): void;
```

`<link rel="stylesheet">` etiketleri için `removeScript` ile aynıdır.

### `prefetchResource`

```ts no-check
function prefetchResource(url: string, options?: PrefetchOptions): void;
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `as` | `'script' \| 'style'` | `.css` URL'leri için `'style'`, diğerleri için `'script'` | Kaynak türü. |
| `type` | `'module' \| 'classic'` | uzantıdan çıkarılır | Module script'ler `rel="modulepreload"` alır. |
| `integrity` | `string` | yok | Link için SRI hash'i. |

Her URL için sayfa başına tek bir `<link>` ekler. `loadScript` veya `loadStyle` fonksiyonunun zaten ele aldığı ya da daha önce prefetch edilmiş bir URL atlanır.

```ts
import { prefetchResource } from '@tuvix.js/loader';

prefetchResource('https://cdn.example.com/app.js', { type: 'module' });
```

### `registerModule`

```ts no-check
function registerModule(name: string, module: MicroAppModule): void;
```

Bir modülü bir isim altında yayınlar; böylece uygulamanın script'i çalıştıktan sonra loader onu bulabilir. Aynı isimle ikinci çağrı ilk modülün yerini alır. React, Vue, Svelte ve Angular adaptörleri ile core'un `defineMicroApp` fonksiyonu bunu sizin yerinize çağırır; modülü elle yazıyorsanız kendiniz çağırın.

Kayıt ve mount edilmiş uygulamaların state'i `window.__TUVIX_RUNTIME__` üzerinde durur. Modül haritasına `window.__TUVIX_MODULES__` üzerinden de erişilir. Her biri `@tuvix.js/loader` paketinin kendi kopyasını bundle'layan mikro uygulamalar aynı kaydı okur ve yazar. Sunucuda, `window` olmadan, state modülün içinde tutulur.

Adaptör sözleşmesine uyan, elle yazılmış bir mikro uygulama:

```ts
import { emitLifecycle, hasServerMarkup, registerModule } from '@tuvix.js/loader';

registerModule('clock', {
  mount({ container }) {
    const hydrated = hasServerMarkup(container);
    if (!hydrated) container.textContent = new Date().toLocaleTimeString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
});
```

### `unregisterModule`

```ts no-check
function unregisterModule(name: string): void;
```

Bir modülü kayıttan siler. `ModuleLoader.unload` bunu kendi çözdüğü modüller için çağırır.

### `getRegisteredModule`

```ts no-check
function getRegisteredModule(name: string): MicroAppModule | undefined;
```

Kayıtlı modülü ya da `undefined` döndürür.

### `emitLifecycle`

```ts no-check
function emitLifecycle(type: 'mounted' | 'unmounted' | 'error', detail: LifecycleDetail): void;
```

Bir lifecycle değişikliğini kaydeder ve `tuvix:mounted`, `tuvix:unmounted` veya `tuvix:error` adında bir `CustomEvent` tetikler. Olay bubble eder ve `composed` özelliğine sahiptir; böylece `document` üzerindeki bir dinleyici shadow root içindeki container'lardan gelen olayları da duyar. `detail.container` DOM'daysa olay container üzerinde tetiklenir ve `document` seviyesine bir kez bubble eder. Container DOM'dan ayrılmışsa (`isConnected` değeri `false`), örneğin React bir island'ı adaptör `unmounted` bildirmeden önce kaldırdıysa, olay doğrudan `document` üzerinde tetiklenir, çünkü ayrılmış bir elemandaki olay oraya hiç ulaşmaz. İki durumda da `detail.container` elemanı göstermeye devam eder. `event.detail` bir `LifecycleDetail` değeridir:

| Alan | Tip | Anlamı |
| --- | --- | --- |
| `name` | `string` | Mikro uygulama adı. |
| `container` | `HTMLElement` | Uygulamanın render edildiği eleman. |
| `hydrated` | `boolean` | Adaptör sıfırdan render etmek yerine sunucuda render edilmiş markup'ı devraldıysa `true`. |
| `error` | `unknown` | Fırlatılan değer, `error` olaylarında dolar. |

`mounted`, container'ı `detail.name` için mount edilmiş olarak kaydeder ve bekleyen `whenMounted(name)` promise'lerini resolve eder. `unmounted` o container'ı kayıttan çıkarır. `error` yalnızca olayı tetikler. React, Vue, Svelte ve Angular adaptörleri ile core'un `defineMicroApp` fonksiyonu bunu mount ve unmount bittikten sonra ve ikisinden biri hata fırlattığında çağırır.

### `isMounted`

```ts no-check
function isMounted(name: string): boolean;
```

`name` uygulamasının en az bir container'ı mount durumdayken `true` döner. Runtime, mount edilmiş container'ları uygulama başına izler. Bir modül iki container'a mount edildiyse ve birini unmount ederseniz, ikincisi de unmount edilene kadar `isMounted(name)` değeri `true` kalır.

### `whenMounted`

```ts no-check
function whenMounted(name: string, options?: { signal?: AbortSignal }): Promise<LifecycleDetail>;
```

İlk mount'un `LifecycleDetail` değeriyle resolve olur. Uygulama zaten mount edildiyse, hâlâ mount durumdaki en eski container'ın detail değeriyle hemen resolve olur. Beklemeyi bırakmak için `signal` değerini abort edin; promise bu durumda signal'in nedeniyle reject olur.

```ts
import { whenMounted } from '@tuvix.js/loader';

const { container, hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log(`header mounted into #${container.id}, hydrated: ${hydrated}`);
```

### `onLifecycle`

```ts no-check
function onLifecycle(type: LifecycleType, handler: (detail: LifecycleDetail) => void, target?: EventTarget): () => void;
```

`target` üzerinde (varsayılan `document`) `tuvix:<type>` olayını dinler ve dinleyiciyi kaldıran bir fonksiyon döndürür. Varsayılan target ile handler, DOM'a bağlı ve ayrılmış container'lar için aynı şekilde, her olayda bir kez çalışır. Bir container elemanı üzerindeki dinleyici, o container DOM'dan ayrıyken tetiklenen olayları duymaz.

```ts
import { onLifecycle } from '@tuvix.js/loader';

const stop = onLifecycle('error', ({ name, error }) => {
  console.error(`Micro app "${name}" failed`, error);
});

// later
stop();
```

Bu paket olmadan DOM olayını dinleyin:

```ts
import type { LifecycleEvent } from '@tuvix.js/loader';

document.addEventListener('tuvix:mounted', (event) => {
  const { name, hydrated } = (event as LifecycleEvent).detail;
  console.log(name, hydrated);
});
```

### `hasServerMarkup`

```ts no-check
function hasServerMarkup(container: Element): boolean;
```

Elemanın bir alt elemanı ya da boşluk dışında metin içeren bir text node'u varsa `true` döner. Yorumlar ve boşluklar sayılmaz. Adaptörler hydrate etmek ile sıfırdan render etmek arasında seçim yapmak için bunu kullanır.

### Tipler

Bir mikro uygulama modülünün uyguladığı arayüzler:

```ts
interface MicroAppModule {
  bootstrap?: () => void | Promise<void>;
  mount: (context: MountContext) => void | Promise<void>;
  unmount: (context: UnmountContext) => void | Promise<void>;
  update?: (context: UpdateContext) => void | Promise<void>;
  [key: string]: unknown;
}

interface MountContext {
  container: HTMLElement;
  props?: Record<string, unknown>;
  /** App name the orchestrator registered this module under */
  name?: string;
  /** The orchestrator's event bus */
  bus?: MicroAppBus;
}

interface UnmountContext {
  container: HTMLElement;
}

interface UpdateContext {
  props: Record<string, unknown>;
  /** Container to update; without it, adapters update every mounted instance */
  container?: HTMLElement;
}

interface MicroAppBus {
  on<T = unknown>(event: string, handler: (data: T) => void): () => void;
  once<T = unknown>(event: string, handler: (data: T) => void): () => void;
  emit<T = unknown>(event: string, data?: T): void;
  off<T = unknown>(event: string, handler: (data: T) => void): void;
}
```

Orchestrator her mount'ta `name` ve `bus` değerlerini iletir. `bus`, orchestrator'ın [`@tuvix.js/event-bus`](/tr/packages/event-bus) instance'ıdır. `MicroAppBus` onu yapısal olarak tanımlar, bu yüzden loader'ın event bus paketine bağımlılığı yoktur.

| Tip | Anlamı |
| --- | --- |
| `Entry` | `string \| EntryConfig \| EntryLoader`. |
| `EntryConfig` | `{ scripts, styles?, type?, integrity? }`, bkz. [Entry biçimleri](#entry-forms). |
| `EntryLoader` | `(context: EntryLoaderContext) => Promise<MicroAppModule \| { default: MicroAppModule }>`. |
| `EntryLoaderContext` | `{ signal: AbortSignal }`. |
| `ScriptType` | `'module' \| 'classic'`. |
| `MicroAppModule` | Bir mikro uygulamanın export ettiği lifecycle nesnesi. |
| `MountContext`, `UnmountContext`, `UpdateContext` | `mount`, `unmount` ve `update` fonksiyonlarının argümanları. |
| `MicroAppBus` | `{ on, once, emit, off }`; `IEventBus` bu tipi karşılar. |
| `LoaderOptions` | `{ timeout?, retries?, retryDelay?, globals? }`. |
| `LoadResult` | `{ status, module, error, duration }`. |
| `LoadStatus` | `'idle' \| 'loading' \| 'loaded' \| 'error'`. |
| `CacheEntry` | `{ module, loadedAt, entry }`, önbellekteki tek bir modül. |
| `PrefetchStrategy` | `'immediate' \| 'idle' \| 'hover' \| 'none'`. Loader bunu okumaz. |
| `ResourceOptions` | `{ integrity?, signal? }`, `loadScript` ve `loadStyle` tarafından ortak kullanılır. |
| `LoadScriptOptions` | `ResourceOptions` ve ek olarak `type?`. |
| `LoadStyleOptions` | `ResourceOptions` ve ek olarak `timeout?`. |
| `PrefetchOptions` | `{ as?, type?, integrity? }`. |
| `LifecycleType` | `'mounted' \| 'unmounted' \| 'error'`. |
| `LifecycleDetail` | `{ name, container, hydrated, error? }`. |
| `LifecycleEvent` | `CustomEvent<LifecycleDetail>`. |

## Sınır durumlar

- **Zaman aşımları.** `timeout` tek bir denemenin tamamını kapsar. Süre dolduğunda loader denemenin `signal` değerini abort eder, denemenin başka bir yüklemenin beklemediği etiketlerini kaldırır, `retryDelay` kadar bekler ve yeniden dener. Hata metni `[Tuvix Loader] Loading "<name>" timed out after <timeout>ms` olur. `signal` değerini yok sayan bir loader fonksiyonu arka planda çalışmaya devam eder; loader onu beklemeyi bırakır.
- **Yeniden denemeler.** Başarısız bir `<script>` sonraki denemeden önce kaldırılır, bu yüzden her yeniden deneme tek bir yeni etiket ekler. Son denemeden sonra `load()` son hatayla resolve olur.
- **Aynı URL, birden fazla uygulama.** Aynı vendor script'ini listeleyen iki entry tek bir etiketi ve tek bir indirmeyi paylaşır.
- **Önbellekteki entry'ler.** `load(name, otherEntry)`, `name` altında önbellekte duran modülü döndürür ve `otherEntry` değerini yok sayar. Entry değiştirmek için önce `unload(name)` çağırın.
- **Module script'ler URL başına bir kez çalışır.** `unload(name)` sonrasında, `type: 'module'` script'i `registerModule` çağıran bir uygulama aynı URL'den yeniden yüklenmez, çünkü tarayıcı bir module script'i iki kez çalıştırmaz. Yükleme `no exports found` ile başarısız olur. Bir loader fonksiyonu entry'si ya da yeni bir URL (içerik hash'i veya `?v=2`) kullanın.
- **`unload` ortak script etiketlerini kaldırır.** Entry'nin her script URL'sini kaldırır, başka bir uygulamanın da listelediği bir vendor script'i dahil. Önceden çalışmış kod kalır; URL'yi listeleyen sonraki bir yükleme etiketi yeniden ekler ve klasik bir script yeniden çalışır.
- **CORS.** Loader her etikete `crossorigin="anonymous"` koyar. Başka bir origin'den gelen script veya stil dosyası bir `Access-Control-Allow-Origin` header'ı ister, yoksa tarayıcı onu engeller ve yükleme başarısız olur.
- **UMD global'leri.** İki UMD bundle'ı aynı anda yüklendiğinde loader, başka bir yüklemenin zaten sahiplendiği global'leri atlar ve kalanları büyük/küçük harf ve noktalama farkını yok sayarak uygulama adıyla eşleştirir (`my-app`, `MyApp` ile eşleşir). Birden fazla aday kalırsa yükleme `several globals with mount() appeared while it loaded (<names>)` ile başarısız olur. `registerModule` tahmin yürütme ihtiyacını ortadan kaldırır.
- **Eksik lifecycle.** `mount` veya `unmount` içermeyen bir modül `[Tuvix Loader] Module "<name>" is missing required "unmount" function.` ile başarısız olur.
- **Hiçbir şey bulunamadı.** Script'leri ne bir modül kaydeden ne de bir UMD global'i tanımlayan bir URL entry'si `Module "<name>" loaded but no exports found` ile başarısız olur.
- **Birden fazla container.** Runtime, mount state'ini container başına izler. İki container'dan birini unmount etmek `isMounted(name)` değerini `true` bırakır; `whenMounted(name)` hâlâ mount durumdaki en eski container'ı döndürür.
- **DOM'dan ayrılmış container'lar.** Host framework, adaptör `unmounted` veya `error` bildirmeden önce container'ı kaldırırsa `emitLifecycle` olayı `document` üzerinde tetikler. Her olayı almak için `document` üzerinde dinleyin (`onLifecycle` varsayılanı).
- **`whenMounted` hataları yok sayar.** Bir `tuvix:error` olayı onu reject etmez. Bir `signal` verin ya da `onLifecycle('error', ...)` ile dinleyin.
- **Sunucu.** Runtime fonksiyonları `window` olmadan çalışır; `CustomEvent` tanımsızsa `emitLifecycle` DOM olayını atlar. `ModuleLoader`, `loadScript`, `loadStyle` ve `prefetchResource` için `document` gerekir.

## Ne yapmaz

- Bir HTML sayfasını indirip içinden script'leri çıkarmaz. Script ve stil URL'lerini listeleyin ya da bir loader fonksiyonu kullanın.
- JavaScript'i izole etmez. Script'ler sayfanın global scope'unda çalışır. CSS izolasyonu için orchestrator'ın `sandbox` seçeneğini ya da [`@tuvix.js/sandbox`](/tr/packages/sandbox) paketini kullanın.
- Uygulamaları mount etmez. `module.mount` fonksiyonunu siz ya da orchestrator çağırır.
- Sayfa yüklemeleri arasında önbellek tutmaz. Bunu tarayıcının HTTP önbelleği yapar.
- `PrefetchStrategy` değerini okumaz; `prefetch` çağrısının ne zaman yapılacağına orchestrator'ın `prefetch` ayarı karar verir.

## 0.4 sürümünden geçiş

- `LoaderOptions.fetch` ve `EntryConfig.html` kaldırıldı. Loader bunları hiç okumuyordu. Config'inizden silin.
- `loadScript(url, integrity)` ve `loadStyle(url, timeoutMs)` hâlâ çalışır. Seçenek nesnesi biçimi `type` ve `signal` ekler:

  ```ts
  import { loadScript } from '@tuvix.js/loader';

  // 0.4
  await loadScript('/vendor.js', 'sha384-abc');
  // 0.5
  await loadScript('/vendor.js', { integrity: 'sha384-abc', type: 'classic' });
  ```

- `.js` ile biten Vite ES çıktısı 0.4'te klasik script olarak yükleniyor ve ilk `import` ifadesinde hata veriyordu. Entry üzerinde `type: 'module'` ayarlayın.
- Bir `type: 'module'` entry'si artık `unload` sonrasında aynı URL'den yeniden yüklenmez. Bir loader fonksiyonu ya da yeni bir URL kullanın.
- Önbellekteki bir modül için `load()` artık `0` yerine gerçek `duration` değerini bildirir.
- Bu sayfanın 0.4 sürümü `loader.load(url)`, `result.app`, `onLoadStart`, `cache` ve `loader.clear()` gösteriyordu. Bunların hiçbiri yoktu. `load(name, entry)`, `result.module`, `unload(name)` ve `clearCache()` kullanın.

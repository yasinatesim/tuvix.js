---
title: 'tuvix.js'
---

<PackageHeader
  name="tuvix.js"
  title="tuvix.js (Şemsiye paket)"
  description="Tek paket, tek import yolu. @tuvix.js/core paketindeki orchestrator'ı ve @tuvix.js/router, @tuvix.js/event-bus, @tuvix.js/loader ile @tuvix.js/sandbox paketlerinin public API'lerini yeniden dışa aktarır."
  icon="🎁"
  github="tuvix"
/>

## Kurulum

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

`tuvix.js` kurulduğunda `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` ve `@tuvix.js/sandbox` de kurulur. Altı paketin hepsi ES module ve CommonJS build'leriyle gelir ve `"sideEffects": false` bildirir.

## Ne zaman kullanılır

Orchestrator'ı router, event bus veya sandbox ile birlikte kullanan bir shell uygulamasına `tuvix.js` kurun. Sürümünü takip edeceğiniz tek bir bağımlılık ve tek bir import yolu olur; hiç import etmediğiniz export'ları bundler'ınız atar.

Şu durumlarda bunun yerine scope'lu paketleri kurun:

- Bir mikro uygulama yalnızca shell ile konuşuyor. Tek başına `@tuvix.js/event-bus` ona `getGlobalBus()` fonksiyonunu verir ve orchestrator'ı `node_modules` klasörüne çekmez.
- Şemsiye paketin dışarıda bıraktığı bir export'a ihtiyacınız var; örneğin `@tuvix.js/loader` paketindeki `registerModule` veya `emitLifecycle`, ya da `@tuvix.js/router` paketindeki `pathToRegex`. Bkz. [Dahil olmayanlar](#not-included).
- Bir paketin Tuvix.js'in hangi parçalarına bağlı olduğunu `package.json` dosyanızda açıkça görmek istiyorsunuz.

İkisini karıştırmak güvenlidir. Şemsiye paket aynı modülleri yeniden dışa aktarır. Bu yüzden `tuvix.js` ve `@tuvix.js/event-bus` paketlerinden gelen `getGlobalBus` aynı bus'ı döndürür, lifecycle yardımcıları da `window` üzerindeki tek bir kaydı paylaşır.

## Hızlı başlangıç

`about` uygulamasını `/about` adresinde mount eden, link tıklamalarını router navigasyonuna çeviren ve uygulama hatalarını loglayan bir shell:

```ts
import { createOrchestrator, getGlobalBus, interceptLinks, OrchestratorEvent, type AppErrorEvent } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

orchestrator.register({
  name: 'about',
  entry: 'https://cdn.example.com/about/main.js',
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

`https://cdn.example.com/about/main.js` adresine build edilen `about` uygulaması:

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

`<a href="/about?ref=nav">` linkine tıklamak `/about?ref=nav` adresini push eder ve orchestrator `about` uygulamasını `#main` içine mount eder (query string eşleşmeyi etkilemez).

## API

Aşağıdaki her export bir yeniden dışa aktarımdır. Bağlantı verilen paket sayfası imzasını, seçeneklerini ve sınır durumlarını belgeler.

### `@tuvix.js/core` paketinden

Belgeler: [`@tuvix.js/core`](/tr/packages/core).

| Export | Tür | Ne yapar |
| --- | --- | --- |
| `createOrchestrator` | fonksiyon | Bir `Orchestrator` oluşturur. |
| `Orchestrator` | sınıf | Uygulamaları kaydeder, URL'e göre reconcile eder, bir router'ı takip eder (`connectRouter`), props'u günceller, kendini yok eder. |
| `defineMicroApp` | fonksiyon | Bir `{ name, bootstrap?, mount, unmount, update?, ssr? }` nesnesini doğrular, loader için kaydeder ve `tuvix:mounted` / `tuvix:unmounted` / `tuvix:error` olaylarını tetiklemesini sağlar. |
| `OrchestratorEvent` | enum | Orchestrator'ın kendi bus'ında yayınladığı olay adları (`tuvix:app:mount`, `tuvix:app:error`, ...). |
| `OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition` | tip | `createOrchestrator`, `register` ve `defineMicroApp` argümanları. |
| `AppStatus`, `AppSandboxOption`, `RouterSource`, `RegisteredApp` | tip | Uygulama durumu union'ı, `sandbox` seçeneği, `connectRouter` argümanı, uygulama kaydının yapısı. |
| `AppErrorEvent`, `AppErrorPhase` | tip | `APP_ERROR` payload'ı `{ name, error, phase }` ve aşama union'ı (`'load'`, `'bootstrap'`, `'mount'`, `'update'`, `'unmount'`). |

### `@tuvix.js/event-bus` paketinden

Belgeler: [`@tuvix.js/event-bus`](/tr/packages/event-bus).

| Export | Tür | Ne yapar |
| --- | --- | --- |
| `EventBus` | sınıf | `on`, `once`, `emit`, `off`, `onAny` metotlarıyla pub/sub bus. |
| `createEventBus` | fonksiyon | Yeni ve ayrı bir `EventBus` oluşturur. |
| `getGlobalBus` | fonksiyon | `window.__TUVIX_GLOBAL_BUS__` üzerinde saklanan sayfa genelindeki bus'ı döndürür. Orchestrator varsayılan olarak bunu kullanır. |
| `resetGlobalBus` | fonksiyon | Sayfa genelindeki bus'ı yok eder; sonraki `getGlobalBus()` çağrısı yenisini oluşturur. |
| `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` | tip | Bus arayüzü, handler imzaları, abonelik iptal fonksiyonu, constructor seçenekleri. |

### `@tuvix.js/router` paketinden

Belgeler: [`@tuvix.js/router`](/tr/packages/router).

| Export | Tür | Ne yapar |
| --- | --- | --- |
| `Router` | sınıf | Path'leri uygulama adlarına eşleyen history veya hash router. |
| `createRouter` | fonksiyon | Bir `Router` oluşturur. |
| `matchPath` | fonksiyon | Bir path'i bir pattern ile eşleştirir (`:param`, `/*`; query ve hash yok sayılır). `activeWhen` string'leri bunu kullanır. |
| `matchRoute` | fonksiyon | Bir `RouteConfig[]` içinde path ile tam eşleşen ilk route'u `params` ve `query` ile döndürür. |
| `normalizePath` | fonksiyon | Başa bir eğik çizgi ekler, sondakini kaldırır. |
| `interceptLinks` | fonksiyon | Aynı origin'e giden link tıklamalarını bir `navigate(path)` çağrısına çevirir; isteğe bağlı olarak niyet üzerine prefetch yapar. |
| `resolveLink` | fonksiyon | Olayın gerçekleştiği HTML linki için `{ anchor, url, path }` döndürür; linki tarayıcının işlemesi gerekiyorsa `null` döndürür. |
| `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute` | tip | Router arayüzü, seçenekleri ve route yapıları. |
| `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler` | tip | Navigasyon payload'ı, guard ve listener imzaları. |
| `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` | tip | `matchPath` sonucu ve seçenekleri, `interceptLinks` seçenekleri, `resolveLink` sonucu ve seçenekleri. |

### `@tuvix.js/loader` paketinden

Belgeler: [`@tuvix.js/loader`](/tr/packages/loader).

| Export | Tür | Ne yapar |
| --- | --- | --- |
| `ModuleLoader` | sınıf | Bir entry'yi (URL, script/stil yapılandırması veya loader fonksiyonu) timeout, yeniden deneme ve önbellekleme ile yükler. |
| `createLoader` | fonksiyon | Bir `ModuleLoader` oluşturur. |
| `whenMounted` | fonksiyon | Bir uygulama `mounted` lifecycle olayını yayınladığında resolve olur. |
| `onLifecycle` | fonksiyon | `tuvix:mounted`, `tuvix:unmounted` veya `tuvix:error` DOM olaylarını dinler. |
| `isMounted` | fonksiyon | Lifecycle olaylarına göre uygulamanın herhangi bir container'ı mount edilmiş durumdayken `true` döner. |
| `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext` | tip | Entry biçimleri ve bir mikro uygulamanın uyguladığı lifecycle sözleşmesi. |
| `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy` | tip | Loader seçenekleri ve sonuçları. |
| `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` | tip | Lifecycle olay adları, payload'ı ve DOM olay tipi. |

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

const off = onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer', { signal: AbortSignal.timeout(5000) });
console.log(container.id, hydrated);
off();
```

### `@tuvix.js/sandbox` paketinden

Belgeler: [`@tuvix.js/sandbox`](/tr/packages/sandbox).

| Export | Tür | Ne yapar |
| --- | --- | --- |
| `CssSandbox` | sınıf | Bir container'ı shadow root içine taşır ve stil dosyalarını onun içinde yükler. Orchestrator `sandbox: true` için bunu kullanır. |
| `JsSandbox` | sınıf | Bir script'in yazdığı global'leri gerçek `window` nesnesinden uzak tutan proxy `window`. |
| `Sandbox` | sınıf | `CssSandbox` ve `JsSandbox` sınıflarını tek bir `activate` / `deactivate` çiftinin arkasında toplar. |
| `createSandbox` | fonksiyon | Bir `Sandbox` oluşturur. |
| `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox` | tip | Sandbox'ların seçenekleri ve arayüzleri. |
| `AdoptStylesOptions`, `AdoptedStyles` | tip | `CssSandbox.adoptStyles` argümanı ve dönüş değeri. |

### Dahil olmayanlar {#not-included}

Şemsiye paket bunları dışarıda bırakır. Onları sağlayan paketi kurun.

| İhtiyacınız olan | Kurulacak paket |
| --- | --- |
| `registerModule`, `unregisterModule`, `getRegisteredModule`, `emitLifecycle`, `hasServerMarkup`, `normalizeEntry`, `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource` ve `EntryLoader`, `EntryLoaderContext`, `MicroAppBus`, `ScriptType`, `CacheEntry`, `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions` tipleri | [`@tuvix.js/loader`](/tr/packages/loader) |
| `pathToRegex`, `parseQuery`, `isPathActive` | [`@tuvix.js/router`](/tr/packages/router) |
| React, Vue, Svelte veya Angular mikro uygulamaları | [`@tuvix.js/react`](/tr/packages/react), [`@tuvix.js/vue`](/tr/packages/vue), [`@tuvix.js/svelte`](/tr/packages/svelte), [`@tuvix.js/angular`](/tr/packages/angular) |
| Sunucu tarafında birleştirme | [`@tuvix.js/server`](/tr/packages/server) |
| Module Federation remote'ları | [`@tuvix.js/module-federation`](/tr/packages/module-federation) |
| Vite build'lerinde island asset'leri | [`@tuvix.js/vite`](/tr/packages/vite) |
| DevTools paneli | [`@tuvix.js/devtools`](/tr/packages/devtools) |
| Proje iskeleti | [`create-tuvix-app`](/tr/packages/create-tuvix-app) |

## Sınır durumlar

- `tuvix.js` paketinin tek bir giriş noktası vardır. `tuvix.js/core` veya `tuvix.js/router` gibi alt yol import'ları çözümlenemez; `tuvix.js` paketinden ya da scope'lu paketten import edin.
- Şemsiye paket bağımlılıklarını aynı sürüme sabitler. `tuvix.js` paketini scope'lu bir paketin farklı bir sürümünün yanına kurarsanız o paketin iki kopyası olur. `getGlobalBus()` ve lifecycle kaydı `window` üzerinden state paylaşmaya devam eder, ama `instanceof Orchestrator` veya `instanceof EventBus` kontrolleri kopyalar arasında başarısız olur.
- `whenMounted`, `onLifecycle` ve `isMounted`, `tuvix:*` DOM olaylarına tepki verir. Bu olayları `defineMicroApp` ile oluşturulan modüller ve framework adaptörleri tetikler; elle yazılmış bir modül, `@tuvix.js/loader` paketindeki `emitLifecycle` fonksiyonunu çağırmadıkça hiçbirini tetiklemez. Belgenin dışındaki bir container'ın olayları `document` üzerinde tetiklenir.
- `resetGlobalBus()`, çalışan bir orchestrator'ın tuttuğu bus'ı yok eder. Orchestrator bu yok edilmiş bus'ı tutmaya devam eder, bu yüzden olayları bir sonraki `getGlobalBus()` bus'ının abonelerine artık ulaşmaz. Bunu testler arasında, `orchestrator.destroy()` sonrasında çağırın.
- `@tuvix.js/core` ve `@tuvix.js/router` paketlerindeki davranış değişiklikleri ve breaking change'ler burada da aynen geçerlidir. Bkz. [0.4 sürümünden geçiş](/tr/packages/core#migrating-from-0-4).

## Ne yapmaz

- Kendine ait kod eklemez. Her export beş scope'lu paketten birinden gelir.
- Framework adaptörlerini, sunucu paketini, Module Federation'ı, Vite'ı veya DevTools'u içermez.
- Paket başına alt yol entry'leri sunmaz.

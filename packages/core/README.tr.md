# @tuvix.js/core

> URL değiştikçe mikro uygulamaları yükleyen, mount ve unmount eden orchestrator.

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır.

Tüm dokümantasyon: [tuvix.js.org/tr/packages/core](https://tuvix.js.org/tr/packages/core)

## Kurulum

```bash
npm install @tuvix.js/core
# ya da pnpm add @tuvix.js/core
```

Paket `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` ve `@tuvix.js/sandbox` paketlerine bağımlıdır.

## Hızlı başlangıç

Shell:

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/settings/*', app: 'settings' }] },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

orchestrator.register({
  name: 'settings',
  entry: { scripts: ['/settings/main.js'], styles: ['/settings/main.css'] },
  container: '#main',
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Remote uygulama (`dashboard/main.js`):

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## Uygulamalar nasıl aktif olur

- `activeWhen: '/path'`: `@tuvix.js/router` paketindeki `matchPath` ile eşleştirilir. Query ve hash yok sayılır. `'/dashboard'` ve `'/dashboard/*'`, `/dashboard` path'ini ve tüm alt path'lerini eşler (`/dashboards` path'ini eşlemez). `:id` tek bir segmenti, `'/'` ise her path'i eşler.
- `activeWhen: (path) => boolean`: kararı sizin fonksiyonunuz verir.
- `activeWhen` yok ama uygulama `router.routes` içinde geçiyor: `app: name` olan bir route tam eşleştiği sürece uygulama aktiftir. `'/'` route'u yalnızca ana sayfa demektir; `'/*'` her path demektir.
- İkisi de yok: `mountApp` / `unmountApp` çağrılarını siz yaparsınız; reconcile turları uygulamaya dokunmaz.
- `mountWhenVisible: true`: container %10 görünür olunca uygulama mount edilir; `activeWhen` yok sayılır.

Geçerli path önce `connectRouter` ile verilen `getPath()` fonksiyonundan, o yoksa yerleşik router'dan, o da yoksa `window.location.pathname` değerinden gelir. Reconcile turları tek tek çalışır: önce aktif olmayan uygulamalar unmount edilir, sonra aktif olanlar mount edilir. Kuyrukta bekleyen navigasyonlar en yeni path'e indirgenir. Yüklenirken aktifliğini kaybeden bir uygulama mount adımını atlar. Mount ortasında aktifliğini kaybeden bir uygulama ise mount tamamlanınca unmount edilir.

## API

### `createOrchestrator(config?)` / `new Orchestrator(config?)`

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | yok | Yerleşik router: `mode` (varsayılan `'history'` ya da `'hash'`), `base`, `routes` (zorunlu). |
| `eventBus` | `EventBusOptions` | yok | Özel bus seçenekleri. Verilmezse orchestrator `getGlobalBus()` kullanır. |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | Module loader'a iletilir, `globals` alanı da dahil. |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | `immediate`: `start()` sırasında. `idle`: tarayıcının ilk boşta kaldığı anda. `hover`: bir uygulamayı aktif eden aynı origin'li bir link pointer ya da focus aldığında. |
| `onError` | `(error: Error, appName: string) => void` | yok | Yükleme, bootstrap, mount, update ve unmount hataları. |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | yok | Her durum değişikliği. |

### `Orchestrator` metotları

| Metot | Davranış |
| --- | --- |
| `register(appConfig: MicroAppConfig): void` | Config'i saklar. Yükleme, mount ya da reconcile yapmaz. |
| `unregister(name): Promise<void>` | Uygulamayı unmount eder, entry'nin tag'lerini ve önbellekteki modülü kaldırır, uygulamayı unutur. |
| `start(): Promise<void>` | Router'ı takip etmeye başlar, reconcile eder, prefetch'i ve viewport gözlemini başlatır. `STARTED` olayını yayınlar. |
| `mountApp(name): Promise<void>` | Süren bir unmount varsa bitmesini bekler, sonra mount eder. Hata olursa `fallback` HTML'ini render eder ve promise hatayla reject olur. |
| `unmountApp(name): Promise<void>` | Süren bir yükleme ya da mount varsa bitmesini bekler, sonra unmount eder. |
| `updateAppProps(name, props): Promise<void>` | Props'u yüzeysel (shallow) birleştirir. Mount edilmiş uygulamada `update({ props, container })` çağırır, değilse props'u bir sonraki mount için saklar. |
| `reconcile(path?): Promise<void>` | `path` ya da geçerli path için bir reconcile turunu kuyruğa ekler. |
| `connectRouter({ subscribe, getPath }): () => void` | Harici bir router'ı takip eder. `disconnect` fonksiyonunu döndürür. |
| `navigateTo(path): Promise<void>` | Yerleşik router'da `push(path)` çağırır. Router yoksa `[Tuvix] No router configured.` hatası fırlatır. |
| `getAppStatus(name): AppStatus \| null` | Durumu döndürür, bilinmeyen adlar için `null` döndürür. |
| `getRegisteredApps(): string[]` | Kayıtlı adlar. |
| `getMountedApps(): string[]` | Durumu `'mounted'` olan adlar. |
| `getEventBus(): IEventBus` | `getGlobalBus()` ya da özel bus. |
| `getRouter(): IRouter \| null` | Yerleşik router ya da `null`. |
| `destroy(): Promise<void>` | Çalışan reconcile turunu bekler, tüm uygulamaları unmount eder, dinlemeyi bırakır, `DESTROYED` olayını yayınlar. Global bus'a dokunmaz. |

`register` seçenekleri:

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Benzersiz olmalı. Remote uygulama da aynı adla kaydolur. |
| `entry` | `Entry` | zorunlu | URL, `{ scripts, styles?, type?, integrity? }` ya da `() => import('./app')`. |
| `container` | `string \| HTMLElement` | zorunlu | Seçici (her mount'ta yeniden çözülür) ya da eleman. |
| `activeWhen` | `string \| ((path: string) => boolean)` | yok | Aktivasyon kuralı. |
| `props` | `Record<string, unknown>` | yok | `mount()` fonksiyonuna iletilir. |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | Uygulamayı bir shadow root içinde render eder; entry'nin `styles` dosyaları da orada yüklenir. |
| `fallback` | `string` | yok | Yükleme, bootstrap ya da mount hatasında `innerHTML` ile yazılan HTML. |
| `mountWhenVisible` | `boolean` | `false` | Container viewport'ta %10 görünür olunca mount eder. |

TanStack Router ile `connectRouter`:

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
// sonra: disconnect();
```

### `defineMicroApp(definition): MicroAppModule`

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Kayıtlı adla aynı olmalı. |
| `bootstrap` | `() => void \| Promise<void>` | yok | İlk mount'tan önce çalışır. Başarısız bir bootstrap bir sonraki mount'ta yeniden çalışır; başarılı olan yalnızca bir kez çalışır. |
| `mount` | `(context: MountContext) => void \| Promise<void>` | zorunlu | `container`, `props`, `name` ve `bus` alır. |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | zorunlu | `container` alır. |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | yok | `props` ve `container` alır. |
| `ssr` | `boolean` | `false` | `mount` sunucu markup'ını devralır. Container'da markup varsa `mounted` olayı `hydrated: true` bildirir. |

Modülü `@tuvix.js/loader` paketindeki `registerModule` ile yayınlar ve döndürür. Modül `tuvix:mounted`, `tuvix:unmounted` ve `tuvix:error` DOM olaylarını tetikler (olaylar `document` seviyesine kadar bubble eder), böylece `whenMounted`, `isMounted` ve `onLifecycle` bu modülle de çalışır. Aynı container'da süren bir `mount` sırasında gelen `unmount` çağrısı mount'un bitmesini bekler. `name`, `mount` ya da `unmount` eksikse hata fırlatır.

### `OrchestratorEvent`

Orchestrator'ın bus'ında yayınlanan olaylar: `APP_REGISTERED` (`tuvix:app:registered`), `APP_BOOTSTRAP`, `APP_MOUNT`, `APP_UNMOUNT`, `APP_ERROR` (`AppErrorEvent`: `'load'`, `'bootstrap'`, `'mount'`, `'update'` ya da `'unmount'` hataları için `{ name, error, phase }`), `APP_STATUS_CHANGE` (`{ name, status }`), `ROUTE_CHANGE` (yalnızca yerleşik router), `STARTED`, `DESTROYED`.

```ts
import { getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

### CSS izolasyonu

`sandbox: true` ya da `{ css: true }`, container'a açık (open) bir shadow root ekler (yeniden mount'ta aynı root kullanılır), uygulamayı bunun içindeki bir `<div data-tuvix-sandbox-root>` elemanına mount eder ve entry'nin `styles` dosyalarını orada yükler. Mount, stil dosyalarını en fazla `loader.timeout` süresi kadar bekler. JavaScript sandbox'a alınmaz. `@tuvix.js/sandbox` paketindeki `JsSandbox` ayrı kullanılan bir yardımcıdır.

### Tipler

`OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition`, `AppSandboxOption`, `RouterSource`, `AppErrorEvent`, `AppErrorPhase`, `AppStatus` (`registered`, `bootstrapping`, `bootstrapped`, `mounting`, `mounted`, `updating`, `unmounting`, `unmounted`, `error`), `RegisteredApp` (kayıt yapısı; hiçbir metot bunu döndürmez).

### Yeniden dışa aktarılanlar

- `@tuvix.js/event-bus` paketinden: `createEventBus`, `getGlobalBus`, tipler: `IEventBus`, `EventHandler`, `Unsubscribe`.
- `@tuvix.js/router` paketinden: `createRouter`, `matchPath`, `interceptLinks`, tipler: `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions`.
- `@tuvix.js/loader` paketinden: `createLoader`, tipler: `Entry`, `MicroAppModule`.

## Sınır durumlar

- `start()` sonrasında yapılan `register()` çağrısı, route ile yönetilen bir uygulamayı geçerli path'e göre reconcile eder; uygulama aktifse hemen mount edilir. `start()` sonrasında kaydedilen bir `mountWhenVisible` uygulaması hemen gözlenmeye başlar. O anda DOM'da olmayan bir container hiç gözlenmez.
- Reconcile hataları `start()` ya da `reconcile()` promise'ini reject etmez; `onError` fonksiyonuna ve konsola gider. `mountApp` ise reject olur.
- `error` durumundaki bir uygulama, onu aktif isteyen bir sonraki reconcile turunda yeniden denenir. `fallback` yalnızca yükleme, bootstrap ve mount hatalarında render edilir.
- Unmount, entry'nin stil dosyalarını `document.head` içinden kaldırır. Bir sonraki mount onları yeniden ekler.
- İki orchestrator aynı `getGlobalBus()` bus'ını paylaşır. Özel bir bus için `eventBus: {}` verin.
- `destroy()` sonrasında durumu değiştiren metotlar `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.` hatası fırlatır.

## Ne yapmaz

- JavaScript'i sandbox'a almaz.
- Link tıklamalarını yakalamaz (`interceptLinks` kullanın).
- Sunucuda render etmez (`@tuvix.js/server` kullanın).
- Uygulamalar arasında bağımlılık paylaşmaz (`@tuvix.js/module-federation` ya da import map kullanın).
- Elle yazılmış modüller için `tuvix:mounted` DOM olaylarını tetiklemez. Bunu `defineMicroApp` ve framework adaptörleri yapar.

## 0.4 sürümünden geçiş

- Orchestrator, siz `eventBus` vermedikçe `getGlobalBus()` kullanır. `destroy()` global bus'a dokunmaz.
- Reconcile turları artık elle mount edilen ya da `mountWhenVisible` kullanan uygulamaları unmount etmez.
- `sandbox: true` uygulamayı bir shadow root içinde render eder.
- `prefetch: 'hover'` yalnızca üzerine gelinen ya da focus alan bir linkin aktif ettiği uygulamaları prefetch eder.
- `activeWhen`, `matchPath` kullanır: query ve hash yok sayılır, `:param` çalışır, `.` ve `(` karakterleri birebir eşleşir.
- `OrchestratorConfig.shared` kaldırıldı (hiç okunmuyordu). `@tuvix.js/module-federation` ya da import map kullanın.
- Router `routes` tam path ile eşleşir: `'/'` route'u yalnızca ana sayfadır; her path için `'/*'` kullanın. `RouteConfig.exact` kaldırıldı.
- `APP_ERROR` artık `phase` taşır ve update ile unmount hatalarında da tetiklenir.
- Harici router'lar için `setTimeout` + `reconcile()` köprüsünün yerini `connectRouter({ subscribe, getPath })` alır.

## Lisans

MIT

---
title: '@tuvix.js/core'
---

<PackageHeader
  name="@tuvix.js/core"
  title="Çekirdek Orchestrator"
  description="Mikro uygulamaları kaydeder, entry dosyalarını yükler ve URL değiştikçe onları mount ya da unmount eder. Yerleşik router'ı veya harici bir router'ı takip eder, istenirse uygulamanın CSS'ini bir shadow root içinde izole eder ve lifecycle olaylarını ortak bir event bus üzerinden bildirir."
  icon="⚙️"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

`@tuvix.js/core` paketi `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` ve `@tuvix.js/sandbox` paketlerine bağlıdır. Paket yöneticiniz bunları da birlikte kurar.

## Ne zaman kullanılır

Bağımsız build edilen birkaç uygulama tek bir sayfayı paylaşıyorsa ve hangisinin görüneceğine URL karar veriyorsa, orchestrator'ı host sayfada (shell'de) kullanın. Her uygulamayı entry URL'i, container'ı ve sahip olduğu path'lerle bir kez kaydedersiniz. Orchestrator entry'yi ilk ihtiyaçta yükler, uygulamanın `bootstrap`, `mount` ve `unmount` fonksiyonlarını çağırır ve her navigasyonda sayfayı güncel tutar.

Şu durumlarda başka bir çözüm seçin:

- Sayfa başına tek bir framework island'ı render ediyorsunuz ve neyin gösterileceğine zaten sunucu karar veriyor. Adaptörler (`@tuvix.js/react`, `@tuvix.js/vue`, `@tuvix.js/svelte`, `@tuvix.js/angular`) ve [`@tuvix.js/vite`](/tr/packages/vite) island'ları orchestrator olmadan mount eder.
- Yalnızca uzak bir script yükleyip lifecycle fonksiyonlarını kendiniz çağırmak istiyorsunuz. [`@tuvix.js/loader`](/tr/packages/loader) paketini kullanın.
- Her şeyi tek bir import'tan almak istiyorsunuz. Bu paketi yeniden dışa aktaran [`tuvix.js`](/tr/packages/tuvix) şemsiye paketini kurun.

## Hızlı başlangıç

Shell, `#main` container'ını paylaşan iki uygulama kaydeder, yerleşik router ile tarayıcı URL'ini takip eder ve aynı origin'e giden link tıklamalarını router navigasyonuna çevirir:

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/settings/*', app: 'settings' }],
  },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

// /dashboard ve altındaki her path'te aktif.
orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

// activeWhen yok: yukarıdaki router route'u bunu /settings/* altında aktif eder.
orchestrator.register({
  name: 'settings',
  entry: {
    scripts: ['https://cdn.example.com/settings/main.js'],
    styles: ['https://cdn.example.com/settings/main.css'],
  },
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Her remote, lifecycle'ını shell'in kaydettiği isimle yayınlar. Düz DOM kodu için bunu `defineMicroApp` yapar; React, Vue, Svelte ve Angular bileşenleri için framework adaptörleri yapar.

```ts
// dashboard/main.ts, build çıktısı: https://cdn.example.com/dashboard/main.js
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props, bus }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
    bus?.emit('dashboard:ready', { at: Date.now() });
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## Uygulamalar nasıl aktif olur {#how-apps-become-active}

Kayıtlı her uygulama beş aktivasyon kuralından birine uyar. Orchestrator kuralı uygulamanın yapılandırmasına bakarak seçer.

| Yapılandırma | Uygulama ne zaman aktif | Kim unmount eder |
| --- | --- | --- |
| `activeWhen: '/path'` | `matchPath('/path', currentPath).matched` değeri `true` olduğunda | path'in artık eşleşmediği ilk reconcile turu |
| `activeWhen: (path) => boolean` | fonksiyonunuz `true` döndürdüğünde | fonksiyonun `false` döndürdüğü ilk reconcile turu |
| `activeWhen` yok, `router.routes` içinde adı geçiyor | `app: name` içeren bir route path ile tam eşleştiğinde | böyle bir route'un eşleşmediği ilk reconcile turu |
| `activeWhen` yok, route yok | kendiliğinden hiçbir zaman | siz, `mountApp` / `unmountApp` ile |
| `mountWhenVisible: true` | container'ı en az %10 oranında viewport içindeyken | siz; reconcile turları onu atlar ve `activeWhen` yok sayılır |

`activeWhen` string'leri `@tuvix.js/router` paketindeki [`matchPath`](/tr/packages/router) fonksiyonundan geçer. Router ve `@tuvix.js/server` de aynı eşleştiriciyi kullanır:

- `?query` ve `#hash` yok sayılır, bu yüzden `/dashboard?tab=2` adresinde dashboard mount edilmiş kalır.
- Düz bir pattern, segment sınırlarında alt path'leriyle de eşleşir: `'/dashboard'` hem `/dashboard` hem `/dashboard/stats` ile eşleşir, `/dashboards` ile eşleşmez.
- `'/dashboard/*'` ile `'/dashboard'` aynı path'lerle eşleşir.
- `:name` tek bir segmentle eşleşir: `'/users/:id'`, `/users/42` ile eşleşir.
- `'/'` her path ile eşleşir.
- `.` ve `(` gibi diğer karakterler birebir eşleşir.

Router `routes` ise tam eşleşme kullanır. `{ path: '/settings' }` yalnızca `/settings` ile eşleşir; alt path'leri de kapsamak için `'/settings/*'` yazın. `'/'` route'u yalnızca ana sayfada, `'/*'` ise her path'te aktif olur. Query string ve hash burada da yok sayılır.

### Geçerli path nereden gelir

Orchestrator path'i, mevcut olan ilk kaynaktan okur:

1. `connectRouter` fonksiyonuna verdiğiniz router (`getPath()` metodu).
2. `config.router` ile oluşturulan yerleşik router (`currentPath` alanı).
3. `window.location.pathname`.

`config.router` veya `connectRouter` varsa her navigasyon bir reconcile turu başlatır. İkisi de yoksa `start()` bir kez `window.location.pathname` değerine göre reconcile eder ve siz `reconcile()` çağırana kadar sonraki navigasyonlara hiçbir şey tepki vermez.

### Reconcile turları sırayla çalışır {#reconciles-run-one-at-a-time}

Bir reconcile turu, route ile yönetilen her uygulamayı path ile karşılaştırır ve DOM'u buna uydurur:

1. Önce pasif olması gereken uygulamalar hep birlikte, paralel olarak unmount edilir. Böylece aynı container'ı paylaşan iki uygulama hiçbir zaman üst üste binmez.
2. Ardından aktif olması gereken uygulamalar paralel olarak yüklenir (yalnızca ilk seferde), bootstrap edilir (bir `bootstrap` çağrısı başarılı olana kadar) ve mount edilir.

Bir reconcile sürerken gelen navigasyonu orchestrator kuyruğa alır. Kuyrukta üç navigasyon birikirse sıradaki turda yalnızca en yeni path çalışır ve kuyruk boşaldığında tüm çağıranların promise'leri resolve olur. Entry'si yüklenirken pasif hale gelen bir uygulama mount adımını atlar. `mount()` ortasında pasif hale gelen bir uygulama, o mount tamamlanır tamamlanmaz unmount edilir. `/a` → `/b` → `/a` arasında hızlıca navigasyon yapmak sonunda yalnızca `a` uygulamasını mount edilmiş bırakır.

## API

### `createOrchestrator`

```ts no-check
function createOrchestrator(config?: OrchestratorConfig): Orchestrator;
```

Bir `Orchestrator` oluşturur. `new Orchestrator(config)` ile aynıdır.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | yok | `@tuvix.js/router` paketinden yerleşik router'ı `mode` (`'history'` veya `'hash'`, varsayılan `'history'`), `base` ve `routes` (zorunlu, `[]` olabilir) ile oluşturur. `navigateTo` ve `ROUTE_CHANGE` olayları için gerekir. |
| `eventBus` | `EventBusOptions` | yok | Özel bir bus için seçenekler (`maxListeners`, `debug`, `logger`). Verilmezse orchestrator, sayfadaki tüm uygulamaların paylaştığı `getGlobalBus()` bus'ını kullanır. |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | İçerideki `ModuleLoader` instance'ına iletilir. `timeout` deneme başına ms cinsindendir (`0` kapatır); `globals` değerleri, entry'nin script'leri çalışmadan önce `window` üzerine yazılır. |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | Entry'lerin ihtiyaç duyulmadan önce ne zaman indirileceği. Aşağıya bakın. |
| `onError` | `(error: Error, appName: string) => void` | yok | Bir uygulamanın yüklenmesi, bootstrap'i, mount'u, update'i veya unmount'u başarısız olduğunda çağrılır. `OrchestratorEvent.APP_ERROR` aynı hataları aşamasıyla birlikte bildirir. |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | yok | Her uygulamanın her durum değişikliğinde çağrılır. |

Prefetch stratejileri script ve stil URL'lerini `<link rel="prefetch">` veya `<link rel="modulepreload">` ile indirir, çalıştırmaz. Loader fonksiyonu olan entry'ler atlanır, çünkü fonksiyonu çağırmak modülü çalıştırır.

- `'immediate'`: kayıtlı tüm uygulamalar, `start()` sırasında.
- `'idle'`: kayıtlı tüm uygulamalar, `start()` sonrasındaki ilk `requestIdleCallback` içinde (bu API yoksa 200 ms'lik `setTimeout` ile).
- `'hover'`: işaretçi aynı origin'e giden bir linkin üzerine geldiğinde ya da link odak aldığında orchestrator, o linkin path'inin aktif edeceği uygulamaları prefetch eder. Her uygulama bir kez prefetch edilir. Hash modu ve `router.base` dikkate alınır.

`destroy()`, bekleyen idle ve hover prefetch işlemlerini iptal eder.

### `Orchestrator`

```ts no-check
class Orchestrator {
  constructor(config?: OrchestratorConfig);
  register(appConfig: MicroAppConfig): void;
  unregister(name: string): Promise<void>;
  start(): Promise<void>;
  mountApp(name: string): Promise<void>;
  unmountApp(name: string): Promise<void>;
  updateAppProps(name: string, props: Record<string, unknown>): Promise<void>;
  reconcile(path?: string): Promise<void>;
  connectRouter(source: RouterSource): () => void;
  navigateTo(path: string): Promise<void>;
  getAppStatus(name: string): AppStatus | null;
  getRegisteredApps(): string[];
  getMountedApps(): string[];
  getEventBus(): IEventBus;
  getRouter(): IRouter | null;
  destroy(): Promise<void>;
}
```

#### `register(appConfig)`

Bir uygulamanın yapılandırmasını saklar. Hiçbir şeyi yüklemez, mount etmez veya reconcile etmez; bunları `start()` ve sonraki navigasyonlar yapar.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Benzersiz uygulama adı. Uzak modül aynı adla kaydolmalı (`defineMicroApp({ name })` veya adaptörün `name` alanı) ya da `mount` fonksiyonu olan yeni bir `window` global'i açmalıdır. |
| `entry` | `Entry` | zorunlu | Bir script URL'i, bir `EntryConfig` (`{ scripts, styles?, type?, integrity? }`) veya `() => import('./dashboard')` gibi bir loader fonksiyonu. Bkz. [`@tuvix.js/loader`](/tr/packages/loader). |
| `container` | `string \| HTMLElement` | zorunlu | CSS seçicisi veya eleman. Seçici her mount'ta `document.querySelector` ile çözülür. |
| `activeWhen` | `string \| ((path: string) => boolean)` | yok | Aktivasyon kuralı. Bkz. [Uygulamalar nasıl aktif olur](#how-apps-become-active). |
| `props` | `Record<string, unknown>` | yok | `mount()` fonksiyonuna iletilir. `updateAppProps` bunlarla birleştirir. |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | `true` veya `{ css: true }`, uygulamayı container'ı üzerindeki bir shadow root içinde render eder. Bkz. [CSS izolasyonu](#css-isolation). |
| `fallback` | `string` | yok | Yükleme, bootstrap veya mount başarısız olduğunda container'a `innerHTML` ile yazılan HTML. Update ve unmount hataları container'a dokunmaz. |
| `mountWhenVisible` | `boolean` | `false` | Container %10 görünür olduğunda `IntersectionObserver` ile mount eder. Reconcile turları uygulamayı ve `activeWhen` değerini yok sayar. |

`[Tuvix] App name is required.`, `[Tuvix] App "<name>" is already registered.`, `[Tuvix] App "<name>" requires an entry.` veya `[Tuvix] App "<name>" requires a container.` hatasını fırlatır.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile'),
  container: '#main',
  activeWhen: '/users/:id',
  fallback: '<p>The profile is unavailable.</p>',
});

orchestrator.register({
  name: 'comments',
  entry: 'https://cdn.example.com/comments/main.js',
  container: '#comments',
  mountWhenVisible: true,
});

await orchestrator.start();
```

#### `start()`

Varsa yerleşik router'a abone olur, geçerli path'e göre reconcile eder, prefetch'i kurar ve `mountWhenVisible` container'larını izlemeye başlar. `OrchestratorEvent.STARTED` olayını yayınlar. İlk reconcile turu bitince resolve olur; o turdaki bir uygulama başarısız olsa bile. Hatalar `onError`, `APP_ERROR` ve konsola gider. İkinci çağrı `[Tuvix] Orchestrator is already started.` yazar ve geri döner.

#### `mountApp(name)` / `unmountApp(name)`

Tek bir uygulamayı elle mount veya unmount eder. Bunları `activeWhen` veya route'u olmayan uygulamalar için kullanın; route ile yönetilen uygulamalarda bir sonraki reconcile turu sizin seçiminizi geçersiz kılar.

`mountApp` devam eden bir unmount'u bekler, sonra yükler ve mount eder. `fallback` HTML'ini render ettikten sonra yükleme veya mount hatasıyla reject olur. `unmountApp` devam eden bir yükleme veya mount'u bekler, sonra unmount eder; yükleme sırasında çağrılırsa mount adımı hiç çalışmaz.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'chat', entry: '/chat/main.js', container: '#chat' });
await orchestrator.start();

document.querySelector('#open-chat')?.addEventListener('click', () => {
  orchestrator.mountApp('chat').catch(() => {
    // fallback HTML zaten #chat içinde
  });
});
```

#### `updateAppProps(name, props)`

`props` değerini uygulamanın mevcut props'u ile sığ (shallow) birleştirir. `update` fonksiyonu olan mount edilmiş bir uygulama birleşmiş nesneyi `update({ props, container })` olarak alır. Aksi halde orchestrator birleşmiş props'u saklar ve sonraki `mount()` çağrısına iletir. Önce bekleyen bir mount varsa onu bekler, böylece güncelleme yeni instance'a ulaşır. `update` hata fırlatırsa durum `error` olur, `onError` çalışır, promise reject olur ve saklanan props değişmeden kalır.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'cart', entry: '/cart/main.js', container: '#cart', activeWhen: '/' });
await orchestrator.start();

await orchestrator.updateAppProps('cart', { currency: 'EUR' });
```

#### `reconcile(path?)`

`path` değerine, verilmezse geçerli path'e göre bir reconcile turunu kuyruğa ekler. Hiçbir router orchestrator'a navigasyonları bildirmiyorsa bunu kullanın. [Reconcile turları sırayla çalışır](#reconciles-run-one-at-a-time) bölümündeki kuyruk kuralları geçerlidir.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.reconcile('/dashboard?tab=stats');
```

#### `connectRouter(source)`

Yerleşik router yerine harici bir router'ı (TanStack Router, React Router veya kendi router'ınız) takip eder. `source.subscribe(callback)` her navigasyondan sonra `callback` fonksiyonunu çağırmalı ve bir abonelik iptal fonksiyonu döndürmelidir; `source.getPath()` geçerli path'i döndürür. `start()` sonrasında her callback `getPath()` değerine göre reconcile eder. `start()` da `getPath()` değerini okur. Zaten başlamış bir orchestrator'a bağlanmak hemen reconcile eder. `disconnect()` fonksiyonunu döndürür.

```ts
import { createOrchestrator } from '@tuvix.js/core';

// Shell'inizin başka bir yerinde oluşturulmuş TanStack Router instance'ı.
declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'billing', entry: '/billing/main.js', container: '#main', activeWhen: '/billing' });

const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();

// Sonra, shell kapanırken:
disconnect();
```

React Router'ın data router'ı (`createBrowserRouter`) da aynı yapıya uyar: `subscribe: (callback) => router.subscribe(() => callback())` ve `getPath: () => router.state.location.pathname`.

#### `navigateTo(path)`

Yerleşik router üzerinde `push(path)` çağırır. Promise URL değiştikten sonra resolve olur; tetiklediği reconcile turu arka planda çalışır. `config.router` yoksa `[Tuvix] No router configured.` hatasını fırlatır.

#### `getAppStatus(name)`, `getRegisteredApps()`, `getMountedApps()`

`getAppStatus` uygulamanın `AppStatus` değerini, bilinmeyen bir ad için `null` döndürür. `getRegisteredApps` kayıtlı tüm adları döndürür. `getMountedApps` durumu `'mounted'` olan adları döndürür (`'updating'` durumundaki bir uygulama listeye girmez).

#### `getEventBus()`, `getRouter()`

`getEventBus`, orchestrator'ın `OrchestratorEvent` olaylarını yayınladığı ve `mount()` fonksiyonuna ilettiği bus'ı döndürür: `getGlobalBus()` ya da `eventBus` verdiyseniz özel bus. `getRouter` yerleşik router'ı veya `null` döndürür.

#### `unregister(name)`

Uygulamayı unmount eder (devam eden bir mount varsa bekler), container'ını izlemeyi bırakır, entry'nin script ve stil etiketlerini kaldırır, önbellekteki modülü siler ve uygulamayı unutur. Bilinmeyen adlarda reject olur. Tarayıcılar bir module script'i URL başına bir kez çalıştırır, bu yüzden `type: 'module'` bir URL entry'sini yeniden kaydetmek için yeni bir URL veya bir loader fonksiyonu gerekir.

#### `destroy()`

Prefetch'i durdurur, yerleşik router'dan ve bağlı tüm router'lardan aboneliği kaldırır, çalışan reconcile turunu bekler, tüm uygulamaları unmount eder, loader önbelleğini temizler ve `OrchestratorEvent.DESTROYED` olayını yayınlar. Özel bir bus'ı yok eder, global bus'ı ise ayakta bırakır. Tekrarlanan çağrılar aynı promise'i döndürür. Sonrasında `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` ve `connectRouter` çağrıları `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.` hatasını fırlatır.

### `defineMicroApp`

```ts no-check
function defineMicroApp(definition: MicroAppDefinition): MicroAppModule;
```

Bir lifecycle nesnesini doğrular, `@tuvix.js/loader` paketindeki `registerModule(definition.name, module)` ile yayınlar ve geri döndürür. Uzak uygulamanın entry dosyasında çağırın. Entry bir URL de olsa loader fonksiyonu da olsa orchestrator, entry'nin script'leri çalıştıktan sonra modülü adıyla bulur.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Shell'in kaydettiği `name` ile aynı olmalıdır. |
| `bootstrap` | `() => void \| Promise<void>` | yok | İlk yüklemeden sonra, ilk mount'tan önce çalışır. Hata fırlatırsa mount başarısız olur ve bir sonraki mount onu yeniden çağırır; bir kez başarılı olduktan sonra o orchestrator için bir daha çalışmaz. |
| `mount` | `(context: MountContext) => void \| Promise<void>` | zorunlu | `context.container` içine render edin. |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | zorunlu | Temizlik yapın ve `context.container` içini boşaltın. |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | yok | `context.props` değerini yeniden mount etmeden uygulayın. Bu fonksiyon yoksa yeni props bir sonraki mount'u bekler. |
| `ssr` | `boolean` | `false` | `mount` sunucuda render edilmiş markup'ı devralıyorsa bunu açın. O zaman `mount` çalışmadan önce container'da markup varsa `tuvix:mounted` olayı `hydrated: true` bildirir. |

`MountContext` şu alanları taşır:

| Alan | Tip | Anlamı |
| --- | --- | --- |
| `container` | `HTMLElement` | Render edilecek eleman. CSS'i izole edilmiş uygulamalarda bu, shadow root içindeki bir `<div data-tuvix-sandbox-root>` elemanıdır. |
| `props` | `Record<string, unknown> \| undefined` | Güncel props. |
| `name` | `string \| undefined` | Kayıtlı uygulama adı. |
| `bus` | `MicroAppBus \| undefined` | Orchestrator'ın event bus'ı (`on`, `once`, `emit`, `off`). |

Dönen modül `mount` ve `unmount` fonksiyonlarınızı sarar ve framework adaptörleriyle aynı DOM lifecycle olaylarını tetikler. Böylece `@tuvix.js/loader` paketindeki `whenMounted(name)`, `isMounted(name)` ve `onLifecycle` bu uygulamalarda da çalışır:

- `mount` resolve olduktan sonra `{ name, container, hydrated }` ile `tuvix:mounted`.
- `unmount` resolve olduktan sonra `tuvix:unmounted`.
- İkisinden biri hata fırlattığında `tuvix:error`. Sarmalayıcı ardından hatayı yeniden fırlatır.

Olaylar container'dan `document` nesnesine kadar kabarır (bubble). Container belgeye bağlı değilse runtime olayları doğrudan `document` üzerinde tetikler. Aynı container için `mount` hâlâ çalışırken gelen bir `unmount`, önce o mount'un bitmesini bekler.

`[Tuvix] defineMicroApp requires a "name" property.`, `[Tuvix] defineMicroApp "<name>" requires a "mount" function.` veya `[Tuvix] defineMicroApp "<name>" requires an "unmount" function.` hatasını fırlatır.

```ts
import { defineMicroApp } from '@tuvix.js/core';

let offCart: (() => void) | undefined;

export default defineMicroApp({
  name: 'header',
  bootstrap() {
    console.log('header loaded');
  },
  mount({ container, props, bus }) {
    container.innerHTML = `<header>Hello, ${String(props?.user ?? 'guest')} <span id="count">0</span></header>`;
    offCart = bus?.on<{ count: number }>('cart:changed', ({ count }) => {
      const badge = container.querySelector('#count');
      if (badge) badge.textContent = String(count);
    });
  },
  update({ props, container }) {
    const header = container?.querySelector('header');
    if (header?.firstChild) header.firstChild.textContent = `Hello, ${String(props.user ?? 'guest')} `;
  },
  unmount({ container }) {
    offCart?.();
    container.replaceChildren();
  },
});
```

### `OrchestratorEvent`

Orchestrator'ın kendi bus'ında yayınladığı olayların string enum'u. Varsayılan bus `getGlobalBus()` olduğu için sayfadaki her uygulama bu olayları dinleyebilir.

| Üye | Olay adı | Payload |
| --- | --- | --- |
| `APP_REGISTERED` | `'tuvix:app:registered'` | `{ name }` |
| `APP_BOOTSTRAP` | `'tuvix:app:bootstrap'` | `{ name }` |
| `APP_MOUNT` | `'tuvix:app:mount'` | `{ name }` |
| `APP_UNMOUNT` | `'tuvix:app:unmount'` | `{ name }` |
| `APP_ERROR` | `'tuvix:app:error'` | `AppErrorEvent`: `{ name, error, phase }`; `phase` değeri `'load'`, `'bootstrap'`, `'mount'`, `'update'` veya `'unmount'` olur |
| `APP_STATUS_CHANGE` | `'tuvix:app:status-change'` | `{ name, status }` |
| `ROUTE_CHANGE` | `'tuvix:route:change'` | yerleşik router'ın `NavigationEvent` nesnesi (`from`, `to`, `fromRoute`, `toRoute`) |
| `STARTED` | `'tuvix:started'` | `{}` |
| `DESTROYED` | `'tuvix:destroyed'` | `{}` |

`phase: 'load'`, entry'nin yüklenmesini olduğu kadar container'ın çözülmesini de kapsar.

```ts
import { createOrchestrator, getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
```

### CSS izolasyonu {#css-isolation}

`sandbox: true` veya `sandbox: { css: true }` bir uygulamanın CSS'ini izole eder:

1. İlk mount'ta orchestrator, [`@tuvix.js/sandbox`](/tr/packages/sandbox) paketindeki `CssSandbox` ile container'a açık bir shadow root ekler ve mevcut çocuk elemanları (sunucuda render edilmiş markup) bunun içindeki bir `<div data-tuvix-sandbox-root="<name>">` elemanına taşır. Uygulama bu div'e mount edilir.
2. Entry'nin `styles` dosyaları `document.head` yerine shadow root içinde `<link>` elemanları olarak yüklenir. Mount, bu dosyalar yüklenene ya da başarısız olana kadar en fazla `loader.timeout` ms bekler (varsayılan 10000; `0` ile süre sınırı olmadan bekler).
3. Unmount shadow root'u korur. Sonraki mount onu yeniden kullanır.

Sayfanın stil dosyaları artık uygulamanın içindeki elemanlarla eşleşmez, uygulamanın stil dosyaları da sayfaya ulaşmaz. `color` ve `font-family` gibi kalıtılan özellikler shadow sınırını yine de geçer. `{ css: false }` ve `false` light DOM'a render eder.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'checkout',
  entry: { scripts: ['/checkout/main.js'], styles: ['/checkout/main.css'] },
  container: '#checkout',
  activeWhen: '/checkout',
  sandbox: { css: true },
});

await orchestrator.start();
```

Orchestrator JavaScript'i sandbox içine almaz. [`@tuvix.js/sandbox`](/tr/packages/sandbox) paketindeki `JsSandbox`, kendiniz çağırdığınız bağımsız bir yardımcıdır.

### Tipler

| Tip | Anlamı |
| --- | --- |
| `OrchestratorConfig` | `createOrchestrator` ve `new Orchestrator` argümanı. `createOrchestrator` altındaki tabloya bakın. |
| `MicroAppConfig` | `register` argümanı. `register` altındaki tabloya bakın. |
| `MicroAppDefinition` | `defineMicroApp` argümanı: `name`, `bootstrap?`, `mount`, `unmount`, `update?`. |
| `AppSandboxOption` | `boolean \| { css?: boolean }`, yani `sandbox` alanı. |
| `RouterSource` | `{ subscribe(callback: () => void): () => void; getPath(): string }`, yani `connectRouter` argümanı. |
| `AppErrorEvent` | `{ name: string; error: Error; phase: AppErrorPhase }`, yani `APP_ERROR` payload'ı. |
| `AppErrorPhase` | `'load' \| 'bootstrap' \| 'mount' \| 'update' \| 'unmount'`. |
| `AppStatus` | `'registered' \| 'bootstrapping' \| 'bootstrapped' \| 'mounting' \| 'mounted' \| 'updating' \| 'unmounting' \| 'unmounted' \| 'error'`. İlk mount `registered → bootstrapping → bootstrapped → mounting → mounted` sırasını izler; yeniden mount `unmounted → mounting → mounted` şeklinde ilerler. |
| `RegisteredApp` | Orchestrator'ın tek bir uygulama için tuttuğu kaydın yapısı: `config`, `status`, `module`, `container`, `error`, `lastUpdated`. 0.5.0 sürümünde hiçbir `Orchestrator` metodu bunu döndürmez. |

### Yeniden dışa aktarımlar

`@tuvix.js/core` aşağıdakileri bağımlılıklarından yeniden dışa aktarır, böylece bir shell her şeyi tek paketten import edebilir. Tam API her bağlantıda belgelenir.

| Export | Tür | Kaynak |
| --- | --- | --- |
| `createEventBus`, `getGlobalBus` | fonksiyon | [`@tuvix.js/event-bus`](/tr/packages/event-bus) |
| `IEventBus`, `EventHandler`, `Unsubscribe` | tip | [`@tuvix.js/event-bus`](/tr/packages/event-bus) |
| `createRouter`, `matchPath`, `interceptLinks` | fonksiyon | [`@tuvix.js/router`](/tr/packages/router) |
| `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions` | tip | [`@tuvix.js/router`](/tr/packages/router) |
| `createLoader` | fonksiyon | [`@tuvix.js/loader`](/tr/packages/loader) |
| `Entry`, `MicroAppModule` | tip | [`@tuvix.js/loader`](/tr/packages/loader) |

`getGlobalBus()` instance'ını `window.__TUVIX_GLOBAL_BUS__` üzerinde tutar. Bu sayede `@tuvix.js/event-bus` paketinin kendi kopyasını bundle eden bir mikro uygulama da shell ile aynı bus'ı alır.

## Sınır durumlar

- `start()` öncesindeki `register()` yalnızca yapılandırmayı saklar. `start()` sonrasında route ile yönetilen bir uygulamayı (`activeWhen` değeri olan veya bir router route'unda adı geçen) kaydetmek geçerli path'e göre reconcile eder, yani path uygulamayı aktif ediyorsa uygulama hemen mount edilir.
- `start()` sonrasında kaydedilen bir `mountWhenVisible` uygulaması hemen izlenmeye başlar. O anda (veya `start()` anında) DOM'da olmayan bir container atlanır ve hiç izlenmez. `IntersectionObserver` yoksa (sunucu, eski tarayıcılar) viewport uygulamaları hiçbir zaman mount edilmez.
- Mount'u başarısız olan bir viewport uygulaması `error` durumunda kalır; observer onu yeniden denemez.
- `error` durumundaki, route ile yönetilen bir uygulama, onu aktif isteyen bir sonraki reconcile turunda yeniden denenir. Başarısız bir yükleme yeniden yüklenir. Başarısız bir `bootstrap`, yeniden denemede `bootstrap` fonksiyonunu tekrar çalıştırır; başarılı bir bootstrap tekrarlanmaz, bu yüzden başarısız bir `mount` yalnızca `mount` adımını yeniden dener.
- Eksik bir container mount'u `[Tuvix] Container "#main" not found in DOM.` hatasıyla başarısız kılar. İlk mount'ta `fallback` HTML'inin render edileceği bir yer yoktur.
- Reconcile hataları `start()`, `reconcile()` veya navigasyonları reject etmez. Orchestrator konsola `[Tuvix] Failed to mount "<name>":` (veya `unmount`) yazar ve `onError` fonksiyonunu çağırır. `mountApp` ve `unmountApp` ise reject olur.
- `APP_ERROR` her aşamadaki hatalar için tetiklenir ve `phase` aşamayı belirtir. `fallback` yalnızca `load`, `bootstrap` ve `mount` hatalarında render edilir.
- Unmount'u hata fırlatan bir uygulama `error` durumunda kalır ve unmount edilmiş sayılır.
- `fallback`, `innerHTML` üzerinden yazılır. Yalnızca güvendiğiniz markup'ı verin.
- Unmount, uygulamanın entry stil dosyalarını `document.head` içinden kaldırır; aynı URL'i yüklü başka bir uygulama kullanıyorsa kaldırmaz. Sonraki mount onları yeniden ekler ve yüklenmelerini bekler.
- Aynı sayfadaki iki orchestrator `getGlobalBus()` bus'ını paylaşır ve birbirlerinin `OrchestratorEvent` olaylarını görür. Birine özel bir bus vermek için `eventBus: {}` geçin.
- `@tuvix.js/event-bus` paketindeki `resetGlobalBus()`, çalışan bir orchestrator'ın tuttuğu bus'ı yok eder. Orchestrator yok edilmiş bus'ı tutmaya devam eder; `resetGlobalBus()` fonksiyonunu yalnızca `destroy()` sonrasında, örneğin testler arasında çağırın.
- `start()` öncesinde tetiklenen `connectRouter` callback'leri yok sayılır. `connectRouter` iki kez çağrılırsa iki abonelik de kalır; `start()` ve `reconcile()` için path'i en yeni kaynak sağlar.
- Hem `config.router` hem `connectRouter` varsa her kaynak kendi path'ine göre reconcile eder. Yalnızca birini kullanın.
- `activeWhen` fonksiyonları path'i kaynaktan ham haliyle alır. Yerleşik router veya `connectRouter` ile bu path bir query string içerebilir; string pattern'lerde `matchPath` bunu ayıklar.
- `updateAppProps` iç içe nesneleri değiştirir: `{ user: { id: 2 } }`, `user` prop'unun tamamının üzerine yazar.

## Ne yapmaz

- JavaScript'i sandbox içine almaz. Bir uygulamanın oluşturduğu global'ler, timer'lar ve listener'lar `window` üzerinde kalır. [`@tuvix.js/sandbox`](/tr/packages/sandbox) paketindeki `JsSandbox` sınıfını kullanın.
- Link tıklamalarını yakalamaz. `interceptLinks` fonksiyonunu (burada yeniden dışa aktarılır) çağırın veya navigasyonu framework router'ınıza bırakın.
- Sunucuda render etmez. [`@tuvix.js/server`](/tr/packages/server) paketini ve adaptörlerin `./server` entry'lerini kullanın.
- Uygulamalar arasında bağımlılık paylaşmaz. [`@tuvix.js/module-federation`](/tr/packages/module-federation) paketini veya import map'leri kullanın.
- DOM lifecycle olaylarını (`tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`) kendisi tetiklemez. Bunları `defineMicroApp` ile oluşturulan modüller ve framework adaptörleri tetikler; elle yazılmış bir `MicroAppModule`, `@tuvix.js/loader` paketindeki `emitLifecycle` fonksiyonunu çağırmadıkça hiçbirini tetiklemez.
- Unmount edilen bir uygulamayı canlı tutmaz. Uygulama state'ini başka bir yerde saklamıyorsa içindeki state kaybolur.

## 0.4 sürümünden geçiş {#migrating-from-0-4}

0.5.0 sürümündeki breaking change'ler:

- **Ortak event bus.** `eventBus` vermezseniz orchestrator'ın bus'ı `getGlobalBus()` olur. 0.4 sürümünde her orchestrator kendi bus'ını oluşturuyordu. `destroy()` artık global bus'ı ayakta bırakır.

  ```ts
  import { createOrchestrator } from '@tuvix.js/core';

  // 0.5: 0.4'teki gibi özel bir bus kullan
  const orchestrator = createOrchestrator({ eventBus: {} });
  ```

- **Elle mount edilen uygulamalar mount edilmiş kalır.** Reconcile turları artık ne `activeWhen` ne de router route'u olan uygulamaları ya da `mountWhenVisible` uygulamalarını unmount etmez. 0.4 sürümünde bir sonraki route değişikliği elle mount edilmiş uygulamayı unmount ediyordu. Bu davranışa güvendiğiniz yerlerde `unmountApp(name)` çağırın.
- **`sandbox: true` bir shadow root kullanır.** Sayfanın CSS'i artık uygulamaya ulaşmaz, entry'nin `styles` dosyaları da sayfaya ulaşmaz. 0.4'teki render davranışını korumak için `sandbox` seçeneğini kaldırın veya `{ css: false }` verin.
- **`prefetch: { strategy: 'hover' }`** yalnızca üzerine gelinen veya odak alan linkin aktif edeceği uygulamaları prefetch eder. 0.4 sürümünde sayfanın herhangi bir yerindeki ilk fare hareketi tüm uygulamaları prefetch ediyordu.
- **`activeWhen`, `matchPath` kullanır.** Query string veya hash artık bir uygulamayı unmount etmez, `:param` segmentleri çalışır ve `.` ile `(` gibi karakterler birebir eşleşir.
- **`shared` kaldırıldı.** `OrchestratorConfig.shared` hiç okunmuyordu ve tipten çıkarıldı. Silin; bağımlılıkları [`@tuvix.js/module-federation`](/tr/packages/module-federation) veya import map'lerle paylaşın.
- **Router `routes` tam eşleşir.** `{ path: '/', app: 'home' }` route'u yalnızca `/` adresinde aktif olur. Her path'te görünen bir uygulama için `'/*'` kullanın ya da prefix eşleşmesini koruyan `activeWhen: '/'` değerini verin. `RouteConfig.exact` kaldırıldı; silin.
- **`APP_ERROR` payload'ı.** Artık `phase` alanını taşır ve update ile unmount hatalarında da tetiklenir. Hatanın mount hatası olduğunu varsayan handler'lar `phase` değerini kontrol etmelidir.

Harici router'lar için 0.4'teki geçici çözüm artık kaldırılabilir:

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();

// 0.4:
// router.subscribe('onResolved', () => setTimeout(() => orchestrator.reconcile(location.pathname)));

// 0.5:
orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
```

Bu sayfanın önceki sürümleri `Orchestrator` sınıfında olmayan metot ve seçenekleri anlatıyordu. Gerçek adları kullanın:

| Eski sayfa | Gerçek API |
| --- | --- |
| `createOrchestrator({ container })` | `container`, `register()` içinde her uygulamaya aittir |
| `register(name, options)` | `register({ name, entry, container, ... })` |
| `mount(name, props)` | önce `updateAppProps(name, props)`, sonra `mountApp(name)` |
| `unmount(name)` | `unmountApp(name)` |
| `update(name, props)` | `updateAppProps(name, props)` |
| `stop()` | `destroy()` |
| `onBeforeMount`, `onAfterMount` | `onStatusChange(name, status)` veya `OrchestratorEvent.APP_MOUNT` |
| `sandbox: { js: true }` | `@tuvix.js/sandbox` paketindeki `JsSandbox` |

# Mimari

Tuvix.js küçük paketlere ayrılır. `@tuvix.js/core` içindeki orchestrator bu paketleri birbirine bağlar. Diğer her paket tek başına da çalışır.

## Paketler ve görevleri

```text
@tuvix.js/core          createOrchestrator, defineMicroApp: registry, reconcile, props
@tuvix.js/router        createRouter, matchPath, interceptLinks
@tuvix.js/loader        ModuleLoader, registerModule, lifecycle runtime
@tuvix.js/event-bus     createEventBus, getGlobalBus
@tuvix.js/sandbox       CssSandbox (shadow DOM), JsSandbox (proxy window)
@tuvix.js/react         createReactMicroApp, TuvixReactApp, TuvixIsland
@tuvix.js/vue           createVueMicroApp, renderVueToString (/server)
@tuvix.js/svelte        createSvelteMicroApp, renderSvelteToString (/server)
@tuvix.js/angular       createAngularMicroApp, renderAngularToString (/server)
@tuvix.js/vite          Vite plugin: island CSS links for the server-rendered <head>
@tuvix.js/server        Server-side composition of HTML fragments
@tuvix.js/module-federation  Entries backed by webpack remotes
@tuvix.js/devtools      In-page debug panel
tuvix.js                Umbrella: core, router, loader, event bus, sandbox
create-tuvix-app        Project scaffolding
```

## Navigasyondan mount'a

```text
URL changes (router.push, popstate, connectRouter callback, or reconcile(path))
  │
  ▼
orchestrator queues a reconcile for the path
  │  (only the newest queued path runs next)
  ▼
for each app: should it be mounted?  activeWhen string → matchPath
  │                                   activeWhen function → your code
  │                                   no activeWhen → router routes naming it
  ▼
phase 1: unmount every app that turned inactive
phase 2: mount every app that turned active
  │
  ▼
loader.load(name, entry)   function entry → await it
  │                        URL entry → <script>/<link> tags, then registry lookup
  ▼
module.bootstrap()  (first load only)
module.mount({ container, props, name, bus })
```

1. aşama, 2. aşama başlamadan önce biter. Böylece `#app` container'ını paylaşan iki uygulama hiçbir zaman aynı anda içinde bulunmaz. Bir reconcile çalışırken yeni bir path gelirse orchestrator mevcut adımı bitirir, ardından en yeni path için reconcile yapar. A → B → A şeklinde art arda hızlı navigasyon yapıldığında yalnızca A mount edilmiş kalır.

## Modül sözleşmesi

Elle yazılmış ya da bir adaptörün ürettiği her mikro uygulama bu yapıya sahiptir (`@tuvix.js/loader` paketindeki `MicroAppModule`):

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  async bootstrap() {
    // ilk mount'tan önce, bir kez
  },
  async mount({ container, props, name, bus }) {
    container.textContent = `${name ?? ''}: ${JSON.stringify(props ?? {})}`;
    bus?.emit('app:ready', { name });
  },
  async update({ props, container }) {
    if (container) container.textContent = JSON.stringify(props);
  },
  async unmount({ container }) {
    container.replaceChildren();
  },
};
```

- `bootstrap` yüklenen her modül için bir kez çalışır.
- `mount` container'ı, güncel props'ları, uygulama adını ve orchestrator'ın event bus'ını alır.
- `update`, shell `updateAppProps` çağırdığında birleştirilmiş props'ları alır. Birden fazla yere mount edilmiş bir modül, hangi mount'u güncelleyeceğini `container` değerinden anlar.
- `unmount`, `mount` fonksiyonunun oluşturduğu her şeyi kaldırmalıdır.

## Loader modülü nasıl bulur

1. **Loader fonksiyonu entry'si** (`() => import('./app')`): loader resolve edilen modülü kullanır. O yoksa modülün `default` export'unu, o da yoksa uygulama adıyla kaydedilmiş modülü kullanır.
2. **URL entry'si**: loader `<script>` ve `<link>` etiketlerini ekler, yüklenmelerini bekler ve modülü `registerModule(name, module)` çağrısının doldurduğu registry'den okur. Adaptörler ve `defineMicroApp` sizin yerinize `registerModule` çağırır.
3. **UMD fallback'i**: hiçbir şey kaydolmadıysa loader, `mount` fonksiyonuna sahip yeni bir `window` global'ini seçer. Birden fazla global ortaya çıktıysa adı uygulama adıyla eşleşeni seçer, eşleşen yoksa hata verir.

Registry ve lifecycle state'i `window.__TUVIX_RUNTIME__` üzerinde tutulur. Böylece her biri kendi `@tuvix.js/loader` kopyasıyla ayrı ayrı bundle'lanmış mikro uygulamalar da tek bir registry görür.

Entry `type: 'module'` belirttiğinde ya da URL `.mjs`, `.mts`, `.ts`, `.tsx` veya `.jsx` ile bittiğinde script'ler `type="module"` olarak yüklenir. Diğer URL'ler klasik script olarak yüklenir.

## Ortak runtime state'i

| State | Nerede tutulur | Neden |
| --- | --- | --- |
| Modül registry'si | `window.__TUVIX_RUNTIME__` (ayrıca `window.__TUVIX_MODULES__`) | Loader uygulamaları hangi bundle'dan gelirse gelsin bulur |
| Mount edilmiş uygulamalar ve bekleyenler | `window.__TUVIX_RUNTIME__` | `whenMounted` farklı bundle'lar arasında çalışır |
| Global event bus | `window.__TUVIX_GLOBAL_BUS__` | `getGlobalBus()` sayfa başına tek bir bus döndürür |

`window` olmayan sunucuda bunların her biri modül kapsamında tutulur.

## İzolasyon modeli

- **CSS**: `register` çağrısında `sandbox: true` uygulamayı bir shadow root içinde render eder ve entry'deki `styles` dosyalarını oraya yükler. Bkz. [Sandbox](/tr/guide/sandbox).
- **JavaScript**: varsayılan olarak izolasyon yoktur. Tüm uygulamalar `window`, `document` ve global'leri paylaşır. `JsSandbox` yalnızca kendi proxy'si üzerinden çalıştırdığınız kodu izole eder.

## Sonra nereye bakmalı

- [Lifecycle hook'ları](/tr/guide/lifecycle): sözleşmenin ayrıntıları.
- [Lifecycle olayları](/tr/guide/lifecycle-events): bir uygulamanın sayfada olduğunu öğrenme.
- [Yönlendirme](/tr/guide/routing): pattern kuralları.

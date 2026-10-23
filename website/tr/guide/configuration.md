# Yapılandırma

Tüm yapılandırma kodda yapılır. Tuvix.js ortam değişkeni ya da yapılandırma dosyası okumaz.

## Orchestrator seçenekleri

```ts
import { createOrchestrator } from 'tuvix.js';

declare function reportError(error: Error, app: string): void;

const orchestrator = createOrchestrator({
  // Yerleşik router. connectRouter() ile harici bir router'ı takip ediyorsanız kaldırın.
  router: {
    mode: 'history', // veya 'hash'
    base: '/',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },

  // eventBus seçenekleri verirseniz bu orchestrator'a özel bir bus oluşur.
  // Sayfadaki her uygulamayla getGlobalBus() paylaşmak için bu alanı vermeyin.
  eventBus: { maxListeners: 50, debug: false },

  // Modül loader'ına iletilir.
  loader: { timeout: 10000, retries: 2, retryDelay: 1000, globals: {} },

  // 'immediate' | 'idle' | 'hover' | 'none' (varsayılan)
  prefetch: { strategy: 'hover' },

  onError: (error, appName) => reportError(error, appName),
  onStatusChange: (appName, status) => console.debug(appName, status),
});
```

| Seçenek | Varsayılan | Etkisi |
| --- | --- | --- |
| `router` | yok | Yerleşik router'ı oluşturur. Bkz. [Yönlendirme](/tr/guide/routing). |
| `eventBus` | yok (global bus) | Bu seçeneklerle özel bir bus. `destroy()` özel bus'ı yok eder, global bus'a dokunmaz. |
| `loader.timeout` | `10000` | Tek bir yükleme denemesi iptal edilmeden önce geçecek milisaniye. Sandbox'lı stil dosyaları için beklenen süreyi de sınırlar. |
| `loader.retries` | `2` | İlk başarısızlıktan sonra yapılacak ek deneme sayısı. |
| `loader.retryDelay` | `1000` | Denemeler arasındaki milisaniye. |
| `loader.globals` | `{}` | Bir entry'nin script'leri çalışmadan önce `window` nesnesine yazılan alanlar. |
| `prefetch.strategy` | `'none'` | Entry'lerin mount'tan önce ne zaman indirileceği. Aşağıdaki tabloya bakın. |
| `onError` | yok | Yükleme, bootstrap, mount, update veya unmount başarısız olduğunda `(error, appName)` ile çağrılır. |
| `onStatusChange` | yok | Her durum değişikliğinde `(appName, status)` ile çağrılır. |

React gibi bağımlılıkları uygulamalar arasında paylaşmak için `@tuvix.js/module-federation` ya da import map kullanın. Orchestrator'da bunun için bir seçenek yoktur.

### Prefetch stratejileri

| Strateji | Entry'lerin indirildiği an |
| --- | --- |
| `none` | Yalnızca uygulama mount edilirken. |
| `immediate` | `start()` çağrısının hemen ardından, kayıtlı tüm entry'ler. |
| `idle` | `start()` sonrasındaki ilk `requestIdleCallback` içinde, kayıtlı tüm entry'ler (API'nin olmadığı yerlerde 200 ms timeout). |
| `hover` | İmleç, path'i bir uygulamayı aktifleştirecek same-origin bir linkin üzerine geldiğinde ya da link focus aldığında. Her uygulama bir kez indirilir. |

Prefetch, module script'ler için `<link rel="modulepreload">`, klasik script'ler ve stiller için `<link rel="prefetch">` ekler. Loader fonksiyonu olan entry'leri atlar, çünkü fonksiyonu çağırmak modülü çalıştırır.

## Mikro uygulama kaydetme

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main',
  activeWhen: '/dashboard/*',
  props: { theme: 'dark' },
  fallback: '<p>Dashboard is unavailable.</p>',
  sandbox: false,
  mountWhenVisible: false,
});
```

| Alan | Tip | Etkisi |
| --- | --- | --- |
| `name` | `string` | Benzersizdir. Modülün kaydolduğu adla aynı olmalıdır. |
| `entry` | `string \| EntryConfig \| EntryLoader` | Kodun nereden geldiği. Aşağıya bakın. |
| `container` | `string \| HTMLElement` | Selector ya da eleman. Mount anında çözülür, yani elemanın ancak o ana kadar var olması yeterlidir. |
| `activeWhen` | `string \| (path) => boolean` | Route pattern'i ya da predicate. Verilmezse uygulama, onu adıyla anan router `routes` kayıtlarını takip eder ya da uygulamayı siz mount edersiniz. |
| `props` | `Record<string, unknown>` | Başlangıç props'ları. `updateAppProps` bunların üzerine birleştirir. |
| `fallback` | `string` | Yükleme, bootstrap veya mount başarısız olduğunda container'a yazılan HTML. |
| `sandbox` | `boolean \| { css?: boolean }` | `true` uygulamayı bir shadow root içinde render eder. Bkz. [Sandbox](/tr/guide/sandbox). |
| `mountWhenVisible` | `boolean` | Container'ın %10'u görünür olduğunda mount eder. Bundan sonra route değişiklikleri uygulamaya dokunmaz. |

### Entry biçimleri

```ts
import type { Entry } from 'tuvix.js';

// Tek bir klasik script (UMD veya IIFE bundle'ı).
const classic: Entry = 'https://cdn.example.com/legacy/app.js';

// Script'ler ve stiller. Vite'ın `.js` çıktısı gibi ES module bundle'ları için `type: 'module'`.
const esm: Entry = {
  scripts: ['https://cdn.example.com/cart/main.js'],
  styles: ['https://cdn.example.com/cart/main.css'],
  type: 'module',
  integrity: { 'https://cdn.example.com/cart/main.js': 'sha384-...' },
};

// Bir loader fonksiyonu. Bundler'ınız onu code-split eder; loader bir AbortSignal geçer.
const lazy: Entry = () => import('./apps/profile');
```

`type` verilmezse `.mjs`, `.mts`, `.ts`, `.tsx` veya `.jsx` ile biten URL'ler modül olarak, geri kalan her şey klasik script olarak yüklenir. Tarayıcı bir module script'i URL başına bir kez çalıştırır. Bu yüzden unload ettiğiniz bir `type: 'module'` uygulaması aynı URL'den tekrar yüklenemez. Unload edip yeniden yüklemeniz gerekiyorsa loader fonksiyonu kullanın.

### Kayıtla ilgili bilinmesi gerekenler

- `register` aynı ad iki kez kullanıldığında, `entry` ya da `container` eksik olduğunda hata fırlatır.
- `start()` sonrasında yapılan `register` hemen etki eder: route ile yönetilen bir uygulama mevcut path onu aktifleştiriyorsa mount edilir, `mountWhenVisible` uygulaması gözlenmeye başlar. `start()` öncesinde `register` yalnızca yapılandırmayı saklar.
- Viewport'a bağlı bir uygulama görünür alandan çıktıktan sonra da mount edilmiş kalır. Onu `unmountApp(name)` ile unmount edin.
- Ne `activeWhen` ne de router route'u olan bir uygulama, onu bıraktığınız durumda kalır. `mountApp(name)` ve `unmountApp(name)` çağrılarını kendiniz yapın.
- `fallback` ham HTML'dir. Onu kullanıcı girdisinden oluşturmayın.

## Router seçenekleri

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // 'hash' path'i location.hash'ten okur
  base: '/app', // eşleştirmeden önce çıkarılır; push() ve replace() geri ekler
  routes: [
    { path: '/users/:id', app: 'users', meta: { title: 'User' } },
    { path: '/settings/*', app: 'settings' },
  ],
});

router.beforeEach(async ({ to }) => !to.startsWith('/admin'));
```

Route path'leri path'in tamamıyla eşleşir. Yani `/settings` yalnızca `/settings` ve `/settings/` ile, `'/'` ise yalnızca `/` ile eşleşir. Alt path'leri de eşleştirmek için path'i `/*` ile bitirin; `'/*'` her path ile eşleşir.

## Sandbox seçenekleri

```ts
import { createSandbox } from 'tuvix.js';

const sandbox = createSandbox({
  css: true, // activate() çağrısında shadow root
  js: true, // execScript() için proxy window
  allowedGlobals: ['gtag'], // strict modun yazmanıza izin verdiği ek global'ler
  strict: false, // true: başka bir global'e yazmak TypeError fırlatır
});
```

Orchestrator, `sandbox: true` ile kaydedilen uygulamalara CSS izolasyonu uygular. `JsSandbox` hiçbir zaman uygulamaz. Bkz. [Sandbox](/tr/guide/sandbox).

## Event bus seçenekleri

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus({
  maxListeners: 0, // 0 = sınırsız; sınır aşıldığında `on` listener'ı yine ekler ve olay başına bir kez uyarır
  debug: false, // her emit ve aboneliği logla
  logger: console.log,
});
```

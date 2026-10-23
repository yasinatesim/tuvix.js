# कॉन्फ़िगरेशन

सारा कॉन्फ़िगरेशन कोड में होता है। Tuvix.js कोई environment variable और कोई config file नहीं पढ़ता।

## Orchestrator विकल्प

```ts
import { createOrchestrator } from 'tuvix.js';

declare function reportError(error: Error, app: string): void;

const orchestrator = createOrchestrator({
  // Built-in router. Omit it when you follow an external router with connectRouter().
  router: {
    mode: 'history', // or 'hash'
    base: '/',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },

  // Passing eventBus options gives this orchestrator a private bus.
  // Omit it to share getGlobalBus() with every app on the page.
  eventBus: { maxListeners: 50, debug: false },

  // Forwarded to the module loader.
  loader: { timeout: 10000, retries: 2, retryDelay: 1000, globals: {} },

  // 'immediate' | 'idle' | 'hover' | 'none' (default)
  prefetch: { strategy: 'hover' },

  onError: (error, appName) => reportError(error, appName),
  onStatusChange: (appName, status) => console.debug(appName, status),
});
```

| विकल्प | डिफ़ॉल्ट | प्रभाव |
| --- | --- | --- |
| `router` | कोई नहीं | बिल्ट-इन राउटर बनाता है। देखें [रूटिंग](/hi/guide/routing)। |
| `eventBus` | कोई नहीं (global bus) | इन विकल्पों के साथ private bus। `destroy()` private bus को नष्ट करता है और global bus को चलता रहने देता है। |
| `loader.timeout` | `10000` | एक लोड प्रयास रद्द होने से पहले के milliseconds। sandboxed stylesheets के इंतज़ार की सीमा भी यही है। |
| `loader.retries` | `2` | पहली विफलता के बाद अतिरिक्त प्रयास। |
| `loader.retryDelay` | `1000` | प्रयासों के बीच के milliseconds। |
| `loader.globals` | `{}` | entry की scripts चलने से पहले `window` पर लिखी जाने वाली properties। |
| `prefetch.strategy` | `'none'` | mount से पहले entries कब fetch करनी हैं। नीचे की तालिका देखें। |
| `onError` | कोई नहीं | load, bootstrap, mount, update या unmount विफल होने पर `(error, appName)` के साथ call होता है। |
| `onStatusChange` | कोई नहीं | हर status बदलाव पर `(appName, status)` के साथ call होता है। |

React जैसी डिपेंडेंसी ऐप्स के बीच साझा करने के लिए `@tuvix.js/module-federation` या import maps इस्तेमाल करें। orchestrator में इसके लिए कोई विकल्प नहीं है।

### Prefetch strategies

| Strategy | entries कब fetch होती हैं |
| --- | --- |
| `none` | केवल तब जब ऐप mount होता है। |
| `immediate` | `start()` के तुरंत बाद, register की गई हर entry। |
| `idle` | `start()` के बाद पहले `requestIdleCallback` में, register की गई हर entry (जहाँ API नहीं है वहाँ 200 ms timeout)। |
| `hover` | जब pointer किसी same-origin link पर आता है या उस पर focus आता है, और उस link का path किसी ऐप को सक्रिय करेगा। हर ऐप एक बार fetch होता है। |

Prefetching module scripts के लिए `<link rel="modulepreload">` और classic scripts व styles के लिए `<link rel="prefetch">` जोड़ता है। यह loader-function entries को छोड़ देता है, क्योंकि function को call करने से module चल जाएगा।

## माइक्रो ऐप register करना

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

| Field | Type | प्रभाव |
| --- | --- | --- |
| `name` | `string` | अद्वितीय। module जिस नाम से register होता है, उससे match होना चाहिए। |
| `entry` | `string \| EntryConfig \| EntryLoader` | कोड कहाँ से आता है। नीचे देखें। |
| `container` | `string \| HTMLElement` | selector या element। mount के समय resolve होता है, इसलिए element का तभी तक मौजूद होना काफ़ी है। |
| `activeWhen` | `string \| (path) => boolean` | route pattern या predicate। इसके बिना ऐप उन राउटर `routes` को follow करता है जिनमें उसका नाम है, या आप उसे ख़ुद mount करते हैं। |
| `props` | `Record<string, unknown>` | शुरुआती props। `updateAppProps` इनमें merge करता है। |
| `fallback` | `string` | load, bootstrap या mount विफल होने पर container में लिखा जाने वाला HTML। |
| `sandbox` | `boolean \| { css?: boolean }` | `true` ऐप को shadow root में रेंडर करता है। देखें [Sandboxing](/hi/guide/sandbox)। |
| `mountWhenVisible` | `boolean` | container के 10% दिखने पर mount करता है। इसके बाद route बदलाव ऐप को नहीं छूते। |

### Entry के रूप

```ts
import type { Entry } from 'tuvix.js';

// One classic script (UMD or IIFE bundle).
const classic: Entry = 'https://cdn.example.com/legacy/app.js';

// Scripts and styles. `type: 'module'` for ES module bundles such as Vite's `.js` output.
const esm: Entry = {
  scripts: ['https://cdn.example.com/cart/main.js'],
  styles: ['https://cdn.example.com/cart/main.css'],
  type: 'module',
  integrity: { 'https://cdn.example.com/cart/main.js': 'sha384-...' },
};

// A loader function. Your bundler code-splits it; the loader passes an AbortSignal.
const lazy: Entry = () => import('./apps/profile');
```

`type` के बिना `.mjs`, `.mts`, `.ts`, `.tsx` या `.jsx` पर खत्म होने वाले URLs modules के रूप में लोड होते हैं और बाकी सब classic script के रूप में। ब्राउज़र एक URL पर module script एक ही बार चलाता है, इसलिए आप जिस `type: 'module'` ऐप को unload करते हैं, वह उसी URL से दोबारा लोड नहीं हो सकता। जब आपको unload करके फिर से लोड करना हो, तब loader function इस्तेमाल करें।

### registration के बारे में ज़रूरी बातें

- duplicate नाम, गायब `entry` या गायब `container` पर `register` एरर throw करता है।
- `start()` के बाद `register` तुरंत असर करता है: अगर मौजूदा path किसी route-managed ऐप को सक्रिय करता है तो वह mount हो जाता है, और `mountWhenVisible` वाले ऐप पर नज़र रखी जाने लगती है। `start()` से पहले `register` केवल config सहेजता है।
- viewport ऐप scroll होकर नज़र से बाहर जाने के बाद भी mount रहता है। उसे `unmountApp(name)` से unmount करें।
- जिस ऐप में न `activeWhen` है न राउटर route, वह वैसा ही रहता है जैसा आप उसे छोड़ते हैं। `mountApp(name)` और `unmountApp(name)` ख़ुद call करें।
- `fallback` raw HTML है। इसे user input से न बनाएँ।

## राउटर विकल्प

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // 'hash' reads the path from location.hash
  base: '/app', // stripped before matching, added by push() and replace()
  routes: [
    { path: '/users/:id', app: 'users', meta: { title: 'User' } },
    { path: '/settings/*', app: 'settings' },
  ],
});

router.beforeEach(async ({ to }) => !to.startsWith('/admin'));
```

Route paths पूरे path से match करते हैं, इसलिए `/settings` केवल `/settings` और `/settings/` से match करता है, और `'/'` केवल `/` से। sub-paths से match करने के लिए path के अंत में `/*` लगाएँ; `'/*'` हर path से match करता है।

## Sandbox विकल्प

```ts
import { createSandbox } from 'tuvix.js';

const sandbox = createSandbox({
  css: true, // shadow root on activate()
  js: true, // proxy window for execScript()
  allowedGlobals: ['gtag'], // extra globals strict mode lets you write
  strict: false, // true: writing any other global throws a TypeError
});
```

`sandbox: true` के साथ register किए गए ऐप्स पर orchestrator CSS isolation लागू करता है। यह `JsSandbox` कभी लागू नहीं करता। देखें [Sandboxing](/hi/guide/sandbox)।

## Event bus विकल्प

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus({
  maxListeners: 0, // 0 = unlimited; past the limit, `on` still adds the listener and warns once per event
  debug: false, // log every emit and subscription
  logger: console.log,
});
```

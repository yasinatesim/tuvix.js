---
title: '@tuvix.js/core'
---

<PackageHeader
  name="@tuvix.js/core"
  title="Core Orchestrator"
  description="माइक्रो ऐप्स को register करता है, उनकी entries load करता है, और URL बदलने पर उन्हें mount या unmount करता है। built-in राउटर या किसी बाहरी राउटर को follow करता है, मांगने पर ऐप की CSS को shadow root में अलग करता है, और lifecycle events को एक साझा event bus पर रिपोर्ट करता है।"
  icon="⚙️"
  npm="true"
/>

## इंस्टॉलेशन {#installation}

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

`@tuvix.js/core` की डिपेंडेंसी `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` और `@tuvix.js/sandbox` हैं। आपका package manager इन्हें साथ में install करता है।

## इसे कब इस्तेमाल करें {#when-to-use-it}

orchestrator को होस्ट पेज (shell) में तब इस्तेमाल करें जब अलग-अलग build किए गए कई ऐप्स एक पेज साझा करते हैं और URL तय करता है कि उनमें से कौन दिखेगा। आप हर ऐप को एक बार उसके entry URL, उसके container और उसके paths के साथ register करते हैं। orchestrator पहली बार ज़रूरत पड़ने पर entry load करता है, ऐप के `bootstrap`, `mount` और `unmount` कॉल करता है, और हर navigation के साथ पेज को तालमेल में रखता है।

इन मामलों में कुछ और चुनें:

- आप हर पेज पर एक फ्रेमवर्क island रेंडर करते हैं और सर्वर पहले से तय करता है कि क्या दिखाना है। adapters (`@tuvix.js/react`, `@tuvix.js/vue`, `@tuvix.js/svelte`, `@tuvix.js/angular`) और [`@tuvix.js/vite`](/hi/packages/vite) बिना orchestrator के islands mount करते हैं।
- आपको केवल एक remote script load करनी है और उसका lifecycle खुद कॉल करना है। [`@tuvix.js/loader`](/hi/packages/loader) इस्तेमाल करें।
- आप सब कुछ एक import से चाहते हैं। umbrella पैकेज [`tuvix.js`](/hi/packages/tuvix) install करें, जो इस पैकेज को re-export करता है।

## क्विक स्टार्ट {#quick-start}

shell दो ऐप्स register करता है जो `#main` साझा करते हैं, built-in राउटर से ब्राउज़र URL को follow करता है, और same-origin link clicks को राउटर navigations में बदलता है:

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

// Active on /dashboard and every path below it.
orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

// No activeWhen: the router route above activates it on /settings/*.
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

हर remote अपना lifecycle उसी नाम से publish करता है जिससे shell ने उसे register किया। plain DOM कोड के लिए `defineMicroApp` यह काम करता है; React, Vue, Svelte और Angular कंपोनेंट्स के लिए फ्रेमवर्क adapters यह काम करते हैं।

```ts
// dashboard/main.ts, built to https://cdn.example.com/dashboard/main.js
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

## ऐप्स active कैसे होते हैं {#how-apps-become-active}

हर registered ऐप पांच activation नियमों में से एक का पालन करता है। orchestrator ऐप के config से नियम चुनता है।

| Config | ऐप तब active होता है जब | इसे कौन unmount करता है |
| --- | --- | --- |
| `activeWhen: '/path'` | `matchPath('/path', currentPath).matched` का मान `true` हो | अगला reconcile, जिसमें path अब match नहीं करता |
| `activeWhen: (path) => boolean` | आपका function `true` लौटाए | अगला reconcile, जिसमें यह `false` लौटाता है |
| `activeWhen` नहीं, `router.routes` में नाम है | `app: name` वाला कोई route पूरे path से match करे | अगला reconcile, जिसमें ऐसा कोई route match नहीं करता |
| `activeWhen` नहीं, route नहीं | अपने आप कभी नहीं | आप, `mountApp` / `unmountApp` से |
| `mountWhenVisible: true` | इसका container कम से कम 10 % viewport के अंदर हो | आप; reconciles इसे छोड़ देते हैं और `activeWhen` को अनदेखा किया जाता है |

`activeWhen` strings `@tuvix.js/router` के [`matchPath`](/hi/packages/router) से होकर जाती हैं, वही matcher जो राउटर और `@tuvix.js/server` इस्तेमाल करते हैं:

- `?query` और `#hash` को अनदेखा किया जाता है, इसलिए `/dashboard?tab=2` पर dashboard mounted रहता है।
- एक साधारण pattern segment की सीमाओं पर अपने sub-paths से match करता है: `'/dashboard'` पर `/dashboard` और `/dashboard/stats` match होते हैं, `/dashboards` नहीं।
- `'/dashboard/*'` उन्हीं paths से match करता है जिनसे `'/dashboard'`।
- `:name` एक segment से match करता है: `'/users/:id'` पर `/users/42` match होता है।
- `'/'` हर path से match करता है।
- बाकी characters, जैसे `.` और `(`, अक्षरशः match होते हैं।

राउटर `routes` इसके बजाय पूरा match इस्तेमाल करते हैं। `{ path: '/settings' }` केवल `/settings` से match करता है; sub-paths शामिल करने के लिए `'/settings/*'` लिखें। `'/'` route केवल home page पर active होता है, और `'/*'` हर path पर active होता है। यहां भी query strings और hashes को अनदेखा किया जाता है।

### मौजूदा path कहां से आता है {#where-the-current-path-comes-from}

orchestrator पहले मौजूद source से path पढ़ता है:

1. वह राउटर जो आपने `connectRouter` को दिया (उसका `getPath()`)।
2. `config.router` से बना built-in राउटर (उसका `currentPath`)।
3. `window.location.pathname`।

`config.router` या `connectRouter` के साथ हर navigation एक reconcile शुरू करता है। दोनों के बिना, `start()` एक बार `window.location.pathname` के आधार पर reconcile करता है, और जब तक आप `reconcile()` कॉल नहीं करते, बाद के navigations पर कुछ नहीं होता।

### Reconciles एक-एक करके चलते हैं {#reconciles-run-one-at-a-time}

एक reconcile हर route-managed ऐप की path से तुलना करता है और DOM को उसके अनुसार बनाता है:

1. जिन ऐप्स को inactive होना चाहिए, वे पहले unmount होते हैं, सभी parallel में, ताकि एक container साझा करने वाले दो ऐप्स कभी overlap न करें।
2. फिर जिन ऐप्स को active होना चाहिए, वे parallel में load होते हैं (केवल पहली बार), bootstrap होते हैं (जब तक कोई `bootstrap` कॉल सफल न हो) और mount होते हैं।

reconcile के दौरान कोई navigation आता है तो orchestrator उसे queue में रखता है। तीन navigations queue में हों तो अगली बार केवल सबसे नया path चलता है, और queue खाली होने पर हर caller का promise resolve होता है। जो ऐप अपनी entry load होते समय inactive हो जाता है, वह अपना mount छोड़ देता है। जो ऐप `mount()` के बीच में inactive हो जाता है, वह उस mount के settle होते ही unmount होता है। `/a` → `/b` → `/a` पर तेज़ी से navigate करने पर केवल `a` mounted रहता है।

## API {#api}

### `createOrchestrator`

```ts no-check
function createOrchestrator(config?: OrchestratorConfig): Orchestrator;
```

एक `Orchestrator` बनाता है। `new Orchestrator(config)` के समान।

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | कोई नहीं | `@tuvix.js/router` से built-in राउटर बनाता है, `mode` (`'history'` या `'hash'`, default `'history'`), `base` और `routes` (ज़रूरी, `[]` हो सकता है) के साथ। `navigateTo` और `ROUTE_CHANGE` events के लिए ज़रूरी। |
| `eventBus` | `EventBusOptions` | कोई नहीं | private bus के लिए विकल्प (`maxListeners`, `debug`, `logger`)। इसे छोड़ दें तो orchestrator `getGlobalBus()` इस्तेमाल करता है, वह bus जिसे पेज का हर ऐप साझा करता है। |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | आंतरिक `ModuleLoader` को दिया जाता है। `timeout` हर प्रयास के लिए ms में है (`0` इसे बंद करता है); entry की scripts चलने से पहले `globals` को `window` पर लिखा जाता है। |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | ज़रूरत पड़ने से पहले entries कब download करनी हैं। नीचे देखें। |
| `onError` | `(error: Error, appName: string) => void` | कोई नहीं | तब कॉल होता है जब कोई ऐप load, bootstrap, mount, update या unmount में fail होता है। `OrchestratorEvent.APP_ERROR` उन्हीं failures को phase के साथ रिपोर्ट करता है। |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | कोई नहीं | हर ऐप के हर status बदलाव पर कॉल होता है। |

Prefetch strategies script और style URLs को `<link rel="prefetch">` या `<link rel="modulepreload">` से download करती हैं, उन्हें चलाए बिना। loader-function entries छोड़ दी जाती हैं, क्योंकि function कॉल करने से module चल जाएगा।

- `'immediate'`: हर registered ऐप, `start()` के दौरान।
- `'idle'`: हर registered ऐप, `start()` के बाद पहले `requestIdleCallback` में (जहां यह API नहीं है, वहां 200 ms का `setTimeout`)।
- `'hover'`: जब pointer किसी same-origin link में प्रवेश करता है, या focus उस पर आता है, तो orchestrator उन ऐप्स को prefetch करता है जिन्हें उस link का path active करेगा। हर ऐप एक बार prefetch होता है। hash mode और `router.base` का ध्यान रखा जाता है।

`destroy()` बाकी बचे idle और hover prefetching को रद्द करता है।

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

ऐप का config संग्रहित करता है। यह कुछ load, mount या reconcile नहीं करता; यह काम `start()` और बाद के navigations करते हैं।

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | ज़रूरी | ऐप का अद्वितीय नाम। remote module को इसी नाम से register होना चाहिए (`defineMicroApp({ name })` या adapter का `name`), या `mount` function वाला एक नया `window` global expose करना चाहिए। |
| `entry` | `Entry` | ज़रूरी | एक script URL, एक `EntryConfig` (`{ scripts, styles?, type?, integrity? }`), या `() => import('./dashboard')` जैसा loader function। [`@tuvix.js/loader`](/hi/packages/loader) देखें। |
| `container` | `string \| HTMLElement` | ज़रूरी | CSS selector या element। हर mount पर selector को `document.querySelector` से resolve किया जाता है। |
| `activeWhen` | `string \| ((path: string) => boolean)` | कोई नहीं | Activation नियम। [ऐप्स active कैसे होते हैं](#how-apps-become-active) देखें। |
| `props` | `Record<string, unknown>` | कोई नहीं | `mount()` को दिए जाते हैं। `updateAppProps` इनमें merge करता है। |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | `true` या `{ css: true }` ऐप को उसके container पर एक shadow root के अंदर रेंडर करता है। [CSS isolation](#css-isolation) देखें। |
| `fallback` | `string` | कोई नहीं | loading, bootstrapping या mounting fail होने पर `innerHTML` से container में लिखा जाने वाला HTML। update और unmount failures container को नहीं छूते। |
| `mountWhenVisible` | `boolean` | `false` | container के 10 % दिखते ही `IntersectionObserver` की मदद से mount करें। reconciles ऐप और उसके `activeWhen` को अनदेखा करते हैं। |

`[Tuvix] App name is required.`, `[Tuvix] App "<name>" is already registered.`, `[Tuvix] App "<name>" requires an entry.` या `[Tuvix] App "<name>" requires a container.` throw करता है।

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

built-in राउटर (अगर है) को subscribe करता है, मौजूदा path के आधार पर reconcile करता है, prefetching सेट करता है और `mountWhenVisible` containers को observe करना शुरू करता है। `OrchestratorEvent.STARTED` emit करता है। पहले reconcile के बाद resolve होता है, तब भी जब उसमें कोई ऐप fail हुआ हो; failures `onError`, `APP_ERROR` और console में जाते हैं। दूसरी कॉल `[Tuvix] Orchestrator is already started.` log करती है और लौट जाती है।

#### `mountApp(name)` / `unmountApp(name)`

एक ऐप को हाथ से mount या unmount करें। इन्हें उन ऐप्स के लिए इस्तेमाल करें जिनके पास `activeWhen` या route नहीं है; route-managed ऐप्स के लिए अगला reconcile आपकी पसंद को override कर देता है।

`mountApp` चल रहे unmount का इंतज़ार करता है, फिर load और mount करता है। `fallback` रेंडर करने के बाद यह load या mount एरर के साथ reject करता है। `unmountApp` चल रहे load या mount का इंतज़ार करता है, फिर unmount करता है; load के दौरान कॉल होने पर यह mount को पूरी तरह छोड़ देता है।

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'chat', entry: '/chat/main.js', container: '#chat' });
await orchestrator.start();

document.querySelector('#open-chat')?.addEventListener('click', () => {
  orchestrator.mountApp('chat').catch(() => {
    // fallback HTML is already in #chat
  });
});
```

#### `updateAppProps(name, props)`

`props` को ऐप के मौजूदा props में shallow-merge करता है। `update` function वाले mounted ऐप को merged object `update({ props, container })` के रूप में मिलता है। अन्यथा orchestrator merged props संग्रहित करता है और उन्हें अगले `mount()` को देता है। यह पहले pending mount का इंतज़ार करता है, ताकि update नए instance तक पहुंचे। `update` throw करे तो status `error` हो जाता है, `onError` चलता है, promise reject होता है, और संग्रहित props नहीं बदलते।

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'cart', entry: '/cart/main.js', container: '#cart', activeWhen: '/' });
await orchestrator.start();

await orchestrator.updateAppProps('cart', { currency: 'EUR' });
```

#### `reconcile(path?)`

`path` के आधार पर, या उसे छोड़ने पर मौजूदा path के आधार पर, एक reconcile queue में रखता है। इसे तब इस्तेमाल करें जब कोई राउटर orchestrator को navigations के बारे में नहीं बताता। [Reconciles एक-एक करके चलते हैं](#reconciles-run-one-at-a-time) वाले queue नियम लागू होते हैं।

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.reconcile('/dashboard?tab=stats');
```

#### `connectRouter(source)`

built-in राउटर के बजाय किसी बाहरी राउटर (TanStack Router, React Router, आपका अपना) को follow करता है। `source.subscribe(callback)` को हर navigation के बाद `callback` कॉल करना चाहिए और एक unsubscribe function लौटाना चाहिए; `source.getPath()` मौजूदा path लौटाता है। `start()` के बाद हर callback `getPath()` के आधार पर reconcile करता है। `start()` भी `getPath()` पढ़ता है। पहले से start हो चुके orchestrator को connect करने पर वह तुरंत reconcile करता है। `disconnect()` लौटाता है।

```ts
import { createOrchestrator } from '@tuvix.js/core';

// TanStack Router instance created elsewhere in your shell.
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

// Later, when the shell tears down:
disconnect();
```

React Router का data router (`createBrowserRouter`) भी इसी ढांचे में फिट होता है: `subscribe: (callback) => router.subscribe(() => callback())` और `getPath: () => router.state.location.pathname`।

#### `navigateTo(path)`

built-in राउटर पर `push(path)` कॉल करता है। URL बदलने के बाद promise resolve होता है; इससे शुरू हुआ reconcile background में चलता है। `config.router` के बिना `[Tuvix] No router configured.` throw करता है।

#### `getAppStatus(name)`, `getRegisteredApps()`, `getMountedApps()`

`getAppStatus` ऐप का `AppStatus` लौटाता है, या अज्ञात नाम के लिए `null`। `getRegisteredApps` हर registered नाम लौटाता है। `getMountedApps` वे नाम लौटाता है जिनका status `'mounted'` है (`'updating'` वाला ऐप शामिल नहीं होता)।

#### `getEventBus()`, `getRouter()`

`getEventBus` वह bus लौटाता है जिस पर orchestrator `OrchestratorEvent`s emit करता है और जिसे वह `mount()` को देता है: `getGlobalBus()`, या `eventBus` सेट करने पर private bus। `getRouter` built-in राउटर लौटाता है, या `null`।

#### `unregister(name)`

ऐप को unmount करता है (चल रहे mount का इंतज़ार करके), उसके container को observe करना बंद करता है, entry के script और style tags हटाता है, cached module हटाता है और ऐप को भूल जाता है। अज्ञात नामों के लिए reject करता है। ब्राउज़र एक module script को हर URL के लिए एक बार चलाते हैं, इसलिए `type: 'module'` वाली URL entry को फिर से register करने के लिए नया URL या loader function चाहिए।

#### `destroy()`

prefetching बंद करता है, built-in राउटर और हर connected राउटर से unsubscribe करता है, चल रहे reconcile का इंतज़ार करता है, हर ऐप को unmount करता है, loader cache साफ़ करता है और `OrchestratorEvent.DESTROYED` emit करता है। यह private bus को destroy करता है और global bus को चालू छोड़ता है। दोबारा कॉल करने पर वही promise मिलता है। इसके बाद `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` और `connectRouter` एरर `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.` throw करते हैं।

### `defineMicroApp`

```ts no-check
function defineMicroApp(definition: MicroAppDefinition): MicroAppModule;
```

एक lifecycle object को validate करता है, उसे `@tuvix.js/loader` के `registerModule(definition.name, module)` से publish करता है, और उसे लौटाता है। इसे remote ऐप की entry में कॉल करें। entry की scripts चलने के बाद orchestrator module को नाम से ढूंढता है, चाहे entry URL हो या loader function।

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | ज़रूरी | shell द्वारा register किए गए `name` के बराबर होना चाहिए। |
| `bootstrap` | `() => void \| Promise<void>` | कोई नहीं | पहले load के बाद, पहले mount से पहले चलता है। यह throw करे तो mount fail होता है और अगला mount इसे फिर कॉल करता है; एक बार सफल होने के बाद यह उस orchestrator के लिए फिर कभी नहीं चलता। |
| `mount` | `(context: MountContext) => void \| Promise<void>` | ज़रूरी | `context.container` में रेंडर करें। |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | ज़रूरी | सब कुछ हटाएं और `context.container` को खाली करें। |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | कोई नहीं | बिना remount के `context.props` लागू करें। इसके बिना, नए props अगले mount का इंतज़ार करते हैं। |
| `ssr` | `boolean` | `false` | इसे तब सेट करें जब `mount` सर्वर पर रेंडर हुए markup को अपनाता है। तब `mount` चलने से पहले container में markup होने पर `tuvix:mounted` event `hydrated: true` रिपोर्ट करता है। |

`MountContext` में ये होते हैं:

| Field | Type | अर्थ |
| --- | --- | --- |
| `container` | `HTMLElement` | वह element जिसमें रेंडर करना है। CSS-isolated ऐप्स के लिए यह shadow root के अंदर एक `<div data-tuvix-sandbox-root>` होता है। |
| `props` | `Record<string, unknown> \| undefined` | मौजूदा props। |
| `name` | `string \| undefined` | registered ऐप का नाम। |
| `bus` | `MicroAppBus \| undefined` | orchestrator का event bus (`on`, `once`, `emit`, `off`)। |

लौटाया गया module आपके `mount` और `unmount` को wrap करता है और फ्रेमवर्क adapters वाले ही DOM lifecycle events dispatch करता है, इसलिए `@tuvix.js/loader` के `whenMounted(name)`, `isMounted(name)` और `onLifecycle` इन ऐप्स के लिए काम करते हैं:

- `mount` resolve होने के बाद `tuvix:mounted`, `{ name, container, hydrated }` के साथ।
- `unmount` resolve होने के बाद `tuvix:unmounted`।
- दोनों में से कोई throw करे तो `tuvix:error`। इसके बाद wrapper एरर को फिर से throw करता है।

events container से `document` तक bubble होते हैं। जो container document से जुड़ा नहीं है, उसके लिए runtime इन्हें सीधे `document` पर dispatch करता है। उसी container के लिए `mount` चलते समय आने वाला `unmount` पहले उस mount का इंतज़ार करता है।

`[Tuvix] defineMicroApp requires a "name" property.`, `[Tuvix] defineMicroApp "<name>" requires a "mount" function.` या `[Tuvix] defineMicroApp "<name>" requires an "unmount" function.` throw करता है।

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

उन events का string enum जिन्हें orchestrator अपने bus पर emit करता है। default bus `getGlobalBus()` है, इसलिए पेज का कोई भी ऐप इन्हें सुन सकता है।

| Member | Event का नाम | Payload |
| --- | --- | --- |
| `APP_REGISTERED` | `'tuvix:app:registered'` | `{ name }` |
| `APP_BOOTSTRAP` | `'tuvix:app:bootstrap'` | `{ name }` |
| `APP_MOUNT` | `'tuvix:app:mount'` | `{ name }` |
| `APP_UNMOUNT` | `'tuvix:app:unmount'` | `{ name }` |
| `APP_ERROR` | `'tuvix:app:error'` | `AppErrorEvent`: `{ name, error, phase }`, जहां `phase` का मान `'load'`, `'bootstrap'`, `'mount'`, `'update'` या `'unmount'` है |
| `APP_STATUS_CHANGE` | `'tuvix:app:status-change'` | `{ name, status }` |
| `ROUTE_CHANGE` | `'tuvix:route:change'` | built-in राउटर का `NavigationEvent` (`from`, `to`, `fromRoute`, `toRoute`) |
| `STARTED` | `'tuvix:started'` | `{}` |
| `DESTROYED` | `'tuvix:destroyed'` | `{}` |

`phase: 'load'` में entry load करने के साथ container को resolve करना भी शामिल है।

```ts
import { createOrchestrator, getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
```

### CSS isolation {#css-isolation}

`sandbox: true` या `sandbox: { css: true }` ऐप की CSS को अलग करता है:

1. पहले mount पर orchestrator [`@tuvix.js/sandbox`](/hi/packages/sandbox) के `CssSandbox` से container पर एक open shadow root जोड़ता है और मौजूदा children (सर्वर पर रेंडर हुआ markup) को उसके अंदर एक `<div data-tuvix-sandbox-root="<name>">` में ले जाता है। ऐप उसी div में mount होता है।
2. entry की `styles` `document.head` के बजाय shadow root के अंदर `<link>` elements के रूप में load होती हैं। mount उनके load या fail होने तक इंतज़ार करता है, अधिकतम `loader.timeout` ms तक (default 10000; `0` होने पर बिना सीमा के इंतज़ार करता है)।
3. unmount shadow root को बनाए रखता है। अगला mount उसे फिर से इस्तेमाल करता है।

पेज की stylesheets अब ऐप के अंदर के elements से match नहीं करतीं, और ऐप की stylesheets अब पेज तक नहीं पहुंचतीं। `color` और `font-family` जैसी inherited properties फिर भी shadow boundary पार करती हैं। `{ css: false }` और `false` light DOM में रेंडर करते हैं।

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

orchestrator JavaScript को sandbox नहीं करता। [`@tuvix.js/sandbox`](/hi/packages/sandbox) का `JsSandbox` एक standalone utility है जिसे आप खुद कॉल करते हैं।

### Types {#types}

| Type | अर्थ |
| --- | --- |
| `OrchestratorConfig` | `createOrchestrator` और `new Orchestrator` का argument। `createOrchestrator` के नीचे की तालिका देखें। |
| `MicroAppConfig` | `register` का argument। `register` के नीचे की तालिका देखें। |
| `MicroAppDefinition` | `defineMicroApp` का argument: `name`, `bootstrap?`, `mount`, `unmount`, `update?`। |
| `AppSandboxOption` | `boolean \| { css?: boolean }`, `sandbox` field। |
| `RouterSource` | `{ subscribe(callback: () => void): () => void; getPath(): string }`, `connectRouter` का argument। |
| `AppErrorEvent` | `{ name: string; error: Error; phase: AppErrorPhase }`, `APP_ERROR` का payload। |
| `AppErrorPhase` | `'load' \| 'bootstrap' \| 'mount' \| 'update' \| 'unmount'`। |
| `AppStatus` | `'registered' \| 'bootstrapping' \| 'bootstrapped' \| 'mounting' \| 'mounted' \| 'updating' \| 'unmounting' \| 'unmounted' \| 'error'`। पहला mount `registered → bootstrapping → bootstrapped → mounting → mounted` क्रम से गुज़रता है; remount `unmounted → mounting → mounted` क्रम से। |
| `RegisteredApp` | एक ऐप के लिए orchestrator के record का ढांचा: `config`, `status`, `module`, `container`, `error`, `lastUpdated`। 0.5.0 में कोई `Orchestrator` method इसे नहीं लौटाता। |

### Re-exports {#re-exports}

`@tuvix.js/core` ये चीज़ें अपनी डिपेंडेंसीज़ से re-export करता है, ताकि shell सब कुछ एक पैकेज से import कर सके। हर link पूरे API का वर्णन करता है।

| Export | प्रकार | Source |
| --- | --- | --- |
| `createEventBus`, `getGlobalBus` | function | [`@tuvix.js/event-bus`](/hi/packages/event-bus) |
| `IEventBus`, `EventHandler`, `Unsubscribe` | type | [`@tuvix.js/event-bus`](/hi/packages/event-bus) |
| `createRouter`, `matchPath`, `interceptLinks` | function | [`@tuvix.js/router`](/hi/packages/router) |
| `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions` | type | [`@tuvix.js/router`](/hi/packages/router) |
| `createLoader` | function | [`@tuvix.js/loader`](/hi/packages/loader) |
| `Entry`, `MicroAppModule` | type | [`@tuvix.js/loader`](/hi/packages/loader) |

`getGlobalBus()` अपना instance `window.__TUVIX_GLOBAL_BUS__` पर रखता है, इसलिए जो माइक्रो ऐप `@tuvix.js/event-bus` की अपनी कॉपी bundle करता है, उसे भी shell वाला bus ही मिलता है।

## Edge cases {#edge-cases}

- `start()` से पहले `register()` केवल config संग्रहित करता है। `start()` के बाद route-managed ऐप (जिसके पास `activeWhen` है, या जिसका नाम किसी राउटर route में है) register करने पर मौजूदा path के आधार पर reconcile होता है, इसलिए path उस ऐप को active करता हो तो ऐप तुरंत mount होता है।
- `start()` के बाद register किया गया `mountWhenVisible` ऐप तुरंत observe होता है। अगर उस समय (या `start()` के समय) container DOM में नहीं है तो उसे छोड़ दिया जाता है और कभी observe नहीं किया जाता। `IntersectionObserver` के बिना (सर्वर, पुराने ब्राउज़र) viewport ऐप्स कभी mount नहीं होते।
- जो viewport ऐप mount में fail हुआ, वह `error` में रहता है; observer उसे दोबारा नहीं आज़माता।
- `error` में पड़ा route-managed ऐप अगले उस reconcile पर दोबारा कोशिश करता है जो उसे active चाहता है। fail हुआ load फिर से load होता है। fail हुआ `bootstrap` दोबारा कोशिश में `bootstrap` फिर से चलाता है; सफल `bootstrap` दोहराया नहीं जाता, इसलिए fail हुआ `mount` केवल `mount` को दोबारा आज़माता है।
- container न मिलने पर mount `[Tuvix] Container "#main" not found in DOM.` के साथ fail होता है। पहले mount पर `fallback` के रेंडर होने की कोई जगह नहीं होती।
- reconcile failures `start()`, `reconcile()` या navigations को reject नहीं करते। orchestrator console में `[Tuvix] Failed to mount "<name>":` (या `unmount`) log करता है और `onError` कॉल करता है। `mountApp` और `unmountApp` reject करते हैं।
- `APP_ERROR` हर phase की failures के लिए fire होता है, और `phase` उस phase का नाम बताता है। `fallback` केवल `load`, `bootstrap` और `mount` failures पर रेंडर होता है।
- जिस ऐप का unmount throw करता है, वह `error` में पहुंचता है और unmounted गिना जाता है।
- `fallback` `innerHTML` से होकर जाता है। केवल भरोसेमंद markup दें।
- unmount ऐप की entry stylesheets को `document.head` से हटाता है, जब तक कोई दूसरा loaded ऐप वही URL इस्तेमाल न करे। अगला mount उन्हें वापस जोड़ता है और उनका इंतज़ार करता है।
- एक पेज पर दो orchestrators `getGlobalBus()` साझा करते हैं और एक-दूसरे के `OrchestratorEvent`s देखते हैं। किसी एक को private bus देने के लिए `eventBus: {}` दें।
- `@tuvix.js/event-bus` का `resetGlobalBus()` उस bus को destroy करता है जो चल रहे orchestrator के पास है। orchestrator destroyed bus को ही रखे रहता है; `resetGlobalBus()` केवल `destroy()` के बाद कॉल करें, उदाहरण के लिए tests के बीच।
- `start()` से पहले fire होने वाले `connectRouter` callbacks को अनदेखा किया जाता है। `connectRouter` को दो बार कॉल करने पर दोनों subscriptions बने रहते हैं; `start()` और `reconcile()` के लिए path सबसे नया source देता है।
- `config.router` और `connectRouter` दोनों होने पर हर source अपने path के आधार पर reconcile करता है। इनमें से एक ही इस्तेमाल करें।
- `activeWhen` functions को source से raw path मिलता है। built-in राउटर या `connectRouter` के साथ उस path में query string हो सकती है; string patterns के लिए `matchPath` उसे हटा देता है।
- `updateAppProps` nested objects को बदल देता है: `{ user: { id: 2 } }` पूरे `user` prop को overwrite करता है।

## यह क्या नहीं करता {#what-it-does-not-do}

- यह JavaScript को sandbox नहीं करता। ऐप जो globals, timers और listeners बनाता है, वे `window` पर बने रहते हैं। [`@tuvix.js/sandbox`](/hi/packages/sandbox) का `JsSandbox` इस्तेमाल करें।
- यह link clicks को intercept नहीं करता। `interceptLinks` (यहां re-exported) कॉल करें या अपने फ्रेमवर्क राउटर को navigate करने दें।
- यह सर्वर पर रेंडर नहीं करता। [`@tuvix.js/server`](/hi/packages/server) और adapters की `./server` entries इस्तेमाल करें।
- यह ऐप्स के बीच डिपेंडेंसीज़ साझा नहीं करता। [`@tuvix.js/module-federation`](/hi/packages/module-federation) या import maps इस्तेमाल करें।
- यह DOM lifecycle events (`tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`) खुद emit नहीं करता। `defineMicroApp` से बने modules और फ्रेमवर्क adapters इन्हें emit करते हैं; हाथ से लिखा गया `MicroAppModule` तब तक कोई event emit नहीं करता जब तक वह `@tuvix.js/loader` का `emitLifecycle` कॉल न करे।
- unmount होने पर यह ऐप को जीवित नहीं रखता। ऐप के अंदर की state खो जाती है, जब तक ऐप उसे कहीं और संग्रहित न करे।

## 0.4 से माइग्रेशन {#migrating-from-0-4}

0.5.0 में breaking changes:

- **साझा event bus।** जब तक आप `eventBus` नहीं देते, orchestrator का bus `getGlobalBus()` होता है। 0.4 में हर orchestrator अपना bus बनाता था। `destroy()` अब global bus को चालू छोड़ता है।

  ```ts
  import { createOrchestrator } from '@tuvix.js/core';

  // 0.5: keep a private bus as in 0.4
  const orchestrator = createOrchestrator({ eventBus: {} });
  ```

- **Manual ऐप्स mounted रहते हैं।** reconciles अब उन ऐप्स को unmount नहीं करते जिनके पास न `activeWhen` है न राउटर route, और न ही `mountWhenVisible` ऐप्स को। 0.4 में अगला route बदलाव हाथ से mount किए गए ऐप को unmount कर देता था। जहां आप इस व्यवहार पर निर्भर थे, वहां `unmountApp(name)` कॉल करें।
- **`sandbox: true` shadow root इस्तेमाल करता है।** पेज की CSS अब ऐप तक नहीं पहुंचती, और entry की `styles` अब पेज तक नहीं पहुंचतीं। 0.4 वाली रेंडरिंग बनाए रखने के लिए `sandbox` हटाएं या `{ css: false }` सेट करें।
- **`prefetch: { strategy: 'hover' }`** केवल उन ऐप्स को prefetch करता है जिन्हें hover या focus किया गया link active करता है। 0.4 में कहीं भी पहली mouse movement हर ऐप को prefetch कर देती थी।
- **`activeWhen` `matchPath` इस्तेमाल करता है।** query string या hash अब ऐप को unmount नहीं करता, `:param` segments काम करते हैं, और `.` और `(` जैसे characters अक्षरशः match होते हैं।
- **`shared` हटा दिया गया।** `OrchestratorConfig.shared` कभी पढ़ा नहीं गया और इसे type से हटा दिया गया है। इसे delete करें; डिपेंडेंसीज़ [`@tuvix.js/module-federation`](/hi/packages/module-federation) या import maps से साझा करें।
- **राउटर `routes` पूरा match करते हैं।** `{ path: '/', app: 'home' }` route केवल `/` पर active होता है। हर path पर दिखने वाले ऐप के लिए `'/*'` इस्तेमाल करें, या `activeWhen: '/'`, जो prefix matching बनाए रखता है। `RouteConfig.exact` हटा दिया गया है; इसे भी हटाएं।
- **`APP_ERROR` payload।** अब इसमें `phase` होता है और यह update और unmount failures पर भी fire होता है। जो handlers mount failure मानकर चलते थे, उन्हें `phase` जांचना चाहिए।

बाहरी राउटर्स के लिए 0.4 वाला workaround अब हटाया जा सकता है:

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

इस पेज के पुराने संस्करणों में ऐसे methods और विकल्पों का वर्णन था जो `Orchestrator` में नहीं हैं। असली नाम इस्तेमाल करें:

| पुराना पेज | असली API |
| --- | --- |
| `createOrchestrator({ container })` | `container` हर ऐप के `register()` में आता है |
| `register(name, options)` | `register({ name, entry, container, ... })` |
| `mount(name, props)` | `updateAppProps(name, props)` फिर `mountApp(name)` |
| `unmount(name)` | `unmountApp(name)` |
| `update(name, props)` | `updateAppProps(name, props)` |
| `stop()` | `destroy()` |
| `onBeforeMount`, `onAfterMount` | `onStatusChange(name, status)` या `OrchestratorEvent.APP_MOUNT` |
| `sandbox: { js: true }` | `@tuvix.js/sandbox` का `JsSandbox` |

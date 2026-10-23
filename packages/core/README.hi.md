# @tuvix.js/core

> Orchestrator जो माइक्रो ऐप्स को load करता है और URL बदलने पर उन्हें mount या unmount करता है।

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा।

पूरा डॉक्यूमेंटेशन: [tuvix.js.org/hi/packages/core](https://tuvix.js.org/hi/packages/core)

## इंस्टॉलेशन

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

यह `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` और `@tuvix.js/sandbox` पर निर्भर है।

## क्विक स्टार्ट

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

Remote ऐप (`dashboard/main.js`):

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

## ऐप्स active कैसे होते हैं

- `activeWhen: '/path'`: `@tuvix.js/router` के `matchPath` से match होता है। Query और hash को ignore किया जाता है। `'/dashboard'` और `'/dashboard/*'` दोनों `/dashboard` और उसके हर sub-path से match करते हैं (`/dashboards` से नहीं), `:id` एक segment से match करता है, `'/'` हर path से match करता है।
- `activeWhen: (path) => boolean`: फ़ैसला आपका function करता है।
- `activeWhen` नहीं है, पर नाम `router.routes` में है: जब तक `app: name` वाला कोई route पूरे path से match करता है, ऐप active रहता है। `'/'` route का मतलब सिर्फ़ home page है, `'/*'` का मतलब हर path।
- दोनों में से कुछ नहीं: आप `mountApp` / `unmountApp` कॉल करते हैं, reconciles ऐप को नहीं छूते।
- `mountWhenVisible: true`: container के 10 % दिखते ही mount करता है, `activeWhen` को ignore करता है।

मौजूदा path `connectRouter` के `getPath()` से आता है, वह न हो तो built-in राउटर से, और वह भी न हो तो `window.location.pathname` से। Reconciles एक-एक करके चलते हैं: पहले inactive ऐप्स unmount होते हैं, फिर active ऐप्स mount होते हैं। कतार में लगे navigations सबसे नए path में सिमट जाते हैं। Load होते समय inactive हुआ ऐप अपना mount छोड़ देता है। Mount के बीच inactive हुआ ऐप mount पूरा होते ही unmount होता है।

## API

### `createOrchestrator(config?)` / `new Orchestrator(config?)`

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | none | Built-in राउटर: `mode` (`'history'` default या `'hash'`), `base`, `routes` (ज़रूरी)। |
| `eventBus` | `EventBusOptions` | none | Private bus के विकल्प। न दें तो orchestrator `getGlobalBus()` इस्तेमाल करता है। |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | Module loader को दिए जाते हैं, साथ में `globals`। |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | `immediate`: `start()` पर, `idle`: पहले idle period में, `hover`: जब किसी ऐप को active करने वाले same-origin link पर pointer या focus आए। |
| `onError` | `(error: Error, appName: string) => void` | none | Load, bootstrap, mount, update और unmount की विफलताएं। |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | none | हर status बदलाव। |

### `Orchestrator` methods

| Method | व्यवहार |
| --- | --- |
| `register(appConfig: MicroAppConfig): void` | Config सहेजता है। Load, mount या reconcile नहीं करता। |
| `unregister(name): Promise<void>` | Unmount करता है, entry के tags और cached module हटाता है, ऐप को भूल जाता है। |
| `start(): Promise<void>` | राउटर को follow करता है, reconcile करता है, prefetch और viewport observing शुरू करता है। `STARTED` emit करता है। |
| `mountApp(name): Promise<void>` | चल रहे unmount का इंतज़ार करता है, फिर mount करता है। `fallback` रेंडर करने के बाद एरर के साथ reject करता है। |
| `unmountApp(name): Promise<void>` | चल रहे load या mount का इंतज़ार करता है, फिर unmount करता है। |
| `updateAppProps(name, props): Promise<void>` | Props को shallow-merge करता है। Mounted ऐप पर `update({ props, container })` कॉल करता है, नहीं तो उन्हें अगले mount के लिए रखता है। |
| `reconcile(path?): Promise<void>` | `path` या मौजूदा path के लिए reconcile कतार में डालता है। |
| `connectRouter({ subscribe, getPath }): () => void` | बाहरी राउटर को follow करता है। `disconnect` लौटाता है। |
| `navigateTo(path): Promise<void>` | Built-in राउटर पर `push(path)`। राउटर न हो तो `[Tuvix] No router configured.` throw करता है। |
| `getAppStatus(name): AppStatus \| null` | Status, या अनजान नामों के लिए `null`। |
| `getRegisteredApps(): string[]` | Registered नाम। |
| `getMountedApps(): string[]` | `'mounted'` status वाले नाम। |
| `getEventBus(): IEventBus` | `getGlobalBus()` या private bus। |
| `getRouter(): IRouter \| null` | Built-in राउटर या `null`। |
| `destroy(): Promise<void>` | चल रहे reconcile का इंतज़ार करता है, हर ऐप unmount करता है, सुनना बंद करता है, `DESTROYED` emit करता है। Global bus को चालू रहने देता है। |

`register` के विकल्प:

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | required | Unique। Remote इसी नाम से register होता है। |
| `entry` | `Entry` | required | URL, `{ scripts, styles?, type?, integrity? }`, या `() => import('./app')`। |
| `container` | `string \| HTMLElement` | required | Selector (हर mount पर resolve होता है) या element। |
| `activeWhen` | `string \| ((path: string) => boolean)` | none | Activation का नियम। |
| `props` | `Record<string, unknown>` | none | `mount()` को दिए जाते हैं। |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | Shadow root के अंदर रेंडर करें, entry की `styles` वहीं load होती हैं। |
| `fallback` | `string` | none | Load, bootstrap या mount विफल होने पर `innerHTML` से सेट होने वाला HTML। |
| `mountWhenVisible` | `boolean` | `false` | Viewport में 10 % दिखने पर mount करें। |

TanStack Router के साथ `connectRouter`:

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
// later: disconnect();
```

### `defineMicroApp(definition): MicroAppModule`

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | required | Registered नाम के बराबर होना चाहिए। |
| `bootstrap` | `() => void \| Promise<void>` | none | पहले mount से पहले चलता है। विफल bootstrap अगले mount पर फिर चलता है, सफल bootstrap एक बार चलता है। |
| `mount` | `(context: MountContext) => void \| Promise<void>` | required | `container`, `props`, `name` और `bus` पाता है। |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | required | `container` पाता है। |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | none | `props` और `container` पाता है। |
| `ssr` | `boolean` | `false` | `mount` सर्वर markup को अपनाता है। Container में markup होने पर `mounted` event `hydrated: true` बताता है। |

यह `@tuvix.js/loader` के `registerModule` से module publish करता है और उसे लौटाता है। Module `tuvix:mounted`, `tuvix:unmounted` और `tuvix:error` DOM events dispatch करता है (जो `document` तक bubble होते हैं), इसलिए `whenMounted`, `isMounted` और `onLifecycle` उसके लिए काम करते हैं। उसी container पर चल रहे `mount` के दौरान आया `unmount` उसका इंतज़ार करता है। `name`, `mount` या `unmount` न होने पर यह throw करता है।

### `OrchestratorEvent`

Orchestrator के bus पर events: `APP_REGISTERED` (`tuvix:app:registered`), `APP_BOOTSTRAP`, `APP_MOUNT`, `APP_UNMOUNT`, `APP_ERROR` (`AppErrorEvent`: `'load'`, `'bootstrap'`, `'mount'`, `'update'` या `'unmount'` की विफलताओं के लिए `{ name, error, phase }`), `APP_STATUS_CHANGE` (`{ name, status }`), `ROUTE_CHANGE` (सिर्फ़ built-in राउटर), `STARTED`, `DESTROYED`।

```ts
import { getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

### CSS isolation

`sandbox: true` या `{ css: true }` container पर एक open shadow root जोड़ता है (remount पर वही दोबारा इस्तेमाल होता है), ऐप को उसके अंदर एक `<div data-tuvix-sandbox-root>` में mount करता है, और entry की `styles` वहीं load करता है। Mount, stylesheets के लिए `loader.timeout` तक इंतज़ार करता है। JavaScript sandboxed नहीं होता। `@tuvix.js/sandbox` का `JsSandbox` एक अलग utility है।

### Types

`OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition`, `AppSandboxOption`, `RouterSource`, `AppErrorEvent`, `AppErrorPhase`, `AppStatus` (`registered`, `bootstrapping`, `bootstrapped`, `mounting`, `mounted`, `updating`, `unmounting`, `unmounted`, `error`), `RegisteredApp` (record का आकार, कोई method इसे नहीं लौटाता)।

### Re-exports

- `@tuvix.js/event-bus` से: `createEventBus`, `getGlobalBus`, types `IEventBus`, `EventHandler`, `Unsubscribe`।
- `@tuvix.js/router` से: `createRouter`, `matchPath`, `interceptLinks`, types `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions`।
- `@tuvix.js/loader` से: `createLoader`, types `Entry`, `MicroAppModule`।

## Edge cases

- `start()` के बाद `register()` route से manage होने वाले ऐप को मौजूदा path के हिसाब से reconcile करता है, इसलिए active होने पर वह तुरंत mount होता है। `start()` के बाद register हुए `mountWhenVisible` ऐप को तुरंत observe किया जाता है। अगर उस समय container DOM में नहीं है, तो उसे कभी observe नहीं किया जाता।
- Reconcile की विफलताएं `start()` या `reconcile()` को reject नहीं करतीं, वे `onError` और console में जाती हैं। `mountApp` reject करता है।
- `error` में फंसा ऐप अगले उस reconcile पर फिर कोशिश करता है जो उसे active चाहता है। `fallback` सिर्फ़ load, bootstrap और mount की विफलताओं पर रेंडर होता है।
- Unmount, entry की stylesheets को `document.head` से हटाता है। अगला mount उन्हें फिर जोड़ता है।
- दो orchestrators `getGlobalBus()` साझा करते हैं। Private bus के लिए `eventBus: {}` दें।
- `destroy()` के बाद बदलाव करने वाले methods `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.` throw करते हैं।

## यह क्या नहीं करता

- JavaScript को sandbox करना।
- Link clicks को intercept करना (`interceptLinks` इस्तेमाल करें)।
- सर्वर पर रेंडर करना (`@tuvix.js/server` इस्तेमाल करें)।
- ऐप्स के बीच डिपेंडेंसी साझा करना (`@tuvix.js/module-federation` या import maps इस्तेमाल करें)।
- हाथ से लिखे modules के लिए `tuvix:mounted` DOM events emit करना। यह काम `defineMicroApp` और फ्रेमवर्क adapters करते हैं।

## 0.4 से माइग्रेशन

- जब तक आप `eventBus` नहीं देते, orchestrator `getGlobalBus()` इस्तेमाल करता है। `destroy()` global bus को चालू रहने देता है।
- Reconciles अब हाथ से mount किए गए या `mountWhenVisible` ऐप्स को unmount नहीं करते।
- `sandbox: true` shadow root के अंदर रेंडर करता है।
- `prefetch: 'hover'` सिर्फ़ उन ऐप्स को prefetch करता है जिन्हें hover या focus हुआ link active करता है।
- `activeWhen`, `matchPath` इस्तेमाल करता है: query और hash ignore होते हैं, `:param` काम करता है, `.` और `(` शब्दशः match होते हैं।
- `OrchestratorConfig.shared` हटा दिया गया है (इसे कभी पढ़ा ही नहीं जाता था)। `@tuvix.js/module-federation` या import maps इस्तेमाल करें।
- राउटर `routes` पूरे path से match होते हैं: `'/'` route सिर्फ़ home page है, हर path के लिए `'/*'` इस्तेमाल करें। `RouteConfig.exact` हटा दिया गया है।
- `APP_ERROR` में `phase` आता है, और यह update और unmount की विफलताओं पर भी fire होता है।
- बाहरी राउटर्स के लिए `connectRouter({ subscribe, getPath })`, `setTimeout` + `reconcile()` वाले bridge की जगह लेता है।

## लाइसेंस

MIT

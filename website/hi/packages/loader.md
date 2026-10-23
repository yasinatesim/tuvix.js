---
title: '@tuvix.js/loader'
---

<PackageHeader
  name="@tuvix.js/loader"
  title="Loader"
  description="माइक्रो ऐप bundles को नाम से script URLs या loader functions के ज़रिए लोड करता है। इसमें retries, timeouts, एक साझा module registry और lifecycle events शामिल हैं।"
  icon="📦"
  npm="true"
/>

## इंस्टॉलेशन {#installation}

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

## इसे कब इस्तेमाल करें {#when-to-use-it}

`@tuvix.js/loader` एक entry (एक script URL, scripts और styles की सूची, या `() => import('./app')`) को `mount` और `unmount` वाले माइक्रो ऐप module में बदलता है। यह `<script>` और `<link>` tags जोड़ता है, असफल प्रयासों को दोबारा चलाता है, timeout के बाद हार मान लेता है और नतीजे को ऐप के नाम से cache करता है।

`@tuvix.js/core` आपके लिए एक `ModuleLoader` बनाता है और `createOrchestrator` का `loader` विकल्प उसे देता है, इसलिए ज़्यादातर shells इस पैकेज को कभी import नहीं करते। इसे तब import करें जब आप:

- ऐसा माइक्रो ऐप या adapter लिखते हैं जो `registerModule` से खुद को publish करता है, या `emitLifecycle` से `tuvix:mounted` रिपोर्ट करता है
- यह जानना चाहते हैं कि कोई दूसरा ऐप कब mount हुआ (`whenMounted`, `onLifecycle`)
- orchestrator के बिना माइक्रो ऐप्स लोड करते हैं, उदाहरण के लिए अपने राउटर से
- deduplication के साथ एक अकेली script या stylesheet लोड करते हैं (`loadScript`, `loadStyle`)

अगर आपका bundler build के समय ऐप को import कर सकता है और आप कभी किसी दूसरे origin से कोड लोड नहीं करते, तो एक सामान्य `import()` काफ़ी है।

## क्विक स्टार्ट {#quick-start}

माइक्रो ऐप अपने module को एक नाम से publish करता है। यह फ़ाइल `https://cdn.example.com/dashboard/main.js` पर build होती है:

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

shell इसे नाम से लोड करता है और mount करता है:

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

`load()` कभी throw नहीं करता। असफल load `status: 'error'`, `module: null` और आख़िरी एरर के साथ लौटता है।

## Entry के रूप {#entry-forms}

एक `Entry` loader को बताती है कि ऐप का कोड कहाँ है। इसके तीन रूप होते हैं।

**एक URL string.** loader `'https://cdn.example.com/app.js'` को `{ scripts: ['https://cdn.example.com/app.js'] }` मानता है।

**एक `EntryConfig` object:**

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `scripts` | `string[]` | ज़रूरी | Script URLs। loader इन्हें इसी क्रम में एक के बाद एक चलाता है। खाली array कुछ लोड नहीं करता और module को registry से resolve करता है। |
| `styles` | `string[]` | `[]` | Stylesheet URLs, जो scripts के साथ समानांतर लोड होते हैं। load दोनों का इंतज़ार करता है। |
| `type` | `'module' \| 'classic'` | हर URL के लिए अनुमानित | `scripts` के हर URL का script type। इसके बिना `.mjs`, `.mts`, `.ts`, `.tsx` या `.jsx` पर ख़त्म होने वाले URLs `type="module"` के रूप में लोड होते हैं और बाकी हर URL classic script के रूप में। Vite या Rollup के ES output के लिए `'module'` सेट करें, क्योंकि वह `.js` पर ख़त्म होता है। |
| `integrity` | `Record<string, string>` | कोई नहीं | URL को key बनाकर रखे गए Subresource integrity hashes। loader इन्हें `<script>`, `<link>` और prefetch tags में लिखता है। |

**एक loader function (`EntryLoader`).** loader इसे `{ signal }` के साथ कॉल करता है और तीन तरह के नतीजे स्वीकार करता है, जिन्हें इसी क्रम में जाँचा जाता है:

1. `mount` function वाला एक module
2. एक object जिसका `default` export ऐसा module हो (एक ES module namespace)
3. कुछ भी उपयोगी नहीं, इस स्थिति में loader वह module खोजता है जिसे import ने `registerModule(name, ...)` से register किया

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

आपका bundler `./dashboard` को उसके अपने chunk में code-split करता है और पहले mount पर उसे fetch करता है। [`@tuvix.js/module-federation`](/hi/packages/module-federation) भी loader functions के ज़रिए ही किसी federated remote को orchestrator से जोड़ता है।

प्रयास का timeout होने पर `signal` abort होता है। रास्ते में आप जो भी `fetch` करें, उसे यह signal दें:

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

हर `ModuleLoader` ऐप के नाम से resolve हुए modules का अपना cache रखता है। `<script>` और `<link>` tags पूरे पेज के लिए होते हैं: एक ही URL लोड करने वाले दो loaders एक ही tag साझा करते हैं।

`LoaderOptions`:

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | एक प्रयास की समय सीमा ms में, जिसमें entry की हर script और stylesheet शामिल है। `0` इसे बंद करता है। |
| `retries` | `number` | `2` | पहला प्रयास असफल होने के बाद अतिरिक्त प्रयास। `2` का मतलब है अधिकतम 3 प्रयास। |
| `retryDelay` | `number` | `1000` | प्रयासों के बीच ms में इंतज़ार। |
| `globals` | `Record<string, unknown>` | `{}` | वे properties जिन्हें loader किसी URL entry के हर प्रयास से पहले `window` पर सेट करता है, उन UMD bundles के लिए जो `window.React` या कोई config object अपेक्षित रखते हैं। loader-function entries इसे अनदेखा करती हैं। |

#### `load(name, entry)`

एक `LoadResult` पर resolve होता है:

| Field | Type | अर्थ |
| --- | --- | --- |
| `status` | `'loaded' \| 'error'` | load का नतीजा। |
| `module` | `MicroAppModule \| null` | resolve हुआ module, एरर होने पर `null`। |
| `error` | `Error \| null` | आख़िरी प्रयास का एरर। |
| `duration` | `number` | कॉल से नतीजे तक के milliseconds, `performance.now()` से मापे गए। |

किसी URL entry के लिए एक प्रयास:

1. `options.globals` को `window` पर सेट करता है
2. scripts को क्रम से जोड़ता है, हर script पिछली का इंतज़ार करती है, और stylesheets को समानांतर जोड़ता है
3. registry से module पढ़ता है (`getRegisteredModule(name)`)
4. fallback के रूप में UMD global लेता है: `mount` function वाली एक `window` property जो इसी load के दौरान सामने आई

इसके बाद loader जाँचता है कि module में `mount` और `unmount` functions हैं और उसे `name` के तहत cache करता है। उसी नाम से बाद की कॉल्स cached module लौटाती हैं और `entry` को अनदेखा करती हैं। पहली कॉल के लोड होते समय दूसरी कॉल वही promise लौटाती है। अलग-अलग नामों के loads समानांतर चलते हैं।

#### `prefetch(entry)`

ब्राउज़र से entry की फ़ाइलें बिना चलाए डाउनलोड करने को कहता है। Module scripts को `<link rel="modulepreload">` मिलता है; classic scripts और stylesheets को `<link rel="prefetch">` मिलता है। loader-function entries छोड़ दी जाती हैं, क्योंकि function कॉल करने से module चल जाएगा। orchestrator अपनी `prefetch` setting के लिए इसे कॉल करता है।

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
loader.prefetch({ scripts: ['/apps/settings/main.js'], type: 'module' });
```

#### `removeStyles(name)`

लोड हुए ऐप की stylesheets हटाता है, ताकि unmount रहने के दौरान उसकी CSS लागू न हो। अगर कोई दूसरा cached ऐप, जिसकी styles आपने नहीं हटाईं, वही URL सूची में रखता है, तो stylesheet बनी रहती है। अगला `load(name)` stylesheets को वापस जोड़ता है और resolve होने से पहले उनका इंतज़ार करता है। orchestrator हर unmount के बाद `removeStyles` कॉल करता है।

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

किसी ऐप को भूल जाता है: उसकी stylesheets और script tags हटाता है, उसे cache से निकालता है, और साझा registry से उसे unregister करता है अगर register हुआ module वही है जिसे इस loader ने resolve किया था। अगला `load(name)` entry को फिर से fetch करके चलाता है। orchestrator इसे `unregister(name)` से कॉल करता है।

#### `clearCache()`

हर cached ऐप के लिए `unload` कॉल करता है। orchestrator इसे `destroy()` से कॉल करता है।

#### `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()`

ये cache पढ़ते हैं। `getStatus` load चलते समय `'loading'`, module cache होने के बाद `'loaded'`, और बाकी स्थितियों में `'idle'` लौटाता है। असफल load के बाद status `'idle'` रहता है।

### `createLoader`

```ts no-check
function createLoader(options?: LoaderOptions): ModuleLoader;
```

`new ModuleLoader(options)` जैसा ही। ऊपर की तालिका वाले `LoaderOptions` लेता है।

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 8000, retries: 0, globals: { APP_ENV: 'production' } });
```

orchestrator के लिए ये विकल्प सेट करने हों तो इन्हें `loader` के रूप में दें:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({ loader: { timeout: 15000, retries: 1, retryDelay: 500 } });
```

### `normalizeEntry`

```ts no-check
function normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

URL को `{ scripts: [url] }` में बदलता है और `EntryConfig` को बिना बदलाव लौटाता है। यह loader functions स्वीकार नहीं करता; पहले `typeof entry === 'function'` जाँचें।

```ts
import { normalizeEntry } from '@tuvix.js/loader';

normalizeEntry('https://cdn.example.com/app.js'); // { scripts: ['https://cdn.example.com/app.js'] }
```

### `loadScript`

```ts no-check
function loadScript(url: string, options?: LoadScriptOptions | string): Promise<void>;
```

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `type` | `'module' \| 'classic'` | extension से अनुमानित | Script type, `EntryConfig.type` वाले नियमों के साथ। |
| `integrity` | `string` | कोई नहीं | `integrity` attribute के लिए SRI hash। |
| `signal` | `AbortSignal` | कोई नहीं | abort होने पर इंतज़ार बंद करता है। promise signal के reason के साथ reject होता है। |

`document.head` में `<script crossorigin="anonymous">` जोड़ता है और उसके `load` event पर resolve होता है। एक URL के लिए एक साथ चलने वाली कॉल्स एक ही tag साझा करती हैं, और पहले से लोड हो चुके URL की कॉल तुरंत resolve होती है। असफल load अपना tag हटाता है और `[Tuvix Loader] Failed to load script: <url>` के साथ reject होता है, ताकि अगली कॉल नए tag से शुरू हो। abort हुई कॉल tag तभी हटाती है जब कोई दूसरा caller उसका इंतज़ार न कर रहा हो। `loadScript` का अपना कोई timeout नहीं है; `signal` दें।

दूसरे argument के रूप में दी गई string को integrity hash माना जाता है, जैसा 0.4 में था।

```ts
import { loadScript } from '@tuvix.js/loader';

await loadScript('https://cdn.example.com/charts.js', { type: 'classic', signal: AbortSignal.timeout(5000) });
```

### `loadStyle`

```ts no-check
function loadStyle(url: string, options?: LoadStyleOptions | number): Promise<void>;
```

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | इतने ms के बाद load को `[Tuvix Loader] Style load timed out: <url>` के साथ असफल करता है। `0` इसे बंद करता है। |
| `integrity` | `string` | कोई नहीं | `integrity` attribute के लिए SRI hash। |
| `signal` | `AbortSignal` | कोई नहीं | abort होने पर इंतज़ार बंद करता है। |

`document.head` में `<link rel="stylesheet" crossorigin="anonymous">` जोड़ता है, जिस पर `loadScript` वाले ही sharing, failure और abort नियम लागू होते हैं। दूसरे argument के रूप में दी गई संख्या को timeout माना जाता है, जैसा 0.4 में था।

```ts
import { loadStyle } from '@tuvix.js/loader';

await loadStyle('https://cdn.example.com/app.css', { timeout: 5000 });
```

### `removeScript`

```ts no-check
function removeScript(url: string): void;
```

`url` के लिए `loadScript` का जोड़ा हुआ tag हटाता है, साथ ही हर वह `<script>` भी जिसका `src` attribute `url` के बराबर है। उस URL का जो load अभी चल रहा हो, वह `[Tuvix Loader] Removed before load: <url>` के साथ reject होता है। अगला `loadScript(url)` नया tag जोड़ता है। script जो कोड पहले चला चुकी है, वह memory में बना रहता है।

### `removeStyle`

```ts no-check
function removeStyle(url: string): void;
```

`<link rel="stylesheet">` tags के लिए `removeScript` जैसा ही।

### `prefetchResource`

```ts no-check
function prefetchResource(url: string, options?: PrefetchOptions): void;
```

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `as` | `'script' \| 'style'` | `.css` URLs के लिए `'style'`, बाकी के लिए `'script'` | Resource का प्रकार। |
| `type` | `'module' \| 'classic'` | extension से अनुमानित | Module scripts को `rel="modulepreload"` मिलता है। |
| `integrity` | `string` | कोई नहीं | link के लिए SRI hash। |

हर URL और पेज के लिए एक `<link>` जोड़ता है। जिस URL को `loadScript` या `loadStyle` पहले से संभाल रहे हैं, या जो पहले prefetch हो चुका है, उसे छोड़ दिया जाता है।

```ts
import { prefetchResource } from '@tuvix.js/loader';

prefetchResource('https://cdn.example.com/app.js', { type: 'module' });
```

### `registerModule`

```ts no-check
function registerModule(name: string, module: MicroAppModule): void;
```

किसी module को एक नाम से publish करता है, ताकि ऐप की script चलने के बाद loader उसे ढूँढ सके। उसी नाम से दूसरी कॉल पहले module को बदल देती है। React, Vue, Svelte और Angular adapters और core का `defineMicroApp` इसे आपके लिए कॉल करते हैं; जब आप module हाथ से लिखते हैं, तब इसे खुद कॉल करें।

registry और mounted ऐप्स की state `window.__TUVIX_RUNTIME__` पर रहती है, और module map `window.__TUVIX_MODULES__` के रूप में भी उपलब्ध है। जो माइक्रो ऐप्स `@tuvix.js/loader` की अपनी अलग कॉपी bundle करते हैं, वे भी एक ही registry पढ़ते और लिखते हैं। सर्वर पर, `window` के बिना, state module में रहती है।

adapter contract का पालन करने वाला हाथ से लिखा माइक्रो ऐप:

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

registry से एक module हटाता है। `ModuleLoader.unload` अपने resolve किए modules के लिए इसे कॉल करता है।

### `getRegisteredModule`

```ts no-check
function getRegisteredModule(name: string): MicroAppModule | undefined;
```

register हुआ module लौटाता है, या `undefined`।

### `emitLifecycle`

```ts no-check
function emitLifecycle(type: 'mounted' | 'unmounted' | 'error', detail: LifecycleDetail): void;
```

lifecycle में हुए बदलाव को दर्ज करता है और `tuvix:mounted`, `tuvix:unmounted` या `tuvix:error` नाम का `CustomEvent` dispatch करता है। event bubble होता है और `composed` है, इसलिए `document` पर लगा listener shadow roots के अंदर के containers से आए events भी सुनता है। जब `detail.container` DOM में होता है, तो event container पर fire होता है और एक बार `document` तक bubble होता है। जब container detached होता है (`isConnected` का मान `false` है), उदाहरण के लिए क्योंकि adapter के `unmounted` रिपोर्ट करने से पहले React ने island हटा दिया, तो event सीधे `document` पर fire होता है, क्योंकि detached element पर भेजा गया event `document` तक कभी नहीं पहुँचता। दोनों स्थितियों में `detail.container` उसी element की ओर इशारा करता है। `event.detail` एक `LifecycleDetail` है:

| Field | Type | अर्थ |
| --- | --- | --- |
| `name` | `string` | माइक्रो ऐप का नाम। |
| `container` | `HTMLElement` | वह element जिसमें ऐप रेंडर हुआ। |
| `hydrated` | `boolean` | `true` जब adapter ने नए सिरे से रेंडर करने के बजाय सर्वर पर रेंडर हुआ markup अपनाया। |
| `error` | `unknown` | throw हुई value, `error` events पर सेट होती है। |

`mounted` container को `detail.name` के लिए mounted के रूप में दर्ज करता है और लंबित `whenMounted(name)` promises को resolve करता है। `unmounted` उस container को रिकॉर्ड से हटाता है। `error` सिर्फ़ event dispatch करता है। React, Vue, Svelte और Angular adapters और core का `defineMicroApp` mount और unmount पूरा होने के बाद, और इनमें से कोई throw करे तब, इसे कॉल करते हैं।

### `isMounted`

```ts no-check
function isMounted(name: string): boolean;
```

जब तक `name` का कम से कम एक container mounted है, तब तक `true`। runtime हर ऐप के mounted containers का हिसाब रखता है, इसलिए अगर एक module दो containers में mount होता है और आप एक को unmount करते हैं, तो दूसरा unmount होने तक `isMounted(name)` `true` रहता है।

### `whenMounted`

```ts no-check
function whenMounted(name: string, options?: { signal?: AbortSignal }): Promise<LifecycleDetail>;
```

पहले mount के `LifecycleDetail` के साथ resolve होता है। अगर ऐप पहले से mounted है, तो यह उसके सबसे पुराने अभी भी mounted container के detail के साथ तुरंत resolve होता है। इंतज़ार बंद करने के लिए `signal` को abort करें; तब promise signal के reason के साथ reject होता है।

```ts
import { whenMounted } from '@tuvix.js/loader';

const { container, hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log(`header mounted into #${container.id}, hydrated: ${hydrated}`);
```

### `onLifecycle`

```ts no-check
function onLifecycle(type: LifecycleType, handler: (detail: LifecycleDetail) => void, target?: EventTarget): () => void;
```

`target` (default `document`) पर `tuvix:<type>` को सुनता है और एक function लौटाता है जो listener हटाता है। default target के साथ handler हर event पर एक बार चलता है, चाहे container attached हो या detached। container element पर लगा listener वे events नहीं सुनता जो उस container के detached रहने के दौरान dispatch हुए।

```ts
import { onLifecycle } from '@tuvix.js/loader';

const stop = onLifecycle('error', ({ name, error }) => {
  console.error(`Micro app "${name}" failed`, error);
});

// later
stop();
```

इस पैकेज के बिना DOM event को सुनें:

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

`true` जब element में कोई child element हो या ऐसा text node हो जिसमें whitespace के अलावा text हो। Comments और whitespace गिने नहीं जाते। Adapters इसका उपयोग hydrate करने और नए सिरे से रेंडर करने के बीच चुनाव के लिए करते हैं।

### Types {#types}

वे interfaces जिन्हें एक माइक्रो ऐप module implement करता है:

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

orchestrator हर mount पर `name` और `bus` देता है। `bus` orchestrator का [`@tuvix.js/event-bus`](/hi/packages/event-bus) instance है; `MicroAppBus` इसे structurally बताता है, इसलिए loader की event bus पैकेज पर कोई डिपेंडेंसी नहीं है।

| Type | अर्थ |
| --- | --- |
| `Entry` | `string \| EntryConfig \| EntryLoader`। |
| `EntryConfig` | `{ scripts, styles?, type?, integrity? }`, देखें [Entry के रूप](#entry-forms)। |
| `EntryLoader` | `(context: EntryLoaderContext) => Promise<MicroAppModule \| { default: MicroAppModule }>`। |
| `EntryLoaderContext` | `{ signal: AbortSignal }`। |
| `ScriptType` | `'module' \| 'classic'`। |
| `MicroAppModule` | वह lifecycle object जिसे माइक्रो ऐप export करता है। |
| `MountContext`, `UnmountContext`, `UpdateContext` | `mount`, `unmount` और `update` के arguments। |
| `MicroAppBus` | `{ on, once, emit, off }`; `IEventBus` इसे पूरा करता है। |
| `LoaderOptions` | `{ timeout?, retries?, retryDelay?, globals? }`। |
| `LoadResult` | `{ status, module, error, duration }`। |
| `LoadStatus` | `'idle' \| 'loading' \| 'loaded' \| 'error'`। |
| `CacheEntry` | `{ module, loadedAt, entry }`, एक cached module। |
| `PrefetchStrategy` | `'immediate' \| 'idle' \| 'hover' \| 'none'`। loader इसे नहीं पढ़ता। |
| `ResourceOptions` | `{ integrity?, signal? }`, `loadScript` और `loadStyle` में साझा। |
| `LoadScriptOptions` | `ResourceOptions` और साथ में `type?`। |
| `LoadStyleOptions` | `ResourceOptions` और साथ में `timeout?`। |
| `PrefetchOptions` | `{ as?, type?, integrity? }`। |
| `LifecycleType` | `'mounted' \| 'unmounted' \| 'error'`। |
| `LifecycleDetail` | `{ name, container, hydrated, error? }`। |
| `LifecycleEvent` | `CustomEvent<LifecycleDetail>`। |

## Edge cases {#edge-cases}

- **Timeouts.** `timeout` एक पूरे प्रयास को कवर करता है। इसके fire होने पर loader प्रयास का `signal` abort करता है, प्रयास के वे tags हटाता है जिनका कोई दूसरा load इंतज़ार नहीं कर रहा, `retryDelay` तक रुकता है और फिर कोशिश करता है। एरर का संदेश `[Tuvix Loader] Loading "<name>" timed out after <timeout>ms` होता है। जो loader function `signal` को अनदेखा करता है, वह background में चलता रहता है; loader उसका इंतज़ार करना बंद कर देता है।
- **Retries.** असफल `<script>` अगले प्रयास से पहले हटा दी जाती है, इसलिए retry एक नया tag जोड़ता है। आख़िरी प्रयास के बाद `load()` आख़िरी एरर के साथ resolve होता है।
- **एक ही URL, कई ऐप्स.** एक ही vendor script सूची में रखने वाली दो entries एक tag और एक download साझा करती हैं।
- **Cached entries.** `load(name, otherEntry)` `name` के तहत cached module लौटाता है और `otherEntry` को अनदेखा करता है। entry बदलनी हो तो पहले `unload(name)` कॉल करें।
- **Module scripts हर URL पर एक बार चलती हैं.** `unload(name)` के बाद, जिस ऐप की `type: 'module'` script ने `registerModule` कॉल किया था, वह उसी URL से दोबारा लोड नहीं होता, क्योंकि ब्राउज़र एक module script को दो बार नहीं चलाता। load `no exports found` के साथ असफल होता है। loader-function entry या नया URL (content hash या `?v=2`) इस्तेमाल करें।
- **`unload` साझा script tags हटाता है.** यह entry का हर script URL हटाता है, उस vendor script सहित जिसे कोई दूसरा ऐप भी सूची में रखता है। जो कोड चल चुका है वह बना रहता है; बाद का कोई load जो वह URL सूची में रखता है, tag फिर से जोड़ता है और classic script दोबारा चलती है।
- **CORS.** loader हर tag पर `crossorigin="anonymous"` सेट करता है। किसी दूसरे origin से आई script या stylesheet को `Access-Control-Allow-Origin` header चाहिए, नहीं तो ब्राउज़र उसे block करता है और load असफल होता है।
- **UMD globals.** जब दो UMD bundles एक साथ लोड होते हैं, तो loader उन globals को छोड़ देता है जिन पर कोई दूसरा load पहले दावा कर चुका है और बाकी को ऐप के नाम से मिलाता है, case और punctuation को अनदेखा करते हुए (`my-app` का मेल `MyApp` से होता है)। अगर कई उम्मीदवार बचते हैं, तो load `several globals with mount() appeared while it loaded (<names>)` के साथ असफल होता है। `registerModule` इस अनुमान की ज़रूरत ख़त्म करता है।
- **Lifecycle का न होना.** `mount` या `unmount` के बिना module `[Tuvix Loader] Module "<name>" is missing required "unmount" function.` के साथ असफल होता है।
- **कुछ नहीं मिला.** जिस URL entry की scripts न तो module register करती हैं और न UMD global परिभाषित करती हैं, वह `Module "<name>" loaded but no exports found` के साथ असफल होती है।
- **कई containers.** runtime हर container के लिए mounted state रखता है। दो में से एक container को unmount करने पर `isMounted(name)` `true` रहता है; `whenMounted(name)` सबसे पुराना अभी भी mounted container लौटाता है।
- **Detached containers.** जब कोई host फ्रेमवर्क adapter के `unmounted` या `error` रिपोर्ट करने से पहले container हटा देता है, तो `emitLifecycle` event को `document` पर dispatch करता है। हर event पाने के लिए `document` पर सुनें (`onLifecycle` का default)।
- **`whenMounted` एरर्स को अनदेखा करता है.** `tuvix:error` event इसे reject नहीं करता। `signal` दें या `onLifecycle('error', ...)` से सुनें।
- **सर्वर.** runtime functions `window` के बिना काम करते हैं; `CustomEvent` undefined होने पर `emitLifecycle` DOM event छोड़ देता है। `ModuleLoader`, `loadScript`, `loadStyle` और `prefetchResource` को `document` चाहिए।

## यह क्या नहीं करता {#what-it-does-not-do}

- यह HTML पेज fetch करके उसमें से scripts नहीं निकालता। script और style URLs की सूची दें, या loader function इस्तेमाल करें।
- यह JavaScript को अलग नहीं करता। Scripts पेज के global scope में चलती हैं। CSS isolation के लिए orchestrator का `sandbox` विकल्प या [`@tuvix.js/sandbox`](/hi/packages/sandbox) इस्तेमाल करें।
- यह ऐप्स mount नहीं करता। `module.mount` आप या orchestrator कॉल करते हैं।
- यह पेज loads के बीच cache नहीं रखता। यह काम ब्राउज़र का HTTP cache करता है।
- यह `PrefetchStrategy` नहीं पढ़ता; `prefetch` कब कॉल करना है, यह orchestrator की `prefetch` setting तय करती है।

## 0.4 से माइग्रेशन {#migrating-from-0-4}

- `LoaderOptions.fetch` और `EntryConfig.html` हटा दिए गए हैं। loader ने इन्हें कभी नहीं पढ़ा। इन्हें अपने config से हटाएँ।
- `loadScript(url, integrity)` और `loadStyle(url, timeoutMs)` अब भी काम करते हैं। options वाला रूप `type` और `signal` जोड़ता है:

  ```ts
  import { loadScript } from '@tuvix.js/loader';

  // 0.4
  await loadScript('/vendor.js', 'sha384-abc');
  // 0.5
  await loadScript('/vendor.js', { integrity: 'sha384-abc', type: 'classic' });
  ```

- `.js` पर ख़त्म होने वाला Vite ES output 0.4 में classic script के रूप में लोड होता था और अपने पहले `import` statement पर असफल होता था। entry पर `type: 'module'` सेट करें।
- `type: 'module'` entry अब `unload` के बाद उसी URL से दोबारा लोड नहीं होती। loader function या नया URL इस्तेमाल करें।
- cached module के लिए `load()` अब `0` के बजाय असली `duration` बताता है।
- इस पेज के 0.4 संस्करण में `loader.load(url)`, `result.app`, `onLoadStart`, `cache` और `loader.clear()` दिखाए गए थे। इनमें से कोई भी मौजूद नहीं था। `load(name, entry)`, `result.module`, `unload(name)` और `clearCache()` इस्तेमाल करें।

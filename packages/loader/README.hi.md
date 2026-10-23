# @tuvix.js/loader

> Script URLs या loader functions से माइक्रो ऐप bundles को नाम के आधार पर load करता है, retries, timeouts, साझा module registry और lifecycle events के साथ।

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा। पूरा डॉक्यूमेंटेशन: [tuvix.js.org/hi/packages/loader](https://tuvix.js.org/hi/packages/loader)।

## इंस्टॉलेशन

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

`@tuvix.js/core` आपके लिए एक `ModuleLoader` बनाता है और उसे `createOrchestrator({ loader })` देता है। यह पैकेज तब import करें जब आप माइक्रो ऐप या adapter लिखते हैं, किसी दूसरे ऐप के mount होने का इंतज़ार करते हैं, या orchestrator के बिना ऐप्स load करते हैं।

## क्विक स्टार्ट

माइक्रो ऐप, जो `https://cdn.example.com/dashboard/main.js` पर build होता है:

```ts
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

Shell:

```ts
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
  console.error(result.error);
}
```

`load()` कभी throw नहीं करता। विफलता `status: 'error'`, `module: null` और आख़िरी एरर के साथ resolve होती है।

## Entries

`Entry` इनमें से एक है:

- एक URL string, जिसे `{ scripts: [url] }` माना जाता है
- एक `EntryConfig`
- `() => import('./dashboard')` जैसा loader function। यह `{ signal }` पाता है, जो timeout पर abort होता है, और module, `{ default: module }`, या `registerModule(name, module)` कॉल करने के बाद कुछ भी resolve कर सकता है।

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `scripts` | `string[]` | required | Script URLs, एक के बाद एक चलते हैं। |
| `styles` | `string[]` | `[]` | Stylesheet URLs, scripts के साथ parallel में load होते हैं। |
| `type` | `'module' \| 'classic'` | हर URL से अनुमानित | `.mjs`, `.mts`, `.ts`, `.tsx`, `.jsx` modules के रूप में load होते हैं, बाकी classic के रूप में। Vite के `.js` output के लिए `'module'` सेट करें। |
| `integrity` | `Record<string, string>` | none | URL के हिसाब से SRI hashes। |

## API

### `ModuleLoader` और `createLoader`

```ts no-check
new ModuleLoader(options?: LoaderOptions);
createLoader(options?: LoaderOptions): ModuleLoader;
```

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | हर कोशिश के लिए ms, जिसमें हर script और stylesheet शामिल है। `0` इसे बंद करता है। |
| `retries` | `number` | `2` | पहली विफलता के बाद अतिरिक्त कोशिशें। |
| `retryDelay` | `number` | `1000` | कोशिशों के बीच ms। |
| `globals` | `Record<string, unknown>` | `{}` | URL entry की हर कोशिश से पहले `window` पर assign होते हैं। |

| Method | व्यवहार |
| --- | --- |
| `load(name, entry): Promise<LoadResult>` | Load करता है, `mount`/`unmount` की जांच करता है और नाम के हिसाब से cache करता है। Module को पहले `registerModule(name)` से resolve करता है, फिर `mount` वाले किसी नए UMD global से। Cached नाम `entry` को ignore करता है। जो नाम पहले से load हो रहा है, उसके लिए वही promise लौटता है। |
| `prefetch(entry)` | Module scripts के लिए `<link rel="modulepreload">`, बाकी के लिए `<link rel="prefetch">`। Loader functions को छोड़ देता है। |
| `removeStyles(name)` | ऐप की stylesheets हटाता है, जब तक कोई दूसरा cached ऐप उन्हें इस्तेमाल न कर रहा हो। अगला `load(name)` उन्हें फिर जोड़ता है। |
| `unload(name)` | Styles और script tags हटाता है, cache entry छोड़ता है और इस loader के resolve किए module को unregister करता है। |
| `clearCache()` | हर cached ऐप के लिए `unload`। |
| `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()` | Cache पढ़ते हैं। `getStatus` `'idle'`, `'loading'` या `'loaded'` लौटाता है। |

### `normalizeEntry`

```ts no-check
normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

### `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource`

```ts no-check
loadScript(url: string, options?: { type?, integrity?, signal? } | string): Promise<void>;
loadStyle(url: string, options?: { timeout?, integrity?, signal? } | number): Promise<void>;
removeScript(url: string): void;
removeStyle(url: string): void;
prefetchResource(url: string, options?: { as?, type?, integrity? }): void;
```

हर URL के लिए एक tag, जिसे एक साथ आए callers साझा करते हैं। विफल load अपना tag हटाता है और `[Tuvix Loader] Failed to load script: <url>` के साथ reject होता है। Abort हुआ call tag तब हटाता है जब कोई दूसरा caller उसका इंतज़ार न कर रहा हो। `loadStyle` default रूप से `10000` ms के बाद time out होता है। हर tag को `crossorigin="anonymous"` मिलता है। `loadScript` का string दूसरा argument integrity hash है, `loadStyle` का number दूसरा argument timeout है (0.4 वाले रूप)।

### Runtime registry और lifecycle

State `window.__TUVIX_RUNTIME__` पर रहती है, इसलिए अपनी अलग copy bundle करने वाले माइक्रो ऐप्स भी इसे साझा करते हैं। `window` न हो तो यह module में रहती है।

| Export | व्यवहार |
| --- | --- |
| `registerModule(name, module)` | Loader के लिए module publish करता है। Adapters और `defineMicroApp` इसे कॉल करते हैं। |
| `unregisterModule(name)` | इसे हटाता है। |
| `getRegisteredModule(name)` | इसे लौटाता है, या `undefined`। |
| `emitLifecycle(type, { name, container, hydrated, error? })` | `container` पर, या container detach हो तो `document` पर, bubbling और composed `tuvix:mounted`, `tuvix:unmounted` या `tuvix:error` `CustomEvent` dispatch करता है, और mounted containers को track करता है। Adapters और `defineMicroApp` इसे कॉल करते हैं। |
| `isMounted(name)` | जब तक ऐप का कोई भी container mounted है, `true`। |
| `whenMounted(name, { signal? })` | पहले mount के `LifecycleDetail` के साथ resolve होता है, या अब भी mounted सबसे पुराने container के साथ तुरंत। Abort पर `signal.reason` के साथ reject होता है। |
| `onLifecycle(type, handler, target = document)` | `tuvix:<type>` सुनता है। हटाने वाला function लौटाता है। |
| `hasServerMarkup(el)` | Child element या non-whitespace text के लिए `true`। |

```ts
import { onLifecycle, whenMounted } from '@tuvix.js/loader';

onLifecycle('error', ({ name, error }) => console.error(name, error));
const { hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log('header hydrated:', hydrated);
```

### Types

`Entry`, `EntryConfig`, `EntryLoader`, `EntryLoaderContext`, `ScriptType`, `MicroAppModule`, `MountContext` (`container`, `props?`, `name?`, `bus?`), `UnmountContext`, `UpdateContext` (`props`, `container?`), `MicroAppBus` (`on`, `once`, `emit`, `off`; `IEventBus` इसे पूरा करता है), `LoaderOptions`, `LoadResult`, `LoadStatus`, `CacheEntry`, `PrefetchStrategy` (loader इसे नहीं पढ़ता), `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent`।

## Edge cases

- Timeout उस कोशिश के `signal` को abort करता है, उसके tags हटाता है और `retryDelay` के बाद फिर कोशिश करता है। `signal` को ignore करने वाला loader function चलता रहता है, loader बस इंतज़ार करना बंद कर देता है।
- `unload(name)` के बाद, खुद को register करने वाली `type: 'module'` script उसी URL से दोबारा नहीं चलती। Loader function या नया URL इस्तेमाल करें।
- `unload` entry के हर script URL को हटाता है, उन vendor scripts को भी जिन्हें दूसरे ऐप्स list करते हैं।
- दो UMD bundles एक साथ load हों तो loader नए globals को ऐप के नाम से मिलाता है, और जब उन्हें अलग नहीं कर पाता तो संभावित नामों के साथ विफल होता है।
- Cross-origin scripts और styles को `Access-Control-Allow-Origin` चाहिए।
- Mounted state हर container के लिए अलग है: दो में से एक container unmount करने पर `isMounted(name)` `true` रहता है। `whenMounted` `tuvix:error` पर reject नहीं होता।
- Detach हुए container का lifecycle event `document` पर fire होता है, `detail.container` फिर भी सेट रहता है। `document` पर `onLifecycle` (default) हर event एक बार पाता है।

## यह क्या नहीं करता

- यह HTML पेज fetch करके उनसे scripts नहीं निकालता।
- यह JavaScript को isolate नहीं करता। Scripts पेज के global scope में चलती हैं।
- यह ऐप्स mount नहीं करता और रूटिंग नहीं करता।

## लाइसेंस

MIT

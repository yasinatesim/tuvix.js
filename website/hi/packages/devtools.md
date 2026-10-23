---
title: '@tuvix.js/devtools'
---

<PackageHeader
  name="@tuvix.js/devtools"
  title="DevTools"
  description="orchestrator के लिए पेज के अंदर debug overlay। यह registered और mounted माइक्रो ऐप्स, मौजूदा route और event bus का हाल का traffic दिखाता है।"
  icon="🛠️"
  npm="true"
/>

## इंस्टॉलेशन

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## इसे कब इस्तेमाल करें

Development में इसे तब इंस्टॉल करें जब आपको देखना हो कि orchestrator किन माइक्रो ऐप्स को जानता है, उनमें से कौन-से अभी mounted हैं, और bus पर कौन-से events चल रहे हैं। Overlay पेज के नीचे दाएँ कोने में रहता है और हर सेकंड एक बार refresh होता है।

जब आपको UI में कंपोनेंट trees, network timings या event payloads चाहिए, तो ब्राउज़र के DevTools या किसी फ्रेमवर्क devtools extension का इस्तेमाल करें। यह पैकेज ऐप names, एक route string और timestamp के साथ event names दिखाता है। Payloads logger में रहते हैं, जिन्हें आप console से पढ़ सकते हैं।

## क्विक स्टार्ट

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
orchestrator.register({ name: 'settings', entry: '/apps/settings.js', container: '#main' });

await orchestrator.start();
```

`/dashboard` खोलें, overlay `dashboard` को हरे dot के साथ और `settings` को सफ़ेद dot के साथ दिखाता है। Route row में `/dashboard` लिखा होता है, और Events list dashboard mount के `tuvix:app:status-change` और `tuvix:app:mount` events दिखाती है।

## पैनल क्या दिखाता है

`installDevTools` `document.body` में एक `<div id="tuvix-devtools">` जोड़ता है। इसमें एक गोल toggle button होता है (नीचे दाएँ कोने से 12px पर fixed, `z-index: 99999`) और उसके ऊपर 280px चौड़ा पैनल, जिसमें तीन sections हैं:

| Section | स्रोत | सामग्री |
| --- | --- | --- |
| Apps | `orchestrator.getRegisteredApps()` और `getMountedApps()` | हर registered ऐप के लिए एक row। हरे dot का मतलब है कि उसका status `mounted` है। सफ़ेद dot बाकी सभी status दिखाता है, `loading` और `error` भी। |
| Route | `orchestrator.getRouter()?.currentPath` | राउटर का मौजूदा path: `base` prefix के बिना, query string के साथ। orchestrator के पास राउटर न हो तो `/` दिखाता है। |
| Events | `orchestrator.getEventBus()` से जुड़ा `EventLogger` | 10 सबसे नए events, सबसे नया पहले। हर row में local time, एक dash और event name होता है। |

डिफ़ॉल्ट रूप से orchestrator `getGlobalBus()` इस्तेमाल करता है, इसलिए Events list orchestrator के अपने events के साथ वे events भी दिखाती है जो आपके माइक्रो ऐप्स shared bus पर emit करते हैं:

| Event | कब emit होता है |
| --- | --- |
| `tuvix:app:registered` | `register()` कोई ऐप जोड़ता है |
| `tuvix:app:bootstrap`, `tuvix:app:mount`, `tuvix:app:unmount` | कोई ऐप उस lifecycle step से गुज़रता है |
| `tuvix:app:error` | किसी ऐप को load, bootstrap या mount करना fail होता है |
| `tuvix:app:status-change` | किसी ऐप का status बदलता है। हर mount पर कई events की उम्मीद रखें। |
| `tuvix:route:change` | राउटर navigate करता है |
| `tuvix:started`, `tuvix:destroyed` | `start()` और `destroy()` पूरे होते हैं |

पैनल `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }` भी expose करता है। जो payloads पैनल print नहीं करता, उन्हें पढ़ने के लिए ब्राउज़र console में `__TUVIX_DEVTOOLS__.logger.getEntries()` चलाएँ।

## API

### `installDevTools`

```ts
import type { DevToolsOptions } from '@tuvix.js/devtools';
import type { IEventBus } from '@tuvix.js/core';

declare function installDevTools(
  orchestrator: {
    getRegisteredApps(): string[];
    getMountedApps(): string[];
    getEventBus(): IEventBus;
    getRouter(): { currentPath: string } | null;
  },
  options?: DevToolsOptions
): () => void;
```

पहला argument इन चार methods वाला कोई भी object स्वीकार करता है। `@tuvix.js/core` या `tuvix.js` का `Orchestrator` इसमें फ़िट होता है।

| विकल्प | टाइप | डिफ़ॉल्ट | अर्थ |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | logger ज़्यादा से ज़्यादा कितने events रखता है। पैनल इनमें से 10 print करता है। बाकी `__TUVIX_DEVTOOLS__.logger` से पढ़े जा सकते हैं। |
| `autoOpen` | `boolean` | `true` | `false` पैनल को छिपा हुआ mount करता है। Toggle button दिखता रहता है और पैनल खोलता है। |
| `updateInterval` | `number` | `1000` | पैनल refresh के बीच milliseconds। |

हर call पर यह:

1. एक `DevToolsPanel` और एक `EventLogger(maxLogEntries)` बनाता है,
2. logger को `onAny` के साथ `orchestrator.getEventBus()` से जोड़ता है,
3. पैनल mount करता है और `autoOpen` `false` होने पर उसे छिपा देता है,
4. एक `setInterval` शुरू करता है जो orchestrator को पढ़ता है और `panel.update()` call करता है,
5. `window.__TUVIX_DEVTOOLS__` set करता है।

यह एक cleanup फ़ंक्शन लौटाता है जो interval साफ़ करता है, logger को अलग करता है, पैनल हटाता है और `window.__TUVIX_DEVTOOLS__` delete करता है।

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { installDevTools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator();
const removeDevTools = installDevTools(orchestrator, {
  autoOpen: false,
  updateInterval: 250,
  maxLogEntries: 500,
});

// Later, for example in a hot-module-replacement dispose hook:
removeDevTools();
await orchestrator.destroy();
```

### `EventLogger`

```ts no-check
class EventLogger {
  constructor(maxEntries?: number); // default 200
  attach(bus: IEventBus): void;
  detach(): void;
  getEntries(): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>;
  getRecent(count?: number): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>; // default 20
  clear(): void;
}
```

`EventLogger` `bus.onAny` के ज़रिए bus के हर event को record करता है। हर entry में `timestamp` (emit के समय `Date.now()`), `event` (name) और `data` (emit किया गया payload, clone नहीं किया गया) होते हैं। Log `maxEntries` से बड़ा होने पर logger सबसे पुरानी entries हटा देता है।

| Method | Behaviour |
| --- | --- |
| `attach(bus)` | `bus` के सभी events को subscribe करता है। Bus destroyed हो तो throw करता है। |
| `detach()` | Unsubscribe करता है। Record की गई entries बनी रहती हैं। |
| `getEntries()` | पूरा log लौटाता है, सबसे पुराना पहले। |
| `getRecent(count)` | आख़िरी `count` entries लौटाता है, सबसे पुरानी पहले। |
| `clear()` | Log खाली करता है और subscription बनाए रखता है। |

Test में bus traffic पर assert करने या किसी पेज से events dump करने के लिए इसे पैनल के बिना इस्तेमाल करें:

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);

bus.emit('cart:add', { sku: 'A-1' });

console.log(logger.getRecent(1)); // [{ timestamp: 1761..., event: 'cart:add', data: { sku: 'A-1' } }]
logger.detach();
```

### `DevToolsPanel`

```ts no-check
class DevToolsPanel {
  constructor();
  mount(): void;
  unmount(): void;
  toggle(): void;
  update(state: {
    registeredApps: string[];
    mountedApps: string[];
    currentRoute: string;
    events: Array<{ timestamp: number; event: string }>;
  }): void;
}
```

`DevToolsPanel` overlay का DOM हिस्सा है, बिना किसी polling के। आप जो state दिखाना चाहते हैं, उसके साथ `update()` call करते हैं।

| Method | Behaviour |
| --- | --- |
| `mount()` | `#tuvix-devtools` को खुली हालत में `document.body` में जोड़ता है। उसी instance पर दूसरी call कुछ नहीं करती। |
| `unmount()` | Element हटाता है। |
| `toggle()` | पैनल body दिखाता या छिपाता है। Toggle button बना रहता है। `mount()` से पहले कुछ नहीं करता। |
| `update(state)` | Apps, Route और Events sections दोबारा बनाता है। `events` के आख़िरी 10 items print करता है, सबसे नया पहले। `mount()` से पहले कुछ नहीं करता। |

```ts
import { DevToolsPanel } from '@tuvix.js/devtools';

const panel = new DevToolsPanel();
panel.mount();
panel.update({
  registeredApps: ['header', 'cart'],
  mountedApps: ['header'],
  currentRoute: '/checkout',
  events: [{ timestamp: Date.now(), event: 'cart:open' }],
});
```

### Types

| नाम | अर्थ |
| --- | --- |
| `DevToolsOptions` | `installDevTools` के विकल्प: `maxLogEntries`, `autoOpen`, `updateInterval`। |

Orchestrator shape और log entry shape export नहीं होते। इन्हें types के रूप में चाहिए तो `Parameters<typeof installDevTools>[0]` और `ReturnType<EventLogger['getEntries']>[number]` इस्तेमाल करें।

## Production builds

पैकेज `"sideEffects": false` घोषित करता है, लेकिन अगर आपका code static `import { installDevTools } from '@tuvix.js/devtools'` को call करता है तो वह bundle में पहुँच जाता है। इसे build-time flag के पीछे dynamic `import()` से load करें, जैसे क्विक स्टार्ट में किया है। Bundlers `process.env.NODE_ENV` को string से बदलते हैं और dead branch और उसका chunk हटा देते हैं। Vite ऐप में आप इसकी जगह `import.meta.env.DEV` जाँच सकते हैं।

Production में overlay चालू छोड़ने की क़ीमत: एक `setInterval` जो हर सेकंड तीन DOM sections दोबारा बनाता है, हर bus event का subscription, और एक global जो पेज की किसी भी script को orchestrator सौंप देता है।

## Edge cases

- `register()` और `start()` से पहले इंस्टॉल करें। Logger सिर्फ़ `attach` के बाद emit हुए events देखता है, और पहले refresh तक पैनल खाली रहता है, जो call के `updateInterval` milliseconds बाद होता है।
- `installDevTools` को `document` और `window` चाहिए। सर्वर रेंडरिंग के दौरान इसे call करने पर `ReferenceError` throw होता है। इसे सिर्फ़ client वाले code से call करें।
- `connectRouter()` के साथ और `router` विकल्प के बिना `getRouter()` `null` लौटाता है और Route row `/` दिखाती है।
- `getMountedApps()` सिर्फ़ `mounted` status गिनता है। `mounting` या `error` वाले ऐप को सफ़ेद dot मिलता है, और पैनल कभी status name print नहीं करता।
- `orchestrator.destroy()` private bus (`createOrchestrator({ eventBus: {...} })`) को destroy कर देता है। उसके बाद इंस्टॉल करने पर `onAny` से throw होता है। डिफ़ॉल्ट global bus के साथ logger `destroy()` के बाद भी record करता रहता है, जब तक आप cleanup फ़ंक्शन call नहीं करते।
- हर call एक नया पैनल बनाता है। दो calls पेज पर एक जैसे element ids वाले दो overlays डालती हैं, और दूसरी call `window.__TUVIX_DEVTOOLS__` को overwrite करती है। तब पहला cleanup फ़ंक्शन वह global delete कर देता है जिसे दूसरी call ने set किया था।
- एक ही instance पर `EventLogger.attach()` दो बार call करने से stored unsubscribe फ़ंक्शन बदल जाता है। तब `detach()` सिर्फ़ दूसरा subscription हटाता है।
- Log के `maxLogEntries` तक पहुँचने पर logger हर नए event पर array copy करता है। बहुत ज़्यादा events वाले bus के पेजों पर `maxLogEntries` को सैकड़ों में रखें।
- पैनल ऐप names, routes और event names को `textContent` से लिखता है, इसलिए event name में markup text के रूप में दिखता है।

## यह क्या नहीं करता

- कोई keyboard shortcut नहीं, और position, size या theme के लिए कोई विकल्प नहीं। Overlay हमेशा inline styles के साथ नीचे दाएँ रहता है।
- UI में कोई event payloads, entry URLs, loader cache state या mount timings नहीं। Payloads `__TUVIX_DEVTOOLS__.logger.getEntries()` से पढ़ें।
- कोई ब्राउज़र extension नहीं और React, Vue, Svelte या Angular devtools से कोई connection नहीं।
- कोई time travel या event replay नहीं। Logger record करता है और कभी re-emit नहीं करता।
- Production builds में अपने-आप हटना नहीं। Import को आप ख़ुद gate करते हैं।

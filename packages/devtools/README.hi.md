# @tuvix.js/devtools

> पेज के अंदर का debug overlay, जो किसी orchestrator के registered और mounted ऐप्स, उसका current route और हाल का event bus traffic दिखाता है

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा।

## इंस्टॉलेशन

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## क्विक स्टार्ट

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/dashboard/*', app: 'dashboard' }] },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
await orchestrator.start();
```

नीचे दाएँ कोने में एक गोल button दिखता है। उसके ऊपर का panel हर second refresh होता है और यह दिखाता है:

- **Apps**: हर registered ऐप, status `mounted` होने पर हरे dot के साथ और बाकी हालात में सफ़ेद dot के साथ।
- **Route**: `orchestrator.getRouter()?.currentPath`, या राउटर न होने पर `/`।
- **Events**: bus के 10 सबसे नए events (समय और नाम), सबसे नया सबसे ऊपर।

overlay `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }` भी सेट करता है। event payloads पढ़ने के लिए console में `__TUVIX_DEVTOOLS__.logger.getEntries()` चलाएँ।

## API

### `installDevTools(orchestrator, options?): () => void`

`getRegisteredApps()`, `getMountedApps()`, `getEventBus()` और `getRouter()` वाला कोई भी object लेता है, जैसे एक `Orchestrator`। एक cleanup function लौटाता है जो polling रोकता है, logger को detach करता है, panel हटाता है और global delete करता है।

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | logger ज़्यादा से ज़्यादा कितने events रखता है |
| `autoOpen` | `boolean` | `true` | `false` panel को छिपा हुआ mount करता है; toggle button उसे खोलता है |
| `updateInterval` | `number` | `1000` | panel refreshes के बीच milliseconds |

### `EventLogger`

`new EventLogger(maxEntries = 200)` `onAny` के ज़रिए bus का हर event record करता है। Entries `{ timestamp, event, data }` होती हैं।

| Method | व्यवहार |
| --- | --- |
| `attach(bus)` | सभी events को subscribe करता है। destroyed bus पर throw करता है। |
| `detach()` | unsubscribe करता है और entries रखता है |
| `getEntries()` | पूरा log, सबसे पुराना सबसे पहले |
| `getRecent(count = 20)` | आख़िरी `count` entries, सबसे पुरानी सबसे पहले |
| `clear()` | log ख़ाली करता है |

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);
bus.emit('cart:add', { sku: 'A-1' });
console.log(logger.getRecent(1)); // [{ timestamp, event: 'cart:add', data: { sku: 'A-1' } }]
```

### `DevToolsPanel`

polling के बिना overlay DOM। state आप ख़ुद देते हैं।

| Method | व्यवहार |
| --- | --- |
| `mount()` | `#tuvix-devtools` को `document.body` में खुली हालत में append करता है। दूसरी call कुछ नहीं करती। |
| `unmount()` | इसे हटाता है |
| `toggle()` | panel body दिखाता या छिपाता है; button बना रहता है |
| `update({ registeredApps, mountedApps, currentRoute, events })` | तीनों sections दोबारा रेंडर करता है |

### `DevToolsOptions`

ऊपर दिए `installDevTools` विकल्पों का type।

## Edge cases

- logger सिर्फ़ `installDevTools` के बाद emit हुए events देखता है, और panel पहले refresh पर भरता है, यानी `updateInterval` ms बाद।
- सिर्फ़ ब्राउज़र: सर्वर रेंडरिंग के दौरान `installDevTools` `ReferenceError` throw करता है।
- `mounting` या `error` वाले ऐप पर सफ़ेद dot दिखता है; panel status के नाम print नहीं करता।
- default global bus के साथ, logger `orchestrator.destroy()` के बाद भी तब तक record करता रहता है जब तक आप cleanup function call न करें।
- दो `installDevTools` calls एक जैसे element ids वाले दो overlays बनाती हैं, और दूसरी call `window.__TUVIX_DEVTOOLS__` को overwrite करती है।

## यह क्या नहीं करता

- कोई keyboard shortcut नहीं, और position, size या theme के विकल्प नहीं।
- UI में payloads, entry URLs, loader state या timings नहीं।
- कोई browser extension नहीं, और फ्रेमवर्क devtools से कोई link नहीं।
- production में अपने आप हटता नहीं: import को build-time flag के पीछे रखें, जैसा क्विक स्टार्ट में है।

पूरा documentation: [tuvix.js.org/hi/packages/devtools](https://tuvix.js.org/hi/packages/devtools)

## License

MIT

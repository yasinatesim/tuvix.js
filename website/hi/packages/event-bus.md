---
title: '@tuvix.js/event-bus'
---

<PackageHeader
  name="@tuvix.js/event-bus"
  title="Event Bus"
  description="माइक्रो ऐप्स के बीच संदेशों के लिए synchronous publish/subscribe bus। हर पेज पर एक global bus, जिसे पैकेज की हर bundled कॉपी साझा करती है।"
  icon="📡"
  npm="true"
/>

## इंस्टॉलेशन {#installation}

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## इसे कब इस्तेमाल करें {#when-to-use-it}

एक पेज पर मौजूद माइक्रो ऐप्स को एक-दूसरे को बातें बतानी होती हैं: cart ऐप `cart:updated` की घोषणा करता है, header नई गिनती दिखाता है। event bus उन्हें यह काम event के नाम से करने देता है, एक-दूसरे को import किए बिना।

`@tuvix.js/core` का orchestrator `getGlobalBus()` इस्तेमाल करता है और mount context में इसे `bus` के रूप में हर ऐप को देता है। माइक्रो ऐप के अंदर वही `bus` इस्तेमाल करें या `getGlobalBus()` कॉल करें; दोनों एक ही instance लौटाते हैं। tests के लिए, या उन संदेशों के लिए जो एक ही ऐप के अंदर रहते हैं, `createEventBus()` से एक private bus बनाएं।

ऐसी state के लिए, जिसे देर से subscribe करने वाले को पढ़ना हो (कोई store, या URL), और tabs या iframes के बीच संदेशों के लिए (`BroadcastChannel`, `postMessage`) कुछ और चुनें।

## क्विक स्टार्ट {#quick-start}

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

interface CartUpdated {
  itemCount: number;
  total: number;
}

const bus = getGlobalBus();

// header app
const stop = bus.on<CartUpdated>('cart:updated', ({ itemCount }) => {
  document.querySelector('#cart-count')!.textContent = String(itemCount);
});

// cart app
bus.emit<CartUpdated>('cart:updated', { itemCount: 3, total: 59.9 });

// header app, on unmount
stop();
```

orchestrator जिस माइक्रो ऐप को mount करता है, उसे bus अपने mount context में मिलता है:

```ts
import { registerModule } from '@tuvix.js/loader';

let stop: (() => void) | undefined;

registerModule('header', {
  mount({ container, bus }) {
    stop = bus?.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
      container.textContent = `Cart: ${itemCount}`;
    });
  },
  unmount({ container }) {
    stop?.();
    container.replaceChildren();
  },
});
```

## API {#api}

### `EventBus`

```ts no-check
class EventBus implements IEventBus {
  constructor(options?: EventBusOptions);
}
```

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | हर event के लिए listeners की वह संख्या, जिस पर पहुंचने के बाद एक और listener जोड़ने पर `on` एक `console.warn` प्रिंट करता है, bus के पूरे जीवनकाल में हर event नाम के लिए एक बार। listener दोनों हालात में जुड़ जाता है। `0` चेतावनी बंद कर देता है। यह चेतावनी `debug` पर निर्भर नहीं करती। |
| `debug` | `boolean` | `false` | हर subscribe, unsubscribe और emit को `logger` के ज़रिए log करता है। |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | debug संदेश प्राप्त करता है, हर संदेश की शुरुआत में `[Tuvix EventBus]` होता है। `maxListeners` वाली चेतावनी इससे होकर नहीं जाती। |

```ts
import { EventBus } from '@tuvix.js/event-bus';

const bus = new EventBus({ debug: true, maxListeners: 20 });
```

#### `on(event, handler)`

```ts no-check
on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

`handler` को `event` पर subscribe करता है और एक function लौटाता है जो उसे unsubscribe करता है। `T` payload का type तय करता है; bus runtime पर इसे जांचता नहीं है।

#### `once(event, handler)`

```ts no-check
once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

`on` की तरह काम करता है, लेकिन पहली कॉल से पहले handler को हटा देता है। event fire होने से पहले रद्द करने के लिए लौटाए गए function को कॉल करें। `off(event, handler)` इसे नहीं ढूंढ पाता, क्योंकि bus एक wrapper संग्रहित करता है।

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
const cancel = bus.once('app:ready', () => console.log('ready'));
cancel();
```

#### `emit(event, data?)`

```ts no-check
emit<T = unknown>(event: string, data?: T): void;
```

`event` के हर handler को subscription के क्रम में कॉल करता है, फिर हर `onAny` handler को, और यह सब `emit` के लौटने से पहले होता है। कोई handler throw करे तो bus उसे `console.error('[Tuvix EventBus] Error in handler for "<event>":', error)` से log करता है और बाकी handlers फिर भी चलते हैं।

#### `off(event, handler)`

```ts no-check
off<T = unknown>(event: string, handler: EventHandler<T>): void;
```

एक handler हटाता है। अज्ञात events और handlers को अनदेखा करता है।

#### `offAll(event?)`

```ts no-check
offAll(event?: string): void;
```

`event` देने पर उस event के सभी handlers हटाता है। उसके बिना, हर event के सभी handlers और सभी `onAny` handlers हटाता है।

#### `onAny(handler)`

```ts no-check
onAny<T = unknown>(handler: WildcardHandler<T>): Unsubscribe;
```

हर event पर subscribe करता है। handler को `(eventName, data)` मिलता है। इसे logging और devtools के लिए इस्तेमाल करें।

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const stopLogging = getGlobalBus().onAny((event, data) => {
  console.debug('[bus]', event, data);
});
```

#### `offAny(handler)`

```ts no-check
offAny<T = unknown>(handler: WildcardHandler<T>): void;
```

एक `onAny` handler हटाता है।

#### `hasListeners(event)`, `listenerCount(event)`, `eventNames()`

```ts no-check
hasListeners(event: string): boolean;
listenerCount(event: string): number;
eventNames(): string[];
```

subscriptions की जांच करते हैं। `onAny` handlers गिने नहीं जाते, और `eventNames()` केवल उन events की सूची देता है जिनके पास कम से कम एक handler है।

#### `destroy()`

```ts no-check
destroy(): void;
```

हर handler हटाता है और bus को destroyed चिह्नित करता है। इसके बाद `on`, `once`, `emit` और `onAny` एरर `[Tuvix EventBus] Cannot use a destroyed EventBus instance. Create a new one.` throw करते हैं। orchestrator `destroy()` में private bus (जिसे उसने `eventBus` विकल्पों से बनाया) को destroy करता है और global bus को चालू छोड़ देता है।

### `createEventBus`

```ts no-check
function createEventBus(options?: EventBusOptions): IEventBus;
```

`IEventBus` type के साथ `new EventBus(options)` लौटाता है। ऊपर की तालिका वाले विकल्प लेता है।

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
bus.on<string>('hello', (name) => console.log(`Hello, ${name}!`));
bus.emit('hello', 'World');
```

### `getGlobalBus`

```ts no-check
function getGlobalBus(options?: EventBusOptions): IEventBus;
```

पेज का साझा bus लौटाता है और पहली कॉल पर उसे बनाता है। bus `window.__TUVIX_GLOBAL_BUS__` पर रहता है, इसलिए जो माइक्रो ऐप `@tuvix.js/event-bus` की अपनी कॉपी bundle करता है, उसे भी shell वाला instance ही मिलता है। `options` केवल उस कॉल पर लागू होते हैं जो bus बनाती है। सर्वर पर, `window` के बिना, bus एक module-level singleton होता है।

जब तक आप `createOrchestrator` को `eventBus` विकल्प नहीं देते, orchestrator यही bus इस्तेमाल करता है, इसलिए `orchestrator.getEventBus() === getGlobalBus()`।

### `resetGlobalBus`

```ts no-check
function resetGlobalBus(): void;
```

global bus को destroy करता है और `window.__TUVIX_GLOBAL_BUS__` को साफ़ करता है। अगला `getGlobalBus()` एक नया bus बनाता है। जिस कोड ने पुराना instance रखा था, orchestrator समेत, वह फिर `emit` पर throw करता है। इसे tests के बीच कॉल करें।

```ts
import { getGlobalBus, resetGlobalBus } from '@tuvix.js/event-bus';

getGlobalBus().emit('test:start');
resetGlobalBus();
```

### Types {#types}

```ts
type EventHandler<T = unknown> = (data: T) => void;
type WildcardHandler<T = unknown> = (eventName: string, data: T) => void;
type Unsubscribe = () => void;
```

| Type | अर्थ |
| --- | --- |
| `EventHandler<T>` | एक event के लिए handler। |
| `WildcardHandler<T>` | `onAny` के लिए handler, event का नाम और data प्राप्त करता है। |
| `Unsubscribe` | `on`, `once` और `onAny` द्वारा लौटाया गया function। |
| `EventBusOptions` | `{ maxListeners?, debug?, logger? }`। |
| `IEventBus` | वह interface जिसे `EventBus` implement करता है: ऊपर सूचीबद्ध हर method। यह `@tuvix.js/loader` के `MicroAppBus` को संतुष्ट करता है। |

## Edge cases {#edge-cases}

- **हर emit पर snapshot।** `emit` पहले handler सूची की कॉपी बनाता है। emit के दौरान जोड़ा गया handler अगले emit से चलता है; emit के दौरान हटाया गया handler मौजूदा emit में फिर भी चलता है।
- **एक ही function दो बार।** एक function को एक event पर दो बार subscribe करने पर bus उसे एक बार संग्रहित करता है, और एक `off` उसे हटा देता है।
- **Async handlers।** `emit` लौटाए गए promises का इंतज़ार नहीं करता। reject हुआ promise bus के `try`/`catch` से बच निकलता है और unhandled rejection के रूप में दिखता है।
- **अमान्य input।** `''` या whitespace के लिए `on`, `once` और `emit` एरर `[Tuvix EventBus] Event name must be a non-empty string.` throw करते हैं। handler function न हो तो `on` और `onAny` एरर `[Tuvix EventBus] Handler must be a function.` throw करते हैं। `once` पहले handler को wrap करता है, इसलिए non-function पास हो जाता है और पहले `emit` पर fail होता है, जहां bus एरर को log करता है।
- **`destroy()` के बाद।** `off`, `offAll`, `offAny`, `hasListeners`, `listenerCount` और `eventNames` काम करते रहते हैं और एक खाली bus की रिपोर्ट देते हैं।
- **मिश्रित versions।** जो माइक्रो ऐप `@tuvix.js/event-bus` 0.4 bundle करता है, वह अपना module-level bus रखता है और साझा bus को नहीं देखता।
- **Listener सीमा।** `maxListeners: 20` के साथ, एक event में 21वां handler जोड़ने पर यह प्रिंट होता है: `[Tuvix EventBus] Max listeners (20) reached for event "<event>". The listener was added; check for handlers that are never removed.` bus अपने जीवनकाल में हर event नाम के लिए एक बार चेतावनी देता है, इसलिए handlers हटाकर फिर से जोड़ने पर दूसरी बार चेतावनी नहीं आती।
- **Iframes।** हर window का अपना `__TUVIX_GLOBAL_BUS__` होता है।

## यह क्या नहीं करता {#what-it-does-not-do}

- यह events को नाम के आधार पर type नहीं करता। कोई event map नहीं है और augment करने के लिए कोई `TuvixEvents` interface नहीं है; payload type को `on<T>` और `emit<T>` में दें।
- यह events को replay नहीं करता। `emit` के बाद subscribe किया गया handler उस event से चूक जाता है।
- यह `user:*` जैसे patterns match नहीं करता। `onAny` को हर event मिलता है।
- यह दूसरे tabs, windows या iframes को संदेश नहीं भेजता।

## 0.4 से माइग्रेशन {#migrating-from-0-4}

- `getGlobalBus()` अब अपना singleton `window.__TUVIX_GLOBAL_BUS__` पर रखता है। 0.4 में पैकेज की हर bundled कॉपी अपना "global" bus बनाती थी, इसलिए अपनी कॉपी वाले माइक्रो ऐप्स shell की बात कभी नहीं सुनते थे। किसी भी कॉपी से `resetGlobalBus()` अब सभी के लिए bus reset करता है।
- इस पेज के 0.4 संस्करण में `clear(event?)`, `createEventBus<EventMap>()` और एक `TuvixEvents` interface का वर्णन था। इनमें से कोई भी मौजूद नहीं था। `offAll(event?)` और हर कॉल वाले generic `on<T>` / `emit<T>` इस्तेमाल करें।

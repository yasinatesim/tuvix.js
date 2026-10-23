# @tuvix.js/event-bus

> माइक्रो ऐप्स के बीच messages के लिए synchronous publish/subscribe bus, हर पेज पर एक global bus के साथ।

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा। पूरा documentation: [tuvix.js.org/hi/packages/event-bus](https://tuvix.js.org/hi/packages/event-bus)।

## इंस्टॉलेशन

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## क्विक स्टार्ट

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const stop = bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
  console.log('Items in cart:', itemCount);
});

bus.emit('cart:updated', { itemCount: 3 });
stop();
```

`@tuvix.js/core` का orchestrator `getGlobalBus()` का इस्तेमाल करता है (जब तक आप `eventBus` विकल्प पास न करें) और इसे mount context में `bus` के रूप में हर ऐप को पास करता है।

## API

### `EventBus` और `createEventBus`

```ts no-check
new EventBus(options?: EventBusOptions);
createEventBus(options?: EventBusOptions): IEventBus;
```

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | हर event के लिए वह संख्या, जिसके बाद एक और listener जोड़ने पर `on` एक `console.warn` print करता है, हर event नाम के लिए एक बार, `debug` के साथ या उसके बिना। listener फिर भी जुड़ जाता है। `0` का मतलब कोई चेतावनी नहीं। |
| `debug` | `boolean` | `false` | subscribe, unsubscribe और emit calls को log करता है। |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | debug output पाता है। |

| Method | व्यवहार |
| --- | --- |
| `on<T>(event, handler): Unsubscribe` | subscribe करता है; हटाने वाला function लौटाता है। |
| `once<T>(event, handler): Unsubscribe` | handler को उसकी पहली call से पहले हटा देता है। इसे `off` से नहीं, लौटाए गए function से cancel करें। |
| `emit<T>(event, data?)` | लौटने से पहले event के handlers को क्रम से call करता है, फिर `onAny` handlers को। throw करने वाला handler `console.error` से log होता है; बाकी फिर भी चलते हैं। |
| `off(event, handler)` | एक handler हटाता है। |
| `offAll(event?)` | किसी event के handlers हटाता है, या `onAny` वालों समेत सभी handlers। |
| `onAny(handler): Unsubscribe` | handler हर event के लिए `(eventName, data)` पाता है। |
| `offAny(handler)` | एक `onAny` handler हटाता है। |
| `hasListeners(event)`, `listenerCount(event)`, `eventNames()` | subscriptions की जाँच करते हैं; `onAny` handlers गिने नहीं जाते। |
| `destroy()` | सभी handlers हटाता है। इसके बाद `on`, `once`, `emit` और `onAny` calls throw करती हैं। |

### `getGlobalBus`

```ts no-check
getGlobalBus(options?: EventBusOptions): IEventBus;
```

पेज का साझा bus लौटाता है, जो `window.__TUVIX_GLOBAL_BUS__` पर store होता है, ताकि जो माइक्रो ऐप्स इस पैकेज की अपनी copy bundle करते हैं, उन्हें भी वही instance मिले। `options` सिर्फ़ उसी call पर लागू होते हैं जो bus बनाती है। `window` के बिना bus एक module-level singleton होता है।

### `resetGlobalBus`

```ts no-check
resetGlobalBus(): void;
```

global bus को destroy करता है; अगला `getGlobalBus()` एक नया bus बनाता है। पुराने references इस्तेमाल करने पर throw करते हैं। यह tests के लिए है।

### Types

`EventHandler<T>` (`(data: T) => void`), `WildcardHandler<T>` (`(eventName: string, data: T) => void`), `Unsubscribe` (`() => void`), `EventBusOptions`, `IEventBus`।

## Edge cases

- `emit` handler list की एक copy पर काम करता है: emit के दौरान जोड़े गए handlers अगले emit से चलते हैं।
- एक ही event पर दो बार subscribe किया गया एक ही function एक बार store होता है।
- `emit` async handlers को await नहीं करता; उनके rejections unhandled रहते हैं।
- ख़ाली या whitespace वाले event नाम `[Tuvix EventBus] Event name must be a non-empty string.` throw करते हैं।
- जो माइक्रो ऐप इस पैकेज का 0.4 bundle करता है, उसका अपना अलग bus रहता है।

## यह क्या नहीं करता

- event map typing नहीं है; payload type को `on<T>` / `emit<T>` के रूप में पास करें।
- देर से subscribe करने वालों के लिए replay नहीं, `user:*` patterns नहीं, और tabs या iframes के पार messages नहीं।

## License

MIT

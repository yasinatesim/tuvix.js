# Event Bus

`@tuvix.js/event-bus` एक synchronous publish/subscribe channel है। एक पेज पर मौजूद ऐप्स इससे एक-दूसरे को बताते हैं कि क्या हुआ ("cart updated", "user logged out"), और इसके लिए उन्हें एक-दूसरे का code import नहीं करना पड़ता।

## Bus चुनें

| Bus | कैसे पाएँ | कब इस्तेमाल करें |
| --- | --- | --- |
| Global bus | `getGlobalBus()` | Default। पेज के हर ऐप को, चाहे वह किसी भी bundle में हो, यही instance मिलता है। |
| Orchestrator bus | `orchestrator.getEventBus()` या mount context में `bus` | माइक्रो ऐप्स के अंदर। जब तक shell `eventBus` विकल्प न दे, यह global bus ही है। |
| Private bus | `createEventBus(options)` | Tests के लिए, या ऐसे channel के लिए जिसे सिर्फ़ एक ऐप इस्तेमाल करता है। |

`getGlobalBus()` अपना instance `window.__TUVIX_GLOBAL_BUS__` पर रखता है। दो माइक्रो ऐप्स अपने-अपने bundle में `@tuvix.js/event-bus` रखें, तब भी वे इसे साझा करते हैं। सर्वर पर `window` नहीं होता, इसलिए वहाँ हर module copy का अपना instance होता है।

## Emit और subscribe

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => {
  console.log('logged in', userId);
});

bus.emit('user:login', { userId: '42' });

off();
```

`emit` return होने से पहले हर handler को call करता है। Throw करने वाले handler का एरर `console.error` से log होता है; बाकी handlers फिर भी चलते हैं। कुछ भी queue नहीं होता: `emit` के बाद जुड़ने वाले subscriber को वह event नहीं मिलता।

## Typed events

`on`, `once` और `emit` पर दिया generic payload का type तय करता है। पूरे project के लिए event map बनाना हो, तो bus को wrap करें:

```ts
import { getGlobalBus, type IEventBus } from '@tuvix.js/event-bus';

export interface AppEvents {
  'user:login': { userId: string };
  'user:logout': { userId: string };
  'cart:updated': { itemCount: number; total: number };
}

export function emit<E extends keyof AppEvents>(bus: IEventBus, event: E, payload: AppEvents[E]): void {
  bus.emit(event, payload);
}

export function on<E extends keyof AppEvents>(
  bus: IEventBus,
  event: E,
  handler: (payload: AppEvents[E]) => void,
): () => void {
  return bus.on<AppEvents[E]>(event, handler);
}

emit(getGlobalBus(), 'cart:updated', { itemCount: 3, total: 42 });
```

## माइक्रो ऐप में bus इस्तेमाल करें

Bus को mount context से लें और `unmount` में unsubscribe करें:

```ts
import { defineMicroApp } from '@tuvix.js/core';

const subscriptions: Array<() => void> = [];

export default defineMicroApp({
  name: 'header',

  mount({ container, bus }) {
    const badge = document.createElement('span');
    container.replaceChildren(badge);
    if (!bus) return;
    subscriptions.push(
      bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
        badge.textContent = String(itemCount);
      }),
      bus.on('user:logout', () => {
        badge.textContent = '';
      }),
    );
  },

  unmount({ container }) {
    for (const off of subscriptions.splice(0)) off();
    container.replaceChildren();
  },
});
```

React और Vue कंपोनेंट `useTuvixBus(bus, event, handler)` इस्तेमाल कर सकते हैं, जो कंपोनेंट unmount होने पर unsubscribe कर देता है। [React](/hi/guide/react) और [Vue](/hi/guide/vue) देखें।

## once और wildcards

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

bus.once('app:ready', () => console.log('first ready event only'));

const offAny = bus.onAny((event, data) => console.debug('[bus]', event, data));
offAny();
```

`onAny` handlers हर event के लिए नाम वाले handlers के बाद चलते हैं, orchestrator के `tuvix:app:*` events के लिए भी।

## Listeners हटाएँ

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
const handler = (data: unknown) => console.log(data);

bus.on('ping', handler);
bus.off('ping', handler); // one handler
bus.offAll('ping'); // every handler for 'ping'
bus.offAll(); // every handler, wildcards included
```

Global bus पर `offAll()` तभी call करें जब पूरा पेज आपका हो। यह दूसरे ऐप्स के listeners भी हटा देता है।

## एरर और destroy हो चुके buses

- खाली event name या ऐसा handler जो function न हो, मिलने पर `on`, `once`, `emit` और `onAny` throw करते हैं।
- `bus.destroy()` के बाद subscribe या emit करने वाला हर method throw करता है। `resetGlobalBus()` global bus को destroy करता है; अगली `getGlobalBus()` call नया bus बनाती है।
- `orchestrator.destroy()` सिर्फ़ private bus को destroy करता है।

## Introspection

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
bus.hasListeners('user:login'); // boolean
bus.listenerCount('user:login'); // number
bus.eventNames(); // string[]
```

## Bus क्या नहीं करता

- यह events को persist या replay नहीं करता। मौजूदा state props के रूप में भेजें, या देर से आने वाला ऐप एक event भेजकर state माँगे और owner उसका जवाब दे।
- यह windows, tabs या iframes के पार नहीं जाता। उसके लिए `BroadcastChannel` या `postMessage` इस्तेमाल करें।
- यह runtime पर payloads validate नहीं करता। Generics सिर्फ़ compile-time पर काम करते हैं।

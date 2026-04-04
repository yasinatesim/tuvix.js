# Event Bus

`@tuvix.js/event-bus` क्रॉस-ऐप संचार के लिए एक टाइप्ड पब्लिश/सब्सक्राइब चैनल प्रदान करता है - साझा ग्लोबल्स या माइक्रो ऐप्स के बीच कपलिंग के बिना।

## इम्पोर्ट

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';
```

## बुनियादी उपयोग

```ts
// इवेंट प्रकाशित करें
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// इवेंट की सदस्यता लें
const unsubscribe = eventBus.on('user:login', (payload) => {
  console.log('User logged in:', payload.userId);
});

// समाप्त होने पर सदस्यता रद्द करें (unmount में महत्वपूर्ण!)
unsubscribe();
```

## टाइप्ड इवेंट्स

पूर्ण टाइप सुरक्षा के लिए TypeScript के साथ अपना इवेंट मैप परिभाषित करें:

```ts
// events.d.ts (साझा टाइप्स)
declare module '@tuvix.js/event-bus' {
  interface TuvixEvents {
    'user:login':  { userId: string; name: string };
    'user:logout': { userId: string };
    'cart:updated': { itemCount: number; total: number };
    'theme:changed': { theme: 'light' | 'dark' };
  }
}
```

अब TypeScript इवेंट नाम और पेलोड को लागू करेगा:

```ts
// ✅ सही
eventBus.emit('user:login', { userId: '42', name: 'Alice' });

// ✅ सही
eventBus.on('cart:updated', ({ itemCount, total }) => {
  updateCartBadge(itemCount);
});

// ❌ TypeScript त्रुटि - गलत पेलोड
eventBus.emit('user:login', { wrong: 'payload' });
```

## Once

इवेंट की सदस्यता केवल एक बार लें - हैंडलर पहली कॉल के बाद स्वचालित रूप से हटा दिया जाता है:

```ts
eventBus.once('user:login', (payload) => {
  // एक बार कॉल किया जाता है, फिर हटा दिया जाता है
  initUserSession(payload.userId);
});
```

## माइक्रो ऐप्स में क्लीनअप

मेमोरी लीक रोकने के लिए `unmount` में हमेशा सदस्यता रद्द करें:

```ts
export const app: MicroApp = {
  _subscriptions: [] as (() => void)[],

  async mount(container, props) {
    this._subscriptions.push(
      eventBus.on('theme:changed', ({ theme }) => applyTheme(theme))
    );
  },

  async unmount(container) {
    this._subscriptions.forEach((unsub) => unsub());
    this._subscriptions = [];
    container.innerHTML = '';
  },
};
```

## कस्टम Bus बनाएं

यदि आपको एक आइसोलेटेड इवेंट चैनल चाहिए (जैसे टेस्टिंग के लिए):

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus<{
  'count:updated': { count: number };
}>();

bus.emit('count:updated', { count: 42 });
```

## API संदर्भ

| मेथड | सिग्नेचर | विवरण |
|------|----------|-------|
| `emit` | `emit(event, payload)` | इवेंट प्रकाशित करें |
| `on` | `on(event, handler) → unsub` | सदस्यता लें, रद्द करने का फ़ंक्शन लौटाता है |
| `once` | `once(event, handler)` | एक बार सदस्यता लें, स्वतः हटता है |
| `off` | `off(event, handler)` | एक विशिष्ट हैंडलर हटाएं |
| `clear` | `clear(event?)` | सभी हैंडलर हटाएं (वैकल्पिक रूप से एक इवेंट के लिए) |

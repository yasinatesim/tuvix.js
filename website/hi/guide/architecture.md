# आर्किटेक्चर

## अवलोकन

Tuvix.js छोटे, संयोजन योग्य पैकेजों के मोनोरेपो के रूप में संरचित है। आप केवल वही आयात करते हैं जो आप उपयोग करते हैं।

```
@tuvix.js/core          ← Orchestrator, लाइफसाइकल, पंजीकरण
@tuvix.js/router        ← URL-आधारित रूटिंग
@tuvix.js/event-bus     ← अंतर-ऐप पब/सब
@tuvix.js/loader        ← गतिशील बंडल लोडिंग
@tuvix.js/sandbox       ← CSS + JS आइसोलेशन
@tuvix.js/react         ← React बाइंडिंग
@tuvix.js/vue           ← Vue बाइंडिंग
@tuvix.js/svelte        ← Svelte बाइंडिंग
@tuvix.js/angular       ← Angular बाइंडिंग
@tuvix.js/devtools      ← डीबग पैनल
@tuvix.js/server        ← SSR कंपोजिशन
@tuvix.js/module-federation  ← Webpack 5 इंटीग्रेशन
create-tuvix-app        ← CLI स्कैफोल्डिंग
tuvix.js                ← अम्ब्रेला पैकेज (ऑल-इन-वन)
```

## अनुरोध प्रवाह

```
URL परिवर्तन
    │
    ▼
@tuvix.js/router         ← पथ को माइक्रो ऐप नाम से मिलाता है
    │
    ▼
@tuvix.js/core           ← Orchestrator माउंट/अनमाउंट का निर्णय लेता है
    │
    ▼
@tuvix.js/loader         ← माइक्रो ऐप बंडल प्राप्त करता और निष्पादित करता है
    │
    ▼
@tuvix.js/sandbox        ← ऐप को आइसोलेटेड स्कोप में रैप करता है (वैकल्पिक)
    │
    ▼
Micro App .mount()       ← ऐप अपने कंटेनर एलिमेंट में रेंडर होता है
```

## जीवनचक्र

हर माइक्रो ऐप को `MicroApp` इंटरफ़ेस लागू करना होगा:

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

Orchestrator इन हुक्स को सही समय पर कॉल करता है:

1. **`mount`** - जब ऐप का रूट सक्रिय होता है तब कॉल होता है
2. **`unmount`** - जब ऐप के रूट से दूर नेविगेट किया जाता है तब कॉल होता है
3. **`update`** - जब पूर्ण रीमाउंट के बिना props बदलते हैं तब कॉल होता है

## आइसोलेशन मॉडल

### CSS आइसोलेशन (Shadow DOM)

जब `sandbox.css = true`, माइक्रो ऐप का कंटेनर Shadow DOM होस्ट बन जाता है। अंदर परिभाषित स्टाइल बाहर लीक नहीं हो सकते, और ग्लोबल स्टाइल अंदर लीक नहीं हो सकते।

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### JS आइसोलेशन (Proxy Scope)

जब `sandbox.js = true`, माइक्रो ऐप का ग्लोबल स्कोप `Proxy` में रैप किया जाता है। `window.localStorage`, `window.addEventListener` आदि तक पहुंच इंटरसेप्ट की जाती है और अनमाउंट पर साफ की जाती है।

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true, js: true },
});
```

## Event Bus

Event Bus सभी माइक्रो ऐप्स के बीच साझा एक विसंबद्ध पब/सब चैनल है:

```ts
// प्रकाशक (कोई भी माइक्रो ऐप)
import { eventBus } from '@tuvix.js/event-bus';
eventBus.emit('user:login', { userId: '42' });

// सदस्य (एक अन्य माइक्रो ऐप)
eventBus.on('user:login', ({ userId }) => {
  console.log('User logged in:', userId);
});
```

इवेंट टाइप्ड हैं - TypeScript इवेंट पेलोड के आकार को लागू करेगा।

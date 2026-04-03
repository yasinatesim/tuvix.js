# सैंडबॉक्सिंग

`@tuvix.js/sandbox` माइक्रो ऐप्स को एक दूसरे या शेल के साथ हस्तक्षेप करने से रोकने के लिए CSS और JavaScript आइसोलेशन प्रदान करता है।

## CSS आइसोलेशन (Shadow DOM)

जब CSS सैंडबॉक्सिंग सक्षम होता है, माइक्रो ऐप का कंटेनर Shadow DOM होस्ट में अपग्रेड हो जाता है। अंदर परिभाषित स्टाइल उस shadow root तक सीमित होते हैं - वे शेल या अन्य माइक्रो ऐप्स में लीक नहीं हो सकते।

### प्रति ऐप सक्षम करें

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### कैसे काम करता है

```
Shell DOM
├── #app (orchestrator कंटेनर)
│   ├── Shadow Root (my-app)  ← स्टाइल यहां सीमित
│   │   ├── <style>.button { color: red }</style>
│   │   └── <div class="button">Click me</div>
│   └── Shadow Root (other-app)
│       └── <div class="button">Not affected!</div>
```

::: tip
Shadow DOM CSS आइसोलेशन सभी आधुनिक ब्राउज़रों में पूरी तरह से समर्थित है। लीगेसी ब्राउज़र सपोर्ट के लिए, केवल `js` आइसोलेशन मोड पर विचार करें।
:::

## JS आइसोलेशन (Proxy Scope)

जब JS सैंडबॉक्सिंग सक्षम होता है, माइक्रो ऐप का ग्लोबल स्कोप `Proxy` में रैप किया जाता है। `window.*`, इवेंट लिसनर्स, इंटरवल्स और टाइमआउट्स तक पहुंच इंटरसेप्ट की जाती है और `unmount` पर स्वचालित रूप से साफ की जाती है।

### प्रति ऐप सक्षम करें

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { js: true },
});
```

### क्या इंटरसेप्ट होता है

| एक्सेस | इंटरसेप्ट? | अनमाउंट पर साफ? |
|--------|-----------|-----------------|
| `window.someGlobal = x` | ✅ | ✅ |
| `addEventListener(...)` | ✅ | ✅ |
| `setTimeout(...)` | ✅ | ✅ |
| `setInterval(...)` | ✅ | ✅ |
| `localStorage` | ✅ | वैकल्पिक |
| `sessionStorage` | ✅ | वैकल्पिक |

## दोनों एक साथ उपयोग करना

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: {
    css: true,   // Shadow DOM आइसोलेशन
    js: true,    // Proxy स्कोप आइसोलेशन
  },
});
```

## कस्टम सैंडबॉक्स

आप `@tuvix.js/sandbox` को सीधे भी उपयोग कर सकते हैं:

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({ css: true, js: true });

// एक एलिमेंट के लिए आइसोलेटेड कंटेनर बनाएं
const { container, cleanup } = sandbox.mount(rootElement);

// बाद में, इसे हटाएं
cleanup();
```

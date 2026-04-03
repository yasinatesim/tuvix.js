# कॉन्फ़िगरेशन

## Orchestrator विकल्प

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  /**
   * रूट कंटेनर सेलेक्टर या एलिमेंट।
   * माइक्रो ऐप्स इस एलिमेंट के अंदर माउंट होती हैं।
   * @default '#app'
   */
  container: '#app',

  /**
   * किसी भी माइक्रो ऐप के माउंट होने से पहले कॉल किया जाता है।
   */
  onBeforeMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * माइक्रो ऐप के माउंट होने के बाद कॉल किया जाता है।
   */
  onAfterMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * जब माइक्रो ऐप mount/unmount के दौरान त्रुटि फेंकती है तब कॉल किया जाता है।
   */
  onError?: (error: Error, app: RegisteredApp) => void;
});
```

## माइक्रो ऐप्स पंजीकृत करना

```ts
orchestrator.register('my-app', {
  /**
   * माइक्रो ऐप के JavaScript बंडल का URL।
   * स्ट्रिंग या लेज़ी फ़ंक्शन हो सकता है जो स्ट्रिंग लौटाता है।
   */
  entry: 'https://cdn.example.com/my-app/main.js',

  /**
   * वैकल्पिक: माउंट पर माइक्रो ऐप को पास करने के लिए अतिरिक्त props।
   */
  props: {
    apiUrl: 'https://api.example.com',
  },

  /**
   * CSS और JS आइसोलेशन के लिए सैंडबॉक्स विकल्प।
   */
  sandbox: {
    css: true,   // Shadow DOM स्टाइल आइसोलेशन
    js: false,   // JS Proxy स्कोप आइसोलेशन
  },

  /**
   * इस विशिष्ट ऐप के लिए कंटेनर सेलेक्टर ओवरराइड करें।
   * Orchestrator-स्तर के कंटेनर पर फ़ॉलबैक करता है।
   */
  container: '#dashboard-container',
});
```

## Router विकल्प

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  orchestrator,

  /**
   * 'history' History API का उपयोग करता है (डिफ़ॉल्ट)।
   * 'hash' URL हैश का उपयोग करता है (#/पथ)।
   */
  mode: 'history',

  /**
   * रूट परिभाषाएं।
   */
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    {
      path: '/admin',
      app: 'admin',
      /**
       * गार्ड फ़ंक्शन - नेविगेशन ब्लॉक करने के लिए false लौटाएं।
       */
      guard: () => checkAuth(),
    },
  ],
});
```

## सैंडबॉक्स विकल्प

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({
  /**
   * Shadow DOM CSS आइसोलेशन सक्षम करें।
   */
  css: true,

  /**
   * JS Proxy स्कोप आइसोलेशन सक्षम करें।
   * window एक्सेस को इंटरसेप्ट करता है और अनमाउंट पर क्लीनअप करता है।
   */
  js: true,
});
```

## पर्यावरण चर

Tuvix.js को किसी पर्यावरण चर की आवश्यकता नहीं है। सभी कॉन्फ़िगरेशन कोड में किया जाता है।

प्रोडक्शन के लिए, रनटाइम मान इंजेक्ट करने के लिए अपने बंडलर के define/replace प्लगइन का उपयोग करें:

```ts
// vite.config.ts
export default {
  define: {
    __TUVIX_DEBUG__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
};
```

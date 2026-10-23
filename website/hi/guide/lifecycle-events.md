# Lifecycle Events

adapters और `defineMicroApp` पेज को बताते हैं कि माइक्रो ऐप कब mount होता है, कब unmount होता है या कब विफल होता है। आप DOM events सुन सकते हैं, `whenMounted(name)` को await कर सकते हैं, या `isMounted(name)` से पूछ सकते हैं। DOM को poll करने या `__vue_app__` जैसे फ्रेमवर्क internals पढ़ने के बजाय, island के interactive होते ही animation शुरू करने, skeleton छिपाने या एरर रिपोर्ट करने के लिए इन्हें इस्तेमाल करें।

## Events

| DOM event | कब dispatch होता है |
| --- | --- |
| `tuvix:mounted` | ऐप के रेंडर या hydrate होने और उसके फ्रेमवर्क के mount callbacks चलने के बाद। |
| `tuvix:unmounted` | ऐप के नष्ट होने और उसका container खाली होने के बाद। |
| `tuvix:error` | जब `mount` या `unmount` throw करता है, या जब कोई React ऐप mount के बाद रेंडर करते समय throw करता है। |

हर event ऐप के container पर dispatch होने वाला `CustomEvent<LifecycleDetail>` है। यह bubble करता है और `composed` है, इसलिए `document` पर लगा listener इसे पाता है, shadow root के अंदर से भी। जब container अब DOM में नहीं है (React ने island को उसके module के `unmounted` रिपोर्ट करने से पहले हटा दिया), तो event इसके बजाय `document` पर dispatch होता है, और `detail.container` फिर भी उसी element की ओर इशारा करता है।

```ts
import type { LifecycleDetail } from '@tuvix.js/loader';

const detail: LifecycleDetail = {
  name: 'footer', // the app name
  container: document.body, // the element the app rendered into
  hydrated: true, // true when the adapter adopted server markup
  error: undefined, // the thrown value, on 'error' only
};
```

## onLifecycle से सुनें

```ts
import { onLifecycle } from 'tuvix.js';

const stopMounted = onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} is interactive (hydrated: ${hydrated})`);
});

const stopErrors = onLifecycle('error', ({ name, error }) => {
  console.error(`${name} failed`, error);
});

// later
stopMounted();
stopErrors();
```

`onLifecycle(type, handler, target = document)` एक function लौटाता है जो listener हटाता है। केवल एक हिस्से को सुनने के लिए `target` के रूप में container दें। सादा `addEventListener('tuvix:mounted', ...)` भी काम करता है।

## whenMounted से इंतज़ार करें

```ts
import { whenMounted } from 'tuvix.js';

const controller = new AbortController();
setTimeout(() => controller.abort(new Error('footer did not mount in 5 s')), 5000);

const { container } = await whenMounted('footer', { signal: controller.signal });
container.classList.add('is-ready');
```

- अगर ऐप पहले से mount है तो यह तुरंत resolve होता है, इसलिए आपके कोड और mount का क्रम मायने नहीं रखता।
- mount विफल होने पर यह reject नहीं होता। timeout वाला `signal` दें, या साथ में `tuvix:error` भी सुनें।
- जब signal abort होता है, तो promise signal के reason के साथ reject होता है।

## isMounted से जाँचें

```ts
import { isMounted } from 'tuvix.js';

if (isMounted('footer')) {
  console.log('footer is on the page');
}
```

## फ्रेमवर्क sniffing की जगह

lifecycle events के बिना होस्ट को अंदाज़ा लगाना पड़ता है कि island कब तैयार है, उदाहरण के लिए किसी फ्रेमवर्क की private properties के लिए poll करके:

```ts no-check
// Breaks on Svelte, Angular and any Vue release that renames the property.
const timer = setInterval(() => {
  if ((container as any).__vue_app__) {
    clearInterval(timer);
    startReveal(container);
  }
}, 50);
```

lifecycle events के साथ एक listener हर adapter के लिए काम करता है:

```ts
import { onLifecycle } from 'tuvix.js';

declare function startReveal(container: HTMLElement): void;

onLifecycle('mounted', ({ name, container }) => {
  if (name === 'footer') startReveal(container);
});
```

## Events कौन dispatch करता है

| Source | क्या dispatch करता है |
| --- | --- |
| `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp` (और `Ssr` variants) | तीनों |
| `TuvixReactApp` | तीनों |
| `TuvixIsland` | ख़ुद कुछ नहीं; जिस module को यह होस्ट करता है, वह इन्हें dispatch करता है |
| `defineMicroApp` | तीनों; `ssr: true` के साथ, जब `mount` से पहले container में markup था, तब `hydrated` `true` होता है |
| सादे `{ mount, unmount }` objects | कुछ नहीं, जब तक आप `emitLifecycle` call न करें |
| orchestrator | कुछ नहीं; यह इसके बजाय event bus पर `tuvix:app:*` events emit करता है |

`defineMicroApp` आपके `mount` के resolve होने के बाद `tuvix:mounted`, आपके `unmount` के resolve होने के बाद `tuvix:unmounted`, और इनमें से किसी के throw करने पर `tuvix:error` dispatch करता है (फिर एरर को दोबारा throw करता है)। जिस container का `mount` अभी चल रहा है, उसके लिए आया `unmount` उसका इंतज़ार करता है:

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'clock',
  ssr: true, // the server rendered the time into the container
  mount({ container }) {
    container.textContent = new Date().toISOString();
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

सादे object के रूप में लिखा module events ख़ुद dispatch कर सकता है:

```ts
import { emitLifecycle, type MicroAppModule } from '@tuvix.js/loader';

export const clock: MicroAppModule = {
  mount({ container }) {
    container.textContent = new Date().toISOString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated: false });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
};
```

## Edge cases

- एक module कई containers में mount हो सकता है। जब तक उनमें से कोई भी mount है, `isMounted(name)` `true` रहता है, और `whenMounted(name)` उस सबसे पहले mount हुए container के साथ resolve होता है जो अभी भी mount है। जब आपको उन्हें अलग पहचानना हो, तो हर placement को अपना नाम दें।
- detached container का `tuvix:unmounted` event `document` listeners तक एक बार पहुँचता है। `target` के रूप में container वाला `onLifecycle` इसे नहीं देखता, क्योंकि event अब उस element से होकर नहीं गुज़रता।
- state `window.__TUVIX_RUNTIME__` पर रहता है, इसलिए `@tuvix.js/loader` की अलग-अलग bundle हुई कॉपियाँ उसे साझा करती हैं।
- सर्वर पर न DOM होता है न event। वहाँ `whenMounted` call न करें; यह कभी resolve नहीं होता।

## यह क्या नहीं करता

- यह लोडिंग की प्रगति रिपोर्ट नहीं करता। orchestrator का `onStatusChange` `bootstrapping`, `mounting` और बाकी statuses को कवर करता है।
- यह retry या recover नहीं करता। orchestrator का `fallback` इस्तेमाल करें, या `TuvixIsland` और `TuvixReactApp` पर `fallback`।

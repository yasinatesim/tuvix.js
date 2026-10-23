# Sandboxing

`@tuvix.js/sandbox` में दो tools हैं। `CssSandbox` ऐप को shadow root के अंदर रखता है, ताकि ऐप की CSS और पेज की CSS अलग रहें। `JsSandbox` code को proxy `window` पर चलाता है, ताकि उसकी global writes proxy पर जाएँ। आप जिन ऐप्स को `sandbox: true` के साथ register करते हैं, उन पर orchestrator `CssSandbox` लगाता है; `JsSandbox` वह कभी नहीं लगाता।

## हर ऐप के लिए CSS isolation

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'widget',
  entry: {
    scripts: ['https://cdn.example.com/widget/main.js'],
    styles: ['https://cdn.example.com/widget/main.css'],
    type: 'module',
  },
  container: '#widget',
  activeWhen: '/',
  sandbox: true, // same as { css: true }
});
```

इस ऐप के लिए orchestrator:

1. `#widget` पर एक open shadow root attach करता है (या पिछले mount वाला shadow root दोबारा इस्तेमाल करता है);
2. उसके अंदर `<div data-tuvix-sandbox-root>` बनाता है और वही element `mount` को `container` के रूप में देता है;
3. entry के `styles` को `document.head` में नहीं, shadow root के अंदर `<link>` tags के रूप में जोड़ता है, और `mount` call करने से पहले उनके load होने का `loader.timeout` तक इंतज़ार करता है।

अब पेज की CSS ऐप तक नहीं पहुँचती, और ऐप की CSS पेज तक नहीं पहुँचती। `color` और `font-family` जैसी inherited properties host element से फिर भी अंदर आती हैं; इन्हें रोकने के लिए ऐप की CSS में इन्हें `:host` पर set करें।

इसे तब इस्तेमाल करें जब कोई ऐप global selectors (`button { ... }`, CSS reset) ship करता हो, या पेज की CSS ऐप को बिगाड़ती हो।

### Edge cases

- फ्रेमवर्क runtime पर जो styles inject करता है, वे shadow root के बाहर `document.head` में जाते हैं। Vite का CSS injection, CSS-in-JS libraries और Angular के component styles, तीनों ऐसा करते हैं। एक CSS file ship करें और उसे `entry.styles` में लिखें, या CSS को खुद shadow root में जोड़ें।
- `document.body` में रेंडर होने वाले portals, modals और toasts shadow root से बाहर चले जाते हैं और ऐप के styles खो देते हैं।
- ऐप के अंदर से `document.querySelector` shadow root के elements नहीं खोज पाता। इसकी जगह `container` से query करें।
- Loader-function entries में कोई `styles` नहीं होते, इसलिए आपका bundler उनकी CSS `document.head` में inject करता है, जहाँ से shadow root उसे अंदर नहीं आने देता। Sandboxed ऐप्स को `{ scripts, styles, type }` entry के साथ register करें।

## CssSandbox को हाथ से इस्तेमाल करें

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const css = new CssSandbox();
const shadow = css.wrap(container); // moves existing children into the shadow root

const adopted = css.adoptStyles(shadow, {
  urls: ['/widget/main.css'],
  cssText: ':host { display: block; font-family: system-ui; }',
});
await adopted.ready; // resolves once each <link> fired load or error

const button = document.createElement('button');
button.textContent = 'Buy';
shadow.append(button);

// Later
adopted.remove();
css.unwrap(container);
```

| Method | असर |
| --- | --- |
| `wrap(container)` | एक open shadow root attach करता है, या पहले से मौजूद open shadow root दोबारा इस्तेमाल करता है, और container के children को उसमें ले जाता है। |
| `adoptStyles(shadow, { urls, cssText })` | Shadow root की शुरुआत में `<link>` और `<style>` elements जोड़ता है। जो URL वहाँ पहले से adopt हो चुका है, उसे छोड़ देता है। `{ elements, ready, remove }` लौटाता है। |
| `addStyle(shadow, css)` / `removeStyle(shadow, el)` | एक `<style>` जोड़ता या हटाता है। |
| `unwrap(container)` | Style के अलावा बाकी nodes को light DOM में वापस ले जाता है और एक `<slot>` छोड़ता है, ताकि वे रेंडर हों। `<style>` और stylesheet `<link>` nodes (`addStyle` और `adoptStyles` वाले भी) DOM से निकाल लेता है; उस container का अगला `wrap` उन्हें क्रम से वापस लगा देता है। |

जब element shadow root होस्ट नहीं कर सकता (जैसे `<input>`) या उस पर पहले से closed shadow root है, तो `wrap` throw करता है। `ready` कभी reject नहीं होता। jsdom links पर कभी `load` fire नहीं करता, इसलिए jsdom tests में `ready` को await न करें। Container unwrapped हो, तब `removeStyle` या `adopted.remove()` call करने पर वह stylesheet अगले `wrap` पर वापस नहीं आती।

## JsSandbox

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const js = new JsSandbox(['dataLayer'], /* strict */ true);

js.execScript('window.dataLayer = []'); // allowed, stored on the proxy
console.log('dataLayer' in window); // false, unless the page defined it

try {
  js.execScript('counter = 1'); // bare assignment to a global that is not allowed
} catch (error) {
  console.log(error instanceof TypeError); // true: strict mode blocked the write
}

const loose = new JsSandbox(); // not strict
loose.execScript('var version = 2; build = 7;');
console.log(Reflect.get(loose.proxyWindow, 'version'), 'version' in window); // 2 false

js.reset(); // forget every stored global
```

- Proxy के ज़रिए होने वाली writes और `Object.defineProperty` sandbox के एक store में जाते हैं। Reads पहले उस store में देखते हैं, फिर असली `window` में।
- `strict: true` के साथ, built-in allowlist और `allowedGlobals` के बाहर के किसी global को assign करना, top-level `var` से declare करना या उस पर `Object.defineProperty` चलाना `TypeError` throw करता है और कुछ भी store नहीं करता।
- `execScript(code)` `code` को `with (scope)` के अंदर चलाता है, जहाँ `window`, `self`, `globalThis` और `this` proxy से bound होते हैं। Bare assignments (`x = 1`), top-level `var x` और `window.x = 1`, तीनों proxy पर जाते हैं; `let` और `const` script के भीतर local रहते हैं।
- `execScript` के अंदर undeclared identifier पढ़ने पर `ReferenceError` throw होने के बजाय `undefined` मिलता है, और `"use strict"` directive का कोई असर नहीं होता, क्योंकि `with` को sloppy mode चाहिए। यह `new Function` इस्तेमाल करता है, इसलिए आपकी Content Security Policy में `unsafe-eval` होना चाहिए।
- `activate()` और `deactivate()` `active` flag set करते हैं। Proxy दोनों states में writes store करता है।

`JsSandbox` सिर्फ़ उस code को कवर करता है जो `proxyWindow` के ज़रिए globals तक पहुँचता है। `<script>` tag से load हुई script, bundled module, timers और event listeners, ये सब असली `window` इस्तेमाल करते हैं। इसे अपने चलाए snippets में गलती से होने वाली global writes के खिलाफ़ एक guard मानें, security boundary नहीं।

## Combined Sandbox

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });

const shadow = sandbox.activate(container); // ShadowRoot | null
if (shadow) sandbox.css.addStyle(shadow, '.box { padding: 8px; }');

sandbox.deactivate(container); // unwrap
sandbox.destroy(container); // deactivate + reset the JS store
```

`css` के `false` होने पर `activate` `null` लौटाता है; तब वह कुछ भी attach नहीं करता।

## माइक्रो ऐप के अंदर इस्तेमाल करें

```ts
import { defineMicroApp } from '@tuvix.js/core';
import { CssSandbox } from '@tuvix.js/sandbox';

const css = new CssSandbox();

export default defineMicroApp({
  name: 'widget',
  mount({ container }) {
    const shadow = css.wrap(container);
    css.addStyle(shadow, 'p { color: rebeccapurple; }');
    const text = document.createElement('p');
    text.textContent = 'Isolated';
    shadow.append(text);
  },
  unmount({ container }) {
    container.shadowRoot?.replaceChildren();
    css.unwrap(container);
  },
});
```

जब orchestrator ऐप को mount करता है, तो `register` पर `sandbox: true` को प्राथमिकता दें; यह यही काम करता है और remounts के बीच shadow root दोबारा इस्तेमाल करता है।

## Sandbox कब न करें

- ऐप `document.body` में portals इस्तेमाल करता है और उसे वहाँ अपने styles चाहिए।
- ऐप को पेज के design system से style होना चाहिए।
- आपको असली JavaScript isolation चाहिए। `<iframe>` इस्तेमाल करें।

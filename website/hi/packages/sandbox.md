---
title: '@tuvix.js/sandbox'
---

<PackageHeader
  name="@tuvix.js/sandbox"
  title="Sandbox"
  description="दोबारा इस्तेमाल होने वाले Shadow DOM root में CSS isolation, उस root में stylesheets को अपनाना, और एक Proxy window जो script globals को असली window से दूर रखती है।"
  icon="🔒"
  npm="true"
/>

## इंस्टॉलेशन {#installation}

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## इसे कब इस्तेमाल करें {#when-to-use-it}

`CssSandbox` का उपयोग तब करें जब माइक्रो ऐप की CSS और पेज की CSS एक-दूसरे को प्रभावित न करें। यह ऐप के DOM को container पर बने एक open shadow root में ले जाता है, ताकि ऐप के selectors अंदर रहें और पेज के selectors बाहर। जब आप `sandbox: true` के साथ कोई ऐप register करते हैं, तो `@tuvix.js/core` का orchestrator यह काम आपके लिए करता है। जब आप orchestrator के बिना ऐप्स mount करते हैं, तब इस पैकेज को खुद कॉल करें।

`JsSandbox` का उपयोग तब करें जब आप third-party script text चलाते हैं और चाहते हैं कि उसके global writes असली `window` से दूर रहें। आप कोड को `execScript` के ज़रिए चलाते हैं, जो `window`, `this` और free identifiers को एक Proxy के ज़रिए resolve करता है। orchestrator इसे लागू नहीं करता।

जब आपको untrusted कोड के लिए पक्का isolation चाहिए, तो कुछ और चुनें। `sandbox` attribute वाला `<iframe>` कोड को उसका अपना global object और origin देता है; यह पैकेज ऐसा नहीं करता।

## क्विक स्टार्ट {#quick-start}

orchestrator के ज़रिए (सिर्फ़ CSS):

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'cart',
  entry: { scripts: ['/apps/cart/main.js'], styles: ['/apps/cart/style.css'] },
  container: '#cart',
  activeWhen: '/cart/*',
  sandbox: true,
});

await orchestrator.start();
```

orchestrator `#cart` को एक shadow root में लपेटता है, ऐप को उसके अंदर एक `<div data-tuvix-sandbox-root="cart">` में रेंडर करता है, और `style.css` को `<head>` के बजाय shadow root में लोड करता है। Mount इन stylesheets का इंतज़ार loader `timeout` (default रूप से 10000 ms) तक करता है। ऐप दोबारा mount होने पर orchestrator उसी shadow root का फिर से उपयोग करता है।

हाथ से:

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container);
const target = shadowRoot ?? container;

const adopted = sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });
await adopted.ready;
target.append(Object.assign(document.createElement('p'), { textContent: 'Cart' }));

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox`

```ts
import type { ISandbox, SandboxOptions } from '@tuvix.js/sandbox';

declare function createSandbox(options?: SandboxOptions): ISandbox;
```

`new Sandbox(options)` लौटाता है।

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` container को shadow root में लपेटता है। `false` होने पर `activate` `null` लौटाता है और कुछ attach नहीं करता। |
| `js` | `boolean` | `true` | `activate`/`deactivate` `sandbox.js.active` को बदलते हैं। `sandbox.js.proxyWindow` वाली proxy दोनों स्थितियों में writes को असली `window` से दूर रखती है। |
| `allowedGlobals` | `string[]` | `[]` | अतिरिक्त global नाम जिन्हें strict mode sandboxed कोड को assign करने देता है। इन पर writes फिर भी proxy पर ही जाते हैं। |
| `strict` | `boolean` | `false` | जब sandboxed कोड built-in allowlist और `allowedGlobals` के बाहर कोई global assign या define करता है, तो `TypeError` throw करता है। |

### `Sandbox`

```ts
import { Sandbox } from '@tuvix.js/sandbox';

const sandbox = new Sandbox({ css: false, js: true });
console.log(sandbox.activate(document.body)); // null
```

`createSandbox` के पीछे की class। यह `ISandbox` implement करती है:

| Member | Signature | व्यवहार |
| --- | --- | --- |
| `css` | `readonly ICssSandbox` | वह `CssSandbox` instance जिसका यह उपयोग करती है। |
| `js` | `readonly IJsSandbox` | वह `JsSandbox` instance जिसका यह उपयोग करती है। |
| `activate` | `(container: HTMLElement) => ShadowRoot \| null` | `css` चालू होने पर `css.wrap(container)`, फिर `js` चालू होने पर `js.activate()`। shadow root या `null` लौटाता है। |
| `deactivate` | `(container: HTMLElement) => void` | `js.deactivate()`, फिर `css.unwrap(container)`। |
| `destroy` | `(container: HTMLElement) => void` | `deactivate(container)`, फिर `js.reset()`, जो हर stored global साफ़ करता है। |

### `CssSandbox`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const container = document.querySelector<HTMLElement>('#widget')!;

const shadowRoot = cssSandbox.wrap(container);
const style = cssSandbox.addStyle(shadowRoot, ':host { display: block; } p { color: teal; }');
cssSandbox.unwrap(container); // the <style> leaves the DOM and waits for the next wrap
cssSandbox.removeStyle(shadowRoot, style); // removed for good: the next wrap does not restore it
```

| Method | Signature | व्यवहार |
| --- | --- | --- |
| `wrap` | `(container: HTMLElement) => ShadowRoot` | container के children को एक open shadow root में ले जाता है और उसे लौटाता है। |
| `unwrap` | `(container: HTMLElement) => void` | children को वापस light DOM में ले जाता है, shadow root की stylesheets को अलग रख देता है और shadow root में एक `<slot>` छोड़ता है। |
| `addStyle` | `(shadowRoot: ShadowRoot, css: string) => HTMLStyleElement` | `css` वाला एक `<style>` shadow root के अंत में जोड़ता है। |
| `removeStyle` | `(shadowRoot: ShadowRoot, styleEl: HTMLStyleElement) => void` | `styleEl` को हटाता है। जब host unwrapped होता है, तो यह `styleEl` को अलग रखी गई सूची से भी हटाता है, ताकि अगला `wrap` उसे वापस न लाए। |
| `adoptStyles` | `(shadowRoot: ShadowRoot, styles: AdoptStylesOptions) => AdoptedStyles` | `<link>` और `<style>` elements को shadow root की शुरुआत में डालता है। |

#### `wrap` और remounts {#wrap-and-remounts}

एक बार attach होने के बाद DOM element अपना shadow root नहीं खो सकता। `wrap` इसे ऐसे संभालता है:

1. अगर इस `CssSandbox` instance ने container को पहले ही wrap किया है और unwrap नहीं किया, तो `wrap` वही shadow root लौटाता है और कुछ नहीं हिलाता।
2. अगर container के पास एक open `shadowRoot` है (किसी पिछले `wrap`, किसी `unwrap`, या किसी दूसरे `CssSandbox` instance से), तो `wrap` वह `<slot>` हटाता है जो `unwrap` ने छोड़ा था, `unwrap` की अलग रखी stylesheets को वापस लगाता है (शुरुआत में, उनके मूल क्रम में) और उसी root का फिर से उपयोग करता है।
3. वरना यह `container.attachShadow({ mode: 'open' })` कॉल करता है।

इसके बाद यह हर light DOM child को shadow root में ले जाता है। `wrap` सिर्फ़ तब throw करता है जब `attachShadow` असफल हो, उदाहरण के लिए ऐसे element पर जो shadow root host नहीं कर सकता (`<img>`, `<input>`) या जिसके पास पहले से closed root है: `[Tuvix Sandbox] Cannot attach Shadow DOM to <img>: ...`।

#### `unwrap` और slot {#unwrap-and-the-slot}

`unwrap` shadow root के children को वापस container में ले जाता है। यह `<style>` और `<link rel="stylesheet">` nodes को DOM से निकाल लेता है, चाहे वे `addStyle`, `adoptStyles` या ऐप से आए हों, ताकि ऐप की CSS लागू होना बंद हो जाए और पेज तक कभी न पहुँचे। यह उन्हें shadow root के साथ रखता है। shadow root बना रहता है और उसमें एक `<slot data-tuvix-sandbox-slot>` रहता है, ताकि ब्राउज़र वापस लाए गए children को उसके ज़रिए रेंडर करे। जिस container को इस instance ने wrap नहीं किया, उसके लिए `unwrap` कुछ नहीं करता।

उस host का अगला `wrap`, चाहे इस instance से हो या किसी दूसरे `CssSandbox` instance से, slot हटाता है, अलग रखी stylesheets को क्रम से वापस लगाता है और children को फिर अंदर ले जाता है। remount के बाद आपको styles फिर से adopt नहीं करनी पड़तीं। host के unwrapped रहते `removeStyle(shadowRoot, el)` या `adopted.remove()` कॉल करने से वे sheets हमेशा के लिए हट जाती हैं।

#### `adoptStyles`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const shadowRoot = cssSandbox.wrap(document.querySelector<HTMLElement>('#cart')!);

const adopted = cssSandbox.adoptStyles(shadowRoot, {
  urls: ['/apps/cart/style.css', '/shared/tokens.css'],
  cssText: ':host { display: block; }',
});

await adopted.ready; // every <link> fired load or error
console.log(adopted.elements.length); // 3

adopted.remove();
```

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `urls` | `readonly string[]` | `[]` | हर URL क्रम से एक `<link rel="stylesheet" data-tuvix-style>` बनता है। |
| `cssText` | `string \| readonly string[]` | कोई नहीं | हर string एक `<style data-tuvix-style>` बनती है, जो links के बाद रखी जाती है। |

व्यवहार:

- elements shadow root की शुरुआत में, पहले adopt की गई styles के बाद जाते हैं, ताकि ऐप का content और `addStyle` styles cascade में बाद में आएँ।
- जो URL इस shadow root में पहले से adopt हो चुका है, उसे छोड़ दिया जाता है और वह `elements` में नहीं दिखता। इसमें `unwrap` के अलग रखे links भी शामिल हैं। अगर पहले की किसी कॉल ने वह link बनाया था, तो `ready` फिर भी उस मौजूदा link का इंतज़ार करता है।
- `ready` तब resolve होता है जब हर link `load` या `error` fire कर दे। यह कभी reject नहीं होता, इसलिए 404 वाली stylesheet आपको नहीं रोकती। jsdom इनमें से कोई event fire नहीं करता, इसलिए jsdom tests में `ready` को await न करें।
- `remove()` सिर्फ़ वे elements हटाता है जिन्हें इस कॉल ने डाला था, अलग रखे गए elements सहित, ताकि अगला `wrap` उन्हें वापस न लाए।

### `JsSandbox`

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const jsSandbox = new JsSandbox(['analyticsQueue'], true);
jsSandbox.activate();

jsSandbox.execScript('window.analyticsQueue = []'); // allowed, stored on the proxy
console.log('analyticsQueue' in window); // false
console.log(Reflect.get(jsSandbox.proxyWindow, 'analyticsQueue')); // []

try {
  jsSandbox.execScript('window.tracker = {}');
} catch (error) {
  console.log(error instanceof TypeError); // true
}

jsSandbox.reset();
```

Constructor: `new JsSandbox(allowedGlobals: string[] = [], strict = false)`।

| Member | Signature | व्यवहार |
| --- | --- | --- |
| `proxyWindow` | `readonly WindowProxy` | असली `window` के ऊपर बनी Proxy। |
| `active` | `readonly boolean` | Flag जिसे `activate` सेट करता है और `deactivate`/`reset` साफ़ करते हैं। |
| `activate` | `() => void` | `active` को `true` करता है। |
| `deactivate` | `() => void` | `active` को `false` करता है। stored globals बने रहते हैं। |
| `execScript` | `(code: string) => unknown` | `code` को `new Function` के ज़रिए `with (scope)` के अंदर sloppy-mode script के रूप में चलाता है। `window`, `self`, `globalThis` और top-level `this` proxy होते हैं, और free identifiers इसी के ज़रिए resolve होते हैं। `eval("...")` उसी scope के अंदर direct eval बना रहता है। कोड जो लौटाता है, वही लौटाता है। |
| `reset` | `() => void` | हर stored global साफ़ करता है और `active` को `false` करता है। |

Proxy:

- Reads पहले sandbox का अपना store जाँचते हैं, फिर असली `window` तक जाते हैं। असली window के जिन functions में `prototype` नहीं होता (`fetch`, `setTimeout`), वे असली `window` से bound होकर लौटते हैं, हर function के लिए एक बार, इसलिए `proxyWindow.fetch === proxyWindow.fetch`।
- `proxyWindow.window`, `.self`, `.globalThis`, और जब पेज किसी iframe में नहीं होता तब `.top`/`.parent`/`.frames`, खुद proxy लौटाते हैं। iframe में `top` और `parent` असली ही रहते हैं।
- Assignments और `Object.defineProperty` value को proxy पर store करते हैं। असली `window` कभी नहीं बदलता। `value` के बिना descriptor (`{ enumerable: false }`) stored value को बनाए रखता है। Accessor descriptors (`get`/`set`) और `configurable: false` होने पर `Object.defineProperty` `TypeError` throw करता है।
- `delete proxyWindow.x` stored value हटाता है। असली window की property के लिए यह `false` लौटाता है, जो strict-mode कोड में `TypeError` throw करता है।
- `in` store और असली `window` दोनों जाँचता है।

Strict mode (`strict: true`): built-in allowlist और `allowedGlobals` के बाहर के किसी नाम के लिए assignment (`window.x = 1` या सीधा `x = 1`), top-level `var x = 1` या `Object.defineProperty` कॉल `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "tracker". Add it to allowedGlobals to permit it.` throw करता है और कुछ store नहीं करता। यह जाँच sandbox के active होने या न होने, दोनों स्थितियों में चलती है। Symbol keys हमेशा blocked मानी जाती हैं। built-in allowlist में `console`, timers, `Promise`, `Map`, `JSON`, `fetch`, `URL`, `navigator`, `document`, `location` और `history` जैसे standard globals शामिल हैं। अनुमति वाले writes, इन नामों पर writes सहित, proxy पर ही रहते हैं।

### Types {#types}

| Type | अर्थ |
| --- | --- |
| `SandboxOptions` | `{ css?, js?, allowedGlobals?, strict? }`, `createSandbox` के विकल्प। |
| `ISandbox` | वह interface जिसे `Sandbox` implement करती है: `css`, `js`, `activate`, `deactivate`, `destroy`। |
| `ICssSandbox` | वह interface जिसे `CssSandbox` implement करता है। |
| `IJsSandbox` | वह interface जिसे `JsSandbox` implement करता है। |
| `AdoptStylesOptions` | `adoptStyles` के लिए `{ urls?, cssText? }`। |
| `AdoptedStyles` | `adoptStyles` से लौटाया गया `{ elements, ready, remove }`। |

## Edge cases {#edge-cases}

- `execScript` के अंदर `x = 1`, top-level `var x = 1`, `window.x = 1`, `window.window.x = 1`, `top.x = 1` और `eval("...")` के अंदर यही statements, सभी `x` को proxy पर store करते हैं, असली `window` पर कभी नहीं। `let` और `const` script के लिए local रहते हैं।
- `execScript` के अंदर undeclared identifier पढ़ने पर `ReferenceError` throw होने के बजाय `undefined` मिलता है, और `code` में `"use strict"` directive का कोई असर नहीं होता, क्योंकि `with` को sloppy mode चाहिए।
- `f()` जैसी सामान्य function call के अंदर `this` असली global object होता है, जैसा sloppy-mode JavaScript तय करता है। ऐसे function में `this.x = 1` असली `window` पर लिखता है। `execScript` से चलाए जाने वाले कोड में `window.x = 1` लिखें।
- `execScript` `new Function` का उपयोग करता है, इसलिए `'unsafe-eval'` के बिना Content Security Policy इसे block करती है।
- `JsSandbox`, `Sandbox` या `createSandbox()` बनाते समय `window` पढ़ा जाता है, इसलिए सर्वर पर ये `ReferenceError` throw करते हैं। `CssSandbox` को `document` सिर्फ़ तब चाहिए जब आप इसके methods कॉल करते हैं।
- दो `CssSandbox` instances एक host साझा कर सकते हैं। दूसरा `wrap` पहले instance के shadow root का फिर से उपयोग करता है।
- container के wrapped रहते आप जो light DOM children जोड़ते हैं, वे shadow root के बाहर रहते हैं और किसी slot के ज़रिए रेंडर नहीं होते, इसलिए दिखते नहीं। इसके बजाय shadow root में append करें।
- `Sandbox({ css: false }).activate()` `null` लौटाता है। container में रेंडर करें।

## यह क्या नहीं करता {#what-it-does-not-do}

- यह timers, event listeners, `document` या `<script>` tags को patch नहीं करता। जो कोड `proxyWindow` से नहीं गुज़रता, वह असली पेज को प्रभावित करता है।
- यह किसी ऐप के पीछे छोड़े गए intervals या listeners साफ़ नहीं करता। इन्हें ऐप के `unmount` में साफ़ करें।
- यह कोड को अलग origin या global object नहीं देता। untrusted कोड के लिए `<iframe sandbox>` इस्तेमाल करें।
- यह shadow root को detach नहीं करता। DOM में इसके लिए कोई API नहीं है; `unwrap` इसके बजाय एक slot छोड़ता है।
- यह inheritance नहीं रोकता। host या उसके ancestors पर सेट किए गए `color`, `font-family` और CSS custom properties फिर भी shadow root में पहुँचते हैं।

## 0.4 से माइग्रेशन {#migrating-from-0-4}

- `Sandbox({ css: false }).activate(container)` `null` लौटाता है और कोई shadow root attach नहीं करता। 0.4 में यह एक shadow root attach करता था और container के children को छिपा देता था। `ISandbox.activate` अब `ShadowRoot | null` लौटाता है:

  ```ts
  import { createSandbox } from '@tuvix.js/sandbox';

  const container = document.querySelector<HTMLElement>('#app')!;
  const sandbox = createSandbox({ css: false });

  // 0.4: const root: ShadowRoot = sandbox.activate(container);
  const root = sandbox.activate(container) ?? container;
  ```

- `strict: true` blocked write पर `TypeError` throw करता है। 0.4 में यह एक warning log करता था और value store कर देता था। आपकी scripts जो नाम सेट करती हैं, उन्हें `allowedGlobals` में जोड़ें।
- `execScript` कोड को `with` block के अंदर चलाता है। कोड strict-mode कोड नहीं हो सकता, undeclared identifier पढ़ने पर throw होने के बजाय `undefined` मिलता है, और सीधा `x = 1` अब असली `window` के बजाय proxy पर जाता है।
- `unwrap` shadow root की stylesheets को रखता है और अगला `wrap` उन्हें वापस लाता है। 0.4 में `unwrap` उन्हें delete कर देता था। remount के बाद `cssText` या `addStyle` styles दोबारा जोड़ने वाला कोड हटाएँ, नहीं तो duplicates बनेंगे।
- 0.4 के docs में लिखा था कि `js: true` `addEventListener`, timers और `document.createElement` को intercept करता है। यह कभी ऐसा नहीं करता था, और 0.5 भी नहीं करता।

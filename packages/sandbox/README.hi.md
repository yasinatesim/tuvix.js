# @tuvix.js/sandbox

> Shadow DOM CSS isolation जो remounts के बाद भी बना रहता है, stylesheet adoption, और script globals के लिए एक Proxy window

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा। पूरे docs: [tuvix.js.org/hi/packages/sandbox](https://tuvix.js.org/hi/packages/sandbox)।

`CssSandbox` किसी माइक्रो ऐप के DOM को एक open shadow root में ले जाता है, ताकि उसकी CSS और पेज की CSS अलग रहें। जब आप किसी ऐप को `sandbox: true` के साथ register करते हैं, तो `@tuvix.js/core` का orchestrator इसका इस्तेमाल करता है। `JsSandbox` आपके द्वारा इसके ज़रिए चलाए गए code के `window.x = ...` writes को असली `window` से दूर रखता है। यह एक Proxy है, security boundary नहीं; untrusted code के लिए `<iframe sandbox>` का इस्तेमाल करें।

## इंस्टॉलेशन

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## क्विक स्टार्ट

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container); // ShadowRoot, or null with css: false
sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox(options?)` और `Sandbox`

`createSandbox(options)` `ISandbox` type के रूप में `new Sandbox(options)` लौटाता है।

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` container को एक shadow root में wrap करता है। `false`: `activate` `null` लौटाता है, कुछ attach नहीं करता। |
| `js` | `boolean` | `true` | `activate`/`deactivate` `js.active` को toggle करते हैं। दोनों हालात में proxy writes को `window` से दूर रखता है। |
| `allowedGlobals` | `string[]` | `[]` | वे नाम जिन्हें strict mode में sandboxed code assign कर सकता है (फिर भी proxy पर ही store होते हैं)। |
| `strict` | `boolean` | `false` | allowlist और `allowedGlobals` से बाहर के globals पर writes या `defineProperty` होने पर `TypeError` throw करता है। |

Members: `css` (`CssSandbox`), `js` (`JsSandbox`), `activate(container): ShadowRoot | null`, `deactivate(container)`, `destroy(container)` (पहले deactivate, फिर stored globals साफ़)।

### `CssSandbox`

| Method | व्यवहार |
| --- | --- |
| `wrap(container)` | children को एक open shadow root में ले जाता है। अगर `container.shadowRoot` पहले से मौजूद है (पिछला `wrap`, `unwrap`, कोई दूसरा instance), तो उसी का दोबारा इस्तेमाल करता है, `unwrap` का छोड़ा हुआ slot हटाता है और अलग रखी गई stylesheets को क्रम से वापस लगाता है। सिर्फ़ तब throw करता है जब `attachShadow` fail हो। |
| `unwrap(container)` | children को वापस light DOM में ले जाता है, `<style>` और `<link rel="stylesheet">` (`addStyle`, `adoptStyles` या ऐप से आए) को DOM से निकालकर अगले `wrap` के लिए रखता है, और एक `<slot>` छोड़ता है ताकि children रेंडर हों। जिन containers को इस instance ने wrap नहीं किया, उन पर कुछ नहीं करता। |
| `addStyle(shadowRoot, css)` | एक `<style>` append करता है और उसे लौटाता है। |
| `removeStyle(shadowRoot, styleEl)` | `styleEl` को हटाता है। unwrapped हालत में, अगला `wrap` उसे वापस नहीं लाता। |
| `adoptStyles(shadowRoot, { urls?, cssText? })` | shadow root की शुरुआत में, पहले adopt की गई styles के बाद, पहले `<link>`s फिर `<style>`s डालता है। पहले से adopt किए गए URLs को छोड़ देता है, अलग रखे गए links समेत। `{ elements, ready, remove }` लौटाता है। |

`ready` तब resolve होता है जब हर link `load` या `error` fire कर दे, और यह कभी reject नहीं होता। jsdom इनमें से कोई event fire नहीं करता, इसलिए jsdom tests में इसे await न करें। `remove()` सिर्फ़ उसी call के elements हटाता है; unwrapped हालत में वे अगले `wrap` पर वापस नहीं आते।

### `JsSandbox`

`new JsSandbox(allowedGlobals = [], strict = false)`।

| Member | व्यवहार |
| --- | --- |
| `proxyWindow` | `window` पर Proxy। reads पहले sandbox store देखते हैं, फिर असली `window` (functions एक बार bind होते हैं)। `window`, `self`, `globalThis`, और iframe के बाहर `top`/`parent`/`frames` proxy लौटाते हैं। writes और `Object.defineProperty` store में जाते हैं; `value` के बिना descriptor stored value को बनाए रखता है। accessor और non-configurable descriptors `TypeError` throw करते हैं। |
| `execScript(code)` | `code` को `with (scope)` के अंदर sloppy-mode script के रूप में चलाता है। `window`, `self`, `globalThis` और top-level `this` proxy होते हैं, और free identifiers उसी के ज़रिए resolve होते हैं। `eval("...")` उसी scope के अंदर direct eval बना रहता है। |
| `activate()`, `deactivate()`, `active` | एक flag। यह proxy के व्यवहार को नहीं बदलता। |
| `reset()` | stored globals साफ़ करता है, `active` को `false` कर देता है। |

allowlist से बाहर के नाम पर assignment, top-level `var x = 1` या `defineProperty` होने पर strict mode `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "x". Add it to allowedGlobals to permit it.` throw करता है और कुछ store नहीं करता, चाहे sandbox active हो या नहीं।

### Types

`SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles`।

## Edge cases

- `execScript` में `x = 1`, `var x = 1`, `window.x = 1`, `window.window.x = 1`, `top.x = 1` और `eval("...")` के अंदर यही statements `x` को proxy पर store करते हैं, असली `window` पर कभी नहीं। `let`/`const` local रहते हैं।
- `execScript` में undeclared identifier पढ़ने पर throw होने के बजाय `undefined` मिलता है, और `code` में `"use strict"` का कोई असर नहीं होता।
- `f()` जैसी सामान्य function call के अंदर `this` असली global object होता है, जैसा sloppy-mode JavaScript तय करता है। वहाँ `this.x = 1` असली `window` पर लिखता है; इसकी जगह `window.x = 1` लिखें।
- `execScript` `new Function` का इस्तेमाल करता है; आपकी CSP में `'unsafe-eval'` होना चाहिए।
- `JsSandbox`, `Sandbox` और `createSandbox()` constructor में `window` पढ़ते हैं और सर्वर पर throw करते हैं।
- container wrapped रहते समय जोड़े गए light DOM children रेंडर नहीं होते। shadow root में append करें।

## यह क्या नहीं करता

- यह timers, event listeners, `document` या `<script>` tags को patch नहीं करता, और कोई ऐप जो कुछ पीछे छोड़ता है उसे साफ़ नहीं करता।
- यह code को अपना origin या global object नहीं देता।
- यह inherited styles (`color`, fonts, custom properties) को shadow root तक पहुँचने से नहीं रोकता।

## 0.4 से माइग्रेशन

- `Sandbox({ css: false }).activate()` `null` लौटाता है और कोई shadow root attach नहीं करता। `ISandbox.activate` `ShadowRoot | null` लौटाता है।
- `strict: true` blocked writes पर चेतावनी देने के बजाय throw करता है।
- `execScript` code को `with` block में चलाता है: strict-mode code नहीं चलता, undeclared reads `undefined` लौटाते हैं, और bare `x = 1` proxy पर ही रहता है।
- `unwrap` stylesheets को delete करने के बजाय अगले `wrap` के लिए रखता है।

## License

MIT

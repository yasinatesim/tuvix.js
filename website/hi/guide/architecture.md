# आर्किटेक्चर

Tuvix.js छोटे पैकेजों में बँटा है। `@tuvix.js/core` का orchestrator उन्हें आपस में जोड़ता है; बाकी हर पैकेज अकेले भी काम करता है।

## पैकेज और उनके काम

```text
@tuvix.js/core          createOrchestrator, defineMicroApp: registry, reconcile, props
@tuvix.js/router        createRouter, matchPath, interceptLinks
@tuvix.js/loader        ModuleLoader, registerModule, lifecycle runtime
@tuvix.js/event-bus     createEventBus, getGlobalBus
@tuvix.js/sandbox       CssSandbox (shadow DOM), JsSandbox (proxy window)
@tuvix.js/react         createReactMicroApp, TuvixReactApp, TuvixIsland
@tuvix.js/vue           createVueMicroApp, renderVueToString (/server)
@tuvix.js/svelte        createSvelteMicroApp, renderSvelteToString (/server)
@tuvix.js/angular       createAngularMicroApp, renderAngularToString (/server)
@tuvix.js/vite          Vite plugin: island CSS links for the server-rendered <head>
@tuvix.js/server        Server-side composition of HTML fragments
@tuvix.js/module-federation  Entries backed by webpack remotes
@tuvix.js/devtools      In-page debug panel
tuvix.js                Umbrella: core, router, loader, event bus, sandbox
create-tuvix-app        Project scaffolding
```

## navigation से mount तक

```text
URL changes (router.push, popstate, connectRouter callback, or reconcile(path))
  │
  ▼
orchestrator queues a reconcile for the path
  │  (only the newest queued path runs next)
  ▼
for each app: should it be mounted?  activeWhen string → matchPath
  │                                   activeWhen function → your code
  │                                   no activeWhen → router routes naming it
  ▼
phase 1: unmount every app that turned inactive
phase 2: mount every app that turned active
  │
  ▼
loader.load(name, entry)   function entry → await it
  │                        URL entry → <script>/<link> tags, then registry lookup
  ▼
module.bootstrap()  (first load only)
module.mount({ container, props, name, bus })
```

Phase 1 के पूरा होने के बाद ही phase 2 शुरू होता है, इसलिए `#app` साझा करने वाले दो ऐप्स कभी एक साथ उसमें नहीं रहते। अगर reconcile चलते समय नया path आता है, तो orchestrator मौजूदा step पूरा करता है और फिर सबसे नए path को reconcile करता है। A → B → A पर जल्दी-जल्दी navigate करने के बाद केवल A mount रहता है।

## Module contract

हर माइक्रो ऐप, चाहे हाथ से लिखा हो या adapter ने बनाया हो, इसी shape का होता है (`@tuvix.js/loader` से `MicroAppModule`):

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  async bootstrap() {
    // once, before the first mount
  },
  async mount({ container, props, name, bus }) {
    container.textContent = `${name ?? ''}: ${JSON.stringify(props ?? {})}`;
    bus?.emit('app:ready', { name });
  },
  async update({ props, container }) {
    if (container) container.textContent = JSON.stringify(props);
  },
  async unmount({ container }) {
    container.replaceChildren();
  },
};
```

- `bootstrap` हर लोड हुए module के लिए एक बार चलता है।
- `mount` को container, मौजूदा props, ऐप का नाम और orchestrator का event bus मिलता है।
- जब shell `updateAppProps` call करता है, तब `update` को merge हुए props मिलते हैं। कई जगह mount हुए module को `container` बताता है कि किस mount को update करना है।
- `unmount` को वह सब हटाना होगा जो `mount` ने बनाया।

## loader module कैसे ढूँढता है

1. **Loader function entry** (`() => import('./app')`): loader resolve हुए module का इस्तेमाल करता है, वह न हो तो उसके `default` export का, और वह भी न हो तो ऐप के नाम से register हुए module का।
2. **URL entry**: loader `<script>` और `<link>` tags जोड़ता है, उनका इंतज़ार करता है, और उस registry से module पढ़ता है जिसे `registerModule(name, module)` भरता है। adapters और `defineMicroApp` आपके लिए `registerModule` call करते हैं।
3. **UMD fallback**: अगर कुछ भी register नहीं हुआ, तो loader एक नया `window` global चुनता है जिसमें `mount` function हो। जब कई globals आए हों, तो वह वही चुनता है जिसका नाम ऐप के नाम से match करता है, वरना विफल होता है।

registry और lifecycle state `window.__TUVIX_RUNTIME__` पर रहते हैं, इसलिए अलग-अलग bundle हुए माइक्रो ऐप्स, जिनमें हर एक के पास `@tuvix.js/loader` की अपनी कॉपी है, फिर भी एक ही registry देखते हैं।

जब entry `type: 'module'` सेट करती है या URL `.mjs`, `.mts`, `.ts`, `.tsx` या `.jsx` पर खत्म होता है, तब scripts `type="module"` के रूप में लोड होती हैं। बाकी URLs classic scripts के रूप में लोड होते हैं।

## साझा runtime state

| State | कहाँ रहता है | क्यों |
| --- | --- | --- |
| Module registry | `window.__TUVIX_RUNTIME__` (साथ में `window.__TUVIX_MODULES__`) | loader किसी भी bundle से ऐप्स ढूँढ लेता है |
| Mount हुए ऐप्स और waiters | `window.__TUVIX_RUNTIME__` | `whenMounted` अलग-अलग bundles में काम करता है |
| Global event bus | `window.__TUVIX_GLOBAL_BUS__` | `getGlobalBus()` हर पेज पर एक bus लौटाता है |

सर्वर पर, `window` के बिना, इनमें से हर एक module-scoped होता है।

## Isolation model

- **CSS**: `register` पर `sandbox: true` ऐप को shadow root के अंदर रेंडर करता है और उसकी entry `styles` वहीं लोड करता है। देखें [Sandboxing](/hi/guide/sandbox)।
- **JavaScript**: डिफ़ॉल्ट रूप से कोई isolation नहीं। सभी ऐप्स `window`, `document` और globals साझा करते हैं। `JsSandbox` केवल उस कोड को अलग करता है जिसे आप उसके proxy से चलाते हैं।

## आगे कहाँ देखें

- [Lifecycle Hooks](/hi/guide/lifecycle): contract का विस्तृत विवरण।
- [Lifecycle Events](/hi/guide/lifecycle-events): पता करें कि ऐप पेज पर कब आया।
- [रूटिंग](/hi/guide/routing): pattern के नियम।

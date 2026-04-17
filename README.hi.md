<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  स्केलेबल और स्वतंत्र रूप से डिप्लॉय करने योग्य फ्रंटएंड एप्लिकेशन बनाने के लिए एक हल्का और लचीला <strong>माइक्रोफ्रंटएंड फ्रेमवर्क</strong>।<br/>
  Tuvix.js कई फ्रंटएंड एप्लिकेशन को एक सहज, एकीकृत उपयोगकर्ता अनुभव में जोड़ता है - ठीक वैसे ही जैसे इसका नाम बताता है।
</p>

<p align="center">
  <a href="./README.md">🇬🇧 English</a> ·
  <a href="./README.tr.md">🇹🇷 Türkçe</a> ·
  <a href="./README.es.md">🇪🇸 Español</a> ·
  <a href="./README.de.md">🇩🇪 Deutsch</a> ·
  <a href="./README.fr.md">🇫🇷 Français</a> ·
  <a href="./README.ja.md">🇯🇵 日本語</a> ·
  <a href="./README.zh.md">🇨🇳 中文</a> ·
  <a href="./README.it.md">🇮🇹 Italiano</a> ·
  <a href="./README.pt.md">🇧🇷 Português</a> ·
  <a href="./README.hi.md">🇮🇳 हिंदी</a>
</p>

---

## ✨ विशेषताएं

- 🧩 **फ्रेमवर्क अज्ञेय** - React, Vue, Svelte, Angular या Vanilla JS का उपयोग करें
- 📦 **Deployment स्वतंत्र** - प्रत्येक माइक्रो ऐप को अलग से डिप्लॉय करें
- 🔗 **डायनेमिक मॉड्यूल लोडिंग** - माइक्रोफ्रंटएंड को ऑन डिमांड लोड करें
- 🛣️ **बिल्ट-इन राउटिंग** - माइक्रो ऐप्स के बीच सहज राउटिंग
- 📡 **इंटर-ऐप कम्युनिकेशन** - क्रॉस-ऐप मैसेजिंग के लिए इवेंट बस
- ⚡ **Lightweight** - शून्य रनटाइम डिपेंडेंसी, न्यूनतम कोर
- 🔄 **Lifecycle मैनेजमेंट** - Mount, unmount, update हुक्स
- 🔒 **Type-Safe** - स्ट्रिक्ट टाइप्स के साथ पूर्ण TypeScript सपोर्ट

---

## 🤖 AI कंपोनेंट जेनरेटर

हमारे अंतर्निहित AI चैटबॉट का उपयोग करके प्राकृतिक भाषा से tuvix.js कंपोनेंट जनरेट करें।

- **चैट मॉडल:** OpenRouter के माध्यम से MiniMax M2.5 (मुफ़्त API, सेल्फ-होस्टिंग की ज़रूरत नहीं)
- **एम्बेडिंग मॉडल:** OpenRouter के माध्यम से NVIDIA Nemotron Embed 1B (RAG रिट्रीवल)
- **सपोर्ट करता है:** React, Vue, Svelte, Angular
- **Dataset:** HuggingFace पर [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset)

---

## 📦 इंस्टॉलेशन

```bash
# ऑल-इन-वन पैकेज
npm install tuvix.js

# या अलग-अलग पैकेज इंस्टॉल करें
npm install @tuvix.js/core @tuvix.js/router
```

---

## 🚀 त्वरित शुरुआत

### होस्ट (शेल) एप्लिकेशन

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main-content',
  activeWhen: '/dashboard/*',
});

orchestrator.register({
  name: 'settings',
  entry: 'https://cdn.example.com/settings/main.js',
  container: '#main-content',
  activeWhen: '/settings/*',
});

orchestrator.start();
```

### माइक्रो फ्रंटएंड ऐप

```ts
import { defineMicroApp } from 'tuvix.js';

let titleEl: HTMLHeadingElement | null = null;

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    // पहले mount से पहले एक बार का setup (जैसे data preload)
    console.log('Dashboard bootstrapped');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>स्वागत है, ${props?.user ?? 'अतिथि'}!</h1>`;
    titleEl = container.querySelector('h1');
  },

  unmount({ container }) {
    titleEl = null;
    container.innerHTML = '';
  },

  // जब shell orchestrator.updateAppProps(name, props) को call करता है तब trigger होता है।
  // DOM को in-place patch करें — कोई remount नहीं, कोई flash नहीं।
  update({ props }) {
    if (titleEl) {
      titleEl.textContent = `स्वागत है, ${props?.user ?? 'अतिथि'}!`;
    }
  },
});
```

---

## 🔄 Runtime पर Props अपडेट करना

बिना remount किए, mounted micro app को नए props pass करें:

```ts
// Shell से updated props push करें — micro app के update() hook को invoke करता है
await orchestrator.updateAppProps('dashboard', {
  user: 'Yasin',
  theme: 'dark',
});
```

Props original config props के साथ merge होते हैं। यदि app `update()` implement
नहीं करता, तो नए props store होते हैं और अगले mount पर apply होते हैं।

---

## 🧭 Manual Lifecycle Control

```ts
// Route reconciliation के बाहर manual mount / unmount
await orchestrator.mountApp('dashboard');
await orchestrator.unmountApp('dashboard');

// वर्तमान state inspect करें
orchestrator.getAppStatus('dashboard');     // 'mounted' | 'mounting' | 'error' | ...
orchestrator.getMountedApps();              // ['dashboard']
orchestrator.getRegisteredApps();           // ['dashboard', 'settings']

// सब कुछ destroy करें (idempotent — multiple बार call करना safe है)
await orchestrator.destroy();
```

---

## 🌉 External Router के साथ Bridge

यदि आप पहले से TanStack Router, Next.js App Router, या React Router उपयोग कर रहे हैं,
तो `config.router` को पूरी तरह skip करें और अपने मौजूदा router को `reconcile(path)`
के माध्यम से Tuvix.js drive करने दें:

```ts
const orchestrator = createOrchestrator(); // कोई router config नहीं

orchestrator.register({
  name: 'dashboard',
  entry: '/dashboard.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();

// हर navigation के बाद, tuvix.js को current path बताएं
tanstackRouter.subscribe('onLoad', () => {
  orchestrator.reconcile(window.location.pathname);
});
```

---

## 👁️ Lazy Mounting (Viewport)

जब तक उनका container viewport में scroll नहीं करता, महंगी micro apps को defer करें:

```ts
orchestrator.register({
  name: 'comments',
  entry: '/comments.js',
  container: '#comments-section',
  mountWhenVisible: true, // पहले IntersectionObserver hit पर mount करता है
});
```

---

## 🛟 Load Failure पर Fallback HTML

```ts
orchestrator.register({
  name: 'reports',
  entry: '/reports.js',
  container: '#reports',
  activeWhen: '/reports/*',
  fallback: '<p class="error">Reports अस्थायी रूप से अनुपलब्ध।</p>',
});
```

---

## ⚡ Prefetching रणनीतियाँ

```ts
const orchestrator = createOrchestrator({
  router: { /* ... */ },
  prefetch: {
    strategy: 'idle', // 'immediate' | 'idle' | 'hover' | 'none' (default)
  },
});
```

| रणनीति | Bundles कब fetch होते हैं |
| --- | --- |
| `immediate` | `start()` के तुरंत बाद |
| `idle` | अगली browser idle window में (`requestIdleCallback`) |
| `hover` | Page पर कहीं भी user के पहले `mouseover` के बाद |
| `none` | कभी नहीं (default) — केवल on demand |

---

## 🔌 इंटर-ऐप कम्युनिकेशन

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// ऐप A — इवेंट emit करें
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// ऐप B — subscribe करें (unsubscribe function लौटाता है)
const unsubscribe = bus.on('user:login', (data) => {
  console.log(`${data.name} logged in!`);
});

// एक बार fire करें और auto-unsubscribe करें
bus.once('app:ready', () => console.log('ready'));

// Debug के लिए सभी events सुनें
bus.onAny((event, data) => console.log('[bus]', event, data));

// Cleanup
unsubscribe();
```

Orchestrator अपना own bus `orchestrator.getEventBus()` के माध्यम से expose करता है,
जिससे सभी registered apps automatically एक single channel share करते हैं।

---

## 🛣️ राउटिंग

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // या 'hash'
  base: '/',       // optional base path
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'users' },
    { path: '/settings', app: 'settings', exact: true },
  ],
});

// Programmatic navigation
await router.push('/dashboard/overview');
await router.replace('/users/42');
router.back();

// Navigation guards (cancel करने के लिए false return करें)
const off = router.beforeEach(async ({ from, to }) => {
  if (to.startsWith('/admin') && !isAdmin()) return false;
});

// Changes पर react करें
router.onChange(({ from, to, toRoute }) => {
  console.log(`navigated ${from} → ${to}`, toRoute?.params);
});

// या orchestrator के navigation helper का उपयोग करें
await orchestrator.navigateTo('/settings');
```

---

## 🏗️ आर्किटेक्चर

```
┌─────────────────────────────────────────────┐
│              Tuvix.js Shell                  │
│  ┌─────────────────────────────────────────┐│
│  │            Orchestrator                 ││
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ ││
│  │  │ Router   │ │Event Bus │ │ Loader  │ ││
│  │  └──────────┘ └──────────┘ └─────────┘ ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌───────┐  ┌───────┐  ┌───────┐          │
│  │ App A │  │ App B │  │ App C │  ...      │
│  │(React)│  │ (Vue) │  │(Svelte│          │
│  └───────┘  └───────┘  └───────┘          │
└─────────────────────────────────────────────┘
```

---

## 📦 पैकेज

| पैकेज | विवरण |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | ऑल-इन-वन अम्ब्रेला पैकेज |
| [`@tuvix.js/core`](./packages/core) | Core Orchestrator with Lifecycle management |
| [`@tuvix.js/router`](./packages/router) | URL-आधारित माइक्रो ऐप राउटिंग |
| [`@tuvix.js/event-bus`](./packages/event-bus) | इंटर-ऐप कम्युनिकेशन इवेंट बस |
| [`@tuvix.js/loader`](./packages/loader) | डायनेमिक मॉड्यूल लोडर |
| [`@tuvix.js/sandbox`](./packages/sandbox) | CSS/JS आइसोलेशन (Shadow DOM + Proxy) |
| [`@tuvix.js/react`](./packages/react) | React 18+ बाइंडिंग और हुक्स |
| [`@tuvix.js/vue`](./packages/vue) | Vue 3 बाइंडिंग और composables |
| [`@tuvix.js/svelte`](./packages/svelte) | Svelte 3-5 बाइंडिंग |
| [`@tuvix.js/angular`](./packages/angular) | Angular 15+ बाइंडिंग |
| [`create-tuvix-app`](./packages/cli) | CLI स्कैफोल्डिंग टूल |
| [`@tuvix.js/devtools`](./packages/devtools) | इन-पेज डिबग पैनल |
| [`@tuvix.js/server`](./packages/server) | सर्वर-साइड कम्पोज़िशन |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Webpack Module Federation इंटीग्रेशन |

---

## 📁 प्रोजेक्ट संरचना

```
tuvix.js/
├── packages/
│   ├── core/               # @tuvix.js/core
│   ├── router/             # @tuvix.js/router
│   ├── event-bus/          # @tuvix.js/event-bus
│   ├── loader/             # @tuvix.js/loader
│   ├── sandbox/            # @tuvix.js/sandbox
│   ├── react/              # @tuvix.js/react
│   ├── vue/                # @tuvix.js/vue
│   ├── svelte/             # @tuvix.js/svelte
│   ├── angular/            # @tuvix.js/angular
│   ├── cli/                # create-tuvix-app
│   ├── devtools/           # @tuvix.js/devtools
│   ├── server/             # @tuvix.js/server
│   ├── module-federation/  # @tuvix.js/module-federation
│   └── tuvix/              # tuvix.js (अम्ब्रेला)
├── examples/
│   ├── with-angular/              # Angular 15+ उदाहरण
│   ├── with-module-federation-react/ # Module Federation + React उदाहरण
│   ├── with-multiple-frameworks/  # मल्टीपल फ्रेमवर्क उदाहरण
│   ├── with-react/                # React 18+ उदाहरण
│   ├── with-react-devtools/       # React + DevTools उदाहरण
│   ├── with-react-event-bus/      # React + Event Bus उदाहरण
│   ├── with-react-router/         # React + Router उदाहरण
│   ├── with-react-sandbox/        # React + Sandbox उदाहरण
│   ├── with-ssr-react/            # SSR + React उदाहरण
│   ├── with-ssr-vanilla/          # SSR + Vanilla JS उदाहरण
│   ├── with-svelte/               # Svelte 5 उदाहरण
│   ├── with-vanilla/              # Vanilla JS उदाहरण
│   └── with-vue/                  # Vue 3 उदाहरण
├── website/                # डॉक्यूमेंटेशन साइट (VitePress, 10 भाषाएं)
├── .github/                # CI/CD वर्कफ़्लो
├── package.json            # रूट वर्कस्पेस कॉन्फ़िगरेशन
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── vitest.config.ts
```

---

## 🗺️ रोडमैप

### ✅ पूर्ण

- [x] Core Orchestrator
- [x] Lifecycle मैनेजमेंट
- [x] डायनेमिक मॉड्यूल लोडिंग
- [x] इवेंट बस
- [x] History/hash मोड के साथ URL राउटिंग
- [x] CSS/JS सैंडबॉक्स आइसोलेशन
- [x] CLI स्कैफोल्डिंग टूल (`npx create-tuvix-app`)
- [x] DevTools ब्राउज़र एक्सटेंशन
- [x] सर्वर-साइड कम्पोज़िशन
- [x] Module federation सपोर्ट
- [x] फ्रेमवर्क बाइंडिंग (React, Vue, Svelte, Angular)
- [x] i18n डॉक्यूमेंटेशन (10 भाषाएं)

### 🔜 जल्द आ रहा है

- [ ] माइक्रो ऐप्स में हॉट मॉड्यूल रीलोड
- [ ] शेयर्ड स्टेट मैनेजमेंट एडाप्टर
- [ ] प्रीलोडिंग और प्रीफेचिंग रणनीतियां
- [ ] प्लगइन सिस्टम और मिडलवेयर API
- [ ] DevTools में विज़ुअल डिपेंडेंसी ग्राफ़
- [ ] Testing utilities & mock Orchestrator
- [ ] नेटिव ESM / importmap सपोर्ट
- [ ] Edge/CDN-अवेयर सर्वर कम्पोज़िशन
- [ ] DevTools इंटीग्रेशन के लिए VS Code एक्सटेंशन
- [ ] माइक्रो ऐप आइसोलेशन के लिए Storybook इंटीग्रेशन

---

## 🧪 उदाहरण

प्रत्येक समर्थित फ्रेमवर्क के लिए तैयार उदाहरण [`examples/`](./examples) डायरेक्टरी में उपलब्ध हैं:

| उदाहरण | फ्रेमवर्क | पथ |
| --- | --- | --- |
| [Angular उदाहरण](./examples/with-angular) | Angular 15+ | `examples/with-angular/` |
| [Module Federation + React उदाहरण](./examples/with-module-federation-react) | React 18+ | `examples/with-module-federation-react/` |
| [मल्टीपल फ्रेमवर्क उदाहरण](./examples/with-multiple-frameworks) | मिश्रित | `examples/with-multiple-frameworks/` |
| [React उदाहरण](./examples/with-react) | React 18+ | `examples/with-react/` |
| [React + DevTools उदाहरण](./examples/with-react-devtools) | React 18+ | `examples/with-react-devtools/` |
| [React + Event Bus उदाहरण](./examples/with-react-event-bus) | React 18+ | `examples/with-react-event-bus/` |
| [React + Router उदाहरण](./examples/with-react-router) | React 18+ | `examples/with-react-router/` |
| [React + Sandbox उदाहरण](./examples/with-react-sandbox) | React 18+ | `examples/with-react-sandbox/` |
| [SSR + React उदाहरण](./examples/with-ssr-react) | React 18+ | `examples/with-ssr-react/` |
| [SSR + Vanilla JS उदाहरण](./examples/with-ssr-vanilla) | कोई फ्रेमवर्क नहीं | `examples/with-ssr-vanilla/` |
| [Svelte उदाहरण](./examples/with-svelte) | Svelte 5 | `examples/with-svelte/` |
| [Vanilla JS उदाहरण](./examples/with-vanilla) | कोई फ्रेमवर्क नहीं | `examples/with-vanilla/` |
| [Vue उदाहरण](./examples/with-vue) | Vue 3 | `examples/with-vue/` |

प्रत्येक उदाहरण में दिखाया गया है:

- एक **Shell (Host)** एप्लिकेशन जो Orchestrator को बूट करता है
- दो **माइक्रो फ्रंटएंड ऐप्स** जो डायनेमिक रूप से रजिस्टर और लोड होते हैं
- इवेंट बस के माध्यम से इंटर-ऐप कम्युनिकेशन

---

## 🤝 योगदान

योगदान का स्वागत है! कृपया PR सबमिट करने से पहले [योगदान गाइड](./CONTRIBUTING.md) पढ़ें।

```bash
# रिपॉज़िटरी क्लोन करें
git clone https://github.com/yasinatesim/tuvix.js.git

# डिपेंडेंसी इंस्टॉल करें
pnpm install

# सभी पैकेज बिल्ड करें
pnpm build

# टेस्ट चलाएं
pnpm test
```

---

## 🔑 लाइसेंस

Copyright © 2026 - MIT लाइसेंस।
अधिक जानकारी के लिए [LICENSE](./LICENSE) देखें।

---

<p align="center">This README was generated by <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> 🥲</p>

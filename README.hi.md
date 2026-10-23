<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  एक माइक्रोफ्रंटएंड टूलकिट: React, Vue, Svelte, Angular या plain TypeScript में लिखे, अलग-अलग deploy होने वाले ऐप्स को load, mount और आपस में connect करें। ये ऐप्स ब्राउज़र में चलते हैं या किसी React पेज के अंदर सर्वर पर रेंडर हुए islands के रूप में।
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

- 🧩 React 18/19, Vue 3, Svelte 3-5 और Angular 15+ के लिए **फ्रेमवर्क adapters**। हर adapter एक root कंपोनेंट को `mount`, `update` और `unmount` वाले माइक्रो ऐप मॉड्यूल में बदलता है, हर container के लिए एक instance।
- 🛣️ **Path के आधार पर activation।** `activeWhen: '/users/:id'` मेल खाने वाले paths पर ऐप को mount करता है। Query strings और hashes उसे कभी unmount नहीं करते। एक ही matcher (`matchPath`) orchestrator, राउटर और server पैकेज, तीनों का काम करता है।
- 🔁 **क्रम से mounting।** Route बदलने पर reconcile एक-एक करके चलते हैं। नए ऐप्स mount होने से पहले inactive ऐप्स unmount होते हैं, इसलिए A → B → A जैसे तेज़ navigation के बाद पेज पर सिर्फ़ A बचता है।
- 🔗 **बाहरी राउटर।** `orchestrator.connectRouter()` TanStack Router या React Router को follow करता है। `interceptLinks()` सामान्य `<a href>` clicks को क्लाइंट navigation में बदलता है।
- 🏝️ **SSR islands।** `TuvixIsland` सर्वर पर रेंडर हुए React पेज में Vue, Svelte, Angular और React माइक्रो ऐप्स को host करता है, उन्हें उसी जगह hydrate करता है, और re-render पर उनका DOM कभी दोबारा नहीं लिखता।
- 🎨 **Styled पहला paint।** `@tuvix.js/vite` आपके सर्वर को बताता है कि हर island को कौन-सी stylesheets चाहिए, ताकि आप उन्हें `<head>` में link कर सकें।
- 📦 **लचीली entries।** Script URLs, `{ scripts, styles, type }`, या `() => import('./app')` जैसे loader functions। Parallel loads, retries, timeouts, SRI hashes।
- 📡 **साझा event bus।** `getGlobalBus()` हर पेज के लिए एक bus लौटाता है, अलग-अलग bundle हुए ऐप्स के बीच भी।
- 🔔 **Lifecycle events।** `tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`, साथ में `whenMounted(name)` और `onLifecycle()`।
- 🔒 **ज़रूरत पर CSS isolation।** `sandbox: true` ऐप को उसकी अपनी stylesheets के साथ एक shadow root के अंदर रेंडर करता है।
- 🟦 **TypeScript।** हर library पैकेज type declarations के साथ ESM और CommonJS builds ship करता है।

Tuvix.js ऐप्स के बीच JavaScript को isolate नहीं करता: हर ऐप पेज के `window` में चलता है। Untrusted code के लिए `<iframe>` इस्तेमाल करें।

---

## 🤖 AI कंपोनेंट जेनरेटर

डॉक्यूमेंटेशन साइट के chatbot से सामान्य भाषा में लिखकर tuvix.js कंपोनेंट बनाएं।

- **Chat model:** OpenRouter के ज़रिए MiniMax M2.5
- **Embed model:** OpenRouter के ज़रिए NVIDIA Nemotron Embed 1B (RAG retrieval)
- **सपोर्ट:** React, Vue, Svelte, Angular
- **Dataset:** HuggingFace पर [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset)

> आज़माएं: डॉक्यूमेंटेशन साइट पर [AI Generator](https://tuvix.js.org/hi/chatbot)

---

## 📦 इंस्टॉलेशन

```bash
# Orchestrator, router, loader, event bus and sandbox
pnpm add tuvix.js

# Adapters, as needed
pnpm add @tuvix.js/react @tuvix.js/vue @tuvix.js/svelte @tuvix.js/angular

# Or scaffold a project
npx create-tuvix-app my-app --template shell
```

---

## 🚀 क्विक स्टार्ट

### Shell

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [] },
});

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main-content',
  activeWhen: '/dashboard/*',
  props: { user: 'Guest' },
  fallback: '<p>Dashboard is unavailable.</p>',
});

orchestrator.register({
  name: 'settings',
  entry: () => import('./apps/settings'),
  container: '#main-content',
  activeWhen: '/settings/*',
});

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.start();
```

### माइक्रो ऐप

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Welcome, {user}</h1>;
}

// Registers itself as "dashboard", so the shell's script entry finds it.
export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

फ्रेमवर्क के बिना:

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'settings',
  mount({ container, props }) {
    const title = document.createElement('h1');
    title.textContent = `Settings for ${String(props?.user ?? 'Guest')}`;
    container.replaceChildren(title);
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

### Props update करें

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

`update` वाला mounted ऐप उसी जगह re-render होता है। बाकी मामलों में orchestrator merge किए गए props को अगले mount के लिए रख लेता है।

---

## 🌉 बाहरी राउटर को Follow करें

```ts
import { createOrchestrator } from 'tuvix.js';
import { router } from './router'; // TanStack Router instance

const orchestrator = createOrchestrator(); // no built-in router

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});

await orchestrator.start();
```

---

## 🏝️ सर्वर पर रेंडर हुए Islands

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });

// `footerHtml` comes from renderSvelteToString() in server-only code.
export function Layout({ footerHtml }: { footerHtml?: string }) {
  return <TuvixIsland name="footer" app={footer} props={{ year: 2026 }} ssrHtml={footerHtml} fallback={<footer>© 2026</footer>} />;
}
```

Hydration के दौरान island अपना HTML पेज से पढ़ता है, इसलिए क्लाइंट को कभी `footerHtml` की ज़रूरत नहीं पड़ती। [SSR Islands गाइड](https://tuvix.js.org/hi/guide/ssr-islands) और [`examples/with-ssr-islands`](./examples/with-ssr-islands) देखें।

---

## 🔔 Lifecycle Events

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer');
container.classList.add(hydrated ? 'hydrated' : 'rendered');
```

---

## 🔌 Event Bus

```ts
import { getGlobalBus } from 'tuvix.js';

const bus = getGlobalBus(); // the same bus the orchestrator passes to mount()

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => console.log(userId));
bus.emit('user:login', { userId: '42' });
off();
```

---

## 📦 पैकेज

| पैकेज | विवरण |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | Umbrella पैकेज: core, router, loader, event bus, sandbox |
| [`@tuvix.js/core`](./packages/core) | Orchestrator: registration, reconcile, props, `connectRouter` |
| [`@tuvix.js/router`](./packages/router) | History/hash राउटर, `matchPath`, `interceptLinks` |
| [`@tuvix.js/loader`](./packages/loader) | Entry loading और lifecycle runtime |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Pub/sub bus, पूरे पेज के लिए `getGlobalBus()` |
| [`@tuvix.js/sandbox`](./packages/sandbox) | `CssSandbox` (shadow DOM), `JsSandbox` (proxy window) |
| [`@tuvix.js/react`](./packages/react) | React adapter, `TuvixReactApp`, `TuvixIsland`, hooks |
| [`@tuvix.js/vue`](./packages/vue) | Vue 3 adapter, `renderVueToString` |
| [`@tuvix.js/svelte`](./packages/svelte) | Svelte 3-5 adapter, `renderSvelteToString` |
| [`@tuvix.js/angular`](./packages/angular) | Angular 15+ adapter (zoneless), `renderAngularToString` |
| [`@tuvix.js/vite`](./packages/vite) | Vite plugin: सर्वर पर रेंडर हुए `<head>` के लिए island stylesheet links |
| [`@tuvix.js/server`](./packages/server) | HTML fragments का सर्वर-साइड composition, streaming, metrics |
| [`@tuvix.js/module-federation`](./packages/module-federation) | webpack Module Federation remotes पर आधारित entries |
| [`@tuvix.js/devtools`](./packages/devtools) | पेज के अंदर debug panel |
| [`create-tuvix-app`](./packages/cli) | प्रोजेक्ट scaffolding |

---

## 📁 प्रोजेक्ट संरचना

```text
tuvix.js/
├── packages/        # the 15 packages above
├── examples/        # runnable examples, see below
├── website/         # documentation site (VitePress, 10 languages)
├── scripts/         # docs and package validators
└── .changeset/      # release notes for the next version
```

---

## 🧪 उदाहरण

| उदाहरण | क्या दिखाता है |
| --- | --- |
| [`with-ssr-islands`](./examples/with-ssr-islands) | सर्वर पर रेंडर हुए Vue, Svelte, Angular और React islands के साथ React host |
| [`with-react`](./examples/with-react) | React shell और माइक्रो ऐप्स |
| [`with-vue`](./examples/with-vue) | Vue 3 माइक्रो ऐप्स |
| [`with-svelte`](./examples/with-svelte) | Svelte माइक्रो ऐप्स |
| [`with-angular`](./examples/with-angular) | Angular माइक्रो ऐप्स |
| [`with-vanilla`](./examples/with-vanilla) | बिना फ्रेमवर्क |
| [`with-multiple-frameworks`](./examples/with-multiple-frameworks) | एक shell में React और Vue |
| [`with-react-router`](./examples/with-react-router) | रूटिंग |
| [`with-react-event-bus`](./examples/with-react-event-bus) | Event bus |
| [`with-react-sandbox`](./examples/with-react-sandbox) | CSS sandbox |
| [`with-react-devtools`](./examples/with-react-devtools) | Devtools panel |
| [`with-module-federation-react`](./examples/with-module-federation-react) | Module Federation |
| [`with-ssr-react`](./examples/with-ssr-react) | `@tuvix.js/server` के साथ सर्वर composition |
| [`with-ssr-vanilla`](./examples/with-ssr-vanilla) | बिना फ्रेमवर्क के सर्वर composition |

---

## 🗺️ रोडमैप

Ship हो चुका:

- Serialized reconciles, `connectRouter`, viewport mounting और fallback HTML के साथ orchestrator
- SSR hydration के साथ React, Vue, Svelte 3-5 और Angular (zoneless) के adapters
- `TuvixIsland`, lifecycle events, `@tuvix.js/vite` island assets
- Streaming और Prometheus metrics के साथ सर्वर composition (`@tuvix.js/server`)
- Module Federation entries, पेज के अंदर devtools, CLI scaffolding
- 10 भाषाओं में डॉक्यूमेंटेशन

योजना में:

- माइक्रो ऐप्स में hot module reload
- Native ESM / import map सपोर्ट
- Stale-while-revalidate fragment caching के साथ edge-aware सर्वर composition
- Testing utilities और एक mock orchestrator
- Fragment A/B testing

---

## 🤝 योगदान

Pull request खोलने से पहले [Contributing Guide](./CONTRIBUTING.md) पढ़ें।

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js
pnpm install
pnpm build
pnpm test
```

0.4 से आ रहे हैं? [माइग्रेशन गाइड](https://tuvix.js.org/hi/guide/migration-0-5) पढ़ें।

---

## 🔑 लाइसेंस

Copyright © 2026 - MIT License.
अधिक जानकारी के लिए [LICENSE](./LICENSE) देखें।

---

<p align="center">यह README <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> से बनाया गया है 🥲</p>

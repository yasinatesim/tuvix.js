<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  A microfrontend toolkit: load, mount and connect independently deployed apps written in React, Vue, Svelte, Angular or plain TypeScript, in the browser or as server-rendered islands inside a React page.
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

## ✨ Features

- 🧩 **Framework adapters** for React 18/19, Vue 3, Svelte 3-5 and Angular 15+. Each turns a root component into a micro app module with `mount`, `update` and `unmount`, one instance per container.
- 🛣️ **Path-based activation.** `activeWhen: '/users/:id'` mounts an app on matching paths. Query strings and hashes never unmount it. One matcher (`matchPath`) serves the orchestrator, the router and the server package.
- 🔁 **Ordered mounting.** Route changes reconcile one at a time; inactive apps unmount before new ones mount, so quick A → B → A navigation leaves only A on the page.
- 🔗 **External routers.** `orchestrator.connectRouter()` follows TanStack Router or React Router. `interceptLinks()` turns plain `<a href>` clicks into client navigations.
- 🏝️ **SSR islands.** `TuvixIsland` hosts Vue, Svelte, Angular and React micro apps in a server-rendered React page, hydrates them in place, and never rewrites their DOM on re-render.
- 🎨 **Styled first paint.** `@tuvix.js/vite` tells your server which stylesheets each island needs, so you link them in `<head>`.
- 📦 **Flexible entries.** Script URLs, `{ scripts, styles, type }`, or loader functions such as `() => import('./app')`. Parallel loads, retries, timeouts, SRI hashes.
- 📡 **Shared event bus.** `getGlobalBus()` returns one bus per page, even across separately bundled apps.
- 🔔 **Lifecycle events.** `tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`, plus `whenMounted(name)` and `onLifecycle()`.
- 🔒 **CSS isolation on request.** `sandbox: true` renders an app inside a shadow root with its own stylesheets.
- 🟦 **TypeScript.** Every library package ships ESM and CommonJS builds with type declarations.

Tuvix.js does not isolate JavaScript between apps: every app runs in the page's `window`. Use an `<iframe>` for untrusted code.

---

## 🤖 AI Component Generator

Generate tuvix.js components from natural language with the chatbot on the documentation site.

- **Chat model:** MiniMax M2.5 via OpenRouter
- **Embed model:** NVIDIA Nemotron Embed 1B via OpenRouter (RAG retrieval)
- **Supports:** React, Vue, Svelte, Angular
- **Dataset:** [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset) on HuggingFace

> Try it: [AI Generator](https://tuvix.js.org/chatbot) on the documentation site

---

## 📦 Installation

```bash
# Orchestrator, router, loader, event bus and sandbox
pnpm add tuvix.js

# Adapters, as needed
pnpm add @tuvix.js/react @tuvix.js/vue @tuvix.js/svelte @tuvix.js/angular

# Or scaffold a project
npx create-tuvix-app my-app --template shell
```

---

## 🚀 Quick Start

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

### Micro app

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Welcome, {user}</h1>;
}

// Registers itself as "dashboard", so the shell's script entry finds it.
export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Without a framework:

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

### Update props

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

A mounted app with `update` re-renders in place. Otherwise the orchestrator keeps the merged props for the next mount.

---

## 🌉 Follow an External Router

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

## 🏝️ Server-Rendered Islands

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

During hydration the island reads its HTML from the page, so the client never needs `footerHtml`. See the [SSR Islands guide](https://tuvix.js.org/guide/ssr-islands) and [`examples/with-ssr-islands`](./examples/with-ssr-islands).

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

## 📦 Packages

| Package | Description |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | Umbrella: core, router, loader, event bus, sandbox |
| [`@tuvix.js/core`](./packages/core) | Orchestrator: registration, reconcile, props, `connectRouter` |
| [`@tuvix.js/router`](./packages/router) | History/hash router, `matchPath`, `interceptLinks` |
| [`@tuvix.js/loader`](./packages/loader) | Entry loading and the lifecycle runtime |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Pub/sub bus, page-wide `getGlobalBus()` |
| [`@tuvix.js/sandbox`](./packages/sandbox) | `CssSandbox` (shadow DOM), `JsSandbox` (proxy window) |
| [`@tuvix.js/react`](./packages/react) | React adapter, `TuvixReactApp`, `TuvixIsland`, hooks |
| [`@tuvix.js/vue`](./packages/vue) | Vue 3 adapter, `renderVueToString` |
| [`@tuvix.js/svelte`](./packages/svelte) | Svelte 3-5 adapter, `renderSvelteToString` |
| [`@tuvix.js/angular`](./packages/angular) | Angular 15+ adapter (zoneless), `renderAngularToString` |
| [`@tuvix.js/vite`](./packages/vite) | Vite plugin: island stylesheet links for the server-rendered `<head>` |
| [`@tuvix.js/server`](./packages/server) | Server-side composition of HTML fragments, streaming, metrics |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Entries backed by webpack Module Federation remotes |
| [`@tuvix.js/devtools`](./packages/devtools) | In-page debug panel |
| [`create-tuvix-app`](./packages/cli) | Project scaffolding |

---

## 📁 Project Structure

```text
tuvix.js/
├── packages/        # the 15 packages above
├── examples/        # runnable examples, see below
├── website/         # documentation site (VitePress, 10 languages)
├── scripts/         # docs and package validators
└── .changeset/      # release notes for the next version
```

---

## 🧪 Examples

| Example | Shows |
| --- | --- |
| [`with-ssr-islands`](./examples/with-ssr-islands) | React host with server-rendered Vue, Svelte, Angular and React islands |
| [`with-react`](./examples/with-react) | React shell and micro apps |
| [`with-vue`](./examples/with-vue) | Vue 3 micro apps |
| [`with-svelte`](./examples/with-svelte) | Svelte micro apps |
| [`with-angular`](./examples/with-angular) | Angular micro apps |
| [`with-vanilla`](./examples/with-vanilla) | No framework |
| [`with-multiple-frameworks`](./examples/with-multiple-frameworks) | React and Vue in one shell |
| [`with-react-router`](./examples/with-react-router) | Routing |
| [`with-react-event-bus`](./examples/with-react-event-bus) | Event bus |
| [`with-react-sandbox`](./examples/with-react-sandbox) | CSS sandbox |
| [`with-react-devtools`](./examples/with-react-devtools) | Devtools panel |
| [`with-module-federation-react`](./examples/with-module-federation-react) | Module Federation |
| [`with-ssr-react`](./examples/with-ssr-react) | Server composition with `@tuvix.js/server` |
| [`with-ssr-vanilla`](./examples/with-ssr-vanilla) | Server composition without a framework |

---

## 🗺️ Roadmap

Shipped:

- Orchestrator with serialized reconciles, `connectRouter`, viewport mounting and fallback HTML
- Adapters for React, Vue, Svelte 3-5 and Angular (zoneless), with SSR hydration
- `TuvixIsland`, lifecycle events, `@tuvix.js/vite` island assets
- Server composition with streaming and Prometheus metrics (`@tuvix.js/server`)
- Module Federation entries, in-page devtools, CLI scaffolding
- Documentation in 10 languages

Planned:

- Hot module reload across micro apps
- Native ESM / import map support
- Edge-aware server composition with stale-while-revalidate fragment caching
- Testing utilities and a mock orchestrator
- Fragment A/B testing

---

## 🤝 Contributing

Read the [Contributing Guide](./CONTRIBUTING.md) before you open a pull request.

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js
pnpm install
pnpm build
pnpm test
```

Coming from 0.4? Read the [migration guide](https://tuvix.js.org/guide/migration-0-5).

---

## 🔑 License

Copyright © 2026 - MIT License.
See [LICENSE](./LICENSE) for more information.

---

<p align="center">This README was generated by <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> 🥲</p>

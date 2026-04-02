<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  A lightweight and flexible <strong>microfrontend framework</strong> for building scalable, independently deployable frontend applications.<br/>
  Tuvix.js merges multiple frontend applications into a seamless, unified user experience - just like its name suggests.
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

- 🧩 **Framework Agnostic** - Use React, Vue, Svelte, Angular or Vanilla JS
- 📦 **Independent Deployment** - Deploy each micro app separately
- 🔗 **Dynamic Module Loading** - Load micro frontends on demand
- 🛣️ **Built-in Routing** - Seamless routing across micro apps
- 📡 **Inter-App Communication** - Event bus for cross-app messaging
- ⚡ **Lightweight** - Zero runtime dependencies, minimal core
- 🔄 **Lifecycle Management** - Mount, unmount, update hooks
- 🔒 **Type-Safe** - Full TypeScript support with strict types

---

## 📦 Installation

```bash
# All-in-one package
npm install tuvix.js

# Or install individual packages
npm install @tuvix.js/core @tuvix.js/router
```

---

## 🚀 Quick Start

### Host (Shell) Application

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

### Micro Frontend App

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    console.log('Dashboard bootstrapped');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>Welcome, ${props?.user}!</h1>`;
  },

  unmount({ container }) {
    container.innerHTML = '';
  },

  update({ props }) {
    console.log('Props updated:', props);
  },
});
```

---

## 🔌 Inter-App Communication

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// App A - emit event
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// App B - listen for event
bus.on('user:login', (data) => {
  console.log(`${data.name} logged in!`);
});
```

---

## 🛣️ Routing

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/settings/*', app: 'settings' },
    { path: '/profile/*', app: 'profile' },
  ],
});
```

---

## 🏗️ Architecture

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

## 📦 Packages

| Package | Description |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | All-in-one umbrella package |
| [`@tuvix.js/core`](./packages/core) | Core orchestrator with lifecycle management |
| [`@tuvix.js/router`](./packages/router) | URL-based micro app routing |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Inter-app communication event bus |
| [`@tuvix.js/loader`](./packages/loader) | Dynamic module loader |
| [`@tuvix.js/sandbox`](./packages/sandbox) | CSS/JS isolation (Shadow DOM + Proxy) |
| [`@tuvix.js/react`](./packages/react) | React 18+ bindings & hooks |
| [`@tuvix.js/vue`](./packages/vue) | Vue 3 bindings & composables |
| [`@tuvix.js/svelte`](./packages/svelte) | Svelte 3-5 bindings |
| [`@tuvix.js/angular`](./packages/angular) | Angular 15+ bindings |
| [`create-tuvix-app`](./packages/cli) | CLI scaffolding tool |
| [`@tuvix.js/devtools`](./packages/devtools) | In-page debug panel |
| [`@tuvix.js/server`](./packages/server) | Server-side composition |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Webpack Module Federation integration |

---

## 📁 Project Structure

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
│   └── tuvix/              # tuvix.js (umbrella)
├── examples/
│   ├── react/              # React 18+ example
│   ├── vue/                # Vue 3 example
│   ├── svelte/             # Svelte 5 example
│   ├── angular/            # Angular 15+ example
│   └── vanilla/            # Vanilla JS example
├── website/                # Documentation site (VitePress, 10 languages)
├── .github/                # CI/CD workflows
├── package.json            # Root workspace config
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── vitest.config.ts
```

---

## 🗺️ Roadmap

### ✅ Completed

- [x] Core orchestrator
- [x] Lifecycle management
- [x] Dynamic module loading
- [x] Event bus
- [x] URL routing with history/hash modes
- [x] CSS/JS sandbox isolation
- [x] CLI scaffolding tool (`npx create-tuvix-app`)
- [x] DevTools browser extension
- [x] Server-side composition (`@tuvix.js/server`)
- [x] Module federation support
- [x] Framework bindings (React, Vue, Svelte, Angular)
- [x] i18n documentation (10 languages)
- [x] Example tests & CI coverage for examples

### 🔜 Coming Soon

**Core Runtime**
- [ ] Hot module reload across micro apps
- [ ] Shared state management adapter (Zustand / Pinia adapter layer)
- [ ] Plugin system & middleware API
- [ ] Native ESM / importmap support
- [x] Intersection Observer–based viewport mounting - lazy-mount apps only when their container scrolls into view, reducing initial JS execution cost

**Server-Side Rendering**
- [x] BigPipe-style streaming SSR - send the shell HTML immediately over chunked transfer encoding, then stream each micro-app fragment as it resolves; dramatically reduces Time To First Byte compared to the current synchronous `composeHTML` approach
- [x] Pre-compiled shell templates - compile the slot-injection template once at server startup rather than per request
- [ ] Critical CSS extraction - inline above-the-fold styles in SSR responses for faster Largest Contentful Paint
- [ ] Edge/CDN-aware server composition with stale-while-revalidate fragment caching

**Resilience**
- [x] Fail-safe fallback fragments - declarative per-app fallback HTML shown automatically when a micro-app fails to load or exceeds its timeout; keeps the page usable even when one service is down
- [ ] Fragment A/B testing - register multiple versions of a micro-app and select at runtime via cookie matcher or custom predicate, enabling gradual rollouts without redeploying the shell

**Observability**
- [x] Prometheus-compatible metrics endpoint (`/metrics`) from `@tuvix.js/server` - track mount/unmount counts, load durations, and error rates per app
- [ ] Visual dependency graph in DevTools
- [ ] VS Code extension for DevTools integration

**Developer Experience**
- [ ] Testing utilities & mock orchestrator
- [ ] Storybook integration for micro app isolation
- [ ] Preloading & prefetching strategies (already partially available via `prefetch.strategy` config)


---

## 🧪 Examples

Ready-to-run examples for each supported framework are available in the [`examples/`](./examples) directory:

| Example | Framework | Path |
| --- | --- | --- |
| [React Example](./examples/with-react) | React 18+ | `examples/with-react/` |
| [Vue Example](./examples/with-vue) | Vue 3 | `examples/with-vue/` |
| [Svelte Example](./examples/with-svelte) | Svelte 5 | `examples/with-svelte/` |
| [Angular Example](./examples/with-angular) | Angular 15+ | `examples/with-angular/` |
| [Vanilla JS Example](./examples/with-vanilla) | No framework | `examples/with-vanilla/` |
| [Vanilla JS + SSR Example](./examples/with-ssr-vanilla) | No framework | `examples/with-ssr-vanilla/` |

Each example demonstrates:
- A **shell (host)** application that boots the orchestrator
- Two **micro frontend apps** registered and loaded dynamically
- Inter-app communication via the event bus

---

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guide](./CONTRIBUTING.md) before submitting a PR.

```bash
# Clone the repo
git clone https://github.com/yasinatesim/tuvix.js.git

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

---

## 🔑 License

Copyright © 2026 - MIT License.
See [LICENSE](./LICENSE) for more information.


---

<p align="center">This README was generated by <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> 🥲</p>

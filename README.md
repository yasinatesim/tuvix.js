# 🚀 Tuvix.js

A lightweight and flexible **microfrontend framework** for building scalable, independently deployable frontend applications.

Tuvix.js merges multiple frontend applications into a seamless, unified user experience — just like its name suggests.

---

## ✨ Features

- 🧩 **Framework Agnostic** — Use React, Vue, Svelte, Angular or Vanilla JS
- 📦 **Independent Deployment** — Deploy each micro app separately
- 🔗 **Dynamic Module Loading** — Load micro frontends on demand
- 🛣️ **Built-in Routing** — Seamless routing across micro apps
- 📡 **Inter-App Communication** — Event bus for cross-app messaging
- ⚡ **Lightweight** — Zero runtime dependencies, minimal core
- 🔄 **Lifecycle Management** — Mount, unmount, update hooks
- 🔒 **Type-Safe** — Full TypeScript support with strict types

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

// App A — emit event
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// App B — listen for event
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
├── website/                # Documentation site
├── .github/                # CI/CD workflows
├── package.json            # Root workspace config
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── vitest.config.ts
```

---

## 🗺️ Roadmap

- [x] Core orchestrator
- [x] Lifecycle management
- [x] Dynamic module loading
- [x] Event bus
- [x] URL routing with history/hash modes
- [x] CSS/JS sandbox isolation
- [x] CLI scaffolding tool (`npx create-tuvix-app`)
- [x] DevTools browser extension
- [x] Server-side composition
- [x] Module federation support
- [x] Framework bindings (React, Vue, Svelte, Angular)

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

## 📄 License

MIT © 2026 Tuvix.js Contributors

---

<p align="center">
<strong>Tuvix.js</strong> — Merge your frontends into one. 🖖
</p>

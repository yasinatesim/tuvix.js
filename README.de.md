<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  Ein leichtgewichtiges und flexibles <strong>Microfrontend-Framework</strong> zum Erstellen skalierbarer, unabhängig deploybarer Frontend-Anwendungen.<br/>
  Tuvix.js vereint mehrere Frontend-Anwendungen zu einer nahtlosen, einheitlichen Benutzererfahrung — ganz wie der Name vermuten lässt.
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

## ✨ Funktionen

- 🧩 **Framework-unabhängig** — Verwende React, Vue, Svelte, Angular oder Vanilla JS
- 📦 **Unabhängiges Deployment** — Deploye jede Micro-App separat
- 🔗 **Dynamisches Modulladen** — Lade Microfrontends bei Bedarf
- 🛣️ **Integriertes Routing** — Nahtloses Routing zwischen Micro-Apps
- 📡 **Inter-App-Kommunikation** — Event-Bus für App-übergreifende Nachrichtenübermittlung
- ⚡ **Leichtgewichtig** — Keine Laufzeitabhängigkeiten, minimaler Kern
- 🔄 **Lifecycle-Management** — Hooks für Mounten, Unmounten und Aktualisieren
- 🔒 **Typsicher** — Vollständige TypeScript-Unterstützung mit strikten Typen

---

## 📦 Installation

```bash
# Alles-in-einem-Paket
npm install tuvix.js

# Oder einzelne Pakete installieren
npm install @tuvix.js/core @tuvix.js/router
```

---

## 🚀 Schnellstart

### Host-Anwendung (Shell)

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

### Micro-Frontend-App

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    console.log('Dashboard initialisiert');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>Willkommen, ${props?.user}!</h1>`;
  },

  unmount({ container }) {
    container.innerHTML = '';
  },

  update({ props }) {
    console.log('Props aktualisiert:', props);
  },
});
```

---

## 🔌 Inter-App-Kommunikation

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// App A — Event senden
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// App B — auf Event lauschen
bus.on('user:login', (data) => {
  console.log(`${data.name} hat sich angemeldet!`);
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

## 🏗️ Architektur

```
┌─────────────────────────────────────────────┐
│              Tuvix.js-Shell                 │
│  ┌─────────────────────────────────────────┐│
│  │           Orchestrator                  ││
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

## 📦 Pakete

| Paket | Beschreibung |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | Alles-in-einem-Dachpaket |
| [`@tuvix.js/core`](./packages/core) | Kern-Orchestrator mit Lifecycle-Management |
| [`@tuvix.js/router`](./packages/router) | URL-basiertes Micro-App-Routing |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Event-Bus für Inter-App-Kommunikation |
| [`@tuvix.js/loader`](./packages/loader) | Dynamischer Modullader |
| [`@tuvix.js/sandbox`](./packages/sandbox) | CSS/JS-Isolation (Shadow DOM + Proxy) |
| [`@tuvix.js/react`](./packages/react) | React 18+ Bindings und Hooks |
| [`@tuvix.js/vue`](./packages/vue) | Vue 3 Bindings und Composables |
| [`@tuvix.js/svelte`](./packages/svelte) | Svelte 3-5 Bindings |
| [`@tuvix.js/angular`](./packages/angular) | Angular 15+ Bindings |
| [`create-tuvix-app`](./packages/cli) | CLI-Scaffolding-Tool |
| [`@tuvix.js/devtools`](./packages/devtools) | In-Page-Debug-Panel |
| [`@tuvix.js/server`](./packages/server) | Serverseitige Komposition |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Webpack Module Federation Integration |

---

## 📁 Projektstruktur

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
│   └── tuvix/              # tuvix.js (Dachpaket)
├── examples/
│   ├── react/              # React 18+ Beispiel
│   ├── vue/                # Vue 3 Beispiel
│   ├── svelte/             # Svelte 5 Beispiel
│   ├── angular/            # Angular 15+ Beispiel
│   └── vanilla/            # Vanilla JS Beispiel
├── website/                # Dokumentationsseite (VitePress, 10 Sprachen)
├── .github/                # CI/CD-Workflows
├── package.json            # Root-Workspace-Konfiguration
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── vitest.config.ts
```

---

## 🗺️ Roadmap

### ✅ Abgeschlossen

- [x] Kern-Orchestrator
- [x] Lifecycle-Management
- [x] Dynamisches Modulladen
- [x] Event-Bus
- [x] URL-Routing mit History/Hash-Modi
- [x] CSS/JS-Sandbox-Isolation
- [x] CLI-Scaffolding-Tool (`npx create-tuvix-app`)
- [x] DevTools-Browsererweiterung
- [x] Serverseitige Komposition
- [x] Module-Federation-Unterstützung
- [x] Framework-Bindings (React, Vue, Svelte, Angular)
- [x] i18n-Dokumentation (10 Sprachen)

### 🔜 Demnächst

- [ ] Hot Module Reload zwischen Micro-Apps
- [ ] Adapter für gemeinsames State-Management
- [ ] Preloading- und Prefetching-Strategien
- [ ] Plugin-System und Middleware-API
- [ ] Visueller Abhängigkeitsgraph in DevTools
- [ ] Test-Utilities und Mock-Orchestrator
- [ ] Native ESM- / Importmap-Unterstützung
- [ ] Edge/CDN-fähige serverseitige Komposition
- [ ] VS Code-Erweiterung für DevTools-Integration
- [ ] Storybook-Integration zur Micro-App-Isolation

---

## 🧪 Beispiele

Sofort ausführbare Beispiele für jedes unterstützte Framework sind im Verzeichnis [`examples/`](./examples) verfügbar:

| Beispiel | Framework | Pfad |
| --- | --- | --- |
| [React-Beispiel](./examples/react) | React 18+ | `examples/react/` |
| [Vue-Beispiel](./examples/vue) | Vue 3 | `examples/vue/` |
| [Svelte-Beispiel](./examples/svelte) | Svelte 5 | `examples/svelte/` |
| [Angular-Beispiel](./examples/angular) | Angular 15+ | `examples/angular/` |
| [Vanilla JS-Beispiel](./examples/vanilla) | Kein Framework | `examples/vanilla/` |

Jedes Beispiel zeigt:
- Eine **Shell-(Host-)Anwendung**, die den Orchestrator startet
- Zwei **Micro-Frontend-Apps**, die dynamisch registriert und geladen werden
- Inter-App-Kommunikation über den Event-Bus

---

## 🤝 Mitwirken

Beiträge sind willkommen! Bitte lies den [Leitfaden zum Mitwirken](./CONTRIBUTING.md), bevor du einen PR einreichst.

```bash
# Repository klonen
git clone https://github.com/yasinatesim/tuvix.js.git

# Abhängigkeiten installieren
pnpm install

# Alle Pakete bauen
pnpm build

# Tests ausführen
pnpm test
```

---

## 🔑 Lizenz

Copyright © 2026 - MIT-Lizenz.
Siehe [LICENSE](./LICENSE) für weitere Informationen.


---

<p align="center">Diese README wurde von <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> generiert 🥲</p>

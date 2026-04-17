<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  Ein leichtgewichtiges und flexibles <strong>Microfrontend-Framework</strong> zum Erstellen skalierbarer, unabhängig deploybarer Frontend-Anwendungen.<br/>
  Tuvix.js vereint mehrere Frontend-Anwendungen zu einer nahtlosen, einheitlichen Benutzererfahrung - ganz wie der Name vermuten lässt.
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

- 🧩 **Framework-unabhängig** - Verwende React, Vue, Svelte, Angular oder Vanilla JS
- 📦 **Unabhängiges Deployment** - Deploye jede Micro-App separat
- 🔗 **Dynamisches Modulladen** - Lade Microfrontends bei Bedarf
- 🛣️ **Integriertes Routing** - Nahtloses Routing zwischen Micro-Apps
- 📡 **Inter-App-Kommunikation** - Event-Bus für App-übergreifende Nachrichtenübermittlung
- ⚡ **Lightweight** - Keine Laufzeitabhängigkeiten, minimaler Kern
- 🔄 **Lifecycle Management** - Hooks für Mounten, Unmounten und Aktualisieren
- 🔒 **Type-Safe** - Vollständige TypeScript-Unterstützung mit strikten Typen

---

## 🤖 KI-Komponenten-Generator

Generieren Sie tuvix.js-Komponenten aus natürlicher Sprache mit unserem integrierten KI-Chatbot.

- **Chat-Modell:** MiniMax M2.5 über OpenRouter (kostenlose API, kein Self-Hosting erforderlich)
- **Einbettungsmodell:** NVIDIA Nemotron Embed 1B über OpenRouter (RAG-Abruf)
- **Unterstützt:** React, Vue, Svelte, Angular
- **Dataset:** [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset) auf HuggingFace

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

let titleEl: HTMLHeadingElement | null = null;

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    // Einmaliges Setup vor dem ersten Mount (z. B. Daten vorladen)
    console.log('Dashboard initialisiert');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>Willkommen, ${props?.user ?? 'Gast'}!</h1>`;
    titleEl = container.querySelector('h1');
  },

  unmount({ container }) {
    titleEl = null;
    container.innerHTML = '';
  },

  // Wird ausgelöst, wenn der Shell orchestrator.updateAppProps(name, props) aufruft.
  // DOM in-place patchen — kein Remount, kein Flackern.
  update({ props }) {
    if (titleEl) {
      titleEl.textContent = `Willkommen, ${props?.user ?? 'Gast'}!`;
    }
  },
});
```

---

## 🔄 Props zur Laufzeit aktualisieren

Übergib einer gemounteten Micro-App neue Props, ohne sie neu zu mounten:

```ts
// Aktualisierte Props vom Shell pushen — ruft den update()-Hook der Micro-App auf
await orchestrator.updateAppProps('dashboard', {
  user: 'Yasin',
  theme: 'dark',
});
```

Die Props werden mit den ursprünglichen Config-Props zusammengeführt. Wenn die
App keinen `update()`-Hook implementiert, werden die neuen Props gespeichert
und beim nächsten Mount angewendet.

---

## 🧭 Manuelle Lifecycle-Steuerung

```ts
// Manuelles Mount / Unmount außerhalb der Routen-Reconciliation
await orchestrator.mountApp('dashboard');
await orchestrator.unmountApp('dashboard');

// Aktuellen Zustand abfragen
orchestrator.getAppStatus('dashboard');     // 'mounted' | 'mounting' | 'error' | ...
orchestrator.getMountedApps();              // ['dashboard']
orchestrator.getRegisteredApps();           // ['dashboard', 'settings']

// Alles abbauen (idempotent — sicher mehrfach aufrufbar)
await orchestrator.destroy();
```

---

## 🌉 Externen Router anbinden

Wenn du bereits TanStack Router, Next.js App Router oder React Router nutzt,
überspring `config.router` komplett und lass deinen vorhandenen Router
Tuvix.js per `reconcile(path)` steuern:

```ts
const orchestrator = createOrchestrator(); // keine Router-Config

orchestrator.register({
  name: 'dashboard',
  entry: '/dashboard.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();

// Nach jeder Navigation tuvix.js den aktuellen Pfad mitteilen
tanstackRouter.subscribe('onLoad', () => {
  orchestrator.reconcile(window.location.pathname);
});
```

---

## 👁️ Lazy Mounting (Viewport)

Aufwendige Micro-Apps erst mounten, wenn ihr Container ins Viewport scrollt:

```ts
orchestrator.register({
  name: 'comments',
  entry: '/comments.js',
  container: '#comments-section',
  mountWhenVisible: true, // mountet beim ersten IntersectionObserver-Treffer
});
```

---

## 🛟 Fallback-HTML bei Ladefehler

```ts
orchestrator.register({
  name: 'reports',
  entry: '/reports.js',
  container: '#reports',
  activeWhen: '/reports/*',
  fallback: '<p class="error">Reports vorübergehend nicht verfügbar.</p>',
});
```

---

## ⚡ Prefetching-Strategien

```ts
const orchestrator = createOrchestrator({
  router: { /* ... */ },
  prefetch: {
    strategy: 'idle', // 'immediate' | 'idle' | 'hover' | 'none' (Standard)
  },
});
```

| Strategie | Wann werden Bundles geladen |
| --- | --- |
| `immediate` | Direkt nach `start()` |
| `idle` | Im nächsten Browser-Idle-Fenster (`requestIdleCallback`) |
| `hover` | Beim ersten `mouseover` des Nutzers irgendwo auf der Seite |
| `none` | Nie (Standard) — nur on demand |

---

## 🔌 Inter-App-Kommunikation

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// App A — Event senden
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// App B — abonnieren (gibt eine Unsubscribe-Funktion zurück)
const unsubscribe = bus.on('user:login', (data) => {
  console.log(`${data.name} hat sich angemeldet!`);
});

// Einmal feuern und automatisch abmelden
bus.once('app:ready', () => console.log('bereit'));

// Alle Events zum Debuggen mithören
bus.onAny((event, data) => console.log('[bus]', event, data));

// Aufräumen
unsubscribe();
```

Der Orchestrator bietet seinen eigenen Bus über `orchestrator.getEventBus()`,
sodass alle registrierten Apps automatisch denselben Kanal teilen.

---

## 🛣️ Routing

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // oder 'hash'
  base: '/',       // optionaler Base-Pfad
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'users' },
    { path: '/settings', app: 'settings', exact: true },
  ],
});

// Programmatische Navigation
await router.push('/dashboard/overview');
await router.replace('/users/42');
router.back();

// Navigation Guards (false zurückgeben zum Abbrechen)
const off = router.beforeEach(async ({ from, to }) => {
  if (to.startsWith('/admin') && !isAdmin()) return false;
});

// Auf Änderungen reagieren
router.onChange(({ from, to, toRoute }) => {
  console.log(`navigiert ${from} → ${to}`, toRoute?.params);
});

// Oder den Navigations-Helper des Orchestrators nutzen
await orchestrator.navigateTo('/settings');
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
| [`@tuvix.js/core`](./packages/core) | Core Orchestrator with Lifecycle management |
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
│   ├── with-angular/              # Angular 15+ Beispiel
│   ├── with-module-federation-react/ # Module Federation + React Beispiel
│   ├── with-multiple-frameworks/  # Mehrere Frameworks Beispiel
│   ├── with-react/                # React 18+ Beispiel
│   ├── with-react-devtools/       # React + DevTools Beispiel
│   ├── with-react-event-bus/      # React + Event Bus Beispiel
│   ├── with-react-router/         # React + Router Beispiel
│   ├── with-react-sandbox/        # React + Sandbox Beispiel
│   ├── with-ssr-react/            # SSR + React Beispiel
│   ├── with-ssr-vanilla/          # SSR + Vanilla JS Beispiel
│   ├── with-svelte/               # Svelte 5 Beispiel
│   ├── with-vanilla/              # Vanilla JS Beispiel
│   └── with-vue/                  # Vue 3 Beispiel
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
- [x] Lifecycle management
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
| [Angular-Beispiel](./examples/with-angular) | Angular 15+ | `examples/with-angular/` |
| [Module Federation + React-Beispiel](./examples/with-module-federation-react) | React 18+ | `examples/with-module-federation-react/` |
| [Mehrere Frameworks-Beispiel](./examples/with-multiple-frameworks) | Gemischt | `examples/with-multiple-frameworks/` |
| [React-Beispiel](./examples/with-react) | React 18+ | `examples/with-react/` |
| [React + DevTools-Beispiel](./examples/with-react-devtools) | React 18+ | `examples/with-react-devtools/` |
| [React + Event Bus-Beispiel](./examples/with-react-event-bus) | React 18+ | `examples/with-react-event-bus/` |
| [React + Router-Beispiel](./examples/with-react-router) | React 18+ | `examples/with-react-router/` |
| [React + Sandbox-Beispiel](./examples/with-react-sandbox) | React 18+ | `examples/with-react-sandbox/` |
| [SSR + React-Beispiel](./examples/with-ssr-react) | React 18+ | `examples/with-ssr-react/` |
| [SSR + Vanilla JS-Beispiel](./examples/with-ssr-vanilla) | Kein Framework | `examples/with-ssr-vanilla/` |
| [Svelte-Beispiel](./examples/with-svelte) | Svelte 5 | `examples/with-svelte/` |
| [Vanilla JS-Beispiel](./examples/with-vanilla) | Kein Framework | `examples/with-vanilla/` |
| [Vue-Beispiel](./examples/with-vue) | Vue 3 | `examples/with-vue/` |

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

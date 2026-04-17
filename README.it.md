<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  Un framework <strong>microfrontend</strong> leggero e flessibile per creare applicazioni frontend scalabili e distribuibili in modo indipendente.<br/>
  Tuvix.js unisce più applicazioni frontend in un'esperienza utente fluida e coerente - proprio come suggerisce il suo nome.
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

## ✨ Funzionalità

- 🧩 **Indipendente dal Framework** - Usa React, Vue, Svelte, Angular o Vanilla JS
- 📦 **Deploy Indipendente** - Distribuisci ogni micro app separatamente
- 🔗 **Caricamento Dinamico dei Moduli** - Carica i microfrontend on demand
- 🛣️ **Routing Integrato** - Routing trasparente tra le micro app
- 📡 **Comunicazione tra App** - Event bus per la messaggistica cross-app
- ⚡ **Lightweight** - Zero dipendenze runtime, core minimale
- 🔄 **Gestione del Lifecycle** - Hook di mount, unmount e update
- 🔒 **Type-Safe** - Supporto completo a TypeScript con tipi rigorosi

---

## 🤖 Generatore di Componenti IA

Genera componenti tuvix.js dal linguaggio naturale usando il nostro chatbot IA integrato.

- **Modello chat:** MiniMax M2.5 via OpenRouter (API gratuita, nessun self-hosting richiesto)
- **Modello embedding:** NVIDIA Nemotron Embed 1B via OpenRouter (recupero RAG)
- **Supporta:** React, Vue, Svelte, Angular
- **Dataset:** [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset) su HuggingFace

---

## 📦 Installazione

```bash
# Pacchetto tutto-in-uno
npm install tuvix.js

# Oppure installa i pacchetti singolarmente
npm install @tuvix.js/core @tuvix.js/router
```

---

## 🚀 Avvio Rapido

### Applicazione Host (Shell)

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

### App Micro Frontend

```ts
import { defineMicroApp } from 'tuvix.js';

let titleEl: HTMLHeadingElement | null = null;

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    // Setup una tantum prima del primo mount (es. precaricare dati)
    console.log('Dashboard bootstrapped');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>Benvenuto, ${props?.user ?? 'Ospite'}!</h1>`;
    titleEl = container.querySelector('h1');
  },

  unmount({ container }) {
    titleEl = null;
    container.innerHTML = '';
  },

  // Attivato quando lo shell chiama orchestrator.updateAppProps(name, props).
  // Patcha il DOM in-place — nessun remount, nessun flash.
  update({ props }) {
    if (titleEl) {
      titleEl.textContent = `Benvenuto, ${props?.user ?? 'Ospite'}!`;
    }
  },
});
```

---

## 🔄 Aggiornamento Props a Runtime

Passa nuove props a una micro-app già montata senza rimontarla:

```ts
// Push delle props aggiornate dallo shell — invoca l'hook update() della micro-app
await orchestrator.updateAppProps('dashboard', {
  user: 'Yasin',
  theme: 'dark',
});
```

Le props vengono unite con le props originali del config. Se l'app non
implementa `update()`, le nuove props vengono memorizzate e applicate al
prossimo mount.

---

## 🧭 Controllo Manuale del Ciclo di Vita

```ts
// Mount / unmount manuale al di fuori della riconciliazione delle route
await orchestrator.mountApp('dashboard');
await orchestrator.unmountApp('dashboard');

// Ispeziona lo stato corrente
orchestrator.getAppStatus('dashboard');     // 'mounted' | 'mounting' | 'error' | ...
orchestrator.getMountedApps();              // ['dashboard']
orchestrator.getRegisteredApps();           // ['dashboard', 'settings']

// Smonta tutto (idempotente — sicuro chiamarlo più volte)
await orchestrator.destroy();
```

---

## 🌉 Integrazione con un Router Esterno

Se usi già TanStack Router, Next.js App Router o React Router, salta
completamente `config.router` e lascia che il tuo router pilotare Tuvix.js
tramite `reconcile(path)`:

```ts
const orchestrator = createOrchestrator(); // nessuna config router

orchestrator.register({
  name: 'dashboard',
  entry: '/dashboard.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();

// Dopo ogni navigazione, comunica a tuvix.js il path corrente
tanstackRouter.subscribe('onLoad', () => {
  orchestrator.reconcile(window.location.pathname);
});
```

---

## 👁️ Mount Differito (Viewport)

Posticipa le micro-app costose finché il loro container non entra nel viewport:

```ts
orchestrator.register({
  name: 'comments',
  entry: '/comments.js',
  container: '#comments-section',
  mountWhenVisible: true, // monta al primo hit dell'IntersectionObserver
});
```

---

## 🛟 HTML di Fallback in Caso di Errore

```ts
orchestrator.register({
  name: 'reports',
  entry: '/reports.js',
  container: '#reports',
  activeWhen: '/reports/*',
  fallback: '<p class="error">Reports temporaneamente non disponibile.</p>',
});
```

---

## ⚡ Strategie di Prefetch

```ts
const orchestrator = createOrchestrator({
  router: { /* ... */ },
  prefetch: {
    strategy: 'idle', // 'immediate' | 'idle' | 'hover' | 'none' (default)
  },
});
```

| Strategia | Quando vengono caricati i bundle |
| --- | --- |
| `immediate` | Subito dopo `start()` |
| `idle` | Nella prossima finestra idle del browser (`requestIdleCallback`) |
| `hover` | Al primo `mouseover` dell'utente in qualsiasi punto della pagina |
| `none` | Mai (default) — solo on-demand |

---

## 🔌 Comunicazione tra App

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// App A — emetti evento
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// App B — sottoscrivi (restituisce una funzione di unsubscribe)
const unsubscribe = bus.on('user:login', (data) => {
  console.log(`${data.name} logged in!`);
});

// Esegui una volta e auto-unsubscribe
bus.once('app:ready', () => console.log('pronto'));

// Ascolta tutti gli eventi per il debug
bus.onAny((event, data) => console.log('[bus]', event, data));

// Pulizia
unsubscribe();
```

L'orchestrator espone il proprio bus tramite `orchestrator.getEventBus()` cosi
che tutte le app registrate condividano automaticamente un singolo canale.

---

## 🛣️ Routing

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // o 'hash'
  base: '/',       // base path opzionale
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'users' },
    { path: '/settings', app: 'settings', exact: true },
  ],
});

// Navigazione programmatica
await router.push('/dashboard/overview');
await router.replace('/users/42');
router.back();

// Navigation guard (restituisci false per annullare)
const off = router.beforeEach(async ({ from, to }) => {
  if (to.startsWith('/admin') && !isAdmin()) return false;
});

// Reagisci ai cambiamenti
router.onChange(({ from, to, toRoute }) => {
  console.log(`navigato ${from} → ${to}`, toRoute?.params);
});

// Oppure usa l'helper di navigazione dell'orchestrator
await orchestrator.navigateTo('/settings');
```

---

## 🏗️ Architettura

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

## 📦 Pacchetti

| Pacchetto | Descrizione |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | Pacchetto ombrello tutto-in-uno |
| [`@tuvix.js/core`](./packages/core) | Core Orchestrator with Lifecycle management |
| [`@tuvix.js/router`](./packages/router) | Routing delle micro app basato su URL |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Event bus per la comunicazione tra app |
| [`@tuvix.js/loader`](./packages/loader) | Caricatore dinamico di moduli |
| [`@tuvix.js/sandbox`](./packages/sandbox) | Isolamento CSS/JS (Shadow DOM + Proxy) |
| [`@tuvix.js/react`](./packages/react) | Binding e hook per React 18+ |
| [`@tuvix.js/vue`](./packages/vue) | Binding e composables per Vue 3 |
| [`@tuvix.js/svelte`](./packages/svelte) | Binding per Svelte 3-5 |
| [`@tuvix.js/angular`](./packages/angular) | Binding per Angular 15+ |
| [`create-tuvix-app`](./packages/cli) | Strumento CLI di scaffolding |
| [`@tuvix.js/devtools`](./packages/devtools) | Pannello di debug in-page |
| [`@tuvix.js/server`](./packages/server) | Composizione lato server |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Integrazione Webpack Module Federation |

---

## 📁 Struttura del Progetto

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
│   └── tuvix/              # tuvix.js (ombrello)
├── examples/
│   ├── with-angular/              # Esempio Angular 15+
│   ├── with-module-federation-react/ # Esempio Module Federation + React
│   ├── with-multiple-frameworks/  # Esempio più framework
│   ├── with-react/                # Esempio React 18+
│   ├── with-react-devtools/       # Esempio React + DevTools
│   ├── with-react-event-bus/      # Esempio React + Event Bus
│   ├── with-react-router/         # Esempio React + Router
│   ├── with-react-sandbox/        # Esempio React + Sandbox
│   ├── with-ssr-react/            # Esempio SSR + React
│   ├── with-ssr-vanilla/          # Esempio SSR + Vanilla JS
│   ├── with-svelte/               # Esempio Svelte 5
│   ├── with-vanilla/              # Esempio Vanilla JS
│   └── with-vue/                  # Esempio Vue 3
├── website/                # Sito di documentazione (VitePress, 10 lingue)
├── .github/                # Workflow CI/CD
├── package.json            # Configurazione root del workspace
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── vitest.config.ts
```

---

## 🗺️ Roadmap

### ✅ Completati

- [x] Core Orchestrator
- [x] Gestione del Lifecycle
- [x] Caricamento dinamico dei moduli
- [x] Event bus
- [x] Routing URL con modalità history/hash
- [x] Isolamento sandbox CSS/JS
- [x] Strumento CLI di scaffolding (`npx create-tuvix-app`)
- [x] Estensione browser DevTools
- [x] Composizione lato server
- [x] Supporto module federation
- [x] Binding per framework (React, Vue, Svelte, Angular)
- [x] Documentazione i18n (10 lingue)

### 🔜 In Arrivo

- [ ] Hot module reload tra micro app
- [ ] Adattatore per la gestione dello stato condiviso
- [ ] Strategie di preloading e prefetching
- [ ] Sistema di plugin e API middleware
- [ ] Grafo visuale delle dipendenze nei DevTools
- [ ] Utility di testing e mock orchestrator
- [ ] Supporto ESM nativo / importmap
- [ ] Composizione server-side per Edge/CDN
- [ ] Estensione VS Code per integrazione DevTools
- [ ] Integrazione Storybook per l'isolamento delle micro app

---

## 🧪 Esempi

Esempi pronti all'uso per ogni framework supportato sono disponibili nella directory [`examples/`](./examples):

| Esempio | Framework | Percorso |
| --- | --- | --- |
| [Esempio Angular](./examples/with-angular) | Angular 15+ | `examples/with-angular/` |
| [Esempio Module Federation + React](./examples/with-module-federation-react) | React 18+ | `examples/with-module-federation-react/` |
| [Esempio Più Framework](./examples/with-multiple-frameworks) | Misto | `examples/with-multiple-frameworks/` |
| [Esempio React](./examples/with-react) | React 18+ | `examples/with-react/` |
| [Esempio React + DevTools](./examples/with-react-devtools) | React 18+ | `examples/with-react-devtools/` |
| [Esempio React + Event Bus](./examples/with-react-event-bus) | React 18+ | `examples/with-react-event-bus/` |
| [Esempio React + Router](./examples/with-react-router) | React 18+ | `examples/with-react-router/` |
| [Esempio React + Sandbox](./examples/with-react-sandbox) | React 18+ | `examples/with-react-sandbox/` |
| [Esempio SSR + React](./examples/with-ssr-react) | React 18+ | `examples/with-ssr-react/` |
| [Esempio SSR + Vanilla JS](./examples/with-ssr-vanilla) | Nessun framework | `examples/with-ssr-vanilla/` |
| [Esempio Svelte](./examples/with-svelte) | Svelte 5 | `examples/with-svelte/` |
| [Esempio Vanilla JS](./examples/with-vanilla) | Nessun framework | `examples/with-vanilla/` |
| [Esempio Vue](./examples/with-vue) | Vue 3 | `examples/with-vue/` |

Ogni esempio dimostra:

- Un'applicazione **shell (host)** che avvia l'orchestratore
- Due **app micro frontend** registrate e caricate dinamicamente
- Comunicazione tra app tramite l'event bus

---

## 🤝 Contribuire

I contributi sono benvenuti! Per favore leggi la [Guida ai Contributi](./CONTRIBUTING.md) prima di inviare una PR.

```bash
# Clona il repository
git clone https://github.com/yasinatesim/tuvix.js.git

# Installa le dipendenze
pnpm install

# Compila tutti i pacchetti
pnpm build

# Esegui i test
pnpm test
```

---

## 🔑 Licenza

Copyright © 2026 - Licenza MIT.
Consulta [LICENSE](./LICENSE) per maggiori informazioni.

---

<p align="center">This README was generated by <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> 🥲</p>

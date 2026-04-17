<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  Un framework <strong>microfrontend</strong> léger et flexible pour construire des applications frontend évolutives et déployables indépendamment.<br/>
  Tuvix.js fusionne plusieurs applications frontend en une expérience utilisateur fluide et unifiée - comme son nom le suggère.
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

## ✨ Fonctionnalités

- 🧩 **Agnostique au framework** - Utilisez React, Vue, Svelte, Angular ou Vanilla JS
- 📦 **Deployment indépendant** - Déployez chaque micro-application séparément
- 🔗 **Chargement dynamique de modules** - Chargez les microfrontends à la demande
- 🛣️ **Routage intégré** - Routage transparent entre les micro-applications
- 📡 **Communication inter-applications** - Bus d'événements pour la messagerie entre applications
- ⚡ **Lightweight** - Zéro dépendance d'exécution, noyau minimal
- 🔄 **Gestion du Lifecycle** - Hooks de montage, démontage et mise à jour
- 🔒 **Type-Safe** - Support complet de TypeScript avec des types stricts

---

## 🤖 Générateur de Composants IA

Générez des composants tuvix.js à partir du langage naturel grâce à notre chatbot IA intégré.

- **Modèle de chat :** MiniMax M2.5 via OpenRouter (API gratuite, aucun hébergement requis)
- **Modèle d'embedding :** NVIDIA Nemotron Embed 1B via OpenRouter (récupération RAG)
- **Supporte :** React, Vue, Svelte, Angular
- **Dataset :** [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset) sur HuggingFace

---

## 📦 Installation

```bash
# Package tout-en-un
npm install tuvix.js

# Ou installer les packages individuellement
npm install @tuvix.js/core @tuvix.js/router
```

---

## 🚀 Démarrage rapide

### Application hôte (Shell)

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

### Application Micro Frontend

```ts
import { defineMicroApp } from 'tuvix.js';

let titleEl: HTMLHeadingElement | null = null;

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    // Configuration unique avant le premier mount (préchargement de données, etc.)
    console.log('Dashboard initialisé');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>Bienvenue, ${props?.user ?? 'Invité'} !</h1>`;
    titleEl = container.querySelector('h1');
  },

  unmount({ container }) {
    titleEl = null;
    container.innerHTML = '';
  },

  // Déclenché quand le shell appelle orchestrator.updateAppProps(name, props).
  // Patch le DOM en place — pas de remount, pas de flash.
  update({ props }) {
    if (titleEl) {
      titleEl.textContent = `Bienvenue, ${props?.user ?? 'Invité'} !`;
    }
  },
});
```

---

## 🔄 Mise à jour des Props à l'exécution

Passez de nouvelles props à une micro-app montée sans la remonter :

```ts
// Pousser des props mises à jour depuis le shell — invoque le hook update() de la micro-app
await orchestrator.updateAppProps('dashboard', {
  user: 'Yasin',
  theme: 'dark',
});
```

Les props sont fusionnées avec les props originales du config. Si l'app ne
définit pas `update()`, les nouvelles props sont stockées et appliquées au
prochain mount.

---

## 🧭 Contrôle Manuel du Cycle de Vie

```ts
// Mount / unmount manuel en dehors de la réconciliation des routes
await orchestrator.mountApp('dashboard');
await orchestrator.unmountApp('dashboard');

// Inspecter l'état actuel
orchestrator.getAppStatus('dashboard');     // 'mounted' | 'mounting' | 'error' | ...
orchestrator.getMountedApps();              // ['dashboard']
orchestrator.getRegisteredApps();           // ['dashboard', 'settings']

// Tout détruire (idempotent — sûr d'appeler plusieurs fois)
await orchestrator.destroy();
```

---

## 🌉 Pont vers un Router Externe

Si vous utilisez déjà TanStack Router, Next.js App Router ou React Router,
omettez complètement `config.router` et laissez votre router existant piloter
Tuvix.js via `reconcile(path)` :

```ts
const orchestrator = createOrchestrator(); // pas de config router

orchestrator.register({
  name: 'dashboard',
  entry: '/dashboard.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();

// Après chaque navigation, indiquez à tuvix.js le chemin actuel
tanstackRouter.subscribe('onLoad', () => {
  orchestrator.reconcile(window.location.pathname);
});
```

---

## 👁️ Mount Différé (Viewport)

Différez les micro-apps coûteuses jusqu'à ce que leur conteneur entre dans le viewport :

```ts
orchestrator.register({
  name: 'comments',
  entry: '/comments.js',
  container: '#comments-section',
  mountWhenVisible: true, // monte au premier impact de l'IntersectionObserver
});
```

---

## 🛟 HTML de Repli en Cas d'Échec

```ts
orchestrator.register({
  name: 'reports',
  entry: '/reports.js',
  container: '#reports',
  activeWhen: '/reports/*',
  fallback: '<p class="error">Reports temporairement indisponible.</p>',
});
```

---

## ⚡ Stratégies de Préchargement

```ts
const orchestrator = createOrchestrator({
  router: { /* ... */ },
  prefetch: {
    strategy: 'idle', // 'immediate' | 'idle' | 'hover' | 'none' (par défaut)
  },
});
```

| Stratégie | Quand les bundles sont chargés |
| --- | --- |
| `immediate` | Juste après `start()` |
| `idle` | À la prochaine fenêtre d'inactivité du navigateur (`requestIdleCallback`) |
| `hover` | Au premier `mouseover` de l'utilisateur n'importe où sur la page |
| `none` | Jamais (par défaut) — uniquement à la demande |

---

## 🔌 Communication inter-applications

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// App A — émettre un événement
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// App B — s'abonner (retourne une fonction d'unsubscribe)
const unsubscribe = bus.on('user:login', (data) => {
  console.log(`${data.name} s'est connecté !`);
});

// Déclencher une fois et se désabonner automatiquement
bus.once('app:ready', () => console.log('prêt'));

// Écouter tous les événements pour le débogage
bus.onAny((event, data) => console.log('[bus]', event, data));

// Nettoyage
unsubscribe();
```

L'orchestrator expose son propre bus via `orchestrator.getEventBus()` pour que
toutes les apps enregistrées partagent automatiquement un seul canal.

---

## 🛣️ Routage

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // ou 'hash'
  base: '/',       // chemin de base optionnel
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'users' },
    { path: '/settings', app: 'settings', exact: true },
  ],
});

// Navigation programmatique
await router.push('/dashboard/overview');
await router.replace('/users/42');
router.back();

// Navigation guards (retournez false pour annuler)
const off = router.beforeEach(async ({ from, to }) => {
  if (to.startsWith('/admin') && !isAdmin()) return false;
});

// Réagir aux changements
router.onChange(({ from, to, toRoute }) => {
  console.log(`navigué ${from} → ${to}`, toRoute?.params);
});

// Ou utilisez le helper de navigation de l'orchestrator
await orchestrator.navigateTo('/settings');
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
| [`tuvix.js`](./packages/tuvix) | Package tout-en-un |
| [`@tuvix.js/core`](./packages/core) | Core Orchestrator with Lifecycle management |
| [`@tuvix.js/router`](./packages/router) | Routage de micro-applications basé sur les URL |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Bus d'événements pour la communication inter-applications |
| [`@tuvix.js/loader`](./packages/loader) | Chargeur dynamique de modules |
| [`@tuvix.js/sandbox`](./packages/sandbox) | Isolation CSS/JS (Shadow DOM + Proxy) |
| [`@tuvix.js/react`](./packages/react) | Bindings et hooks React 18+ |
| [`@tuvix.js/vue`](./packages/vue) | Bindings et composables Vue 3 |
| [`@tuvix.js/svelte`](./packages/svelte) | Bindings Svelte 3-5 |
| [`@tuvix.js/angular`](./packages/angular) | Bindings Angular 15+ |
| [`create-tuvix-app`](./packages/cli) | Outil CLI de scaffolding |
| [`@tuvix.js/devtools`](./packages/devtools) | Panneau de débogage intégré à la page |
| [`@tuvix.js/server`](./packages/server) | Composition côté serveur |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Intégration Webpack Module Federation |

---

## 📁 Structure du projet

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
│   └── tuvix/              # tuvix.js (package global)
├── examples/
│   ├── with-angular/              # Exemple Angular 15+
│   ├── with-module-federation-react/ # Exemple Module Federation + React
│   ├── with-multiple-frameworks/  # Exemple plusieurs frameworks
│   ├── with-react/                # Exemple React 18+
│   ├── with-react-devtools/       # Exemple React + DevTools
│   ├── with-react-event-bus/      # Exemple React + Event Bus
│   ├── with-react-router/         # Exemple React + Router
│   ├── with-react-sandbox/        # Exemple React + Sandbox
│   ├── with-ssr-react/            # Exemple SSR + React
│   ├── with-ssr-vanilla/          # Exemple SSR + Vanilla JS
│   ├── with-svelte/               # Exemple Svelte 5
│   ├── with-vanilla/              # Exemple Vanilla JS
│   └── with-vue/                  # Exemple Vue 3
├── website/                # Site de documentation (VitePress, 10 langues)
├── .github/                # Workflows CI/CD
├── package.json            # Configuration racine du workspace
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── vitest.config.ts
```

---

## 🗺️ Feuille de route

### ✅ Terminé

- [x] Core Orchestrator
- [x] Gestion du Lifecycle
- [x] Chargement dynamique de modules
- [x] Bus d'événements
- [x] Routage URL avec modes history/hash
- [x] Isolation sandbox CSS/JS
- [x] Outil CLI de scaffolding (`npx create-tuvix-app`)
- [x] Extension navigateur DevTools
- [x] Composition côté serveur
- [x] Support du module federation
- [x] Bindings de frameworks (React, Vue, Svelte, Angular)
- [x] Documentation i18n (10 langues)

### 🔜 Prochainement

- [ ] Rechargement de modules à chaud entre micro-applications
- [ ] Adaptateur de gestion d'état partagé
- [ ] Stratégies de préchargement et prefetching
- [ ] Système de plugins et API middleware
- [ ] Graphe visuel des dépendances dans DevTools
- [ ] Utilitaires de test et orchestrateur mock
- [ ] Support natif ESM / importmap
- [ ] Composition serveur compatible Edge/CDN
- [ ] Extension VS Code pour l'intégration DevTools
- [ ] Intégration Storybook pour l'isolation des micro-applications

---

## 🧪 Exemples

Des exemples prêts à l'emploi pour chaque framework supporté sont disponibles dans le répertoire [`examples/`](./examples) :

| Exemple | Framework | Chemin |
| --- | --- | --- |
| [Exemple Angular](./examples/with-angular) | Angular 15+ | `examples/with-angular/` |
| [Exemple Module Federation + React](./examples/with-module-federation-react) | React 18+ | `examples/with-module-federation-react/` |
| [Exemple Plusieurs Frameworks](./examples/with-multiple-frameworks) | Mixte | `examples/with-multiple-frameworks/` |
| [Exemple React](./examples/with-react) | React 18+ | `examples/with-react/` |
| [Exemple React + DevTools](./examples/with-react-devtools) | React 18+ | `examples/with-react-devtools/` |
| [Exemple React + Event Bus](./examples/with-react-event-bus) | React 18+ | `examples/with-react-event-bus/` |
| [Exemple React + Router](./examples/with-react-router) | React 18+ | `examples/with-react-router/` |
| [Exemple React + Sandbox](./examples/with-react-sandbox) | React 18+ | `examples/with-react-sandbox/` |
| [Exemple SSR + React](./examples/with-ssr-react) | React 18+ | `examples/with-ssr-react/` |
| [Exemple SSR + Vanilla JS](./examples/with-ssr-vanilla) | Sans framework | `examples/with-ssr-vanilla/` |
| [Exemple Svelte](./examples/with-svelte) | Svelte 5 | `examples/with-svelte/` |
| [Exemple Vanilla JS](./examples/with-vanilla) | Sans framework | `examples/with-vanilla/` |
| [Exemple Vue](./examples/with-vue) | Vue 3 | `examples/with-vue/` |

Chaque exemple illustre :

- Une application **hôte (shell)** qui démarre l'orchestrateur
- Deux **micro-applications frontend** enregistrées et chargées dynamiquement
- La communication inter-applications via le bus d'événements

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Veuillez lire le [Guide de contribution](./CONTRIBUTING.md) avant de soumettre une PR.

```bash
# Cloner le dépôt
git clone https://github.com/yasinatesim/tuvix.js.git

# Installer les dépendances
pnpm install

# Compiler tous les packages
pnpm build

# Lancer les tests
pnpm test
```

---

## 🔑 Licence

Copyright © 2026 - Licence MIT.
Voir [LICENSE](./LICENSE) pour plus d'informations.

---

<p align="center">Ce README a été généré par <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> 🥲</p>

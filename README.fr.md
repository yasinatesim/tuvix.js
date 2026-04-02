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

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    console.log('Dashboard initialisé');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>Bienvenue, ${props?.user} !</h1>`;
  },

  unmount({ container }) {
    container.innerHTML = '';
  },

  update({ props }) {
    console.log('Props mises à jour :', props);
  },
});
```

---

## 🔌 Communication inter-applications

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// App A - émettre un événement
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// App B - écouter un événement
bus.on('user:login', (data) => {
  console.log(`${data.name} s'est connecté !`);
});
```

---

## 🛣️ Routage

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
│   ├── react/              # Exemple React 18+
│   ├── vue/                # Exemple Vue 3
│   ├── svelte/             # Exemple Svelte 5
│   ├── angular/            # Exemple Angular 15+
│   └── vanilla/            # Exemple Vanilla JS
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
| [Exemple React](./examples/with-react) | React 18+ | `examples/with-react/` |
| [Exemple Vue](./examples/with-vue) | Vue 3 | `examples/with-vue/` |
| [Exemple Svelte](./examples/with-svelte) | Svelte 5 | `examples/with-svelte/` |
| [Exemple Angular](./examples/with-angular) | Angular 15+ | `examples/with-angular/` |
| [Exemple Vanilla JS](./examples/with-vanilla) | Sans framework | `examples/with-vanilla/` |
| [Exemple Vanilla JS + SSR](./examples/with-ssr-vanilla) | Sans framework | `examples/with-ssr-vanilla/` |

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

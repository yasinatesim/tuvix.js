---
title: Paquets
---

# Paquets

Tuvix.js est distribué sous forme de 15 paquets : 13 bibliothèques `@tuvix.js/*` à portée (scoped), le paquet tout-en-un `tuvix.js` et l'outil de scaffolding `create-tuvix-app`. Installez ceux que votre app importe.

<PackagesOverview />

## Tout installer {#install-everything}

```bash
npm install tuvix.js
```

Le [paquet tout-en-un `tuvix.js`](/fr/packages/tuvix) réexporte core, router, event bus, loader et sandbox. Il n'inclut pas les adaptateurs de framework, `@tuvix.js/server`, `@tuvix.js/vite`, `@tuvix.js/devtools` ni `@tuvix.js/module-federation` ; installez-les séparément.

## Paquets individuels {#individual-packages}

```bash
# Core
npm install @tuvix.js/core
npm install @tuvix.js/router
npm install @tuvix.js/event-bus
npm install @tuvix.js/loader
npm install @tuvix.js/sandbox

# Framework adapters (install the one each micro app uses)
npm install @tuvix.js/react
npm install @tuvix.js/vue
npm install @tuvix.js/svelte
npm install @tuvix.js/angular

# Server rendering and build tooling
npm install @tuvix.js/server
npm install -D @tuvix.js/vite
npm install @tuvix.js/module-federation
npm install @tuvix.js/devtools

# Scaffold a new project
npx create-tuvix-app my-app
```

Avec pnpm, remplacez `npm install` par `pnpm add`.

---
title: Pacchetti
---

# Pacchetti

Tuvix.js è distribuito in 15 pacchetti: 13 librerie con scope `@tuvix.js/*`, il pacchetto ombrello `tuvix.js` e lo scaffolder `create-tuvix-app`. Installa quelli che la tua app importa.

<PackagesOverview />

## Installa tutto

```bash
npm install tuvix.js
```

Il [pacchetto ombrello `tuvix.js`](/it/packages/tuvix) riesporta core, router, event bus, loader e sandbox. Non include gli adapter per i framework, `@tuvix.js/server`, `@tuvix.js/vite`, `@tuvix.js/devtools` né `@tuvix.js/module-federation`: installali separatamente.

## Pacchetti singoli

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

Con pnpm, sostituisci `npm install` con `pnpm add`.

---
title: Paquetes
---

# Paquetes

Tuvix.js se distribuye en 15 paquetes: 13 librerías con scope `@tuvix.js/*`, el paquete paraguas `tuvix.js` y el generador de proyectos `create-tuvix-app`. Instala los que importa tu app.

<PackagesOverview />

## Instalar todo

```bash
npm install tuvix.js
```

El [paquete paraguas `tuvix.js`](/es/packages/tuvix) reexporta core, router, event bus, loader y sandbox. No incluye los adaptadores de framework, `@tuvix.js/server`, `@tuvix.js/vite`, `@tuvix.js/devtools` ni `@tuvix.js/module-federation`; instálalos por separado.

## Paquetes individuales

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

Con pnpm, reemplaza `npm install` por `pnpm add`.

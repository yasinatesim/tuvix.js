---
title: Pakete
---

# Pakete

Tuvix.js besteht aus 15 Paketen: 13 Bibliotheken unter dem Scope `@tuvix.js/*`, dem Gesamtpaket `tuvix.js` und dem Scaffolder `create-tuvix-app`. Installiere die Pakete, die deine App importiert.

<PackagesOverview />

## Alles installieren

```bash
npm install tuvix.js
```

Das [Gesamtpaket `tuvix.js`](/de/packages/tuvix) re-exportiert Core, Router, Event Bus, Loader und Sandbox. Die Framework-Adapter, `@tuvix.js/server`, `@tuvix.js/vite`, `@tuvix.js/devtools` und `@tuvix.js/module-federation` enthält es nicht. Diese installierst du separat.

## Einzelne Pakete

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

Mit pnpm ersetzt du `npm install` durch `pnpm add`.

---
title: Packages
---

# Packages

Tuvix.js ships as 15 packages: 13 scoped `@tuvix.js/*` libraries, the `tuvix.js` umbrella and the `create-tuvix-app` scaffolder. Install the ones your app imports.

<PackagesOverview />

## Install Everything

```bash
npm install tuvix.js
```

The [`tuvix.js` umbrella](/packages/tuvix) re-exports core, router, event bus, loader and sandbox. It does not include the framework adapters, `@tuvix.js/server`, `@tuvix.js/vite`, `@tuvix.js/devtools` or `@tuvix.js/module-federation`; install those on their own.

## Individual Packages

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

With pnpm, replace `npm install` with `pnpm add`.

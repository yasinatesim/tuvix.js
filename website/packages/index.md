---
title: Packages
---

# Packages

Tuvix.js ships as **14 focused, independently versioned packages**. Install only what you need.

<PackagesOverview />

## Install Everything

```bash
npm install tuvix.js
```

The `tuvix.js` umbrella package re-exports all core packages for convenience.

## Individual Packages

```bash
# Core
npm install @tuvix.js/core
npm install @tuvix.js/router
npm install @tuvix.js/event-bus
npm install @tuvix.js/loader
npm install @tuvix.js/sandbox

# Framework bindings (install the one you need)
npm install @tuvix.js/react
npm install @tuvix.js/vue
npm install @tuvix.js/svelte
npm install @tuvix.js/angular

# Tooling
npm install @tuvix.js/devtools
npm install @tuvix.js/server
npm install @tuvix.js/module-federation

# CLI
npx create-tuvix-app my-app
```

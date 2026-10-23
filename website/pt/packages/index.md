---
title: Pacotes
---

# Pacotes

O Tuvix.js é distribuído como 15 pacotes: 13 bibliotecas com escopo `@tuvix.js/*`, o pacote guarda-chuva `tuvix.js` e o gerador de projetos `create-tuvix-app`. Instale os que o seu app importa.

<PackagesOverview />

## Instalar tudo

```bash
npm install tuvix.js
```

O [pacote guarda-chuva `tuvix.js`](/pt/packages/tuvix) reexporta core, router, event bus, loader e sandbox. Ele não inclui os adaptadores de framework, `@tuvix.js/server`, `@tuvix.js/vite`, `@tuvix.js/devtools` nem `@tuvix.js/module-federation`; instale esses separadamente.

## Pacotes individuais

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

Com pnpm, substitua `npm install` por `pnpm add`.

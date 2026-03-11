# Démarrage Rapide

## Installation

```bash
npm install tuvix.js
```

## Scaffolding avec CLI

```bash
npx create-tuvix-app mon-app
cd mon-app
npm install
npm run dev
```

## Configuration de Base

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });
const router = createRouter({
  orchestrator,
  routes: [
    { path: '/', app: 'accueil' },
    { path: '/tableau-de-bord', app: 'tableau-de-bord' },
  ],
});
orchestrator.start();
```

Documentation complète → [Getting Started](/guide/getting-started)

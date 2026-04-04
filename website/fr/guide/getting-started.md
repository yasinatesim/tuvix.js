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

## Avec React

```tsx
import { createReactMicroApp } from '@tuvix.js/react';
import Dashboard from './Dashboard';

export const app = createReactMicroApp(Dashboard);
```

## Avec Vue

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Dashboard from './Dashboard.vue';

export const app = createVueMicroApp(Dashboard);
```

## Prochaines Étapes

- Lisez la [Vue d'ensemble de l'architecture](/fr/guide/architecture)
- Explorez les [Lifecycle Hooks](/fr/guide/lifecycle)
- Configurez l'[Event Bus](/fr/guide/event-bus)
- Découvrez le [Sandboxing](/fr/guide/sandbox)

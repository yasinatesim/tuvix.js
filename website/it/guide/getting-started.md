# Per Iniziare

## Installazione

```bash
npm install tuvix.js
```

## Scaffolding con CLI

```bash
npx create-tuvix-app mia-app
cd mia-app
npm install
npm run dev
```

## Configurazione di Base

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });
const router = createRouter({
  orchestrator,
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
  ],
});
orchestrator.start();
```

## Con React

```tsx
import { createReactMicroApp } from '@tuvix.js/react';
import Dashboard from './Dashboard';

export const app = createReactMicroApp(Dashboard);
```

## Con Vue

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Dashboard from './Dashboard.vue';

export const app = createVueMicroApp(Dashboard);
```

## Prossimi Passi

- Leggi la [Panoramica dell'Architettura](/it/guide/architecture)
- Esplora i [Lifecycle Hooks](/it/guide/lifecycle)
- Configura l'[Event Bus](/it/guide/event-bus)
- Scopri il [Sandboxing](/it/guide/sandbox)

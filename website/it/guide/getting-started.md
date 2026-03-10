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

Documentazione completa → [Getting Started (EN)](/guide/getting-started)

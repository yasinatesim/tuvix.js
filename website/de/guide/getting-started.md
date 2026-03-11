# Erste Schritte

## Installation

```bash
npm install tuvix.js
```

## Schnellstart mit CLI

```bash
npx create-tuvix-app meine-app
cd meine-app
npm install
npm run dev
```

## Grundkonfiguration

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });
const router = createRouter({
  orchestrator,
  routes: [
    { path: '/', app: 'startseite' },
    { path: '/dashboard', app: 'dashboard' },
  ],
});
orchestrator.start();
```

Vollständige Dokumentation → [Getting Started](/guide/getting-started)

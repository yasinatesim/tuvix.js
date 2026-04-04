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

## Mit React

```tsx
import { createReactMicroApp } from '@tuvix.js/react';
import Dashboard from './Dashboard';

export const app = createReactMicroApp(Dashboard);
```

## Mit Vue

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Dashboard from './Dashboard.vue';

export const app = createVueMicroApp(Dashboard);
```

## Nächste Schritte

- Lesen Sie die [Architektur-Übersicht](/de/guide/architecture)
- Erkunden Sie [Lifecycle Hooks](/de/guide/lifecycle)
- Richten Sie den [Event Bus](/de/guide/event-bus) ein
- Erfahren Sie mehr über [Sandboxing](/de/guide/sandbox)

# Primeros Pasos

## Instalación

```bash
npm install tuvix.js
# o
pnpm add tuvix.js
# o
yarn add tuvix.js
```

## Scaffolding con CLI

```bash
npx create-tuvix-app mi-app
cd mi-app
npm install
npm run dev
```

## Configuración Básica

```ts
// shell/main.ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });

const router = createRouter({
  orchestrator,
  routes: [
    { path: '/', app: 'inicio' },
    { path: '/panel', app: 'panel' },
  ],
});

orchestrator.register('inicio', {
  entry: 'https://cdn.example.com/inicio/main.js',
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

## Próximos Pasos

- Lea la [Descripción de la Arquitectura](/es/guide/architecture)
- Explore los [Lifecycle Hooks](/es/guide/lifecycle)
- Configure el [Event Bus](/es/guide/event-bus)
- Conozca el [Sandboxing](/es/guide/sandbox)

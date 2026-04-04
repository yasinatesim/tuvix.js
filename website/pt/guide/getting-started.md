# Primeiros Passos

## Instalação

```bash
npm install tuvix.js
```

## Scaffolding com CLI

```bash
npx create-tuvix-app meu-app
cd meu-app
npm install
npm run dev
```

## Configuração Básica

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });
const router = createRouter({
  orchestrator,
  routes: [
    { path: '/', app: 'inicio' },
    { path: '/painel', app: 'painel' },
  ],
});
orchestrator.start();
```

## Com React

```tsx
import { createReactMicroApp } from '@tuvix.js/react';
import Dashboard from './Dashboard';

export const app = createReactMicroApp(Dashboard);
```

## Com Vue

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Dashboard from './Dashboard.vue';

export const app = createVueMicroApp(Dashboard);
```

## Próximos Passos

- Leia a [Visão Geral da Arquitetura](/pt/guide/architecture)
- Explore os [Lifecycle Hooks](/pt/guide/lifecycle)
- Configure o [Event Bus](/pt/guide/event-bus)
- Aprenda sobre [Sandboxing](/pt/guide/sandbox)

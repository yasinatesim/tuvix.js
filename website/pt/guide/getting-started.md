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

Documentação completa → [Getting Started](/guide/getting-started)

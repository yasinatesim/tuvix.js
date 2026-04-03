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

## Crear una Micro App

```ts
// panel/main.ts
import type { MicroApp } from '@tuvix.js/core';

export const app: MicroApp = {
  async mount(container, props) {
    container.innerHTML = `<h1>Panel</h1>`;
  },
  async unmount(container) {
    container.innerHTML = '';
  },
};
```

Para documentación completa → [Getting Started](/es/guide/getting-started)

# Getting Started

## Installation

Install the umbrella package (all packages in one):

```bash
npm install tuvix.js
# or
pnpm add tuvix.js
# or
yarn add tuvix.js
```

Or install only the packages you need:

```bash
npm install @tuvix.js/core @tuvix.js/router @tuvix.js/event-bus @tuvix.js/loader
```

## Scaffold with CLI

The fastest way to get started is with `create-tuvix-app`:

```bash
npx create-tuvix-app my-app
cd my-app
npm install
npm run dev
```

## Basic Setup

### 1. Create the Shell Application

The **shell** (also called the host) is the root application that orchestrates all micro apps.

```ts
// shell/main.ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({
  container: '#app',
});

const router = createRouter({
  orchestrator,
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    { path: '/profile', app: 'profile' },
  ],
});

// Register micro apps
orchestrator.register('home', {
  entry: 'https://cdn.example.com/home/main.js',
});

orchestrator.register('dashboard', {
  entry: 'https://cdn.example.com/dashboard/main.js',
});

// Start the orchestrator
orchestrator.start();
```

### 2. Create a Micro App

Each micro app exports a standard lifecycle object:

```ts
// dashboard/main.ts
import type { MicroAppDefinition } from '@tuvix.js/core';

export const app: MicroApp = {
  async mount(container, props) {
    container.innerHTML = `
      <div>
        <h1>Dashboard</h1>
        <p>Hello, ${props?.user ?? 'Guest'}!</p>
      </div>
    `;
  },

  async unmount(container) {
    container.innerHTML = '';
  },

  async update(container, props) {
    // Re-render when props change
  },
};
```

### 3. Build and Deploy Independently

Each micro app is built and deployed independently. The shell just references their entry URLs:

```bash
# Build the dashboard micro app
cd packages/dashboard
npm run build
# → uploads dist/ to CDN
```

## With React

```tsx
// dashboard/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Welcome, {user}!</h1>;
}

export const app = createReactMicroApp(Dashboard);
```

## With Vue

```ts
// dashboard/main.ts
import { createApp } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';
import Dashboard from './Dashboard.vue';

export const app = createVueMicroApp(Dashboard);
```

## Next Steps

- Read the [Architecture Overview](/guide/architecture) to understand how Tuvix.js works
- Explore [Lifecycle Hooks](/guide/lifecycle) for fine-grained control
- Set up [Event Bus](/guide/event-bus) for cross-app communication
- Learn about [Sandboxing](/guide/sandbox) for style and script isolation

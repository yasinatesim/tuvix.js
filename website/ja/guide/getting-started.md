# Getting Started

## Installation

Install the umbrella package (everything in one):

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

## Scaffold with the CLI

The fastest way to get started is `create-tuvix-app`:

```bash
npx create-tuvix-app my-app
cd my-app
pnpm install
pnpm dev
```

## Basic Setup

### 1. Create the Shell Application

The **shell** (also called the host) is the root application that orchestrates
all micro apps.

```ts
// shell/main.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/', app: 'home' },
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/profile/*', app: 'profile' },
    ],
  },
});

orchestrator.register({
  name: 'home',
  entry: 'https://cdn.example.com/home/main.js',
  container: '#app',
  activeWhen: '/',
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { theme: 'dark' },
});

await orchestrator.start();
```

### 2. Create a Micro App

Each micro app exports a module that implements the lifecycle interface. The
helper `defineMicroApp` is purely a typed identity function — you can also
construct the object by hand.

```ts
// dashboard/main.ts
import { defineMicroApp } from '@tuvix.js/core';

let titleEl: HTMLHeadingElement | null = null;

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    // One-time setup before the first mount
  },

  mount({ container, props }) {
    container.innerHTML = `
      <div>
        <h1>Welcome, ${props?.user ?? 'Guest'}!</h1>
      </div>
    `;
    titleEl = container.querySelector('h1');
  },

  unmount({ container }) {
    titleEl = null;
    container.innerHTML = '';
  },

  // Triggered by orchestrator.updateAppProps('dashboard', { user: 'Yasin' }).
  update({ props }) {
    if (titleEl) {
      titleEl.textContent = `Welcome, ${props?.user ?? 'Guest'}!`;
    }
  },
});
```

> Apps must register themselves on `window.__TUVIX_MODULES__[name]` so the
> loader can resolve them. The `defineMicroApp` helper does **not** do this
> for you in pure TypeScript — but the framework adapters
> (`createReactMicroApp`, `createVueMicroApp`, etc.) do.

### 3. Build and Deploy Independently

Each micro app is built and deployed independently. The shell only references
their entry URLs:

```bash
cd packages/dashboard
pnpm build
# → upload dist/ to your CDN
```

## With React

```tsx
// dashboard/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Welcome, {user}!</h1>;
}

export default createReactMicroApp({
  name: 'dashboard',
  App: Dashboard,
});
```

## With Vue

```ts
// dashboard/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Dashboard from './Dashboard.vue';

export default createVueMicroApp({
  name: 'dashboard',
  App: Dashboard,
});
```

## With Svelte

```ts
// dashboard/main.ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Dashboard from './Dashboard.svelte';

export default createSvelteMicroApp({
  name: 'dashboard',
  App: Dashboard,
});
```

## With Angular (standalone, 17+)

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { DashboardComponent } from './dashboard.component';

export default createSsrAngularMicroApp({
  name: 'dashboard',
  component: DashboardComponent,
});
```

## Updating Props at Runtime

```ts
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

If the app implements `update()`, it receives the merged props in place. If
not, the new props are stored and applied at the next mount.

## Next Steps

- Read the [Architecture Overview](/guide/architecture) for the design
- Explore [Lifecycle Hooks](/guide/lifecycle) for fine-grained control
- Set up the [Event Bus](/guide/event-bus) for cross-app communication
- Learn about [Sandboxing](/guide/sandbox) for style and script isolation

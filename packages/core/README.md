# @tuvix.js/core

> Core orchestrator for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

## Quick Start

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard/*',
  props: { theme: 'dark' },
});

await orchestrator.start();
```

## Defining a Micro App

```ts
import { defineMicroApp } from '@tuvix.js/core';

let titleEl: HTMLHeadingElement | null = null;

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    // One-time setup before the first mount
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>Hi, ${props?.user ?? 'Guest'}!</h1>`;
    titleEl = container.querySelector('h1');
  },

  unmount({ container }) {
    titleEl = null;
    container.innerHTML = '';
  },

  // Called when orchestrator.updateAppProps(name, props) runs.
  update({ props }) {
    if (titleEl) titleEl.textContent = `Hi, ${props?.user ?? 'Guest'}!`;
  },
});
```

## Updating Props at Runtime

```ts
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

If the app implements `update()`, it is called with the merged props.
Otherwise the new props are stored and applied on the next mount.

## Manual Lifecycle Control

```ts
await orchestrator.mountApp('dashboard');
await orchestrator.unmountApp('dashboard');
await orchestrator.unregister('dashboard');

orchestrator.getAppStatus('dashboard');   // 'mounted' | 'mounting' | 'error' | ...
orchestrator.getMountedApps();            // ['dashboard']
orchestrator.getRegisteredApps();         // ['dashboard']

await orchestrator.destroy();             // idempotent
```

## Bridging an External Router

Skip `config.router` and let TanStack Router / Next.js / React Router drive
reconciliation manually:

```ts
const orchestrator = createOrchestrator(); // no router

orchestrator.register({
  name: 'dashboard',
  entry: '/dashboard.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();

router.subscribe('onLoad', () => {
  orchestrator.reconcile(window.location.pathname);
});
```

## Lazy Mount on Viewport

```ts
orchestrator.register({
  name: 'comments',
  entry: '/comments.js',
  container: '#comments',
  mountWhenVisible: true, // mounts on first IntersectionObserver hit
});
```

## Fallback HTML

```ts
orchestrator.register({
  name: 'reports',
  entry: '/reports.js',
  container: '#reports',
  activeWhen: '/reports/*',
  fallback: '<p>Reports temporarily unavailable.</p>',
});
```

## Prefetching

```ts
createOrchestrator({
  router: { /* ... */ },
  prefetch: { strategy: 'idle' }, // 'immediate' | 'idle' | 'hover' | 'none'
});
```

## Lifecycle Events

```ts
const bus = orchestrator.getEventBus();

bus.on('app:mount',          ({ name }) => console.log('mounted', name));
bus.on('app:unmount',        ({ name }) => console.log('unmounted', name));
bus.on('app:error',          ({ name, error }) => console.error(name, error));
bus.on('app:status:change',  ({ name, status }) => console.log(name, status));
bus.on('route:change',       ({ from, to }) => console.log(from, '→', to));
```

Or use the config callbacks:

```ts
createOrchestrator({
  onError: (err, name) => reportToSentry(err, { app: name }),
  onStatusChange: (name, status) => console.log(name, status),
});
```

## API

| Export | Purpose |
| --- | --- |
| `createOrchestrator(config?)` | Create a new orchestrator |
| `defineMicroApp(config)` | Define a micro app module (typed identity helper) |
| `Orchestrator` | The class itself, for advanced extension |
| `OrchestratorEvent` | Enum of event names emitted on the bus |

## License

MIT

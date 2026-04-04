# tuvix.js

> All-in-one umbrella package for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install tuvix.js
```

## Quick Start

```ts
import { createOrchestrator, defineMicroApp, createRouter, createEventBus } from 'tuvix.js';

const orchestrator = createOrchestrator();
const router = createRouter({ mode: 'history' });
const bus = createEventBus();

orchestrator.register(defineMicroApp({
  name: 'my-app',
  entry: '/apps/my-app.js',
  container: '#my-app',
  activeWhen: '/my-app',
}));

orchestrator.start();
```

## Included Packages

This umbrella package re-exports all core Tuvix.js modules:

- **@tuvix.js/core** — Orchestrator
- **@tuvix.js/router** — URL routing
- **@tuvix.js/event-bus** — Typed pub/sub
- **@tuvix.js/loader** — Dynamic module loading
- **@tuvix.js/sandbox** — CSS/JS isolation

## License

MIT

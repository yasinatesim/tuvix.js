# @tuvix.js/core

> Core orchestrator for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/core
```

## Quick Start

```ts
import { createOrchestrator, defineMicroApp } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register(defineMicroApp({
  name: 'my-app',
  entry: '/apps/my-app.js',
  container: '#my-app',
  activeWhen: '/my-app',
}));

orchestrator.start();
```

## API

- **`createOrchestrator(config?)`** — Create a new orchestrator instance
- **`defineMicroApp(config)`** — Define a micro app configuration
- **`Orchestrator`** — Core class managing micro app lifecycle (register, mount, unmount, update, start, stop)

## License

MIT

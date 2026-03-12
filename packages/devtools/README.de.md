# @tuvix.js/devtools

> In-browser debug panel for Tuvix.js micro apps

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/devtools
```

## Quick Start

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { installDevTools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator();

if (process.env.NODE_ENV === 'development') {
  installDevTools(orchestrator);
}
```

Toggle the panel with `Ctrl+Shift+T` (or `Cmd+Shift+T` on macOS).

## API

- **`installDevTools(orchestrator, options?)`** — Attach the debug overlay to an orchestrator
- **`DevToolsPanel`** — The debug panel UI class
- **`EventLogger`** — Event logging utility

## Documentation

📖 [Full documentation](https://tuvix.js.org/packages/devtools)

## License

MIT

# @tuvix.js/react

> React 18+ bindings for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/react react react-dom
```

## Quick Start

```ts
import { createReactMicroApp } from '@tuvix.js/react';
import App from './App';

export const app = createReactMicroApp({
  name: 'my-react-app',
  component: App,
});
```

## API

- **`createReactMicroApp(config)`** — Wrap a React component as a Tuvix micro app
- **`useTuvixBus(event, handler)`** — Subscribe to event bus events with auto-cleanup
- **`useTuvixProps()`** — Access orchestrator props reactively

## Documentation

📖 [Full documentation](https://tuvix.js.org/packages/react)

## License

MIT

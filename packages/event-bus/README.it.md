# @tuvix.js/event-bus

> Lightweight typed pub/sub system for inter-app communication

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/event-bus
```

## Quick Start

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();

bus.on('user:login', ({ userId }) => {
  console.log('User logged in:', userId);
});

bus.emit('user:login', { userId: '123' });
```

## API

- **`createEventBus(options?)`** — Create a new event bus instance
- **`getGlobalBus()`** — Get the shared global event bus
- **`resetGlobalBus()`** — Reset the global event bus
- **`EventBus`** — Typed pub/sub with `emit()`, `on()`, `once()`, `off()`, `clear()`

## License

MIT

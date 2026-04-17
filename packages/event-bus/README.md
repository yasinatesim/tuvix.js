# @tuvix.js/event-bus

> Lightweight typed pub/sub system for inter-app communication

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## Quick Start

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();

const unsubscribe = bus.on<{ userId: string }>('user:login', ({ userId }) => {
  console.log('User logged in:', userId);
});

bus.emit('user:login', { userId: '123' });

unsubscribe();
```

## Subscriptions

```ts
// Standard subscription — returns an unsubscribe function
const off = bus.on('cart:update', (cart) => render(cart));

// Fire once and auto-unsubscribe
bus.once('app:ready', () => console.log('ready'));

// Wildcard — receives every event for inspection or logging
const offAll = bus.onAny((event, data) => {
  console.log('[bus]', event, data);
});

// Manual removal
bus.off('cart:update', handler);
bus.offAll('cart:update');     // remove every listener for this event
bus.offAll();                   // remove every listener for every event (incl. wildcards)
```

## Introspection

```ts
bus.hasListeners('user:login');   // boolean
bus.listenerCount('user:login');  // number
bus.eventNames();                 // string[]
```

## Shared Global Bus

Use one bus across all micro apps without passing a reference around:

```ts
import { getGlobalBus, resetGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();          // creates on first call, reuses afterwards
bus.emit('cart:update', { items });

resetGlobalBus();                    // clear & recreate (mostly for tests)
```

> When using `@tuvix.js/core`, `orchestrator.getEventBus()` already exposes a
> bus shared with every registered app — prefer that over the global singleton
> in production code.

## Options

```ts
const bus = createEventBus({
  maxListeners: 50,                // warn (don't throw) when exceeded; 0 = unlimited
  debug: true,                     // log every emit/on/off
  logger: (...args) => myLog(...), // custom logger sink
});
```

## Lifecycle

```ts
bus.destroy();   // remove all listeners, mark bus unusable
                  // any subsequent emit/on/once/onAny throws
```

## Error Handling

Handlers run inside try/catch — a throwing listener is logged but does **not**
prevent the remaining listeners (or the wildcard listeners) from receiving the
event.

## API Surface

| Export | Purpose |
| --- | --- |
| `createEventBus(options?)` | Factory function |
| `getGlobalBus()` | Lazy global singleton |
| `resetGlobalBus()` | Recreate the singleton |
| `EventBus` | Class implementation |
| `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` | Types |

## License

MIT

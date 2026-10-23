# @tuvix.js/event-bus

> Synchronous publish/subscribe bus for messages between micro apps, with one global bus per page.

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework. Full documentation: [tuvix.js.org/packages/event-bus](https://tuvix.js.org/packages/event-bus).

## Installation

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## Quick start

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const stop = bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
  console.log('Items in cart:', itemCount);
});

bus.emit('cart:updated', { itemCount: 3 });
stop();
```

The orchestrator from `@tuvix.js/core` uses `getGlobalBus()` (unless you pass `eventBus` options) and passes it to every app as `bus` in the mount context.

## API

### `EventBus` and `createEventBus`

```ts no-check
new EventBus(options?: EventBusOptions);
createEventBus(options?: EventBusOptions): IEventBus;
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | Per-event count at which `on` prints a `console.warn` when you add one more, once per event name, with or without `debug`. The listener is still added. `0` means no warning. |
| `debug` | `boolean` | `false` | Logs subscribe, unsubscribe and emit calls. |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | Receives debug output. |

| Method | Behaviour |
| --- | --- |
| `on<T>(event, handler): Unsubscribe` | Subscribes; returns a remover. |
| `once<T>(event, handler): Unsubscribe` | Removes the handler before its first call. Cancel it through the returned function, not `off`. |
| `emit<T>(event, data?)` | Calls the event's handlers in order, then `onAny` handlers, before returning. A throwing handler is logged with `console.error`; the rest still run. |
| `off(event, handler)` | Removes one handler. |
| `offAll(event?)` | Removes an event's handlers, or every handler including `onAny` ones. |
| `onAny(handler): Unsubscribe` | Handler receives `(eventName, data)` for every event. |
| `offAny(handler)` | Removes an `onAny` handler. |
| `hasListeners(event)`, `listenerCount(event)`, `eventNames()` | Inspect subscriptions; `onAny` handlers are not counted. |
| `destroy()` | Removes every handler. Later `on`, `once`, `emit` and `onAny` calls throw. |

### `getGlobalBus`

```ts no-check
getGlobalBus(options?: EventBusOptions): IEventBus;
```

Returns the page's shared bus, stored on `window.__TUVIX_GLOBAL_BUS__`, so micro apps that bundle their own copy of this package get the same instance. `options` apply only on the call that creates it. Without `window`, the bus is a module-level singleton.

### `resetGlobalBus`

```ts no-check
resetGlobalBus(): void;
```

Destroys the global bus; the next `getGlobalBus()` creates a new one. Old references throw on use. Meant for tests.

### Types

`EventHandler<T>` (`(data: T) => void`), `WildcardHandler<T>` (`(eventName: string, data: T) => void`), `Unsubscribe` (`() => void`), `EventBusOptions`, `IEventBus`.

## Edge cases

- `emit` works on a copy of the handler list: handlers added during an emit run from the next emit on.
- The same function subscribed twice to one event is stored once.
- `emit` does not await async handlers; their rejections are unhandled.
- Empty or whitespace event names throw `[Tuvix EventBus] Event name must be a non-empty string.`
- A micro app that bundles 0.4 of this package keeps its own bus.

## What it does not do

- No event map typing; pass the payload type as `on<T>` / `emit<T>`.
- No replay for late subscribers, no `user:*` patterns, no messages across tabs or iframes.

## License

MIT

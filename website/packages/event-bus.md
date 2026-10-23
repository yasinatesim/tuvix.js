---
title: '@tuvix.js/event-bus'
---

<PackageHeader
  name="@tuvix.js/event-bus"
  title="Event Bus"
  description="Synchronous publish/subscribe bus for messages between micro apps. One global bus per page, shared by every bundled copy of the package."
  icon="📡"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## When to use it

Micro apps on one page need to tell each other things: the cart app announces `cart:updated`, the header shows the new count. The event bus lets them do that by event name, without importing each other.

The orchestrator from `@tuvix.js/core` uses `getGlobalBus()` and hands it to every app as `bus` in the mount context. Inside a micro app, use that `bus` or call `getGlobalBus()`; both return the same instance. Create a private bus with `createEventBus()` for tests or for messages that stay inside one app.

Pick something else for state that a late subscriber must read (a store, or the URL), and for messages between tabs or iframes (`BroadcastChannel`, `postMessage`).

## Quick start

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

interface CartUpdated {
  itemCount: number;
  total: number;
}

const bus = getGlobalBus();

// header app
const stop = bus.on<CartUpdated>('cart:updated', ({ itemCount }) => {
  document.querySelector('#cart-count')!.textContent = String(itemCount);
});

// cart app
bus.emit<CartUpdated>('cart:updated', { itemCount: 3, total: 59.9 });

// header app, on unmount
stop();
```

A micro app that the orchestrator mounts receives the bus in its mount context:

```ts
import { registerModule } from '@tuvix.js/loader';

let stop: (() => void) | undefined;

registerModule('header', {
  mount({ container, bus }) {
    stop = bus?.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
      container.textContent = `Cart: ${itemCount}`;
    });
  },
  unmount({ container }) {
    stop?.();
    container.replaceChildren();
  },
});
```

## API

### `EventBus`

```ts no-check
class EventBus implements IEventBus {
  constructor(options?: EventBusOptions);
}
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | Listener count per event at which `on` prints a `console.warn` when you add one more, once per event name for the life of the bus. The listener is added either way. `0` turns the warning off. The warning ignores `debug`. |
| `debug` | `boolean` | `false` | Logs every subscribe, unsubscribe and emit through `logger`. |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | Receives debug messages, each prefixed with `[Tuvix EventBus]`. The `maxListeners` warning does not go through it. |

```ts
import { EventBus } from '@tuvix.js/event-bus';

const bus = new EventBus({ debug: true, maxListeners: 20 });
```

#### `on(event, handler)`

```ts no-check
on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

Subscribes `handler` to `event` and returns a function that unsubscribes it. `T` types the payload; the bus does not check it at runtime.

#### `once(event, handler)`

```ts no-check
once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

Like `on`, but removes the handler before its first call. To cancel before the event fires, call the returned function. `off(event, handler)` does not find it, because the bus stores a wrapper.

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
const cancel = bus.once('app:ready', () => console.log('ready'));
cancel();
```

#### `emit(event, data?)`

```ts no-check
emit<T = unknown>(event: string, data?: T): void;
```

Calls every handler of `event` in subscription order, then every `onAny` handler, all before `emit` returns. A handler that throws is logged with `console.error('[Tuvix EventBus] Error in handler for "<event>":', error)` and the remaining handlers still run.

#### `off(event, handler)`

```ts no-check
off<T = unknown>(event: string, handler: EventHandler<T>): void;
```

Removes one handler. Unknown events and handlers are ignored.

#### `offAll(event?)`

```ts no-check
offAll(event?: string): void;
```

With `event`, removes every handler of that event. Without it, removes every handler of every event and every `onAny` handler.

#### `onAny(handler)`

```ts no-check
onAny<T = unknown>(handler: WildcardHandler<T>): Unsubscribe;
```

Subscribes to every event. The handler receives `(eventName, data)`. Use it for logging and devtools.

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const stopLogging = getGlobalBus().onAny((event, data) => {
  console.debug('[bus]', event, data);
});
```

#### `offAny(handler)`

```ts no-check
offAny<T = unknown>(handler: WildcardHandler<T>): void;
```

Removes an `onAny` handler.

#### `hasListeners(event)`, `listenerCount(event)`, `eventNames()`

```ts no-check
hasListeners(event: string): boolean;
listenerCount(event: string): number;
eventNames(): string[];
```

Inspect the subscriptions. `onAny` handlers are not counted, and `eventNames()` lists only events with at least one handler.

#### `destroy()`

```ts no-check
destroy(): void;
```

Removes every handler and marks the bus destroyed. After that, `on`, `once`, `emit` and `onAny` throw `[Tuvix EventBus] Cannot use a destroyed EventBus instance. Create a new one.` The orchestrator destroys a private bus (one it created from `eventBus` options) in `destroy()` and leaves the global bus alive.

### `createEventBus`

```ts no-check
function createEventBus(options?: EventBusOptions): IEventBus;
```

Returns `new EventBus(options)` typed as `IEventBus`. Takes the options from the table above.

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
bus.on<string>('hello', (name) => console.log(`Hello, ${name}!`));
bus.emit('hello', 'World');
```

### `getGlobalBus`

```ts no-check
function getGlobalBus(options?: EventBusOptions): IEventBus;
```

Returns the page's shared bus and creates it on the first call. The bus lives on `window.__TUVIX_GLOBAL_BUS__`, so a micro app that bundles its own copy of `@tuvix.js/event-bus` gets the same instance as the shell. `options` apply only on the call that creates the bus. On the server, without `window`, the bus is a module-level singleton.

The orchestrator uses this bus unless you pass `eventBus` options to `createOrchestrator`, so `orchestrator.getEventBus() === getGlobalBus()`.

### `resetGlobalBus`

```ts no-check
function resetGlobalBus(): void;
```

Destroys the global bus and clears `window.__TUVIX_GLOBAL_BUS__`. The next `getGlobalBus()` creates a new bus. Code that kept the old instance, an orchestrator included, then throws on `emit`. Call it between tests.

```ts
import { getGlobalBus, resetGlobalBus } from '@tuvix.js/event-bus';

getGlobalBus().emit('test:start');
resetGlobalBus();
```

### Types

```ts
type EventHandler<T = unknown> = (data: T) => void;
type WildcardHandler<T = unknown> = (eventName: string, data: T) => void;
type Unsubscribe = () => void;
```

| Type | Meaning |
| --- | --- |
| `EventHandler<T>` | Handler for one event. |
| `WildcardHandler<T>` | Handler for `onAny`, receives the event name and the data. |
| `Unsubscribe` | Function returned by `on`, `once` and `onAny`. |
| `EventBusOptions` | `{ maxListeners?, debug?, logger? }`. |
| `IEventBus` | Interface `EventBus` implements: every method listed above. It satisfies `MicroAppBus` from `@tuvix.js/loader`. |

## Edge cases

- **Snapshot per emit.** `emit` copies the handler list first. A handler added during an emit runs from the next emit on; a handler removed during an emit still runs in the current one.
- **Same function twice.** Subscribing one function twice to one event stores it once, and one `off` removes it.
- **Async handlers.** `emit` does not wait for returned promises. A rejected promise escapes the bus's `try`/`catch` and shows up as an unhandled rejection.
- **Invalid input.** `on`, `once` and `emit` throw `[Tuvix EventBus] Event name must be a non-empty string.` for `''` or whitespace. `on` and `onAny` throw `[Tuvix EventBus] Handler must be a function.` when the handler is not a function. `once` wraps the handler first, so a non-function passes and fails on the first `emit`, where the bus logs the error.
- **After `destroy()`.** `off`, `offAll`, `offAny`, `hasListeners`, `listenerCount` and `eventNames` keep working and report an empty bus.
- **Mixed versions.** A micro app that bundles `@tuvix.js/event-bus` 0.4 keeps its own module-level bus and does not see the shared one.
- **Listener limit.** With `maxListeners: 20`, adding the 21st handler to one event prints `[Tuvix EventBus] Max listeners (20) reached for event "<event>". The listener was added; check for handlers that are never removed.` The bus warns once per event name for its lifetime, so removing handlers and adding them again does not warn a second time.
- **Iframes.** Each window has its own `__TUVIX_GLOBAL_BUS__`.

## What it does not do

- It does not type events by name. There is no event map and no `TuvixEvents` interface to augment; pass the payload type as `on<T>` and `emit<T>`.
- It does not replay events. A handler subscribed after an `emit` misses it.
- It does not match patterns such as `user:*`. `onAny` receives every event.
- It does not send messages to other tabs, windows or iframes.

## Migrating from 0.4

- `getGlobalBus()` now keeps its singleton on `window.__TUVIX_GLOBAL_BUS__`. In 0.4 each bundled copy of the package created its own "global" bus, so micro apps with their own copy never heard the shell. `resetGlobalBus()` from any copy now resets the bus for all of them.
- The 0.4 version of this page documented `clear(event?)`, `createEventBus<EventMap>()` and a `TuvixEvents` interface. None of them existed. Use `offAll(event?)` and the per-call generic `on<T>` / `emit<T>`.

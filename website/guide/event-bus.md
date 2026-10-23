# Event Bus

`@tuvix.js/event-bus` is a synchronous publish/subscribe channel. Apps on one page use it to tell each other what happened ("cart updated", "user logged out") without importing each other's code.

## Pick a bus

| Bus | Get it with | Use it when |
| --- | --- | --- |
| Global bus | `getGlobalBus()` | Default. Every app on the page, in any bundle, gets the same instance. |
| Orchestrator bus | `orchestrator.getEventBus()` or `bus` in the mount context | Inside micro apps. It is the global bus unless the shell passed `eventBus` options. |
| Private bus | `createEventBus(options)` | Tests, or a channel only one app uses. |

`getGlobalBus()` keeps its instance on `window.__TUVIX_GLOBAL_BUS__`. Two micro apps that each bundle `@tuvix.js/event-bus` still share it. On the server, without `window`, each module copy has its own.

## Emit and subscribe

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => {
  console.log('logged in', userId);
});

bus.emit('user:login', { userId: '42' });

off();
```

`emit` calls every handler before it returns. A handler that throws is logged with `console.error`; the remaining handlers still run. Nothing is queued: a subscriber that joins after an `emit` does not see it.

## Typed events

The generic on `on`, `once` and `emit` types the payload. For a project-wide map, wrap the bus:

```ts
import { getGlobalBus, type IEventBus } from '@tuvix.js/event-bus';

export interface AppEvents {
  'user:login': { userId: string };
  'user:logout': { userId: string };
  'cart:updated': { itemCount: number; total: number };
}

export function emit<E extends keyof AppEvents>(bus: IEventBus, event: E, payload: AppEvents[E]): void {
  bus.emit(event, payload);
}

export function on<E extends keyof AppEvents>(
  bus: IEventBus,
  event: E,
  handler: (payload: AppEvents[E]) => void,
): () => void {
  return bus.on<AppEvents[E]>(event, handler);
}

emit(getGlobalBus(), 'cart:updated', { itemCount: 3, total: 42 });
```

## Use the bus in a micro app

Take the bus from the mount context and unsubscribe in `unmount`:

```ts
import { defineMicroApp } from '@tuvix.js/core';

const subscriptions: Array<() => void> = [];

export default defineMicroApp({
  name: 'header',

  mount({ container, bus }) {
    const badge = document.createElement('span');
    container.replaceChildren(badge);
    if (!bus) return;
    subscriptions.push(
      bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
        badge.textContent = String(itemCount);
      }),
      bus.on('user:logout', () => {
        badge.textContent = '';
      }),
    );
  },

  unmount({ container }) {
    for (const off of subscriptions.splice(0)) off();
    container.replaceChildren();
  },
});
```

React and Vue components can use `useTuvixBus(bus, event, handler)`, which unsubscribes when the component unmounts. See [React](/guide/react) and [Vue](/guide/vue).

## once and wildcards

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

bus.once('app:ready', () => console.log('first ready event only'));

const offAny = bus.onAny((event, data) => console.debug('[bus]', event, data));
offAny();
```

`onAny` handlers run after the named handlers for every event, including the orchestrator's `tuvix:app:*` events.

## Remove listeners

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
const handler = (data: unknown) => console.log(data);

bus.on('ping', handler);
bus.off('ping', handler); // one handler
bus.offAll('ping'); // every handler for 'ping'
bus.offAll(); // every handler, wildcards included
```

Call `offAll()` on the global bus only when you own the whole page. It removes other apps' listeners too.

## Errors and destroyed buses

- `on`, `once`, `emit` and `onAny` throw for an empty event name or a non-function handler.
- After `bus.destroy()`, every method that subscribes or emits throws. `resetGlobalBus()` destroys the global bus; the next `getGlobalBus()` call creates a new one.
- `orchestrator.destroy()` destroys only a private bus.

## Introspection

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
bus.hasListeners('user:login'); // boolean
bus.listenerCount('user:login'); // number
bus.eventNames(); // string[]
```

## What the bus does not do

- It does not persist or replay events. Pass current state as props, or have the late app ask for it with an event the owner answers.
- It does not cross windows, tabs or iframes. Use `BroadcastChannel` or `postMessage` for that.
- It does not validate payloads at runtime. The generics are compile-time only.

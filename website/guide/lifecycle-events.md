# Lifecycle Events

Adapters and `defineMicroApp` tell the page when a micro app mounts, unmounts or fails. You can listen for DOM events, await `whenMounted(name)`, or ask `isMounted(name)`. Use them to start an animation once an island is interactive, to hide a skeleton, or to report errors, instead of polling the DOM or reading framework internals such as `__vue_app__`.

## Events

| DOM event | Dispatched |
| --- | --- |
| `tuvix:mounted` | After the app rendered or hydrated, and its framework's mount callbacks ran. |
| `tuvix:unmounted` | After the app was destroyed and its container emptied. |
| `tuvix:error` | When `mount` or `unmount` throws, or when a React app throws while rendering after mount. |

Each event is a `CustomEvent<LifecycleDetail>` dispatched on the app's container. It bubbles and is `composed`, so a listener on `document` receives it, even from inside a shadow root. When the container is no longer in the DOM (React removed an island before its module reported `unmounted`), the event is dispatched on `document` instead, and `detail.container` still points at the element.

```ts
import type { LifecycleDetail } from '@tuvix.js/loader';

const detail: LifecycleDetail = {
  name: 'footer', // the app name
  container: document.body, // the element the app rendered into
  hydrated: true, // true when the adapter adopted server markup
  error: undefined, // the thrown value, on 'error' only
};
```

## Listen with onLifecycle

```ts
import { onLifecycle } from 'tuvix.js';

const stopMounted = onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} is interactive (hydrated: ${hydrated})`);
});

const stopErrors = onLifecycle('error', ({ name, error }) => {
  console.error(`${name} failed`, error);
});

// later
stopMounted();
stopErrors();
```

`onLifecycle(type, handler, target = document)` returns a function that removes the listener. Pass a container as `target` to hear one region only. A plain `addEventListener('tuvix:mounted', ...)` works too.

## Wait with whenMounted

```ts
import { whenMounted } from 'tuvix.js';

const controller = new AbortController();
setTimeout(() => controller.abort(new Error('footer did not mount in 5 s')), 5000);

const { container } = await whenMounted('footer', { signal: controller.signal });
container.classList.add('is-ready');
```

- It resolves at once when the app is already mounted, so the order of your code and the mount does not matter.
- It does not reject when the mount fails. Pass a `signal` with a timeout, or also listen for `tuvix:error`.
- When the signal aborts, the promise rejects with the signal's reason.

## Check with isMounted

```ts
import { isMounted } from 'tuvix.js';

if (isMounted('footer')) {
  console.log('footer is on the page');
}
```

## Replace framework sniffing

Without lifecycle events, a host has to guess when an island is ready, for example by polling for a framework's private properties:

```ts no-check
// Breaks on Svelte, Angular and any Vue release that renames the property.
const timer = setInterval(() => {
  if ((container as any).__vue_app__) {
    clearInterval(timer);
    startReveal(container);
  }
}, 50);
```

With lifecycle events, one listener works for every adapter:

```ts
import { onLifecycle } from 'tuvix.js';

declare function startReveal(container: HTMLElement): void;

onLifecycle('mounted', ({ name, container }) => {
  if (name === 'footer') startReveal(container);
});
```

## Who dispatches the events

| Source | Dispatches |
| --- | --- |
| `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp` (and the `Ssr` variants) | all three |
| `TuvixReactApp` | all three |
| `TuvixIsland` | none itself; the module it hosts dispatches them |
| `defineMicroApp` | all three; with `ssr: true`, `hydrated` is `true` when the container held markup before `mount` |
| Plain `{ mount, unmount }` objects | none, unless you call `emitLifecycle` |
| The orchestrator | none; it emits `tuvix:app:*` events on the event bus instead |

`defineMicroApp` dispatches `tuvix:mounted` after your `mount` resolves, `tuvix:unmounted` after your `unmount` resolves, and `tuvix:error` (then rethrows) when either throws. An `unmount` for a container whose `mount` is still running waits for it:

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'clock',
  ssr: true, // the server rendered the time into the container
  mount({ container }) {
    container.textContent = new Date().toISOString();
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

A module written as a plain object can dispatch the events itself:

```ts
import { emitLifecycle, type MicroAppModule } from '@tuvix.js/loader';

export const clock: MicroAppModule = {
  mount({ container }) {
    container.textContent = new Date().toISOString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated: false });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
};
```

## Edge cases

- One module can mount in several containers. `isMounted(name)` stays `true` while any of them is mounted, and `whenMounted(name)` resolves with the earliest container still mounted. Give each placement its own name when you need to tell them apart.
- A `tuvix:unmounted` event for a detached container reaches `document` listeners once. `onLifecycle` with a container as `target` does not see it, because the event no longer passes through that element.
- The state lives on `window.__TUVIX_RUNTIME__`, so separately bundled copies of `@tuvix.js/loader` share it.
- On the server there is no DOM and no event. Do not call `whenMounted` there; it never resolves.

## What it does not do

- It does not report loading progress. The orchestrator's `onStatusChange` covers `bootstrapping`, `mounting` and the rest.
- It does not retry or recover. Use the orchestrator's `fallback`, or `fallback` on `TuvixIsland` and `TuvixReactApp`.

# Micro Apps

A micro app is a module with `mount` and `unmount` functions. The shell calls `mount` with a container element and props; the app renders into that element. The shell calls `unmount` when the app should leave the page; the app removes what it rendered.

## The module shape

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  bootstrap: async () => {},
  mount: async ({ container, props, name, bus }) => {
    container.textContent = `${name ?? 'app'} mounted`;
    void props;
    void bus;
  },
  update: async ({ props, container }) => {
    if (container) container.dataset.props = JSON.stringify(props);
  },
  unmount: async ({ container }) => {
    container.replaceChildren();
  },
};
```

| Hook | Required | Called |
| --- | --- | --- |
| `bootstrap()` | no | Once, after the first load, before the first `mount`. |
| `mount({ container, props, name, bus })` | yes | Each time the app becomes active. |
| `update({ props, container })` | no | When the shell calls `updateAppProps` while the app is mounted. |
| `unmount({ container })` | yes | Each time the app becomes inactive. |

Each hook may return a promise. The orchestrator waits for it before the next step.

## Write one by hand

`defineMicroApp` validates the hooks, registers the module under `name`, dispatches `tuvix:mounted`, `tuvix:unmounted` and `tuvix:error` on the container, and returns the module:

```ts
import { defineMicroApp } from '@tuvix.js/core';

let off: (() => void) | undefined;

export default defineMicroApp({
  name: 'notifications',

  mount({ container, props, bus }) {
    const list = document.createElement('ul');
    container.replaceChildren(list);
    off = bus?.on<{ text: string }>('notify', ({ text }) => {
      const item = document.createElement('li');
      item.textContent = text;
      list.append(item);
    });
    container.dataset.user = String(props?.user ?? '');
  },

  unmount({ container }) {
    off?.();
    off = undefined;
    container.replaceChildren();
  },
});
```

Use the `bus` from the mount context. It is the orchestrator's bus, which is `getGlobalBus()` unless the shell passed `eventBus` options.

## Use an adapter

Adapters build the module from a component and handle details you would otherwise write yourself:

- one framework instance per container, so a module can mount in several places;
- `update` re-renders with new props without a remount;
- an `unmount` that arrives while `mount` is still loading waits and leaves an empty container;
- `tuvix:mounted`, `tuvix:unmounted` and `tuvix:error` events on the container;
- hydration of server-rendered markup when you pass `ssr: true`.

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Cart({ items }: { items: number }) {
  return <p>{items} items</p>;
}

export default createReactMicroApp({ name: 'cart', App: Cart });
```

## Expose the module to the loader

The orchestrator gets a module through the app's `entry`:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

// Bundled with the shell, code-split by your bundler.
orchestrator.register({
  name: 'cart',
  entry: () => import('./apps/cart'),
  container: '#cart',
  activeWhen: '/shop/*',
});

// Deployed on its own. The script registers itself by name.
orchestrator.register({
  name: 'notifications',
  entry: { scripts: ['https://cdn.example.com/notifications/main.js'], type: 'module' },
  container: '#notifications',
  activeWhen: '/',
});
```

For a URL entry, the module must call `registerModule(name, module)` (adapters and `defineMicroApp` do) or expose a UMD global with a `mount` function. A loader function only needs to resolve to the module or to `{ default: module }`.

## Pass props

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./apps/profile'),
  container: '#app',
  activeWhen: '/profile/*',
  props: { userId: '42', theme: 'dark' },
});

await orchestrator.updateAppProps('profile', { theme: 'light' });
// The app now has { userId: '42', theme: 'light' }.
```

- Props merge shallowly. To remove a key, set it to `undefined`.
- When the app is mounted and has `update`, the orchestrator calls it and resolves after it settles. A rejected `update` puts the app in `error` status and calls `onError`.
- When the app is not mounted, or has no `update`, the orchestrator stores the merged props for the next mount. It does not remount the app.

## Mount one module in several places

Adapters keep a separate instance per container. `TuvixIsland` and your own code can call `mount` on two containers with the same module:

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Price from './Price.vue';

const price = createVueMicroApp({ name: 'price', App: Price });

const first = document.querySelector<HTMLElement>('#price-1');
const second = document.querySelector<HTMLElement>('#price-2');
if (first && second) {
  await price.mount({ container: first, props: { sku: 'a' } });
  await price.mount({ container: second, props: { sku: 'b' } });
  await price.update?.({ props: { sku: 'c' }, container: second }); // only #price-2
}
```

Without `container`, `update` updates every mount of that module. The orchestrator always passes `container`.

## Build and deploy

Build each app as an ES module bundle and register it with `type: 'module'`, or as an IIFE/UMD bundle and register its URL as a classic script. With Vite:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.ts', formats: ['es'], fileName: 'main' },
    // Leave dependencies bundled unless the shell provides them.
  },
});
```

Keep framework copies in mind: two micro apps that each bundle React ship React twice. The page still works, because each app renders its own root. To share one copy, use import maps, Module Federation (`@tuvix.js/module-federation`), or have the shell bundle the apps through loader-function entries.

## What a micro app must not do

- Write outside its container. Tuvix.js does not stop it, and the next app in that container will not expect it.
- Leave listeners, timers or subscriptions behind after `unmount`.
- Rely on `bootstrap` running more than once. It runs once per loaded module.

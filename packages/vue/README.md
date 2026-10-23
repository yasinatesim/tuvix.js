# @tuvix.js/vue

> Turn Vue 3 components into Tuvix.js micro apps with reactive props, one Vue app per container and SSR hydration.

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

For server rendering also install the optional peer `@vue/server-renderer`.

## Quick start

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

The module registers itself under `'settings'` through `registerModule` from `@tuvix.js/loader`, so the orchestrator finds it after the script loads. `App` receives the orchestrator props as component props; declare them with `defineProps`.

## API

### `createVueMicroApp(config)`

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | Registry name; lifecycle events carry it. |
| `App` | `Component` | required | Root Vue component. |
| `plugins` | `VuePluginEntry[]` | none | Plugins, or `[plugin, ...options]` tuples passed to `app.use(plugin, ...options)`. |
| `bootstrap` | `() => void \| Promise<void>` | none | One-time setup. |
| `ssr` | `boolean` | `false` | Hydrate server markup with `createSSRApp` when the container has elements or non-whitespace text. |

- Each container gets its own Vue app and props, so one module can mount in several places. Each mount installs the plugins again.
- `mount({ container, props })` dispatches `tuvix:mounted` with `hydrated`.
- `update({ props, container })` replaces the keys of a `shallowReactive` props object (missing keys are removed) and resolves after `nextTick`. Without `container` it updates every mount. Component state survives.
- `unmount({ container })` unmounts the app, empties the container and dispatches `tuvix:unmounted`.

### `createSsrVueMicroApp(config)`

`createVueMicroApp({ ...config, ssr: true })`. Options: `name`, `App`, `plugins`, `bootstrap`. Vue adopts markup from `renderVueToString`; an empty container gets a normal render.

```ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString(App, props?, plugins?, ssrContext?)`

From `@tuvix.js/vue/server`. Returns the HTML of `App` rendered with the same root wrapper the client uses, so hydration matches and `inject('tuvixProps')` works on the server. Vue writes `teleports` and `modules` into `ssrContext`.

Server-only: call it from a server function, not an isomorphic route loader. In the browser it returns `''`, and a loader that imports it ships the Vue server renderer to the client.

```ts
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from './App.vue';

export async function renderContact(): Promise<string> {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return `<div id="contact">${html}</div>`;
}
```

### `TUVIX_PROPS_KEY`

`'tuvixProps'`. `inject(TUVIX_PROPS_KEY)` returns the reactive props object that `update` writes to, in any component of the tree.

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus(bus, event, handler)`

Subscribes in `onMounted`, unsubscribes in `onUnmounted`, and returns an early unsubscribe function. Pass `getGlobalBus()` from `@tuvix.js/event-bus`; the adapter does not hand the orchestrator bus to `App`.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Returns a `ShallowRef<T>` that merges each payload of `updateEvent` (default `'tuvix:props:update'`) on `bus`. Nothing in Tuvix emits that event; you emit it. For orchestrator props use `defineProps` or `inject(TUVIX_PROPS_KEY)`.

### Types

`VueMicroAppConfig`, `VueSsrMicroAppConfig`, `VuePluginEntry` from `@tuvix.js/vue`; `VueSsrContext` from `@tuvix.js/vue/server`.

## Edge cases

- Setup, render and hook errors during `mount` reject in development and production builds; the adapter unmounts the failed app and dispatches `tuvix:error`. A plugin's `app.config.errorHandler` still runs.
- `mount` on a container the module already holds unmounts the old app first.
- `unmount` on a container the module never mounted does nothing.
- Props the root component does not declare fall through as attributes on its root element.
- With `ssr: true`, a container holding only whitespace or comments gets a fresh render.

## What it does not do

- Support Vue 2.
- Load modules by URL. Use `@tuvix.js/core` or `@tuvix.js/loader`.
- Collect CSS or stream HTML on the server. Use `@tuvix.js/vite` for stylesheet links.

## Breaking changes in 0.5

- `update()` no longer writes `app.config.globalProperties.$tuvixProps`. Use `defineProps` or `inject('tuvixProps')`.
- `unmount()` on a container the module never mounted does nothing; before, it cleared the container.
- `VueSsrMicroAppConfig` no longer accepts `ssr`.

Full documentation: [tuvix.js.org/packages/vue](https://tuvix.js.org/packages/vue)

## License

MIT

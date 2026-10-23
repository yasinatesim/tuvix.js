---
title: '@tuvix.js/vue'
---

<PackageHeader
  name="@tuvix.js/vue"
  title="Vue Bindings"
  description="Turn a Vue 3 component into a Tuvix.js micro app with reactive props, one Vue app per container and SSR hydration. Render it on the server with renderVueToString."
  icon="💚"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

For server rendering also install the Vue server renderer, an optional peer dependency:

```bash
npm install @vue/server-renderer
# or pnpm add @vue/server-renderer
```

The package needs Vue 3 (peer range `>=3.0.0`). It depends on `@tuvix.js/loader` and `@tuvix.js/event-bus`.

## When to use it

Use `@tuvix.js/vue` when one of the micro apps in your Tuvix shell is a Vue 3 app. `createVueMicroApp` wraps the root component in the `{ bootstrap, mount, unmount, update }` module the orchestrator and loader call. The orchestrator then mounts it into a container, pushes new props with `updateAppProps`, and unmounts it on route change.

Add server rendering when the Vue app must show up in the first HTML response, for SEO or to avoid a blank area before JavaScript runs. Render the HTML with `renderVueToString` from `@tuvix.js/vue/server` in a server function, put it in the container, and hydrate it with `createSsrVueMicroApp`. Inside a React host page, pass that HTML to [`TuvixIsland`](/packages/react#tuvixisland).

If the whole page is one Vue app, you do not need this package; use Vue's own `createApp` or Nuxt.

## Quick start

The root component declares the props the shell passes:

```vue
<!-- src/micro-apps/settings/App.vue -->
<script setup lang="ts">
defineProps<{ userId: string; theme: 'light' | 'dark' }>();
</script>

<template>
  <section :class="`settings theme-${theme}`">Settings for {{ userId }}</section>
</template>
```

Wrap it in a module:

```ts
// src/micro-apps/settings/index.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

Register it in the shell:

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'settings',
  entry: () => import('./micro-apps/settings'),
  container: '#app',
  activeWhen: '/settings/*',
  props: { userId: 'u_42', theme: 'light' },
});

await orchestrator.start();

// Re-renders App with theme="dark"; local component state survives.
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## API

### `createVueMicroApp`

```ts no-check
function createVueMicroApp(config: VueMicroAppConfig): MicroAppModule;
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | Name the module registers under through `registerModule` from `@tuvix.js/loader`. Lifecycle events carry it. |
| `App` | `Component` | required | Root Vue component. |
| `plugins` | `VuePluginEntry[]` | none | Plugins to install on each Vue app. An entry is a plugin, or a `[plugin, ...options]` tuple passed to `app.use(plugin, ...options)`. |
| `bootstrap` | `() => void \| Promise<void>` | none | One-time setup. The module's `bootstrap()` awaits it. |
| `ssr` | `boolean` | `false` | Hydrate server markup with `createSSRApp` when the container holds elements or non-whitespace text. An empty container gets a `createApp` render. |

The returned module:

- `mount({ container, props })` creates a Vue app for that container, installs the plugins and mounts it. It dispatches `tuvix:mounted` on the container with `hydrated: true` when Vue adopted server markup.
- `update({ props, container })` writes `props` into that container's reactive props object and resolves after Vue flushes the re-render (`nextTick`). Keys missing from the new props are removed. Without `container` it updates every container the module has mounted.
- `unmount({ container })` unmounts the Vue app, empties the container with `replaceChildren()` and dispatches `tuvix:unmounted`.
- `bootstrap()` runs `config.bootstrap`.

Each container gets its own Vue app and its own props, so one module can mount into several places at once:

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Badge from './Badge.vue';

const badge = createVueMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

#### Reading props in components

The adapter keeps the props in a `shallowReactive` object and renders `App` through a root wrapper that passes them as component props. The wrapper renders no DOM of its own. You read the props in one of two ways:

- **`defineProps`** in the root component. `update` re-renders it with the new values.
- **`inject('tuvixProps')`** (or `inject(TUVIX_PROPS_KEY)`) in any component of the tree. You get the same reactive object, so a `computed` that reads it updates after `update`. Use it in deep children instead of passing props down.

```vue
<!-- src/micro-apps/settings/ThemeLabel.vue -->
<script setup lang="ts">
import { computed, inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

const tuvixProps = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
const theme = computed(() => String(tuvixProps.theme ?? 'light'));
</script>

<template>
  <span>Theme: {{ theme }}</span>
</template>
```

#### Plugins with options

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import type { VuePluginEntry } from '@tuvix.js/vue';
import type { App as VueApp } from 'vue';
import App from './App.vue';

const analytics = {
  install(app: VueApp, options: { siteId: string }) {
    app.provide('analyticsSiteId', options.siteId);
  },
};

const plugins: VuePluginEntry[] = [[analytics, { siteId: 'site-42' }]];

export default createVueMicroApp({ name: 'checkout', App, plugins });
```

Each container gets its own Vue app, so each mount calls `app.use` again for every plugin. A stateful plugin object, such as one `createPinia()` result, is shared by all containers of the module.

### `createSsrVueMicroApp`

```ts no-check
function createSsrVueMicroApp(config: VueSsrMicroAppConfig): MicroAppModule;
```

Same as `createVueMicroApp({ ...config, ssr: true })`. Options: `name`, `App`, `plugins`, `bootstrap`, as in the table above.

When the container holds markup from `renderVueToString`, Vue adopts those DOM nodes through `createSSRApp` and attaches listeners to them. The server and the client use the same root wrapper, so the component trees match. Mount with the same props the server rendered with:

```ts
// src/micro-apps/contact/client.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString`

Import it from the `@tuvix.js/vue/server` subpath.

```ts no-check
function renderVueToString(
  App: Component,
  props?: Record<string, unknown>,
  plugins?: VuePluginEntry[],
  ssrContext?: VueSsrContext
): Promise<string>;
```

| Argument | Type | Default | Meaning |
| --- | --- | --- | --- |
| `App` | `Component` | required | Root component, the same one you pass to `createSsrVueMicroApp`. |
| `props` | `Record<string, unknown>` | `{}` | Props for `App`. `inject('tuvixProps')` sees them during SSR too. |
| `plugins` | `VuePluginEntry[]` | none | Plugins to install, with the same tuple form as `createVueMicroApp`. |
| `ssrContext` | `VueSsrContext` | `{}` | Object Vue writes into during the render. Read `teleports` and `modules` after the promise resolves. |

It creates an SSR app with the shared root wrapper, installs the plugins, and returns the HTML from `renderToString` of `@vue/server-renderer`. Install that package; `renderVueToString` imports it on first call.

`renderVueToString` is server-only. Call it from a server function (a TanStack Start `createServerFn` handler, an API route, your Express handler), not from an isomorphic route loader. A loader also runs in the browser during client navigation, where the function returns `''`, and your bundler ships the Vue server renderer to the client because the loader imports it.

```ts
// src/server/contact.ts
import { createServerFn } from '@tanstack/react-start';
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from '../micro-apps/contact/App.vue';

export const renderContact = createServerFn().handler(async () => {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return { html, teleports: ssrContext.teleports ?? {} };
});
```

Put `html` inside the container element (`<div id="contact">…</div>`) in your page, then mount `createSsrVueMicroApp` on the client as shown above. A `<Teleport>` target's HTML is in `ssrContext.teleports['#target']`, not in the returned string; print it where the target lives.

### `TUVIX_PROPS_KEY`

```ts no-check
const TUVIX_PROPS_KEY = 'tuvixProps';
```

Injection key of the reactive props object. `inject(TUVIX_PROPS_KEY)` and `inject('tuvixProps')` return the same object, on the client and during `renderVueToString`.

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): Unsubscribe;
```

Subscribes `handler` to `event` in `onMounted` and unsubscribes in `onUnmounted`. The returned function unsubscribes early. Call it during `setup`. `onMounted` does not run during server rendering, so the subscription exists on the client only.

The adapter does not pass the orchestrator's bus into `App`. The orchestrator uses `getGlobalBus()` unless you gave it `eventBus` options:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const count = ref(0);

useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
  count.value = items.length;
});
</script>

<template>
  <span>{{ count }}</span>
</template>
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): ShallowRef<T>;
```

| Argument | Type | Default | Meaning |
| --- | --- | --- | --- |
| `initialProps` | `T` | required | Starting value, copied once. |
| `bus` | `IEventBus` | none | Bus to listen on. Without it the ref keeps `initialProps`. |
| `updateEvent` | `string` | `'tuvix:props:update'` | Event whose payload the composable merges into the ref (`{ ...prev, ...payload }`). |

Neither the orchestrator nor the adapter emits `tuvix:props:update`; you emit it yourself. For props from the orchestrator use `defineProps` or `inject(TUVIX_PROPS_KEY)`, which follow `update` without a bus.

```vue
<script setup lang="ts">
import { useTuvixProps } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const settings = useTuvixProps({ theme: 'light' }, getGlobalBus());
// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
</script>

<template>
  <p>Theme: {{ settings.theme }}</p>
</template>
```

### Types

| Type | Exported from | Meaning |
| --- | --- | --- |
| `VueMicroAppConfig` | `@tuvix.js/vue` | Config of `createVueMicroApp`: `name`, `App`, `plugins?`, `bootstrap?`, `ssr?`. |
| `VueSsrMicroAppConfig` | `@tuvix.js/vue` | `VueMicroAppConfig` without `ssr`; config of `createSsrVueMicroApp`. |
| `VuePluginEntry` | `@tuvix.js/vue` | `Plugin \| [Plugin, ...any[]]`: a plugin, or a plugin plus its `app.use` options. |
| `VueSsrContext` | `@tuvix.js/vue/server` | `{ teleports?: Record<string, string>; modules?: Set<string>; [key: string]: unknown }`, filled by Vue and its plugins during `renderVueToString`. `@vitejs/plugin-vue` records rendered component modules in `modules`. |

## Edge cases

- **Mount errors.** Setup, render and lifecycle hook errors during `mount` reject the promise in development and production builds. The adapter unmounts the failed app and dispatches `tuvix:error`. A plugin's own `app.config.errorHandler` still receives the error.
- **Mount twice into one container.** A second `mount` on a container the module already holds unmounts the old app first (dispatching `tuvix:unmounted` and emptying the container), then mounts a new one. With `ssr: true` that second mount renders fresh, because the container is empty.
- **Unknown container.** `unmount` on a container the module never mounted does nothing. `update` with such a `container` changes nothing.
- **Props replace.** The module's `update` sets the props to the object you pass and deletes missing keys. `orchestrator.updateAppProps` merges new props over the registered ones before it calls `update`.
- **Undeclared props.** Props that the root component does not declare with `defineProps` reach it as attributes and fall through to its root element, as Vue does for any component. `{ lang: 'en' }` renders `lang="en"` on the root element unless you declare `lang` or set `inheritAttrs: false`.
- **Whitespace-only container with `ssr: true`.** The adapter renders with `createApp`, because `hasServerMarkup` ignores whitespace text and comments. Vue does not warn about hydrating an empty container.
- **`renderVueToString` in the browser.** It returns `''` when `window` exists.
- **Unmount error.** If `app.unmount()` throws, the adapter empties the container, dispatches `tuvix:error` and rethrows.
- **Same name twice.** `registerModule` keeps the last module created under a name.

## What it does not do

- It does not support Vue 2.
- It does not load modules by URL. Import the module, or let [`@tuvix.js/core`](/packages/core) load it through an `entry`.
- It does not pass `MountContext.bus` or `MountContext.name` to your components. Use `getGlobalBus()` from `@tuvix.js/event-bus`.
- `renderVueToString` does not stream and does not collect CSS. Use [`@tuvix.js/vite`](/packages/vite) to print stylesheet links for server-rendered islands.
- It does not place teleported HTML for you. Read `ssrContext.teleports` and print it.

## Migrating from 0.4

**`$tuvixProps` is gone.** `update()` no longer writes `app.config.globalProperties.$tuvixProps`. Read props with `defineProps` or `inject`:

```vue
<!-- Before (0.4) -->
<template>
  <span>{{ $tuvixProps.theme }}</span>
</template>
```

```vue
<!-- After (0.5) -->
<script setup lang="ts">
defineProps<{ theme: string }>();
</script>

<template>
  <span>{{ theme }}</span>
</template>
```

**`unmount` on an unknown container does nothing.** In 0.4 it cleared the container. Call `container.replaceChildren()` yourself if you relied on that.

**`VueSsrMicroAppConfig` has no `ssr` field.** Remove `ssr` from the config you pass to `createSsrVueMicroApp`.

**Config object.** Earlier versions of this page showed `createVueMicroApp(App)`. The function takes a config object: `createVueMicroApp({ name: 'settings', App })`.

See the [Vue guide](/guide/vue) for more walkthroughs.

---
title: '@tuvix.js/vue'
---

<PackageHeader
  name="@tuvix.js/vue"
  title="Vue 绑定"
  description="把 Vue 3 组件变成 Tuvix.js 微应用，支持响应式 props、每个容器一个 Vue 应用以及 SSR 水合。用 renderVueToString 在服务端渲染它。"
  icon="💚"
  npm="true"
/>

## 安装

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

如果需要服务端渲染，还要安装 Vue 服务端渲染器，它是一个可选的 peer 依赖：

```bash
npm install @vue/server-renderer
# or pnpm add @vue/server-renderer
```

这个包需要 Vue 3（peer 范围为 `>=3.0.0`）。它依赖 `@tuvix.js/loader` 和 `@tuvix.js/event-bus`。

## 何时使用

当 Tuvix shell（宿主应用）中的某个微应用是 Vue 3 应用时，使用 `@tuvix.js/vue`。`createVueMicroApp` 把根组件包装成编排器和加载器调用的 `{ bootstrap, mount, unmount, update }` 模块。然后编排器把它挂载到容器中，用 `updateAppProps` 推送新的 props，并在路由变化时卸载它。

当 Vue 应用必须出现在第一个 HTML 响应中时（为了 SEO，或为了避免 JavaScript 运行前出现空白区域），加上服务端渲染。在服务端函数中用 `@tuvix.js/vue/server` 的 `renderVueToString` 渲染 HTML，把它放进容器，再用 `createSsrVueMicroApp` 水合。在 React 宿主页面中，把这段 HTML 传给 [`TuvixIsland`](/zh/packages/react#tuvixisland)。

如果整个页面就是一个 Vue 应用，你不需要这个包；使用 Vue 自己的 `createApp` 或 Nuxt 即可。

## 快速开始

根组件声明 shell 传入的 props：

```vue
<!-- src/micro-apps/settings/App.vue -->
<script setup lang="ts">
defineProps<{ userId: string; theme: 'light' | 'dark' }>();
</script>

<template>
  <section :class="`settings theme-${theme}`">Settings for {{ userId }}</section>
</template>
```

把它包装成模块：

```ts
// src/micro-apps/settings/index.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

在 shell 中注册它：

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

// 用 theme="dark" 重新渲染 App；组件的本地状态保留。
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## API

### `createVueMicroApp`

```ts no-check
function createVueMicroApp(config: VueMicroAppConfig): MicroAppModule;
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 模块通过 `@tuvix.js/loader` 的 `registerModule` 注册时使用的名称。生命周期事件会携带它。 |
| `App` | `Component` | 必填 | Vue 根组件。 |
| `plugins` | `VuePluginEntry[]` | 无 | 安装到每个 Vue 应用上的插件。每一项是一个插件，或者一个 `[plugin, ...options]` 元组，会传给 `app.use(plugin, ...options)`。 |
| `bootstrap` | `() => void \| Promise<void>` | 无 | 一次性初始化。模块的 `bootstrap()` 会等待它完成。 |
| `ssr` | `boolean` | `false` | 当容器包含元素或非空白文本时，用 `createSSRApp` 水合服务端标记。空容器会用 `createApp` 渲染。 |

返回的模块：

- `mount({ container, props })` 为该容器创建一个 Vue 应用，安装插件并挂载。它在容器上派发 `tuvix:mounted`，当 Vue 接管了服务端标记时带上 `hydrated: true`。
- `update({ props, container })` 把 `props` 写入该容器的响应式 props 对象，并在 Vue 刷新重新渲染（`nextTick`）后 resolve。新 props 中缺少的键会被删除。不传 `container` 时，它会更新模块已挂载的所有容器。
- `unmount({ container })` 卸载 Vue 应用，用 `replaceChildren()` 清空容器，并派发 `tuvix:unmounted`。
- `bootstrap()` 执行 `config.bootstrap`。

每个容器都有自己的 Vue 应用和自己的 props，所以一个模块可以同时挂载到多个位置：

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Badge from './Badge.vue';

const badge = createVueMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// 只有右侧的 badge 发生变化。
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

#### 在组件中读取 props

适配器把 props 保存在一个 `shallowReactive` 对象中，并通过一个根包装组件渲染 `App`，由它把这些值作为组件 props 传入。包装组件自己不渲染任何 DOM。你可以用以下两种方式之一读取 props：

- 在根组件中使用 **`defineProps`**。`update` 会用新值重新渲染它。
- 在树中的任意组件中使用 **`inject('tuvixProps')`**（或 `inject(TUVIX_PROPS_KEY)`）。你拿到的是同一个响应式对象，所以读取它的 `computed` 会在 `update` 之后更新。在深层子组件中用它代替逐层传递 props。

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

#### 带选项的插件

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

每个容器都有自己的 Vue 应用，所以每次挂载都会为每个插件重新调用 `app.use`。有状态的插件对象（例如同一个 `createPinia()` 的返回值）会被模块的所有容器共享。

### `createSsrVueMicroApp`

```ts no-check
function createSsrVueMicroApp(config: VueSsrMicroAppConfig): MicroAppModule;
```

等同于 `createVueMicroApp({ ...config, ssr: true })`。选项：`name`、`App`、`plugins`、`bootstrap`，含义见上表。

当容器中有来自 `renderVueToString` 的标记时，Vue 通过 `createSSRApp` 接管这些 DOM 节点，并在上面绑定监听器。服务端和客户端使用同一个根包装组件，所以组件树一致。挂载时请使用与服务端渲染相同的 props：

```ts
// src/micro-apps/contact/client.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString`

从 `@tuvix.js/vue/server` 子路径导入它。

```ts no-check
function renderVueToString(
  App: Component,
  props?: Record<string, unknown>,
  plugins?: VuePluginEntry[],
  ssrContext?: VueSsrContext
): Promise<string>;
```

| 参数 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `App` | `Component` | 必填 | 根组件，与你传给 `createSsrVueMicroApp` 的是同一个。 |
| `props` | `Record<string, unknown>` | `{}` | 传给 `App` 的 props。SSR 期间 `inject('tuvixProps')` 也能读到它们。 |
| `plugins` | `VuePluginEntry[]` | 无 | 要安装的插件，元组形式与 `createVueMicroApp` 相同。 |
| `ssrContext` | `VueSsrContext` | `{}` | Vue 在渲染期间写入的对象。promise resolve 后读取 `teleports` 和 `modules`。 |

它用共享的根包装组件创建一个 SSR 应用，安装插件，并返回 `@vue/server-renderer` 的 `renderToString` 生成的 HTML。请安装这个包；`renderVueToString` 会在首次调用时导入它。

`renderVueToString` 只能在服务端使用。请在服务端函数中调用它（TanStack Start 的 `createServerFn` handler、API 路由、你的 Express handler），不要在同构的路由 loader 中调用。loader 在客户端导航时也会在浏览器中运行，这时函数返回 `''`；而且因为 loader 导入了它，你的打包工具会把 Vue 服务端渲染器打进客户端。

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

把 `html` 放进页面中的容器元素（`<div id="contact">…</div>`），然后按上文所示在客户端挂载 `createSsrVueMicroApp`。`<Teleport>` 目标的 HTML 在 `ssrContext.teleports['#target']` 中，不在返回的字符串里；请在目标所在的位置输出它。

### `TUVIX_PROPS_KEY`

```ts no-check
const TUVIX_PROPS_KEY = 'tuvixProps';
```

响应式 props 对象的注入键。`inject(TUVIX_PROPS_KEY)` 和 `inject('tuvixProps')` 返回同一个对象，在客户端和 `renderVueToString` 期间都是如此。

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

在 `onMounted` 中把 `handler` 订阅到 `event`，并在 `onUnmounted` 中取消订阅。返回的函数可以提前取消订阅。请在 `setup` 期间调用它。服务端渲染时 `onMounted` 不会执行，所以订阅只存在于客户端。

适配器不会把编排器的事件总线传给 `App`。除非你给编排器传了 `eventBus` 选项，否则它使用 `getGlobalBus()`：

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

| 参数 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `initialProps` | `T` | 必填 | 初始值，只复制一次。 |
| `bus` | `IEventBus` | 无 | 要监听的事件总线。不传时，ref 保持为 `initialProps`。 |
| `updateEvent` | `string` | `'tuvix:props:update'` | composable 会把这个事件的 payload 合并进 ref（`{ ...prev, ...payload }`）。 |

编排器和适配器都不会发出 `tuvix:props:update`，需要你自己发出。对于来自编排器的 props，请使用 `defineProps` 或 `inject(TUVIX_PROPS_KEY)`，它们无需事件总线就会跟随 `update` 更新。

```vue
<script setup lang="ts">
import { useTuvixProps } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const settings = useTuvixProps({ theme: 'light' }, getGlobalBus());
// 在其他地方：getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
</script>

<template>
  <p>Theme: {{ settings.theme }}</p>
</template>
```

### 类型

| 类型 | 导出位置 | 含义 |
| --- | --- | --- |
| `VueMicroAppConfig` | `@tuvix.js/vue` | `createVueMicroApp` 的配置：`name`、`App`、`plugins?`、`bootstrap?`、`ssr?`。 |
| `VueSsrMicroAppConfig` | `@tuvix.js/vue` | 不含 `ssr` 的 `VueMicroAppConfig`；`createSsrVueMicroApp` 的配置。 |
| `VuePluginEntry` | `@tuvix.js/vue` | `Plugin \| [Plugin, ...any[]]`：一个插件，或一个插件加上它的 `app.use` 选项。 |
| `VueSsrContext` | `@tuvix.js/vue/server` | `{ teleports?: Record<string, string>; modules?: Set<string>; [key: string]: unknown }`，在 `renderVueToString` 期间由 Vue 及其插件填充。`@vitejs/plugin-vue` 会把渲染过的组件模块记录到 `modules` 中。 |

## 边界情况

- **挂载错误。** 在开发和生产构建中，`mount` 期间的 setup、渲染和生命周期钩子错误都会让 promise reject。适配器会卸载失败的应用并派发 `tuvix:error`。插件自己的 `app.config.errorHandler` 仍会收到该错误。
- **向同一容器挂载两次。** 对模块已持有的容器再次调用 `mount`，会先卸载旧应用（派发 `tuvix:unmounted` 并清空容器），再挂载新应用。在 `ssr: true` 时，第二次挂载会全新渲染，因为容器已为空。
- **未知容器。** 对模块从未挂载过的容器调用 `unmount` 不做任何事。用这样的 `container` 调用 `update` 不会改变任何内容。
- **Props 整体替换。** 模块的 `update` 把 props 设置为你传入的对象，并删除缺少的键。`orchestrator.updateAppProps` 会先把新 props 合并到注册时的 props 上，再调用 `update`。
- **未声明的 props。** 根组件没有用 `defineProps` 声明的 props 会作为 attribute 传入，并透传到它的根元素上，这与 Vue 对任何组件的处理方式一致。除非你声明了 `lang` 或设置了 `inheritAttrs: false`，否则 `{ lang: 'en' }` 会在根元素上渲染出 `lang="en"`。
- **`ssr: true` 时容器只含空白。** 适配器用 `createApp` 渲染，因为 `hasServerMarkup` 忽略空白文本和注释。Vue 不会因为水合空容器而发出警告。
- **在浏览器中调用 `renderVueToString`。** 当 `window` 存在时，它返回 `''`。
- **卸载错误。** 如果 `app.unmount()` 抛出错误，适配器会清空容器，派发 `tuvix:error`，然后重新抛出。
- **同一名称使用两次。** `registerModule` 保留以该名称最后创建的模块。

## 它不做什么

- 它不支持 Vue 2。
- 它不通过 URL 加载模块。请导入模块，或让 [`@tuvix.js/core`](/zh/packages/core) 通过 `entry` 加载它。
- 它不把 `MountContext.bus` 或 `MountContext.name` 传给你的组件。请使用 `@tuvix.js/event-bus` 的 `getGlobalBus()`。
- `renderVueToString` 不支持流式渲染，也不收集 CSS。请使用 [`@tuvix.js/vite`](/zh/packages/vite) 为服务端渲染的 island 输出样式表链接。
- 它不会替你放置 teleport 出去的 HTML。请读取 `ssrContext.teleports` 并输出它。

## 从 0.4 迁移

**`$tuvixProps` 已移除。** `update()` 不再写入 `app.config.globalProperties.$tuvixProps`。请用 `defineProps` 或 `inject` 读取 props：

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

**对未知容器调用 `unmount` 不做任何事。** 在 0.4 中它会清空容器。如果你依赖这个行为，请自己调用 `container.replaceChildren()`。

**`VueSsrMicroAppConfig` 没有 `ssr` 字段。** 从传给 `createSsrVueMicroApp` 的配置中移除 `ssr`。

**配置对象。** 本页的早期版本展示的是 `createVueMicroApp(App)`。这个函数接收一个配置对象：`createVueMicroApp({ name: 'settings', App })`。

更多示例请参阅 [Vue 指南](/zh/guide/vue)。

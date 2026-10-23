# 搭配 Vue 使用

`@tuvix.js/vue` 把 Vue 3 根组件变成微应用，对服务端渲染的标记进行水合，并在服务端把组件渲染为 HTML。

## 安装

```bash
pnpm add @tuvix.js/vue vue
# 服务端使用 renderVueToString 时需要
pnpm add @vue/server-renderer
```

## 把组件变成微应用

```ts
// src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import { createPinia } from 'pinia';
import { analytics } from './analytics-plugin';
import App from './App.vue';

export default createVueMicroApp({
  name: 'settings',
  App,
  plugins: [createPinia(), [analytics, { id: 'G-123' }]],
});
```

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 必填。必须与注册的应用名称一致。 |
| `App` | `Component` | 必填。根组件。 |
| `plugins` | `Array<Plugin \| [Plugin, ...options]>` | 每次挂载时通过 `app.use(plugin, ...options)` 安装。 |
| `bootstrap` | `() => void \| Promise<void>` | 在首次挂载前运行一次。 |
| `ssr` | `boolean` | 对服务端标记进行水合。`createSsrVueMicroApp` 会设置它。 |

每个容器都有自己的 Vue 应用，所以每次挂载都会再次运行每个插件的 `install`。`createPinia()` 这样的插件实例由该模块的所有挂载共享。如果每次挂载都需要自己的 store，请在插件函数内部创建它。

挂载到已经包含该应用的容器时，会先卸载旧实例。`unmount` 会销毁应用，清空容器，并派发 `tuvix:unmounted`。

## Props

适配器把 props 传给根组件，同时以 `'tuvixProps'`（`TUVIX_PROPS_KEY`）提供给所有后代组件：

```vue
<!-- App.vue -->
<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

defineProps<{ userId: string; theme?: 'light' | 'dark' }>();

const all = inject<Record<string, unknown>>(TUVIX_PROPS_KEY);
</script>

<template>
  <div :class="theme">User {{ userId }} ({{ Object.keys(all ?? {}).length }} props)</div>
</template>
```

`update({ props })` 替换 `shallowReactive` 对象中的 props，并等待 Vue 的下一个 tick。根组件用新值重新渲染，并保留自己的本地状态。新 props 中缺少的键会被移除。不传 `container` 时，`update` 会更新该模块的所有挂载。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## 服务端渲染与水合

在服务端用 `renderVueToString` 渲染，在客户端用 `createSsrVueMicroApp` 水合：

```ts
// server-only module
import { renderVueToString } from '@tuvix.js/vue/server';
import Newsletter from './Newsletter.vue';

export async function renderNewsletter(list: string): Promise<string> {
  const ssrContext: { teleports?: Record<string, string> } = {};
  const html = await renderVueToString(Newsletter, { list }, [], ssrContext);
  return html; // ssrContext.teleports holds <Teleport> output
}
```

```ts
// client
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

export const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });
```

- `renderVueToString(App, props?, plugins?, ssrContext?)` 用客户端相同的根包裹 `App`，所以 `inject('tuvixProps')` 在服务端也能工作，水合结果也能对上。
- 只在服务端代码中调用它：服务端函数、API 路由或你的服务端入口。在浏览器中它返回 `''`。同构的路由 loader 也会在浏览器中运行，打包工具随后会把 Vue 服务端渲染器打包进客户端。
- 设置 `ssr: true` 且容器中有服务端标记时，适配器调用 `createSSRApp` 并保留服务端 DOM 节点。空容器会用 `createApp` 重新渲染。
- HTML 中不包含 CSS。Vite 在水合开始后通过 JavaScript 注入 SFC 的 `<style>` 块。用 `@tuvix.js/vite` 在 `<head>` 中链接样式表；参见 [SSR Islands](/zh/guide/ssr-islands)。

在 React 宿主中，用 `TuvixIsland` 挂载该模块。

## 组合式函数

### useTuvixBus

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/vue';

const count = ref(0);
useTuvixBus<{ itemCount: number }>(getGlobalBus(), 'cart:updated', ({ itemCount }) => {
  count.value = itemCount;
});
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>
```

它在 `onMounted` 中订阅，在 `onUnmounted` 中取消订阅，并返回一个用于提前清理的函数。

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` 返回一个 `ShallowRef`，它会合并 `updateEvent` 上发出的每个负载。Tuvix.js 本身不会发出该事件。使用适配器时，通过 `updateAppProps` 传入的 props 已经会让组件重新渲染，所以你很少需要它。

## 边界情况

- `~/utils` 这样的路径别名在 `.vue` 文件中也必须能解析。如果别名来自 `vite-tsconfig-paths`，请在该 tsconfig 的 `include` 中加入 `**/*.vue`，或在 Vite 配置中设置 `resolve.alias`。参见[故障排查](/zh/guide/troubleshooting)。
- 挂载期间 setup、render 或生命周期钩子出错时，`mount` 会 reject 并派发 `tuvix:error`，生产构建中也是如此。插件自己的 `app.config.errorHandler` 仍会运行。
- 对该模块从未挂载过的容器调用 `unmount` 不会做任何事。

## API

| 导出 | 用途 |
| --- | --- |
| `createVueMicroApp({ name, App, plugins?, bootstrap?, ssr? })` | Vue 微应用模块 |
| `createSsrVueMicroApp({ name, App, plugins?, bootstrap? })` | 同上，带 `ssr: true` |
| `TUVIX_PROPS_KEY` | 响应式 props 的注入键（`'tuvixProps'`） |
| `useTuvixBus(bus, event, handler)` | 与组件绑定的事件总线订阅 |
| `useTuvixProps(initial, bus?, event?)` | 由总线事件合并而来的 `ShallowRef` |
| 来自 `@tuvix.js/vue/server` 的 `renderVueToString(App, props?, plugins?, ssrContext?)` | 服务端 HTML |

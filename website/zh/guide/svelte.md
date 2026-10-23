# 搭配 Svelte 使用

`@tuvix.js/svelte` 把 Svelte 组件变成微应用。它支持 Svelte 5 和 Svelte 3/4，可以对服务端标记进行水合，并在服务端把组件渲染为 HTML。

## 安装

```bash
pnpm add @tuvix.js/svelte svelte
```

## 把组件变成微应用

```ts
// src/main.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

// SvelteMap（仅 Svelte 5）让 update() 原地重新渲染；Svelte 3/4 请去掉它。
export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

首次挂载时，适配器会导入 `svelte` 并检查它提供哪套 API：

| Svelte | 挂载 | 水合 | 更新 | 卸载 |
| --- | --- | --- | --- | --- |
| 5 | `mount(App, { target, props })` | `hydrate(...)` | 有 `SvelteMap` 时原地更新，否则重新挂载 | `unmount(instance)` |
| 3 / 4 | `new App({ target, props })` | `new App({ hydrate: true })` | `instance.$set(props)` | `instance.$destroy()` |

你的打包工具必须把 `svelte` 解析为浏览器构建。如果它选中了服务端构建，Svelte 5 的 `mount()` 会抛出 `lifecycle_function_unavailable`，或者 `onMount` 回调永远不会运行。参见[故障排查](/zh/guide/troubleshooting)。

每个容器都有自己的组件实例。`mount` 在 `onMount` 回调和 effect 运行之后派发 `tuvix:mounted`。不设置 `ssr` 时，`mount` 会在渲染前清空容器。对该模块从未挂载过、或挂载失败的容器调用 `unmount` 不会做任何事。

## Props

使用 runes 的 Svelte 5：

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { userId, theme = 'light' }: { userId: string; theme?: string } = $props();
</script>

<div class="theme-{theme}">User {userId}</div>
```

Svelte 3/4，或处于 legacy 模式的 Svelte 5：

```svelte
<script lang="ts">
  export let userId: string;
  export let theme = 'light';
</script>

<div class="theme-{theme}">User {userId}</div>
```

在 Svelte 5 上，在配置中传入来自 `svelte/reactivity` 的 `SvelteMap`。适配器随后会给组件一个由 `SvelteMap` 支撑的 props 对象，`update({ props })` 把新值写入其中：只有读取了已变更 prop 的部分会重新渲染，DOM 节点和组件状态都会保留。这对 `$props()` 和 `export let` 都有效。不传 `SvelteMap` 时，Svelte 5 的 `update()` 会卸载实例，用新 props 挂载一个新实例，并再次派发 `tuvix:mounted`，因此本地状态会重置。适配器自己不导入 `svelte/reactivity`，因为该模块在 Svelte 3/4 中不存在，它们的构建会失败。

在 Svelte 3/4 上，`update` 调用 `$set`，并忽略 `SvelteMap`。

每次更新都会替换整组 props。新 props 中缺少的键，在 Svelte 5 上回退为该 prop 的默认值，在 Svelte 3/4 上变为 `undefined`。编排器总是发送合并后的 props，所以只有你自己调用 `update` 时这一点才有影响。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

## 服务端渲染与水合

```ts
// server-only module
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooter(): Promise<string> {
  return renderSvelteToString(Footer, { year: 2026 }, { render });
}
```

```ts
// client
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

- `renderSvelteToString(App, props?, { render? })` 返回组件的 `<style>` 标签，后面跟着它的标记。请在服务端代码中调用它；在浏览器中它返回 `''`。
- 当你的服务端 bundle 包含 Svelte 时（Nitro、Vinxi、带 `noExternal` 的 Vite SSR 构建），请传入来自 `svelte/server` 的 `render`。不传时，适配器会在运行时导入 `svelte/server`，这可能加载第二份 Svelte，而 Svelte 的服务端渲染器在多份副本之间会失败。
- 需要 `<svelte:head>` 的输出时，`renderSvelte(App, props?, { render? })` 返回 `{ html, head, css }`。你需要自己把 `head` 放进文档的 `<head>`；island 中不能包含 `<title>` 或 `<meta>`。
- 当容器中有元素或非空白文本时，`createSsrSvelteMicroApp` 会进行水合，否则重新渲染。Svelte 3/4 组件必须用 `hydratable: true` 编译。

### 首次绘制时的 CSS

二选一：

- **CSS 放在 HTML 中。** 用 `compilerOptions: { css: 'injected' }` 编译。Svelte 5 随后会把组件 CSS 放进服务端输出，`renderSvelteToString` 会把它作为 `<style>` 标签放在 island 内部。
- **CSS 作为文件。** 保留默认的 `emitCss: true`，并用 `@tuvix.js/vite` 在 `<head>` 中链接 island 的样式表。参见 [SSR Islands](/zh/guide/ssr-islands)。

使用 `css: 'injected'` 时没有样式表文件，所以 `@tuvix.js/vite` 找不到可链接的内容。不要同时使用这两种方式。

## 事件总线

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getGlobalBus } from '@tuvix.js/event-bus';

  let count = $state(0);
  const off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
    count = itemCount;
  });
  onDestroy(off);
</script>

<span class="badge">{count}</span>
```

## 适配器不做什么

- 它不编译 `.svelte` 文件；这由 `@sveltejs/vite-plugin-svelte` 负责。
- 它只传递 props。slot、snippet 和组件事件都不会从宿主传过来。
- 它不检查你的打包工具选中了哪个 Svelte 构建。

## API

| 导出 | 用途 |
| --- | --- |
| `createSvelteMicroApp({ name, App, bootstrap?, ssr?, SvelteMap? })` | Svelte 微应用模块 |
| `createSsrSvelteMicroApp({ name, App, bootstrap?, SvelteMap? })` | 同上，带 `ssr: true` |
| 来自 `@tuvix.js/svelte/server` 的 `renderSvelteToString(App, props?, options?)` | 样式 + 标记 |
| 来自 `@tuvix.js/svelte/server` 的 `renderSvelte(App, props?, options?)` | `{ html, head, css }` |

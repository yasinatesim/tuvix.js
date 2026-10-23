# @tuvix.js/svelte

> Tuvix.js 微前端框架的 Svelte 3/4/5 绑定

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。

## 安装

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

## 快速开始

```ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App });
```

适配器通过 `@tuvix.js/loader` 的 `registerModule` 注册模块，所以编排器能按名称找到它。第一次挂载时，它会导入 `svelte` 并检查是否有 `mount` 导出：

- **Svelte 5**：使用 `svelte` 的 `mount()` / `hydrate()` / `unmount()`。
- **Svelte 3/4**：使用 `new App({ target, props })`、`$set()` 和 `$destroy()`。

你的打包工具必须把 `svelte` 解析为客户端构建（`browser` 导出条件；`@sveltejs/vite-plugin-svelte` 会设置它）。如果它选中了服务端构建，Svelte 5 的 `mount()` 会抛出 `lifecycle_function_unavailable`。

## API

### `createSvelteMicroApp(config)`

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 应用名，通过 `registerModule` 注册 |
| `App` | `unknown` | 必填 | Svelte 5 组件，或 Svelte 3/4 组件类 |
| `bootstrap` | `() => void \| Promise<void>` | 无 | 一次性初始化 |
| `ssr` | `boolean` | `false` | 容器中有服务端标记时对其进行水合 |
| `SvelteMap` | `SvelteMap` 类 | 无 | 仅限 Svelte 5：来自 `svelte/reactivity` 的 `SvelteMap`，让 `update()` 原地重新渲染，而不是重新挂载 |

- 每个容器都有自己的实例，所以一个模块可以挂载到多个容器中。
- `mount` 清空容器（水合时除外），进行渲染，并在 `onMount` 回调和 effect 运行之后派发 `tuvix:mounted`。挂载失败时派发 `tuvix:error` 并 reject。
- `unmount` 销毁实例、清空容器并派发 `tuvix:unmounted`。如果在 `mount` 仍在加载时调用，它会等待挂载完成，然后将其拆除。
- `update({ props, container? })` 更新一个容器；不传 `container` 时更新所有实例。Svelte 3/4 使用 `$set()`。Svelte 5 默认重新挂载：卸载实例，用新的 props 挂载一个新实例，并再次派发 `tuvix:mounted`，因此 DOM 节点和组件状态会丢失。传入 `SvelteMap` 可以改为原地更新（对 `$props()` 和 `export let` 都有效）：

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App, SvelteMap });
```

适配器自己不导入 `svelte/reactivity`：Svelte 3/4 没有这个模块，导入它会让 Svelte 3/4 应用构建失败。

宿主通过编排器发送新的 props：

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
});
await orchestrator.start();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

### `createSsrSvelteMicroApp(config)`

等同于 `createSvelteMicroApp({ ...config, ssr: true })`。当容器中有元素或非空白文本时进行水合，否则重新渲染。Svelte 5 的水合需要 `svelte/server` 写入的注释标记。Svelte 3/4 组件请使用 `hydratable: true` 编译。

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `@tuvix.js/svelte/server` 中的 `renderSvelteToString(App, props?, options?)`

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | 无 | 来自 `svelte/server` 的 `render`；不传时适配器在运行时导入 `svelte/server` |

返回组件的 `<style>` 标签，后面跟着它的标记。传入 `render` 时，它始终使用 Svelte 5 的 `render`。不传时，适配器会导入 `svelte`：如果该模块导出了 `mount`，就加载 `svelte/server`（Svelte 5），否则调用 `App.render(props)`（Svelte 3/4）并把 `css.code` 包进 `<style>`。用 `dev: true` 编译的 Svelte 5 组件（serve 模式下的 vite-plugin-svelte）带有一个会抛错的 `App.render`，所以适配器从不根据 `App.render` 做判断。请在服务端函数中调用它；在浏览器中它返回 `''`。

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const footerHtml = await renderSvelteToString(
  Footer,
  { year: 2026 },
  { render }
);
```

### `@tuvix.js/svelte/server` 中的 `renderSvelte(App, props?, options?)`

选项相同。返回 `{ html, head, css }`，你可以把 `<svelte:head>` 的内容放进文档的 head 中。

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const { html, head, css } = await renderSvelte(
  Footer,
  { year: 2026 },
  { render }
);
```

### 类型

`SvelteMicroAppConfig`、`SvelteProps`（来自 `@tuvix.js/svelte`）；`RenderSvelteOptions`、`SvelteServerRender`、`SvelteRenderResult`（来自 `@tuvix.js/svelte/server`）。

## 边界情况

- 只有使用 `css: 'injected'` 编译时，Svelte 5 才会在服务端输出中包含 CSS（Vite：`svelte({ compilerOptions: { css: 'injected' } })`）。使用默认的 `css: 'external'` 时，打包工具会把 CSS 写入文件。
- 当你的服务端 bundle 包含 Svelte 时（Nitro、Vinxi、`noExternal` 的 Vite SSR 构建），请传入 `svelte/server` 的 `render`。如果组件和渲染器来自两份不同的 Svelte，Svelte 的服务端渲染器会失败。
- 每次更新都会替换整组 props。新 props 中缺少的键在 Svelte 5 上会被删除（使用默认值），在 Svelte 3/4 上会被设为 `undefined`。
- 对已挂载的容器调用 `mount` 会先卸载旧实例。对模块从未挂载过的容器调用 `unmount` 不做任何事：它保留容器的子节点，也不派发事件。
- 服务端上的 Svelte 5 导入或渲染错误会 reject；不会回退到 `App.render`。

## 它不做什么

- 它不编译 `.svelte` 文件，也不检查打包工具选中了哪个 Svelte 构建。
- 它只传递 props：不支持来自宿主的 slot、snippet 或组件事件。
- 它不会把 `<svelte:head>` 的内容写入文档，也不会链接 `css: 'external'` 生成的样式表。

完整文档：[tuvix.js.org/zh/packages/svelte](https://tuvix.js.org/zh/packages/svelte)

## 许可证

MIT

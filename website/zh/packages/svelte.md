---
title: '@tuvix.js/svelte'
---

<PackageHeader
  name="@tuvix.js/svelte"
  title="Svelte 绑定"
  description="把 Svelte 3、4 或 5 组件变成 Tuvix.js 微应用：每个容器一个实例，原地更新 props，水合服务端标记，并在服务端渲染时带上 CSS。"
  icon="🔥"
  npm="true"
/>

## 安装

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

peer 依赖范围覆盖 Svelte 3、4 和 5。这个包有两个入口：`@tuvix.js/svelte` 用于浏览器，`@tuvix.js/svelte/server` 用于服务端渲染。

## 何时使用

当一个 Svelte 组件需要作为 Tuvix.js 微应用运行时，使用这个包：编排器在某个路由上把它挂载到容器中，传入 props，更新 props，并在路由变化时卸载它。它也支持 island：你在服务端渲染组件，把 HTML 放进页面，客户端再对它进行水合。

如果整个页面从上到下都由 Svelte 负责（SvelteKit），你不需要这个包。这种情况下 Svelte 自己完成挂载，没有编排器需要对接。

## 快速开始

一个带 props 的 Svelte 5 组件：

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { name, theme = 'light' }: { name: string; theme?: string } = $props();
</script>

<p class={theme}>Hello {name}</p>
```

微应用入口包装这个组件。传入 `SvelteMap` 后，props 更新会原地重新渲染组件：

```ts
// profile-app.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

shell（宿主应用）注册应用并启动编排器：

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
  props: { name: 'Ada' },
});

await orchestrator.start();

// 之后：组件原地重新渲染，不会重新挂载。
await orchestrator.updateAppProps('profile', { name: 'Grace', theme: 'dark' });
```

客户端 bundle 必须把 `svelte` 解析到它的浏览器构建。`@sveltejs/vite-plugin-svelte` 会替你完成这一步。如果你的配置丢掉了 `browser` 导出条件，Svelte 5 的 `mount()` 会抛出 `lifecycle_function_unavailable`，`onMount` 也永远不会执行。

## API

### `createSvelteMicroApp`

```ts no-check
function createSvelteMicroApp(config: SvelteMicroAppConfig): MicroAppModule;
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 应用名。适配器用 `@tuvix.js/loader` 的 `registerModule` 以这个名字注册模块。 |
| `App` | `unknown` | 必填 | 根组件：编译后的 Svelte 5 组件（一个函数）或 Svelte 3/4 组件类。 |
| `bootstrap` | `() => void \| Promise<void>` | 无 | 一次性初始化。模块的 `bootstrap()` 会等待它完成。 |
| `ssr` | `boolean` | `false` | 当容器中有元素或非空白文本时，水合服务端标记；否则重新渲染。 |
| `SvelteMap` | 来自 `svelte/reactivity` 的 `SvelteMap` 类 | 无 | 仅限 Svelte 5。传入后，`update()` 原地重新渲染；不传时，Svelte 5 的 `update()` 会重新挂载组件。Svelte 3/4 忽略这个选项。 |

首次挂载时，适配器导入 `svelte` 并检查是否存在 `mount` 导出。结果在当前页面内缓存。

- **Svelte 5**（存在 `mount`）：用 `mount()` 渲染，用 `hydrate()` 水合，用 `unmount()` 销毁。`update()` 的行为取决于 `SvelteMap`：
  - 传入 `SvelteMap` 时，组件收到一个由 `SvelteMap` 支撑的 props 对象。`update()` 把新值写入这个 map，模板中读取了变化 prop 的部分会重新渲染，组件保留它的 DOM 节点和状态。这对 `$props()` 组件和由 Svelte 5 编译的旧式 `export let` 组件都有效。
  - 不传时，`update()` 卸载实例，清空容器，用新 props 挂载一个新实例，并再次派发 `tuvix:mounted`，其中 `hydrated: false`。DOM 节点、焦点和组件状态都会丢失。
- **Svelte 3/4**（没有 `mount`）：使用 `new App({ target, props, hydrate })`、`$set()` 和 `$destroy()`。

返回的模块按容器工作。每个容器有自己的实例，所以一个模块可以同时渲染到三个容器中。

- `mount({ container, props })` 清空容器（水合时除外），渲染，执行 `onMount` 回调和 effect，然后在容器上派发 `tuvix:mounted`，带上 `hydrated: true | false`。失败时派发 `tuvix:error`，并以原始错误 reject。
- `update({ props, container? })` 更新 `container` 中的实例；省略 `container` 时更新所有实例。每次更新都会替换整组 props：新 props 中缺少的键，在 Svelte 5 上回退到组件的默认值，在 Svelte 3/4 上变为 `undefined`。
- `unmount({ container })` 销毁实例，清空容器，并派发 `tuvix:unmounted`。

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import { onLifecycle } from '@tuvix.js/loader';
import Cart from './Cart.svelte';

const cart = createSvelteMicroApp({ name: 'cart', App: Cart, SvelteMap });

onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} mounted`, { hydrated });
});

const header = document.querySelector<HTMLElement>('#cart-header')!;
const sidebar = document.querySelector<HTMLElement>('#cart-sidebar')!;

await cart.mount({ container: header, props: { compact: true } });
await cart.mount({ container: sidebar, props: { compact: false } });

// 只更新侧边栏实例。
await cart.update?.({ props: { compact: true }, container: sidebar });
```

### `createSsrSvelteMicroApp`

```ts no-check
function createSsrSvelteMicroApp(config: Omit<SvelteMicroAppConfig, 'ssr'>): MicroAppModule;
```

等同于 `createSvelteMicroApp({ ...config, ssr: true })`。在客户端用它处理服务端通过 `renderSvelteToString` 或 `renderSvelte` 渲染的 island。

- **Svelte 5**：`hydrate(App, { target, props })`。标记必须来自 `svelte/server`，因为水合会读取它写入的注释标记（`<!--[-->`）。
- **Svelte 3/4**：`new App({ target, props, hydrate: true })`。编译组件时使用 `hydratable: true`。

水合会保留服务端的 DOM 节点，并为它们绑定事件处理函数。只包含空白或注释的容器会重新渲染。

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelteToString(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<string>;
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | 无 | 来自 `svelte/server` 的 `render`。不传时，适配器在运行时导入 `svelte/server`。 |

在服务端渲染组件，返回它的 `<style>` 标签，后面跟着组件标记。把这个字符串放进 island 容器，再用 `createSsrSvelteMicroApp` 挂载。字符串不包含 `<svelte:head>` 的内容；需要它时使用 `renderSvelte`。

函数在运行时选择 Svelte 版本。传入 `render` 时，它总是走 Svelte 5 路径，调用 `render(App, { props })`。不传时，适配器导入 `svelte`：如果该模块导出了 `mount`，就加载 `svelte/server` 并用 Svelte 5 渲染；否则调用 `App.render(props)`（Svelte 3/4，使用 `generate: 'ssr'` 编译），并把 `css.code` 包进一个 `<style>` 标签。适配器从不通过检查 `App.render` 来判断版本，因为用 `dev: true` 编译的 Svelte 5 组件（serve 模式下的 vite-plugin-svelte）带有一个会抛错的 `App.render` 桩函数。

在服务端函数中调用它，不要在同时运行于浏览器的代码中调用。在浏览器中它返回 `''`。

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooterIsland(): Promise<string> {
  const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
  return `<footer id="footer" data-tuvix-app="footer">${html}</footer>`;
}
```

### `renderSvelte`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelte(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<SvelteRenderResult>;
```

参数和选项与 `renderSvelteToString` 相同，但分别返回各个部分：

| 字段 | 含义 |
| --- | --- |
| `html` | 组件标记。Svelte 5 的输出带有水合注释。 |
| `head` | `<svelte:head>` 的内容，不含组件的 `<style>` 标签。把它放进文档的 `<head>`。 |
| `css` | 以 `<style>` 标签形式给出的组件 CSS；编译器没有输出 CSS 时为 `''`。 |

在浏览器中三个字段都是 `''`。

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Article from './Article.svelte';

export async function renderArticlePage(slug: string): Promise<string> {
  const { html, head, css } = await renderSvelte(Article, { slug }, { render });
  return `<!doctype html>
<html>
  <head>${head}${css}</head>
  <body>
    <main id="article" data-tuvix-app="article">${html}</main>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
}
```

### 类型

| 类型 | 入口 | 含义 |
| --- | --- | --- |
| `SvelteMicroAppConfig` | `@tuvix.js/svelte` | `createSvelteMicroApp` 的选项。 |
| `SvelteProps` | `@tuvix.js/svelte` | `Record<string, unknown>`：编排器传给组件的 props。 |
| `RenderSvelteOptions` | `@tuvix.js/svelte/server` | `{ render?: SvelteServerRender }`。 |
| `SvelteServerRender` | `@tuvix.js/svelte/server` | 来自 `svelte/server` 的 Svelte 5 `render` 的类型。 |
| `SvelteRenderResult` | `@tuvix.js/svelte/server` | `{ html, head, css }`，由 `renderSvelte` 返回。 |

## 服务端渲染

一个 island 经过三步：在服务端渲染，把 HTML 放在容器中发送出去，在客户端水合。

1. 在服务端函数中调用 `renderSvelteToString`（或 `renderSvelte`），把结果放进容器元素。
2. 加载客户端入口，它导出 `createSsrSvelteMicroApp({ name, App })`。
3. 编排器把应用挂载到同一个容器中。适配器发现其中有标记，于是进行水合。

**CSS。** 只有在使用 `css: 'injected'` 编译时，Svelte 5 才会把组件 CSS 放进渲染输出。使用默认的 `css: 'external'` 时，bundler 把 CSS 写入文件，字符串中不含 `<style>` 标签。在 Vite 中：

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { css: 'injected' } })],
});
```

如果保留 `css: 'external'`，在页面 head 中链接生成的样式表。[`@tuvix.js/vite`](/zh/packages/vite) 会告诉你的服务端某个 island 入口需要哪些样式表。

**只有一份 Svelte。** 当你的服务端 bundle 包含 Svelte 时（Nitro、Vinxi、带 `noExternal` 的 Vite SSR 构建），传入来自 `svelte/server` 的 `render`。这样组件和渲染器共用同一份 Svelte。不传这个选项时，适配器在运行时导入 `svelte/server`，可能会从 `node_modules` 加载第二份。Svelte 的服务端渲染器使用 `instanceof` 检查，组件和渲染器来自不同副本时会失败。

## 边界情况

- 对已经有同一模块实例的容器调用 `mount`，会先卸载旧实例。
- 在 `mount` 仍在加载 `svelte` 时调用 `unmount`，会等挂载完成后再销毁实例。不会留下孤立的组件。
- 对这个模块从未挂载过或挂载失败的容器调用 `unmount`，不做任何事：容器保留它的子节点，也不触发任何事件。
- 在挂载尚未完成时调用 `update`，会等待挂载完成后再应用 props。对挂载失败的实例调用 `update` 不做任何事。
- 在 Svelte 3/4 上，新 props 中缺少的 prop 变为 `undefined`。`export let name = 'x'` 的默认值不会恢复。在 Svelte 5 上会应用默认值，无论是否传入 `SvelteMap`。
- 适配器本身不导入 `svelte/reactivity`。Svelte 3/4 没有这个模块，引用它的 Svelte 3/4 应用会构建失败，所以这个导入放在你的 Svelte 5 入口中。
- Svelte 5 重新挂载（没有 `SvelteMap`）时会再次派发 `tuvix:mounted`，但中间不会派发 `tuvix:unmounted`。如果新的渲染抛错，`update()` 以该错误 reject，而旧实例已经被移除。
- 没有 `ssr` 时，`mount` 会在渲染前清空容器，所以加载占位内容会消失。
- 有 `ssr` 时，容器中有元素或非空白文本，适配器才会水合。只有注释和空白时会重新渲染。
- 适配器每个页面只检测一次 Svelte 版本。如果 `import('svelte')` 失败，下一次挂载会重试。
- 服务端的 Svelte 5 导入错误或渲染错误会以 rejected promise 的形式交给你。适配器不会回退到 `App.render`。
- Svelte 5 的 `render` 可能返回 promise（异步服务端渲染）。两个服务端函数都会等待它。

## 它不做什么

- 它不编译 `.svelte` 文件。这由你的 bundler 通过 `@sveltejs/vite-plugin-svelte` 或 `svelte/compiler` 完成。
- 它不检查 bundler 选择了哪个 Svelte 构建。把 `svelte` 解析到服务端构建的客户端 bundle 会在挂载时失败。
- 它只传递 props。slot、snippet 和组件事件没有来自宿主的通道。跨应用通信请使用 [`@tuvix.js/event-bus`](/zh/packages/event-bus)。
- 它不把 `<svelte:head>` 的内容写入文档。`renderSvelte` 会返回它，由你的服务端放进 `<head>`。
- 它不链接用 `css: 'external'` 编译的 CSS。参见 [`@tuvix.js/vite`](/zh/packages/vite)。
- 它不在服务端等待数据。先加载数据，再作为 props 传入。

## 从 0.4 迁移

- **支持 Svelte 5。** 在 0.4 中，适配器对每个组件都调用 `new App()`，所以 Svelte 5 组件会失败，`createSsrSvelteMicroApp` 也会渲染出第二份内容而不是水合。挂载无需修改代码。要原地更新 props，在配置中传入来自 `svelte/reactivity` 的 `SvelteMap`；不传时，每次 Svelte 5 更新都会重新挂载组件。
- **挂载时清空容器。** 没有 `ssr` 时，Svelte 3/4 以前会把组件追加到容器中已有标记的后面。现在适配器会先清空容器。如果你依赖组件旁边保留的标记，把它移到容器外面。
- **服务端不再静默回退。** `renderSvelteToString` 以前在 `svelte/server` 加载失败时回退到 `App.render`。现在，传入 `render` 或 `svelte` 导出了 `mount` 时，它走 Svelte 5 路径；只在 Svelte 3/4 上调用 `App.render`；遇到 Svelte 5 导入错误或渲染错误时 reject。Vite 开发 SSR 中的 Svelte 5 开发构建即使带有 `App.render` 桩函数，也会走 Svelte 5 路径。
- **对未知容器调用 `unmount` 不做任何事。** 以前对模块从未挂载过的容器调用 `unmount({ container })` 会清空它。现在它不动这个容器，与 React、Vue 和 Angular 适配器一致。
- **传入 `render`。** 当你的服务端 bundle 包含 Svelte 时，把来自 `svelte/server` 的 `{ render }` 作为第三个参数传入：

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

// 0.4: await renderSvelteToString(Footer, { year: 2026 });
const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
```

完整应用请参阅 [Svelte 指南](/zh/guide/svelte)。

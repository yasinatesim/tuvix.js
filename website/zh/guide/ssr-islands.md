# SSR Islands

island 是一个微应用：服务端在 React 页面中把它渲染为 HTML，浏览器再用它自己的框架对它进行水合。借助 `@tuvix.js/react` 的 `TuvixIsland`，一个 React 宿主可以承载 Vue、Svelte、Angular 和 React 的 island。用户在任何 JavaScript 运行之前就能看到带样式的内容，每个 island 在其框架加载后变为可交互。

## 你需要什么

| 部分 | 包 | 运行环境 |
| --- | --- | --- |
| 带服务端渲染的 React 宿主页面 | 你的应用（`react-dom/server`、TanStack Start 等） | 服务端 + 客户端 |
| `TuvixIsland`、`TuvixReactApp` | `@tuvix.js/react` | 服务端 + 客户端 |
| island 模块：`createSsrVueMicroApp`、`createSsrSvelteMicroApp`、`createSsrAngularMicroApp`、`createSsrReactMicroApp` | 适配器 | 客户端 |
| `renderVueToString`、`renderSvelteToString`、`renderAngularToString` | `@tuvix.js/<adapter>/server` | 仅服务端 |
| `getAssets`、`renderAssetTags` | `@tuvix.js/vite` | 仅服务端 |

这里不涉及编排器。`TuvixIsland` 自己调用 island 模块的 `mount`、`update` 和 `unmount`。

## 一次请求的流程

```text
server                                         browser
──────                                         ───────
renderVueToString(Card, props) ─┐
                                ▼
<TuvixIsland ssrHtml={html}> renders           HTML arrives, CSS links in <head>
<div data-tuvix-app="card">…html…</div>   ──►  apply → styled first paint
getAssets([...]) → <link rel=stylesheet>
                                               hydrateRoot(host)
                                               TuvixIsland reads its innerHTML from the DOM
                                               React leaves the island's children alone
                                               useEffect → card.mount({ container, props })
                                               Vue adapter: createSSRApp → hydrates in place
                                               tuvix:mounted { hydrated: true }
```

## 1. 配置 Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [react(), vue(), svelte(), tuvix()],
});
```

把 `"@tuvix.js/vite/client"` 加入 `compilerOptions.types`，让 TypeScript 认识 `virtual:tuvix/assets`。

## 2. 创建 island 模块

每个 island 导出一个用对应适配器的 `Ssr` 变体构建的模块。这些文件在浏览器中运行，不能导入服务端渲染器。

```ts
// src/islands/vue-card/index.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import VueCard from './VueCard.vue';

export const vueCard = createSsrVueMicroApp({ name: 'vue-card', App: VueCard });
```

```ts
// src/islands/svelte-counter/index.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Counter from './Counter.svelte';

// SvelteMap 让 TuvixIsland 的 prop 变化原地更新，而不是重新挂载。
export const svelteCounter = createSsrSvelteMicroApp({ name: 'svelte-counter', App: Counter, SvelteMap });
```

```ts
// src/islands/angular-contact/index.ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { ContactComponent } from './contact.component';

export const angularContact = createSsrAngularMicroApp({ name: 'angular-contact', component: ContactComponent });
```

## 3. 在服务端渲染 island HTML

把服务端渲染器放在只有服务端代码会导入的模块中：

```ts
// src/server/render-islands.ts (server only)
import { renderVueToString } from '@tuvix.js/vue/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import { renderAngularToString } from '@tuvix.js/angular/server';
import { render } from 'svelte/server';
import VueCard from '../islands/vue-card/VueCard.vue';
import Counter from '../islands/svelte-counter/Counter.svelte';
import { ContactComponent } from '../islands/angular-contact/contact.component';

export async function renderIslands(): Promise<Record<string, string>> {
  const [card, counter, contact] = await Promise.all([
    renderVueToString(VueCard, { title: 'Hello' }),
    renderSvelteToString(Counter, { start: 3 }, { render }),
    renderAngularToString(ContactComponent, { appId: 'contact', props: { heading: 'Write to us' } }),
  ]);
  return { 'vue-card': card, 'svelte-counter': counter, 'angular-contact': contact };
}
```

`render*ToString` 函数只能在服务端使用。在浏览器中它们返回 `''`。请在永远不会在浏览器中运行的代码里调用它们：你的服务端入口、API 路由，或框架的服务端函数，例如 TanStack Start 的 `createServerFn`。不要在同构的路由 loader 中调用它们。这种 loader 在客户端导航时也会在浏览器中运行，此时拿到的是 `''`；而且因为 loader 导入了 Vue、Svelte 或 Angular 的服务端渲染器，打包工具会把它打包进客户端。

## 4. 把 island 放进页面

```tsx
// src/pages/Home.tsx
import { createContext, useContext } from 'react';
import { TuvixIsland } from '@tuvix.js/react';
import { vueCard } from '../islands/vue-card';
import { svelteCounter } from '../islands/svelte-counter';

// 由服务端入口填充；在客户端为空。
export const IslandHtml = createContext<Record<string, string>>({});

export function Home() {
  const html = useContext(IslandHtml);
  return (
    <main>
      <TuvixIsland
        name="vue-card"
        app={vueCard}
        props={{ title: 'Hello' }}
        ssrHtml={html['vue-card']}
        fallback={<p>The card failed to load.</p>}
      />
      <TuvixIsland name="svelte-counter" app={svelteCounter} props={{ start: 3 }} ssrHtml={html['svelte-counter']} />
    </main>
  );
}
```

在服务端和客户端传入相同的 props。如果服务端用 `{ start: 3 }` 渲染，而客户端用 `{ start: 4 }` 挂载，框架会发现水合不匹配。

## 5. 在 head 中链接 island 的 CSS

Vite 通过 JavaScript 注入 CSS Modules、Vue 的 `<style>` 块和 Svelte 样式。不做处理的话，服务端 HTML 会先于这些 JavaScript 到达浏览器，首次绘制没有样式（FOUC）。`getAssets` 返回某个入口需要的样式表 URL，让服务端可以在 `<head>` 中链接它们：

```tsx
// src/entry-server.tsx
import { renderToString } from 'react-dom/server';
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { Home, IslandHtml } from './pages/Home';
import { renderIslands } from './server/render-islands';

export async function render(): Promise<string> {
  const [islandHtml, assets] = await Promise.all([
    renderIslands(),
    getAssets(['src/entry-client.tsx', 'src/pages/Home.tsx']),
  ]);

  const body = renderToString(
    <IslandHtml.Provider value={islandHtml}>
      <Home />
    </IslandHtml.Provider>,
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <title>Home</title>
    ${renderAssetTags(assets)}
  </head>
  <body>
    <div id="app">${body}</div>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>`;
}
```

- 传入相对于 Vite 根目录的模块路径。在生产构建中，每个路径必须是构建输入，或是客户端构建中某个 `import()` 的目标；其他路径会被 reject。
- 如果 Rollup 把两个 `import()` 目标合并到一个 chunk，manifest 会用该 chunk 的哈希名而不是你的模块路径列出它，`getAssets` 对该路径会 reject。示例项目在 `@angular/core` 落入某个页面 chunk 时会遇到这个问题，它用 `manualChunks` 给 `@angular/core` 单独分配一个 chunk 来解决。
- `getAssets` 会跟踪静态导入，跳过 `import()` 目标。在服务端渲染的懒加载页面或 island 需要在列表中有自己的条目。
- 在开发环境中它返回 `?direct` CSS URL；一旦 Vite 注入了自己的 `<style>`，它会禁用对应的 `<link>`，让 HMR 修改生效。
- Angular island 的样式是内联的：`renderAngularToString` 把组件的 `<style>` 标签放在标记前面。
- Svelte：要么用 `css: 'injected'` 编译（样式内联在 island HTML 中），要么保留 `emitCss` 并用 `getAssets` 链接样式。不要两者同时使用。

## 6. 在客户端水合

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Home } from './pages/Home';

hydrateRoot(document.getElementById('app')!, <Home />);
```

客户端渲染时没有 island HTML。每个 `TuvixIsland` 在水合期间从页面读取自己的标记，React 保留这些节点，island 模块再对它们进行水合。

## 为什么 HTML 不会发送两次

一种简单的 island 实现会在两端都把服务端 HTML 作为 prop 传入。这样 React 在客户端也需要这个字符串来水合 `dangerouslySetInnerHTML`，HTML 就会在文档中传输一次，在水合数据中再传输一次。父组件每次用新的 `{ __html }` 对象重新渲染，也会让 React 再次赋值 `innerHTML`，这会清除 island 框架挂上的 DOM 和监听器。

`TuvixIsland` 避免了这两个问题：

- 在服务端，它把 `ssrHtml` 写入 `<div data-tuvix-app={name} data-tuvix-island={id}>`。
- 水合期间，它通过基于 `useId` 的 `data-tuvix-island` 属性找到该元素，并读取一次 `innerHTML`。客户端从不需要 `ssrHtml`。
- 它把 `{ __html }` 对象保存在 state 中，所以之后的渲染交给 React 的是同一个对象，React 不会重写 island 的子节点。

你的框架如何处理 loader 数据是另一回事。如果你从 TanStack Start 或 Remix 的 loader 返回 island HTML，框架也会把该 loader 结果序列化到页面中。请通过框架不会序列化的途径把 HTML 交给 island，例如由服务端入口填充的 React context，就像第 4 步那样。

## 按请求隔离的状态 {#per-request-state}

服务端代码在一个进程中处理许多请求。你在模块作用域中创建的任何东西都会在所有请求之间存活。

- 按请求创建数据缓存（例如 TanStack Query 的 `QueryClient`），不要在模块作用域中创建。服务端的模块级客户端会在请求和用户之间混用数据，它的过期条目还会导致水合不匹配。
- 把 island 需要的数据作为 props 传入，数据来自该请求自己的缓存。island 模块在挂载时创建自己的客户端状态。
- 用显式的 `timeZone` 和 locale 格式化日期和数字。服务端通常运行在 UTC，而浏览器运行在用户所在时区；不带 `timeZone` 的 `Intl.DateTimeFormat` 在午夜附近会渲染出不同的日期，从而破坏水合。

```tsx
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';

declare function createRequestCache(): { dehydrate(): unknown };
declare function Page(props: { data: unknown }): ReactElement;

export function renderRequest(): string {
  const cache = createRequestCache(); // 每个请求一个
  return renderToString(<Page data={cache.dehydrate()} />);
}
```

## head 和 meta 标签属于宿主

island 渲染到 body 中的一个 `<div>` 里。它们不能输出 `<title>`、`<meta>` 或 `<link rel=canonical>`。请在宿主中设置这些标签（使用框架的 head API，或 HTML 模板）。对于使用 `<svelte:head>` 的 Svelte 组件，请调用 `renderSvelte` 而不是 `renderSvelteToString`，并自己把它的 `head` 输出放进文档的 head。

## 错误

- 如果 island 的 `mount` 或 `update` reject，`TuvixIsland` 会改为渲染 `fallback`。适配器此时已经派发了 `tuvix:error`。
- 如果服务端渲染器抛出异常，由你的服务端代码决定如何处理：捕获它并且不传 `ssrHtml`，island 会以空内容开始，并在客户端渲染。
- `TuvixReactApp` 用 `<Suspense>` 包裹它的组件，所以服务端渲染错误只会把该应用替换为它的 `fallback`，React 会在客户端重试。

在页面代码中用 `onLifecycle('mounted', ...)` 和 `onLifecycle('error', ...)` 监听 island；参见[生命周期事件](/zh/guide/lifecycle-events)。

## 示例项目

仓库中的 `examples/with-ssr-islands` 把这些内容组合在一起：一个 Express + Vite 服务器，包含 React 19 宿主、Vue 3 卡片、Svelte 5 计数器、zoneless 的 Angular 20 联系表单（JIT；编译器作为懒加载 chunk 加载）、一个 `TuvixReactApp` newsletter，以及一个故意失败以展示其回退内容的 island。`src/server/render-islands.ts` 存放服务端渲染器，`src/entry-server.tsx` 用 `getAssets` 链接资源，`src/runtime/islands.ts` 响应生命周期事件。Angular island 在服务端通过 `props` 选项拿到 `heading` 输入，在客户端拿到同一个对象。在仓库根目录运行 `pnpm --filter with-ssr-islands dev`（端口 5186），或先 `build` 再 `start`（端口 5185；可用 `PORT` 覆盖）。示例的 README 解释了每个部分，以及它的 Playwright spec 运行的检查。

## island 不做什么

- `TuvixIsland` 不通过 URL 加载模块。请把 island 模块导入宿主 bundle。
- 它不在 island 之间共享状态。请使用 props、事件总线或你自己的 store。
- Angular island 会在服务端 DOM 上重新渲染，而不是对其进行非破坏性水合；参见 [Angular](/zh/guide/angular)。
- 这里的一切都离不开服务端渲染步骤。对于纯客户端的 island，省略 `ssrHtml` 并使用非 `Ssr` 的适配器。

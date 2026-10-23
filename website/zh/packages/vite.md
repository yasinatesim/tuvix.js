---
title: '@tuvix.js/vite'
---

<PackageHeader
  name="@tuvix.js/vite"
  title="Vite island 资源"
  description="Vite 插件，告诉你的服务端渲染器某个 island 需要哪些样式表和 JS chunk，让服务端渲染的 head 链接它们，island 在首次绘制时就有样式。"
  icon="⚡"
  npm="true"
/>

## 安装

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

插件需要 Vite 6 或 7（peer 依赖范围 `^6.0.0 || ^7.0.0`）。测试套件在 Vite 6 上运行。

## 何时使用

你在服务端渲染一个 island（React、Vue、Svelte、Angular 或原生 DOM），它的标记比它的 JavaScript 先到达浏览器。Vite 通过这段 JavaScript 传送 CSS Modules、Vue SFC 的 `<style>` 块和 Svelte 样式，所以在 bundle 运行之前，浏览器绘制出的 island 没有样式。使用 `@tuvix.js/vite` 后，你的服务端可以询问「`src/islands/footer/index.ts` 需要哪些样式表？」，并把对应的 `<link>` 标签输出到 `<head>` 中。

如果你的 island 只在客户端渲染，或者你链接的单个全局样式表已经覆盖了所有 island，就不需要它。

## 快速开始

把插件加入用于客户端构建和 SSR 构建的 Vite 配置：

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [tuvix()],
});
```

把虚拟模块的类型加入 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "types": ["vite/client", "@tuvix.js/vite/client"]
  }
}
```

在服务端入口中获取资源，并输出到 `<head>`：

```ts
// src/entry-server.ts
/// <reference types="@tuvix.js/vite/client" />
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { renderFooter } from './islands/footer/render';

export async function render(): Promise<string> {
  const assets = await getAssets(['src/islands/footer/index.ts']);
  return `<!doctype html>
<html>
  <head>${renderAssetTags(assets)}</head>
  <body><footer data-tuvix-app="footer">${await renderFooter()}</footer></body>
</html>`;
}
```

先构建客户端，再构建服务端。SSR 构建会读取客户端 manifest：

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?)`

```ts no-check
function tuvix(options?: TuvixViteOptions): Plugin[];
```

返回三个 Vite 插件：

- `tuvix:assets` 提供 `virtual:tuvix/assets`。
- `tuvix:client-build-info`（仅构建）在客户端 manifest 旁写入 `.vite/tuvix-client.json`。参见[生产构建](#production-builds)。
- `tuvix:dev-css-handoff`（仅开发服务器）把样式从服务端渲染的 `<link>` 交接给 Vite 自己的 `<style>` 标签。

按上面的方式把返回的数组放进 `plugins`；Vite 会展开嵌套的插件数组。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | 客户端构建的输出目录，相对于 Vite 根目录或使用绝对路径。SSR 构建读取 `<clientOutDir>/.vite/manifest.json`，找不到时回退到 `<clientOutDir>/manifest.json`。 |
| `base` | `string` | 加载虚拟模块的构建或开发服务器的 Vite `base` | 浏览器加载客户端资源时使用的公共 base。当客户端与服务端 bundle 使用不同的 base 时设置它，例如 vinxi 的 `/_build`。 |

TanStack Start 和 vinxi 把客户端路由器的构建写入 `/_build` 下的单独文件夹：

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries)`

由 `virtual:tuvix/assets` 导出。

```ts no-check
function getAssets(entries: string[]): Promise<TuvixAssets>;
```

以相对于 Vite 根目录的路径传入 island 入口模块，例如 `'src/islands/footer/index.ts'`。函数会忽略开头的 `./` 或 `/`。传入多个入口时，它按入口顺序合并列表并去除重复项。

`getAssets` 返回 promise，因为开发服务器需要先转换每个模块，才能读取它的导入。只在服务端代码中调用它。

### `renderAssetTags(assets)`

由 `virtual:tuvix/assets` 导出。

```ts no-check
function renderAssetTags(assets: TuvixAssets): string;
```

为 `assets.css` 中的每个 URL 返回一个 `<link rel="stylesheet">` 标签，然后为 `assets.modulepreload` 中的每个 URL 返回一个 `<link rel="modulepreload" crossorigin>` 标签。它会对 `href` 值进行 HTML 转义。它在服务端和浏览器中都能使用。

如果你的 `<head>` 是一个 React 组件，自己渲染这些列表：

```tsx
import type { TuvixAssets } from '@tuvix.js/vite';

export function IslandAssets({ assets }: { assets: TuvixAssets }) {
  return (
    <>
      {assets.css.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {assets.modulepreload.map((href) => (
        <link key={href} rel="modulepreload" crossOrigin="" href={href} />
      ))}
    </>
  );
}
```

### 类型

| 类型 | 导出位置 | 含义 |
| --- | --- | --- |
| `TuvixViteOptions` | `@tuvix.js/vite` | `tuvix()` 的选项：`clientOutDir?`、`base?`。 |
| `TuvixAssets` | `@tuvix.js/vite`、`virtual:tuvix/assets` | `{ css: string[]; modulepreload: string[] }`。`css` 按层叠顺序排列。`modulepreload` 在开发环境中为空。 |
| `@tuvix.js/vite/client` | 类型入口 | 声明 `virtual:tuvix/assets` 模块。把它加入 `compilerOptions.types`，或用 `/// <reference types="@tuvix.js/vite/client" />` 引用它。 |

## 生产构建 {#production-builds}

- 在客户端构建中，插件会开启 `build.manifest`，除非你自己设置了 `build.manifest`。
- 客户端构建还会在 manifest 旁写入 `.vite/tuvix-client.json`，结构为 `{ modules, sharedCss }`。`modules` 把每个入口和 `import()` 目标（相对于 Vite 根目录）映射到 Rollup 放置它的 chunk。`sharedCss` 列出 `build.cssCodeSplit: false` 构建中的单个样式表。
- 在 SSR 构建中，它读取客户端 manifest 和 `tuvix-client.json`，并内联一个映射：从每个作为入口（`isEntry`）或动态入口（`isDynamicEntry`）的 manifest 键映射到它的 URL。
- Rollup 有时会把两个动态入口合并到一个 chunk 中，例如一个页面和一个适配器用 `import()` 加载的框架运行时。此时 Vite 的 manifest 用 `_Page-<hash>.js` 作为该 chunk 的键，且不列出任何一个源文件。插件通过 `tuvix-client.json` 中的 `modules` 找到这个 chunk。
- 使用 `build.cssCodeSplit: false` 时，Vite 把所有 CSS 写入一个 `style-<hash>.css`，没有任何 manifest chunk 列出它。`getAssets` 为每个入口返回这个文件，排在入口自身 CSS 之前。
- 没有 `tuvix-client.json` 时（客户端构建未使用 `tuvix()`），只有拥有自己 manifest 键的模块能被解析。没有任何 chunk 列出的 `style.css` manifest 资源仍被视为 `cssCodeSplit: false` 的单个样式表。
- 对每个入口，它收集入口 chunk 及其递归静态导入的所有 chunk，以及它们的 CSS。被导入 chunk 的 CSS 排在入口自身 CSS 之前，这与 Vite 加载它们的顺序一致。
- `modulepreload` 列出入口 chunk 及其静态导入。URL 为 `base + file`。
- 映射会跳过 `import()` 目标，因为 Vite 只在导入执行时才加载这些 chunk 及其 CSS。如果某个懒加载模块在服务端渲染，把它的路径作为单独的入口传给 `getAssets`。
- 之后浏览器加载 island chunk 时，Vite 的预加载辅助函数会找到你的服务端输出的 `<link>`，不会再添加第二个。

## 开发服务器

- `getAssets` 从每个入口出发，沿静态导入按导入顺序遍历开发服务器的客户端模块图。它返回诸如 `/src/islands/footer/footer.module.css?direct` 的 URL；Vite 对 `?direct` 请求返回普通 CSS。Vue 块返回为 `/src/App.vue?direct&vue&type=style&index=0&...&lang.css`。
- island 通过虚拟模块引用的 CSS 也会被收集。`\0virtual:theme.css` 这样的虚拟样式表返回为 `/@id/__x00__virtual:theme.css?direct`，所以提供它的插件必须能加载带查询参数的 id。
- island 的 JavaScript 运行后，Vite 为每个 CSS 模块注入自己的 `<style>`。随后 `tuvix:dev-css-handoff` 插件在 href 相同的服务端渲染 `<link>` 上设置 `link.sheet.disabled = true`，这样过时的规则副本就不会覆盖你的 HMR 修改。`<link>` 元素保留在 DOM 中，所以水合后的 React `<head>` 看不到任何变化。
- 编辑 CSS 时，`tuvix:dev-css-handoff` 把 `?direct` 样式表排除在 HMR 更新之外。Vite 随后更新它的 `<style>`，不重新加载页面，也不替换 `<link>`。有两个限制：
  - 编辑 CSS Modules 会改变哈希后的类名，所以 island 自己的 HMR（React Fast Refresh、Vue）必须重新渲染它。
  - 如果页面还没有加载某个 island 的 JavaScript，该 island 会一直使用服务端样式表，直到你重新加载页面。
- 开发环境中 `modulepreload` 始终为空。
- `getAssets` 与同一 Node 进程中的开发服务器通信。它可以配合 `ssrLoadModule` 和 Vite 默认的 module runner 使用，并且在 `server.restart()` 之后继续工作。

## 边界情况

- 如果某个入口既不是构建输入，也不是客户端构建中的 `import()` 目标，会以 `[tuvix] "<key>" is not an entry or a dynamically imported module in <manifest>` reject。把 island 加入 `build.rollupOptions.input`，或在客户端代码中用 `import()` 加载它。
- 缺少客户端 manifest 时，SSR 构建会以 `[tuvix] No client manifest in <dir>` 失败。先构建客户端，或修正 `clientOutDir`。
- 在开发环境中，如果你的 SSR 代码运行在另一个进程或 worker 运行时中，或者开发服务器已经关闭，`getAssets` 会以 `found no running Vite dev server with the tuvix() plugin in this process` reject。
- 在 `virtual:tuvix/assets` 的浏览器构建中，`getAssets` 会以 `runs during server rendering only` reject。客户端 bundle 无法知道它自己的 manifest。
- 在开发环境中，遍历器不会深入 `/node_modules/` 下的模块。你自己的代码从某个包导入的样式表会被收集；包从它自己的 JavaScript 中导入的样式表不会被收集。
- 相对 `base`（如 `'./'`）会生成相对 URL，在嵌套路由上会失效。使用绝对 base。
- Svelte：保留 `vite-plugin-svelte` 默认的 `emitCss: true`。使用 `compilerOptions.css: 'injected'` 时，样式位于 JavaScript 中，插件找不到可以链接的样式表。

## 它不做什么

- 它不把标签写入你的 HTML。`renderAssetTags` 的输出放在哪里由你决定。
- 它不跟踪 `import()` 链。把在服务端渲染的懒加载模块作为独立入口传入。
- 它不支持自定义 manifest 文件名（`build.manifest: 'name.json'`）。请使用 `true`。
- 它不渲染 island，也不水合 island。请搭配适配器使用，例如 [`@tuvix.js/react`](/zh/packages/react)（`TuvixIsland`）、[`@tuvix.js/vue`](/zh/packages/vue) 或 [`@tuvix.js/svelte`](/zh/packages/svelte)。

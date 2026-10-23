# @tuvix.js/vite

> 把 island 的 CSS 和 modulepreload 链接放进服务端渲染的 `<head>` 中的 Vite 插件

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。完整文档：[tuvix.js.org/zh/packages/vite](https://tuvix.js.org/zh/packages/vite)。

当你在服务端渲染一个微应用 island 时，它的标记会先于它的 JavaScript 到达浏览器。Vite 把 island 的 CSS（CSS Modules、Vue SFC `<style>`、Svelte 样式）打包在这段 JavaScript 中，所以首次绘制会显示没有样式的标记。这个插件告诉你的服务端每个 island 需要哪些样式表，让你可以在 `<head>` 中链接它们。

当你用 Vite 在服务端渲染 island 时使用它。如果你的 island 只在客户端渲染，就不需要它。

## 安装

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

需要 Vite 6 或 7。测试套件在 Vite 6 上运行。

## 快速开始

把插件添加到客户端构建和 SSR 构建所用的 Vite 配置中：

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [tuvix()],
});
```

把虚拟模块的类型添加到 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "types": ["vite/client", "@tuvix.js/vite/client"]
  }
}
```

在服务端入口中请求这些资源，并把它们输出到 `<head>` 中：

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

先构建客户端，再构建服务端：

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?: TuvixViteOptions): Plugin[]`

返回三个插件：`tuvix:assets`（提供 `virtual:tuvix/assets`）、`tuvix:client-build-info`（仅用于构建；在客户端构建中写出 `.vite/tuvix-client.json`）和 `tuvix:dev-css-handoff`（仅用于开发服务器）。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | 客户端构建的输出目录，相对于 Vite 根目录或为绝对路径。SSR 构建会先读取 `<clientOutDir>/.vite/manifest.json`，再读取 `<clientOutDir>/manifest.json`。 |
| `base` | `string` | Vite `base` | 浏览器加载客户端资源时使用的公共基础路径。当客户端与服务端 bundle 使用不同的基础路径时设置它。 |

使用 TanStack Start 或 vinxi 时，把插件指向客户端路由器的输出目录和基础路径：

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries: string[]): Promise<TuvixAssets>`

来自 `virtual:tuvix/assets`。传入 island 入口模块相对于 Vite 根目录的路径，例如 `'src/islands/footer/index.ts'`。开头的 `./` 或 `/` 会被忽略。传入多个入口时，`getAssets` 按入口顺序合并列表并去掉重复项。仅限服务端。

### `renderAssetTags(assets: TuvixAssets): string`

来自 `virtual:tuvix/assets`。先为 `css` 返回 `<link rel="stylesheet">` 标签，再为 `modulepreload` 返回 `<link rel="modulepreload" crossorigin>` 标签。它会转义属性值，在服务端和浏览器中都能使用。

如果你的 `<head>` 是一个 React 组件，请自己渲染这些列表：

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

| 类型 | 含义 |
| --- | --- |
| `TuvixViteOptions` | `tuvix()` 的选项。 |
| `TuvixAssets` | `{ css: string[]; modulepreload: string[] }`。`css` 按层叠顺序排列；开发环境下 `modulepreload` 为空。 |

## 生产构建

- 插件会在客户端构建中开启 `build.manifest`，除非你自己设置了 `build.manifest`。
- 在 SSR 构建中，它读取客户端 manifest，并内联一个从每个入口和动态入口到其 URL 的映射。
- 客户端构建还会在 manifest 旁边写出 `.vite/tuvix-client.json`。它把每个入口和 `import()` 目标映射到 Rollup 放置它的 chunk。Rollup 有时会把两个动态入口合并到一个 chunk 中，例如一个页面和一个由适配器通过 `import()` 加载的框架运行时。这时 Vite 的 manifest 会以 `_Page-<hash>.js` 作为该 chunk 的键，并且不列出任何一个源文件，插件会使用 `tuvix-client.json` 找到它。没有这个文件时（客户端构建没有使用 `tuvix()`），只有拥有自己 manifest 键的模块才能被解析。
- 使用 `build.cssCodeSplit: false` 时，Vite 把所有 CSS 写到一个 `style-<hash>.css` 中，没有任何 manifest chunk 列出它。`getAssets` 会为每个入口返回这个文件。
- 对于每个入口，它收集入口 chunk 及其静态导入的所有 chunk，以及它们的 CSS。被导入 chunk 的 CSS 排在入口自身的 CSS 之前，这也是 Vite 加载它们的顺序。
- 它跳过 `import()` 目标，因为 Vite 只在导入执行时才加载这些 chunk 及其 CSS。如果某个懒加载模块在服务端渲染，也请把它的路径传给 `getAssets`。
- URL 以 `base` 开头。浏览器之后加载 island chunk 时，Vite 的预加载辅助函数会找到已有的 `<link>`，不会再添加第二个。

## 开发服务器

- `getAssets` 从每个入口出发，沿静态导入遍历开发服务器的客户端模块图，并返回诸如 `/src/islands/footer/footer.module.css?direct` 的 URL。Vite 对 `?direct` 请求返回纯 CSS。
- island 通过虚拟模块引入的 CSS 也能正常工作。像 `\0virtual:theme.css` 这样的虚拟样式表会以 `/@id/__x00__virtual:theme.css?direct` 的形式返回，所以提供它的插件必须能加载带查询参数的 id。
- island 的 JavaScript 运行时，Vite 会为每个 CSS 模块注入自己的 `<style>`。随后插件通过 `link.sheet.disabled` 禁用对应的服务端渲染 `<link>`，这样过期的规则副本就不会覆盖你的 HMR 修改。`<link>` 元素仍留在 DOM 中，水合后的 React `<head>` 不会察觉到变化。
- 修改 CSS 时，插件会把 `?direct` 样式表排除在 HMR 更新之外。这样 Vite 会更新它的 `<style>`，不会重新加载页面，也不会替换 `<link>`。修改 CSS Modules 会改变带哈希的类名，所以必须由 island 自身的 HMR（React Fast Refresh、Vue）重新渲染它。页面尚未加载其 JavaScript 的 island 会一直使用服务端样式表，直到你重新加载页面。
- 开发环境下 `modulepreload` 始终为空。

## 边界情况

- 如果路径既不是构建输入，也不是客户端构建的 `import()` 目标，`getAssets` 会 reject。请把 island 添加到 `build.rollupOptions.input`，或者在客户端代码中用 `import()` 加载它。
- 缺少客户端 manifest 时，SSR 构建会以 `[tuvix] No client manifest in <dir>` 失败。
- 在开发环境中，`getAssets` 需要开发服务器运行在同一个 Node 进程中（`ssrLoadModule` 或 Vite 默认的模块运行器）。当 SSR 代码运行在其他进程或 worker 运行时中，或者开发服务器已关闭后，它会 reject。它在 `server.restart()` 之后仍能继续工作。
- `virtual:tuvix/assets` 的浏览器构建导出的 `getAssets` 会 reject，因为客户端 bundle 无法知道它自己的 manifest。
- 在开发环境中，遍历器不会进入 `/node_modules/` 下的模块，所以包从自身 JavaScript 中导入的 CSS 不会被收集。
- 相对的 `base`（例如 `'./'`）会生成相对 URL，这在嵌套路由上会失效。请使用绝对基础路径。
- Svelte：保留 `vite-plugin-svelte` 默认的 `emitCss: true`。使用 `compilerOptions.css: 'injected'` 时，样式位于 JavaScript 中，插件找不到可以链接的样式表。

## 它不做什么

- 它不会把标签写进你的 HTML。由你决定放在哪里。
- 它不追踪 `import()` 链。
- 它不支持自定义 manifest 文件名（`build.manifest: 'name.json'`）。请使用 `true`。
- 它不渲染也不水合 island。请使用适配器，例如 `@tuvix.js/react`（`TuvixIsland`）、`@tuvix.js/vue` 或 `@tuvix.js/svelte`。

## 许可证

MIT

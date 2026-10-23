# 故障排查

每个条目先描述你看到的现象，再说明原因和修复方法。

## Svelte：onMount 从不执行，或 mount() 抛出 lifecycle_function_unavailable

**现象。** Svelte island 能渲染，但 `onMount` 回调从不触发，或者 Svelte 5 的 `mount()` 抛出 `lifecycle_function_unavailable`。

**原因。** `svelte` 在同一个导入路径下同时提供浏览器运行时和服务端运行时。你的客户端 bundle 选中了服务端那个。有些 SSR 环境（Vinxi、自定义 Vite environment、jsdom 中的 Vitest）在解析客户端代码时没有使用 `browser` 导出条件，于是 Vite 的依赖优化器预构建了服务端运行时。在浏览器开发者工具中，你会看到 `svelte/src/index-server.js`（Svelte 5）或 `svelte/src/runtime/ssr.js`（Svelte 4），而不是客户端文件。

**修复。** 把 `browser` 加回客户端的 resolve conditions，然后用 `--force` 重启 Vite，让它重新构建优化过的依赖：

```ts
// vite.config.ts (the client build or client environment)
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  resolve: { conditions: ['browser', ...defaultClientConditions] },
});
```

对于使用 jsdom 的 Vitest，添加该条件并内联 Svelte，让 Vite 来解析它：

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['browser'] },
  test: { environment: 'jsdom', server: { deps: { inline: [/svelte/] } } },
});
```

不要把 `svelte` 从 `optimizeDeps` 中排除；否则 esbuild 会报错 "The entry point "svelte" cannot be marked as external"。

## Vue：~ 别名在 .vue 文件中失效

**现象。** 生产构建失败，报错 `Rollup failed to resolve import "~/utils/x" from ".../Card.vue?vue&type=script..."`，而同样的导入在 `.ts` 文件中可以工作，`.vue` 文件中从 `~/` 进行的 `import type` 也可以工作。

**原因。** `vite-tsconfig-paths` 只对其 tsconfig `include` 的文件应用别名。只包含 `**/*.ts` 和 `**/*.tsx` 的 tsconfig 会漏掉 `.vue` 文件。仅类型的导入在解析之前就被擦除，所以它们从不失败。

**修复。** 在该 tsconfig 中包含 `.vue` 文件：

```json
{
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

或者直接在 Vite 中声明别名：

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
});
```

请使用 Vue - Official（Volar）编辑器扩展。Vetur 不理解 `<script setup>` 宏和 `moduleResolution: "Bundler"`。

## Angular 15-17：点击后视图不更新

**现象。** Angular island 能渲染，但按钮处理函数修改了字段，模板却没有更新。

**原因。** 适配器在没有 zone.js 的情况下运行 Angular。Angular 18+ 在 zoneless 模式下会自行调度变更检测；在 15-17 上，适配器用一个空操作的 zone 替换 `NgZone`，DOM 事件之后没有任何东西运行变更检测。

**修复。** 在修改之后调用 `detectChanges()`：

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-like',
  standalone: true,
  template: `<button (click)="like()">{{ likes }}</button>`,
})
export class LikeComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  likes = 0;

  like(): void {
    this.likes += 1;
    this.cdr.detectChanges();
  }
}
```

或者在客户端入口顶部导入 `zone.js`，并向 `createAngularMicroApp` 传入 `zone: true`。不要在服务端使用 zone.js：它会修改全局 `Promise`，导致服务端的 `fetch` 出错。

## 日期导致的水合不匹配

**现象。** React 报告错误 #418（或 Vue 和 Svelte 输出水合不匹配日志），但只出现在部分用户身上，或只在午夜前后出现。差异显示日期相差一天，例如 `21 Mart 2026` 对比 `22 Mart 2026`。

**原因。** 服务端按自己的时区（通常是 UTC）格式化日期，浏览器按用户的时区格式化。不带 `timeZone` 的 `new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' })` 在两端会得到不同的文本。

**修复。** 在所有由服务端渲染的日期格式化处传入明确的 `timeZone`：

```ts
const format = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Istanbul',
});

console.log(format.format(new Date('2026-03-21T22:30:00Z'))); // 服务端和客户端都是 22 Mart 2026
```

`toLocaleString`、相对时间（"3 hours ago"）以及渲染期间使用 `Date.now()` 的任何代码同样适用。

## 一个请求的数据出现在另一个请求中

**现象。** 服务端渲染的 island 显示过期数据，或另一个用户请求的数据，随后客户端用不同的内容重新渲染。

**原因。** 模块级缓存，例如被多个微应用导入的 `export const queryClient = new QueryClient()`，会在整个服务端进程的生命周期中存在。每个请求都读写同一个实例。

**修复。** 在服务端为每个请求创建缓存，并把 island 需要的数据作为 props 传入。只在浏览器代码中保留一个模块级客户端。

```ts
import { QueryClient } from '@tanstack/query-core';

export function createRequestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
}
```

参见[按请求隔离的状态](/zh/guide/ssr-islands#per-request-state)。

## 模块脚本应用在卸载后无法加载

**现象。** 在 `orchestrator.unregister(name)` 或 `loader.unload(name)` 之后，再次注册并挂载同一个应用会失败，报错 `Module "<name>" loaded but no exports found`。

**原因。** 浏览器对每个 URL 只运行一次模块脚本。针对同一 URL 的第二个 `<script type="module" src="...">` 不做任何事，因此应用不会再次调用 `registerModule`。

**修复。** 使用加载器函数形式的入口，它会把模块保存在打包工具的模块缓存中；或者修改 URL（例如加上版本查询字符串）：

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

## "loaded but no exports found"

**现象。** `[Tuvix Loader] Module "dashboard" loaded but no exports found.`

**原因和修复**，按检查顺序排列：

1. bundle 注册的名称与注册时使用的名称不同。`createReactMicroApp({ name: 'Dashboard' })` 和 `register({ name: 'dashboard' })` 不匹配。请使用同一个字符串。
2. ES 模块 bundle 被当作经典脚本加载。Vite 的 ES 输出以 `.js` 结尾；请在入口中加上 `type: 'module'`。
3. bundle 导出了模块，但从未注册它。请使用适配器或 `defineMicroApp`，或者自己调用 `registerModule(name, module)`。

## 找不到容器

**现象。** `[Tuvix] Container "#app" not found in DOM.`

**原因。** 编排器在挂载应用时查找容器。外部路由器的路由组件可能还没有渲染它。

**修复。** 把容器放在导航之前就已存在的布局中，或者在路由组件内用 `TuvixIsland` 承载该应用。参见[外部路由器](/zh/guide/external-router#containers-rendered-by-routes)。

## 首次绘制没有样式

**现象。** 禁用 JavaScript 时，或在慢速连接下的短暂时间内，服务端渲染的 island 显示时没有 CSS。

**原因。** Vite 通过 JavaScript 注入 CSS Modules、Vue `<style>` 和 Svelte 样式。服务端 HTML 没有链接其中任何一个。

**修复。** 在 Vite 配置中添加 `@tuvix.js/vite` 的 `tuvix()`，并把 `renderAssetTags(await getAssets([...]))` 输出到 `<head>` 中。参见 [SSR Islands](/zh/guide/ssr-islands)。

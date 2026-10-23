# 架构

Tuvix.js 拆分为多个小包。`@tuvix.js/core` 中的编排器把它们组合在一起；其他每个包也都可以单独使用。

## 包及其职责

```text
@tuvix.js/core          createOrchestrator, defineMicroApp: registry, reconcile, props
@tuvix.js/router        createRouter, matchPath, interceptLinks
@tuvix.js/loader        ModuleLoader, registerModule, lifecycle runtime
@tuvix.js/event-bus     createEventBus, getGlobalBus
@tuvix.js/sandbox       CssSandbox (shadow DOM), JsSandbox (proxy window)
@tuvix.js/react         createReactMicroApp, TuvixReactApp, TuvixIsland
@tuvix.js/vue           createVueMicroApp, renderVueToString (/server)
@tuvix.js/svelte        createSvelteMicroApp, renderSvelteToString (/server)
@tuvix.js/angular       createAngularMicroApp, renderAngularToString (/server)
@tuvix.js/vite          Vite plugin: island CSS links for the server-rendered <head>
@tuvix.js/server        Server-side composition of HTML fragments
@tuvix.js/module-federation  Entries backed by webpack remotes
@tuvix.js/devtools      In-page debug panel
tuvix.js                Umbrella: core, router, loader, event bus, sandbox
create-tuvix-app        Project scaffolding
```

## 从导航到挂载

```text
URL changes (router.push, popstate, connectRouter callback, or reconcile(path))
  │
  ▼
orchestrator queues a reconcile for the path
  │  (only the newest queued path runs next)
  ▼
for each app: should it be mounted?  activeWhen string → matchPath
  │                                   activeWhen function → your code
  │                                   no activeWhen → router routes naming it
  ▼
phase 1: unmount every app that turned inactive
phase 2: mount every app that turned active
  │
  ▼
loader.load(name, entry)   function entry → await it
  │                        URL entry → <script>/<link> tags, then registry lookup
  ▼
module.bootstrap()  (first load only)
module.mount({ container, props, name, bus })
```

阶段 1 在阶段 2 开始前完成，因此共享 `#app` 的两个应用永远不会同时处于其中。如果在 reconcile 运行期间到达一个新路径，编排器会先完成当前步骤，然后对最新的路径执行 reconcile。快速连续地从 A 导航到 B 再回到 A，最终只有 A 处于挂载状态。

## 模块契约

每个微应用，无论是手写的还是由适配器生成的，都具有如下结构（来自 `@tuvix.js/loader` 的 `MicroAppModule`）：

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  async bootstrap() {
    // 只执行一次，在首次挂载之前
  },
  async mount({ container, props, name, bus }) {
    container.textContent = `${name ?? ''}: ${JSON.stringify(props ?? {})}`;
    bus?.emit('app:ready', { name });
  },
  async update({ props, container }) {
    if (container) container.textContent = JSON.stringify(props);
  },
  async unmount({ container }) {
    container.replaceChildren();
  },
};
```

- `bootstrap` 对每个已加载的模块只运行一次。
- `mount` 接收容器、当前 props、应用名称和编排器的事件总线。
- 当 shell 调用 `updateAppProps` 时，`update` 接收合并后的 props。对于挂载在多个位置的模块，`container` 告诉它要更新哪一次挂载。
- `unmount` 必须移除 `mount` 创建的所有内容。

## 加载器如何找到模块

1. **加载函数入口**（`() => import('./app')`）：加载器使用 resolve 得到的模块；如果不行，使用它的 `default` 导出；再不行，使用以应用名称注册的模块。
2. **URL 入口**：加载器追加 `<script>` 和 `<link>` 标签，等待它们加载完成，然后从由 `registerModule(name, module)` 填充的注册表中读取模块。适配器和 `defineMicroApp` 会替你调用 `registerModule`。
3. **UMD 回退**：如果没有注册任何模块，加载器会选取一个新出现的、带有 `mount` 函数的 `window` 全局变量。如果出现了多个，它会选择名称与应用名称匹配的那个，否则失败。

注册表和生命周期状态保存在 `window.__TUVIX_RUNTIME__` 上，因此分别打包、各自带有一份 `@tuvix.js/loader` 副本的微应用仍然看到同一个注册表。

当入口设置了 `type: 'module'`，或 URL 以 `.mjs`、`.mts`、`.ts`、`.tsx` 或 `.jsx` 结尾时，脚本以 `type="module"` 加载。其他 URL 作为经典脚本加载。

## 共享运行时状态

| 状态 | 存放位置 | 原因 |
| --- | --- | --- |
| 模块注册表 | `window.__TUVIX_RUNTIME__`（也包括 `window.__TUVIX_MODULES__`）| 加载器可以找到来自任何 bundle 的应用 |
| 已挂载的应用和等待者 | `window.__TUVIX_RUNTIME__` | `whenMounted` 可以跨 bundle 工作 |
| 全局事件总线 | `window.__TUVIX_GLOBAL_BUS__` | `getGlobalBus()` 每个页面返回同一个总线 |

在服务端没有 `window`，这些状态都是模块作用域的。

## 隔离模型

- **CSS**：在 `register` 中设置 `sandbox: true` 会在 shadow root 中渲染应用，并把它入口中的 `styles` 加载到那里。参见 [沙箱隔离](/zh/guide/sandbox)。
- **JavaScript**：默认没有隔离。所有应用共享 `window`、`document` 和全局变量。`JsSandbox` 只隔离你通过其代理运行的代码。

## 接下来看哪里

- [生命周期钩子](/zh/guide/lifecycle)：契约的详细说明。
- [生命周期事件](/zh/guide/lifecycle-events)：了解应用何时出现在页面上。
- [路由](/zh/guide/routing)：模式规则。

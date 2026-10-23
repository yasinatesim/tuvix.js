# 什么是 Tuvix.js？

Tuvix.js 是一个面向浏览器的微前端工具包。宿主页面（shell）注册微应用，Tuvix.js 负责加载每个应用的代码，把它挂载到容器中，向它传递 props，并在 URL 或你的代码要求时将它卸载。每个微应用可以使用 React、Vue、Svelte、Angular，也可以不用框架，每个团队都可以按自己的节奏构建和部署自己的应用。

## 它做什么

- **编排微应用。** `createOrchestrator()` 维护一份应用注册表。它根据当前路径决定每个应用是否应该挂载，并且一次只运行一个 reconcile，因此共享同一个容器的两个应用永远不会重叠。
- **按需加载代码。** 应用的 `entry` 可以是一个脚本 URL、一组脚本和样式表，或者一个函数，例如 `() => import('./dashboard')`。加载器会重试失败的加载，并中止过慢的加载。
- **按 URL 路由。** `activeWhen: '/dashboard/*'` 会在 `/dashboard` 及其下的每个路径上挂载应用。你可以使用内置路由器，也可以通过 `connectRouter()` 跟随 TanStack Router 或 React Router。
- **适配框架。** `createReactMicroApp`、`createVueMicroApp`、`createSvelteMicroApp` 和 `createAngularMicroApp` 把一个根组件转换成带有 `mount`、`update` 和 `unmount` 的模块。
- **在 React 页面中承载 island。** `TuvixIsland` 在服务端渲染的 React 树中挂载 Vue、Svelte、Angular 或 React 微应用，并对服务端 HTML 进行水合，不会重复发送这段 HTML。参见 [SSR Islands](/zh/guide/ssr-islands)。
- **报告生命周期。** 适配器和 `defineMicroApp` 会派发 `tuvix:mounted`、`tuvix:unmounted` 和 `tuvix:error` DOM 事件，应用出现在页面上后，`whenMounted(name)` 会 resolve。参见 [生命周期事件](/zh/guide/lifecycle-events)。
- **连接应用。** 页面上的所有应用通过 `getGlobalBus()` 共享同一个事件总线，即使每个应用都打包了自己的 `@tuvix.js/event-bus` 副本。
- **按需隔离 CSS。** `sandbox: true` 会在 shadow root 中渲染应用，让页面 CSS 和应用 CSS 互不影响。

## 何时使用

当多个团队交付同一个页面的不同部分并需要分别部署，或者你想让一个旧应用和用另一个框架重写的新应用并行运行时，选择 Tuvix.js。它也适合单个团队在带服务端渲染的 React 站点中使用 Vue 或 Svelte 组件。

## 何时不使用

- 一个团队、一个框架、一次部署：普通的单页应用更简单。
- 你需要应用之间的强安全隔离。Tuvix.js 在同一个 JavaScript realm 中运行所有应用。`@tuvix.js/sandbox` 中的 `JsSandbox` 会隐藏通过其代理进行的全局写入，但它不能阻止应用访问 `window`。对不可信代码请使用 `<iframe>`。
- 你想要一个所有应用共享状态的单一 bundle。微应用按设计通过事件和 props 通信。

## 包

| 包 | 用途 |
| --- | --- |
| `tuvix.js` | 一次安装即包含 core、router、event bus、loader 和 sandbox |
| `@tuvix.js/core` | `createOrchestrator`、`defineMicroApp` |
| `@tuvix.js/router` | `createRouter`、`matchPath`、`interceptLinks` |
| `@tuvix.js/loader` | 入口加载和生命周期运行时（`whenMounted`、`onLifecycle`）|
| `@tuvix.js/event-bus` | `createEventBus`、`getGlobalBus` |
| `@tuvix.js/sandbox` | `CssSandbox`、`JsSandbox` |
| `@tuvix.js/react`、`vue`、`svelte`、`angular` | 框架适配器、`TuvixIsland`（React）|
| `@tuvix.js/vite` | 为服务端渲染的 `<head>` 生成 island 样式表链接 |
| `@tuvix.js/server` | 在服务端组合 HTML 片段 |
| `@tuvix.js/module-federation` | 从 webpack Module Federation remote 加载的入口 |
| `@tuvix.js/devtools` | 页面内调试面板 |
| `create-tuvix-app` | 项目脚手架 |

## 核心概念

| 术语 | 含义 |
| --- | --- |
| Shell | 创建编排器并掌管布局的宿主页面 |
| 微应用 | 带有 `mount` 和 `unmount`（以及可选的 `bootstrap`、`update`）的模块 |
| 入口（entry）| 加载器获取微应用的位置：URL、`{ scripts, styles }` 或加载函数 |
| 容器 | 微应用渲染进去的元素 |
| Island | 由宿主在服务端渲染、在客户端原地水合的微应用 |
| 事件总线 | 页面上所有应用共享的发布/订阅通道 |

## 下一步

- [快速上手](/zh/guide/getting-started) 构建一个 shell 和两个微应用。
- [架构](/zh/guide/architecture) 展示一次导航如何变成一次挂载。
- 从 0.4 升级？阅读 [迁移到 0.5](/zh/guide/migration-0-5)。

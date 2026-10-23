<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Tuvix.js 示例

可运行的项目，每个功能或框架一个。每个示例的 `e2e/` 文件夹中都有一个在 CI 中运行的 Playwright 测试。

## 快速开始

用 `create-tuvix-app` CLI 启动任意示例：

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

在本仓库的克隆中，先在根目录运行 `pnpm install`，再在示例文件夹中运行 `pnpm dev`（服务端示例运行 `pnpm start`）。

## 可用示例

| 示例 | 框架 | 展示内容 |
|---------|-----------|---------------|
| [`with-vanilla`](./with-vanilla/) | 纯 JS | 不使用框架的 `defineMicroApp`、路由和 `interceptLinks` |
| [`with-react`](./with-react/) | React 18 | 通过 `@tuvix.js/react` 实现 shell、路由和 props |
| [`with-react-event-bus`](./with-react-event-bus/) | React 18 | 应用在 `getGlobalBus()` 上发布和接收事件 |
| [`with-react-router`](./with-react-router/) | React 18 | 路由到应用的映射和客户端链接导航 |
| [`with-react-sandbox`](./with-react-sandbox/) | React 18 | `sandbox: true` 的 shadow root CSS 隔离，并附一个未启用沙箱的对照组 |
| [`with-react-devtools`](./with-react-devtools/) | React 18 | 来自 `@tuvix.js/devtools` 的页内调试面板 |
| [`with-module-federation-react`](./with-module-federation-react/) | React（webpack 5） | 通过 `createFederatedEntry` 加载的远程应用 |
| [`with-ssr-vanilla`](./with-ssr-vanilla/) | Express | 用 `composeHTML` 在服务端组合片段 |
| [`with-ssr-react`](./with-ssr-react/) | React（Express） | 用 `composeHTML` 组合 React `renderToString` 片段 |
| [`with-ssr-islands`](./with-ssr-islands/) | React 19 shell、Vue 3、Svelte 5、Angular 20（Express + Vite） | 在客户端水合的服务端渲染 island、一个内联的 `TuvixReactApp`，以及一个失败时回退而不破坏页面的 island |
| [`with-vue`](./with-vue/) | Vue 3 | `createVueMicroApp`，通过 `defineProps` 接收 props |
| [`with-svelte`](./with-svelte/) | Svelte 4 | `createSvelteMicroApp`，通过 `export let` 接收 props |
| [`with-angular`](./with-angular/) | Angular 16 | 独立组件、zoneless、`createAngularMicroApp` |
| [`with-multiple-frameworks`](./with-multiple-frameworks/) | React 和 Vue 3 | 同一页面上的两个框架共享事件总线 |

## 翻译

带有 `README.md` 的示例同时提供土耳其语、西班牙语、德语、法语、日语、中文、意大利语、葡萄牙语和印地语版本。各版本不一致时，以英文 README 为准。

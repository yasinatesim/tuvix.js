<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  一个微前端工具包：加载、挂载并连接用 React、Vue、Svelte、Angular 或纯 TypeScript 编写、独立部署的应用，既可在浏览器中运行，也可作为 React 页面中在服务端渲染的 island。
</p>

<p align="center">
  <a href="./README.md">🇬🇧 English</a> ·
  <a href="./README.tr.md">🇹🇷 Türkçe</a> ·
  <a href="./README.es.md">🇪🇸 Español</a> ·
  <a href="./README.de.md">🇩🇪 Deutsch</a> ·
  <a href="./README.fr.md">🇫🇷 Français</a> ·
  <a href="./README.ja.md">🇯🇵 日本語</a> ·
  <a href="./README.zh.md">🇨🇳 中文</a> ·
  <a href="./README.it.md">🇮🇹 Italiano</a> ·
  <a href="./README.pt.md">🇧🇷 Português</a> ·
  <a href="./README.hi.md">🇮🇳 हिंदी</a>
</p>

---

## ✨ 特性

- 🧩 **框架适配器**，支持 React 18/19、Vue 3、Svelte 3-5 和 Angular 15+。每个适配器把根组件变成带有 `mount`、`update` 和 `unmount` 的微应用模块，每个容器一个实例。
- 🛣️ **基于路径的激活。** `activeWhen: '/users/:id'` 在匹配的路径上挂载应用。查询字符串和 hash 永远不会让它卸载。编排器、路由器和 server 包共用同一个匹配器（`matchPath`）。
- 🔁 **有序挂载。** 路由变化逐个协调；非激活的应用先卸载，新应用再挂载，因此快速的 A → B → A 导航后页面上只剩 A。
- 🔗 **外部路由器。** `orchestrator.connectRouter()` 跟随 TanStack Router 或 React Router。`interceptLinks()` 把普通的 `<a href>` 点击变成客户端导航。
- 🏝️ **SSR islands。** `TuvixIsland` 在服务端渲染的 React 页面中承载 Vue、Svelte、Angular 和 React 微应用，原地水合它们，并且重新渲染时从不改写它们的 DOM。
- 🎨 **带样式的首次绘制。** `@tuvix.js/vite` 告诉你的服务器每个 island 需要哪些样式表，让你在 `<head>` 中链接它们。
- 📦 **灵活的入口（entry）。** 脚本 URL、`{ scripts, styles, type }`，或 `() => import('./app')` 这样的加载函数。支持并行加载、重试、超时和 SRI 哈希。
- 📡 **共享事件总线。** `getGlobalBus()` 为每个页面返回一个总线，即使应用分别打包也是同一个。
- 🔔 **生命周期事件。** `tuvix:mounted`、`tuvix:unmounted`、`tuvix:error`，以及 `whenMounted(name)` 和 `onLifecycle()`。
- 🔒 **按需 CSS 隔离。** `sandbox: true` 把应用渲染在一个带有独立样式表的 shadow root 中。
- 🟦 **TypeScript。** 每个库包都提供 ESM 和 CommonJS 构建以及类型声明。

Tuvix.js 不在应用之间隔离 JavaScript：每个应用都运行在页面的 `window` 中。不受信任的代码请使用 `<iframe>`。

---

## 🤖 AI 组件生成器

在文档站点上用聊天机器人从自然语言生成 tuvix.js 组件。

- **对话模型：** MiniMax M2.5，通过 OpenRouter
- **嵌入模型：** NVIDIA Nemotron Embed 1B，通过 OpenRouter（RAG 检索）
- **支持：** React、Vue、Svelte、Angular
- **数据集：** HuggingFace 上的 [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset)

> 试一试：文档站点上的 [AI 生成器](https://tuvix.js.org/zh/chatbot)

---

## 📦 安装

```bash
# 编排器、路由器、加载器、事件总线和沙箱
pnpm add tuvix.js

# 适配器，按需安装
pnpm add @tuvix.js/react @tuvix.js/vue @tuvix.js/svelte @tuvix.js/angular

# 或者用脚手架创建项目
npx create-tuvix-app my-app --template shell
```

---

## 🚀 快速开始

### Shell

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [] },
});

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main-content',
  activeWhen: '/dashboard/*',
  props: { user: 'Guest' },
  fallback: '<p>Dashboard is unavailable.</p>',
});

orchestrator.register({
  name: 'settings',
  entry: () => import('./apps/settings'),
  container: '#main-content',
  activeWhen: '/settings/*',
});

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.start();
```

### 微应用

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Welcome, {user}</h1>;
}

// 以 "dashboard" 注册自身，shell 的脚本入口因此能找到它。
export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

不使用框架：

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'settings',
  mount({ container, props }) {
    const title = document.createElement('h1');
    title.textContent = `Settings for ${String(props?.user ?? 'Guest')}`;
    container.replaceChildren(title);
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

### 更新 props

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

已挂载且带有 `update` 的应用会原地重新渲染。否则编排器会保存合并后的 props，供下次挂载使用。

---

## 🌉 跟随外部路由器

```ts
import { createOrchestrator } from 'tuvix.js';
import { router } from './router'; // TanStack Router 实例

const orchestrator = createOrchestrator(); // 没有内置路由器

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});

await orchestrator.start();
```

---

## 🏝️ 服务端渲染的 Islands

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });

// `footerHtml` 来自仅在服务端运行的代码中的 renderSvelteToString()。
export function Layout({ footerHtml }: { footerHtml?: string }) {
  return <TuvixIsland name="footer" app={footer} props={{ year: 2026 }} ssrHtml={footerHtml} fallback={<footer>© 2026</footer>} />;
}
```

水合期间，island 从页面读取自己的 HTML，因此客户端永远不需要 `footerHtml`。参阅 [SSR Islands 指南](https://tuvix.js.org/zh/guide/ssr-islands) 和 [`examples/with-ssr-islands`](./examples/with-ssr-islands)。

---

## 🔔 生命周期事件

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer');
container.classList.add(hydrated ? 'hydrated' : 'rendered');
```

---

## 🔌 事件总线

```ts
import { getGlobalBus } from 'tuvix.js';

const bus = getGlobalBus(); // 编排器传给 mount() 的就是这个总线

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => console.log(userId));
bus.emit('user:login', { userId: '42' });
off();
```

---

## 📦 包

| 包 | 说明 |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | 聚合包：core、router、loader、event bus、sandbox |
| [`@tuvix.js/core`](./packages/core) | 编排器：注册、协调、props、`connectRouter` |
| [`@tuvix.js/router`](./packages/router) | History/hash 路由器、`matchPath`、`interceptLinks` |
| [`@tuvix.js/loader`](./packages/loader) | 入口加载和生命周期运行时 |
| [`@tuvix.js/event-bus`](./packages/event-bus) | 发布/订阅总线，页面级的 `getGlobalBus()` |
| [`@tuvix.js/sandbox`](./packages/sandbox) | `CssSandbox`（Shadow DOM）、`JsSandbox`（代理 window） |
| [`@tuvix.js/react`](./packages/react) | React 适配器、`TuvixReactApp`、`TuvixIsland`、hooks |
| [`@tuvix.js/vue`](./packages/vue) | Vue 3 适配器、`renderVueToString` |
| [`@tuvix.js/svelte`](./packages/svelte) | Svelte 3-5 适配器、`renderSvelteToString` |
| [`@tuvix.js/angular`](./packages/angular) | Angular 15+ 适配器（zoneless）、`renderAngularToString` |
| [`@tuvix.js/vite`](./packages/vite) | Vite 插件：为服务端渲染的 `<head>` 生成 island 样式表链接 |
| [`@tuvix.js/server`](./packages/server) | 在服务端组合 HTML 片段、流式输出、指标 |
| [`@tuvix.js/module-federation`](./packages/module-federation) | 由 webpack Module Federation 远程模块提供的入口 |
| [`@tuvix.js/devtools`](./packages/devtools) | 页内调试面板 |
| [`create-tuvix-app`](./packages/cli) | 项目脚手架 |

---

## 📁 项目结构

```text
tuvix.js/
├── packages/        # the 15 packages above
├── examples/        # runnable examples, see below
├── website/         # documentation site (VitePress, 10 languages)
├── scripts/         # docs and package validators
└── .changeset/      # release notes for the next version
```

---

## 🧪 示例

| 示例 | 展示内容 |
| --- | --- |
| [`with-ssr-islands`](./examples/with-ssr-islands) | React 宿主，包含服务端渲染的 Vue、Svelte、Angular 和 React island |
| [`with-react`](./examples/with-react) | React shell 和微应用 |
| [`with-vue`](./examples/with-vue) | Vue 3 微应用 |
| [`with-svelte`](./examples/with-svelte) | Svelte 微应用 |
| [`with-angular`](./examples/with-angular) | Angular 微应用 |
| [`with-vanilla`](./examples/with-vanilla) | 不使用框架 |
| [`with-multiple-frameworks`](./examples/with-multiple-frameworks) | 一个 shell 中的 React 和 Vue |
| [`with-react-router`](./examples/with-react-router) | 路由 |
| [`with-react-event-bus`](./examples/with-react-event-bus) | 事件总线 |
| [`with-react-sandbox`](./examples/with-react-sandbox) | CSS 沙箱 |
| [`with-react-devtools`](./examples/with-react-devtools) | Devtools 面板 |
| [`with-module-federation-react`](./examples/with-module-federation-react) | Module Federation |
| [`with-ssr-react`](./examples/with-ssr-react) | 使用 `@tuvix.js/server` 在服务端组合 |
| [`with-ssr-vanilla`](./examples/with-ssr-vanilla) | 不使用框架在服务端组合 |

---

## 🗺️ 路线图

已发布：

- 编排器：串行协调、`connectRouter`、视口挂载和回退 HTML
- React、Vue、Svelte 3-5 和 Angular（zoneless）适配器，支持 SSR 水合
- `TuvixIsland`、生命周期事件、`@tuvix.js/vite` island 资源
- 带流式输出和 Prometheus 指标的服务端组合（`@tuvix.js/server`）
- Module Federation 入口、页内 devtools、CLI 脚手架
- 10 种语言的文档

计划中：

- 跨微应用的热模块重载
- 原生 ESM / import map 支持
- 感知边缘环境的服务端组合，带 stale-while-revalidate 片段缓存
- 测试工具和模拟编排器
- 片段 A/B 测试

---

## 🤝 贡献

提交 pull request 之前，请阅读 [贡献指南](./CONTRIBUTING.md)。

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js
pnpm install
pnpm build
pnpm test
```

从 0.4 升级？请阅读 [迁移指南](https://tuvix.js.org/zh/guide/migration-0-5)。

---

## 🔑 许可证

Copyright © 2026 - MIT License.
更多信息请参阅 [LICENSE](./LICENSE)。

---

<p align="center">本 README 由 <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> 生成 🥲</p>

<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  一个轻量且灵活的<strong>微前端框架</strong>，用于构建可扩展、可独立部署的前端应用。<br/>
  Tuvix.js 将多个前端应用融合为无缝统一的用户体验 - 正如其名所示。
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

- 🧩 **框架无关** - 支持 React、Vue、Svelte、Angular 或原生 JS
- 📦 **独立Deployment** - 每个微应用可单独部署
- 🔗 **动态模块加载** - 按需加载微前端
- 🛣️ **内置路由** - 微应用间的无缝路由
- 📡 **应用间通信** - 用于跨应用消息传递的事件总线
- ⚡ **Lightweight** - 零运行时依赖，核心极简
- 🔄 **Lifecycle管理** - 挂载、卸载、更新钩子
- 🔒 **Type-Safe** - 完整的 TypeScript 支持与严格类型

---

## 🤖 AI 组件生成器

使用我们内置的 AI 聊天机器人，通过自然语言生成 tuvix.js 组件。

- **驱动：** Ollama + DeepSeek Coder（100% 本地运行，无 API 费用）
- **基于 RAG：** 从 600 个开源组件示例中检索相关示例
- **支持：** React、Vue、Svelte、Angular
- **数据集：** HuggingFace 上的 [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset)

---

## 📦 安装

```bash
# 全家桶包
npm install tuvix.js

# 或单独安装各个包
npm install @tuvix.js/core @tuvix.js/router
```

---

## 🚀 快速开始

### 宿主（Shell）应用

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main-content',
  activeWhen: '/dashboard/*',
});

orchestrator.register({
  name: 'settings',
  entry: 'https://cdn.example.com/settings/main.js',
  container: '#main-content',
  activeWhen: '/settings/*',
});

orchestrator.start();
```

### 微前端应用

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    console.log('Dashboard 已初始化');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>欢迎，${props?.user}！</h1>`;
  },

  unmount({ container }) {
    container.innerHTML = '';
  },

  update({ props }) {
    console.log('Props 已更新:', props);
  },
});
```

---

## 🔌 应用间通信

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// 应用 A - 发送事件
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// 应用 B - 监听事件
bus.on('user:login', (data) => {
  console.log(`${data.name} 已登录！`);
});
```

---

## 🛣️ 路由

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/settings/*', app: 'settings' },
    { path: '/profile/*', app: 'profile' },
  ],
});
```

---

## 🏗️ 架构

```
┌─────────────────────────────────────────────┐
│              Tuvix.js Shell                  │
│  ┌─────────────────────────────────────────┐│
│  │            Orchestrator                 ││
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ ││
│  │  │ Router   │ │Event Bus │ │ Loader  │ ││
│  │  └──────────┘ └──────────┘ └─────────┘ ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌───────┐  ┌───────┐  ┌───────┐          │
│  │ App A │  │ App B │  │ App C │  ...      │
│  │(React)│  │ (Vue) │  │(Svelte│          │
│  └───────┘  └───────┘  └───────┘          │
└─────────────────────────────────────────────┘
```

---

## 📦 包列表

| 包名 | 描述 |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | 全家桶包 |
| [`@tuvix.js/core`](./packages/core) | Core Orchestrator with Lifecycle management |
| [`@tuvix.js/router`](./packages/router) | 基于 URL 的微应用路由 |
| [`@tuvix.js/event-bus`](./packages/event-bus) | 应用间通信事件总线 |
| [`@tuvix.js/loader`](./packages/loader) | 动态模块加载器 |
| [`@tuvix.js/sandbox`](./packages/sandbox) | CSS/JS 隔离（Shadow DOM + Proxy） |
| [`@tuvix.js/react`](./packages/react) | React 18+ 绑定与 Hooks |
| [`@tuvix.js/vue`](./packages/vue) | Vue 3 绑定与组合式 API |
| [`@tuvix.js/svelte`](./packages/svelte) | Svelte 3-5 绑定 |
| [`@tuvix.js/angular`](./packages/angular) | Angular 15+ 绑定 |
| [`create-tuvix-app`](./packages/cli) | CLI 脚手架工具 |
| [`@tuvix.js/devtools`](./packages/devtools) | 页面内调试面板 |
| [`@tuvix.js/server`](./packages/server) | 服务端组合 |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Webpack Module Federation 集成 |

---

## 📁 项目结构

```
tuvix.js/
├── packages/
│   ├── core/               # @tuvix.js/core
│   ├── router/             # @tuvix.js/router
│   ├── event-bus/          # @tuvix.js/event-bus
│   ├── loader/             # @tuvix.js/loader
│   ├── sandbox/            # @tuvix.js/sandbox
│   ├── react/              # @tuvix.js/react
│   ├── vue/                # @tuvix.js/vue
│   ├── svelte/             # @tuvix.js/svelte
│   ├── angular/            # @tuvix.js/angular
│   ├── cli/                # create-tuvix-app
│   ├── devtools/           # @tuvix.js/devtools
│   ├── server/             # @tuvix.js/server
│   ├── module-federation/  # @tuvix.js/module-federation
│   └── tuvix/              # tuvix.js（总包）
├── examples/
│   ├── with-angular/              # Angular 15+ 示例
│   ├── with-module-federation-react/ # Module Federation + React 示例
│   ├── with-multiple-frameworks/  # 多框架示例
│   ├── with-react/                # React 18+ 示例
│   ├── with-react-devtools/       # React + DevTools 示例
│   ├── with-react-event-bus/      # React + Event Bus 示例
│   ├── with-react-router/         # React + Router 示例
│   ├── with-react-sandbox/        # React + Sandbox 示例
│   ├── with-ssr-react/            # SSR + React 示例
│   ├── with-ssr-vanilla/          # SSR + 原生 JS 示例
│   ├── with-svelte/               # Svelte 5 示例
│   ├── with-vanilla/              # 原生 JS 示例
│   └── with-vue/                  # Vue 3 示例
├── website/                # 文档站点（VitePress，支持 10 种语言）
├── .github/                # CI/CD 工作流
├── package.json            # 根工作区配置
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── vitest.config.ts
```

---

## 🗺️ 路线图

### ✅ 已完成

- [x] Core Orchestrator
- [x] Lifecycle管理
- [x] 动态模块加载
- [x] 事件总线
- [x] 支持 history/hash 模式的 URL 路由
- [x] CSS/JS 沙箱隔离
- [x] CLI 脚手架工具（`npx create-tuvix-app`）
- [x] DevTools 浏览器扩展
- [x] 服务端组合
- [x] Module Federation 支持
- [x] 框架绑定（React、Vue、Svelte、Angular）
- [x] i18n 文档（10 种语言）

### 🔜 即将推出

- [ ] 微应用间热模块重载
- [ ] 共享状态管理适配器
- [ ] 预加载与预取策略
- [ ] 插件系统与中间件 API
- [ ] DevTools 中的可视化依赖图
- [ ] Testing utilities & mock Orchestrator
- [ ] 原生 ESM / importmap 支持
- [ ] Edge/CDN 感知的服务端组合
- [ ] 用于 DevTools 集成的 VS Code 扩展
- [ ] 用于微应用隔离的 Storybook 集成

---

## 🧪 示例

每个支持的框架都有即用型示例，位于 [`examples/`](./examples) 目录中：

| 示例 | 框架 | 路径 |
| --- | --- | --- |
| [Angular 示例](./examples/with-angular) | Angular 15+ | `examples/with-angular/` |
| [Module Federation + React 示例](./examples/with-module-federation-react) | React 18+ | `examples/with-module-federation-react/` |
| [多框架示例](./examples/with-multiple-frameworks) | 混合 | `examples/with-multiple-frameworks/` |
| [React 示例](./examples/with-react) | React 18+ | `examples/with-react/` |
| [React + DevTools 示例](./examples/with-react-devtools) | React 18+ | `examples/with-react-devtools/` |
| [React + Event Bus 示例](./examples/with-react-event-bus) | React 18+ | `examples/with-react-event-bus/` |
| [React + Router 示例](./examples/with-react-router) | React 18+ | `examples/with-react-router/` |
| [React + Sandbox 示例](./examples/with-react-sandbox) | React 18+ | `examples/with-react-sandbox/` |
| [SSR + React 示例](./examples/with-ssr-react) | React 18+ | `examples/with-ssr-react/` |
| [SSR + 原生 JS 示例](./examples/with-ssr-vanilla) | 无框架 | `examples/with-ssr-vanilla/` |
| [Svelte 示例](./examples/with-svelte) | Svelte 5 | `examples/with-svelte/` |
| [原生 JS 示例](./examples/with-vanilla) | 无框架 | `examples/with-vanilla/` |
| [Vue 示例](./examples/with-vue) | Vue 3 | `examples/with-vue/` |

每个示例演示了：

- 启动Orchestrator的**Shell (Host)**应用
- 动态注册和加载的两个**微前端应用**
- 通过事件总线进行的应用间通信

---

## 🤝 贡献

欢迎贡献！提交 PR 之前，请阅读[贡献指南](./CONTRIBUTING.md)。

```bash
# 克隆仓库
git clone https://github.com/yasinatesim/tuvix.js.git

# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 运行测试
pnpm test
```

---

## 🔑 许可证

Copyright © 2026 - MIT 许可证。
查看 [LICENSE](./LICENSE) 了解更多信息。

---

<p align="center">本 README 由 <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> 生成 🥲</p>

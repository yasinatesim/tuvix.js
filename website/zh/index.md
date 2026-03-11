---
layout: home

hero:
  name: Tuvix.js
  text: 微前端框架
  tagline: Lightweight、框架无关的微前端Orchestrator。使用 React、Vue、Svelte、Angular 或 Vanilla JS 构建可扩展、独立部署的前端应用。
  image:
    src: /logo.svg
    alt: Tuvix.js
  actions:
    - theme: brand
      text: 快速上手
      link: /zh/guide/getting-started
    - theme: alt
      text: 在 GitHub 查看
      link: https://github.com/yasinatesim/tuvix.js
    - theme: alt
      text: 包列表
      link: /zh/packages/

features:
  - icon: 🔧
    title: 框架无关
    details: 在同一个 Shell 中混合使用 React、Vue、Svelte、Angular 和 Vanilla JS 微应用，同时运行。
  - icon: 📦
    title: 零运行时依赖
    details: 每个包均无运行时依赖，支持 Tree-shaking，Lightweight。
  - icon: 🔀
    title: 内置路由
    details: 基于 URL 的微应用激活，路由切换时自动挂载/卸载。
  - icon: 📡
    title: 事件总线
    details: 微应用间类型安全的发布/订阅通信，无需共享全局变量。
  - icon: 🔒
    title: CSS 与 JS 沙箱
    details: Shadow DOM 样式隔离与 JS Proxy 作用域隔离，彻底防止样式泄漏。
  - icon: ⚡
    title: 动态加载
    details: 按需加载微应用包，支持缓存、重试逻辑和错误边界。
---

## 快速安装

```bash
npm install tuvix.js
```

## 14 个包 · 10 种语言 · MIT 许可证

<PackagesOverview />

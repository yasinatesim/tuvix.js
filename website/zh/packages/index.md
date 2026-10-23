---
title: 包
---

# 包

Tuvix.js 由 15 个包组成：13 个带作用域的 `@tuvix.js/*` 库、`tuvix.js` 聚合包和 `create-tuvix-app` 脚手架工具。安装你的应用导入的那些包即可。

<PackagesOverview />

## 安装全部

```bash
npm install tuvix.js
```

[`tuvix.js` 聚合包](/zh/packages/tuvix)重新导出 core、router、event bus、loader 和 sandbox。它不包含框架适配器、`@tuvix.js/server`、`@tuvix.js/vite`、`@tuvix.js/devtools` 和 `@tuvix.js/module-federation`；这些需要单独安装。

## 单独安装

```bash
# Core
npm install @tuvix.js/core
npm install @tuvix.js/router
npm install @tuvix.js/event-bus
npm install @tuvix.js/loader
npm install @tuvix.js/sandbox

# 框架适配器（安装每个微应用所用的那个）
npm install @tuvix.js/react
npm install @tuvix.js/vue
npm install @tuvix.js/svelte
npm install @tuvix.js/angular

# 服务端渲染和构建工具
npm install @tuvix.js/server
npm install -D @tuvix.js/vite
npm install @tuvix.js/module-federation
npm install @tuvix.js/devtools

# 创建新项目脚手架
npx create-tuvix-app my-app
```

使用 pnpm 时，把 `npm install` 换成 `pnpm add`。

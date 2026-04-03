---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="CLI scaffolding tool. Instantly bootstrap a Tuvix.js project with your choice of framework and tooling."
  icon="🚀"
  github="create-tuvix-app"
/>

## 使用方法

```bash
npx create-tuvix-app my-app
```

Or with a specific package manager:

```bash
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
```

## 交互式提示

The CLI guides you through project setup:

```
✔ Project name: › my-app
✔ Template: › shell (React + Vite)
✔ Add example micro app? › Yes
✔ Package manager: › pnpm
✔ Git init? › Yes

Scaffolding project...
Done! 🎉

  cd my-app
  pnpm install
  pnpm dev
```

## 模板

| 模板 | 描述 |
|-------|-------------|
| `shell` | 微前端的 Shell 编排器 |
| `react-app` | React 微应用 |
| `vue-app` | Vue 微应用 |
| `vanilla-app` | Vanilla JS/TS 微应用 |

## 直接指定模板

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-react --template react-app
npx create-tuvix-app my-vue --template vue-app
npx create-tuvix-app my-vanilla --template vanilla-app
```

## 示例

预构建的示例应用程序可以使用 `--example` 标志来构建:

| 示例 | 描述 |
|---------|-------------|
| `with-react` | React 微前端示例 |
| `with-vue` | Vue 微前端示例 |
| `with-svelte` | Svelte 微前端示例 |
| `with-angular` | Angular 微前端示例 |
| `with-ssr-react` | React 服务器端渲染 |
| `with-react-devtools` | React 与 DevTools 集成 |
| `with-react-event-bus` | Event-Bus 集成示例 |
| `with-react-router` | Router 集成示例 |
| `with-react-sandbox` | Sandbox/CSS 隔离示例 |
| `with-module-federation-react` | React 的 Module Federation |
| `with-vanilla` | Vanilla JS 微前端示例 |
| `with-ssr-vanilla` | Vanilla JS 服务器端渲染 |
| `with-multiple-frameworks` | 多框架集成 |

## 构建示例

```bash
npx create-tuvix-app my-app --example with-react
npx create-tuvix-app my-app --example with-vue
npx create-tuvix-app my-app --example with-multiple-frameworks
```

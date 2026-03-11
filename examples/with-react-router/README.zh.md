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

# with-react-router

演示由 `@tuvix.js/router` 驱动的**基于 URL 的微应用路由**。三个独立的 React 微应用 - Dashboard、Profile 和 Settings - 被注册到特定路由，并在用户导航时自动挂载/卸载。

## 使用的包

| 包 | 作用 |
|---|---|
| `@tuvix.js/core` | Shell 协调器（内嵌路由引擎） |
| `@tuvix.js/router` | History/Hash 模式路由 |
| `@tuvix.js/react` | `createReactMicroApp` 工厂 |

## 目录结构

```
with-react-router/
├── index.html          ← 带活动链接高亮的导航栏
├── vite.config.ts
├── src/
│   ├── shell.ts        ← 注册 3 个路由，同步活动 nav 类
│   └── apps/
│       ├── dashboard/  ← 在 /dashboard 激活
│       ├── profile/    ← 在 /profile 激活
│       └── settings/   ← 在 /settings 激活
```

## 快速开始

### 通过 npx（推荐）

```bash
npx create-tuvix-app@latest --example with-react-router my-app
cd my-app
npm install
npm run dev
```

### 手动克隆

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react-router
npm install
npm run dev
```

打开 [http://localhost:5173/dashboard](http://localhost:5173/dashboard) 并使用导航链接。

## 核心概念

- **路由匹配** - 每个 `activeWhen` 模式与 `window.location.pathname` 进行匹配。Glob 模式（`/dashboard/*`）允许微应用控制自己的子路由。
- **History 模式** - 使用 HTML5 History API 实现不含 `#` 的干净 URL。
- **零包重复** - 任何时刻只有活动微应用的代码在运行。

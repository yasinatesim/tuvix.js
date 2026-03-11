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

# with-react

使用 **React 18** 和 **Vite** 构建的完整微前端 Shell，演示 Tuvix.js 编配器如何加载、挂载和卸载独立的 React 微应用。

## 使用的包

| 包 | 作用 |
|---|---|
| `@tuvix.js/core` | Shell 编配器 |
| `@tuvix.js/react` | `createReactMicroApp` 工厂 |
| `@tuvix.js/event-bus` | 共享事件总线 |

## 快速开始

### 通过 npx（推荐）

```bash
npx create-tuvix-app@latest --example with-react my-app
cd my-app
npm install
npm run dev
```

### 手动克隆

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react
npm install
npm run dev
```

打开 [http://localhost:5173/home](http://localhost:5173/home)。

## 核心概念

- **`createReactMicroApp`** - 将 React 组件包装成具有 `bootstrap`、`mount`、`unmount` 和 `update` 钩子的 Tuvix.js 兼容模块。
- **Props 传递** - Shell 将 `{ theme, user }` props 传递给 `home` 应用。
- **生命周期** - 每个应用仅在其路由激活时挂载，导航离开时干净卸载。

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

## 使い方

```bash
npx create-tuvix-app my-app
```

Or with a specific package manager:

```bash
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
```

## 対話式プロンプト

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

## テンプレート

| テンプレート | 説明 |
|----------|-------------|
| `shell` | マイクロフロントエンド用シェルオーケストレーター |
| `react-app` | React マイクロアプリ |
| `vue-app` | Vue マイクロアプリ |
| `vanilla-app` | Vanilla JS/TS マイクロアプリ |

## テンプレートを直接指定

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-react --template react-app
npx create-tuvix-app my-vue --template vue-app
npx create-tuvix-app my-vanilla --template vanilla-app
```

## 例

事前構築されたサンプルアプリケーションは `--example` フラグを使用してスキャフォールドできます:

| 例 | 説明 |
|-------------|-------------|
| `with-react` | React マイクロフロントエンド例 |
| `with-vue` | Vue マイクロフロントエンド例 |
| `with-svelte` | Svelte マイクロフロントエンド例 |
| `with-angular` | Angular マイクロフロントエンド例 |
| `with-ssr-react` | React を使用したサーバーサイドレンダリング |
| `with-react-devtools` | DevTools との React 統合 |
| `with-react-event-bus` | Event-Bus 統合例 |
| `with-react-router` | Router 統合例 |
| `with-react-sandbox` | Sandbox/CSS 分離例 |
| `with-module-federation-react` | React による Module Federation |
| `with-vanilla` | Vanilla JS マイクロフロントエンド例 |
| `with-ssr-vanilla` | Vanilla JS を使用したサーバーサイドレンダリング |
| `with-multiple-frameworks` | 複数フレームワーク統合 |

## サンプルをスキャフォールド

```bash
npx create-tuvix-app my-app --example with-react
npx create-tuvix-app my-app --example with-vue
npx create-tuvix-app my-app --example with-multiple-frameworks
```

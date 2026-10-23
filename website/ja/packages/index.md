---
title: パッケージ
---

# パッケージ

Tuvix.jsは15のパッケージで提供されます：13のスコープ付き`@tuvix.js/*`ライブラリ、統合パッケージ`tuvix.js`、そしてスキャフォルダー`create-tuvix-app`です。アプリがimportするものをインストールしてください。

<PackagesOverview />

## すべてをインストール

```bash
npm install tuvix.js
```

[`tuvix.js`統合パッケージ](/ja/packages/tuvix)は、core、router、event bus、loader、sandboxを再エクスポートします。フレームワークアダプター、`@tuvix.js/server`、`@tuvix.js/vite`、`@tuvix.js/devtools`、`@tuvix.js/module-federation`は含まれません。これらは個別にインストールしてください。

## 個別パッケージ

```bash
# Core
npm install @tuvix.js/core
npm install @tuvix.js/router
npm install @tuvix.js/event-bus
npm install @tuvix.js/loader
npm install @tuvix.js/sandbox

# Framework adapters (install the one each micro app uses)
npm install @tuvix.js/react
npm install @tuvix.js/vue
npm install @tuvix.js/svelte
npm install @tuvix.js/angular

# Server rendering and build tooling
npm install @tuvix.js/server
npm install -D @tuvix.js/vite
npm install @tuvix.js/module-federation
npm install @tuvix.js/devtools

# Scaffold a new project
npx create-tuvix-app my-app
```

pnpmを使う場合は、`npm install`を`pnpm add`に置き換えてください。

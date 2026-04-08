<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  スケーラブルで独立デプロイ可能なフロントエンドアプリケーションを構築するための、軽量で柔軟な<strong>マイクロフロントエンドフレームワーク</strong>。<br/>
  Tuvix.jsは複数のフロントエンドアプリケーションをシームレスで統一されたユーザー体験に融合します - その名前が示すとおりに。
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

## ✨ 特徴

- 🧩 **フレームワーク非依存** - React、Vue、Svelte、Angular、またはVanilla JSが使用可能
- 📦 **独立Deployment** - 各マイクロアプリを個別にデプロイ
- 🔗 **動的モジュールローディング** - マイクロフロントエンドをオンデマンドで読み込み
- 🛣️ **組み込みルーティング** - マイクロアプリ間のシームレスなルーティング
- 📡 **アプリ間通信** - アプリ間メッセージングのためのイベントバス
- ⚡ **Lightweight** - ランタイム依存ゼロ、最小限のコア
- 🔄 **Lifecycle管理** - マウント、アンマウント、アップデートフック
- 🔒 **Type-Safe** - 厳密な型によるTypeScriptの完全サポート

---

## 🤖 AIコンポーネントジェネレーター

内蔵AIチャットボットを使用して、自然言語からtuvix.jsコンポーネントを生成します。

- **動作環境：** OpenRouter 経由の MiniMax M2.5（無料 API、セルフホスティング不要）
- **対応フレームワーク：** React、Vue、Svelte、Angular
- **Dataset：** HuggingFaceの[tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset)

---

## 📦 インストール

```bash
# オールインワンパッケージ
npm install tuvix.js

# または個別パッケージをインストール
npm install @tuvix.js/core @tuvix.js/router
```

---

## 🚀 クイックスタート

### ホスト（シェル）アプリケーション

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

### マイクロフロントエンドアプリ

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    console.log('ダッシュボードが初期化されました');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>ようこそ、${props?.user}さん！</h1>`;
  },

  unmount({ container }) {
    container.innerHTML = '';
  },

  update({ props }) {
    console.log('Propsが更新されました:', props);
  },
});
```

---

## 🔌 アプリ間通信

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// App A - イベントを発行
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// App B - イベントをリッスン
bus.on('user:login', (data) => {
  console.log(`${data.name}がログインしました！`);
});
```

---

## 🛣️ ルーティング

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

## 🏗️ アーキテクチャ

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

## 📦 パッケージ

| パッケージ | 説明 |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | オールインワンパッケージ |
| [`@tuvix.js/core`](./packages/core) | Core Orchestrator with Lifecycle management |
| [`@tuvix.js/router`](./packages/router) | URLベースのマイクロアプリルーティング |
| [`@tuvix.js/event-bus`](./packages/event-bus) | アプリ間通信イベントバス |
| [`@tuvix.js/loader`](./packages/loader) | 動的モジュールローダー |
| [`@tuvix.js/sandbox`](./packages/sandbox) | CSS/JS分離（Shadow DOM + Proxy） |
| [`@tuvix.js/react`](./packages/react) | React 18+バインディング＆フック |
| [`@tuvix.js/vue`](./packages/vue) | Vue 3バインディング＆コンポーザブル |
| [`@tuvix.js/svelte`](./packages/svelte) | Svelte 3-5バインディング |
| [`@tuvix.js/angular`](./packages/angular) | Angular 15+バインディング |
| [`create-tuvix-app`](./packages/cli) | CLIスキャフォールディングツール |
| [`@tuvix.js/devtools`](./packages/devtools) | ページ内デバッグパネル |
| [`@tuvix.js/server`](./packages/server) | サーバーサイドコンポジション |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Webpack Module Federation統合 |

---

## 📁 プロジェクト構成

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
│   └── tuvix/              # tuvix.js（アンブレラパッケージ）
├── examples/
│   ├── with-angular/              # Angular 15+サンプル
│   ├── with-module-federation-react/ # Module Federation + Reactサンプル
│   ├── with-multiple-frameworks/  # 複数フレームワークサンプル
│   ├── with-react/                # React 18+サンプル
│   ├── with-react-devtools/       # React + DevToolsサンプル
│   ├── with-react-event-bus/      # React + Event Busサンプル
│   ├── with-react-router/         # React + Routerサンプル
│   ├── with-react-sandbox/        # React + Sandboxサンプル
│   ├── with-ssr-react/            # SSR + Reactサンプル
│   ├── with-ssr-vanilla/          # SSR + Vanilla JSサンプル
│   ├── with-svelte/               # Svelte 5サンプル
│   ├── with-vanilla/              # Vanilla JSサンプル
│   └── with-vue/                  # Vue 3サンプル
├── website/                # ドキュメントサイト（VitePress、10言語対応）
├── .github/                # CI/CDワークフロー
├── package.json            # ルートワークスペース設定
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── vitest.config.ts
```

---

## 🗺️ ロードマップ

### ✅ 完了済み

- [x] Core Orchestrator
- [x] Lifecycle管理
- [x] 動的モジュールローディング
- [x] イベントバス
- [x] history/hashモード対応のURLルーティング
- [x] CSS/JSサンドボックス分離
- [x] CLIスキャフォールディングツール（`npx create-tuvix-app`）
- [x] DevToolsブラウザ拡張機能
- [x] サーバーサイドコンポジション
- [x] Module Federationサポート
- [x] フレームワークバインディング（React、Vue、Svelte、Angular）
- [x] i18nドキュメント（10言語）

### 🔜 近日公開

- [ ] マイクロアプリ間のホットモジュールリロード
- [ ] 共有ステート管理アダプター
- [ ] プリロード＆プリフェッチ戦略
- [ ] プラグインシステム＆ミドルウェアAPI
- [ ] DevToolsでのビジュアル依存関係グラフ
- [ ] Testing utilities & mock Orchestrator
- [ ] ネイティブESM / importmapサポート
- [ ] Edge/CDN対応サーバーコンポジション
- [ ] DevTools統合用VS Code拡張機能
- [ ] マイクロアプリ分離のためのStorybook統合

---

## 🧪 サンプル

サポートされている各フレームワーク向けのすぐに実行できるサンプルが[`examples/`](./examples)ディレクトリにあります：

| サンプル | フレームワーク | パス |
| --- | --- | --- |
| [Angularサンプル](./examples/with-angular) | Angular 15+ | `examples/with-angular/` |
| [Module Federation + Reactサンプル](./examples/with-module-federation-react) | React 18+ | `examples/with-module-federation-react/` |
| [複数フレームワークサンプル](./examples/with-multiple-frameworks) | 複合 | `examples/with-multiple-frameworks/` |
| [Reactサンプル](./examples/with-react) | React 18+ | `examples/with-react/` |
| [React + DevToolsサンプル](./examples/with-react-devtools) | React 18+ | `examples/with-react-devtools/` |
| [React + Event Busサンプル](./examples/with-react-event-bus) | React 18+ | `examples/with-react-event-bus/` |
| [React + Routerサンプル](./examples/with-react-router) | React 18+ | `examples/with-react-router/` |
| [React + Sandboxサンプル](./examples/with-react-sandbox) | React 18+ | `examples/with-react-sandbox/` |
| [SSR + Reactサンプル](./examples/with-ssr-react) | React 18+ | `examples/with-ssr-react/` |
| [SSR + Vanilla JSサンプル](./examples/with-ssr-vanilla) | フレームワークなし | `examples/with-ssr-vanilla/` |
| [Svelteサンプル](./examples/with-svelte) | Svelte 5 | `examples/with-svelte/` |
| [Vanilla JSサンプル](./examples/with-vanilla) | フレームワークなし | `examples/with-vanilla/` |
| [Vueサンプル](./examples/with-vue) | Vue 3 | `examples/with-vue/` |

各サンプルでは以下を実演します：

- Orchestratorを起動する**Host (Shell)**アプリケーション
- 動的に登録・読み込みされる2つの**マイクロフロントエンドアプリ**
- イベントバスによるアプリ間通信

---

## 🤝 コントリビュート

コントリビューションを歓迎します！PRを送信する前に[コントリビューションガイド](./CONTRIBUTING.md)をお読みください。

```bash
# リポジトリをクローン
git clone https://github.com/yasinatesim/tuvix.js.git

# 依存関係をインストール
pnpm install

# 全パッケージをビルド
pnpm build

# テストを実行
pnpm test
```

---

## 🔑 ライセンス

Copyright © 2026 - MITライセンス。
詳細は[LICENSE](./LICENSE)をご覧ください。

---

<p align="center">このREADMEは<a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a>で生成されました 🥲</p>

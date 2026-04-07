<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Tuvix.js の例

このディレクトリには、**Tuvix.js** オーケストレータのさまざまな機能とフレームワーク統合を実装するスタンドアロンの完全に動作するプロジェクト例が含まれています。

## クイックスタート

`create-tuvix-app` CLI で `--example` フラグを使用するのが最も簡単な方法です:

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

*(また、このリポジトリをクローンして、任意の例フォルダ内で `npm install` と `npm run dev` を手動で実行することもできます)。*

## 利用可能な例

| 例の名前 | フレームワーク | 実証される主な機能 |
|--------------|-----------|--------------------------|
| [`with-react`](./with-react/) | React 18 | Basic Shell, Routing, and Prop passing via `@tuvix.js/react` |
| [`with-react-event-bus`](./with-react-event-bus/) | React 18 | Cross-app pub/sub communication using `@tuvix.js/event-bus` |
| [`with-react-router`](./with-react-router/) | React 18 | URL-based active routing using `@tuvix.js/router` |
| [`with-react-sandbox`](./with-react-sandbox/) | React 18 | Strict Shadow DOM CSS isolation via `@tuvix.js/sandbox` |
| [`with-react-devtools`](./with-react-devtools/) | React 18 | In-page orchestrator debugging via `@tuvix.js/devtools` |
| [`with-module-federation-react`](./with-module-federation-react/) | React (Webpack 5) | Dynamic remote module loading via `@tuvix.js/module-federation` |
| [`with-ssr-react`](./with-ssr-react/) | React (Express) | Asynchronous SSR HTML fragment composition via `@tuvix.js/server` |
| [`with-vue`](./with-vue/) | Vue 3 | Vue 3 composition API integration via `@tuvix.js/vue` |
| [`with-svelte`](./with-svelte/) | Svelte 4 | Svelte integration and Context API props via `@tuvix.js/svelte` |
| [`with-angular`](./with-angular/) | Angular 15+ | Angular CLI setup and `@Input()` injection via `@tuvix.js/angular` |
| [`with-multiple-frameworks`](./with-multiple-frameworks/) | React & Vue 3 | Polyglot architecture (sharing a single shell across frameworks) |

## 多言語サポート

各例は **10 言語** (英語、トルコ語、スペイン語、ドイツ語、フランス語、日本語、中国語、イタリア語、ポルトガル語、ヒンディー語) のドキュメントを提供します。任意の例ディレクトリを開いてローカライズされた README ファイルを確認してください。

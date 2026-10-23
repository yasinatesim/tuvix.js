<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Tuvix.jsのサンプル

機能またはフレームワークごとに1つずつ用意された、実行可能なプロジェクトです。各サンプルの`e2e/`フォルダーには、CIで実行されるPlaywrightのspecがあります。

## クイックスタート

`create-tuvix-app` CLIで任意のサンプルを始められます：

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

このリポジトリをクローンした場合は、ルートで`pnpm install`を実行し、サンプルのフォルダーで`pnpm dev`（サーバーのサンプルでは`pnpm start`）を実行します。

## 利用できるサンプル

| サンプル | フレームワーク | 内容 |
|---------|-----------|---------------|
| [`with-vanilla`](./with-vanilla/) | Plain JS | フレームワークなしでの`defineMicroApp`、ルーティング、`interceptLinks` |
| [`with-react`](./with-react/) | React 18 | `@tuvix.js/react`によるシェル、ルート、props |
| [`with-react-event-bus`](./with-react-event-bus/) | React 18 | `getGlobalBus()`上でイベントを発行・受信するアプリ |
| [`with-react-router`](./with-react-router/) | React 18 | ルートとアプリの対応付けと、クライアントサイドのリンクナビゲーション |
| [`with-react-sandbox`](./with-react-sandbox/) | React 18 | `sandbox: true`によるShadow RootでのCSS分離と、比較用のサンドボックスなしのアプリ |
| [`with-react-devtools`](./with-react-devtools/) | React 18 | `@tuvix.js/devtools`のページ内デバッグパネル |
| [`with-module-federation-react`](./with-module-federation-react/) | React (webpack 5) | `createFederatedEntry`で読み込まれるリモートアプリ |
| [`with-ssr-vanilla`](./with-ssr-vanilla/) | Express | `composeHTML`によるサーバーサイドのフラグメント合成 |
| [`with-ssr-react`](./with-ssr-react/) | React (Express) | `composeHTML`で合成されるReactの`renderToString`フラグメント |
| [`with-ssr-islands`](./with-ssr-islands/) | React 19シェル, Vue 3, Svelte 5, Angular 20 (Express + Vite) | クライアントでハイドレートされるサーバーレンダリングされたアイランド、インラインの`TuvixReactApp`、ページを壊さずにフォールバックする失敗するアイランド |
| [`with-vue`](./with-vue/) | Vue 3 | `defineProps`経由のpropsを使う`createVueMicroApp` |
| [`with-svelte`](./with-svelte/) | Svelte 4 | `export let`のpropsを使う`createSvelteMicroApp` |
| [`with-angular`](./with-angular/) | Angular 16 | スタンドアロンコンポーネント、zoneless、`createAngularMicroApp` |
| [`with-multiple-frameworks`](./with-multiple-frameworks/) | React and Vue 3 | 1つのページ上でイベントバスを共有する2つのフレームワーク |

## 翻訳

`README.md`を持つサンプルには、トルコ語、スペイン語、ドイツ語、フランス語、日本語、中国語、イタリア語、ポルトガル語、ヒンディー語の版もあります。内容が異なる場合は英語のREADMEが基準です。

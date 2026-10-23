<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  マイクロフロントエンドツールキットです。React、Vue、Svelte、Angular、またはプレーンなTypeScriptで書かれ、独立してデプロイされるアプリを、ブラウザー上で、あるいはReactページ内のサーバーレンダリングされたアイランドとして、読み込み、マウントし、接続します。
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

- 🧩 **フレームワークアダプター**：React 18/19、Vue 3、Svelte 3-5、Angular 15+に対応します。どのアダプターもルートコンポーネントを`mount`、`update`、`unmount`を持つマイクロアプリモジュールに変換し、コンテナーごとに1つのインスタンスを作ります。
- 🛣️ **パスベースのアクティベーション**：`activeWhen: '/users/:id'`は、一致するパスでアプリをマウントします。クエリ文字列やハッシュによってアンマウントされることはありません。オーケストレーター、ルーター、サーバーパッケージは1つのマッチャー（`matchPath`）を共有します。
- 🔁 **順序付きマウント**：ルート変更は1つずつ調整（reconcile）されます。非アクティブなアプリは新しいアプリのマウント前にアンマウントされるため、A → B → Aと素早く移動してもページに残るのはAだけです。
- 🔗 **外部ルーター**：`orchestrator.connectRouter()`はTanStack RouterやReact Routerに追従します。`interceptLinks()`は通常の`<a href>`クリックをクライアントナビゲーションに変換します。
- 🏝️ **SSRアイランド**：`TuvixIsland`は、サーバーレンダリングされたReactページ内でVue、Svelte、Angular、Reactのマイクロアプリをホストし、その場でハイドレートします。再レンダリング時にそのDOMを書き換えることはありません。
- 🎨 **スタイル適用済みの初回描画**：`@tuvix.js/vite`は各アイランドが必要とするスタイルシートをサーバーに伝えるため、それらを`<head>`でリンクできます。
- 📦 **柔軟なエントリー**：スクリプトURL、`{ scripts, styles, type }`、または`() => import('./app')`のようなローダー関数を使えます。並列読み込み、リトライ、タイムアウト、SRIハッシュに対応します。
- 📡 **共有イベントバス**：`getGlobalBus()`は、別々にバンドルされたアプリ間でも、ページごとに1つのバスを返します。
- 🔔 **ライフサイクルイベント**：`tuvix:mounted`、`tuvix:unmounted`、`tuvix:error`に加え、`whenMounted(name)`と`onLifecycle()`を提供します。
- 🔒 **必要に応じたCSS分離**：`sandbox: true`を指定すると、アプリは独自のスタイルシートを持つShadow Root内にレンダリングされます。
- 🟦 **TypeScript**：すべてのライブラリパッケージは、型宣言付きのESMビルドとCommonJSビルドを提供します。

Tuvix.jsはアプリ間でJavaScriptを分離しません。すべてのアプリはページの`window`で実行されます。信頼できないコードには`<iframe>`を使ってください。

---

## 🤖 AIコンポーネントジェネレーター

ドキュメントサイトのチャットボットを使い、自然言語からtuvix.jsコンポーネントを生成できます。

- **チャットモデル：** OpenRouter経由のMiniMax M2.5
- **埋め込みモデル：** OpenRouter経由のNVIDIA Nemotron Embed 1B（RAG検索）
- **対応：** React、Vue、Svelte、Angular
- **データセット：** HuggingFace上の[tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset)

> 試してみる：ドキュメントサイトの[AI Generator](https://tuvix.js.org/chatbot)

---

## 📦 インストール

```bash
# Orchestrator, router, loader, event bus and sandbox
pnpm add tuvix.js

# Adapters, as needed
pnpm add @tuvix.js/react @tuvix.js/vue @tuvix.js/svelte @tuvix.js/angular

# Or scaffold a project
npx create-tuvix-app my-app --template shell
```

---

## 🚀 クイックスタート

### シェル

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [] },
});

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main-content',
  activeWhen: '/dashboard/*',
  props: { user: 'Guest' },
  fallback: '<p>Dashboard is unavailable.</p>',
});

orchestrator.register({
  name: 'settings',
  entry: () => import('./apps/settings'),
  container: '#main-content',
  activeWhen: '/settings/*',
});

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.start();
```

### マイクロアプリ

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Welcome, {user}</h1>;
}

// Registers itself as "dashboard", so the shell's script entry finds it.
export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

フレームワークを使わない場合：

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'settings',
  mount({ container, props }) {
    const title = document.createElement('h1');
    title.textContent = `Settings for ${String(props?.user ?? 'Guest')}`;
    container.replaceChildren(title);
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

### propsの更新

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

`update`を持つマウント済みのアプリは、その場で再レンダリングします。それ以外の場合、オーケストレーターはマージしたpropsを次回のマウントまで保持します。

---

## 🌉 外部ルーターに追従する

```ts
import { createOrchestrator } from 'tuvix.js';
import { router } from './router'; // TanStack Router instance

const orchestrator = createOrchestrator(); // no built-in router

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});

await orchestrator.start();
```

---

## 🏝️ サーバーレンダリングされたアイランド

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });

// `footerHtml` comes from renderSvelteToString() in server-only code.
export function Layout({ footerHtml }: { footerHtml?: string }) {
  return <TuvixIsland name="footer" app={footer} props={{ year: 2026 }} ssrHtml={footerHtml} fallback={<footer>© 2026</footer>} />;
}
```

ハイドレーション中、アイランドはHTMLをページから読み取るため、クライアントが`footerHtml`を必要とすることはありません。[SSRアイランドガイド](https://tuvix.js.org/guide/ssr-islands)と[`examples/with-ssr-islands`](./examples/with-ssr-islands)を参照してください。

---

## 🔔 ライフサイクルイベント

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer');
container.classList.add(hydrated ? 'hydrated' : 'rendered');
```

---

## 🔌 イベントバス

```ts
import { getGlobalBus } from 'tuvix.js';

const bus = getGlobalBus(); // the same bus the orchestrator passes to mount()

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => console.log(userId));
bus.emit('user:login', { userId: '42' });
off();
```

---

## 📦 パッケージ

| パッケージ | 説明 |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | 統合パッケージ：core、router、loader、event bus、sandbox |
| [`@tuvix.js/core`](./packages/core) | オーケストレーター：登録、調整（reconcile）、props、`connectRouter` |
| [`@tuvix.js/router`](./packages/router) | History/Hashルーター、`matchPath`、`interceptLinks` |
| [`@tuvix.js/loader`](./packages/loader) | エントリーの読み込みとライフサイクルランタイム |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Pub/subバス、ページ全体で共有する`getGlobalBus()` |
| [`@tuvix.js/sandbox`](./packages/sandbox) | `CssSandbox`（Shadow DOM）、`JsSandbox`（プロキシwindow） |
| [`@tuvix.js/react`](./packages/react) | Reactアダプター、`TuvixReactApp`、`TuvixIsland`、フック |
| [`@tuvix.js/vue`](./packages/vue) | Vue 3アダプター、`renderVueToString` |
| [`@tuvix.js/svelte`](./packages/svelte) | Svelte 3-5アダプター、`renderSvelteToString` |
| [`@tuvix.js/angular`](./packages/angular) | Angular 15+アダプター（zoneless）、`renderAngularToString` |
| [`@tuvix.js/vite`](./packages/vite) | Viteプラグイン：サーバーレンダリングされる`<head>`向けのアイランドスタイルシートリンク |
| [`@tuvix.js/server`](./packages/server) | HTMLフラグメントのサーバーサイド合成、ストリーミング、メトリクス |
| [`@tuvix.js/module-federation`](./packages/module-federation) | webpack Module Federationのリモートを使うエントリー |
| [`@tuvix.js/devtools`](./packages/devtools) | ページ内デバッグパネル |
| [`create-tuvix-app`](./packages/cli) | プロジェクトのスキャフォールディング |

---

## 📁 プロジェクト構成

```text
tuvix.js/
├── packages/        # the 15 packages above
├── examples/        # runnable examples, see below
├── website/         # documentation site (VitePress, 10 languages)
├── scripts/         # docs and package validators
└── .changeset/      # release notes for the next version
```

---

## 🧪 サンプル

| サンプル | 内容 |
| --- | --- |
| [`with-ssr-islands`](./examples/with-ssr-islands) | サーバーレンダリングされたVue、Svelte、Angular、Reactのアイランドを持つReactホスト |
| [`with-react`](./examples/with-react) | Reactのシェルとマイクロアプリ |
| [`with-vue`](./examples/with-vue) | Vue 3のマイクロアプリ |
| [`with-svelte`](./examples/with-svelte) | Svelteのマイクロアプリ |
| [`with-angular`](./examples/with-angular) | Angularのマイクロアプリ |
| [`with-vanilla`](./examples/with-vanilla) | フレームワークなし |
| [`with-multiple-frameworks`](./examples/with-multiple-frameworks) | 1つのシェル内のReactとVue |
| [`with-react-router`](./examples/with-react-router) | ルーティング |
| [`with-react-event-bus`](./examples/with-react-event-bus) | イベントバス |
| [`with-react-sandbox`](./examples/with-react-sandbox) | CSSサンドボックス |
| [`with-react-devtools`](./examples/with-react-devtools) | Devtoolsパネル |
| [`with-module-federation-react`](./examples/with-module-federation-react) | Module Federation |
| [`with-ssr-react`](./examples/with-ssr-react) | `@tuvix.js/server`によるサーバー合成 |
| [`with-ssr-vanilla`](./examples/with-ssr-vanilla) | フレームワークなしのサーバー合成 |

---

## 🗺️ ロードマップ

提供済み：

- 直列化された調整（reconcile）、`connectRouter`、ビューポートでのマウント、フォールバックHTMLを備えたオーケストレーター
- SSRハイドレーションに対応したReact、Vue、Svelte 3-5、Angular（zoneless）向けアダプター
- `TuvixIsland`、ライフサイクルイベント、`@tuvix.js/vite`によるアイランドアセット
- ストリーミングとPrometheusメトリクスに対応したサーバー合成（`@tuvix.js/server`）
- Module Federationエントリー、ページ内devtools、CLIによるスキャフォールディング
- 10言語のドキュメント

予定：

- マイクロアプリ間のホットモジュールリロード
- ネイティブESM / import mapのサポート
- stale-while-revalidateによるフラグメントキャッシュを備えた、エッジを考慮したサーバー合成
- テストユーティリティとモックオーケストレーター
- フラグメントのA/Bテスト

---

## 🤝 コントリビュート

プルリクエストを作成する前に[コントリビューションガイド](./CONTRIBUTING.md)をお読みください。

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js
pnpm install
pnpm build
pnpm test
```

0.4から移行しますか？[移行ガイド](https://tuvix.js.org/guide/migration-0-5)をお読みください。

---

## 🔑 ライセンス

Copyright © 2026 - MIT License.
詳しくは[LICENSE](./LICENSE)を参照してください。

---

<p align="center">このREADMEは<a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a>で生成されました 🥲</p>

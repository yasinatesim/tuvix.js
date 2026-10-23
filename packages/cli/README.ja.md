# create-tuvix-app

> Tuvix.jsのシェル、またはReact、Vue、Svelte、Angular、vanillaのマイクロアプリ用のViteプロジェクトをスキャフォールドします

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。

## 使い方

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app

# npm create forwards flags only after --
npm create tuvix-app@latest my-app -- --template react-app --typescript
```

CLIは省略した値（プロジェクト名、テンプレート、TypeScript）をすべて対話形式で尋ね、ファイルを`./<project-name>`に書き出してから依存関係をインストールします。

## クイックスタート

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

## オプション

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `project-name` | 位置引数 | プロンプト | フォルダー名と`package.json`の名前 |
| `--template`, `-t` | `string` | プロンプト | `shell`、`react-app`、`vue-app`、`svelte-app`、`angular-app`、`vanilla-app`のいずれか |
| `--typescript` / `--no-typescript` | フラグ | プロンプト（`Yes`が選択済み） | TypeScriptファイルと`tsconfig.json`、またはJavaScript。`angular-app`は常にTypeScriptです。 |
| `--example`, `-e` | `string` | なし | GitHubリポジトリ（`master`）から`examples/<name>`をダウンロードします。プロンプトとインストールをスキップします。 |
| `--help`, `-h` | フラグ | `false` | 使い方を表示します |
| `--version`, `-v` | フラグ | `false` | CLIの`package.json`から読み取った`create-tuvix-app v<version>`を表示します |

## テンプレート

各プロジェクトには`index.html`、`src/main.<ext>`、そして`dev`/`build`/`preview`のViteスクリプト、`tuvix.js@^0.5.0`、`vite@^6.0.0`（TSモードでは`typescript@^5.7.0`も）を含む`package.json`が生成されます。

| テンプレート | 生成内容 | 追加の依存関係 |
| --- | --- | --- |
| `shell` | historyルーター（`/dashboard/*`、`/settings/*`）を使う`createOrchestrator`と、プレースホルダーのCDN URLを指す登録済みの`dashboard`アプリ1つ | なし |
| `react-app` | `createReactMicroApp({ name, App })`、`App.tsx`、`@vitejs/plugin-react`を使う`vite.config.ts` | `react`、`react-dom` `^19`、`@tuvix.js/react`、`@vitejs/plugin-react@^4.3` |
| `vue-app` | `createVueMicroApp({ name, App })`、`inject(TUVIX_PROPS_KEY)`でpropsを読む`App.vue`、`@vitejs/plugin-vue`を使う`vite.config.ts`、TSモードでは`*.vue`モジュールを宣言する`src/vite-env.d.ts` | `vue@^3.5`、`@tuvix.js/vue`、`@vitejs/plugin-vue@^5.2` |
| `svelte-app` | `svelte/reactivity`の`SvelteMap`を使う`createSvelteMicroApp({ name, App, SvelteMap })`。これにより`update()`はその場で再レンダリングします。`$props()`を読むSvelte 5の`App.svelte`、`vite.config.ts`、`vitePreprocess()`を使う`svelte.config.js`、TSモードでは`src/vite-env.d.ts`と`check`スクリプト | `svelte@^5`、`@tuvix.js/svelte`、`@sveltejs/vite-plugin-svelte@^5`、`svelte-check@^4`（TSモード） |
| `angular-app` | standaloneの`AppComponent`を使う`createSsrAngularMicroApp({ name, component })`、zonelessのAngular 20。JITコンポーネントがコンパイルされるよう、`src/main.ts`は最初に`@angular/compiler`をimportします。 | `@angular/{common,compiler,core,platform-browser}@^20`、`rxjs`、`tslib`、`@tuvix.js/angular` |
| `vanilla-app` | `innerHTML`に書き込む`mount`/`unmount`を持つ`defineMicroApp` | なし |

## パッケージマネージャーとインストール

CLIはBun上で実行されている場合は`bun`を選び、次に`npm_execpath`で`pnpm`/`yarn`を、続いて`npm_config_user_agent`で`pnpm`/`yarn`/`bun/`を確認し、どれにも該当しなければ`npm`を使います。テンプレートの生成後、出力を非表示にして`<pm> install`を実行します。これが失敗すると、コマンドとともに`Install failed. Run manually:`を表示し、それでも終了コード0で終了します。

## エッジケース

- 対象フォルダーが既に存在する場合は`Directory "<name>" already exists.`で失敗します（終了コード1）。
- `../app`のように現在のディレクトリの外に解決される名前は失敗します。
- 未知の`--template`は、利用可能なテンプレートの一覧を表示して失敗します。
- プロジェクト名は入力どおりに使われ、npmの命名規則はチェックされません。
- サンプルは`workspace:*`に依存しています。インストールの前に`^0.5.0`に置き換えてください。
- 存在しないサンプルを指定すると空のフォルダーが残ります。再試行の前に削除してください。

## 対象外の機能

- マイクロアプリのテンプレートはモジュールをexportするだけでマウントはしないため、シェルが読み込むまで`pnpm run dev`では空の`#app`が表示されます。
- ライブラリモードのビルド設定、git init、リンター、テスト、モノレポのセットアップは含まれません。
- `--no-install`やパッケージマネージャーを指定するフラグ、プログラムから使うAPIはありません。

完全なドキュメント：[tuvix.js.org/packages/create-tuvix-app](https://tuvix.js.org/packages/create-tuvix-app)

## ライセンス

MIT

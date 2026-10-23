---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="Tuvix.jsのシェル、またはReact、Vue、Svelte、Angular、vanillaのマイクロアプリ用のViteプロジェクトを生成し、依存関係をインストールするCLIです。"
  icon="🚀"
  npm="true"
  github="cli"
/>

## 使い方

パッケージ名が`create-`で始まるため、どのパッケージマネージャーの`create`コマンドでも見つけられ、`npx`はその`create-tuvix-app`バイナリを実行します。

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app
```

`npm create`は`--`の後のフラグだけを転送します。他のコマンドはフラグをそのまま渡します。

```bash
npm create tuvix-app@latest my-app -- --template react-app --typescript
pnpm create tuvix-app my-app --template react-app --typescript
```

バイナリにはNode.jsが必要です。現在のディレクトリの下に新しいフォルダーを作成して書き込みます。

## 使いどころ

Tuvix.jsの構成要素を1つ、ゼロから始めるときに使います：マイクロアプリを登録するシェル、または特定のフレームワークのマイクロアプリ1つです。1回の実行で、`tuvix.js`と対応する`@tuvix.js/*`アダプターを`^0.5.0`で含むViteプロジェクトが1つ作成されます。

既存のアプリにTuvix.jsを追加する場合は、別の方法を選んでください。パッケージマネージャーでアダプターをインストールし、代わりに[ガイド](/ja/guide/getting-started)に従います。読んだりコピーしたりできる、動作する複数アプリ構成が必要な場合は`--example`を使います（[サンプル](#examples)を参照）。

## クイックスタート

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

CLIは6つのファイルを書き込み、`checkout/`で`pnpm install`を実行し、次の手順を表示します。

```text
checkout/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    └── main.tsx
```

`src/main.tsx`は、シェルがロードするマイクロアプリのモジュールをエクスポートします。

```tsx [src/main.tsx]
import { createReactMicroApp } from '@tuvix.js/react';
import { App } from './App';

export default createReactMicroApp({
  name: 'my-react-app',
  App,
});
```

`my-react-app`を、シェルが登録する名前に変更してください。CLIはそこにプロジェクト名を挿入しません。

## オプション

```text
create-tuvix-app [project-name] [options]
```

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `project-name` | 位置引数 | プロンプト | フォルダー名と`package.json`の名前。`-`で始まらない最初の引数がこれを設定し、後の引数があればそれで置き換えられます。 |
| `--template`、`-t` | `string` | プロンプト | `shell`、`react-app`、`vue-app`、`svelte-app`、`angular-app`、`vanilla-app`のいずれか。 |
| `--typescript` | フラグ | プロンプト（`Yes`が事前選択） | TypeScriptのファイルと`tsconfig.json`を生成します。 |
| `--no-typescript` | フラグ | プロンプト | JavaScriptのファイルを生成します。`angular-app`はこれを無視します。 |
| `--example`、`-e` | `string` | なし | テンプレートの代わりに、GitHubリポジトリの`examples/`からフォルダーをダウンロードします。プロンプトとインストールのステップをスキップします。 |
| `--help`、`-h` | フラグ | `false` | 使い方を表示して終了します。 |
| `--version`、`-v` | フラグ | `false` | `create-tuvix-app v<version>`を表示して終了します。CLIはバージョンを自身の`package.json`から読み取ります。 |

省略した値はすべて、CLIが対話的なプロンプトで次の順に尋ねます：プロジェクト名（プレースホルダーは`my-app`、空の入力は拒否）、テンプレート、TypeScript。3つすべてを渡すと、プロンプトなしで実行されます。

```bash
npx create-tuvix-app admin --template angular-app --typescript
```

CLIは知らないフラグを無視します。

## テンプレート

どのテンプレートも`index.html`、`package.json`、`src/main.<ext>`を書き込みます。生成される`package.json`は`private`で、`"type": "module"`、バージョン`0.1.0`、3つのスクリプトを持ちます：`dev`（`vite`）、`build`（`vite build`）、`preview`（`vite preview`）。TypeScriptモードの`svelte-app`は4つ目の`check`を追加します。どの`package.json`にも`tuvix.js@^0.5.0`と`vite@^6.0.0`が記載され、TypeScriptモードでは`typescript@^5.7.0`も加わります。

| テンプレート | `index.html`と`package.json`以外のファイル | 追加の依存関係 |
| --- | --- | --- |
| `shell` | `src/main.ts` | なし |
| `react-app` | `src/main.tsx`、`src/App.tsx`、`vite.config.ts` | `react`、`react-dom` `^19.0.0`、`@tuvix.js/react`、`@vitejs/plugin-react@^4.3.0`。TSモードでは`@types/react`、`@types/react-dom` |
| `vue-app` | `src/main.ts`、`src/App.vue`、`vite.config.ts`。TSモードでは`src/vite-env.d.ts` | `vue@^3.5.0`、`@tuvix.js/vue`、`@vitejs/plugin-vue@^5.2.0` |
| `svelte-app` | `src/main.ts`、`src/App.svelte`、`vite.config.ts`、`svelte.config.js`。TSモードでは`src/vite-env.d.ts` | `svelte@^5.0.0`、`@tuvix.js/svelte`、`@sveltejs/vite-plugin-svelte@^5.0.0`。TSモードでは`svelte-check@^4.0.0` |
| `angular-app` | `src/main.ts`、`src/app/app.component.ts`、`vite.config.ts` | `@angular/common`、`@angular/compiler`、`@angular/core`、`@angular/platform-browser` `^20.0.0`、`rxjs@^7.8.0`、`tslib@^2.6.0`、`@tuvix.js/angular`、`typescript@~5.8.0` |
| `vanilla-app` | `src/main.ts` | なし |

TypeScriptモードでは`tsconfig.json`（`ES2020`、`ESNext`モジュール、`bundler`解決、`strict`）が追加されます。`react-app`、`vue-app`、`svelte-app`では、`src`の隣にある`vite.config.ts`もincludeします。JavaScriptモードでは`.js`と`.jsx`を使い、`tsconfig.json`は書き込みません。`vite.config.ts`はTypeScriptのままですが、Viteはどちらの場合もこれをロードします。すべての`@tuvix.js/*`パッケージは`^0.5.0`になります。

### `shell`

historyルーターを持つオーケストレーターです。`index.html`には`#header`、`/dashboard`と`/settings`へのリンクを持つ`<nav>`、そして`<main id="main">`があります。`src/main.ts`：

```ts [src/main.ts]
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
  onError(error, appName) {
    console.error(`App "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

orchestrator.start();
```

`entry`のURLをダッシュボードアプリのビルド済みエントリーに置き換え、`settings`は自分で登録してください。テンプレートが登録するのは`dashboard`だけです。

### `react-app`

`@tuvix.js/react`の`createReactMicroApp({ name: 'my-react-app', App })`です。`App`は見出しと、受け取ったpropsをJSONとしてレンダリングします。`vite.config.ts`は`@vitejs/plugin-react`を追加します。これはJSXをautomatic runtimeでコンパイルするため、JavaScriptモードの`App.jsx`に`React`のimportは不要です。TSの`tsconfig.json`は`"jsx": "react-jsx"`を設定します。

### `vue-app`

`@tuvix.js/vue`の`createVueMicroApp({ name: 'my-vue-app', App })`で、`vite.config.ts`は`@vitejs/plugin-vue`を追加します。`App.vue`は、シェルのpropsを`inject`で読み取る`<script setup>`コンポーネントです。

```vue [src/App.vue]
<template>
  <div style="padding: 24px; font-family: system-ui">
    <h1>Vue Micro App</h1>
    <p>This is a Tuvix.js micro frontend.</p>
    <pre>{{ JSON.stringify(props, null, 2) }}</pre>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

// The props the shell passes to mount() and update(), kept reactive.
const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
</script>
```

TSモードでは、`src/vite-env.d.ts`が`vite/client`を参照し、`*.vue`モジュールを宣言するため、`tsc`は`App`のimportを受け付けます。

### `svelte-app`

Svelte 5のマイクロアプリです。`src/main.ts`は`svelte/reactivity`の`SvelteMap`を渡すため、`update({ props })`は再マウントせずにその場で再レンダリングします。

```ts [src/main.ts]
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({
  name: 'my-svelte-app',
  App,
  SvelteMap,
});
```

`App.svelte`は`$props()`で`name`プロパティを読み取ります。`vite.config.ts`はSvelteプラグインを追加し、`svelte.config.js`は`<script lang="ts">`がコンパイルされるように`preprocess: vitePreprocess()`を設定します。TSモードでは、`src/vite-env.d.ts`が`svelte`と`vite/client`の型を参照し、`package.json`に`check`スクリプト（`svelte-check --tsconfig ./tsconfig.json`）が追加されます。

### `angular-app`

zone.jsなしのAngular 20です。このテンプレートは`--no-typescript`を指定しても常にTypeScriptを使い、プロンプトでJavaScriptを選んだ場合は`Angular requires TypeScript. Switching to TypeScript automatically.`を表示します。

```ts [src/main.ts]
// Load the JIT compiler before any Angular package that ships partially
// compiled code (@angular/common, forms, router) is evaluated.
import '@angular/compiler';
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app/app.component';

export default createSsrAngularMicroApp({
  name: 'my-angular-app',
  component: AppComponent,
});
```

`AppComponent`はインラインテンプレートを持つstandaloneコンポーネントです。`createSsrAngularMicroApp`は、空のコンテナには新規にレンダリングし、コンテナが`renderAngularToString`のHTMLを持つ場合はそのマークアップの上にレンダリングします。アダプターはzonelessで動作します。ViteはAngularをAOTコンパイルしないため、コンポーネントはブラウザでコンパイルされます：`import '@angular/compiler'`を`src/main.ts`の1行目に保ち、コンパイラーをランタイムの依存関係として維持してください。`tsconfig.json`は`ES2022`をターゲットにし、`experimentalDecorators`を有効、`useDefineForClassFields`を無効にします。`vite.config.ts`はesbuildのターゲットを`es2022`に設定します。

### `vanilla-app`

`tuvix.js`の`defineMicroApp`で、`container.innerHTML`に見出しを書き込む`mount`と、それを消去する`unmount`を持ちます。

## サンプル {#examples}

`--example <name>`は`https://codeload.github.com/yasinatesim/tuvix.js/tar.gz/master`をダウンロードし、`examples/<name>/`をプロジェクトフォルダーに展開します。プロンプト、`--template`、`--typescript`、インストールのステップはスキップされます。CLIは次の手順として`<pm> install`と`<pm> run dev`を表示します。

```bash
npx create-tuvix-app my-app --example with-multiple-frameworks
```

プロジェクト名を指定しない場合、フォルダーは`my-app`になります。名前に使えるのは英字、数字、ハイフンだけです。`examples/`には次のフォルダーがあります。

| サンプル | 内容 |
| --- | --- |
| `with-react` | シェル内のReactマイクロアプリ |
| `with-vue` | シェル内のVueマイクロアプリ |
| `with-svelte` | シェル内のSvelteマイクロアプリ |
| `with-angular` | シェル内のAngularマイクロアプリ |
| `with-vanilla` | フレームワークを使わないマイクロアプリ |
| `with-multiple-frameworks` | 1つのページ上のReactとVueのマイクロアプリ |
| `with-react-router` | Reactアプリでの`@tuvix.js/router` |
| `with-react-event-bus` | `@tuvix.js/event-bus`でやり取りするアプリ |
| `with-react-sandbox` | `@tuvix.js/sandbox`によるCSS分離 |
| `with-react-devtools` | [`@tuvix.js/devtools`](/ja/packages/devtools)のオーバーレイ |
| `with-module-federation-react` | Reactリモートでの`@tuvix.js/module-federation` |
| `with-ssr-react` | Reactフラグメントを合成する`@tuvix.js/server` |
| `with-ssr-vanilla` | 素のHTMLフラグメントを合成する`@tuvix.js/server` |
| `with-ssr-islands` | [`@tuvix.js/vite`](/ja/packages/vite)を使った、複数フレームワークのサーバーレンダリングされたアイランド |

サンプルはモノレポ内にあるため、その`package.json`は`workspace:*`に依存しています。インストールコマンドを実行する前に、`workspace:*`と`workspace:^`をすべて`^0.5.0`に置き換えてください。そうしないと、パッケージマネージャーがサポートされていないプロトコルのエラーで停止します。

## パッケージマネージャーの検出

CLIは、どのように起動されたかに基づいて、インストールのステップと表示するコマンドに使うパッケージマネージャーを選びます。次の順に確認します。

1. `process.versions.bun`が設定されている：`bun`。
2. `npm_execpath`に`pnpm`または`yarn`が含まれる：そのマネージャー。
3. `npm_config_user_agent`が`pnpm`、`yarn`、`bun/`のいずれかで始まる：そのマネージャー。
4. それ以外：`npm`。

`pnpm create tuvix-app`と`pnpm dlx create-tuvix-app`はpnpmで、`yarn create`はyarnで、`npx`と`npm create`はnpmでインストールします。この選択を上書きするフラグはありません。

## インストールのステップ

テンプレートでの実行後、CLIはスピナー（`Installing dependencies with <pm>`）を表示しながら新しいフォルダーで`<pm> install`を実行します。パッケージマネージャーの出力は表示しません。

- 終了コード0：スピナーは`Dependencies installed`で終わり、CLIは`cd <name>`と`<pm> run dev`を表示します。
- 0以外の終了コード、またはバイナリが見つからない：スピナーは`Install failed. Run manually:`で終わり、その後に`cd <absolute path>`と`<pm> install`が続きます。プロジェクトのファイルは残り、CLIはそれでも終了コード0で終了します。

`--example`での実行ではインストールは行われません。

## エッジケース

- 既存のフォルダーがあると、`Directory "<name>" already exists.`と終了コード1で実行が停止します。CLIは既存のフォルダーに書き込んだり、マージしたりしません。
- `../app`のように、解決後のパスが現在のディレクトリで始まらない名前は、`Project directory must be within the current working directory.`で停止します。
- 不明な`--template`の値は、プロンプトの後に`Unknown template "<value>". Available: shell, react-app, vue-app, vanilla-app, svelte-app, angular-app`で失敗します。
- 値なしで最後の引数に置かれた`--template`や`--example`は、指定されなかったものとして扱われます：テンプレートのプロンプトが表示されるか、通常のテンプレートでの実行になります。
- CLIは、記述されたとおりのプロジェクト名をフォルダーと`package.json`の`name`の両方に使います。npmの命名規則はチェックしないため、`My App`は無効なパッケージ名になります。
- プロンプトをキャンセルする（Ctrl+C）と、`Operation cancelled.`を表示して終了コード0で終了します。
- `master`に存在しないサンプル名を指定すると、空のフォルダーが残り、`Example "<name>" was not found or failed to extract.`で失敗します。再試行する前にフォルダーを削除してください。
- CLIは1つのサンプルのためにリポジトリ全体のtarballをダウンロードします。接続が遅いと`--example`も遅くなります。

## しないこと

- マイクロアプリのテンプレートは自身をマウントしません。`src/main`はモジュールをエクスポートし、`index.html`のどこからも`mount`を呼び出さないため、シェルがエントリーをロードするまで`pnpm run dev`は空の`#app`を表示します。
- ライブラリモードのVite設定はありません。`vite build`はハッシュ付きファイル名を持つ通常のアプリビルドを生成し、シェルがロードするエントリーはあなたが選びます。
- モノレポ、ワークスペース、複数アプリの構成はありません。アプリごとにCLIを1回実行するか、`--example`から始めてください。
- git init、リンター、テストランナー、CSSの設定はありません。
- `--no-install`フラグもパッケージマネージャーのフラグもありません。
- プログラムから使うAPIはありません。パッケージをimportするとCLIが実行されます。

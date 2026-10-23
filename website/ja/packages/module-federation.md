---
title: '@tuvix.js/module-federation'
---

<PackageHeader
  name="@tuvix.js/module-federation"
  title="Module Federation"
  description="webpackのModule FederationのリモートをTuvix.jsのエントリーに変換します。remoteEntry.jsを読み込み、共有スコープを1回だけ初期化し、公開されたマイクロアプリを返します。"
  icon="🌐"
  npm="true"
/>

## インストール

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

このパッケージは`@tuvix.js/loader`に依存し、その`loadScript`を使います。

## 使いどころ

マイクロアプリがwebpackの`ModuleFederationPlugin`でビルドされ、それぞれが`remoteEntry.js`を公開している構成です。シェルが実行時にしかリモートのURLを知らない場合や、シェルが別のバンドラー（Vite、Rollup）でビルドされている場合、シェルは自分のwebpack設定にリモートを列挙できません。

`federatedEntry`は、オーケストレーターが登録できるエントリーを返します。最初のマウント時に`remoteEntry.js`を読み込み、共有スコープを渡してコンテナの`init`を呼び出し、`get('./App')`を呼び出して、公開されたモジュールをオーケストレーターに渡します。

シェルがwebpackでビルドされていて、ビルド時にリモートを列挙できる場合は、webpack自身の`remotes`オプションと`entry: () => import('dashboard/App')`を使えば、このパッケージなしで動作します。

## クイックスタート

リモートは、自身のエクスポートまたは`default`エクスポートがTuvix.jsのマイクロアプリであるモジュールを公開します：

```js
// dashboard/webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  output: { publicPath: 'auto' },
  devServer: { port: 3001, headers: { 'Access-Control-Allow-Origin': '*' } },
  plugins: [
    new ModuleFederationPlugin({
      name: 'dashboard',
      filename: 'remoteEntry.js',
      exposes: { './App': './src/App' },
    }),
  ],
};
```

```tsx
// dashboard/src/App.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard() {
  return <h2>Dashboard</h2>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

シェルはリモートをエントリーとして登録します：

```ts
// shell/src/main.ts
import { createOrchestrator } from '@tuvix.js/core';
import { federatedEntry } from '@tuvix.js/module-federation';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry({ name: 'dashboard', url: 'http://localhost:3001/remoteEntry.js' }, './App'),
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();
```

オーケストレーターのローダーは`signal`を付けてエントリーを呼び出すため、その`timeout`と`retries`オプションは`remoteEntry.js`にも適用されます。

## API

### `federatedEntry`

```ts no-check
function federatedEntry(remote: RemoteConfig, modulePath?: string, options?: FederatedEntryOptions): EntryLoader;
```

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `remote` | `RemoteConfig` | 必須 | リモート：`name`、`url`、および任意の`integrity`と`scope`（下の表）。 |
| `modulePath` | `string` | `'./App'` | リモートの`exposes`のキー。 |
| `options.shareScope` | `ShareScope` | webpackの`default`スコープ、なければページ全体で共有するオブジェクト | コンテナの`init`に渡す共有スコープ。 |

`orchestrator.register({ entry })`または`ModuleLoader.load(name, entry)`用の`EntryLoader`（`({ signal }) => Promise<MicroAppModule>`）を返します。呼び出しごとに専用の内部ローダーが作られますが、同じリモートに対する2つのエントリーは、1つの`remoteEntry.js`タグと1回の`init`呼び出しを共有します。

`RemoteConfig`：

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | リモート名。リモートの`ModuleFederationPlugin`設定の`name`です。 |
| `url` | `string` | 必須 | `remoteEntry.js`のURL。 |
| `integrity` | `string` | なし | `remoteEntry.js`のscriptタグに付けるSRIハッシュ。 |
| `scope` | `string` | `name` | `remoteEntry.js`が定義する`window`グローバルの名前。`name`と異なる場合に指定します。 |

### `createFederatedLoader`

```ts no-check
function createFederatedLoader(config: FederatedLoaderConfig): {
  createFederatedEntry(remoteName: string, modulePath?: string): EntryLoader;
  createFederatedApp(remoteName: string, modulePath?: string, signal?: AbortSignal): Promise<MicroAppModule>;
  loadModule(remoteName: string, modulePath: string, signal?: AbortSignal): Promise<unknown>;
  loadRemoteContainer(remote: RemoteConfig, signal?: AbortSignal): Promise<FederatedContainer>;
};
```

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `remotes` | `RemoteConfig[]` | 必須 | このローダーが読み込む可能性のあるすべてのリモート。 |
| `shareScope` | `ShareScope` | webpackの`default`スコープ、なければページ全体で共有するオブジェクト | 各コンテナの`init`に渡す共有スコープ。 |

複数のアプリがリモートのリストから提供される場合や、公開されたモジュールそのものが必要な場合に使います。

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader } from '@tuvix.js/module-federation';

const federation = createFederatedLoader({
  remotes: [
    { name: 'remote1', url: 'http://localhost:3001/remoteEntry.js' },
    { name: 'remote2', url: 'http://localhost:3002/remoteEntry.js' },
  ],
});

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'remote1',
  entry: federation.createFederatedEntry('remote1', './App'),
  container: '#remote1-container',
  activeWhen: '/',
});

orchestrator.register({
  name: 'remote2',
  entry: federation.createFederatedEntry('remote2', './App'),
  container: '#remote2-container',
  activeWhen: '/',
});

await orchestrator.start();
```

#### `createFederatedEntry(remoteName, modulePath = './App')`

`createFederatedApp(remoteName, modulePath, signal)`を呼び出す`EntryLoader`を返します。`remoteName`が`remotes`にない場合はその場で例外を投げるため、タイプミスは最初のマウント時ではなく`register`の時点で失敗します。

#### `createFederatedApp(remoteName, modulePath = './App', signal?)`

コンテナを読み込み、`get(modulePath)`を呼び出し、ファクトリーを実行してマイクロアプリを返します。公開されたモジュールが`mount`関数を持つ場合はそのモジュール自体を、そうでなく`default`エクスポートが`mount`関数を持つ場合はそのエクスポートを返します。どちらでもなければ`[Tuvix MF] Module "<modulePath>" from remote "<remoteName>" does not export mount/unmount.`を投げます。

#### `loadModule(remoteName, modulePath, signal?)`

共有コンポーネントライブラリや設定オブジェクトなど、任意の公開モジュールを返します。モジュールに`default`エクスポートがある場合、`loadModule`はそのエクスポートを返します。

```ts
import { createFederatedLoader } from '@tuvix.js/module-federation';

const federation = createFederatedLoader({
  remotes: [{ name: 'design', url: 'https://cdn.example.com/design/remoteEntry.js' }],
});

const tokens = (await federation.loadModule('design', './tokens')) as Record<string, string>;
document.documentElement.style.setProperty('--brand', tokens.brand ?? '#f05454');
```

#### `loadRemoteContainer(remote, signal?)`

（名前ではなく）`RemoteConfig`を受け取り、その`remoteEntry.js`をクラシックスクリプトとして読み込み、`window[remote.scope ?? remote.name]`からコンテナを読み取り、初期化して返します。ローダーはコンテナをリモート名でキャッシュします。

### 共有スコープ

`shareScope`を指定しない場合、パッケージは次の順序でスコープを選びます：

1. webpackがバンドルするシェルでは、`__webpack_init_sharing__('default')`を呼び出して`__webpack_share_scopes__.default`を渡します。これにより、リモートはホストが自身の`shared`設定で宣言した依存関係を共有します。
2. それ以外のシェルでは、ページ上のすべてのリモートが受け取る1つのプレーンなオブジェクトを渡します。リモート同士はこれを通じて依存関係を共有できますが、ホスト自身のコピーは関与しません。

自分で管理するスコープを使うには`shareScope`を渡します。

### 型

```ts
type ShareScope = Record<string, unknown>;

interface FederatedContainer {
  init(shareScope: ShareScope): void | Promise<void>;
  get(module: string): (() => unknown) | Promise<() => unknown>;
}
```

| 型 | 説明 |
| --- | --- |
| `ShareScope` | コンテナの`init`に渡すオブジェクト。 |
| `FederatedContainer` | `remoteEntry.js`が定義する`{ init, get }`グローバル。 |
| `RemoteConfig` | `{ name, url, integrity?, scope? }`。 |
| `FederatedLoaderConfig` | `createFederatedLoader`用の`{ remotes, shareScope? }`。 |
| `FederatedEntryOptions` | `federatedEntry`用の`{ shareScope? }`。 |

## エッジケース

- **初期化は1回だけ。** 複数のローダーやエントリーが同じコンテナオブジェクトを使う場合でも、パッケージはページごとに1回だけ初期化します。失敗した`init`は記録されないため、次の読み込みで再試行されます。
- **タイムアウトとリトライ。** オーケストレーターの`timeout`が発火すると、中断された`signal`が`remoteEntry.js`の待機を止め、他の読み込みがまだ待っていない限りそのタグを削除します。リトライでは新しいタグが追加されます。中断された読み込みは中断理由でrejectされます。その他の読み込み失敗は`[Tuvix MF] Failed to load remote entry: <url> (<error>)`となります。
- **グローバルが見つからない。** `remoteEntry.js`が読み込まれても`window[scope]`に`init`と`get`がない場合、読み込みは`[Tuvix MF] Remote container "<scope>" not found on window after loading <url>`で失敗します。`scope`がリモートの`name`（設定している場合は`library.name`）と一致しているか確認してください。
- **不明なモジュール。** `get`が例外を投げるか、ファクトリー以外を返した場合は`[Tuvix MF] Module "<modulePath>" not found in remote "<remoteName>"`になります。
- **不明なリモート。** `createFederatedEntry`、`createFederatedApp`、`loadModule`は`[Tuvix MF] Remote "<name>" is not configured. Available: <names>`を投げます。
- **CORS。** `remoteEntry.js`は`crossorigin="anonymous"`で読み込まれます。別オリジンのリモートは`Access-Control-Allow-Origin`を送信する必要があります。
- **アンロードと再マウント。** オーケストレーターのローダーは、ローダー関数のエントリーについては何も削除しません。次のマウントで再び`get(modulePath)`が呼ばれ、webpackはキャッシュ済みのモジュールを返します。
- **プリフェッチ。** `ModuleLoader.prefetch`はローダー関数のエントリーをスキップするため、オーケストレーターの`prefetch`設定で`remoteEntry.js`が事前にダウンロードされることはありません。

## 対象外のこと

- webpackは設定しません。各リモートが自分で`ModuleFederationPlugin`を追加します。
- コンテナは`window`から読み取ります。`library: { type: 'module' }`やその他のグローバルではないライブラリタイプでビルドされたリモートは動作しません。
- リモートのマニフェストを読み取ったり、リモートを検出したりはしません。各`remoteEntry.js`のURLを自分で列挙します。
- バージョンのネゴシエーションは行いません。それは各コンテナ内のwebpackランタイムが共有スコープを通じて行います。

## 0.4からの移行

- `federatedEntry(remote)`は`{ scripts: [remote.url] }`を返していたため、コンテナには`init`と`get`しかないことから、ローダーは「no exports found」で失敗していました。現在は公開モジュールのパスを受け取り、ローダー関数を返します：

  ```ts
  import { federatedEntry } from '@tuvix.js/module-federation';

  // 0.4: federatedEntry({ name: 'dashboard', url }) returned an EntryConfig
  const entry = federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }, './App');
  ```

- `createFederatedEntry(remoteName, modulePath)`は`EntryConfig`ではなく`EntryLoader`を返します。`createFederatedApp`でリモートを事前に読み込み、`entry: { scripts: [] }`を登録していたシェルは、エントリーとして`federation.createFederatedEntry('remote1', './App')`を渡せます。
- `FederatedLoaderConfig.shared`は`shareScope`に置き換えられました。パッケージが`shared`を読み取ることはありませんでした。
- `loadRemoteContainer`は`any`ではなく`FederatedContainer`を返します。
- 0.4では、パッケージはwebpackが定義しない`window.__webpack_share_scopes__`を読み取っていたため、各リモートは専用の空のスコープを受け取っていました。現在、webpackのホストは実際の`default`スコープを渡します。
- このページの0.4版では、引数なしの`createFederatedLoader()`と`loader.remote({ url, scope, module })`を紹介していました。どちらも存在しませんでした。

# @tuvix.js/module-federation

> webpack Module FederationのリモートをTuvix.jsのエントリーに変換します。remoteEntry.jsを読み込み、共有スコープを一度だけ初期化し、公開されたマイクロアプリを返します。

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。完全なドキュメント：[tuvix.js.org/packages/module-federation](https://tuvix.js.org/packages/module-federation)。

## インストール

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

## クイックスタート

リモートはマイクロアプリを公開します（そのexport、または`default` exportが`mount`と`unmount`を持ちます）。

```js
// dashboard/webpack.config.js
new ModuleFederationPlugin({
  name: 'dashboard',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/App' },
});
```

シェルがそれを登録します。

```ts
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

## API

### `federatedEntry`

```ts no-check
federatedEntry(remote: RemoteConfig, modulePath = './App', options?: { shareScope?: ShareScope }): EntryLoader;
```

`register({ entry })`または`ModuleLoader.load`用のローダー関数を返します。最初のマウント時に`remoteEntry.js`を読み込み、コンテナごとに一度だけ`init`を呼び出し、`get(modulePath)`を呼び出してマイクロアプリを返します。

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | リモートの`ModuleFederationPlugin`の`name`。 |
| `url` | `string` | 必須 | `remoteEntry.js`のURL。 |
| `integrity` | `string` | なし | scriptタグ用のSRIハッシュ。 |
| `scope` | `string` | `name` | リモートエントリーが定義する`window`のグローバル変数。 |

### `createFederatedLoader`

```ts no-check
createFederatedLoader({ remotes: RemoteConfig[], shareScope?: ShareScope });
```

戻り値：

| メソッド | 動作 |
| --- | --- |
| `createFederatedEntry(remoteName, modulePath = './App')` | オーケストレーター用の`EntryLoader`。未知のリモートに対しては即座に例外を投げます。 |
| `createFederatedApp(remoteName, modulePath = './App', signal?)` | 公開されたモジュール、またはその`default` exportから得た`Promise<MicroAppModule>`。 |
| `loadModule(remoteName, modulePath, signal?)` | 任意の公開モジュール。`default` exportがあればそれを返します。 |
| `loadRemoteContainer(remote, signal?)` | `RemoteConfig`からコンテナを読み込んで初期化し、`FederatedContainer`を返します。 |

```ts
import { createFederatedLoader } from '@tuvix.js/module-federation';
import { createOrchestrator } from '@tuvix.js/core';

const federation = createFederatedLoader({
  remotes: [
    { name: 'remote1', url: 'http://localhost:3001/remoteEntry.js' },
    { name: 'remote2', url: 'http://localhost:3002/remoteEntry.js' },
  ],
});

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'remote1', entry: federation.createFederatedEntry('remote1'), container: '#remote1', activeWhen: '/' });
orchestrator.register({ name: 'remote2', entry: federation.createFederatedEntry('remote2'), container: '#remote2', activeWhen: '/' });
await orchestrator.start();
```

### 共有スコープ

`shareScope`を指定しない場合、webpackでバンドルされたシェルは`__webpack_init_sharing__('default')`を呼び出し、`__webpack_share_scopes__.default`を渡します。それ以外のシェルは、ページ上のすべてのリモートが共有する1つのオブジェクトを渡します。

### 型

`ShareScope`（`Record<string, unknown>`）、`FederatedContainer`（`{ init, get }`）、`RemoteConfig`、`FederatedLoaderConfig`（`{ remotes, shareScope? }`）、`FederatedEntryOptions`（`{ shareScope? }`）。

## エッジケース

- オーケストレーターの`timeout`は`remoteEntry.js`の待機を中断し、タグを削除します。リトライ時には新しいタグが追加されます。
- 失敗した`init`は次の読み込み時に再試行されます。
- エラー：`[Tuvix MF] Remote "<name>" is not configured`、`Failed to load remote entry: <url>`、`Remote container "<scope>" not found on window`、`Module "<path>" not found in remote "<name>"`、`does not export mount/unmount`。
- `remoteEntry.js`は`crossorigin="anonymous"`で読み込まれます。別オリジンのリモートは`Access-Control-Allow-Origin`を送信する必要があります。
- `ModuleLoader.prefetch`はローダー関数をスキップするため、MFアプリはプリフェッチされません。

## 対象外の機能

- webpackの設定は行いません。
- コンテナは`window`から読み取ります。`library: { type: 'module' }`のリモートは動作しません。
- リモートの検出やマニフェストの読み取りは行いません。

## 0.4からの移行

- `federatedEntry(remote)`は`{ scripts: [url] }`を返しており、「no exports found」で失敗していました。現在は`modulePath`を受け取り、`EntryLoader`を返します。`createFederatedEntry`も`EntryLoader`を返します。
- `shared`は`shareScope`に置き換えられました。
- `loadRemoteContainer`は`any`ではなく`FederatedContainer`を返します。

## ライセンス

MIT

# @tuvix.js/devtools

> オーケストレーターの登録済みアプリとマウント済みアプリ、現在のルート、最近のイベントバスの通信を一覧表示する、ページ内デバッグオーバーレイ

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。

## インストール

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## クイックスタート

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/dashboard/*', app: 'dashboard' }] },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
await orchestrator.start();
```

右下隅に丸いボタンが表示されます。その上のパネルは1秒ごとに更新され、次の内容を表示します：

- **Apps**：登録済みのすべてのアプリ。ステータスが`mounted`なら緑の点、それ以外は白の点が付きます。
- **Route**：`orchestrator.getRouter()?.currentPath`。ルーターがない場合は`/`。
- **Events**：最新10件のバスイベント（時刻と名前）。新しい順です。

オーバーレイは`window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`も設定します。イベントのペイロードを読むには、コンソールで`__TUVIX_DEVTOOLS__.logger.getEntries()`を実行してください。

## API

### `installDevTools(orchestrator, options?): () => void`

`Orchestrator`のように、`getRegisteredApps()`、`getMountedApps()`、`getEventBus()`、`getRouter()`を持つ任意のオブジェクトを受け付けます。ポーリングを停止し、ロガーをデタッチし、パネルを削除し、グローバル変数を削除するクリーンアップ関数を返します。

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | ロガーが保持するイベントの最大数 |
| `autoOpen` | `boolean` | `true` | `false`ではパネルを非表示でマウントします。トグルボタンで開きます |
| `updateInterval` | `number` | `1000` | パネルの更新間隔（ミリ秒） |

### `EventLogger`

`new EventLogger(maxEntries = 200)`は、`onAny`を通じてバスのすべてのイベントを記録します。エントリーは`{ timestamp, event, data }`です。

| メソッド | 動作 |
| --- | --- |
| `attach(bus)` | すべてのイベントを購読します。破棄済みのバスではスローします。 |
| `detach()` | 購読を解除し、エントリーは保持します |
| `getEntries()` | ログ全体。古い順です |
| `getRecent(count = 20)` | 最後の`count`件のエントリー。古い順です |
| `clear()` | ログを空にします |

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);
bus.emit('cart:add', { sku: 'A-1' });
console.log(logger.getRecent(1)); // [{ timestamp, event: 'cart:add', data: { sku: 'A-1' } }]
```

### `DevToolsPanel`

ポーリングを含まないオーバーレイのDOMです。状態は自分で渡します。

| メソッド | 動作 |
| --- | --- |
| `mount()` | `#tuvix-devtools`を開いた状態で`document.body`に追加します。2回目の呼び出しでは何もしません。 |
| `unmount()` | パネルを削除します |
| `toggle()` | パネル本体を表示または非表示にします。ボタンは残ります |
| `update({ registeredApps, mountedApps, currentRoute, events })` | 3つのセクションを再レンダリングします |

### `DevToolsOptions`

上記の`installDevTools`のオプションの型です。

## エッジケース

- ロガーは`installDevTools`の後に発行されたイベントだけを受け取ります。パネルは最初の更新時（`updateInterval` ms後）に内容が表示されます。
- ブラウザー専用です。サーバーレンダリング中に`installDevTools`は`ReferenceError`をスローします。
- `mounting`または`error`のアプリは白の点で表示されます。パネルはステータス名を表示しません。
- デフォルトのグローバルバスでは、クリーンアップ関数を呼び出すまで、`orchestrator.destroy()`の後もロガーは記録を続けます。
- `installDevTools`を2回呼び出すと、同じ要素IDを持つオーバーレイが2つ作られ、2回目が`window.__TUVIX_DEVTOOLS__`を上書きします。

## 行わないこと

- キーボードショートカットはなく、位置、サイズ、テーマのオプションもありません。
- UIにはペイロード、エントリーURL、ローダーの状態、タイミングは表示されません。
- ブラウザー拡張機能やフレームワークのdevtoolsへのリンクはありません。
- 本番環境での自動除去はありません。クイックスタートのように、ビルド時のフラグでインポートを制御してください。

完全なドキュメント：[tuvix.js.org/packages/devtools](https://tuvix.js.org/packages/devtools)

## ライセンス

MIT

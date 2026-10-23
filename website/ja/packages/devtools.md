---
title: '@tuvix.js/devtools'
---

<PackageHeader
  name="@tuvix.js/devtools"
  title="DevTools"
  description="オーケストレーター向けのページ内デバッグオーバーレイです。登録済みおよびマウント済みのマイクロアプリ、現在のルート、最新のイベントバスのトラフィックを一覧表示します。"
  icon="🛠️"
  npm="true"
/>

## インストール

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## 使いどころ

オーケストレーターが把握しているマイクロアプリ、そのうち現在マウントされているもの、バスを流れるイベントを確認したいときに、開発環境でインストールします。オーバーレイはページの右下隅に表示され、1秒ごとに更新されます。

コンポーネントツリー、ネットワークのタイミング、イベントのペイロードをUIで確認したい場合は、ブラウザのDevToolsやフレームワークのdevtools拡張機能を使ってください。このパッケージが表示するのは、アプリ名、1つのルート文字列、タイムスタンプ付きのイベント名です。ペイロードはロガーに保持され、コンソールから読み取れます。

## クイックスタート

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
orchestrator.register({ name: 'settings', entry: '/apps/settings.js', container: '#main' });

await orchestrator.start();
```

`/dashboard`を開くと、オーバーレイには`dashboard`が緑の点で、`settings`が白の点で表示されます。Route行には`/dashboard`と表示され、Eventsリストにはdashboardのマウントに伴う`tuvix:app:status-change`と`tuvix:app:mount`のイベントが表示されます。

## パネルに表示される内容

`installDevTools`は`document.body`に`<div id="tuvix-devtools">`を1つ追加します。この要素には、丸いトグルボタン（右下隅から12pxの位置に固定、`z-index: 99999`）と、その上に幅280pxのパネルが含まれます。パネルには3つのセクションがあります。

| セクション | ソース | 内容 |
| --- | --- | --- |
| Apps | `orchestrator.getRegisteredApps()`と`getMountedApps()` | 登録済みアプリごとに1行。緑の点はステータスが`mounted`であることを示します。白の点は、`loading`や`error`を含むそれ以外のすべてのステータスを示します。 |
| Route | `orchestrator.getRouter()?.currentPath` | ルーターの現在のパス。`base`プレフィックスを含まず、クエリ文字列を含みます。オーケストレーターにルーターがない場合は`/`を表示します。 |
| Events | `orchestrator.getEventBus()`にアタッチされた`EventLogger` | 最新の10件のイベントを新しい順に表示します。各行にはローカル時刻、ダッシュ、イベント名が表示されます。 |

デフォルトではオーケストレーターは`getGlobalBus()`を使うため、Eventsリストにはオーケストレーター自身のイベントに加えて、マイクロアプリが共有バスに発行したイベントも表示されます。

| イベント | 発行されるタイミング |
| --- | --- |
| `tuvix:app:registered` | `register()`がアプリを追加したとき |
| `tuvix:app:bootstrap`, `tuvix:app:mount`, `tuvix:app:unmount` | アプリがそのライフサイクルのステップを通過したとき |
| `tuvix:app:error` | アプリの読み込み、ブートストラップ、マウントのいずれかが失敗したとき |
| `tuvix:app:status-change` | アプリのステータスが変わったとき。1回のマウントで複数回発生します。 |
| `tuvix:route:change` | ルーターがナビゲーションしたとき |
| `tuvix:started`, `tuvix:destroyed` | `start()`と`destroy()`が完了したとき |

パネルは`window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`も公開します。パネルに表示されないペイロードを読むには、ブラウザのコンソールで`__TUVIX_DEVTOOLS__.logger.getEntries()`を実行してください。

## API

### `installDevTools`

```ts
import type { DevToolsOptions } from '@tuvix.js/devtools';
import type { IEventBus } from '@tuvix.js/core';

declare function installDevTools(
  orchestrator: {
    getRegisteredApps(): string[];
    getMountedApps(): string[];
    getEventBus(): IEventBus;
    getRouter(): { currentPath: string } | null;
  },
  options?: DevToolsOptions
): () => void;
```

最初の引数には、これら4つのメソッドを持つ任意のオブジェクトを渡せます。`@tuvix.js/core`または`tuvix.js`の`Orchestrator`が該当します。

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | ロガーが保持するイベントの最大数。パネルが表示するのはそのうち10件で、残りは`__TUVIX_DEVTOOLS__.logger`から読み取れます。 |
| `autoOpen` | `boolean` | `true` | `false`の場合、パネルを非表示の状態でマウントします。トグルボタンは表示されたままで、それを押すとパネルが開きます。 |
| `updateInterval` | `number` | `1000` | パネルを更新する間隔（ミリ秒）。 |

呼び出しのたびに、次の処理を行います。

1. `DevToolsPanel`と`EventLogger(maxLogEntries)`を作成します。
2. `onAny`でロガーを`orchestrator.getEventBus()`にアタッチします。
3. パネルをマウントし、`autoOpen`が`false`の場合は非表示にします。
4. オーケストレーターを読み取って`panel.update()`を呼び出す`setInterval`を開始します。
5. `window.__TUVIX_DEVTOOLS__`を設定します。

インターバルをクリアし、ロガーをデタッチし、パネルを削除し、`window.__TUVIX_DEVTOOLS__`を削除するクリーンアップ関数を返します。

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { installDevTools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator();
const removeDevTools = installDevTools(orchestrator, {
  autoOpen: false,
  updateInterval: 250,
  maxLogEntries: 500,
});

// Later, for example in a hot-module-replacement dispose hook:
removeDevTools();
await orchestrator.destroy();
```

### `EventLogger`

```ts no-check
class EventLogger {
  constructor(maxEntries?: number); // default 200
  attach(bus: IEventBus): void;
  detach(): void;
  getEntries(): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>;
  getRecent(count?: number): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>; // default 20
  clear(): void;
}
```

`EventLogger`は`bus.onAny`を通じて、バス上のすべてのイベントを記録します。各エントリーは`timestamp`（emit時点の`Date.now()`）、`event`（イベント名）、`data`（emitされたままのペイロード。クローンはされません）を持ちます。ログが`maxEntries`を超えると、ロガーは最も古いエントリーを破棄します。

| メソッド | 動作 |
| --- | --- |
| `attach(bus)` | `bus`のすべてのイベントを購読します。バスが破棄済みの場合は例外を投げます。 |
| `detach()` | 購読を解除します。記録済みのエントリーは残ります。 |
| `getEntries()` | ログ全体を古い順に返します。 |
| `getRecent(count)` | 最後の`count`件のエントリーを古い順に返します。 |
| `clear()` | ログを空にし、購読は維持します。 |

パネルなしで使い、テストでバスのトラフィックを検証したり、ページのイベントをダンプしたりできます。

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);

bus.emit('cart:add', { sku: 'A-1' });

console.log(logger.getRecent(1)); // [{ timestamp: 1761..., event: 'cart:add', data: { sku: 'A-1' } }]
logger.detach();
```

### `DevToolsPanel`

```ts no-check
class DevToolsPanel {
  constructor();
  mount(): void;
  unmount(): void;
  toggle(): void;
  update(state: {
    registeredApps: string[];
    mountedApps: string[];
    currentRoute: string;
    events: Array<{ timestamp: number; event: string }>;
  }): void;
}
```

`DevToolsPanel`はオーバーレイのDOM部分で、ポーリングは行いません。表示したい状態を渡して`update()`を呼び出します。

| メソッド | 動作 |
| --- | --- |
| `mount()` | `#tuvix-devtools`を開いた状態で`document.body`に追加します。同じインスタンスで2回目に呼び出しても何もしません。 |
| `unmount()` | 要素を削除します。 |
| `toggle()` | パネル本体の表示と非表示を切り替えます。トグルボタンは残ります。`mount()`の前は何もしません。 |
| `update(state)` | Apps、Route、Eventsの各セクションを再構築します。`events`の最後の10件を新しい順に表示します。`mount()`の前は何もしません。 |

```ts
import { DevToolsPanel } from '@tuvix.js/devtools';

const panel = new DevToolsPanel();
panel.mount();
panel.update({
  registeredApps: ['header', 'cart'],
  mountedApps: ['header'],
  currentRoute: '/checkout',
  events: [{ timestamp: Date.now(), event: 'cart:open' }],
});
```

### 型

| 名前 | 説明 |
| --- | --- |
| `DevToolsOptions` | `installDevTools`のオプション：`maxLogEntries`、`autoOpen`、`updateInterval`。 |

オーケストレーターの形とログエントリーの形はエクスポートされていません。型として必要な場合は、`Parameters<typeof installDevTools>[0]`と`ReturnType<EventLogger['getEntries']>[number]`を使ってください。

## 本番ビルド

パッケージは`"sideEffects": false`を宣言していますが、コードから呼び出す静的な`import { installDevTools } from '@tuvix.js/devtools'`はバンドルに含まれます。クイックスタートのように、ビルド時のフラグで条件分岐し、動的な`import()`で読み込んでください。バンドラーは`process.env.NODE_ENV`を文字列に置き換え、到達しない分岐とそのチャンクを取り除きます。Viteアプリでは代わりに`import.meta.env.DEV`で判定できます。

本番環境でオーバーレイを有効のままにすると、3つのDOMセクションを毎秒再構築する`setInterval`、すべてのバスイベントの購読、そしてページ上の任意のスクリプトにオーケストレーターを渡してしまうグローバル変数というコストがかかります。

## エッジケース

- `register()`と`start()`の前にインストールしてください。ロガーが受け取るのは`attach`の後に発行されたイベントだけで、パネルは最初の更新（呼び出しから`updateInterval`ミリ秒後）まで空のままです。
- `installDevTools`には`document`と`window`が必要です。サーバーレンダリング中に呼び出すと`ReferenceError`を投げます。クライアント専用のコードから呼び出してください。
- `connectRouter()`を使い`router`オプションを指定しない場合、`getRouter()`は`null`を返し、Route行には`/`が表示されます。
- `getMountedApps()`が数えるのは`mounted`ステータスのみです。`mounting`や`error`のアプリには白の点が付き、パネルがステータス名を表示することはありません。
- プライベートなバス（`createOrchestrator({ eventBus: {...} })`）は`orchestrator.destroy()`で破棄されます。その後にインストールすると`onAny`から例外が投げられます。デフォルトのグローバルバスでは、クリーンアップ関数を呼び出すまで、ロガーは`destroy()`の後も記録を続けます。
- 呼び出すたびに新しいパネルが作成されます。2回呼び出すと同じ要素IDを持つ2つのオーバーレイがページに配置され、2回目の呼び出しが`window.__TUVIX_DEVTOOLS__`を上書きします。その後、1回目のクリーンアップ関数は2回目の呼び出しが設定したグローバルを削除します。
- 1つのインスタンスで`EventLogger.attach()`を2回呼び出すと、保存された購読解除関数が置き換えられます。その後の`detach()`は2つ目の購読しか解除しません。
- ログが`maxLogEntries`に達すると、ロガーは新しいイベントごとに配列をコピーします。イベントの多いバスを持つページでは、`maxLogEntries`を数百程度に抑えてください。
- パネルはアプリ名、ルート、イベント名を`textContent`で書き込むため、イベント名に含まれるマークアップはテキストとして表示されます。

## 対象外のこと

- キーボードショートカットはなく、位置、サイズ、テーマのオプションもありません。オーバーレイは常にインラインスタイルで右下に表示されます。
- イベントのペイロード、エントリーURL、ローダーのキャッシュ状態、マウントの所要時間はUIに表示されません。ペイロードは`__TUVIX_DEVTOOLS__.logger.getEntries()`から読み取ってください。
- ブラウザ拡張機能はなく、React、Vue、Svelte、Angularのdevtoolsとの連携もありません。
- タイムトラベルやイベントの再送はありません。ロガーは記録するだけで、再発行はしません。
- 本番ビルドで自動的に取り除かれることはありません。インポートの条件分岐は自分で行ってください。

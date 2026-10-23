# ライフサイクルフック

オーケストレーターは、登録された各アプリを決まった順序のフックとステータスに沿って進めます。このページでは、モジュールが実装するフック、シェルが読み取れるステータス、エラー時や素早いナビゲーション時の動作を説明します。アプリがページに表示されたタイミングを外部から知るには、[ライフサイクルイベント](/ja/guide/lifecycle-events)を使ってください。

## フックの順序

```text
register()
  └─ first activation: load entry → bootstrap() → mount()
       ├─ updateAppProps() while mounted → update()
       └─ deactivation → unmount()
  └─ next activation: mount()   (module cached, no bootstrap)
```

オーケストレーターは各フックを待機します。マウント中のアプリに対して`mount`を呼び出すことはなく、`mount`の実行中に`unmount`を呼び出すこともありません。アンマウントはマウントの完了を待ちます。

## bootstrap

読み込まれたモジュールごとに1回、エントリーの読み込み後、最初の`mount`の前に実行されます。設定の読み込みなど、再マウントをまたいで保持すべき処理に使います。

```ts
import { defineMicroApp } from '@tuvix.js/core';

let config: { apiUrl: string } | undefined;

export default defineMicroApp({
  name: 'reports',
  async bootstrap() {
    const response = await fetch('/reports/config.json');
    config = (await response.json()) as { apiUrl: string };
  },
  mount({ container }) {
    container.textContent = `API: ${config?.apiUrl ?? 'unknown'}`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

`bootstrap`がエラーをスローすると、アプリは`error`ステータスになり、マウントは失敗します。次のマウント試行では`bootstrap`が再度呼び出されます。一度成功すると、以降の再マウントではスキップされます。

## mount

アプリがアクティブになるたび、または`mountApp(name)`を呼び出したときに実行されます。コンテキストには次のものが含まれます：

| フィールド | 値 |
| --- | --- |
| `container` | レンダリング先の要素。`sandbox: true`のアプリでは、Shadow Root内の要素です。 |
| `props` | 登録済みのプロパティに、すべての`updateAppProps`呼び出しをマージしたもの。 |
| `name` | 登録されたアプリ名。 |
| `bus` | オーケストレーターのイベントバス。 |

`mountApp(name)`は`mount`の完了後に解決し、読み込みまたはマウントのエラーでリジェクトします。

## update

アプリがマウントされている間にシェルが`updateAppProps(name, props)`を呼び出したときに実行されます：

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('reports', { range: '7d' });
```

コンテキストには、マージ後の`props`と`container`が含まれます。`update`がない場合やアプリがマウントされていない場合、オーケストレーターはプロパティを保存し、次の`mount`に渡します。プロパティが変わったことを理由にアプリを再マウントすることはありません。

`updateAppProps`は保留中のマウントを先に待つため、更新は新しいインスタンスに届きます。更新中に届いた`unmount`は、更新の完了を待ちます。

## unmount

アプリが非アクティブになったとき、および`unmountApp(name)`、`unregister(name)`、`destroy()`の呼び出し時に実行されます。フレームワークのルート、リスナー、タイマー、バスのサブスクリプションなど、`mount`が作成したものをすべて削除してください。

`unmount`の後、オーケストレーターはアプリのエントリーのスタイルシートを`document.head`から削除します。次のマウントでそれらを再度追加し、読み込みを待ちます。

## アプリのステータス

```ts
import { createOrchestrator, type AppStatus } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
const status: AppStatus | null = orchestrator.getAppStatus('reports');
// 'registered' | 'bootstrapping' | 'bootstrapped' | 'mounting' | 'mounted'
// | 'updating' | 'unmounting' | 'unmounted' | 'error' | null (not registered)
```

| メソッド | 戻り値 |
| --- | --- |
| `getAppStatus(name)` | ステータス。不明な名前の場合は`null`。 |
| `getMountedApps()` | ステータスが`mounted`の名前。 |
| `getRegisteredApps()` | 登録済みのすべての名前。 |

## エラーとフォールバック

読み込み、`bootstrap`、`mount`のいずれかが失敗すると、オーケストレーターは次の処理を行います：

1. `fallback`を設定している場合、アプリの`fallback`のHTMLをコンテナに書き込みます。
2. ステータスを`error`に設定します。
3. バス上で`{ name, error, phase }`とともに`OrchestratorEvent.APP_ERROR`（`tuvix:app:error`）を発行します。
4. `onError(error, name)`を呼び出します。
5. `mountApp`をリジェクトします。ルート変更中のマウント失敗は、代わりに`console.error`でログに記録され、他のアプリは引き続きマウントされます。

`update`または`unmount`が失敗した場合は、手順2から4を実行し、`updateAppProps`または`unmountApp`をリジェクトします。フォールバックのHTMLは書き込みません。`phase`は`'load'`（コンテナの解決を含む）、`'bootstrap'`、`'mount'`、`'update'`、`'unmount'`のいずれかです。

```ts
import { createOrchestrator, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.getEventBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, phase, error }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

`error`ステータスのアプリをアクティブにする次のルート変更で、そのアプリのマウントが再試行されます。

## 素早いナビゲーション

ルート変更は一度に1つずつリコンサイルされます。非アクティブなアプリはアクティブなアプリのマウント前にアンマウントされます。アプリのマウントより速くパスが届いた場合：

- 次に実行されるのは、キューにある最新のパスのみです。
- エントリーの読み込み中に非アクティブになったアプリは、マウントをスキップします。
- `mount`の実行中に非アクティブになったアプリは、`mount`の完了後にアンマウントされます。

そのため、A → B → Aと素早く続けて移動すると、最終的にマウントされているのはAだけになり、別のアプリがまだ保持しているコンテナにアプリがレンダリングすることはありません。

## シェルレベルのフック

```ts
import { createOrchestrator, OrchestratorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  onError: (error, name) => console.error(`[${name}]`, error),
  onStatusChange: (name, status) => console.debug(`[${name}] ${status}`),
});

const bus = orchestrator.getEventBus();
bus.on<{ name: string }>(OrchestratorEvent.APP_MOUNT, ({ name }) => {
  console.log('mounted', name);
});
bus.on<{ name: string }>(OrchestratorEvent.APP_UNMOUNT, ({ name }) => {
  console.log('unmounted', name);
});
bus.on<{ to: string }>(OrchestratorEvent.ROUTE_CHANGE, ({ to }) => {
  console.log('route', to);
});
```

| イベント | ペイロード | 発行タイミング |
| --- | --- | --- |
| `tuvix:app:registered` | `{ name }` | `register()` |
| `tuvix:app:bootstrap` | `{ name }` | `bootstrap`の後 |
| `tuvix:app:mount` | `{ name }` | `mount`の後 |
| `tuvix:app:unmount` | `{ name }` | `unmount`の後 |
| `tuvix:app:error` | `{ name, error, phase }` | 読み込み、ブートストラップ、マウント、更新、アンマウントのいずれかが失敗したとき |
| `tuvix:app:status-change` | `{ name, status }` | ステータスが変わるたび |
| `tuvix:route:change` | `{ from, to, fromRoute, toRoute }` | 組み込みのルーターによるナビゲーションのみ |
| `tuvix:started` | `{}` | `start()`の終了時 |
| `tuvix:destroyed` | `{}` | `destroy()`の終了時 |

これらのバスイベントはオーケストレーターから発行されます。[ライフサイクルイベント](/ja/guide/lifecycle-events)の`tuvix:mounted`などのDOMイベントはアダプターと`defineMicroApp`から発行され、オーケストレーターなしでマウントされたアイランドでも発生します。

## 破棄

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.destroy();
```

`destroy()`は実行中のリコンサイルを待ち、すべてのアプリをアンマウントし、ルーター、`connectRouter`のサブスクリプション、プリフェッチ、ビューポートオブザーバーを停止し、ローダーのキャッシュをクリアします。プライベートなイベントバスは破棄し、グローバルバスは残します。2回呼び出しても安全です。呼び出し後は、`register`、`start`、`mountApp`、`unmountApp`、`unregister`、`reconcile`、`connectRouter`がエラーをスローします。代わりに新しいオーケストレーターを作成してください。

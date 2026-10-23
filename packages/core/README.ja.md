# @tuvix.js/core

> マイクロアプリを読み込み、URLの変化に応じてマウントまたはアンマウントするオーケストレーターです。

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。

完全なドキュメント：[tuvix.js.org/packages/core](https://tuvix.js.org/packages/core)

## インストール

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

`@tuvix.js/router`、`@tuvix.js/event-bus`、`@tuvix.js/loader`、`@tuvix.js/sandbox`に依存します。

## クイックスタート

シェル：

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/settings/*', app: 'settings' }] },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

orchestrator.register({
  name: 'settings',
  entry: { scripts: ['/settings/main.js'], styles: ['/settings/main.css'] },
  container: '#main',
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

リモートアプリ（`dashboard/main.js`）：

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## アプリがアクティブになる条件

- `activeWhen: '/path'`：`@tuvix.js/router`の`matchPath`で照合します。クエリとハッシュは無視されます。`'/dashboard'`と`'/dashboard/*'`は`/dashboard`とそのすべてのサブパスに一致します（`/dashboards`には一致しません）。`:id`は1つのセグメントに一致し、`'/'`はすべてのパスに一致します。
- `activeWhen: (path) => boolean`：関数が判定します。
- `activeWhen`がなく、`router.routes`で名前が指定されている場合：`app: name`を持つルートが完全一致している間アクティブです。`'/'`のルートはホームページのみを意味し、`'/*'`はすべてのパスを意味します。
- どちらもない場合：`mountApp` / `unmountApp`を自分で呼び出します。調整（reconcile）はそのアプリに触れません。
- `mountWhenVisible: true`：コンテナーが10 %表示された時点でマウントします。`activeWhen`は無視されます。

現在のパスは`connectRouter`の`getPath()`から取得し、なければ組み込みルーター、それもなければ`window.location.pathname`から取得します。調整は1つずつ実行されます。まず非アクティブなアプリをアンマウントし、次にアクティブなアプリをマウントします。キューに入ったナビゲーションは最新のパスにまとめられます。読み込み中に非アクティブになったアプリはマウントをスキップします。マウント途中で非アクティブになったアプリは、マウントが完了した時点でアンマウントされます。

## API

### `createOrchestrator(config?)` / `new Orchestrator(config?)`

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | なし | 組み込みルーター：`mode`（デフォルトの`'history'`または`'hash'`）、`base`、`routes`（必須）。 |
| `eventBus` | `EventBusOptions` | なし | プライベートバスのオプション。省略した場合、オーケストレーターは`getGlobalBus()`を使います。 |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | `globals`とともにモジュールローダーに渡されます。 |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | `immediate`は`start()`時、`idle`は最初のアイドル期間、`hover`はアプリをアクティブにする同一オリジンのリンクがポインターまたはフォーカスを受けたときに実行します。 |
| `onError` | `(error: Error, appName: string) => void` | なし | 読み込み、ブートストラップ、マウント、更新、アンマウントの失敗。 |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | なし | すべてのステータス変化。 |

### `Orchestrator`のメソッド

| メソッド | 動作 |
| --- | --- |
| `register(appConfig: MicroAppConfig): void` | 設定を保存します。読み込み、マウント、調整は行いません。 |
| `unregister(name): Promise<void>` | アンマウントし、エントリーのタグとキャッシュされたモジュールを削除して、アプリの登録を破棄します。 |
| `start(): Promise<void>` | ルーターに追従し、調整を行い、プリフェッチとビューポートの監視を開始します。`STARTED`を発行します。 |
| `mountApp(name): Promise<void>` | 進行中のアンマウントを待ってからマウントします。失敗時は`fallback`をレンダリングした後、そのエラーでrejectします。 |
| `unmountApp(name): Promise<void>` | 進行中の読み込みまたはマウントを待ってからアンマウントします。 |
| `updateAppProps(name, props): Promise<void>` | propsをシャローマージします。マウント済みのアプリでは`update({ props, container })`を呼び出し、それ以外では次回のマウントのために保存します。 |
| `reconcile(path?): Promise<void>` | `path`または現在のパスに対する調整をキューに入れます。 |
| `connectRouter({ subscribe, getPath }): () => void` | 外部ルーターに追従します。`disconnect`を返します。 |
| `navigateTo(path): Promise<void>` | 組み込みルーターで`push(path)`を実行します。ルーターがない場合は`[Tuvix] No router configured.`をスローします。 |
| `getAppStatus(name): AppStatus \| null` | ステータス。未知の名前では`null`。 |
| `getRegisteredApps(): string[]` | 登録済みの名前。 |
| `getMountedApps(): string[]` | ステータスが`'mounted'`の名前。 |
| `getEventBus(): IEventBus` | `getGlobalBus()`またはプライベートバス。 |
| `getRouter(): IRouter \| null` | 組み込みルーターまたは`null`。 |
| `destroy(): Promise<void>` | 実行中の調整を待ち、すべてのアプリをアンマウントし、リッスンを停止して`DESTROYED`を発行します。グローバルバスは破棄しません。 |

`register`のオプション：

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | 一意な名前。リモートは同じ名前で登録します。 |
| `entry` | `Entry` | 必須 | URL、`{ scripts, styles?, type?, integrity? }`、または`() => import('./app')`。 |
| `container` | `string \| HTMLElement` | 必須 | セレクター（マウントのたびに解決）または要素。 |
| `activeWhen` | `string \| ((path: string) => boolean)` | なし | アクティベーションのルール。 |
| `props` | `Record<string, unknown>` | なし | `mount()`に渡されます。 |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | Shadow Root内にレンダリングし、エントリーの`styles`をそこに読み込みます。 |
| `fallback` | `string` | なし | 読み込み、ブートストラップ、マウントの失敗時に`innerHTML`で設定されるHTML。 |
| `mountWhenVisible` | `boolean` | `false` | ビューポートで10 %表示されたときにマウントします。 |

TanStack Routerでの`connectRouter`：

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
// later: disconnect();
```

### `defineMicroApp(definition): MicroAppModule`

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | 登録名と一致させる必要があります。 |
| `bootstrap` | `() => void \| Promise<void>` | なし | 最初のマウントの前に実行されます。失敗したブートストラップは次回のマウントで再実行され、成功したものは1回だけ実行されます。 |
| `mount` | `(context: MountContext) => void \| Promise<void>` | 必須 | `container`、`props`、`name`、`bus`を受け取ります。 |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | 必須 | `container`を受け取ります。 |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | なし | `props`と`container`を受け取ります。 |
| `ssr` | `boolean` | `false` | `mount`がサーバーのマークアップを引き継ぎます。コンテナーにマークアップがあった場合、`mounted`イベントは`hydrated: true`を報告します。 |

`@tuvix.js/loader`の`registerModule`でモジュールを公開し、それを返します。このモジュールは`tuvix:mounted`、`tuvix:unmounted`、`tuvix:error`のDOMイベント（`document`までバブリング）をディスパッチするため、`whenMounted`、`isMounted`、`onLifecycle`が機能します。同じコンテナーで`mount`の実行中に`unmount`が呼ばれると、`mount`の完了を待ちます。`name`、`mount`、`unmount`のいずれかが欠けているとスローします。

### `OrchestratorEvent`

オーケストレーターのバス上のイベント：`APP_REGISTERED`（`tuvix:app:registered`）、`APP_BOOTSTRAP`、`APP_MOUNT`、`APP_UNMOUNT`、`APP_ERROR`（`AppErrorEvent`：`'load'`、`'bootstrap'`、`'mount'`、`'update'`、`'unmount'`の失敗に対する`{ name, error, phase }`）、`APP_STATUS_CHANGE`（`{ name, status }`）、`ROUTE_CHANGE`（組み込みルーターのみ）、`STARTED`、`DESTROYED`。

```ts
import { getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

### CSS分離

`sandbox: true`または`{ css: true }`は、コンテナーにopenなShadow Rootをアタッチし（再マウント時は再利用）、その中の`<div data-tuvix-sandbox-root>`にアプリをマウントして、エントリーの`styles`をそこに読み込みます。マウントは`loader.timeout`を上限としてスタイルシートを待ちます。JavaScriptはサンドボックス化されません。`@tuvix.js/sandbox`の`JsSandbox`は独立したユーティリティです。

### 型

`OrchestratorConfig`、`MicroAppConfig`、`MicroAppDefinition`、`AppSandboxOption`、`RouterSource`、`AppErrorEvent`、`AppErrorPhase`、`AppStatus`（`registered`、`bootstrapping`、`bootstrapped`、`mounting`、`mounted`、`updating`、`unmounting`、`unmounted`、`error`）、`RegisteredApp`（レコードの形。これを返すメソッドはありません）。

### 再エクスポート

- `@tuvix.js/event-bus`から：`createEventBus`、`getGlobalBus`、型`IEventBus`、`EventHandler`、`Unsubscribe`。
- `@tuvix.js/router`から：`createRouter`、`matchPath`、`interceptLinks`、型`RouterConfig`、`IRouter`、`RouteConfig`、`PathMatch`、`InterceptLinksOptions`。
- `@tuvix.js/loader`から：`createLoader`、型`Entry`、`MicroAppModule`。

## エッジケース

- `start()`の後に`register()`すると、ルート管理のアプリが現在のパスに対して調整されるため、アクティブであればすぐにマウントされます。`start()`の後に登録された`mountWhenVisible`のアプリはすぐに監視されます。その時点でDOMに存在しないコンテナーは監視されません。
- 調整の失敗で`start()`や`reconcile()`がrejectされることはありません。失敗は`onError`とコンソールに送られます。`mountApp`はrejectします。
- `error`状態のアプリは、そのアプリをアクティブにしようとする次の調整でリトライされます。`fallback`は読み込み、ブートストラップ、マウントの失敗時にのみレンダリングされます。
- アンマウントはエントリーのスタイルシートを`document.head`から削除します。次回のマウントで再追加されます。
- 2つのオーケストレーターは`getGlobalBus()`を共有します。プライベートバスにするには`eventBus: {}`を渡します。
- `destroy()`の後、状態を変更するメソッドは`[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`をスローします。

## 行わないこと

- JavaScriptのサンドボックス化。
- リンククリックのインターセプト（`interceptLinks`を使ってください）。
- サーバーでのレンダリング（`@tuvix.js/server`を使ってください）。
- アプリ間での依存関係の共有（`@tuvix.js/module-federation`またはimport mapsを使ってください）。
- 手書きのモジュールに対する`tuvix:mounted` DOMイベントの発行。これは`defineMicroApp`とフレームワークアダプターが行います。

## 0.4からの移行

- オーケストレーターは、`eventBus`を渡さない限り`getGlobalBus()`を使います。`destroy()`はグローバルバスを破棄しません。
- 調整は、手動でマウントしたアプリや`mountWhenVisible`のアプリをアンマウントしなくなりました。
- `sandbox: true`はShadow Root内にレンダリングします。
- `prefetch: 'hover'`は、ホバーまたはフォーカスされたリンクがアクティブにするアプリだけをプリフェッチします。
- `activeWhen`は`matchPath`を使います。クエリとハッシュは無視され、`:param`が使え、`.`と`(`は文字どおりに一致します。
- `OrchestratorConfig.shared`は削除されました（一度も読み取られていませんでした）。`@tuvix.js/module-federation`またはimport mapsを使ってください。
- ルーターの`routes`は完全一致します。`'/'`のルートはホームページのみです。すべてのパスには`'/*'`を使ってください。`RouteConfig.exact`は削除されました。
- `APP_ERROR`は`phase`を持ち、更新とアンマウントの失敗でも発火します。
- 外部ルーター向けの`setTimeout` + `reconcile()`によるブリッジは、`connectRouter({ subscribe, getPath })`に置き換わりました。

## ライセンス

MIT

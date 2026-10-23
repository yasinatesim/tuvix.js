---
title: '@tuvix.js/core'
---

<PackageHeader
  name="@tuvix.js/core"
  title="コアオーケストレーター"
  description="マイクロアプリを登録し、そのエントリーを読み込み、URLの変化に合わせてマウントまたはアンマウントします。組み込みルーターまたは外部ルーターに従い、指定に応じてアプリのCSSをShadow Rootに隔離し、ライフサイクルイベントを共有イベントバスで通知します。"
  icon="⚙️"
  npm="true"
/>

## インストール

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

`@tuvix.js/core`は`@tuvix.js/router`、`@tuvix.js/event-bus`、`@tuvix.js/loader`、`@tuvix.js/sandbox`に依存します。パッケージマネージャーがこれらも一緒にインストールします。

## 使いどころ

個別にビルドされた複数のアプリが1つのページを共有し、どのアプリを表示するかをURLで決める場合に、ホストページ（シェル）でオーケストレーターを使います。各アプリを、エントリーURL、コンテナ、担当するパスとともに一度だけ登録します。オーケストレーターは初回使用時にエントリーを読み込み、アプリの`bootstrap`、`mount`、`unmount`を呼び出し、ナビゲーションのたびにページを同期させます。

次の場合は別の手段を選んでください。

- ページごとにフレームワークのアイランドを1つ描画し、表示内容をすでにサーバーが決めている場合。アダプター（`@tuvix.js/react`、`@tuvix.js/vue`、`@tuvix.js/svelte`、`@tuvix.js/angular`）と[`@tuvix.js/vite`](/ja/packages/vite)は、オーケストレーターなしでアイランドをマウントします。
- リモートスクリプトを読み込み、そのライフサイクルを自分で呼び出すだけの場合。[`@tuvix.js/loader`](/ja/packages/loader)を使います。
- すべてを1つのimportで使いたい場合。このパッケージを再エクスポートする統合パッケージ[`tuvix.js`](/ja/packages/tuvix)をインストールします。

## クイックスタート

次のシェルは、`#main`を共有する2つのアプリを登録し、組み込みルーターでブラウザのURLに従い、同一オリジンのリンククリックをルーターのナビゲーションに変換します。

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/settings/*', app: 'settings' }],
  },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

// Active on /dashboard and every path below it.
orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

// No activeWhen: the router route above activates it on /settings/*.
orchestrator.register({
  name: 'settings',
  entry: {
    scripts: ['https://cdn.example.com/settings/main.js'],
    styles: ['https://cdn.example.com/settings/main.css'],
  },
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

各リモートは、シェルが登録した名前でライフサイクルを公開します。素のDOMコードでは`defineMicroApp`がこれを行い、React、Vue、Svelte、Angularのコンポーネントではフレームワークアダプターが行います。

```ts
// dashboard/main.ts, built to https://cdn.example.com/dashboard/main.js
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props, bus }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
    bus?.emit('dashboard:ready', { at: Date.now() });
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## アプリがアクティブになる条件 {#how-apps-become-active}

登録されたアプリは、5つのアクティベーションルールのいずれかに従います。オーケストレーターはアプリの設定からルールを選びます。

| 設定 | アプリがアクティブになるとき | アンマウントするのは |
| --- | --- | --- |
| `activeWhen: '/path'` | `matchPath('/path', currentPath).matched`が`true` | パスが一致しなくなった次のリコンサイル |
| `activeWhen: (path) => boolean` | 関数が`true`を返す | 関数が`false`を返す次のリコンサイル |
| `activeWhen`なし、`router.routes`で名前を指定 | `app: name`を持つルートがパス全体に一致する | そのルートが一致しなくなった次のリコンサイル |
| `activeWhen`なし、ルートなし | 自動ではアクティブにならない | `mountApp` / `unmountApp`を使う開発者 |
| `mountWhenVisible: true` | コンテナの10 %以上がビューポート内に入る | 開発者。リコンサイルはこのアプリをスキップし、`activeWhen`は無視されます |

`activeWhen`の文字列は`@tuvix.js/router`の[`matchPath`](/ja/packages/router)で評価されます。ルーターと`@tuvix.js/server`が使うものと同じマッチャーです。

- `?query`と`#hash`は無視されるため、`/dashboard?tab=2`でもダッシュボードはマウントされたままです。
- 通常のパターンは、セグメント境界でサブパスにも一致します。`'/dashboard'`は`/dashboard`と`/dashboard/stats`に一致し、`/dashboards`には一致しません。
- `'/dashboard/*'`は`'/dashboard'`と同じパスに一致します。
- `:name`は1つのセグメントに一致します。`'/users/:id'`は`/users/42`に一致します。
- `'/'`はすべてのパスに一致します。
- `.`や`(`などのその他の文字は、文字どおりに一致します。

ルーターの`routes`は完全一致を使います。`{ path: '/settings' }`は`/settings`にのみ一致します。サブパスを含めるには`'/settings/*'`と書きます。`'/'`ルートはホームページでのみアクティブになり、`'/*'`はすべてのパスでアクティブになります。ここでもクエリ文字列とハッシュは無視されます。

### 現在のパスの取得元

オーケストレーターは、最初に存在するソースからパスを読み取ります。

1. `connectRouter`に渡したルーター（その`getPath()`）。
2. `config.router`から作られた組み込みルーター（その`currentPath`）。
3. `window.location.pathname`。

`config.router`または`connectRouter`がある場合、ナビゲーションのたびにリコンサイルが実行されます。どちらもない場合、`start()`は`window.location.pathname`に対して一度だけリコンサイルし、`reconcile()`を呼び出すまで以降のナビゲーションには反応しません。

### リコンサイルは1つずつ実行される {#reconciles-run-one-at-a-time}

リコンサイルは、ルートで管理される各アプリをパスと比較し、DOMを一致させます。

1. 非アクティブになるべきアプリが先にすべて並列でアンマウントされます。そのため、コンテナを共有する2つのアプリが重なることはありません。
2. 次に、アクティブになるべきアプリが並列で読み込まれ（初回のみ）、ブートストラップされ（`bootstrap`の呼び出しが一度成功するまで）、マウントされます。

リコンサイル中にナビゲーションが発生すると、オーケストレーターはそれをキューに入れます。3つのナビゲーションがキューに溜まった場合、次に実行されるのは最新のパスだけで、すべての呼び出し元のPromiseはキューが空になった時点で解決されます。エントリーの読み込み中に非アクティブになったアプリはマウントをスキップします。`mount()`の途中で非アクティブになったアプリは、そのマウントが完了した直後にアンマウントされます。`/a` → `/b` → `/a`と素早く移動すると、マウントされたまま残るのは`a`だけです。

## API

### `createOrchestrator`

```ts no-check
function createOrchestrator(config?: OrchestratorConfig): Orchestrator;
```

`Orchestrator`を作成します。`new Orchestrator(config)`と同じです。

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | なし | `@tuvix.js/router`の組み込みルーターを、`mode`（`'history'`または`'hash'`、デフォルトは`'history'`）、`base`、`routes`（必須、`[]`も可）で作成します。`navigateTo`と`ROUTE_CHANGE`イベントに必要です。 |
| `eventBus` | `EventBusOptions` | なし | 専用バスのオプション（`maxListeners`、`debug`、`logger`）。省略すると、オーケストレーターはページ上のすべてのアプリが共有するバスである`getGlobalBus()`を使います。 |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | 内部の`ModuleLoader`に渡されます。`timeout`は試行ごとのミリ秒です（`0`で無効）。`globals`はエントリーのスクリプトが実行される前に`window`へ書き込まれます。 |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | 必要になる前にエントリーをダウンロードするタイミング。下記を参照してください。 |
| `onError` | `(error: Error, appName: string) => void` | なし | アプリの読み込み、ブートストラップ、マウント、更新、アンマウントが失敗したときに呼び出されます。`OrchestratorEvent.APP_ERROR`は同じ失敗をフェーズ付きで通知します。 |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | なし | すべてのアプリのステータスが変わるたびに呼び出されます。 |

プリフェッチ戦略は、スクリプトとスタイルのURLを`<link rel="prefetch">`または`<link rel="modulepreload">`で、実行せずにダウンロードします。ローダー関数のエントリーはスキップされます。関数を呼び出すとモジュールが実行されてしまうためです。

- `'immediate'`：`start()`の実行中に、登録済みのすべてのアプリ。
- `'idle'`：`start()`後の最初の`requestIdleCallback`で、登録済みのすべてのアプリ（このAPIがない環境では200 msの`setTimeout`）。
- `'hover'`：ポインターが同一オリジンのリンクに入るか、リンクにフォーカスが移ると、オーケストレーターはそのリンクのパスでアクティブになるアプリをプリフェッチします。各アプリのプリフェッチは一度だけです。hashモードと`router.base`も考慮されます。

`destroy()`は保留中のidleおよびhoverのプリフェッチをキャンセルします。

### `Orchestrator`

```ts no-check
class Orchestrator {
  constructor(config?: OrchestratorConfig);
  register(appConfig: MicroAppConfig): void;
  unregister(name: string): Promise<void>;
  start(): Promise<void>;
  mountApp(name: string): Promise<void>;
  unmountApp(name: string): Promise<void>;
  updateAppProps(name: string, props: Record<string, unknown>): Promise<void>;
  reconcile(path?: string): Promise<void>;
  connectRouter(source: RouterSource): () => void;
  navigateTo(path: string): Promise<void>;
  getAppStatus(name: string): AppStatus | null;
  getRegisteredApps(): string[];
  getMountedApps(): string[];
  getEventBus(): IEventBus;
  getRouter(): IRouter | null;
  destroy(): Promise<void>;
}
```

#### `register(appConfig)`

アプリの設定を保存します。読み込み、マウント、リコンサイルは行いません。それらは`start()`と以降のナビゲーションが行います。

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | 一意のアプリ名。リモートモジュールは同じ名前で登録する（`defineMicroApp({ name })`またはアダプターの`name`）か、`mount`関数を持つ新しい`window`グローバルを1つ公開する必要があります。 |
| `entry` | `Entry` | 必須 | スクリプトURL、`EntryConfig`（`{ scripts, styles?, type?, integrity? }`）、または`() => import('./dashboard')`のようなローダー関数。[`@tuvix.js/loader`](/ja/packages/loader)を参照してください。 |
| `container` | `string \| HTMLElement` | 必須 | CSSセレクターまたは要素。セレクターはマウントのたびに`document.querySelector`で解決されます。 |
| `activeWhen` | `string \| ((path: string) => boolean)` | なし | アクティベーションルール。[アプリがアクティブになる条件](#how-apps-become-active)を参照してください。 |
| `props` | `Record<string, unknown>` | なし | `mount()`に渡されます。`updateAppProps`はここにマージします。 |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | `true`または`{ css: true }`を指定すると、アプリはコンテナ上のShadow Root内に描画されます。[CSSの隔離](#css-isolation)を参照してください。 |
| `fallback` | `string` | なし | 読み込み、ブートストラップ、マウントが失敗したときに`innerHTML`でコンテナへ書き込まれるHTML。更新とアンマウントの失敗ではコンテナに手を加えません。 |
| `mountWhenVisible` | `boolean` | `false` | `IntersectionObserver`を使い、コンテナが10 %見えた時点でマウントします。リコンサイルはこのアプリとその`activeWhen`を無視します。 |

`[Tuvix] App name is required.`、`[Tuvix] App "<name>" is already registered.`、`[Tuvix] App "<name>" requires an entry.`、または`[Tuvix] App "<name>" requires a container.`をスローします。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile'),
  container: '#main',
  activeWhen: '/users/:id',
  fallback: '<p>The profile is unavailable.</p>',
});

orchestrator.register({
  name: 'comments',
  entry: 'https://cdn.example.com/comments/main.js',
  container: '#comments',
  mountWhenVisible: true,
});

await orchestrator.start();
```

#### `start()`

組み込みルーター（あれば）を購読し、現在のパスに対してリコンサイルし、プリフェッチを設定し、`mountWhenVisible`のコンテナの監視を開始します。`OrchestratorEvent.STARTED`を発行します。最初のリコンサイルの後に解決されます。そのリコンサイルでアプリが失敗した場合も解決されます。失敗は`onError`、`APP_ERROR`、コンソールに通知されます。2回目の呼び出しは`[Tuvix] Orchestrator is already started.`をログに出力して戻ります。

#### `mountApp(name)` / `unmountApp(name)`

1つのアプリを手動でマウントまたはアンマウントします。`activeWhen`もルートもないアプリに使います。ルートで管理されるアプリでは、次のリコンサイルがこの操作を上書きします。

`mountApp`は進行中のアンマウントを待ってから、読み込みとマウントを行います。`fallback`を描画した後、読み込みまたはマウントのエラーでrejectします。`unmountApp`は進行中の読み込みまたはマウントを待ってからアンマウントします。読み込み中に呼び出された場合、マウント自体をスキップします。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'chat', entry: '/chat/main.js', container: '#chat' });
await orchestrator.start();

document.querySelector('#open-chat')?.addEventListener('click', () => {
  orchestrator.mountApp('chat').catch(() => {
    // fallback HTML is already in #chat
  });
});
```

#### `updateAppProps(name, props)`

`props`をアプリの現在のプロパティに浅くマージします。`update`関数を持つマウント済みのアプリは、マージ後のオブジェクトを`update({ props, container })`として受け取ります。それ以外の場合、オーケストレーターはマージ後のプロパティを保存し、次の`mount()`に渡します。保留中のマウントを先に待つため、更新は新しいインスタンスに届きます。`update`がスローすると、ステータスが`error`になり、`onError`が実行され、Promiseがrejectされ、保存済みのプロパティは変更されません。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'cart', entry: '/cart/main.js', container: '#cart', activeWhen: '/' });
await orchestrator.start();

await orchestrator.updateAppProps('cart', { currency: 'EUR' });
```

#### `reconcile(path?)`

`path`、または省略時は現在のパスに対するリコンサイルをキューに入れます。ナビゲーションをオーケストレーターに伝えるルーターがない場合に使います。[リコンサイルは1つずつ実行される](#reconciles-run-one-at-a-time)のキューのルールが適用されます。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.reconcile('/dashboard?tab=stats');
```

#### `connectRouter(source)`

組み込みルーターの代わりに外部ルーター（TanStack Router、React Router、独自のもの）に従います。`source.subscribe(callback)`は、ナビゲーションのたびに`callback`を呼び出し、購読解除関数を返す必要があります。`source.getPath()`は現在のパスを返します。`start()`の後、各コールバックは`getPath()`に対してリコンサイルします。`start()`も`getPath()`を読み取ります。すでに開始しているオーケストレーターに接続すると、ただちにリコンサイルします。`disconnect()`を返します。

```ts
import { createOrchestrator } from '@tuvix.js/core';

// TanStack Router instance created elsewhere in your shell.
declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'billing', entry: '/billing/main.js', container: '#main', activeWhen: '/billing' });

const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();

// Later, when the shell tears down:
disconnect();
```

React Routerのデータルーター（`createBrowserRouter`）も同じ形に当てはまります。`subscribe: (callback) => router.subscribe(() => callback())`と`getPath: () => router.state.location.pathname`を使います。

#### `navigateTo(path)`

組み込みルーターの`push(path)`を呼び出します。PromiseはURLが変わった後に解決され、それによって起動するリコンサイルはバックグラウンドで実行されます。`config.router`がない場合は`[Tuvix] No router configured.`をスローします。

#### `getAppStatus(name)`, `getRegisteredApps()`, `getMountedApps()`

`getAppStatus`はアプリの`AppStatus`を返し、不明な名前には`null`を返します。`getRegisteredApps`は登録済みのすべての名前を返します。`getMountedApps`はステータスが`'mounted'`の名前を返します（`'updating'`のアプリは含まれません）。

#### `getEventBus()`, `getRouter()`

`getEventBus`は、オーケストレーターが`OrchestratorEvent`を発行し`mount()`に渡すバスを返します。これは`getGlobalBus()`、または`eventBus`を設定した場合は専用バスです。`getRouter`は組み込みルーター、または`null`を返します。

#### `unregister(name)`

アプリをアンマウントし（進行中のマウントを待ちます）、コンテナの監視を止め、エントリーのscriptタグとstyleタグを削除し、キャッシュされたモジュールを破棄し、アプリの登録を消去します。不明な名前ではrejectします。ブラウザはモジュールスクリプトをURLごとに一度しか実行しないため、`type: 'module'`のURLエントリーを再登録するには、新しいURLまたはローダー関数が必要です。

#### `destroy()`

プリフェッチを止め、組み込みルーターと接続済みのすべてのルーターの購読を解除し、実行中のリコンサイルを待ち、すべてのアプリをアンマウントし、ローダーのキャッシュをクリアして、`OrchestratorEvent.DESTROYED`を発行します。専用バスは破棄し、グローバルバスは残します。繰り返し呼び出すと同じPromiseを返します。その後、`register`、`start`、`mountApp`、`unmountApp`、`unregister`、`reconcile`、`connectRouter`は`[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`をスローします。

### `defineMicroApp`

```ts no-check
function defineMicroApp(definition: MicroAppDefinition): MicroAppModule;
```

ライフサイクルオブジェクトを検証し、`@tuvix.js/loader`の`registerModule(definition.name, module)`で公開して返します。リモートアプリのエントリーで呼び出します。エントリーがURLでもローダー関数でも、オーケストレーターはエントリーのスクリプトが実行された後に名前でモジュールを見つけます。

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | シェルが登録した`name`と一致する必要があります。 |
| `bootstrap` | `() => void \| Promise<void>` | なし | 初回の読み込み後、初回のマウント前に実行されます。スローするとマウントは失敗し、次のマウントで再び呼び出されます。一度成功すると、そのオーケストレーターでは二度と実行されません。 |
| `mount` | `(context: MountContext) => void \| Promise<void>` | 必須 | `context.container`に描画します。 |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | 必須 | 後片付けをして`context.container`を空にします。 |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | なし | 再マウントせずに`context.props`を適用します。これがない場合、新しいプロパティは次のマウントまで待ちます。 |
| `ssr` | `boolean` | `false` | `mount`がサーバーレンダリングされたマークアップを引き継ぐ場合に設定します。その場合、`mount`の実行前にコンテナにマークアップがあれば、`tuvix:mounted`イベントは`hydrated: true`を通知します。 |

`MountContext`の内容：

| フィールド | 型 | 意味 |
| --- | --- | --- |
| `container` | `HTMLElement` | 描画先の要素。CSSを隔離したアプリでは、Shadow Root内の`<div data-tuvix-sandbox-root>`です。 |
| `props` | `Record<string, unknown> \| undefined` | 現在のプロパティ。 |
| `name` | `string \| undefined` | 登録されたアプリ名。 |
| `bus` | `MicroAppBus \| undefined` | オーケストレーターのイベントバス（`on`、`once`、`emit`、`off`）。 |

返されるモジュールは`mount`と`unmount`をラップし、フレームワークアダプターと同じDOMライフサイクルイベントをディスパッチします。そのため、`@tuvix.js/loader`の`whenMounted(name)`、`isMounted(name)`、`onLifecycle`はこれらのアプリでも動作します。

- `tuvix:mounted`：`mount`が解決した後、`{ name, container, hydrated }`とともに。
- `tuvix:unmounted`：`unmount`が解決した後。
- `tuvix:error`：どちらかがスローしたとき。その後、ラッパーはエラーを再スローします。

イベントはコンテナから`document`へバブリングします。ドキュメントに接続されていないコンテナの場合、ランタイムはイベントを`document`に直接ディスパッチします。同じコンテナで`mount`の実行中に届いた`unmount`は、先にそのマウントを待ちます。

`[Tuvix] defineMicroApp requires a "name" property.`、`[Tuvix] defineMicroApp "<name>" requires a "mount" function.`、または`[Tuvix] defineMicroApp "<name>" requires an "unmount" function.`をスローします。

```ts
import { defineMicroApp } from '@tuvix.js/core';

let offCart: (() => void) | undefined;

export default defineMicroApp({
  name: 'header',
  bootstrap() {
    console.log('header loaded');
  },
  mount({ container, props, bus }) {
    container.innerHTML = `<header>Hello, ${String(props?.user ?? 'guest')} <span id="count">0</span></header>`;
    offCart = bus?.on<{ count: number }>('cart:changed', ({ count }) => {
      const badge = container.querySelector('#count');
      if (badge) badge.textContent = String(count);
    });
  },
  update({ props, container }) {
    const header = container?.querySelector('header');
    if (header?.firstChild) header.firstChild.textContent = `Hello, ${String(props.user ?? 'guest')} `;
  },
  unmount({ container }) {
    offCart?.();
    container.replaceChildren();
  },
});
```

### `OrchestratorEvent`

オーケストレーターがバスに発行するイベントの文字列enumです。デフォルトのバスは`getGlobalBus()`なので、ページ上のどのアプリでもリッスンできます。

| メンバー | イベント名 | ペイロード |
| --- | --- | --- |
| `APP_REGISTERED` | `'tuvix:app:registered'` | `{ name }` |
| `APP_BOOTSTRAP` | `'tuvix:app:bootstrap'` | `{ name }` |
| `APP_MOUNT` | `'tuvix:app:mount'` | `{ name }` |
| `APP_UNMOUNT` | `'tuvix:app:unmount'` | `{ name }` |
| `APP_ERROR` | `'tuvix:app:error'` | `AppErrorEvent`：`{ name, error, phase }`。`phase`は`'load'`、`'bootstrap'`、`'mount'`、`'update'`、`'unmount'`のいずれか |
| `APP_STATUS_CHANGE` | `'tuvix:app:status-change'` | `{ name, status }` |
| `ROUTE_CHANGE` | `'tuvix:route:change'` | 組み込みルーターの`NavigationEvent`（`from`、`to`、`fromRoute`、`toRoute`） |
| `STARTED` | `'tuvix:started'` | `{}` |
| `DESTROYED` | `'tuvix:destroyed'` | `{}` |

`phase: 'load'`は、エントリーの読み込みに加えてコンテナの解決も対象にします。

```ts
import { createOrchestrator, getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
```

### CSSの隔離 {#css-isolation}

`sandbox: true`または`sandbox: { css: true }`は、アプリのCSSを隔離します。

1. 初回のマウント時、オーケストレーターは[`@tuvix.js/sandbox`](/ja/packages/sandbox)の`CssSandbox`でコンテナにopenなShadow Rootをアタッチし、既存の子要素（サーバーレンダリングされたマークアップ）をその中の`<div data-tuvix-sandbox-root="<name>">`に移動します。アプリはそのdivにマウントされます。
2. エントリーの`styles`は、`document.head`ではなくShadow Root内の`<link>`要素として読み込まれます。マウントは、それらの読み込みが完了するか失敗するまで、最大`loader.timeout`ミリ秒待ちます（デフォルトは10000。`0`の場合は無制限に待ちます）。
3. アンマウントしてもShadow Rootは残り、次のマウントで再利用されます。

ページのスタイルシートはアプリ内の要素に一致しなくなり、アプリのスタイルシートはページに届かなくなります。`color`や`font-family`などの継承プロパティは、引き続きShadow境界を越えます。`{ css: false }`と`false`はLight DOMに描画します。

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'checkout',
  entry: { scripts: ['/checkout/main.js'], styles: ['/checkout/main.css'] },
  container: '#checkout',
  activeWhen: '/checkout',
  sandbox: { css: true },
});

await orchestrator.start();
```

オーケストレーターはJavaScriptをサンドボックス化しません。[`@tuvix.js/sandbox`](/ja/packages/sandbox)の`JsSandbox`は、自分で呼び出す独立したユーティリティです。

### 型

| 型 | 意味 |
| --- | --- |
| `OrchestratorConfig` | `createOrchestrator`と`new Orchestrator`の引数。`createOrchestrator`の表を参照してください。 |
| `MicroAppConfig` | `register`の引数。`register`の表を参照してください。 |
| `MicroAppDefinition` | `defineMicroApp`の引数：`name`、`bootstrap?`、`mount`、`unmount`、`update?`。 |
| `AppSandboxOption` | `boolean \| { css?: boolean }`。`sandbox`フィールドです。 |
| `RouterSource` | `{ subscribe(callback: () => void): () => void; getPath(): string }`。`connectRouter`の引数です。 |
| `AppErrorEvent` | `{ name: string; error: Error; phase: AppErrorPhase }`。`APP_ERROR`のペイロードです。 |
| `AppErrorPhase` | `'load' \| 'bootstrap' \| 'mount' \| 'update' \| 'unmount'`。 |
| `AppStatus` | `'registered' \| 'bootstrapping' \| 'bootstrapped' \| 'mounting' \| 'mounted' \| 'updating' \| 'unmounting' \| 'unmounted' \| 'error'`。初回のマウントは`registered → bootstrapping → bootstrapped → mounting → mounted`と進み、再マウントは`unmounted → mounting → mounted`と進みます。 |
| `RegisteredApp` | 1つのアプリに対するオーケストレーターのレコードの形：`config`、`status`、`module`、`container`、`error`、`lastUpdated`。0.5.0では、これを返す`Orchestrator`のメソッドはありません。 |

### 再エクスポート

`@tuvix.js/core`は依存パッケージから次のものを再エクスポートするため、シェルはすべてを1つのパッケージからimportできます。各リンク先に完全なAPIが記載されています。

| エクスポート | 種類 | ソース |
| --- | --- | --- |
| `createEventBus`, `getGlobalBus` | function | [`@tuvix.js/event-bus`](/ja/packages/event-bus) |
| `IEventBus`, `EventHandler`, `Unsubscribe` | type | [`@tuvix.js/event-bus`](/ja/packages/event-bus) |
| `createRouter`, `matchPath`, `interceptLinks` | function | [`@tuvix.js/router`](/ja/packages/router) |
| `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions` | type | [`@tuvix.js/router`](/ja/packages/router) |
| `createLoader` | function | [`@tuvix.js/loader`](/ja/packages/loader) |
| `Entry`, `MicroAppModule` | type | [`@tuvix.js/loader`](/ja/packages/loader) |

`getGlobalBus()`はインスタンスを`window.__TUVIX_GLOBAL_BUS__`に保持します。そのため、`@tuvix.js/event-bus`の独自のコピーをバンドルしたマイクロアプリも、シェルと同じバスを取得します。

## エッジケース

- `start()`前の`register()`は設定を保存するだけです。`start()`後に、ルートで管理されるアプリ（`activeWhen`を持つか、ルーターのルートで名前が指定されているアプリ）を登録すると、現在のパスに対してリコンサイルが実行されます。そのため、パスがアプリをアクティブにする場合はすぐにマウントされます。
- `start()`後に登録された`mountWhenVisible`アプリは、すぐに監視されます。その時点で（または`start()`の時点で）DOMにないコンテナはスキップされ、監視されることはありません。`IntersectionObserver`がない環境（サーバー、古いブラウザ）では、ビューポートアプリはマウントされません。
- マウントに失敗したビューポートアプリは`error`のままです。オブザーバーは再試行しません。
- `error`状態のルート管理アプリは、そのアプリをアクティブにする次のリコンサイルで再試行されます。読み込みに失敗した場合は再度読み込みます。`bootstrap`が失敗した場合は、再試行時に`bootstrap`を再実行します。成功した`bootstrap`は繰り返されないため、`mount`が失敗した場合は`mount`だけを再試行します。
- コンテナが見つからない場合、マウントは`[Tuvix] Container "#main" not found in DOM.`で失敗します。初回のマウントでは、`fallback`を描画する場所がありません。
- リコンサイルの失敗は、`start()`、`reconcile()`、ナビゲーションをrejectしません。オーケストレーターは`[Tuvix] Failed to mount "<name>":`（または`unmount`）をコンソールに出力し、`onError`を呼び出します。`mountApp`と`unmountApp`はrejectします。
- `APP_ERROR`はすべてのフェーズの失敗で発火し、`phase`がそのフェーズを示します。`fallback`は`load`、`bootstrap`、`mount`の失敗でのみ描画されます。
- アンマウントがスローしたアプリは`error`で終わり、アンマウント済みとして扱われます。
- `fallback`は`innerHTML`を通ります。信頼できるマークアップのみを渡してください。
- アンマウントは、他の読み込み済みアプリが同じURLを使っていない限り、アプリのエントリーのスタイルシートを`document.head`から削除します。次のマウントでそれらを再び追加し、読み込みを待ちます。
- 1つのページ上の2つのオーケストレーターは`getGlobalBus()`を共有し、互いの`OrchestratorEvent`を受け取ります。一方に専用バスを持たせるには`eventBus: {}`を渡します。
- `@tuvix.js/event-bus`の`resetGlobalBus()`は、実行中のオーケストレーターが保持するバスを破棄します。オーケストレーターは破棄されたバスを持ち続けます。`resetGlobalBus()`は`destroy()`の後にのみ呼び出してください（たとえばテストの間）。
- `start()`前に発火した`connectRouter`のコールバックは無視されます。`connectRouter`を2回呼び出すと、両方の購読が保持されます。`start()`と`reconcile()`のパスは最新のソースが提供します。
- `config.router`と`connectRouter`の両方がある場合、各ソースはそれぞれのパスに対してリコンサイルします。どちらか一方を使ってください。
- `activeWhen`関数はソースから生のパスを受け取ります。組み込みルーターまたは`connectRouter`では、そのパスにクエリ文字列が含まれることがあります。文字列パターンの場合は`matchPath`がそれを取り除きます。
- `updateAppProps`はネストしたオブジェクトを置き換えます。`{ user: { id: 2 } }`は`user`プロパティ全体を上書きします。

## 対象外の機能

- JavaScriptをサンドボックス化しません。アプリが作成したグローバル、タイマー、リスナーは`window`に残ります。[`@tuvix.js/sandbox`](/ja/packages/sandbox)の`JsSandbox`を使ってください。
- リンクのクリックをインターセプトしません。`interceptLinks`（ここで再エクスポートされています）を呼び出すか、フレームワークのルーターにナビゲーションを任せてください。
- サーバーでレンダリングしません。[`@tuvix.js/server`](/ja/packages/server)とアダプターの`./server`エントリーを使ってください。
- アプリ間で依存関係を共有しません。[`@tuvix.js/module-federation`](/ja/packages/module-federation)またはimport mapsを使ってください。
- DOMライフサイクルイベント（`tuvix:mounted`、`tuvix:unmounted`、`tuvix:error`）を自身では発行しません。`defineMicroApp`のモジュールとフレームワークアダプターが発行します。手書きの`MicroAppModule`は、`@tuvix.js/loader`の`emitLifecycle`を呼び出さない限り何も発行しません。
- アンマウント時にアプリを生かしたままにしません。アプリが状態を別の場所に保存しない限り、アプリ内の状態は失われます。

## 0.4からの移行 {#migrating-from-0-4}

0.5.0の破壊的変更：

- **共有イベントバス。** `eventBus`を渡さない限り、オーケストレーターのバスは`getGlobalBus()`です。0.4では、オーケストレーターごとに独自のバスを作成していました。`destroy()`はグローバルバスを残すようになりました。

  ```ts
  import { createOrchestrator } from '@tuvix.js/core';

  // 0.5: keep a private bus as in 0.4
  const orchestrator = createOrchestrator({ eventBus: {} });
  ```

- **手動のアプリはマウントされたままになります。** リコンサイルは、`activeWhen`もルーターのルートも持たないアプリや、`mountWhenVisible`アプリをアンマウントしなくなりました。0.4では、手動でマウントしたアプリは次のルート変更でアンマウントされていました。その動作に依存していた箇所では`unmountApp(name)`を呼び出してください。
- **`sandbox: true`はShadow Rootを使います。** ページのCSSはアプリに届かなくなり、エントリーの`styles`もページに届かなくなりました。0.4の描画を維持するには、`sandbox`を削除するか`{ css: false }`を設定してください。
- **`prefetch: { strategy: 'hover' }`**は、ホバーまたはフォーカスされたリンクがアクティブにするアプリだけをプリフェッチします。0.4では、ページ上のどこかで最初にマウスを動かすと、すべてのアプリがプリフェッチされていました。
- **`activeWhen`は`matchPath`を使います。** クエリ文字列やハッシュでアプリがアンマウントされなくなり、`:param`セグメントが機能し、`.`や`(`などの文字は文字どおりに一致します。
- **`shared`は削除されました。** `OrchestratorConfig.shared`は一度も読み取られておらず、型から削除されました。削除して、依存関係は[`@tuvix.js/module-federation`](/ja/packages/module-federation)またはimport mapsで共有してください。
- **ルーターの`routes`は完全一致になります。** `{ path: '/', app: 'home' }`ルートは`/`でのみアクティブになります。すべてのパスで表示するアプリには`'/*'`、またはプレフィックス一致を維持する`activeWhen: '/'`を使ってください。`RouteConfig.exact`は削除されたので、指定を外してください。
- **`APP_ERROR`のペイロード。** `phase`を含むようになり、更新とアンマウントの失敗でも発火します。マウントの失敗を前提としていたハンドラーは`phase`を確認してください。

外部ルーター向けの0.4の回避策は不要になります。

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();

// 0.4:
// router.subscribe('onResolved', () => setTimeout(() => orchestrator.reconcile(location.pathname)));

// 0.5:
orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
```

このページの以前のバージョンには、`Orchestrator`に存在しないメソッドとオプションが記載されていました。実際の名前を使ってください。

| 以前のページ | 実際のAPI |
| --- | --- |
| `createOrchestrator({ container })` | `container`は`register()`で各アプリに指定します |
| `register(name, options)` | `register({ name, entry, container, ... })` |
| `mount(name, props)` | `updateAppProps(name, props)`の後に`mountApp(name)` |
| `unmount(name)` | `unmountApp(name)` |
| `update(name, props)` | `updateAppProps(name, props)` |
| `stop()` | `destroy()` |
| `onBeforeMount`, `onAfterMount` | `onStatusChange(name, status)`または`OrchestratorEvent.APP_MOUNT` |
| `sandbox: { js: true }` | `@tuvix.js/sandbox`の`JsSandbox` |

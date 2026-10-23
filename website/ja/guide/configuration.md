# 設定

設定はすべてコードで行います。Tuvix.jsは環境変数も設定ファイルも読み込みません。

## オーケストレーターのオプション

```ts
import { createOrchestrator } from 'tuvix.js';

declare function reportError(error: Error, app: string): void;

const orchestrator = createOrchestrator({
  // Built-in router. Omit it when you follow an external router with connectRouter().
  router: {
    mode: 'history', // or 'hash'
    base: '/',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },

  // Passing eventBus options gives this orchestrator a private bus.
  // Omit it to share getGlobalBus() with every app on the page.
  eventBus: { maxListeners: 50, debug: false },

  // Forwarded to the module loader.
  loader: { timeout: 10000, retries: 2, retryDelay: 1000, globals: {} },

  // 'immediate' | 'idle' | 'hover' | 'none' (default)
  prefetch: { strategy: 'hover' },

  onError: (error, appName) => reportError(error, appName),
  onStatusChange: (appName, status) => console.debug(appName, status),
});
```

| オプション | デフォルト | 効果 |
| --- | --- | --- |
| `router` | なし | 組み込みのルーターを作成します。[ルーティング](/ja/guide/routing)を参照してください。 |
| `eventBus` | なし（グローバルバス） | これらのオプションを持つプライベートバスを作成します。`destroy()`はプライベートバスを破棄し、グローバルバスは残します。 |
| `loader.timeout` | `10000` | 1回の読み込み試行が中断されるまでのミリ秒数。サンドボックス化されたスタイルシートの待機時間の上限にもなります。 |
| `loader.retries` | `2` | 最初の失敗後に追加で試行する回数。 |
| `loader.retryDelay` | `1000` | 試行間のミリ秒数。 |
| `loader.globals` | `{}` | エントリーのスクリプトが実行される前に`window`に書き込まれるプロパティ。 |
| `prefetch.strategy` | `'none'` | マウント前にエントリーを取得するタイミング。下の表を参照してください。 |
| `onError` | なし | 読み込み、ブートストラップ、マウント、更新、アンマウントのいずれかが失敗したときに`(error, appName)`で呼び出されます。 |
| `onStatusChange` | なし | ステータスが変わるたびに`(appName, status)`で呼び出されます。 |

Reactなどの依存関係をアプリ間で共有するには、`@tuvix.js/module-federation`またはimport mapsを使ってください。オーケストレーターにはそのためのオプションはありません。

### プリフェッチ戦略

| 戦略 | エントリーが取得されるタイミング |
| --- | --- |
| `none` | アプリがマウントされるときのみ。 |
| `immediate` | `start()`の直後に、登録済みのすべてのエントリー。 |
| `idle` | `start()`後の最初の`requestIdleCallback`で、登録済みのすべてのエントリー（APIがない環境では200 msのタイムアウト）。 |
| `hover` | アプリをアクティブにするパスを持つ同一オリジンのリンクにポインターが入ったとき、またはフォーカスが移ったとき。各アプリは1回だけ取得されます。 |

プリフェッチは、モジュールスクリプトには`<link rel="modulepreload">`を、クラシックスクリプトとスタイルには`<link rel="prefetch">`を追加します。ローダー関数のエントリーは、関数を呼び出すとモジュールが実行されてしまうため、スキップします。

## マイクロアプリの登録

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main',
  activeWhen: '/dashboard/*',
  props: { theme: 'dark' },
  fallback: '<p>Dashboard is unavailable.</p>',
  sandbox: false,
  mountWhenVisible: false,
});
```

| フィールド | 型 | 効果 |
| --- | --- | --- |
| `name` | `string` | 一意である必要があります。モジュールが登録される名前と一致している必要があります。 |
| `entry` | `string \| EntryConfig \| EntryLoader` | コードの取得元。下記を参照してください。 |
| `container` | `string \| HTMLElement` | セレクターまたは要素。マウント時に解決されるため、要素はその時点までに存在していれば十分です。 |
| `activeWhen` | `string \| (path) => boolean` | ルートパターンまたは述語関数。指定しない場合、アプリはそのアプリを指定するルーターの`routes`に従うか、自分でマウントします。 |
| `props` | `Record<string, unknown>` | 初期プロパティ。`updateAppProps`はこれにマージします。 |
| `fallback` | `string` | 読み込み、ブートストラップ、マウントのいずれかが失敗したときにコンテナに書き込まれるHTML。 |
| `sandbox` | `boolean \| { css?: boolean }` | `true`にするとアプリをShadow Root内にレンダリングします。[サンドボックス](/ja/guide/sandbox)を参照してください。 |
| `mountWhenVisible` | `boolean` | コンテナが10%表示されたらマウントします。以降、ルートの変更はアプリに影響しません。 |

### エントリーの形式

```ts
import type { Entry } from 'tuvix.js';

// One classic script (UMD or IIFE bundle).
const classic: Entry = 'https://cdn.example.com/legacy/app.js';

// Scripts and styles. `type: 'module'` for ES module bundles such as Vite's `.js` output.
const esm: Entry = {
  scripts: ['https://cdn.example.com/cart/main.js'],
  styles: ['https://cdn.example.com/cart/main.css'],
  type: 'module',
  integrity: { 'https://cdn.example.com/cart/main.js': 'sha384-...' },
};

// A loader function. Your bundler code-splits it; the loader passes an AbortSignal.
const lazy: Entry = () => import('./apps/profile');
```

`type`を指定しない場合、`.mjs`、`.mts`、`.ts`、`.tsx`、`.jsx`で終わるURLはモジュールとして読み込まれ、それ以外はすべてクラシックスクリプトとして読み込まれます。ブラウザはモジュールスクリプトをURLごとに1回しか実行しないため、アンロードした`type: 'module'`のアプリは同じURLから再度読み込むことができません。アンロードと再読み込みが必要な場合は、ローダー関数を使ってください。

### 登録に関する注意点

- `register`は、名前の重複、`entry`の欠落、`container`の欠落があるとエラーをスローします。
- `start()`の後に呼び出した`register`は即座に反映されます：ルートで管理されるアプリは現在のパスでアクティブになる場合にマウントされ、`mountWhenVisible`のアプリは監視対象になります。`start()`の前は、`register`は設定を保存するだけです。
- ビューポートで管理されるアプリは、スクロールして画面外に出た後もマウントされたままです。`unmountApp(name)`でアンマウントしてください。
- `activeWhen`もルーターのルートも持たないアプリは、そのままの状態に留まります。`mountApp(name)`と`unmountApp(name)`を自分で呼び出してください。
- `fallback`は生のHTMLです。ユーザー入力から組み立てないでください。

## ルーターのオプション

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // 'hash' reads the path from location.hash
  base: '/app', // stripped before matching, added by push() and replace()
  routes: [
    { path: '/users/:id', app: 'users', meta: { title: 'User' } },
    { path: '/settings/*', app: 'settings' },
  ],
});

router.beforeEach(async ({ to }) => !to.startsWith('/admin'));
```

ルートのパスはパス全体と照合されます。そのため`/settings`は`/settings`と`/settings/`のみに一致し、`'/'`は`/`のみに一致します。サブパスに一致させるにはパスの末尾を`/*`にします。`'/*'`はすべてのパスに一致します。

## サンドボックスのオプション

```ts
import { createSandbox } from 'tuvix.js';

const sandbox = createSandbox({
  css: true, // shadow root on activate()
  js: true, // proxy window for execScript()
  allowedGlobals: ['gtag'], // extra globals strict mode lets you write
  strict: false, // true: writing any other global throws a TypeError
});
```

オーケストレーターは、`sandbox: true`で登録されたアプリにCSS分離を適用します。`JsSandbox`を適用することはありません。[サンドボックス](/ja/guide/sandbox)を参照してください。

## イベントバスのオプション

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus({
  maxListeners: 0, // 0 = unlimited; past the limit, `on` still adds the listener and warns once per event
  debug: false, // log every emit and subscription
  logger: console.log,
});
```

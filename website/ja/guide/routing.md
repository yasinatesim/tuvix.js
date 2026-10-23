# ルーティング

Tuvix.jsは現在のパスから、どのアプリをマウントするかを決めます。これは各アプリの`activeWhen`、組み込みルーターの`routes`、またはその両方で記述します。すべてのパターンは1つのマッチャー（`@tuvix.js/router`の`matchPath`）が解釈するため、`activeWhen`、ルーター、`@tuvix.js/server`の間で`/users/:id`の意味が一致します。

## パターンのルール

`activeWhen`の文字列は前方一致で照合します。

| パターン | 一致する | 一致しない | パラメーター |
| --- | --- | --- | --- |
| `/dashboard` | `/dashboard`、`/dashboard/`、`/dashboard/stats` | `/dashboards` | なし |
| `/dashboard/*` | `/dashboard`と同じパス | `/dashboards` | なし |
| `/users/:id` | `/users/42`、`/users/42/posts` | `/users` | `{ id: '42' }` |
| `/v:version/docs` | `/v2/docs` | `/2/docs` | `{ version: '2' }` |
| `/` | すべてのパス | なし | なし |

- マッチャーは照合の前に`?query`と`#hash`を取り除きます。そのため`/dashboard?tab=1`も`/dashboard`に一致します。
- パラメーターはデコードされます。`/users/J%C3%BCrgen`は`{ id: 'Jürgen' }`になります。
- `.`や`(`などの文字はそのまま文字として照合されます。
- パターンの途中にある`*`は1つのセグメントに一致します。

パターンは次のように自分で確認できます。

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/settings', '/settings/profile').matched; // true
matchPath('/settings', '/settings/profile', { end: true }).matched; // false
matchPath('/', '/about', { end: true }).matched; // false
```

## activeWhenでアプリを有効にする

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  activeWhen: '/users/:id',
});

orchestrator.register({
  name: 'header',
  entry: () => import('./apps/header'),
  container: '#header',
  activeWhen: '/', // every page
});

await orchestrator.start();
```

関数はパスを受け取り、booleanを返します。完全一致、複数のプレフィックス、フィーチャーフラグに使います。

## 組み込みルーター

`createOrchestrator`に`router`を渡すと、オーケストレーターはルーターがナビゲーションを行うたびに状態を同期（reconcile）します。

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/settings', app: 'settings' },
      { path: '/billing/*', app: 'billing' },
    ],
  },
});

orchestrator.register({ name: 'settings', entry: () => import('./apps/settings'), container: '#app' });
orchestrator.register({ name: 'billing', entry: () => import('./apps/billing'), container: '#app' });

await orchestrator.start();
await orchestrator.navigateTo('/billing/invoices');
```

`activeWhen`を持たないアプリは、そのアプリ名を指定したルートに従います。`activeWhen`との違いは2つあります。

- ルートのパスは全体で照合します。`/settings`は`/settings`と`/settings/`に一致し、`/settings/profile`には一致しません。サブパスには`/*`を追加します。
- パスが`/`のルートは、`/`でのみそのアプリを有効にします。すべてのパスに一致するルートには`/*`を使います。

アプリに`activeWhen`がある場合、オーケストレーターはそれを使い、`routes`を無視します。

ルーターは`popstate`（historyモード）または`hashchange`（hashモード）を監視します。リンクのクリックはインターセプトしません。次のセクションを参照してください。

## リンクのクリック

`interceptLinks`は同一オリジンの`<a href>`のクリックを`navigate`関数の呼び出しに変換し、クリーンアップ関数を返します。

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

const stop = interceptLinks({
  navigate: (path) => orchestrator.navigateTo(path),
  prefetch: (path) => console.debug('user may open', path),
});

// later, when the shell leaves the page
stop();
```

次のクリックはブラウザーに任せます。

- 修飾キー（Ctrl、Meta、Shift、Alt）が押されている、またはプライマリ以外のボタンによるクリック
- `event.defaultPrevented`がすでにtrueのクリック
- `target`が`_self`以外、`download`属性、`rel="external"`、`data-tuvix-reload`のいずれかを持つリンク
- 別オリジン、または`base`の外にあるパス
- 現在のパス上のハッシュのみのリンク（ブラウザーがスクロールするため）

`prefetch(path)`はpointerenterまたはfocusのときに、パスごとに1回実行されます。`shouldIntercept(anchor, url, event)`で独自のフィルターを追加できます。`false`を返すとクリックはブラウザーが処理します。`root`は監視対象を1つの要素に限定します。

## ナビゲーションとガード

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/users/:id', app: 'user' }] });

const offGuard = router.beforeEach(async ({ to }) => {
  if (!to.startsWith('/admin')) return true;
  const response = await fetch('/api/me');
  return response.ok;
});

const offChange = router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} → ${to}`, toRoute?.params);
});

await router.push('/users/42'); // pushState
await router.replace('/users/43'); // replaceState
router.back();

router.currentPath; // '/users/43'
router.currentRoute?.params; // { id: '43' }
router.currentRoute?.query; // parsed ?query
router.match('/users/7'); // MatchedRoute | null, no navigation
router.getActiveApps('/users/7'); // ['user']

offGuard();
offChange();
router.destroy();
```

- ガードは`push`、`replace`、戻る/進むの前に順番に実行されます。`false`はナビゲーションをキャンセルします。例外を投げたガードはナビゲーションをキャンセルし、エラーをログに出力します。
- キャンセルされた戻る/進むのナビゲーションは、`replaceState`で以前のURLを復元します。
- 現在のパスへの`push`は何もしません。
- `router.match`は最初に一致したルートを返します。`getActiveApps`はルートが一致するすべてのアプリを返します。

## ベースパス

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { base: '/app', routes: [{ path: '/reports/*', app: 'reports' }] },
});

interceptLinks({ base: '/app', navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.navigateTo('/reports'); // URL becomes /app/reports
```

`base: '/app'`の場合：

- ルーターは照合の前に`/app`を取り除きます。そのため、ルートと`activeWhen`のパターンには`/app`を含めません。
- `push('/x')`と`replace('/x')`は`/app/x`を書き込みます。
- `/application`は`/application`のままです。ベースはセグメントの境界でのみ取り除かれます。
- `interceptLinks`には同じ`base`が必要です。指定しないと`/app/x`が`navigateTo`に渡され、`/app/app/x`が書き込まれます。

## hashモード

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ mode: 'hash', routes: [{ path: '/about', app: 'about' }] });
await router.push('/about'); // URL: /#/about
```

すべてのパスを`index.html`に書き換えられない静的ホスティングで使います。hashモードでは、ルーターは`base`を無視します。

## アプリ内でパラメーターを読む

マウントコンテキストにはパラメーターがありません。パスから読み取るか、プロパティとして渡します。

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { routes: [{ path: '/users/:id', app: 'user' }] },
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  props: { id: matchPath('/users/:id', location.pathname).params.id },
});

orchestrator.getRouter()?.onChange(({ toRoute }) => {
  if (toRoute?.route.app === 'user') {
    void orchestrator.updateAppProps('user', { id: toRoute.params.id });
  }
});

await orchestrator.start();
```

## 外部ルーター

TanStack Router、React Router、またはその他のルーターがナビゲーションを担っている場合は、`config.router`を指定せずに`orchestrator.connectRouter({ subscribe, getPath })`を呼び出します。[外部ルーター](/ja/guide/external-router)を参照してください。

## ルーティングが行わないこと

- ルートコンポーネントはレンダリングしません。アプリは自分自身をコンテナにレンダリングします。
- データは読み込みません。ガード、`onChange`、またはアプリ自身の`mount`を使います。
- `interceptLinks`を呼び出さない限り、ルーターはリンクのクリックを処理しません。

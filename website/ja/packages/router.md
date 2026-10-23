---
title: '@tuvix.js/router'
---

<PackageHeader
  name="@tuvix.js/router"
  title="ルーター"
  description="マイクロアプリ向けのhistoryルーティングとhashルーティング、coreとサーバーで共有する単一のパスマッチャー、クライアントサイドナビゲーションのためのリンクインターセプトを提供します。"
  icon="🔀"
  npm="true"
/>

## インストール

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

`@tuvix.js/core`はこのパッケージに依存し、`createRouter`、`matchPath`、`interceptLinks`を再エクスポートしています。そのため、この3つはcoreからもインポートできます。

## 使いどころ

ルーターはURLパスをマイクロアプリ名に対応付け、パスが変わったときに通知します。シェルがナビゲーションを管理し、URLごとにどのマイクロアプリをアクティブにするかを決める場合に使います。`createOrchestrator`に`router`を渡すとオーケストレーターがルーターを作成するため、ほとんどのシェルでは手動で構築する必要はありません。

`matchPath`はTuvix.jsで唯一のパターンマッチャーです。coreは`activeWhen`文字列に、`@tuvix.js/server`はアプリの`routes`にこれを使います。そのため、パターンは3か所すべてで同じ意味になります。ルーターなしで単独で呼び出すこともできます。

シェルですでにReact Router、TanStack Router、または他のフレームワークのルーターを使っている場合は、そのまま使い続けてください。`@tuvix.js/core`の`orchestrator.connectRouter({ subscribe, getPath })`でオーケストレーターに接続し、このルーターは使いません。その場合でも`matchPath`と`interceptLinks`は併用できます。

## クイックスタート

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
    { path: '/settings', app: 'settings' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

router.beforeEach(({ from }) => !from.startsWith('/settings') || confirm('Discard unsaved settings?'));

// <a href="/app/users/42"> now calls router.push('/users/42') instead of reloading.
const stopLinks = interceptLinks({
  navigate: (path) => router.push(path),
  base: '/app',
});

await router.push('/users/42?tab=posts');
console.log(router.currentPath); // '/users/42?tab=posts'
console.log(router.currentRoute?.params); // { id: '42' }
console.log(window.location.pathname); // '/app/users/42'

// On teardown:
stopLinks();
router.destroy();
```

ルーターはコンストラクター内で`popstate`（historyモード）または`hashchange`（hashモード）のリスナーを登録します。`start()`の呼び出しはありません。

オーケストレーターと併用する場合は、同じ設定を`router`として渡し、オーケストレーター経由でナビゲーションします。

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { interceptLinks } from '@tuvix.js/router';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

`activeWhen`を持たないアプリは、そのアプリ名を指定している`routes`に従います。`orchestrator.getRouter()`は`IRouter`インスタンスを返します。

## API

### `createRouter`

```ts
import type { IRouter, RouterConfig } from '@tuvix.js/router';

declare function createRouter(config: RouterConfig): IRouter;
```

`IRouter`として型付けされた`new Router(config)`を返します。

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | 必須 | ルートテーブル。ルーターは配列の順にルートを検査し、最初に一致したものが採用されます。 |
| `mode` | `'history' \| 'hash'` | `'history'` | `history`は`location.pathname + location.search`を読み取り、`pushState`で書き込みます。`hash`は`#/path`を読み書きします。 |
| `base` | `string` | `'/'` | アプリを配信するパスのプレフィックス。historyモード専用です。ルーターはURLの読み取り時にこれを取り除き、書き込み時に付加します。hashモードでは無視されます。 |

各`RouteConfig`：

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `path` | `string` | 必須 | `matchPath`構文のパターン。パス全体に対して照合します。`'/'`はホームページのみ、`'/*'`はすべてのパス、`'/blog/*'`は`/blog`とその配下すべてに一致します。 |
| `app` | `string` | 必須 | アクティブにするマイクロアプリ名。 |
| `meta` | `Record<string, unknown>` | なし | 任意のデータ。ルーターは`MatchedRoute.route.meta`でそのまま渡します。 |

### `Router`

```ts
import { Router } from '@tuvix.js/router';

const router = new Router({ routes: [{ path: '/cart', app: 'cart' }] });
```

`createRouter`の背後にあるクラスです。`IRouter`を実装しています。

| メンバー | シグネチャ | 動作 |
| --- | --- | --- |
| `currentPath` | `readonly string` | `base`を除いたアプリ相対パス。historyモードではクエリ文字列を含みます。 |
| `currentRoute` | `readonly MatchedRoute \| null` | `match(currentPath)`の結果。 |
| `push` | `(path: string) => Promise<void>` | ガードを実行し、`history.pushState`でURLを書き込み（historyモードでは`base + path`、hashモードでは`#path`）、その後`onChange`ハンドラーを実行します。 |
| `replace` | `(path: string) => Promise<void>` | `history.replaceState`を使う点以外は`push`と同じです。 |
| `back` | `() => void` | `window.history.back()`を呼び出します。 |
| `forward` | `() => void` | `window.history.forward()`を呼び出します。 |
| `onChange` | `(handler: RouteChangeHandler) => () => void` | ナビゲーションが完了するたびに`handler`を実行します。購読解除関数を返します。 |
| `beforeEach` | `(guard: NavigationGuard) => () => void` | ガードを追加します。そのガードを削除する関数を返します。 |
| `match` | `(path: string) => MatchedRoute \| null` | `path`に一致する最初のルート、または`null`。 |
| `getActiveApps` | `(path?: string) => string[]` | `path`（デフォルトは`currentPath`）全体に一致するすべてのルートのアプリ名を、ルート順に重複なしで返します。 |
| `destroy` | `() => void` | windowのリスナーを削除し、ハンドラーとガードをクリアします。 |

`push`と`replace`には`base`からの相対パスを渡します。`base: '/app'`の場合、`router.push('/x')`は`/app/x`を書き込み、`currentPath`は`/x`になります。

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  base: '/app',
  routes: [
    { path: '/*', app: 'header' },
    { path: '/docs/*', app: 'docs' },
    { path: '/docs/:page', app: 'doc-sidebar' },
  ],
});

router.match('/docs/intro')?.route.app; // 'header' (first match wins)
router.getActiveApps('/docs/intro'); // ['header', 'docs', 'doc-sidebar']
router.getActiveApps('/'); // ['header']
await router.replace('/docs/intro'); // URL: /app/docs/intro, no new history entry
router.back();
```

`match`、`getActiveApps`、`isPathActive`は同じパス全体のルールを適用します。ルート`'/'`は`/`でのみアクティブです。すべてのページに表示するアプリには`'/*'`を使ってください。

#### ガード

ガードは追加した順に1つずつ、URLが変わる前に実行されます。`false`に解決されるとナビゲーションはキャンセルされ、残りのガードはスキップされます。それ以外の値ではナビゲーションが続行されます。例外を投げる、またはrejectするガードはナビゲーションをキャンセルし、ルーターはそのエラーを`console.error`でログに出力します。

```ts
import { createRouter } from '@tuvix.js/router';

declare function isAdmin(): Promise<boolean>;

const router = createRouter({
  routes: [{ path: '/admin/*', app: 'admin' }],
});

const removeGuard = router.beforeEach(async ({ to }) => {
  if (to.startsWith('/admin')) return isAdmin();
  return true;
});

removeGuard();
```

ガードはブラウザの戻る・進むボタンでも実行されます。その時点でブラウザはすでに移動しているため、ガードがキャンセルすると、ルーターは`history.replaceState`を呼び出して直前のURL（`base`付き）をアドレスバーに戻します。履歴エントリーはブラウザが移動した位置のままです。

### `matchPath`

```ts
import type { MatchPathOptions, PathMatch } from '@tuvix.js/router';

declare function matchPath(
  pattern: string,
  path: string,
  options?: MatchPathOptions
): PathMatch;
```

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | `true`の場合、`/*`を含まないパターンはパス全体に一致する必要があります。`false`の場合はすべてのサブパスにも一致します。 |

`{ matched, params }`を返します。ルールは次のとおりです。

- マッチャーは`path`から`?query`と`#hash`を取り除き、両側の末尾スラッシュを無視します。
- `:name`は空でない1つのセグメントを`params.name`にURIデコードして取り込みます。パーセントエンコーディングが不正な値は記述されたままになります。セグメントにはテキストとパラメーターを混在できます：`/v:version`は`/v2`に一致します。
- 末尾の`/*`はベースパスとその配下すべてに一致します：`/docs/*`は`/docs`と`/docs/a/b`に一致します。残りの部分は`params`に取り込まれません。
- パターンの途中にある`*`は1つのセグメントに一致します。
- デフォルトでは、通常のパターンはセグメント境界でサブパスに一致します：`/docs`は`/docs/intro`に一致し、`/docsify`には一致しません。
- `'/'`はデフォルトですべてのパスに一致します。`{ end: true }`を指定すると`/`にのみ一致します。ルーターのルートは常に`end: true`のルールを使い、coreの`activeWhen`文字列と`@tuvix.js/server`のアプリ`routes`はデフォルトのプレフィックスルールを使います。
- パターン内のその他の正規表現文字はリテラルとして一致します。照合は大文字と小文字を区別します。

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts#bio'); // { matched: true, params: { id: '42' } }
matchPath('/files/:name', '/files/a%20b.txt').params.name; // 'a b.txt'
matchPath('/docs', '/docs/intro').matched; // true
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
matchPath('/docs', '/docsify').matched; // false
matchPath('/', '/anything').matched; // true
matchPath('/a/*/c', '/a/b/c').matched; // true
```

マッチャーは各パターンを一度だけコンパイルして`RegExp`をキャッシュするため、ナビゲーションのたびに呼び出せます。

### `matchRoute`

```ts
import type { MatchedRoute, RouteConfig } from '@tuvix.js/router';

declare function matchRoute(path: string, routes: RouteConfig[]): MatchedRoute | null;
```

`path`がパス全体で一致する（`end: true`のルール）最初のルートを、正規化したパス、デコード済みパラメーター、解析済みクエリとともに返します。`#hash`は無視します。`Router.match`はこの関数を呼び出します。

```ts
import { matchRoute } from '@tuvix.js/router';

matchRoute('/users/42?tab=info', [{ path: '/users/:id', app: 'users' }]);
// { route: { path: '/users/:id', app: 'users' }, path: '/users/42', params: { id: '42' }, query: { tab: 'info' } }
```

### `isPathActive`

```ts
declare function isPathActive(path: string, pattern: string): boolean;
```

`matchPath(pattern, path, { end: true }).matched`です。ルートが使うパス全体のルールなので、`'/'`は`/`でのみアクティブです。`Router.getActiveApps`はこの関数を使います。

```ts
import { isPathActive } from '@tuvix.js/router';

isPathActive('/settings/profile', '/settings'); // false
isPathActive('/settings/profile', '/settings/*'); // true
isPathActive('/settings/profile', '/'); // false
isPathActive('/settings/profile', '/*'); // true
```

### `pathToRegex`

```ts
declare function pathToRegex(pattern: string): { regex: RegExp; paramNames: string[] };
```

パターンをコンパイルした完全一致の`RegExp`と、そのパラメーター名を順に返します。`regex`オブジェクトは共有キャッシュから取得されるため、`lastIndex`などの状態を変更しないでください。この正規表現はクエリやハッシュを含まない正規化済みパスに対して実行されます。パスにそれらが含まれる可能性がある場合は`matchPath`を使ってください。

```ts
import { pathToRegex } from '@tuvix.js/router';

const { regex, paramNames } = pathToRegex('/posts/:slug');
regex.test('/posts/hello'); // true
paramNames; // ['slug']
```

### `parseQuery`

```ts
declare function parseQuery(queryString: string): Record<string, string>;
```

先頭の`?`の有無にかかわらず`a=1&b=2`を解析します。各ペアを最初の`=`で分割するため、JWTのような値は`=`文字を保持します。キーと値をデコードし、デコードに失敗した場合は元のテキストを保持します。`=`を持たないキーは`''`に対応付けられます。重複したキーは最後の値を保持します。

```ts
import { parseQuery } from '@tuvix.js/router';

parseQuery('?token=abc.def=ghi&debug'); // { token: 'abc.def=ghi', debug: '' }
```

### `normalizePath`

```ts
declare function normalizePath(path: string): string;
```

先頭にスラッシュを追加し、末尾のスラッシュを1つ取り除きます。クエリとハッシュには手を加えません。

```ts
import { normalizePath } from '@tuvix.js/router';

normalizePath('users/42/'); // '/users/42'
```

### `interceptLinks`

```ts
import type { InterceptLinksOptions } from '@tuvix.js/router';

declare function interceptLinks(options: InterceptLinksOptions): () => void;
```

`root`配下の`<a href>`要素のクリックを監視し、処理対象のクリックで`preventDefault()`を呼び出して、そのパスを`navigate`に渡します。追加したすべてのリスナーを削除する関数を返します。

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | 必須 | `base`を取り除いた`pathname + search + hash`を受け取ります。投げられたエラーやrejectされたPromiseは`console.error`でログに出力されます。 |
| `root` | `Document \| HTMLElement` | `document` | クリックリスナーを登録する要素。 |
| `base` | `string` | `'/'` | アプリを配信するパスのプレフィックス。その外側へのリンクはブラウザに任せます。`navigate`と`prefetch`を呼び出す前にこれを取り除きます。 |
| `shouldIntercept` | `(anchor: HTMLAnchorElement, url: URL, event: MouseEvent) => boolean` | なし | 組み込みのチェックの後に実行されます。`false`を返すとクリックをブラウザに任せます。 |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | なし | 対象となるリンク上での`pointerenter`または`focusin`で、`pathname + search`ごとに1回実行されます。パスにハッシュは含まれません。 |

次のいずれかに該当する場合、`interceptLinks`はクリックをブラウザに任せます。

- 別のハンドラーがすでに`preventDefault()`を呼び出している。
- 押されたボタンが主ボタンではない、またはCtrl、Meta、Shift、Altが押されている。
- アンカーが`_self`以外の`target`、`download`属性、`external`を含む`rel`、または`data-tuvix-reload`属性を持っている。
- 解決されたURLのオリジンがページと異なる。
- URLのパスが`base`の外側にある（`/app`は`/app`と`/app/...`を対象とし、`/application`は対象外）。
- リンクがハッシュを持ち、パスとクエリが現在のページと同じである。この場合はブラウザがアンカーまでスクロールします。
- `shouldIntercept`が`false`を返す。

`prefetch`には属性、オリジン、`base`のチェックが適用されます。修飾キーとハッシュのみのルールは無視され、現在のページへのリンクでも実行されます。

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/shop/*', app: 'shop' }] });
const nav = document.querySelector('nav') ?? document;

const stop = interceptLinks({
  navigate: (path) => router.push(path),
  root: nav,
  shouldIntercept: (anchor) => !anchor.closest('[data-legacy]'),
  prefetch: (path) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.append(link);
  },
});

stop();
```

`interceptLinks`は[`resolveLink`](#resolvelink)でアンカーを見つけます。そのため、open shadow root内のリンクも動作し、SVGの`<a>`要素はブラウザに任されます。`document`や`window`のない環境では、何もしないクリーンアップ関数を返します。

### `resolveLink`

```ts
import type { ResolvedLink, ResolveLinkOptions } from '@tuvix.js/router';

declare function resolveLink(
  event: Event,
  options?: ResolveLinkOptions
): ResolvedLink | null;
```

イベントが発生した`<a href>`を見つけ、その絶対URLとアプリ相対パスとともに返します。リンクをブラウザに任せるべき場合は`null`を返します。`interceptLinks`とオーケストレーターの`prefetch: { strategy: 'hover' }`がこの関数を使います。同じリンクのルールが必要な場合は、独自のリスナーから呼び出してください。たとえば、ホバー時にデータを事前に読み込む場合や、アプリ内ナビゲーションをログに記録する場合です。

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `base` | `string` | `'/'` | アプリを配信するパスのプレフィックス。その外側へのリンクでは`null`を返します。`path`からはこれを取り除きます。 |

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `anchor` | `HTMLAnchorElement` | `<a>`要素。 |
| `url` | `URL` | リンクの絶対URL。 |
| `path` | `string` | `base`を取り除いた`pathname + search + hash`。 |

```ts
import { resolveLink } from '@tuvix.js/router';

const warmed = new Set<string>();

function warmUp(event: Event): void {
  const link = resolveLink(event, { base: '/app' });
  if (!link || warmed.has(link.url.pathname)) return;
  warmed.add(link.url.pathname);
  void fetch(`/api/page-data?path=${encodeURIComponent(link.path)}`);
}

// pointerenter does not bubble, so listen in the capture phase.
document.addEventListener('pointerenter', warmUp, true);
document.addEventListener('focusin', warmUp);
```

次のいずれかに該当する場合、`resolveLink`は`null`を返します。

- イベントパス上で最も近い`<a>`がSVGの`<a>`である、`href`のないHTMLの`<a>`である、または`<a>`がまったくない。探索は最初に見つかった`<a>`で止まります。
- アンカーが`_self`以外の`target`、`download`属性、`external`を含む`rel`、または`data-tuvix-reload`属性を持っている。
- URLのオリジンがページと異なる。
- URLのパスが`base`の外側にある（`/app`は`/app`と`/app/...`を対象とし、`/application`は対象外）。
- サーバー上のように`window`がない。

`event.composedPath()`を読み取るため、`document`上のリスナーでもopen shadow root内のリンクを見つけられます。closed shadow root内のリンクは見つけられません。イベントのディスパッチ中に呼び出してください。ディスパッチが終わるとcomposed pathは空になり、関数は`event.target.closest('a')`にフォールバックしますが、これはshadow rootの内側を参照できません。

マウスボタン、修飾キー、`defaultPrevented`、ハッシュのみのルールは確認しません。クリックに対しては、`interceptLinks`がこれらを追加で適用します。

### 型

| 型 | 説明 |
| --- | --- |
| `RouterMode` | `'history' \| 'hash'`。 |
| `RouterConfig` | `{ mode?, base?, routes }`。`createRouter`のオプションです。 |
| `RouteConfig` | `{ path, app, meta? }`。1つのルートです。 |
| `MatchedRoute` | `{ route, path, params, query }`。`path`は正規化したパス名、`params`はデコード済みの`:param`の値、`query`は解析済みのクエリ文字列です。 |
| `NavigationEvent` | `{ from, to, fromRoute, toRoute }`。`from`と`to`は`base`を除いたアプリ相対パスです。 |
| `NavigationGuard` | `(event: NavigationEvent) => boolean \| Promise<boolean>`。 |
| `RouteChangeHandler` | `(event: NavigationEvent) => void`。 |
| `IRouter` | `Router`が実装し、`createRouter`が返すインターフェース。 |
| `PathMatch` | `{ matched: boolean; params: Record<string, string> }`。`matchPath`の結果です。一致しなかった場合、`params`は`{}`です。 |
| `MatchPathOptions` | `{ end?: boolean }`。 |
| `InterceptLinksOptions` | `interceptLinks`のオプション。 |
| `ResolveLinkOptions` | `{ base?: string }`。`resolveLink`のオプションです。 |
| `ResolvedLink` | `{ anchor: HTMLAnchorElement; url: URL; path: string }`。`resolveLink`の結果です。 |

## エッジケース

- 現在のパスと同じパス（クエリを含めて同じ文字列）への`push`と`replace`は、ガードもハンドラーも実行せずに戻ります。
- 別のナビゲーションを開始しても、ルーターは保留中のナビゲーションをキャンセルしません。各`push`は自身のガードを待ってからURLを書き込むため、最後に完了したガードチェーンが優先されます。
- ルーターがURLの変更を知るのは、自身の`push`/`replace`と、`popstate`/`hashchange`からだけです。他のコードが`history.pushState`を呼び出した場合、次のイベントまたはルーターによるナビゲーションまで`currentPath`は古いままです。
- `destroy()`の後、`push`、`replace`、`back`、`forward`、`onChange`、`beforeEach`は`[Tuvix Router] Cannot use a destroyed Router. Create a new one.`を投げます。`match`と`getActiveApps`は引き続き動作します。
- `onChange`ハンドラーが例外を投げた場合、ルーターはそれを`console.error`でログに出力し、他のハンドラーは引き続き呼び出します。
- `base: '/app'`の場合、ルーターは`/application`を`/application`として読み取ります。baseはセグメント境界でのみ取り除かれます。historyモードでは、URLの読み取り時に`#hash`を取り除きます。
- サーバー上（`window`なし）では、コンストラクターは`currentPath`を`'/'`に設定し、リスナーを登録しません。`push`、`replace`、`back`、`forward`には`window`が必要です。
- `/*`パターンの`matchPath`はベースパス自体にも一致します：`/dashboard/*`は`/dashboard`に一致します。
- `<svg>`内の`<a>`で発生したイベントは、HTMLの`<a>`がSVGを囲んでいる場合でも`null`に解決されます。`interceptLinks`とオーケストレーターのホバープリフェッチはそのリンクをブラウザに任せ、ブラウザはページ全体を読み込みます。

## 対象外のこと

- マイクロアプリのマウントやアンマウントは行いません。一致と変更を通知するだけで、それに基づいて動作するのは`@tuvix.js/core`のオーケストレーターです。
- `interceptLinks`を呼び出さない限り、リンクのクリックはインターセプトしません。
- ネストしたルート、名前付きルート、リダイレクト、ルートごとのガードはありません。`beforeEach`を使い、`to`または`toRoute`を確認してください。
- パスの`/*`の残りの部分を`params`に取り込みません。
- スクロール位置は復元しません。

## 0.4からの移行

`push()`と`replace()`は`base`をプレフィックスとして付加するようになりました。`base`からの相対パスを渡してください。

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ base: '/app', routes: [] });

// 0.4: router.push('/app/x') wrote /app/x, router.push('/x') wrote /x
// 0.5: router.push('/x') writes /app/x
await router.push('/x');
```

その他の破壊的変更：

- `base`はセグメント境界でのみ取り除かれます：`/application`が`/lication`として読み取られることはなくなりました。
- `match`、`getActiveApps`、`isPathActive`では、ルートはパス全体に対して一致します。0.4では、`getActiveApps`と`isPathActive`は`'/'`ルートをすべてのパスでアクティブとして扱っていました。キャッチオールの`{ path: '/', app }`は`{ path: '/*', app }`に変更してください。
- `RouteConfig.exact`は削除されました。受け付けられても無視されていたので、ルートオブジェクトから削除してください。
- `pathToRegex(pattern)`は2番目の引数`exact`がなくなり、キャッシュされた`RegExp`を返します。
- パターン内の正規表現文字はリテラルとして一致し、パターンの途中にある`*`は1つのセグメントに一致します。
- `matchRoute()`と`isPathActive()`はパス内の`#hash`を無視します。
- 0.4のドキュメントには`navigate`、`go`、`onRouteChange`、ルーターの`orchestrator`オプション、ルートごとの`guard`が記載されていました。これらはいずれも存在しません。`push`、`back`/`forward`、`onChange`、オーケストレーターの`router`設定、`beforeEach`を使ってください。

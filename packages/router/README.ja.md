# @tuvix.js/router

> マイクロアプリ向けのhistoryルーティングとhashルーティング、共有マッチャー`matchPath`、リンクのインターセプト

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。完全なドキュメント：[tuvix.js.org/packages/router](https://tuvix.js.org/packages/router)。

ルーターはURLパスをマイクロアプリ名に対応付け、パスが変わったときに通知します。`matchPath`は、coreの`activeWhen`と`@tuvix.js/server`も使うパターンマッチャーです。シェルですでにReact RouterやTanStack Routerを使っている場合は、代わりに`@tuvix.js/core`の`orchestrator.connectRouter()`で接続してください。

## インストール

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

## クイックスタート

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

const stopLinks = interceptLinks({ navigate: (path) => router.push(path), base: '/app' });

await router.push('/users/42'); // URL: /app/users/42, currentPath: '/users/42'

stopLinks();
router.destroy();
```

コンストラクターが`popstate`または`hashchange`のリスナーを登録します。`start()`の呼び出しはありません。

## API

### `createRouter(config)`と`Router`

`createRouter(config)`は、`IRouter`として型付けされた`new Router(config)`を返します。

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | 必須 | `{ path, app, meta? }`。順に検査され、最初に一致したものが採用されます。パスはパス全体に対して一致します：`'/'`はホームページのみ、`'/*'`はすべてのパス、`'/blog/*'`は`/blog`とその配下です。 |
| `mode` | `'history' \| 'hash'` | `'history'` | `history`は`pushState`と`location.pathname + search`を使います。`hash`は`#/path`を使います。 |
| `base` | `string` | `'/'` | historyモードのプレフィックス。読み取り時に取り除き（セグメント境界でのみ）、書き込み時に付加します。 |

| メンバー | 動作 |
| --- | --- |
| `currentPath`, `currentRoute` | アプリ相対パス（historyモードではクエリを含む）と、その`MatchedRoute \| null`。 |
| `push(path)`, `replace(path)` | `Promise<void>`。ガードを実行し、`base + path`（または`#path`）を書き込み、`onChange`ハンドラーを実行します。同じパスの場合は何もしません。 |
| `back()`, `forward()` | `window.history.back()` / `forward()`。 |
| `onChange(handler)` | ナビゲーションが完了するたびに実行されます。購読解除関数を返します。 |
| `beforeEach(guard)` | ガードは順に実行されます。`false`、例外、rejectのいずれかでキャンセルされます。戻る・進むの場合、ルーターは`replaceState`で直前のURLを復元します。削除用の関数を返します。 |
| `match(path)` | 最初に一致したルート、または`null`。 |
| `getActiveApps(path?)` | パス全体に一致するすべてのルートのアプリを重複なしで返します。`'/'`ルートは`/`でのみアクティブです。すべてのページには`'/*'`を使ってください。 |
| `destroy()` | リスナーを削除します。その後の`push`、`replace`、`back`、`forward`、`onChange`、`beforeEach`は例外を投げます。 |

### `matchPath(pattern, path, options?)`

`{ matched, params }`を返します。

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | `/*`を含まないパターンがパス全体に一致することを要求します。 |

- `?query`と`#hash`を取り除き、末尾のスラッシュを無視します。
- `:name`は1つのセグメントをURIデコードして取り込みます。末尾の`/*`はベースパスとその配下すべてに一致し、残りの部分は取り込まれません。途中の`*`は1つのセグメントに一致します。
- デフォルトでは、`/docs`は`/docs/intro`に一致しますが`/docsify`には一致せず、`'/'`はすべてのパスに一致します。`{ end: true }`を指定すると、`'/'`は`/`にのみ一致します。ルーターのルートは`end: true`のルールを使い、coreの`activeWhen`と`@tuvix.js/server`のルートはデフォルトのプレフィックスルールを使います。
- コンパイルしたパターンはキャッシュされます。照合は大文字と小文字を区別します。

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
```

### ヘルパー

| エクスポート | 動作 |
| --- | --- |
| `matchRoute(path, routes)` | 最初の完全一致を`{ route, path, params, query }`として返します。なければ`null`。`#hash`は無視します。 |
| `isPathActive(path, pattern)` | `matchPath(pattern, path, { end: true }).matched`。ルートが使うパス全体のルールです。 |
| `pathToRegex(pattern)` | キャッシュされた完全一致の`{ regex, paramNames }`。`regex`を変更しないでください。 |
| `parseQuery(query)` | `'?a=1&b'`を`{ a: '1', b: '' }`に変換します。最初の`=`で分割してデコードし、エンコーディングが不正な場合は元のテキストを保持します。 |
| `normalizePath(path)` | 先頭にスラッシュを追加し、末尾のスラッシュを1つ取り除きます。 |

### `interceptLinks(options)`

同一オリジンの`<a href>`のクリックを`navigate(path)`の呼び出しに変換します。クリーンアップ関数を返します。

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | 必須 | `base`を除いた`pathname + search + hash`を受け取ります。エラーはログに出力されます。 |
| `root` | `Document \| HTMLElement` | `document` | クリックリスナーを登録する場所。 |
| `base` | `string` | `'/'` | その外側へのリンクはブラウザに任せます。`navigate`/`prefetch`の前に取り除かれます。 |
| `shouldIntercept` | `(anchor, url, event) => boolean` | なし | `false`を返すとクリックをブラウザに任せます。組み込みのチェックの後に実行されます。 |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | なし | `pointerenter`または`focusin`で、`pathname + search`ごとに1回実行されます。 |

次の場合はクリックをブラウザに任せます：別のハンドラーが`preventDefault()`を呼び出した場合、主ボタン以外のボタンまたはCtrl/Meta/Shift/Altが押された場合、`_self`以外の`target`、`download`、`external`を含む`rel`、`data-tuvix-reload`がある場合、別オリジンの場合、`base`の外側のパスの場合、現在のパスとクエリへのハッシュリンクの場合、または`shouldIntercept`が`false`を返した場合です。open shadow root内のリンクは処理され、SVGの`<a>`要素はブラウザに任されます。

### `resolveLink(event, options?)`

イベントが発生したHTMLの`<a href>`について`{ anchor, url, path }`を返します。リンクをブラウザに任せるべき場合は`null`を返します。`path`は`base`を除いた`pathname + search + hash`です。`interceptLinks`とオーケストレーターのホバープリフェッチがこの関数を使います。同じルールを適用するには、独自のリスナーから呼び出してください。

```ts
import { resolveLink } from '@tuvix.js/router';

document.addEventListener('focusin', (event) => {
  const link = resolveLink(event, { base: '/app' });
  if (link) console.log('next page might be', link.path);
});
```

次の場合は`null`を返します：SVGの`<a>`、`href`のない`<a>`、または`<a>`がない場合（イベントパス上で最も近い`<a>`で判定します）、`_self`以外の`target`、`download`、`external`を含む`rel`、`data-tuvix-reload`がある場合、別オリジンの場合、`base`の外側のパスの場合、`window`がない場合です。`event.composedPath()`を読み取るため、open shadow root内のリンクは見つけられますが、closed shadow root内のリンクは見つけられません。ディスパッチ中に呼び出してください。ボタン、修飾キー、ハッシュのみのリンクは確認しません。

### 型

`RouterMode`、`RouterConfig`、`RouteConfig`、`MatchedRoute`、`NavigationEvent`（`{ from, to, fromRoute, toRoute }`、パスは`base`を含まない）、`NavigationGuard`、`RouteChangeHandler`、`IRouter`、`PathMatch`、`MatchPathOptions`、`InterceptLinksOptions`、`ResolveLinkOptions`（`{ base? }`）、`ResolvedLink`（`{ anchor, url, path }`）。

## エッジケース

- 別のナビゲーションが始まっても、ルーターは保留中のナビゲーションをキャンセルしません。最後に完了したガードチェーンがURLを書き込みます。
- 他のコードが`history.pushState`を呼び出した場合、次の`popstate`、`hashchange`、またはルーターによるナビゲーションまで`currentPath`は古いままです。
- サーバー上では、コンストラクターは`currentPath`を`'/'`に設定し、何も登録しません。ナビゲーション系のメソッドには`window`が必要です。
- 戻る・進むのナビゲーションをキャンセルしたガードはアドレスバーを修正しますが、履歴の位置はブラウザが移動した位置のままです。

## 対象外のこと

- アプリはマウントしません。マウントするのは`@tuvix.js/core`のオーケストレーターで、`router`設定または`connectRouter`を使います。
- `interceptLinks`を呼び出さない限り、リンクはインターセプトしません。
- ネストしたルート、リダイレクト、ルートごとのガード、スクロール位置の復元はありません。

## 0.4からの移行

- `push()`/`replace()`は`base`をプレフィックスとして付加します：`base: '/app'`の場合、`push('/x')`は`/app/x`を書き込みます。`base`からの相対パスを渡してください。
- `base`はセグメント境界でのみ取り除かれます。
- `match`、`getActiveApps`、`isPathActive`では、ルートはパス全体に対して一致します。`'/'`ルートは`/`でのみアクティブです。キャッチオールには`'/*'`を使ってください。
- `RouteConfig.exact`は削除されました（無視されていました）。
- `pathToRegex(pattern)`は引数`exact`がなくなり、キャッシュされた`RegExp`を返します。
- パターン内の正規表現文字はリテラルとして一致し、途中の`*`は1つのセグメントに一致します。
- `matchRoute()`と`isPathActive()`は`#hash`を無視します。

## ライセンス

MIT

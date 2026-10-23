---
title: '@tuvix.js/server'
---

<PackageHeader
  name="@tuvix.js/server"
  title="サーバー"
  description="Tuvix.jsのサーバーサイドでのページ合成。各マイクロアプリのHTMLフラグメントをHTTPで取得し、シェルテンプレートのスロットを埋めて、1つのレスポンスまたはBigPipeストリームとして返します。"
  icon="🖥️"
  npm="true"
/>

## インストール

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

このパッケージはNode.js 18以降で動作し、グローバルの`fetch`を使います。ルートのマッチングには`@tuvix.js/router`に依存します。

## 使いどころ

各マイクロアプリが独自のレンダリングサービスを動かし、シェルサーバーがページを組み立てる構成で使います。`<tuvix-slot name="...">`プレースホルダーを含むシェルHTMLテンプレートを書きます。リクエストごとに、レンダラーは`routes`がパスにマッチするアプリを選び、それらのフラグメントを並列に取得し、各フラグメントをそのスロットがあった位置に配置します。

1つの完全なHTMLレスポンスが欲しく、すべてのフラグメントが失敗したときに502ステータスを返したい場合は、`createServerRenderer`と`createMiddleware`を選びます。最も遅いフラグメントが返る前にシェルの`<head>`をブラウザに届けたい場合は、`createStreamingRenderer`と`createStreamingMiddleware`を選びます。

1つのサーバーがすべてのアイランドを自分でレンダリングする場合（`renderVueToString`やReactの`renderToString`を呼び出すNext.js、Astro、Vite SSRアプリ）は、このパッケージは不要です。その構成でアイランドのアセットをリンクする方法は[`@tuvix.js/vite`](/ja/packages/vite)を参照してください。

## クイックスタート

```ts
import express from 'express';
import { createServerRenderer, createMiddleware } from '@tuvix.js/server';

const renderer = createServerRenderer({
  shellTemplate: `<!doctype html>
<html>
  <head><title>Shop</title></head>
  <body>
    <tuvix-slot name="header"></tuvix-slot>
    <tuvix-slot name="cart"><p>Loading cart...</p></tuvix-slot>
  </body>
</html>`,
  apps: [
    { name: 'header', ssrUrl: 'http://header-service:3001/render', routes: ['/'] },
    { name: 'cart', ssrUrl: 'http://cart-service:3002/render', routes: ['/cart/*'], timeout: 2000 },
  ],
  timeout: 3000,
});

const app = express();
app.use(createMiddleware(renderer));
app.listen(3000);
```

`/cart/42?coupon=x`へのリクエストでは次のように動作します：

1. `header`がマッチし（`'/'`はすべてのパスにマッチします）、`cart`が`/cart/*`にマッチします。
2. レンダラーは`GET http://header-service:3001/render?path=%2Fcart%2F42%3Fcoupon%3Dx`を送信し、cartサービスにも同じリクエストを並列に送ります。ミドルウェアは`req.originalUrl`を読み取るため、クエリ文字列もフラグメントサービスに届きます。
3. 各レスポンスボディが、対応する`<tuvix-slot>`要素全体を置き換えます。
4. ミドルウェアは`Content-Type: text/html; charset=utf-8`と`X-Powered-By: Tuvix.js`を付けて、ステータス200を送信します。

`/about`では`header`だけがマッチします。`cart`スロットは`<tuvix-slot name="cart"><p>Loading cart...</p></tuvix-slot>`としてHTMLに残り、ブラウザはそのフォールバックコンテンツを描画します。

## フラグメントサービス

レンダラーは各アプリの`ssrUrl`を`GET`と`Accept: text/html`で呼び出します。URLは`new URL(ssrUrl)`で組み立て、`path`検索パラメーターにリクエストのパス名とクエリ（`#hash`は除く）を設定します。`ssrUrl`に既にあるパラメーターは残ります。`/shop?sort=asc`の場合、`http://cart:3002/render?v=2`は`http://cart:3002/render?v=2&path=%2Fshop%3Fsort%3Dasc`になります。2xxレスポンスのボディがフラグメントです。それ以外のステータス、ネットワークエラー、タイムアウト、相対`ssrUrl`は失敗として扱われ、レンダラーはスロットに`<!-- SSR error: <app> (<status or message>) -->`を配置します。

フラグメントは`<tuvix-slot>`タグそのものを置き換えるため、レンダラーはラッパー要素を追加しません。オーケストレーターがコンテナを見つけ、アダプターがハイドレートできるように、クライアントサイドのアプリがマウントする要素を返してください：

```ts
import { createServer } from 'node:http';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import Cart from './Cart';

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname !== '/render') {
    res.writeHead(404).end();
    return;
  }
  const html = renderToString(createElement(Cart, { path: url.searchParams.get('path') ?? '/' }));
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(`<div id="cart">${html}</div>`);
}).listen(3002);
```

クライアントでは、`container: '#cart'`でアプリを登録し、SSR対応のアダプター（`createSsrReactMicroApp`、`createSsrVueMicroApp`、`createSsrSvelteMicroApp`、`createSsrAngularMicroApp`）でビルドします。アダプターはゼロから描画する代わりに、サーバーのマークアップをハイドレートします。

## API

### `createServerRenderer`

```ts
import type { RenderResult, ServerAppConfig, ServerRendererConfig } from '@tuvix.js/server';

declare function createServerRenderer(config: ServerRendererConfig): {
  render(path: string): Promise<RenderResult>;
  matchApps(path: string): ServerAppConfig[];
  fetchAppHTML(app: ServerAppConfig, path: string): Promise<string>;
};
```

`ServerRendererConfig`：

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | 必須 | `<tuvix-slot name="x"></tuvix-slot>`または`<tuvix-slot name="x" />`プレースホルダーを含むページHTML。レンダラーは作成時に1回だけスロット名を走査します。 |
| `apps` | `ServerAppConfig[]` | 必須 | サーバーでレンダリングできるアプリ。 |
| `timeout` | `number` | `5000` | 独自の`timeout`を持たないアプリのフェッチタイムアウト（ms）。 |
| `metrics` | `TuvixMetrics` | なし | `createMetricsCollector()`で作成したコレクター。レンダラーは各フラグメントの取得と各レンダリングを記録します。 |

`ServerAppConfig`：

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `name` | `string` | 必須 | アプリ名。フラグメントは同じ名前のスロットを埋めます。 |
| `ssrUrl` | `string` | 必須 | フラグメントの絶対エンドポイント。レンダラーは`path`検索パラメーターを設定し、URLに既にあるパラメーターを保持します。相対URLの場合、そのアプリのフラグメントは失敗します。 |
| `routes` | `string[]` | 必須 | [`matchPath`](/ja/packages/router#matchpath)構文のパターンで、デフォルトのプレフィックスルールが適用されます。コアの`activeWhen`と同じく、`'/'`はすべてのパスに、`'/cart'`は`/cart`とその配下にマッチします。ルーターの`routes`は異なり、パス全体にマッチします。いずれかのパターンがマッチするとアプリがレンダリングされます。 |
| `timeout` | `number` | 設定の`timeout` | このアプリのフェッチタイムアウト（ms）。期限が切れるとレンダラーはリクエストを中断します。 |

返される関数：

- `render(path)`はアプリをマッチさせ、すべてのフラグメントを並列に取得し、スロットを埋めて`{ html, statusCode, headers }`で解決します。`statusCode`は、少なくとも1つのアプリがマッチしてすべてのフラグメントが失敗した場合は`502`、それ以外は`200`です。`headers`には`Content-Type: text/html; charset=utf-8`と`X-Powered-By: Tuvix.js`が入ります。失敗したフラグメントはスロット内のHTMLコメントとして表示され、`render`はそれを理由にrejectしません。パス名が`://`を含むか`//`で始まるパスは、警告を1回出力し、フラグメントを取得せずに、テキスト`Bad Request`とともに`400`で解決します。
- `matchApps(path)`は、`matchPath(pattern, path)`のプレフィックスルールで`routes`が`path`にマッチするアプリを返します。クエリ文字列とハッシュはマッチングに影響しません。
- `fetchAppHTML(app, path)`は1つのフラグメントを取得し、そのHTMLまたはエラーコメントを返します。メトリクスは記録しません。

```ts
import { createServerRenderer } from '@tuvix.js/server';

const renderer = createServerRenderer({
  shellTemplate: '<main><tuvix-slot name="profile" /></main>',
  apps: [{ name: 'profile', ssrUrl: 'http://profile:3003/render', routes: ['/users/:id'] }],
});

const { html, statusCode } = await renderer.render('/users/42#bio');
console.log(statusCode); // 200, or 502 if the profile service failed
console.log(html);
```

### `createStreamingRenderer`

```ts
import type { ServerAppConfig, ServerRendererConfig, StreamingResponse, StreamOptions } from '@tuvix.js/server';

declare function createStreamingRenderer(config: ServerRendererConfig): {
  stream(path: string, res: StreamingResponse, options?: StreamOptions): Promise<void>;
  matchApps(path: string): ServerAppConfig[];
};
```

同じ`ServerRendererConfig`を受け取ります。作成時に、各`<tuvix-slot name="x">fallback</tuvix-slot>`を`<div id="tvx-slot-x" style="display:contents">fallback</div>`に変換し、最後の`</body>`でシェルを分割します。

`stream(path, res, options?)`は次の処理を行います：

1. `Content-Type: text/html; charset=utf-8`、`Transfer-Encoding: chunked`、`X-Powered-By: Tuvix.js`を設定します。
2. `</body>`までのシェルを書き込みます。各スロットは`<div id="tvx-slot-x" style="display:contents">`になり、対になった形式のinner HTMLをフォールバックとして保持します。自己終了形式の`<tuvix-slot name="x" />`の場合は何も保持しません。
3. マッチしたフラグメントを並列に取得します。それぞれが届くたびに、フラグメントを`<template>`内でパースしてプレースホルダーと置き換えるインライン`<script>`を書き込みます。このスクリプトはさらに、フラグメント内の各`<script>`をドキュメント順に1つずつ、すべての属性（`nonce`を含む）とテキストをコピーして作り直し、ブラウザに実行させます。`async`のない外部スクリプトの後では、次のスクリプトはその`load`または`error`イベントを待つため、`<script src="/lib.js"></script><script>Lib.init()</script>`は`Lib`を見つけられます。`async`スクリプトとデータブロック（`type="application/json"`）は、残りのスクリプトを待たせません。
4. `</body></html>`（シェルの残り）を書き込み、`res.end()`を呼び出します。

ステータスは200です。ヘッダーは、フラグメントを取得する前にシェルと一緒に送信されるためです。パス名が`://`を含むか`//`で始まるパスの場合、`stream`は`res.statusCode = 400`を設定し、`Bad Request`を`text/plain`として書き込んで終了します。シェルは送信しません。レンダラーはフラグメントのHTMLをJSONエンコードし、`<`、`>`、U+2028、U+2029をエスケープするため、`</script>`や`<!--`を含むフラグメントがインラインスクリプトを終了させることはありません。

`'unsafe-inline'`のないContent Security Policyの下では、レスポンスごとに新しいnonceを`options.nonce`として渡してください。レンダラーはすべてのインラインスクリプトにそれを`<script nonce="...">`として書き込みます。フラグメントから作り直したスクリプトはフラグメント自身の`nonce`属性だけを持つため、フラグメントのスクリプトにそのnonceを付けるか、ポリシーに`'strict-dynamic'`を追加してください。nonceがない場合、ポリシーはインラインスクリプトをブロックし、プレースホルダーはフォールバックのままになります。

```ts
import { randomBytes } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import { createStreamingRenderer } from '@tuvix.js/server';

declare const renderer: ReturnType<typeof createStreamingRenderer>;

function handle(url: string, res: ServerResponse) {
  const nonce = randomBytes(16).toString('base64');
  res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}' 'strict-dynamic'`);
  return renderer.stream(url, res, { nonce });
}
```

```ts
import { createStreamingRenderer, createServerRenderer } from '@tuvix.js/server';
import { createServer } from 'node:http';

const config = {
  shellTemplate: '<html><head></head><body><tuvix-slot name="feed"><p>Loading...</p></tuvix-slot></body></html>',
  apps: [{ name: 'feed', ssrUrl: 'http://feed:3004/render', routes: ['/'] }],
};
const streaming = createStreamingRenderer(config);
const buffered = createServerRenderer(config);

createServer((req, res) => {
  const path = req.url ?? '/';
  if (req.headers['user-agent']?.includes('bot')) {
    void buffered.render(path).then(({ html, statusCode, headers }) => res.writeHead(statusCode, headers).end(html));
  } else {
    void streaming.stream(path, res);
  }
}).listen(3000);
```

### `createMiddleware`

```ts
import type { createServerRenderer } from '@tuvix.js/server';

declare function createMiddleware(
  renderer: ReturnType<typeof createServerRenderer>
): (
  req: { url: string; originalUrl?: string },
  res: {
    status: (code: number) => { send: (body: string) => void };
    set?: (headers: Record<string, string>) => void;
    setHeader?: (name: string, value: string) => void;
  },
  next?: (error?: unknown) => void
) => Promise<void>;
```

Express/Connectスタイルのハンドラーです。`req.originalUrl ?? req.url`をレンダリングするため、クエリ文字列とExpressのマウントプレフィックス（`app.use('/shop', ...)`）も、ルートがマッチしフラグメントサービスが受け取るパスに含まれます。結果のヘッダーを`res.set`で設定し（`set`がない場合はヘッダーごとに`res.setHeader`を使います）、`res.status(result.statusCode).send(result.html)`を呼び出します。`render`が例外を投げた場合は、エラーをログに出力して`next(error)`を呼び出します。`next`を渡していない場合は`500 Internal Server Error`を送信します。

ミドルウェアは、どのアプリにもマッチしないパスを含め、受け取ったすべてのリクエストをレンダリングします。静的ファイルのハンドラーの後に、シェルが所有するルートにマウントしてください。

### `createStreamingMiddleware`

```ts
import type { createStreamingRenderer, MiddlewareRequest, StreamingMiddlewareOptions, StreamingMiddlewareResponse } from '@tuvix.js/server';

declare function createStreamingMiddleware(
  renderer: ReturnType<typeof createStreamingRenderer>,
  options?: StreamingMiddlewareOptions
): (
  req: MiddlewareRequest,
  res: StreamingMiddlewareResponse,
  next?: (error?: unknown) => void
) => Promise<void>;
```

`renderer.stream(req.originalUrl ?? req.url, res, { nonce })`を呼び出します。`nonce`は`options.nonce?.(req, res)`の値です。CSPミドルウェアがnonceを保存している場所（たとえば`res.locals.cspNonce`）から読み取ってください。エラー時の動作：

- 最初の書き込みより前：`next(error)`を呼び出します。`next`がない場合は、`res.status`で500を送信する（Express）か、`res.statusCode = 500`を設定して`Internal Server Error`を書き込み、レスポンスを終了します（Nodeの`http`）。
- 最初の書き込みより後：ヘッダーは既に送信されているため、レスポンスを終了し、`next`は呼び出しません。

```ts
import express from 'express';
import { createStreamingRenderer, createStreamingMiddleware } from '@tuvix.js/server';

declare const shellTemplate: string;

const renderer = createStreamingRenderer({
  shellTemplate,
  apps: [{ name: 'feed', ssrUrl: 'http://feed:3004/render', routes: ['/'] }],
});

const app = express();
app.use(express.static('public'));
app.use(createStreamingMiddleware(renderer));
app.listen(3000);
```

### `composeHTML`

```ts
declare function composeHTML(template: string, slots: Record<string, string>): string;
```

名前が`slots`の自身のキーである各`<tuvix-slot name="x">...</tuvix-slot>`または`<tuvix-slot name="x" />`を`slots[x]`で置き換えます。エントリーのないスロットは書かれたまま残ります。関数による置換で1回のパスですべてのスロットを埋めるため、フラグメントHTML内の`$&`、`$1`、`` $` ``、`$'`、`$$`はリテラルのまま残り、フラグメント内の`<tuvix-slot>`は埋められません。

```ts
import { composeHTML } from '@tuvix.js/server';

composeHTML('<main><tuvix-slot name="main" /></main><tuvix-slot name="footer">(c)</tuvix-slot>', {
  main: '<p>Save $1 today</p>',
});
// '<main><p>Save $1 today</p></main><tuvix-slot name="footer">(c)</tuvix-slot>'
```

### `compileShellTemplate`

```ts
import type { CompiledTemplate } from '@tuvix.js/server';

declare function compileShellTemplate(template: string): CompiledTemplate;
```

スロット名を1回だけ走査し、`{ slotNames, render }`を返します。`slotNames`は各名前を最初に出現した順に1回ずつ列挙します。`render(slots)`は`composeHTML(template, slots)`と同じ出力を返します。`createServerRenderer`が内部でこれを呼び出します。

```ts
import { compileShellTemplate } from '@tuvix.js/server';

const shell = compileShellTemplate('<tuvix-slot name="header" /><tuvix-slot name="main" />');
console.log(shell.slotNames); // ['header', 'main']
const html = shell.render({ header: '<header>Shop</header>', main: '<main>Home</main>' });
```

### `createMetricsCollector`

```ts
import type { TuvixMetrics } from '@tuvix.js/server';

declare function createMetricsCollector(): TuvixMetrics;
```

インメモリのコレクターです。どちらかのレンダラーに`metrics`として渡すか、メソッドを直接呼び出します：

| メソッド | シグネチャ | 動作 |
| --- | --- | --- |
| `recordRender` | `(durationMs: number) => void` | 1回のレンダリングとその所要時間を記録します。 |
| `recordFragment` | `(name: string, durationMs: number, isError: boolean) => void` | アプリ`name`の1回の取得、その所要時間、失敗したかどうかを記録します。 |
| `toPrometheusText` | `() => string` | Prometheusのテキスト公開フォーマット0.0.4。 |
| `reset` | `() => void` | すべてのカウンターをクリアします。 |

```ts
import { createServer } from 'node:http';
import { createMetricsCollector, createServerRenderer } from '@tuvix.js/server';

declare const shellTemplate: string;

const metrics = createMetricsCollector();
const renderer = createServerRenderer({
  shellTemplate,
  apps: [{ name: 'cart', ssrUrl: 'http://cart:3002/render', routes: ['/cart/*'] }],
  metrics,
});

createServer(async (req, res) => {
  if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' }).end(metrics.toPrometheusText());
    return;
  }
  const { html, statusCode, headers } = await renderer.render(req.url ?? '/');
  res.writeHead(statusCode, headers).end(html);
}).listen(3000);
```

`header`が12 msかかり、`cart`が2000 ms後に失敗した1回のレンダリング後の出力：

```text
# HELP tuvix_renders_total Total number of SSR renders
# TYPE tuvix_renders_total counter
tuvix_renders_total 1
# HELP tuvix_render_duration_ms_total Cumulative render duration (ms)
# TYPE tuvix_render_duration_ms_total counter
tuvix_render_duration_ms_total 2003
# HELP tuvix_render_duration_ms_avg Average render duration (ms)
# TYPE tuvix_render_duration_ms_avg gauge
tuvix_render_duration_ms_avg 2003.00
# HELP tuvix_render_duration_ms_max Peak render duration (ms)
# TYPE tuvix_render_duration_ms_max gauge
tuvix_render_duration_ms_max 2003
# HELP tuvix_fragment_fetches_total Total fetches per fragment
# TYPE tuvix_fragment_fetches_total counter
tuvix_fragment_fetches_total{app="header"} 1
tuvix_fragment_fetches_total{app="cart"} 1
# HELP tuvix_fragment_errors_total Total fetch errors per fragment
# TYPE tuvix_fragment_errors_total counter
tuvix_fragment_errors_total{app="header"} 0
tuvix_fragment_errors_total{app="cart"} 1
# HELP tuvix_fragment_avg_duration_ms Average fetch duration per fragment (ms)
# TYPE tuvix_fragment_avg_duration_ms gauge
tuvix_fragment_avg_duration_ms{app="header"} 12.00
tuvix_fragment_avg_duration_ms{app="cart"} 2000.00
# HELP tuvix_fragment_max_duration_ms Peak fetch duration per fragment (ms)
# TYPE tuvix_fragment_max_duration_ms gauge
tuvix_fragment_max_duration_ms{app="header"} 12
tuvix_fragment_max_duration_ms{app="cart"} 2000
```

各メトリクスファミリーには`# HELP`行と`# TYPE`行が1つずつ付きます。ラベルはサンプルにのみ現れ、ラベル値では`\`、`"`、改行がエスケープされます。コレクターはサンプルのないファミリーを出力しません。最初のレンダリングの前は値が0の2つのレンダリング合計だけが出力され、4つのフラグメントファミリーは最初のフラグメント取得の後に現れます。保持するのは合計、平均、最大値で、ヒストグラムや分位数はありません。

### 型

| 型 | 説明 |
| --- | --- |
| `ServerRendererConfig` | `{ shellTemplate, apps, timeout?, metrics? }`。両方のレンダラーのオプション。 |
| `ServerAppConfig` | `{ name, ssrUrl, routes, timeout? }`。1つのアプリ。 |
| `RenderResult` | `render`が返す`{ html: string; statusCode: number; headers: Record<string, string> }`。 |
| `StreamingResponse` | `{ write(chunk: string): void; end(): void; setHeader(name: string, value: string): void; statusCode?: number }`。Nodeの`ServerResponse`が適合します。 |
| `StreamOptions` | `{ nonce?: string }`。`stream`のリクエストごとのオプション。 |
| `StreamingMiddlewareOptions` | `createStreamingMiddleware`用の`{ nonce?: (req, res) => string \| undefined }`。 |
| `MiddlewareRequest` | `{ url: string; originalUrl?: string }`。両方のミドルウェアが読み取るリクエストのフィールド。 |
| `StreamingMiddlewareResponse` | `StreamingResponse`に、任意のExpressスタイルの`status(code).send(body)`を加えたもの。 |
| `CompiledTemplate` | `{ slotNames: string[]; render(slots: Record<string, string>): string }`。 |
| `TuvixMetrics` | `createMetricsCollector`が返すコレクターのインターフェース。 |

## エッジケース

- フラグメントは、アプリの`name`と同じ名前のスロットを埋めます。スロットのないアプリがマッチした場合、フラグメントは取得されますが、そのHTMLは破棄されます。
- `render`と`stream`は、`://`を含むか`//`で始まるリクエストパス名を、警告1回と`400 Bad Request`で拒否します。フラグメントは取得せず、フラグメントのメトリクスも記録しません。このチェックはクエリを無視するため、`?next=https://...`は通過します。そのようなパスに対して、`fetchAppHTML`は`<!-- SSR error: invalid path -->`を返します。レンダラーはフラグメントサービスに送る前に、パス名（クエリは対象外）から`..`の連続を取り除き、重複したスラッシュをまとめます。
- ストリーミングされたフラグメント内のスクリプトは、その置換スクリプトが実行された時点で、上にあるシェル自身のスクリプトの後に実行されます。実行させたくない場合は、フラグメントサービス側で`<script>`要素を取り除いてください。
- レンダラーはエラーコメント内のアプリ名とエラーメッセージをエスケープするため、`-->`を含むエラーテキストがコメントを閉じることはありません。
- `statusCode`が200でも、部分的な失敗が隠れている場合があります。`tuvix_fragment_errors_total`を確認するか、HTML内の`<!-- SSR error`を探してください。

## 対象外のこと

- コンポーネントはレンダリングしません。各フラグメントサービスが、そのフレームワークのサーバーレンダラーで自分のアプリをレンダリングします。
- フラグメントのキャッシュや、失敗した取得のリトライは行いません。
- Cookieやリクエストヘッダーをフラグメントサービスに転送しません。送るのは`Accept: text/html`だけです。
- ハイドレーションは行いません。それはクライアントサイドのアダプターが担当します。
- フラグメントの`<head>`の内容（スタイル、metaタグ）をシェルの`<head>`にマージしません。共有アセットはシェルに置くか、1つのViteサーバーがアイランドをレンダリングする場合は[`@tuvix.js/vite`](/ja/packages/vite)を使ってください。

## 0.4からの移行

- `createServerRenderer().render()`は、少なくとも1つのアプリがマッチしてすべてのフラグメントが失敗した場合に`statusCode: 502`を返します。`createMiddleware`はそれを送信します。ストリーミングレンダラーは引き続き200を送信します。
- `://`を含むか`//`で始まるリクエストパス名は、`render`と`stream`から`400 Bad Request`を受け取ります。0.4では、200のページ内ですべてのフラグメントがエラーコメントとともに失敗していました。
- `createMiddleware`と`createStreamingMiddleware`は、レンダリングが例外を投げたときに`next()`ではなく`next(error)`を呼び出すため、Expressはエラーハンドラーを実行します。
- ルートは`matchPath`を使うため、`/dashboard?tab=1`は`/dashboard/*`に、`/users/42#bio`は`/users/:id`にマッチします。
- `toPrometheusText()`はファミリーごとに`# HELP`行と`# TYPE`行を1つずつ書き込み、ラベルはサンプルにのみ付けます。0.4の出力はアプリごとにそれらを繰り返し、ラベルをメトリクス名に含めていたため、Prometheusに拒否されていました。
- 両方のミドルウェアは、`req.path ?? req.url`ではなく`req.originalUrl ?? req.url`をレンダリングします。フラグメントサービスは`path`でクエリ文字列を受け取り、`app.use('/prefix', ...)`の下では`/prefix`を含む完全なURLを受け取ります。
- `ssrUrl`は絶対URLである必要があります。相対URLを指定すると、そのアプリにはエラーコメントが出力されるようになりました。`ssrUrl`内のクエリパラメーターは、2つ目の`?`を生成せずに保持されます。
- ストリーミングされたフラグメント内のスクリプトが実行されるようになりました。実行されないことに依存していた場合は、フラグメントサービス側で取り除いてください。
- 自己終了形式の`<tuvix-slot name="x" />`にもストリーミング用のプレースホルダーが作られます。

0.4のドキュメントでは`createMiddleware({ template })`、`renderer.render({ apps, props })`、オーケストレーターの`hydrate: true`オプションを紹介していました。これらはいずれも存在しません。`createMiddleware`にはレンダラーを渡してください：

```ts
import { createServerRenderer, createMiddleware } from '@tuvix.js/server';

declare const shellTemplate: string;

// 0.4 docs (never worked): createMiddleware({ template: './index.html' })
const middleware = createMiddleware(
  createServerRenderer({
    shellTemplate,
    apps: [{ name: 'main', ssrUrl: 'http://main:3001/render', routes: ['/'] }],
  })
);
```

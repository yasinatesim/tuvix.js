# @tuvix.js/server

> マイクロアプリのHTMLフラグメントを取得し、1つのレスポンスまたはBigPipeストリームとしてシェルページに合成します

[Tuvix.js](https://github.com/yasinatesim/tuvix.js)マイクロフロントエンドフレームワークの一部です。完全なドキュメント：[tuvix.js.org/packages/server](https://tuvix.js.org/packages/server)。

`<tuvix-slot name="...">`プレースホルダーを含むシェルテンプレートを書きます。リクエストごとに、レンダラーは`routes`がパスに一致するアプリを（`@tuvix.js/router`の`matchPath`で）選び、それらのフラグメントをHTTPで並列に取得し、各フラグメントをそのスロットがあった位置に配置します。Node.js 18+（グローバルの`fetch`）が必要です。

## インストール

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

## クイックスタート

```ts
import express from 'express';
import { createServerRenderer, createMiddleware } from '@tuvix.js/server';

const renderer = createServerRenderer({
  shellTemplate:
    '<html><body><tuvix-slot name="header"></tuvix-slot><tuvix-slot name="cart"><p>Loading...</p></tuvix-slot></body></html>',
  apps: [
    { name: 'header', ssrUrl: 'http://header-service:3001/render', routes: ['/'] },
    { name: 'cart', ssrUrl: 'http://cart-service:3002/render', routes: ['/cart/*'], timeout: 2000 },
  ],
});

const app = express();
app.use(createMiddleware(renderer));
app.listen(3000);
```

`/cart/42?coupon=x`の場合、レンダラーは両方のサービスに対して、`URL.searchParams`で`path=%2Fcart%2F42%3Fcoupon%3Dx`を設定し（`ssrUrl`に既にあるパラメーターは残り、`#hash`は削除されます）、`Accept: text/html`を付けて`GET <ssrUrl>`を呼び出します。`ssrUrl`は絶対URLである必要があります。2xxのボディはそれぞれ対応する`<tuvix-slot>`タグを置き換えます。2xx以外のステータス、ネットワークエラー、タイムアウト、相対的な`ssrUrl`は`<!-- SSR error: <app> (<reason>) -->`になります。クライアントアダプターがハイドレートできるよう、フラグメントサービスからはアプリのコンテナ要素（`<div id="cart">...</div>`）を返してください。

## API

### `createServerRenderer(config)`

`{ render, matchApps, fetchAppHTML }`を返します。

| オプション | 型 | デフォルト | 意味 |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | 必須 | `<tuvix-slot name="x">fallback</tuvix-slot>`または`<tuvix-slot name="x" />`を含むHTML。 |
| `apps` | `ServerAppConfig[]` | 必須 | `{ name, ssrUrl, routes, timeout? }`。`name`でスロットを選び、`routes`は`matchPath`のプレフィックスルールを使います（クエリとハッシュは無視されます）。 |
| `timeout` | `number` | `5000` | アプリが指定しない場合のfetchのタイムアウト（ms）。 |
| `metrics` | `TuvixMetrics` | なし | `createMetricsCollector()`で作成したコレクター。 |

- `render(path)`は`{ html, statusCode, headers }`に解決します。少なくとも1つのアプリが一致し、すべてのフラグメントが失敗した場合、`statusCode`は`502`になり、それ以外は`200`です。一致しなかったスロットはフォールバックを保持します。パス名が`://`を含むか`//`で始まるパスでは、`Bad Request`というテキストとともに`400`を返し、何も取得しません。
- `matchApps(path)`は一致するアプリを返します。
- `fetchAppHTML(app, path)`は1つのフラグメント（またはエラーコメント）をメトリクスなしで取得します。

### `createStreamingRenderer(config)`

設定は同じです。`{ stream, matchApps }`を返します。`stream(path, res, { nonce? })`は、`<div id="tvx-slot-x" style="display:contents">`プレースホルダーを含むシェルを`</body>`まで書き出します（ペアのスロットは内側のHTMLをフォールバックとして保持し、自己終了スロットは空になります）。次に、フラグメントが届くたびにインラインの`<script>`を1つずつ書き出します。このスクリプトはフラグメントを`<template>`内でパースしてプレースホルダーを置き換え、フラグメント内の各`<script>`を（`nonce`を含むすべての属性とテキストごと）ドキュメント順に1つずつ作り直します。`async`のない外部スクリプトの後では、次のスクリプトはその`load`または`error`を待つため、`<script src="/lib.js"></script><script>Lib.init()</script>`が動作します。`async`スクリプトとデータブロック（`type="application/json"`）はブロックしません。フラグメントはJSONエスケープされるため、`</script>`で抜け出すことはできません。最後にシェルの残りを書き出します。ステータスは200で、別のホストを指すパスに対しては400（`Bad Request`、シェルなし）です。`res`は`StreamingResponse`（`write`、`end`、`setHeader`、任意の`statusCode`）で、Nodeの`ServerResponse`が当てはまります。

`'unsafe-inline'`のないCSPの下では、レスポンスごとに新しい`nonce`を渡してください。レンダラーはそれを自身のインラインスクリプトに付けます。フラグメントのスクリプトには独自の`nonce`属性か、`'strict-dynamic'`を含むポリシーが必要です。

```ts
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { createStreamingRenderer } from '@tuvix.js/server';

const renderer = createStreamingRenderer({
  shellTemplate: '<html><body><tuvix-slot name="cart"></tuvix-slot></body></html>',
  apps: [{ name: 'cart', ssrUrl: 'http://cart-service:3002/render', routes: ['/*'] }],
});

createServer(async (req, res) => {
  const nonce = randomBytes(16).toString('base64');
  res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}' 'strict-dynamic'`);
  await renderer.stream(req.url ?? '/', res, { nonce });
}).listen(3000);
```

### `createMiddleware(renderer)`

Express/Connectのハンドラー`(req, res, next?)`です。`req.originalUrl ?? req.url`（クエリ文字列とExpressのマウントプレフィックスを含む）をレンダリングし、`res.set`または`res.setHeader`でヘッダーを設定し、`res.status(statusCode).send(html)`を送ります。例外が発生した場合は`next(error)`を呼び出し、`next`がなければ500を返します。

### `createStreamingMiddleware(renderer, options?)`

`options.nonce?.(req, res)`から得た`nonce`（たとえば`res.locals.cspNonce`）を使って`renderer.stream(req.originalUrl ?? req.url, res, { nonce })`を呼び出します。最初の書き込み前のエラーでは`next(error)`を呼び出します。`next`がない場合、Expressでは`res.status(500).send()`、Nodeの`ServerResponse`では`statusCode = 500`を設定して`end()`を呼び出します。最初の書き込み後のエラーではレスポンスを終了し、`next`は呼び出しません。

### `composeHTML(template, slots)`と`compileShellTemplate(template)`

`composeHTML`は`slots`で名前が指定された各スロットを1回のパスで置き換えます。それ以外のスロットはそのまま残ります。フラグメントHTML内の`$&`、`$1`、`<tuvix-slot>`は文字どおりに扱われます。`compileShellTemplate`は、名前を一度だけスキャンした`{ slotNames, render(slots) }`を返します。

```ts
import { composeHTML } from '@tuvix.js/server';

composeHTML('<main><tuvix-slot name="main" /></main>', { main: '<p>Hello</p>' }); // '<main><p>Hello</p></main>'
```

### `createMetricsCollector()`

`TuvixMetrics`を返します：`recordRender(ms)`、`recordFragment(name, ms, isError)`、`toPrometheusText()`、`reset()`。メトリクスは`tuvix_renders_total`、`tuvix_render_duration_ms_total`（カウンター）、`tuvix_render_duration_ms_avg`、`tuvix_render_duration_ms_max`（ゲージ）、およびアプリごと（`{app="..."}`）の`tuvix_fragment_fetches_total`、`tuvix_fragment_errors_total`、`tuvix_fragment_avg_duration_ms`、`tuvix_fragment_max_duration_ms`です。ファミリーごとに`# HELP`と`# TYPE`が1つずつ出力され、ラベル値では`\`、`"`、改行がエスケープされます。`Content-Type: text/plain; version=0.0.4`で配信してください。

### 型

`ServerRendererConfig`、`ServerAppConfig`、`RenderResult`、`StreamingResponse`、`StreamOptions`、`StreamingMiddlewareOptions`、`StreamingMiddlewareResponse`、`MiddlewareRequest`、`CompiledTemplate`、`TuvixMetrics`。

## エッジケース

- リクエストのパス名が`://`を含むか`//`で始まる場合、`render`と`stream`は一度だけ`400 Bad Request`を返します。フラグメントは取得せず、フラグメントのメトリクスも記録しません。クエリはチェックされません。このようなパスに対して`fetchAppHTML`は`<!-- SSR error: invalid path -->`を返します。フラグメントサービスに渡す前に、パス名から`..`の連続は取り除かれます。
- ストリーミングされたフラグメント内のスクリプトは実行されます。実行させたくない場合は、フラグメントサービス側で取り除いてください。
- 同じ名前のスロットを持たない一致アプリも取得され、そのHTMLは破棄されます。

## 対象外の機能

- コンポーネントのレンダリング、フラグメントのキャッシュ、fetchのリトライ、Cookieやヘッダーの転送は行いません。
- ハイドレートは行いません。クライアントアダプター（`createSsrReactMicroApp`と、Vue、Svelte、Angularの同等の関数）が行います。
- フラグメントの`<head>`の内容をシェルの`<head>`に移動しません。

## 0.4からの移行

- 一致したすべてのフラグメントが失敗した場合、`render()`は502を返し、`createMiddleware`はそれを送信します。
- どちらのミドルウェアもエラー時に`next()`ではなく`next(error)`を呼び出します。
- ルートは`matchPath`を使います：`/dashboard?tab=1`は`/dashboard/*`に一致します。
- `toPrometheusText()`の出力は有効なPrometheusテキストです（ファミリーごとにHELP/TYPEが1つ）。
- どちらのミドルウェアも`req.path ?? req.url`ではなく`req.originalUrl ?? req.url`をレンダリングします。
- `ssrUrl`は絶対URLである必要があり、既存のクエリパラメーターは保持されます。
- ストリーミングされたフラグメント内のスクリプトが実行されるようになり、自己終了スロットにもストリーミング用のプレースホルダーが付きます。
- パス名が`://`を含むか`//`で始まるリクエストには、`render`と`stream`が`400 Bad Request`を返します。

## ライセンス

MIT

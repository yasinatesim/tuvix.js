---
title: '@tuvix.js/server'
---

<PackageHeader
  name="@tuvix.js/server"
  title="Server"
  description="Server-side page composition for Tuvix.js. Fetch each micro app's HTML fragment over HTTP and fill the slots of a shell template, as one response or as a BigPipe stream."
  icon="🖥️"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

The package runs on Node.js 18 or later and uses the global `fetch`. It depends on `@tuvix.js/router` for route matching.

## When to use it

Use it when each micro app runs its own render service and a shell server stitches the page together. You write a shell HTML template with `<tuvix-slot name="...">` placeholders. For each request, the renderer picks the apps whose `routes` match the path, fetches their fragments in parallel, and puts each fragment where its slot was.

Pick `createServerRenderer` with `createMiddleware` when you want one complete HTML response and a 502 status when every fragment fails. Pick `createStreamingRenderer` with `createStreamingMiddleware` when you want the shell's `<head>` in the browser before the slowest fragment returns.

If one server renders every island itself (a Next.js, Astro or Vite SSR app calling `renderVueToString` or React's `renderToString`), you do not need this package. See [`@tuvix.js/vite`](/packages/vite) for linking island assets in that setup.

## Quick start

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

A request for `/cart/42?coupon=x`:

1. `header` matches (`'/'` matches every path) and `cart` matches `/cart/*`.
2. The renderer sends `GET http://header-service:3001/render?path=%2Fcart%2F42%3Fcoupon%3Dx` and the same to the cart service, in parallel. The middleware reads `req.originalUrl`, so the query string reaches the fragment services.
3. Each response body replaces its whole `<tuvix-slot>` element.
4. The middleware sends status 200 with `Content-Type: text/html; charset=utf-8` and `X-Powered-By: Tuvix.js`.

On `/about`, only `header` matches. The `cart` slot stays in the HTML as `<tuvix-slot name="cart"><p>Loading cart...</p></tuvix-slot>`, and the browser renders its fallback content.

## Fragment services

The renderer calls each app's `ssrUrl` with `GET` and `Accept: text/html`. It builds the URL with `new URL(ssrUrl)` and sets a `path` search parameter to the request pathname plus query, without the `#hash`. Parameters already in `ssrUrl` stay: `http://cart:3002/render?v=2` becomes `http://cart:3002/render?v=2&path=%2Fshop%3Fsort%3Dasc` for `/shop?sort=asc`. A 2xx response body is the fragment. Any other status, a network error, a timeout or a relative `ssrUrl` counts as a failure, and the renderer puts `<!-- SSR error: <app> (<status or message>) -->` in the slot.

The fragment replaces the `<tuvix-slot>` tag itself, so the renderer adds no wrapper element. Return the element your client-side app mounts into, so the orchestrator finds the container and the adapter hydrates it:

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

On the client, register the app with `container: '#cart'` and build it with an SSR-aware adapter (`createSsrReactMicroApp`, `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`). The adapter hydrates the server markup instead of rendering from scratch.

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

`ServerRendererConfig`:

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | required | Page HTML with `<tuvix-slot name="x"></tuvix-slot>` or `<tuvix-slot name="x" />` placeholders. The renderer scans slot names once, at creation. |
| `apps` | `ServerAppConfig[]` | required | Apps that can render on the server. |
| `timeout` | `number` | `5000` | Fetch timeout in ms for apps without their own `timeout`. |
| `metrics` | `TuvixMetrics` | none | Collector from `createMetricsCollector()`. The renderer records each fragment fetch and each render. |

`ServerAppConfig`:

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | App name. The fragment fills the slot with the same name. |
| `ssrUrl` | `string` | required | Absolute fragment endpoint. The renderer sets a `path` search parameter and keeps the parameters already in the URL. A relative URL fails that app's fragment. |
| `routes` | `string[]` | required | Patterns in [`matchPath`](/packages/router#matchpath) syntax with its default prefix rules, the same as core `activeWhen`: `'/'` matches every path and `'/cart'` matches `/cart` and below. Router `routes` differ: they match the whole path. The app renders when any pattern matches. |
| `timeout` | `number` | config `timeout` | Fetch timeout in ms for this app. The renderer aborts the request when it expires. |

Returned functions:

- `render(path)` matches apps, fetches every fragment in parallel, fills the slots and resolves to `{ html, statusCode, headers }`. `statusCode` is `502` when at least one app matched and every fragment failed, otherwise `200`. `headers` holds `Content-Type: text/html; charset=utf-8` and `X-Powered-By: Tuvix.js`. A failed fragment shows up as an HTML comment in its slot; `render` does not reject for it. A path whose pathname contains `://` or starts with `//` resolves to `400` with the text `Bad Request`, after one warning and no fragment fetch.
- `matchApps(path)` returns the apps whose `routes` match `path` with `matchPath(pattern, path)` prefix rules. The query string and hash do not affect matching.
- `fetchAppHTML(app, path)` fetches one fragment and returns its HTML, or the error comment. It records no metrics.

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

Takes the same `ServerRendererConfig`. At creation it turns each `<tuvix-slot name="x">fallback</tuvix-slot>` into `<div id="tvx-slot-x" style="display:contents">fallback</div>` and splits the shell at the last `</body>`.

`stream(path, res, options?)`:

1. Sets `Content-Type: text/html; charset=utf-8`, `Transfer-Encoding: chunked` and `X-Powered-By: Tuvix.js`.
2. Writes the shell up to `</body>`. Each slot becomes `<div id="tvx-slot-x" style="display:contents">`, holding the paired form's inner HTML as fallback, or nothing for a self-closing `<tuvix-slot name="x" />`.
3. Fetches the matched fragments in parallel. As each one arrives, writes an inline `<script>` that parses the fragment in a `<template>` and replaces the placeholder with it. The script then re-creates each `<script>` in the fragment, one at a time in document order, copying every attribute (including `nonce`) and its text so the browser runs it. After an external script without `async`, the next one waits for its `load` or `error` event, so `<script src="/lib.js"></script><script>Lib.init()</script>` finds `Lib`. `async` scripts and data blocks (`type="application/json"`) do not hold up the rest.
4. Writes `</body></html>` (the rest of the shell) and calls `res.end()`.

The status is 200: headers go out with the shell, before any fragment is fetched. For a path whose pathname contains `://` or starts with `//`, `stream` sets `res.statusCode = 400`, writes `Bad Request` as `text/plain` and ends, without the shell. The renderer JSON-encodes fragment HTML and escapes `<`, `>`, U+2028 and U+2029, so a fragment containing `</script>` or `<!--` cannot end the inline script.

Under a Content Security Policy without `'unsafe-inline'`, pass a fresh per-response nonce as `options.nonce`. The renderer writes it as `<script nonce="...">` on every inline script. The scripts it re-creates from a fragment carry only the fragment's own `nonce` attribute, so give fragment scripts that nonce or add `'strict-dynamic'` to the policy. Without a nonce, the policy blocks the inline scripts and the placeholders keep their fallback.

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

Express/Connect-style handler. It renders `req.originalUrl ?? req.url`, so the query string and an Express mount prefix (`app.use('/shop', ...)`) are part of the path that routes match and fragment services receive. It sets the result headers with `res.set` (or `res.setHeader` per header when `set` is missing) and calls `res.status(result.statusCode).send(result.html)`. When `render` throws, it logs the error and calls `next(error)`, or sends `500 Internal Server Error` when you passed no `next`.

The middleware renders every request it receives, including paths no app matches. Mount it on the routes your shell owns, after static file handlers.

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

Calls `renderer.stream(req.originalUrl ?? req.url, res, { nonce })`, where `nonce` is `options.nonce?.(req, res)`. Read it from wherever your CSP middleware stores it, for example `res.locals.cspNonce`. On an error:

- before the first write: calls `next(error)`. Without `next`, it sends 500 through `res.status` (Express), or sets `res.statusCode = 500`, writes `Internal Server Error` and ends the response (Node `http`);
- after the first write: ends the response and does not call `next`, since the headers are already sent.

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

Replaces each `<tuvix-slot name="x">...</tuvix-slot>` or `<tuvix-slot name="x" />` whose name is an own key of `slots` with `slots[x]`. Slots without an entry stay as written. It fills every slot in one pass with a function replacer, so `$&`, `$1`, `` $` ``, `$'` and `$$` in fragment HTML stay literal and a `<tuvix-slot>` inside a fragment is not filled.

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

Scans the slot names once and returns `{ slotNames, render }`. `slotNames` lists each name once, in order of first appearance. `render(slots)` returns the same output as `composeHTML(template, slots)`. `createServerRenderer` calls it for you.

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

An in-memory collector. Pass it as `metrics` to either renderer, or call its methods yourself:

| Method | Signature | Behaviour |
| --- | --- | --- |
| `recordRender` | `(durationMs: number) => void` | Counts one render and its duration. |
| `recordFragment` | `(name: string, durationMs: number, isError: boolean) => void` | Counts one fetch for app `name`, its duration and whether it failed. |
| `toPrometheusText` | `() => string` | Prometheus text exposition format 0.0.4. |
| `reset` | `() => void` | Clears every counter. |

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

Output after one render where `header` took 12 ms and `cart` failed after 2000 ms:

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

Each metric family gets one `# HELP` and one `# TYPE` line. Labels appear on samples only, and label values escape `\`, `"` and newlines. The collector skips a family with no samples: before the first render you get only the two render totals at 0, and the four fragment families appear after the first fragment fetch. It keeps totals, averages and maximums; there are no histograms or quantiles.

### Types

| Type | Meaning |
| --- | --- |
| `ServerRendererConfig` | `{ shellTemplate, apps, timeout?, metrics? }`, options for both renderers. |
| `ServerAppConfig` | `{ name, ssrUrl, routes, timeout? }`, one app. |
| `RenderResult` | `{ html: string; statusCode: number; headers: Record<string, string> }` from `render`. |
| `StreamingResponse` | `{ write(chunk: string): void; end(): void; setHeader(name: string, value: string): void; statusCode?: number }`. Node's `ServerResponse` fits it. |
| `StreamOptions` | `{ nonce?: string }`, per-request options for `stream`. |
| `StreamingMiddlewareOptions` | `{ nonce?: (req, res) => string \| undefined }` for `createStreamingMiddleware`. |
| `MiddlewareRequest` | `{ url: string; originalUrl?: string }`, the request fields both middlewares read. |
| `StreamingMiddlewareResponse` | `StreamingResponse` plus an optional Express-style `status(code).send(body)`. |
| `CompiledTemplate` | `{ slotNames: string[]; render(slots: Record<string, string>): string }`. |
| `TuvixMetrics` | Collector interface returned by `createMetricsCollector`. |

## Edge cases

- The fragment fills the slot whose name equals the app's `name`. A matched app without a slot is fetched and its HTML discarded.
- `render` and `stream` reject a request pathname containing `://` or starting with `//` with one warning and a `400 Bad Request`. They fetch no fragment and record no fragment metrics. The check ignores the query, so `?next=https://...` passes. `fetchAppHTML` returns `<!-- SSR error: invalid path -->` for such a path. The renderer removes `..` runs and collapses repeated slashes in the pathname (not the query) before sending it to fragment services.
- Scripts in a streamed fragment run once its swap script runs, after the shell's own scripts above it. Strip `<script>` elements on the fragment service if they must stay inert.
- The renderer escapes the app name and error message in error comments, so an error text containing `-->` cannot close the comment.
- A `statusCode` of 200 can hide partial failures. Read `tuvix_fragment_errors_total` or look for `<!-- SSR error` in the HTML.

## What it does not do

- It does not render components. Each fragment service renders its own app with its framework's server renderer.
- It does not cache fragments or retry a failed fetch.
- It does not forward cookies or request headers to fragment services. It sends only `Accept: text/html`.
- It does not hydrate anything. The client-side adapters do that.
- It does not merge fragment `<head>` content (styles, meta tags) into the shell's `<head>`. Put shared assets in the shell, or use [`@tuvix.js/vite`](/packages/vite) when one Vite server renders the islands.

## Migrating from 0.4

- `createServerRenderer().render()` returns `statusCode: 502` when at least one app matched and every fragment failed. `createMiddleware` sends it. The streaming renderer still sends 200.
- A request pathname containing `://` or starting with `//` gets `400 Bad Request` from `render` and `stream`. In 0.4 every fragment failed with an error comment inside a 200 page.
- `createMiddleware` and `createStreamingMiddleware` call `next(error)` instead of `next()` when rendering throws, so Express runs your error handler.
- Routes use `matchPath`, so `/dashboard?tab=1` matches `/dashboard/*` and `/users/42#bio` matches `/users/:id`.
- `toPrometheusText()` writes one `# HELP` and one `# TYPE` line per family, with labels on samples only. The 0.4 output repeated them per app with labels in the metric name, which Prometheus rejected.
- Both middlewares render `req.originalUrl ?? req.url` instead of `req.path ?? req.url`. Fragment services receive the query string in `path`, and under `app.use('/prefix', ...)` they see the full URL with `/prefix`.
- `ssrUrl` must be absolute. A relative one now produces the error comment for that app. Query parameters in `ssrUrl` are kept instead of producing a second `?`.
- Scripts in streamed fragments now run. Strip them on the fragment service if you relied on them staying inert.
- A self-closing `<tuvix-slot name="x" />` gets a streaming placeholder too.

The 0.4 docs showed `createMiddleware({ template })`, `renderer.render({ apps, props })` and an orchestrator `hydrate: true` option. None of these exist. Pass a renderer to `createMiddleware`:

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

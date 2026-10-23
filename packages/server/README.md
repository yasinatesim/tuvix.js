# @tuvix.js/server

> Fetch micro app HTML fragments and compose them into a shell page, as one response or a BigPipe stream

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework. Full docs: [tuvix.js.org/packages/server](https://tuvix.js.org/packages/server).

You write a shell template with `<tuvix-slot name="...">` placeholders. Per request, the renderer picks the apps whose `routes` match the path (with `matchPath` from `@tuvix.js/router`), fetches their fragments in parallel over HTTP and puts each fragment where its slot was. Requires Node.js 18+ (global `fetch`).

## Installation

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

## Quick start

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

For `/cart/42?coupon=x`, the renderer calls `GET <ssrUrl>` with `path=%2Fcart%2F42%3Fcoupon%3Dx` set through `URL.searchParams` (parameters already in `ssrUrl` stay; the `#hash` is dropped) and `Accept: text/html` on both services. `ssrUrl` must be absolute. Each 2xx body replaces its `<tuvix-slot>` tag. A non-2xx status, network error, timeout or relative `ssrUrl` becomes `<!-- SSR error: <app> (<reason>) -->`. Return your app's container element from the fragment service (`<div id="cart">...</div>`) so the client adapter can hydrate it.

## API

### `createServerRenderer(config)`

Returns `{ render, matchApps, fetchAppHTML }`.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | required | HTML with `<tuvix-slot name="x">fallback</tuvix-slot>` or `<tuvix-slot name="x" />`. |
| `apps` | `ServerAppConfig[]` | required | `{ name, ssrUrl, routes, timeout? }`. `name` picks the slot; `routes` use `matchPath` prefix rules (query and hash ignored). |
| `timeout` | `number` | `5000` | Fetch timeout in ms when an app sets none. |
| `metrics` | `TuvixMetrics` | none | Collector from `createMetricsCollector()`. |

- `render(path)` resolves to `{ html, statusCode, headers }`. `statusCode` is `502` when at least one app matched and every fragment failed, otherwise `200`. Unmatched slots keep their fallback. A path whose pathname contains `://` or starts with `//` returns `400` with the text `Bad Request` and fetches nothing.
- `matchApps(path)` returns the matching apps.
- `fetchAppHTML(app, path)` fetches one fragment (or the error comment), without metrics.

### `createStreamingRenderer(config)`

Same config. Returns `{ stream, matchApps }`. `stream(path, res, { nonce? })` writes the shell up to `</body>` with `<div id="tvx-slot-x" style="display:contents">` placeholders (paired slots keep their inner HTML as fallback, self-closing slots are empty). Then it writes one inline `<script>` per fragment as it arrives: the script parses the fragment in a `<template>`, replaces the placeholder and re-creates each fragment `<script>` (all attributes including `nonce`, plus text) one at a time in document order. After an external script without `async`, the next one waits for its `load` or `error`, so `<script src="/lib.js"></script><script>Lib.init()</script>` works. `async` scripts and data blocks (`type="application/json"`) never block. The fragment is JSON-escaped so `</script>` cannot break out. Then it writes the rest of the shell. The status is 200, or 400 (`Bad Request`, no shell) for a path that names another host. `res` is a `StreamingResponse` (`write`, `end`, `setHeader`, optional `statusCode`); Node's `ServerResponse` fits.

Under a CSP without `'unsafe-inline'`, pass a fresh per-response `nonce`; the renderer puts it on its inline scripts. Fragment scripts need their own `nonce` attribute, or a policy with `'strict-dynamic'`.

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

Express/Connect handler `(req, res, next?)`. Renders `req.originalUrl ?? req.url` (query string and Express mount prefix included), sets headers with `res.set` or `res.setHeader`, sends `res.status(statusCode).send(html)`. On a throw: `next(error)`, or 500 without `next`.

### `createStreamingMiddleware(renderer, options?)`

Calls `renderer.stream(req.originalUrl ?? req.url, res, { nonce })`, with `nonce` from `options.nonce?.(req, res)` (for example `res.locals.cspNonce`). Error before the first write: `next(error)`; without `next`, `res.status(500).send()` on Express, or `statusCode = 500` plus `end()` on a Node `ServerResponse`. Error after it: ends the response, does not call `next`.

### `composeHTML(template, slots)` and `compileShellTemplate(template)`

`composeHTML` replaces each slot named in `slots` in one pass; others stay as written. `$&`, `$1` and a `<tuvix-slot>` inside fragment HTML stay literal. `compileShellTemplate` returns `{ slotNames, render(slots) }` with the names scanned once.

```ts
import { composeHTML } from '@tuvix.js/server';

composeHTML('<main><tuvix-slot name="main" /></main>', { main: '<p>Hello</p>' }); // '<main><p>Hello</p></main>'
```

### `createMetricsCollector()`

Returns `TuvixMetrics`: `recordRender(ms)`, `recordFragment(name, ms, isError)`, `toPrometheusText()`, `reset()`. Metrics: `tuvix_renders_total`, `tuvix_render_duration_ms_total` (counters), `tuvix_render_duration_ms_avg`, `tuvix_render_duration_ms_max` (gauges), and per app (`{app="..."}`) `tuvix_fragment_fetches_total`, `tuvix_fragment_errors_total`, `tuvix_fragment_avg_duration_ms`, `tuvix_fragment_max_duration_ms`. One `# HELP` and `# TYPE` per family; label values escape `\`, `"` and newlines. Serve it with `Content-Type: text/plain; version=0.0.4`.

### Types

`ServerRendererConfig`, `ServerAppConfig`, `RenderResult`, `StreamingResponse`, `StreamOptions`, `StreamingMiddlewareOptions`, `StreamingMiddlewareResponse`, `MiddlewareRequest`, `CompiledTemplate`, `TuvixMetrics`.

## Edge cases

- `render` and `stream` answer `400 Bad Request` once for a request pathname containing `://` or starting with `//`; they fetch no fragment and record no fragment metrics. The query is not checked. `fetchAppHTML` returns `<!-- SSR error: invalid path -->` for such a path. `..` runs are removed from the pathname before it goes to fragment services.
- Scripts in streamed fragments run. Strip them on the fragment service if they must stay inert.
- A matched app without a slot of the same name is fetched and its HTML discarded.

## What it does not do

- It does not render components, cache fragments, retry fetches or forward cookies and headers.
- It does not hydrate. Client adapters (`createSsrReactMicroApp` and the Vue, Svelte and Angular equivalents) do.
- It does not move fragment `<head>` content into the shell's `<head>`.

## Migrating from 0.4

- `render()` returns 502 when every matched fragment failed; `createMiddleware` sends it.
- Both middlewares call `next(error)` instead of `next()` on errors.
- Routes use `matchPath`: `/dashboard?tab=1` matches `/dashboard/*`.
- `toPrometheusText()` output is valid Prometheus text: one HELP/TYPE per family.
- Both middlewares render `req.originalUrl ?? req.url` instead of `req.path ?? req.url`.
- `ssrUrl` must be absolute; its existing query parameters are kept.
- Scripts in streamed fragments now run, and self-closing slots get a streaming placeholder.
- A request pathname containing `://` or starting with `//` gets `400 Bad Request` from `render` and `stream`.

## License

MIT

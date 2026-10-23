# @tuvix.js/server

> 获取微应用的 HTML 片段，并把它们组合到 shell 页面中，可以一次性响应，也可以用 BigPipe 流式输出

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。完整文档：[tuvix.js.org/zh/packages/server](https://tuvix.js.org/zh/packages/server)。

你编写一个带有 `<tuvix-slot name="...">` 占位符的 shell 模板。每个请求到来时，渲染器挑出 `routes` 与路径匹配的应用（使用 `@tuvix.js/router` 的 `matchPath`），通过 HTTP 并行获取它们的片段，再把每个片段放到对应 slot 的位置。需要 Node.js 18+（全局 `fetch`）。

## 安装

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

## 快速开始

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

对于 `/cart/42?coupon=x`，渲染器会对两个服务都调用 `GET <ssrUrl>`，通过 `URL.searchParams` 设置 `path=%2Fcart%2F42%3Fcoupon%3Dx`（`ssrUrl` 中已有的参数保留；`#hash` 被去掉），并带上 `Accept: text/html`。`ssrUrl` 必须是绝对地址。每个 2xx 响应体替换对应的 `<tuvix-slot>` 标签。非 2xx 状态、网络错误、超时或相对的 `ssrUrl` 会变成 `<!-- SSR error: <app> (<reason>) -->`。请让片段服务返回应用的容器元素（`<div id="cart">...</div>`），这样客户端适配器才能对它进行水合。

## API

### `createServerRenderer(config)`

返回 `{ render, matchApps, fetchAppHTML }`。

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | 必填 | 包含 `<tuvix-slot name="x">fallback</tuvix-slot>` 或 `<tuvix-slot name="x" />` 的 HTML。 |
| `apps` | `ServerAppConfig[]` | 必填 | `{ name, ssrUrl, routes, timeout? }`。`name` 选择 slot；`routes` 使用 `matchPath` 的前缀规则（忽略查询字符串和 hash）。 |
| `timeout` | `number` | `5000` | 应用没有设置时使用的获取超时时间（毫秒）。 |
| `metrics` | `TuvixMetrics` | 无 | 来自 `createMetricsCollector()` 的收集器。 |

- `render(path)` resolve 为 `{ html, statusCode, headers }`。当至少有一个应用匹配且所有片段都失败时，`statusCode` 为 `502`，否则为 `200`。未匹配的 slot 保留其回退内容（fallback）。路径名包含 `://` 或以 `//` 开头的路径会返回 `400` 和文本 `Bad Request`，不获取任何片段。
- `matchApps(path)` 返回匹配的应用。
- `fetchAppHTML(app, path)` 获取一个片段（或错误注释），不记录指标。

### `createStreamingRenderer(config)`

配置相同。返回 `{ stream, matchApps }`。`stream(path, res, { nonce? })` 先写出 shell 到 `</body>` 为止的部分，其中 slot 替换为 `<div id="tvx-slot-x" style="display:contents">` 占位符（成对的 slot 保留其内部 HTML 作为回退内容，自闭合的 slot 为空）。然后每个片段到达时写出一个内联 `<script>`：该脚本在 `<template>` 中解析片段，替换占位符，并按文档顺序逐个重新创建片段中的每个 `<script>`（包括 `nonce` 在内的所有属性，以及文本）。遇到没有 `async` 的外部脚本后，下一个脚本会等待它的 `load` 或 `error`，所以 `<script src="/lib.js"></script><script>Lib.init()</script>` 可以正常工作。`async` 脚本和数据块（`type="application/json"`）从不阻塞。片段经过 JSON 转义，所以 `</script>` 无法跳出脚本。最后写出 shell 的其余部分。状态码为 200；如果路径指向其他主机，则为 400（`Bad Request`，不输出 shell）。`res` 是一个 `StreamingResponse`（`write`、`end`、`setHeader`，可选的 `statusCode`）；Node 的 `ServerResponse` 符合要求。

在不包含 `'unsafe-inline'` 的 CSP 下，请为每个响应传入一个新的 `nonce`；渲染器会把它加到自己的内联脚本上。片段脚本需要有自己的 `nonce` 属性，或者使用带 `'strict-dynamic'` 的策略。

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

Express/Connect 处理函数 `(req, res, next?)`。渲染 `req.originalUrl ?? req.url`（包含查询字符串和 Express 挂载前缀），用 `res.set` 或 `res.setHeader` 设置响应头，通过 `res.status(statusCode).send(html)` 发送。抛错时：调用 `next(error)`；没有 `next` 时返回 500。

### `createStreamingMiddleware(renderer, options?)`

调用 `renderer.stream(req.originalUrl ?? req.url, res, { nonce })`，其中 `nonce` 来自 `options.nonce?.(req, res)`（例如 `res.locals.cspNonce`）。在第一次写入之前出错：调用 `next(error)`；没有 `next` 时，在 Express 上执行 `res.status(500).send()`，在 Node 的 `ServerResponse` 上设置 `statusCode = 500` 并调用 `end()`。在第一次写入之后出错：结束响应，不调用 `next`。

### `composeHTML(template, slots)` 和 `compileShellTemplate(template)`

`composeHTML` 一次遍历替换 `slots` 中列出的每个 slot；其余 slot 保持原样。片段 HTML 中的 `$&`、`$1` 和 `<tuvix-slot>` 按字面保留。`compileShellTemplate` 返回 `{ slotNames, render(slots) }`，slot 名称只扫描一次。

```ts
import { composeHTML } from '@tuvix.js/server';

composeHTML('<main><tuvix-slot name="main" /></main>', { main: '<p>Hello</p>' }); // '<main><p>Hello</p></main>'
```

### `createMetricsCollector()`

返回 `TuvixMetrics`：`recordRender(ms)`、`recordFragment(name, ms, isError)`、`toPrometheusText()`、`reset()`。指标：`tuvix_renders_total`、`tuvix_render_duration_ms_total`（计数器）、`tuvix_render_duration_ms_avg`、`tuvix_render_duration_ms_max`（仪表），以及按应用（`{app="..."}`）统计的 `tuvix_fragment_fetches_total`、`tuvix_fragment_errors_total`、`tuvix_fragment_avg_duration_ms`、`tuvix_fragment_max_duration_ms`。每个指标族一个 `# HELP` 和一个 `# TYPE`；标签值会转义 `\`、`"` 和换行符。请以 `Content-Type: text/plain; version=0.0.4` 提供它。

### 类型

`ServerRendererConfig`、`ServerAppConfig`、`RenderResult`、`StreamingResponse`、`StreamOptions`、`StreamingMiddlewareOptions`、`StreamingMiddlewareResponse`、`MiddlewareRequest`、`CompiledTemplate`、`TuvixMetrics`。

## 边界情况

- 请求的路径名包含 `://` 或以 `//` 开头时，`render` 和 `stream` 只返回一次 `400 Bad Request`；它们不获取任何片段，也不记录片段指标。查询字符串不做检查。对于这样的路径，`fetchAppHTML` 返回 `<!-- SSR error: invalid path -->`。路径名在发送给片段服务之前会去掉连续的 `..`。
- 流式片段中的脚本会运行。如果它们必须保持不执行，请在片段服务中去掉它们。
- 匹配到但没有同名 slot 的应用仍会被获取，其 HTML 会被丢弃。

## 它不做什么

- 它不渲染组件，不缓存片段，不重试获取，也不转发 cookie 和请求头。
- 它不进行水合。水合由客户端适配器（`createSsrReactMicroApp` 以及 Vue、Svelte 和 Angular 中的对应函数）完成。
- 它不会把片段的 `<head>` 内容移到 shell 的 `<head>` 中。

## 从 0.4 迁移

- 当所有匹配的片段都失败时，`render()` 返回 502；`createMiddleware` 会发送它。
- 出错时，两个中间件都调用 `next(error)`，不再调用 `next()`。
- 路由使用 `matchPath`：`/dashboard?tab=1` 匹配 `/dashboard/*`。
- `toPrometheusText()` 的输出是合法的 Prometheus 文本：每个指标族一个 HELP/TYPE。
- 两个中间件都渲染 `req.originalUrl ?? req.url`，不再是 `req.path ?? req.url`。
- `ssrUrl` 必须是绝对地址；其已有的查询参数会保留。
- 流式片段中的脚本现在会运行，自闭合的 slot 也会得到流式占位符。
- 路径名包含 `://` 或以 `//` 开头的请求会从 `render` 和 `stream` 得到 `400 Bad Request`。

## 许可证

MIT

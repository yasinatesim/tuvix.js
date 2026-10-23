---
title: '@tuvix.js/server'
---

<PackageHeader
  name="@tuvix.js/server"
  title="服务端"
  description="Tuvix.js 的服务端页面组合。通过 HTTP 获取每个微应用的 HTML 片段，填入 shell 模板的插槽，以单个响应或 BigPipe 流的形式返回。"
  icon="🖥️"
  npm="true"
/>

## 安装

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

这个包运行在 Node.js 18 或更高版本上，使用全局 `fetch`。它依赖 `@tuvix.js/router` 进行路由匹配。

## 何时使用

当每个微应用运行自己的渲染服务、由 shell（宿主应用）服务器拼接页面时，使用它。你编写一个带有 `<tuvix-slot name="...">` 占位符的 shell HTML 模板。对每个请求，渲染器选出 `routes` 与路径匹配的应用，并行获取它们的片段，再把每个片段放到对应插槽所在的位置。

如果你想要一个完整的 HTML 响应，并在所有片段都失败时返回 502 状态码，选择 `createServerRenderer` 搭配 `createMiddleware`。如果你想让 shell 的 `<head>` 在最慢的片段返回之前就到达浏览器，选择 `createStreamingRenderer` 搭配 `createStreamingMiddleware`。

如果由一个服务器自己渲染所有 island（例如调用 `renderVueToString` 或 React `renderToString` 的 Next.js、Astro 或 Vite SSR 应用），你不需要这个包。这种情况下如何链接 island 资源，参见 [`@tuvix.js/vite`](/zh/packages/vite)。

## 快速开始

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

对 `/cart/42?coupon=x` 的请求：

1. `header` 匹配（`'/'` 匹配所有路径），`cart` 匹配 `/cart/*`。
2. 渲染器并行发送 `GET http://header-service:3001/render?path=%2Fcart%2F42%3Fcoupon%3Dx`，并向 cart 服务发送同样的请求。中间件读取 `req.originalUrl`，所以查询字符串会传到片段服务。
3. 每个响应体替换对应的整个 `<tuvix-slot>` 元素。
4. 中间件返回状态码 200，并带上 `Content-Type: text/html; charset=utf-8` 和 `X-Powered-By: Tuvix.js`。

在 `/about` 上，只有 `header` 匹配。`cart` 插槽以 `<tuvix-slot name="cart"><p>Loading cart...</p></tuvix-slot>` 的形式保留在 HTML 中，浏览器渲染其中的回退内容（fallback）。

## 片段服务

渲染器用 `GET` 和 `Accept: text/html` 调用每个应用的 `ssrUrl`。它用 `new URL(ssrUrl)` 构建 URL，并把 `path` 查询参数设为请求的 pathname 加查询字符串，不含 `#hash`。`ssrUrl` 中已有的参数会保留：对于 `/shop?sort=asc`，`http://cart:3002/render?v=2` 变为 `http://cart:3002/render?v=2&path=%2Fshop%3Fsort%3Dasc`。2xx 响应体就是片段。其他任何状态码、网络错误、超时或相对的 `ssrUrl` 都算作失败，渲染器会在插槽中放入 `<!-- SSR error: <app> (<status or message>) -->`。

片段替换的是 `<tuvix-slot>` 标签本身，所以渲染器不会添加包裹元素。返回客户端应用挂载用的元素，这样编排器能找到容器，适配器能对它进行水合：

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

在客户端，用 `container: '#cart'` 注册应用，并用支持 SSR 的适配器（`createSsrReactMicroApp`、`createSsrVueMicroApp`、`createSsrSvelteMicroApp`、`createSsrAngularMicroApp`）构建它。适配器会对服务端标记进行水合，而不是从头渲染。

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

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | 必填 | 带有 `<tuvix-slot name="x"></tuvix-slot>` 或 `<tuvix-slot name="x" />` 占位符的页面 HTML。渲染器在创建时扫描一次插槽名称。 |
| `apps` | `ServerAppConfig[]` | 必填 | 可以在服务端渲染的应用。 |
| `timeout` | `number` | `5000` | 没有单独设置 `timeout` 的应用的获取超时时间，单位 ms。 |
| `metrics` | `TuvixMetrics` | 无 | 来自 `createMetricsCollector()` 的收集器。渲染器记录每次片段获取和每次渲染。 |

`ServerAppConfig`：

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 应用名称。片段填入同名的插槽。 |
| `ssrUrl` | `string` | 必填 | 绝对路径的片段端点。渲染器设置 `path` 查询参数，并保留 URL 中已有的参数。相对 URL 会让该应用的片段失败。 |
| `routes` | `string[]` | 必填 | [`matchPath`](/zh/packages/router#matchpath) 语法的模式，使用其默认前缀规则，与 core 的 `activeWhen` 相同：`'/'` 匹配所有路径，`'/cart'` 匹配 `/cart` 及其下的路径。路由器的 `routes` 不同：它们匹配整个路径。任一模式匹配时，应用就会渲染。 |
| `timeout` | `number` | 配置中的 `timeout` | 该应用的获取超时时间，单位 ms。超时后渲染器中止请求。 |

返回的函数：

- `render(path)` 匹配应用，并行获取所有片段，填充插槽，然后 resolve 为 `{ html, statusCode, headers }`。至少有一个应用匹配且所有片段都失败时，`statusCode` 为 `502`，否则为 `200`。`headers` 包含 `Content-Type: text/html; charset=utf-8` 和 `X-Powered-By: Tuvix.js`。失败的片段在其插槽中显示为 HTML 注释；`render` 不会因此 reject。pathname 包含 `://` 或以 `//` 开头的路径会 resolve 为 `400`，文本为 `Bad Request`，同时记录一条警告，不获取任何片段。
- `matchApps(path)` 返回 `routes` 按 `matchPath(pattern, path)` 前缀规则匹配 `path` 的应用。查询字符串和 hash 不影响匹配。
- `fetchAppHTML(app, path)` 获取一个片段并返回其 HTML 或错误注释。它不记录指标。

```ts
import { createServerRenderer } from '@tuvix.js/server';

const renderer = createServerRenderer({
  shellTemplate: '<main><tuvix-slot name="profile" /></main>',
  apps: [{ name: 'profile', ssrUrl: 'http://profile:3003/render', routes: ['/users/:id'] }],
});

const { html, statusCode } = await renderer.render('/users/42#bio');
console.log(statusCode); // 200, profile 服务失败时为 502
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

接受相同的 `ServerRendererConfig`。创建时，它把每个 `<tuvix-slot name="x">fallback</tuvix-slot>` 转换为 `<div id="tvx-slot-x" style="display:contents">fallback</div>`，并在最后一个 `</body>` 处拆分 shell。

`stream(path, res, options?)`：

1. 设置 `Content-Type: text/html; charset=utf-8`、`Transfer-Encoding: chunked` 和 `X-Powered-By: Tuvix.js`。
2. 写出 `</body>` 之前的 shell。每个插槽变为 `<div id="tvx-slot-x" style="display:contents">`，成对形式的插槽保留其内部 HTML 作为回退内容，自闭合的 `<tuvix-slot name="x" />` 则为空。
3. 并行获取匹配的片段。每个片段到达时，写出一个内联 `<script>`，它在 `<template>` 中解析片段，并用片段替换占位符。然后脚本按文档顺序逐个重新创建片段中的每个 `<script>`，复制所有属性（包括 `nonce`）和文本，让浏览器执行它。遇到没有 `async` 的外部脚本时，下一个脚本会等待它的 `load` 或 `error` 事件，所以 `<script src="/lib.js"></script><script>Lib.init()</script>` 能找到 `Lib`。`async` 脚本和数据块（`type="application/json"`）不会阻塞其余脚本。
4. 写出 `</body></html>`（shell 的剩余部分）并调用 `res.end()`。

状态码为 200：响应头随 shell 一起发出，早于任何片段的获取。对于 pathname 包含 `://` 或以 `//` 开头的路径，`stream` 设置 `res.statusCode = 400`，以 `text/plain` 写出 `Bad Request` 并结束响应，不输出 shell。渲染器对片段 HTML 做 JSON 编码，并转义 `<`、`>`、U+2028 和 U+2029，所以包含 `</script>` 或 `<!--` 的片段无法提前结束内联脚本。

在不含 `'unsafe-inline'` 的内容安全策略（CSP）下，把每个响应新生成的 nonce 作为 `options.nonce` 传入。渲染器把它写成每个内联脚本上的 `<script nonce="...">`。它从片段中重新创建的脚本只带有片段自己的 `nonce` 属性，所以要给片段脚本加上这个 nonce，或在策略中加入 `'strict-dynamic'`。没有 nonce 时，策略会阻止这些内联脚本，占位符保留回退内容。

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

Express/Connect 风格的处理函数。它渲染 `req.originalUrl ?? req.url`，所以查询字符串和 Express 挂载前缀（`app.use('/shop', ...)`）都属于路由匹配和片段服务接收的路径。它用 `res.set` 设置结果响应头（没有 `set` 时对每个响应头调用 `res.setHeader`），并调用 `res.status(result.statusCode).send(result.html)`。`render` 抛出异常时，它记录错误并调用 `next(error)`；如果你没有传入 `next`，则发送 `500 Internal Server Error`。

中间件会渲染它收到的每个请求，包括没有应用匹配的路径。把它挂载在 shell 负责的路由上，放在静态文件处理函数之后。

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

调用 `renderer.stream(req.originalUrl ?? req.url, res, { nonce })`，其中 `nonce` 为 `options.nonce?.(req, res)`。从你的 CSP 中间件存放 nonce 的位置读取它，例如 `res.locals.cspNonce`。出错时：

- 在第一次写入之前：调用 `next(error)`。没有 `next` 时，它通过 `res.status` 发送 500（Express），或者设置 `res.statusCode = 500`，写出 `Internal Server Error` 并结束响应（Node `http`）；
- 在第一次写入之后：结束响应，不调用 `next`，因为响应头已经发出。

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

把每个名称是 `slots` 自有键的 `<tuvix-slot name="x">...</tuvix-slot>` 或 `<tuvix-slot name="x" />` 替换为 `slots[x]`。没有对应条目的插槽保持原样。它用函数替换器一次性填充所有插槽，所以片段 HTML 中的 `$&`、`$1`、`` $` ``、`$'` 和 `$$` 按字面保留，片段内部的 `<tuvix-slot>` 也不会被填充。

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

扫描一次插槽名称，并返回 `{ slotNames, render }`。`slotNames` 按首次出现的顺序列出每个名称，每个名称只出现一次。`render(slots)` 的输出与 `composeHTML(template, slots)` 相同。`createServerRenderer` 会替你调用它。

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

一个内存中的收集器。把它作为 `metrics` 传给任一渲染器，或者自己调用它的方法：

| 方法 | 签名 | 行为 |
| --- | --- | --- |
| `recordRender` | `(durationMs: number) => void` | 记录一次渲染及其耗时。 |
| `recordFragment` | `(name: string, durationMs: number, isError: boolean) => void` | 记录应用 `name` 的一次获取、其耗时以及是否失败。 |
| `toPrometheusText` | `() => string` | Prometheus 文本暴露格式 0.0.4。 |
| `reset` | `() => void` | 清空所有计数器。 |

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

一次渲染后的输出，其中 `header` 耗时 12 ms，`cart` 在 2000 ms 后失败：

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

每个指标族只有一行 `# HELP` 和一行 `# TYPE`。标签只出现在样本上，标签值会转义 `\`、`"` 和换行符。收集器会跳过没有样本的指标族：第一次渲染之前，你只会得到两个值为 0 的渲染总数，四个片段指标族在第一次片段获取之后出现。它保存总数、平均值和最大值；没有直方图或分位数。

### 类型

| 类型 | 含义 |
| --- | --- |
| `ServerRendererConfig` | `{ shellTemplate, apps, timeout?, metrics? }`，两种渲染器共用的选项。 |
| `ServerAppConfig` | `{ name, ssrUrl, routes, timeout? }`，一个应用。 |
| `RenderResult` | `render` 返回的 `{ html: string; statusCode: number; headers: Record<string, string> }`。 |
| `StreamingResponse` | `{ write(chunk: string): void; end(): void; setHeader(name: string, value: string): void; statusCode?: number }`。Node 的 `ServerResponse` 符合它。 |
| `StreamOptions` | `{ nonce?: string }`，`stream` 的单次请求选项。 |
| `StreamingMiddlewareOptions` | `{ nonce?: (req, res) => string \| undefined }`，用于 `createStreamingMiddleware`。 |
| `MiddlewareRequest` | `{ url: string; originalUrl?: string }`，两个中间件读取的请求字段。 |
| `StreamingMiddlewareResponse` | `StreamingResponse` 加上可选的 Express 风格 `status(code).send(body)`。 |
| `CompiledTemplate` | `{ slotNames: string[]; render(slots: Record<string, string>): string }`。 |
| `TuvixMetrics` | `createMetricsCollector` 返回的收集器接口。 |

## 边界情况

- 片段填入名称与应用 `name` 相同的插槽。匹配到但没有对应插槽的应用仍会被获取，其 HTML 会被丢弃。
- `render` 和 `stream` 会拒绝包含 `://` 或以 `//` 开头的请求 pathname，记录一条警告并返回 `400 Bad Request`。它们不获取任何片段，也不记录片段指标。这项检查忽略查询字符串，所以 `?next=https://...` 可以通过。对于这样的路径，`fetchAppHTML` 返回 `<!-- SSR error: invalid path -->`。渲染器在把 pathname（不含查询字符串）发送给片段服务之前，会移除 `..` 序列并合并重复的斜杠。
- 流式片段中的脚本在其替换脚本运行时执行，晚于位于它上方的 shell 自身脚本。如果这些脚本必须保持不执行，在片段服务上去掉 `<script>` 元素。
- 渲染器会转义错误注释中的应用名称和错误信息，所以包含 `-->` 的错误文本无法关闭注释。
- `statusCode` 为 200 时可能掩盖部分失败。查看 `tuvix_fragment_errors_total`，或在 HTML 中查找 `<!-- SSR error`。

## 它不做什么

- 它不渲染组件。每个片段服务用自己框架的服务端渲染器渲染自己的应用。
- 它不缓存片段，也不重试失败的获取。
- 它不向片段服务转发 cookie 或请求头。它只发送 `Accept: text/html`。
- 它不做任何水合。水合由客户端适配器完成。
- 它不把片段的 `<head>` 内容（样式、meta 标签）合并到 shell 的 `<head>` 中。把共享资源放在 shell 中；如果由一个 Vite 服务器渲染 island，使用 [`@tuvix.js/vite`](/zh/packages/vite)。

## 从 0.4 迁移

- 至少有一个应用匹配且所有片段都失败时，`createServerRenderer().render()` 返回 `statusCode: 502`。`createMiddleware` 会发送它。流式渲染器仍然发送 200。
- pathname 包含 `://` 或以 `//` 开头的请求会从 `render` 和 `stream` 得到 `400 Bad Request`。在 0.4 中，所有片段都会失败，并在 200 页面中留下错误注释。
- 渲染抛出异常时，`createMiddleware` 和 `createStreamingMiddleware` 调用 `next(error)` 而不是 `next()`，所以 Express 会运行你的错误处理函数。
- 路由使用 `matchPath`，所以 `/dashboard?tab=1` 匹配 `/dashboard/*`，`/users/42#bio` 匹配 `/users/:id`。
- `toPrometheusText()` 对每个指标族只写一行 `# HELP` 和一行 `# TYPE`，标签只出现在样本上。0.4 的输出会为每个应用重复这些行，并把标签放在指标名中，Prometheus 会拒绝这种格式。
- 两个中间件都渲染 `req.originalUrl ?? req.url`，而不是 `req.path ?? req.url`。片段服务会在 `path` 中收到查询字符串；在 `app.use('/prefix', ...)` 下，它们看到的是带 `/prefix` 的完整 URL。
- `ssrUrl` 必须是绝对 URL。相对 URL 现在会为该应用生成错误注释。`ssrUrl` 中的查询参数会保留，不再产生第二个 `?`。
- 流式片段中的脚本现在会执行。如果你依赖它们保持不执行，在片段服务上去掉它们。
- 自闭合的 `<tuvix-slot name="x" />` 现在也会得到流式占位符。

0.4 文档展示了 `createMiddleware({ template })`、`renderer.render({ apps, props })` 和编排器的 `hydrate: true` 选项。这些都不存在。请向 `createMiddleware` 传入一个渲染器：

```ts
import { createServerRenderer, createMiddleware } from '@tuvix.js/server';

declare const shellTemplate: string;

// 0.4 文档 (从未生效): createMiddleware({ template: './index.html' })
const middleware = createMiddleware(
  createServerRenderer({
    shellTemplate,
    apps: [{ name: 'main', ssrUrl: 'http://main:3001/render', routes: ['/'] }],
  })
);
```

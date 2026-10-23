---
title: '@tuvix.js/server'
---

<PackageHeader
  name="@tuvix.js/server"
  title="सर्वर"
  description="Tuvix.js के लिए सर्वर-साइड पेज composition। हर माइक्रो ऐप का HTML fragment HTTP से fetch करें और shell template के slots भरें, एक response के रूप में या BigPipe stream के रूप में।"
  icon="🖥️"
  npm="true"
/>

## इंस्टॉलेशन {#installation}

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

यह पैकेज Node.js 18 या उसके बाद के वर्ज़न पर चलता है और global `fetch` इस्तेमाल करता है। Route matching के लिए यह `@tuvix.js/router` पर निर्भर है।

## इसे कब इस्तेमाल करें {#when-to-use-it}

इसे तब इस्तेमाल करें जब हर माइक्रो ऐप अपनी render service चलाता है और एक shell सर्वर पेज को जोड़ता है। आप `<tuvix-slot name="...">` placeholders वाला एक shell HTML template लिखते हैं। हर request के लिए renderer वे ऐप्स चुनता है जिनके `routes` path से match होते हैं, उनके fragments parallel में fetch करता है, और हर fragment को उसके slot की जगह रख देता है।

जब आपको एक पूरा HTML response चाहिए, और हर fragment fail होने पर 502 status चाहिए, तब `createMiddleware` के साथ `createServerRenderer` चुनें। जब आप चाहते हैं कि सबसे धीमा fragment लौटने से पहले shell का `<head>` ब्राउज़र तक पहुँच जाए, तब `createStreamingMiddleware` के साथ `createStreamingRenderer` चुनें।

अगर एक ही सर्वर हर island खुद रेंडर करता है (जैसे `renderVueToString` या React का `renderToString` कॉल करने वाला Next.js, Astro या Vite SSR ऐप), तो आपको इस पैकेज की ज़रूरत नहीं है। उस setup में island assets जोड़ने के लिए [`@tuvix.js/vite`](/hi/packages/vite) देखें।

## क्विक स्टार्ट {#quick-start}

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

`/cart/42?coupon=x` के लिए एक request:

1. `header` match होता है (`'/'` हर path से match होता है) और `cart` `/cart/*` से match होता है।
2. Renderer `GET http://header-service:3001/render?path=%2Fcart%2F42%3Fcoupon%3Dx` भेजता है और यही request cart service को भी, parallel में। Middleware `req.originalUrl` पढ़ता है, इसलिए query string fragment services तक पहुँचती है।
3. हर response body अपने पूरे `<tuvix-slot>` element की जगह ले लेती है।
4. Middleware `Content-Type: text/html; charset=utf-8` और `X-Powered-By: Tuvix.js` के साथ status 200 भेजता है।

`/about` पर सिर्फ़ `header` match होता है। `cart` slot HTML में `<tuvix-slot name="cart"><p>Loading cart...</p></tuvix-slot>` के रूप में बना रहता है, और ब्राउज़र उसका fallback content रेंडर करता है।

## Fragment services {#fragment-services}

Renderer हर ऐप के `ssrUrl` को `GET` और `Accept: text/html` के साथ कॉल करता है। यह `new URL(ssrUrl)` से URL बनाता है और `path` search parameter में request का pathname और query रखता है, `#hash` के बिना। `ssrUrl` में पहले से मौजूद parameters बने रहते हैं: `/shop?sort=asc` के लिए `http://cart:3002/render?v=2` `http://cart:3002/render?v=2&path=%2Fshop%3Fsort%3Dasc` बन जाता है। 2xx response की body ही fragment है। कोई दूसरा status, network एरर, timeout या relative `ssrUrl` failure माना जाता है, और renderer slot में `<!-- SSR error: <app> (<status or message>) -->` रख देता है।

Fragment खुद `<tuvix-slot>` tag की जगह लेता है, इसलिए renderer कोई wrapper element नहीं जोड़ता। वह element लौटाएँ जिसमें आपका क्लाइंट-साइड ऐप mount होता है, ताकि orchestrator container ढूँढ सके और adapter उसे hydrate कर सके:

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

क्लाइंट पर ऐप को `container: '#cart'` के साथ register करें और उसे SSR-aware adapter (`createSsrReactMicroApp`, `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`) से build करें। Adapter शुरू से रेंडर करने की जगह सर्वर markup को hydrate करता है।

## API {#api}

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

| विकल्प | Type | Default | मतलब |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | ज़रूरी | `<tuvix-slot name="x"></tuvix-slot>` या `<tuvix-slot name="x" />` placeholders वाला पेज HTML। Renderer slot नाम एक बार, बनाते समय scan करता है। |
| `apps` | `ServerAppConfig[]` | ज़रूरी | वे ऐप्स जो सर्वर पर रेंडर हो सकते हैं। |
| `timeout` | `number` | `5000` | जिन ऐप्स का अपना `timeout` नहीं है, उनके लिए ms में fetch timeout। |
| `metrics` | `TuvixMetrics` | कोई नहीं | `createMetricsCollector()` से मिला collector। Renderer हर fragment fetch और हर render दर्ज करता है। |

`ServerAppConfig`:

| विकल्प | Type | Default | मतलब |
| --- | --- | --- | --- |
| `name` | `string` | ज़रूरी | ऐप का नाम। Fragment उसी नाम वाले slot को भरता है। |
| `ssrUrl` | `string` | ज़रूरी | Absolute fragment endpoint। Renderer `path` search parameter सेट करता है और URL में पहले से मौजूद parameters रखता है। Relative URL होने पर उस ऐप का fragment fail होता है। |
| `routes` | `string[]` | ज़रूरी | [`matchPath`](/hi/packages/router#matchpath) syntax में patterns, उसके default prefix नियमों के साथ, core `activeWhen` की तरह: `'/'` हर path से match होता है और `'/cart'` `/cart` और उसके नीचे से match होता है। राउटर `routes` अलग हैं: वे पूरे path से match होते हैं। कोई भी pattern match होने पर ऐप रेंडर होता है। |
| `timeout` | `number` | config `timeout` | इस ऐप के लिए ms में fetch timeout। समय खत्म होने पर renderer request abort कर देता है। |

लौटाए गए functions:

- `render(path)` ऐप्स match करता है, हर fragment parallel में fetch करता है, slots भरता है और `{ html, statusCode, headers }` पर resolve होता है। कम से कम एक ऐप match होने और हर fragment fail होने पर `statusCode` `502` होता है, नहीं तो `200`। `headers` में `Content-Type: text/html; charset=utf-8` और `X-Powered-By: Tuvix.js` होते हैं। Fail हुआ fragment अपने slot में HTML comment के रूप में दिखता है। उसकी वजह से `render` reject नहीं होता। जिस path के pathname में `://` हो या जो `//` से शुरू हो, वह एक warning के बाद, बिना किसी fragment fetch के, `Bad Request` text के साथ `400` पर resolve होता है।
- `matchApps(path)` वे ऐप्स लौटाता है जिनके `routes` `matchPath(pattern, path)` prefix नियमों से `path` से match होते हैं। Query string और hash matching पर असर नहीं डालते।
- `fetchAppHTML(app, path)` एक fragment fetch करता है और उसका HTML, या एरर comment लौटाता है। यह कोई metrics दर्ज नहीं करता।

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

यह वही `ServerRendererConfig` लेता है। बनाते समय यह हर `<tuvix-slot name="x">fallback</tuvix-slot>` को `<div id="tvx-slot-x" style="display:contents">fallback</div>` में बदलता है और shell को आखिरी `</body>` पर दो हिस्सों में बाँटता है।

`stream(path, res, options?)`:

1. `Content-Type: text/html; charset=utf-8`, `Transfer-Encoding: chunked` और `X-Powered-By: Tuvix.js` सेट करता है।
2. Shell को `</body>` तक लिखता है। हर slot `<div id="tvx-slot-x" style="display:contents">` बन जाता है, जिसमें fallback के रूप में paired form का inner HTML होता है, या self-closing `<tuvix-slot name="x" />` के लिए कुछ नहीं।
3. Match हुए fragments parallel में fetch करता है। हर fragment आने पर एक inline `<script>` लिखता है जो fragment को `<template>` में parse करता है और placeholder को उससे बदल देता है। फिर script fragment के हर `<script>` को document के क्रम में एक-एक करके दोबारा बनाती है, हर attribute (`nonce` समेत) और उसका text copy करके, ताकि ब्राउज़र उसे चलाए। `async` के बिना वाली external script के बाद अगली script उसके `load` या `error` event का इंतज़ार करती है, इसलिए `<script src="/lib.js"></script><script>Lib.init()</script>` को `Lib` मिल जाता है। `async` scripts और data blocks (`type="application/json"`) बाकी scripts को नहीं रोकते।
4. `</body></html>` (shell का बाकी हिस्सा) लिखता है और `res.end()` कॉल करता है।

Status 200 होता है: headers shell के साथ, किसी भी fragment के fetch होने से पहले चले जाते हैं। जिस path के pathname में `://` हो या जो `//` से शुरू हो, उसके लिए `stream` `res.statusCode = 400` सेट करता है, `Bad Request` को `text/plain` के रूप में लिखता है और response खत्म कर देता है, shell के बिना। Renderer fragment HTML को JSON-encode करता है और `<`, `>`, U+2028 और U+2029 को escape करता है, ताकि `</script>` या `<!--` वाला fragment inline script को खत्म न कर सके।

`'unsafe-inline'` के बिना वाली Content Security Policy में हर response के लिए एक नया nonce `options.nonce` के रूप में दें। Renderer इसे हर inline script पर `<script nonce="...">` के रूप में लिखता है। Fragment से दोबारा बनाई गई scripts पर सिर्फ़ fragment का अपना `nonce` attribute होता है, इसलिए fragment scripts को वही nonce दें या policy में `'strict-dynamic'` जोड़ें। Nonce के बिना policy inline scripts को block करती है, और placeholders में उनका fallback बना रहता है।

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

Express/Connect-style handler। यह `req.originalUrl ?? req.url` रेंडर करता है, इसलिए query string और Express mount prefix (`app.use('/shop', ...)`) उस path का हिस्सा होते हैं जिससे routes match होते हैं और जो fragment services को मिलता है। यह नतीजे के headers `res.set` से सेट करता है (या `set` न होने पर हर header के लिए `res.setHeader` से) और `res.status(result.statusCode).send(result.html)` कॉल करता है। जब `render` throw करता है, तो यह एरर log करता है और `next(error)` कॉल करता है, या आपने `next` नहीं दिया हो तो `500 Internal Server Error` भेजता है।

Middleware उसे मिलने वाली हर request रेंडर करता है, उन paths समेत जिनसे कोई ऐप match नहीं होता। इसे static file handlers के बाद, उन routes पर mount करें जो आपके shell के हैं।

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

`renderer.stream(req.originalUrl ?? req.url, res, { nonce })` कॉल करता है, जहाँ `nonce` का मान `options.nonce?.(req, res)` है। इसे वहाँ से पढ़ें जहाँ आपका CSP middleware इसे रखता है, जैसे `res.locals.cspNonce`। एरर होने पर:

- पहली write से पहले: `next(error)` कॉल करता है। `next` न होने पर यह `res.status` से 500 भेजता है (Express), या `res.statusCode = 500` सेट करता है, `Internal Server Error` लिखता है और response खत्म करता है (Node `http`);
- पहली write के बाद: response खत्म करता है और `next` कॉल नहीं करता, क्योंकि headers पहले ही भेजे जा चुके हैं।

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

हर उस `<tuvix-slot name="x">...</tuvix-slot>` या `<tuvix-slot name="x" />` को `slots[x]` से बदलता है जिसका नाम `slots` की own key है। जिन slots की entry नहीं है, वे जैसे लिखे हैं वैसे ही रहते हैं। यह function replacer से एक ही pass में हर slot भरता है, इसलिए fragment HTML में `$&`, `$1`, `` $` ``, `$'` और `$$` शब्दशः रहते हैं और fragment के अंदर का `<tuvix-slot>` नहीं भरा जाता।

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

Slot नाम एक बार scan करता है और `{ slotNames, render }` लौटाता है। `slotNames` में हर नाम एक बार आता है, पहली बार दिखने के क्रम में। `render(slots)` `composeHTML(template, slots)` जैसा ही output लौटाता है। `createServerRenderer` इसे आपके लिए कॉल करता है।

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

एक in-memory collector। इसे किसी भी renderer को `metrics` के रूप में दें, या इसके methods खुद कॉल करें:

| Method | Signature | व्यवहार |
| --- | --- | --- |
| `recordRender` | `(durationMs: number) => void` | एक render और उसकी duration गिनता है। |
| `recordFragment` | `(name: string, durationMs: number, isError: boolean) => void` | ऐप `name` के लिए एक fetch, उसकी duration और वह fail हुआ या नहीं, यह गिनता है। |
| `toPrometheusText` | `() => string` | Prometheus text exposition format 0.0.4। |
| `reset` | `() => void` | हर counter साफ़ करता है। |

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

एक render के बाद का output, जिसमें `header` ने 12 ms लिए और `cart` 2000 ms के बाद fail हुआ:

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

हर metric family को एक `# HELP` और एक `# TYPE` line मिलती है। Labels सिर्फ़ samples पर आते हैं, और label values में `\`, `"` और newlines escape होते हैं। Collector बिना samples वाली family छोड़ देता है: पहले render से पहले आपको सिर्फ़ 0 पर दो render totals मिलते हैं, और चारों fragment families पहले fragment fetch के बाद दिखती हैं। यह totals, averages और maximums रखता है। इसमें histograms या quantiles नहीं हैं।

### Types {#types}

| Type | मतलब |
| --- | --- |
| `ServerRendererConfig` | `{ shellTemplate, apps, timeout?, metrics? }`, दोनों renderers के विकल्प। |
| `ServerAppConfig` | `{ name, ssrUrl, routes, timeout? }`, एक ऐप। |
| `RenderResult` | `render` से मिलने वाला `{ html: string; statusCode: number; headers: Record<string, string> }`। |
| `StreamingResponse` | `{ write(chunk: string): void; end(): void; setHeader(name: string, value: string): void; statusCode?: number }`। Node का `ServerResponse` इसमें फ़िट होता है। |
| `StreamOptions` | `{ nonce?: string }`, `stream` के लिए हर request के विकल्प। |
| `StreamingMiddlewareOptions` | `createStreamingMiddleware` के लिए `{ nonce?: (req, res) => string \| undefined }`। |
| `MiddlewareRequest` | `{ url: string; originalUrl?: string }`, request के वे fields जो दोनों middlewares पढ़ते हैं। |
| `StreamingMiddlewareResponse` | `StreamingResponse` और साथ में एक optional Express-style `status(code).send(body)`। |
| `CompiledTemplate` | `{ slotNames: string[]; render(slots: Record<string, string>): string }`। |
| `TuvixMetrics` | `createMetricsCollector` से मिलने वाला collector interface। |

## Edge cases {#edge-cases}

- Fragment उस slot को भरता है जिसका नाम ऐप के `name` के बराबर है। Slot के बिना match हुए ऐप को renderer fetch करता है और उसका HTML छोड़ देता है।
- `render` और `stream` ऐसे request pathname को एक warning और `400 Bad Request` के साथ reject करते हैं जिसमें `://` हो या जो `//` से शुरू हो। वे कोई fragment fetch नहीं करते और कोई fragment metrics दर्ज नहीं करते। यह जाँच query को अनदेखा करती है, इसलिए `?next=https://...` पास हो जाता है। ऐसे path के लिए `fetchAppHTML` `<!-- SSR error: invalid path -->` लौटाता है। Fragment services को भेजने से पहले renderer pathname (query नहीं) से `..` runs हटाता है और दोहराए गए slashes को एक कर देता है।
- Streamed fragment की scripts तब चलती हैं जब उसकी swap script चलती है, यानी ऊपर की shell scripts के बाद। अगर उन्हें inert रहना है, तो fragment service पर ही `<script>` elements हटा दें।
- Renderer एरर comments में ऐप का नाम और एरर message escape करता है, ताकि `-->` वाला एरर text comment को बंद न कर सके।
- 200 वाला `statusCode` आंशिक failures छिपा सकता है। `tuvix_fragment_errors_total` पढ़ें या HTML में `<!-- SSR error` खोजें।

## यह क्या नहीं करता {#what-it-does-not-do}

- यह कंपोनेंट रेंडर नहीं करता। हर fragment service अपने फ्रेमवर्क के server renderer से अपना ऐप रेंडर करती है।
- यह fragments cache नहीं करता और fail हुए fetch को retry नहीं करता।
- यह cookies या request headers fragment services को आगे नहीं भेजता। यह सिर्फ़ `Accept: text/html` भेजता है।
- यह कुछ भी hydrate नहीं करता। यह काम क्लाइंट-साइड adapters करते हैं।
- यह fragment के `<head>` content (styles, meta tags) को shell के `<head>` में merge नहीं करता। साझा assets shell में रखें, या जब एक Vite सर्वर islands रेंडर करता है, तब [`@tuvix.js/vite`](/hi/packages/vite) इस्तेमाल करें।

## 0.4 से माइग्रेशन {#migrating-from-0-4}

- कम से कम एक ऐप match होने और हर fragment fail होने पर `createServerRenderer().render()` `statusCode: 502` लौटाता है। `createMiddleware` इसे भेजता है। Streaming renderer अब भी 200 भेजता है।
- जिस request pathname में `://` हो या जो `//` से शुरू हो, उसे `render` और `stream` से `400 Bad Request` मिलता है। 0.4 में हर fragment 200 वाले पेज के अंदर एरर comment के साथ fail होता था।
- Rendering throw होने पर `createMiddleware` और `createStreamingMiddleware` `next()` की जगह `next(error)` कॉल करते हैं, ताकि Express आपका error handler चलाए।
- Routes `matchPath` इस्तेमाल करते हैं, इसलिए `/dashboard?tab=1` `/dashboard/*` से match होता है और `/users/42#bio` `/users/:id` से match होता है।
- `toPrometheusText()` हर family के लिए एक `# HELP` और एक `# TYPE` line लिखता है, labels सिर्फ़ samples पर। 0.4 का output इन्हें हर ऐप के लिए दोहराता था और labels metric नाम में रखता था, जिसे Prometheus reject करता था।
- दोनों middlewares `req.path ?? req.url` की जगह `req.originalUrl ?? req.url` रेंडर करते हैं। Fragment services को `path` में query string मिलती है, और `app.use('/prefix', ...)` के नीचे उन्हें `/prefix` समेत पूरा URL दिखता है।
- `ssrUrl` absolute होना चाहिए। Relative `ssrUrl` अब उस ऐप के लिए एरर comment बनाता है। `ssrUrl` में मौजूद query parameters दूसरा `?` बनाने की जगह बने रहते हैं।
- Streamed fragments की scripts अब चलती हैं। अगर आप उनके inert रहने पर निर्भर थे, तो उन्हें fragment service पर हटा दें।
- Self-closing `<tuvix-slot name="x" />` को भी streaming placeholder मिलता है।

0.4 docs में `createMiddleware({ template })`, `renderer.render({ apps, props })` और orchestrator का `hydrate: true` विकल्प दिखाया गया था। इनमें से कोई मौजूद नहीं है। `createMiddleware` को एक renderer दें:

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

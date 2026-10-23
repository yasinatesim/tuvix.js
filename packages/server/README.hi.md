# @tuvix.js/server

> माइक्रो ऐप के HTML fragments fetch करें और उन्हें एक shell पेज में जोड़ें, एक response के रूप में या BigPipe stream के रूप में

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा। पूरे docs: [tuvix.js.org/hi/packages/server](https://tuvix.js.org/hi/packages/server)।

आप `<tuvix-slot name="...">` placeholders के साथ एक shell template लिखते हैं। हर request पर renderer उन ऐप्स को चुनता है जिनके `routes` path से match करते हैं (`@tuvix.js/router` के `matchPath` से), HTTP पर उनके fragments parallel में fetch करता है और हर fragment को उसके slot की जगह रख देता है। Node.js 18+ (global `fetch`) ज़रूरी है।

## इंस्टॉलेशन

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

## क्विक स्टार्ट

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

`/cart/42?coupon=x` के लिए renderer दोनों services पर `GET <ssrUrl>` call करता है, जिसमें `URL.searchParams` के ज़रिए `path=%2Fcart%2F42%3Fcoupon%3Dx` सेट होता है (`ssrUrl` में पहले से मौजूद parameters बने रहते हैं; `#hash` हटा दिया जाता है) और `Accept: text/html` भेजा जाता है। `ssrUrl` absolute होना चाहिए। हर 2xx body अपने `<tuvix-slot>` tag की जगह लेती है। non-2xx status, network एरर, timeout या relative `ssrUrl` का नतीजा `<!-- SSR error: <app> (<reason>) -->` होता है। fragment service से अपने ऐप का container element लौटाएँ (`<div id="cart">...</div>`), ताकि क्लाइंट adapter उसे hydrate कर सके।

## API

### `createServerRenderer(config)`

`{ render, matchApps, fetchAppHTML }` लौटाता है।

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | ज़रूरी | `<tuvix-slot name="x">fallback</tuvix-slot>` या `<tuvix-slot name="x" />` वाला HTML। |
| `apps` | `ServerAppConfig[]` | ज़रूरी | `{ name, ssrUrl, routes, timeout? }`। `name` slot चुनता है; `routes` `matchPath` के prefix नियमों का इस्तेमाल करते हैं (query और hash अनदेखे)। |
| `timeout` | `number` | `5000` | ms में fetch timeout, जब ऐप ख़ुद कोई timeout सेट न करे। |
| `metrics` | `TuvixMetrics` | कोई नहीं | `createMetricsCollector()` से मिला collector। |

- `render(path)` `{ html, statusCode, headers }` पर resolve होता है। जब कम से कम एक ऐप match हुआ हो और हर fragment fail हुआ हो, तो `statusCode` `502` होता है, वरना `200`। जिन slots से कोई match नहीं हुआ, उनका fallback बना रहता है। जिस path के pathname में `://` हो या जो `//` से शुरू हो, वह `Bad Request` text के साथ `400` लौटाता है और कुछ भी fetch नहीं करता।
- `matchApps(path)` match करने वाले ऐप्स लौटाता है।
- `fetchAppHTML(app, path)` एक fragment (या एरर comment) fetch करता है, metrics के बिना।

### `createStreamingRenderer(config)`

वही config। `{ stream, matchApps }` लौटाता है। `stream(path, res, { nonce? })` shell को `</body>` तक `<div id="tvx-slot-x" style="display:contents">` placeholders के साथ लिखता है (paired slots अपने inner HTML को fallback के रूप में रखते हैं, self-closing slots ख़ाली रहते हैं)। फिर हर fragment के आते ही उसके लिए एक inline `<script>` लिखता है: script fragment को एक `<template>` में parse करती है, placeholder को बदलती है और fragment की हर `<script>` को (`nonce` समेत सभी attributes, साथ में text) document के क्रम में एक-एक करके दोबारा बनाती है। `async` के बिना वाली external script के बाद अगली script उसके `load` या `error` का इंतज़ार करती है, इसलिए `<script src="/lib.js"></script><script>Lib.init()</script>` काम करता है। `async` scripts और data blocks (`type="application/json"`) कभी नहीं रोकते। fragment JSON-escaped होता है, ताकि `</script>` बाहर न निकल सके। फिर यह shell का बाकी हिस्सा लिखता है। status 200 होता है, या किसी दूसरे host का नाम लेने वाले path के लिए 400 (`Bad Request`, shell के बिना)। `res` एक `StreamingResponse` है (`write`, `end`, `setHeader`, optional `statusCode`); Node का `ServerResponse` इसमें फ़िट होता है।

`'unsafe-inline'` के बिना वाली CSP में हर response के लिए एक नया `nonce` दें; renderer इसे अपनी inline scripts पर लगाता है। fragment scripts को अपना `nonce` attribute चाहिए, या `'strict-dynamic'` वाली policy।

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

Express/Connect handler `(req, res, next?)`। `req.originalUrl ?? req.url` (query string और Express mount prefix समेत) रेंडर करता है, `res.set` या `res.setHeader` से headers सेट करता है, और `res.status(statusCode).send(html)` भेजता है। throw होने पर: `next(error)`, या `next` न हो तो 500।

### `createStreamingMiddleware(renderer, options?)`

`renderer.stream(req.originalUrl ?? req.url, res, { nonce })` call करता है, जिसमें `nonce` `options.nonce?.(req, res)` से आता है (जैसे `res.locals.cspNonce`)। पहले write से पहले एरर: `next(error)`; `next` न हो तो Express पर `res.status(500).send()`, या Node `ServerResponse` पर `statusCode = 500` और `end()`। उसके बाद एरर: response ख़त्म कर देता है, `next` call नहीं करता।

### `composeHTML(template, slots)` और `compileShellTemplate(template)`

`composeHTML` `slots` में नामित हर slot को एक ही pass में बदलता है; बाकी जैसे लिखे हैं वैसे रहते हैं। fragment HTML के अंदर `$&`, `$1` और `<tuvix-slot>` literal रहते हैं। `compileShellTemplate` `{ slotNames, render(slots) }` लौटाता है, जिसमें नाम एक बार scan होते हैं।

```ts
import { composeHTML } from '@tuvix.js/server';

composeHTML('<main><tuvix-slot name="main" /></main>', { main: '<p>Hello</p>' }); // '<main><p>Hello</p></main>'
```

### `createMetricsCollector()`

`TuvixMetrics` लौटाता है: `recordRender(ms)`, `recordFragment(name, ms, isError)`, `toPrometheusText()`, `reset()`। Metrics: `tuvix_renders_total`, `tuvix_render_duration_ms_total` (counters), `tuvix_render_duration_ms_avg`, `tuvix_render_duration_ms_max` (gauges), और हर ऐप के लिए (`{app="..."}`) `tuvix_fragment_fetches_total`, `tuvix_fragment_errors_total`, `tuvix_fragment_avg_duration_ms`, `tuvix_fragment_max_duration_ms`। हर family के लिए एक `# HELP` और एक `# TYPE`; label values में `\`, `"` और newlines escape होते हैं। इसे `Content-Type: text/plain; version=0.0.4` के साथ serve करें।

### Types

`ServerRendererConfig`, `ServerAppConfig`, `RenderResult`, `StreamingResponse`, `StreamOptions`, `StreamingMiddlewareOptions`, `StreamingMiddlewareResponse`, `MiddlewareRequest`, `CompiledTemplate`, `TuvixMetrics`।

## Edge cases

- जिस request pathname में `://` हो या जो `//` से शुरू हो, उसके लिए `render` और `stream` एक बार `400 Bad Request` जवाब देते हैं; वे कोई fragment fetch नहीं करते और कोई fragment metrics दर्ज नहीं करते। query की जाँच नहीं होती। ऐसे path के लिए `fetchAppHTML` `<!-- SSR error: invalid path -->` लौटाता है। fragment services तक जाने से पहले pathname से `..` runs हटा दिए जाते हैं।
- streamed fragments की scripts चलती हैं। अगर उन्हें निष्क्रिय रहना है, तो fragment service पर ही उन्हें हटा दें।
- जिस matched ऐप का उसी नाम का slot नहीं है, उसे fetch किया जाता है और उसका HTML छोड़ दिया जाता है।

## यह क्या नहीं करता

- यह components रेंडर नहीं करता, fragments cache नहीं करता, fetches retry नहीं करता, और cookies व headers forward नहीं करता।
- यह hydrate नहीं करता। क्लाइंट adapters (`createSsrReactMicroApp` और उसके Vue, Svelte और Angular समकक्ष) यह करते हैं।
- यह fragment के `<head>` content को shell के `<head>` में नहीं ले जाता।

## 0.4 से माइग्रेशन

- जब हर matched fragment fail हो, तो `render()` 502 लौटाता है; `createMiddleware` इसे भेजता है।
- दोनों middlewares एरर पर `next()` के बजाय `next(error)` call करते हैं।
- Routes `matchPath` का इस्तेमाल करते हैं: `/dashboard?tab=1` `/dashboard/*` से match करता है।
- `toPrometheusText()` का output valid Prometheus text है: हर family के लिए एक HELP/TYPE।
- दोनों middlewares `req.path ?? req.url` के बजाय `req.originalUrl ?? req.url` रेंडर करते हैं।
- `ssrUrl` absolute होना चाहिए; उसके मौजूदा query parameters बने रहते हैं।
- streamed fragments की scripts अब चलती हैं, और self-closing slots को streaming placeholder मिलता है।
- जिस request pathname में `://` हो या जो `//` से शुरू हो, उसे `render` और `stream` से `400 Bad Request` मिलता है।

## License

MIT

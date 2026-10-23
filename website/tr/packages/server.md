---
title: '@tuvix.js/server'
---

<PackageHeader
  name="@tuvix.js/server"
  title="Sunucu"
  description="Tuvix.js için sunucu tarafında sayfa birleştirme. Her mikro uygulamanın HTML parçasını HTTP ile çeker ve shell şablonundaki slot'ları doldurur. Sonucu tek bir yanıt ya da BigPipe akışı olarak gönderir."
  icon="🖥️"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

Paket Node.js 18 ve üzerinde çalışır, global `fetch` fonksiyonunu kullanır. Route eşleştirme için `@tuvix.js/router` paketine bağımlıdır.

## Ne zaman kullanılır

Her mikro uygulama kendi render servisini çalıştırıyor ve sayfayı bir shell sunucusu birleştiriyorsa bu paketi kullanın. `<tuvix-slot name="...">` yer tutucuları içeren bir shell HTML şablonu yazarsınız. Renderer her istekte `routes` değeri path ile eşleşen uygulamaları seçer, parçalarını paralel çeker ve her parçayı kendi slot'unun yerine koyar.

Tek parça bir HTML yanıtı ve tüm parçalar başarısız olduğunda 502 durum kodu istiyorsanız `createServerRenderer` ile `createMiddleware` fonksiyonlarını seçin. Shell'in `<head>` bölümünün en yavaş parça dönmeden tarayıcıya ulaşmasını istiyorsanız `createStreamingRenderer` ile `createStreamingMiddleware` fonksiyonlarını seçin.

Tüm island'ları tek bir sunucu kendisi render ediyorsa (`renderVueToString` ya da React'in `renderToString` fonksiyonunu çağıran bir Next.js, Astro veya Vite SSR uygulaması), bu pakete ihtiyacınız yoktur. Bu kurulumda island asset'lerini bağlamak için [`@tuvix.js/vite`](/tr/packages/vite) sayfasına bakın.

## Hızlı başlangıç

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

`/cart/42?coupon=x` isteğinde şunlar olur:

1. `header` eşleşir (`'/'` her path ile eşleşir), `cart` de `/cart/*` ile eşleşir.
2. Renderer `GET http://header-service:3001/render?path=%2Fcart%2F42%3Fcoupon%3Dx` isteğini gönderir, aynısını cart servisine de paralel gönderir. Middleware `req.originalUrl` değerini okuduğu için query string parça servislerine ulaşır.
3. Her yanıtın gövdesi, kendi `<tuvix-slot>` elemanının tamamının yerine geçer.
4. Middleware 200 durum kodunu `Content-Type: text/html; charset=utf-8` ve `X-Powered-By: Tuvix.js` header'larıyla gönderir.

`/about` isteğinde yalnızca `header` eşleşir. `cart` slot'u HTML'de `<tuvix-slot name="cart"><p>Loading cart...</p></tuvix-slot>` şeklinde kalır ve tarayıcı fallback içeriğini gösterir.

## Parça servisleri

Renderer her uygulamanın `ssrUrl` adresini `GET` ve `Accept: text/html` ile çağırır. URL'yi `new URL(ssrUrl)` ile kurar ve `path` arama parametresine isteğin pathname ve query kısmını yazar, `#hash` kısmını almaz. `ssrUrl` içinde zaten olan parametreler korunur: `/shop?sort=asc` için `http://cart:3002/render?v=2` adresi `http://cart:3002/render?v=2&path=%2Fshop%3Fsort%3Dasc` olur. 2xx yanıtın gövdesi parçanın kendisidir. Başka bir durum kodu, ağ hatası, zaman aşımı ya da göreli bir `ssrUrl` başarısızlık sayılır ve renderer slot'a `<!-- SSR error: <app> (<status or message>) -->` yazar.

Parça `<tuvix-slot>` etiketinin kendisinin yerine geçer, yani renderer araya sarmalayıcı bir eleman eklemez. İstemci tarafındaki uygulamanızın mount edildiği elemanı döndürün. Böylece orchestrator container'ı bulur, adaptör de onu hydrate eder:

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

İstemcide uygulamayı `container: '#cart'` ile kaydedin ve SSR destekli bir adaptörle oluşturun (`createSsrReactMicroApp`, `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`). Adaptör sıfırdan render etmek yerine sunucudan gelen markup'ı hydrate eder.

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

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | zorunlu | `<tuvix-slot name="x"></tuvix-slot>` ya da `<tuvix-slot name="x" />` yer tutucuları içeren sayfa HTML'i. Renderer slot adlarını oluşturulurken bir kez tarar. |
| `apps` | `ServerAppConfig[]` | zorunlu | Sunucuda render edilebilen uygulamalar. |
| `timeout` | `number` | `5000` | Kendi `timeout` değeri olmayan uygulamalar için ms cinsinden fetch zaman aşımı. |
| `metrics` | `TuvixMetrics` | yok | `createMetricsCollector()` ile oluşturulan toplayıcı. Renderer her parça isteğini ve her render'ı kaydeder. |

`ServerAppConfig`:

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Uygulama adı. Parça aynı adı taşıyan slot'u doldurur. |
| `ssrUrl` | `string` | zorunlu | Parçanın mutlak endpoint adresi. Renderer `path` arama parametresini ekler, URL'de zaten olan parametreleri korur. Göreli bir URL o uygulamanın parçasını başarısız kılar. |
| `routes` | `string[]` | zorunlu | [`matchPath`](/tr/packages/router#matchpath) söz dizimindeki desenler. Varsayılan önek kurallarıyla çalışır, core'daki `activeWhen` ile aynıdır: `'/'` her path ile, `'/cart'` ise `/cart` ve altındaki path'lerle eşleşir. Router'daki `routes` farklıdır: path'in tamamıyla eşleşir. Desenlerden herhangi biri eşleşirse uygulama render edilir. |
| `timeout` | `number` | config'teki `timeout` | Bu uygulama için ms cinsinden fetch zaman aşımı. Süre dolunca renderer isteği iptal eder. |

Dönen fonksiyonlar:

- `render(path)` uygulamaları eşleştirir, tüm parçaları paralel çeker, slot'ları doldurur ve `{ html, statusCode, headers }` ile resolve olur. En az bir uygulama eşleşmiş ve tüm parçalar başarısız olmuşsa `statusCode` değeri `502` olur, aksi halde `200`. `headers` içinde `Content-Type: text/html; charset=utf-8` ve `X-Powered-By: Tuvix.js` bulunur. Başarısız bir parça kendi slot'unda HTML yorumu olarak görünür; `render` bu yüzden reject olmaz. Pathname'i `://` içeren ya da `//` ile başlayan bir path için bir uyarı loglar, hiçbir parça çekmez ve `Bad Request` metniyle `400` döndürerek resolve olur.
- `matchApps(path)` `routes` değeri `matchPath(pattern, path)` önek kurallarıyla `path` ile eşleşen uygulamaları döndürür. Query string ve hash eşleşmeyi etkilemez.
- `fetchAppHTML(app, path)` tek bir parçayı çeker ve HTML'ini ya da hata yorumunu döndürür. Metrik kaydetmez.

```ts
import { createServerRenderer } from '@tuvix.js/server';

const renderer = createServerRenderer({
  shellTemplate: '<main><tuvix-slot name="profile" /></main>',
  apps: [{ name: 'profile', ssrUrl: 'http://profile:3003/render', routes: ['/users/:id'] }],
});

const { html, statusCode } = await renderer.render('/users/42#bio');
console.log(statusCode); // 200, profile servisi başarısız olduysa 502
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

Aynı `ServerRendererConfig` nesnesini alır. Oluşturulurken her `<tuvix-slot name="x">fallback</tuvix-slot>` etiketini `<div id="tvx-slot-x" style="display:contents">fallback</div>` haline getirir ve shell'i son `</body>` etiketinden ikiye böler.

`stream(path, res, options?)`:

1. `Content-Type: text/html; charset=utf-8`, `Transfer-Encoding: chunked` ve `X-Powered-By: Tuvix.js` header'larını ayarlar.
2. Shell'i `</body>` etiketine kadar yazar. Her slot bir `<div id="tvx-slot-x" style="display:contents">` olur. Açılış ve kapanış etiketli biçimde içindeki HTML fallback olarak kalır, kendiliğinden kapanan `<tuvix-slot name="x" />` biçiminde içi boş olur.
3. Eşleşen parçaları paralel çeker. Her parça geldiğinde, parçayı bir `<template>` içinde parse edip yer tutucunun yerine koyan inline bir `<script>` yazar. Bu script ardından parçadaki her `<script>` elemanını doküman sırasıyla, birer birer yeniden oluşturur. Tüm attribute'ları (`nonce` dahil) ve metni kopyalar, böylece tarayıcı script'i çalıştırır. `async` olmayan harici bir script'ten sonraki script, onun `load` ya da `error` olayını bekler. Bu sayede `<script src="/lib.js"></script><script>Lib.init()</script>` çalışırken `Lib` hazırdır. `async` script'ler ve veri blokları (`type="application/json"`) geri kalanları bekletmez.
4. `</body></html>` kısmını (shell'in geri kalanını) yazar ve `res.end()` fonksiyonunu çağırır.

Durum kodu 200'dür: header'lar shell ile birlikte, daha hiçbir parça çekilmeden gider. Pathname'i `://` içeren ya da `//` ile başlayan bir path için `stream` shell'i yazmaz: `res.statusCode = 400` ayarlar, `Bad Request` metnini `text/plain` olarak yazar ve yanıtı sonlandırır. Renderer parça HTML'ini JSON olarak encode eder, `<`, `>`, U+2028 ve U+2029 karakterlerini escape eder. Böylece `</script>` ya da `<!--` içeren bir parça inline script'i sonlandıramaz.

`'unsafe-inline'` içermeyen bir Content Security Policy altında her yanıt için yeni bir nonce üretip `options.nonce` olarak verin. Renderer bu değeri her inline script'e `<script nonce="...">` şeklinde yazar. Parçadan yeniden oluşturduğu script'ler ise yalnızca parçanın kendi `nonce` attribute'unu taşır. Bu yüzden parça script'lerine o nonce'u verin ya da policy'ye `'strict-dynamic'` ekleyin. Nonce yoksa policy inline script'leri engeller ve yer tutucular fallback içeriğiyle kalır.

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

Express/Connect tarzı bir handler. `req.originalUrl ?? req.url` değerini render eder. Bu yüzden query string ve Express mount öneki (`app.use('/shop', ...)`), route'ların eşleştiği ve parça servislerinin aldığı path'in bir parçasıdır. Sonuçtaki header'ları `res.set` ile ayarlar (`set` yoksa her header için `res.setHeader` kullanır) ve `res.status(result.statusCode).send(result.html)` çağırır. `render` hata fırlatırsa hatayı loglar ve `next(error)` çağırır. `next` vermediyseniz `500 Internal Server Error` gönderir.

Middleware aldığı her isteği render eder, hiçbir uygulamanın eşleşmediği path'ler de buna dahildir. Onu shell'inizin sahip olduğu route'lara, statik dosya handler'larından sonra bağlayın.

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

`renderer.stream(req.originalUrl ?? req.url, res, { nonce })` çağırır. Buradaki `nonce` değeri `options.nonce?.(req, res)` sonucudur. Değeri CSP middleware'inizin onu sakladığı yerden okuyun, örneğin `res.locals.cspNonce`. Hata olursa:

- ilk yazmadan önceyse: `next(error)` çağırır. `next` yoksa `res.status` üzerinden 500 gönderir (Express) ya da `res.statusCode = 500` ayarlar, `Internal Server Error` yazar ve yanıtı sonlandırır (Node `http`);
- ilk yazmadan sonraysa: header'lar zaten gönderildiği için yanıtı sonlandırır ve `next` çağırmaz.

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

Adı `slots` nesnesinin kendi anahtarlarından biri olan her `<tuvix-slot name="x">...</tuvix-slot>` ya da `<tuvix-slot name="x" />` etiketini `slots[x]` ile değiştirir. Karşılığı olmayan slot'lar yazıldığı gibi kalır. Tüm slot'ları tek geçişte, fonksiyon kullanan bir replacer ile doldurur. Bu yüzden parça HTML'indeki `$&`, `$1`, `` $` ``, `$'` ve `$$` olduğu gibi kalır, bir parçanın içindeki `<tuvix-slot>` da doldurulmaz.

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

Slot adlarını bir kez tarar ve `{ slotNames, render }` döndürür. `slotNames` her adı bir kez, ilk göründüğü sırayla listeler. `render(slots)` ile `composeHTML(template, slots)` aynı çıktıyı verir. `createServerRenderer` bu fonksiyonu sizin yerinize çağırır.

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

Bellekte çalışan bir toplayıcı. İki renderer'dan birine `metrics` olarak verin ya da metotlarını kendiniz çağırın:

| Metot | İmza | Davranış |
| --- | --- | --- |
| `recordRender` | `(durationMs: number) => void` | Bir render'ı ve süresini sayar. |
| `recordFragment` | `(name: string, durationMs: number, isError: boolean) => void` | `name` uygulaması için bir isteği, süresini ve başarısız olup olmadığını sayar. |
| `toPrometheusText` | `() => string` | Prometheus text exposition format 0.0.4 çıktısı. |
| `reset` | `() => void` | Tüm sayaçları sıfırlar. |

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

`header` 12 ms sürdüğü ve `cart` 2000 ms sonra başarısız olduğu tek bir render'dan sonraki çıktı:

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

Her metrik ailesi bir `# HELP` ve bir `# TYPE` satırı alır. Label'lar yalnızca örneklerde görünür, label değerlerinde `\`, `"` ve satır sonları escape edilir. Toplayıcı örneği olmayan aileleri atlar: ilk render'dan önce yalnızca 0 değerli iki render toplamını görürsünüz, dört parça ailesi ilk parça isteğinden sonra çıkar. Toplamları, ortalamaları ve maksimumları tutar; histogram ya da quantile yoktur.

### Tipler

| Tip | Anlamı |
| --- | --- |
| `ServerRendererConfig` | `{ shellTemplate, apps, timeout?, metrics? }`, iki renderer'ın da seçenekleri. |
| `ServerAppConfig` | `{ name, ssrUrl, routes, timeout? }`, tek bir uygulama. |
| `RenderResult` | `render` fonksiyonunun döndürdüğü `{ html: string; statusCode: number; headers: Record<string, string> }`. |
| `StreamingResponse` | `{ write(chunk: string): void; end(): void; setHeader(name: string, value: string): void; statusCode?: number }`. Node'un `ServerResponse` nesnesi buna uyar. |
| `StreamOptions` | `{ nonce?: string }`, `stream` için istek başına seçenekler. |
| `StreamingMiddlewareOptions` | `createStreamingMiddleware` için `{ nonce?: (req, res) => string \| undefined }`. |
| `MiddlewareRequest` | `{ url: string; originalUrl?: string }`, iki middleware'in de okuduğu istek alanları. |
| `StreamingMiddlewareResponse` | `StreamingResponse` ve isteğe bağlı, Express tarzı bir `status(code).send(body)`. |
| `CompiledTemplate` | `{ slotNames: string[]; render(slots: Record<string, string>): string }`. |
| `TuvixMetrics` | `createMetricsCollector` fonksiyonunun döndürdüğü toplayıcı arayüzü. |

## Sınır durumlar

- Parça, adı uygulamanın `name` değerine eşit olan slot'u doldurur. Eşleşen ama slot'u olmayan bir uygulamanın parçası çekilir, HTML'i atılır.
- `render` ve `stream`, pathname'i `://` içeren ya da `//` ile başlayan istekleri bir uyarı loglayıp `400 Bad Request` ile reddeder. Hiçbir parça çekmez, parça metriği de kaydetmez. Kontrol query kısmına bakmaz, bu yüzden `?next=https://...` geçer. Böyle bir path için `fetchAppHTML` `<!-- SSR error: invalid path -->` döndürür. Renderer parça servislerine göndermeden önce pathname'deki (query'deki değil) `..` dizilerini siler ve tekrarlanan slash'ları teke indirir.
- Stream edilen bir parçadaki script'ler, parçanın swap script'i çalıştığında, shell'in kendi üstündeki script'lerinden sonra çalışır. Etkisiz kalmaları gerekiyorsa `<script>` elemanlarını parça servisinde temizleyin.
- Renderer hata yorumlarındaki uygulama adını ve hata mesajını escape eder. Böylece `-->` içeren bir hata metni yorumu kapatamaz.
- 200 olan bir `statusCode` kısmi hataları gizleyebilir. `tuvix_fragment_errors_total` metriğini okuyun ya da HTML'de `<!-- SSR error` arayın.

## Ne yapmaz

- Bileşen render etmez. Her parça servisi kendi uygulamasını kendi framework'ünün sunucu renderer'ı ile render eder.
- Parçaları cache'lemez, başarısız bir isteği tekrar denemez.
- Cookie'leri ya da istek header'larını parça servislerine iletmez. Yalnızca `Accept: text/html` gönderir.
- Hiçbir şeyi hydrate etmez. Bunu istemci tarafı adaptörler yapar.
- Parçaların `<head>` içeriğini (stiller, meta etiketleri) shell'in `<head>` bölümüne birleştirmez. Ortak asset'leri shell'e koyun ya da island'ları tek bir Vite sunucusu render ediyorsa [`@tuvix.js/vite`](/tr/packages/vite) paketini kullanın.

## 0.4 sürümünden geçiş

- En az bir uygulama eşleşmiş ve tüm parçalar başarısız olmuşsa `createServerRenderer().render()` artık `statusCode: 502` döndürür. `createMiddleware` bu kodu gönderir. Streaming renderer hâlâ 200 gönderir.
- Pathname'i `://` içeren ya da `//` ile başlayan bir istek, `render` ve `stream` fonksiyonlarından `400 Bad Request` alır. 0.4 sürümünde tüm parçalar 200 dönen bir sayfanın içinde hata yorumuyla başarısız oluyordu.
- Render hata fırlattığında `createMiddleware` ve `createStreamingMiddleware` artık `next()` yerine `next(error)` çağırır. Böylece Express sizin hata handler'ınızı çalıştırır.
- Route'lar `matchPath` kullanır. Bu yüzden `/dashboard?tab=1` artık `/dashboard/*` ile, `/users/42#bio` de `/users/:id` ile eşleşir.
- `toPrometheusText()` her aile için bir `# HELP` ve bir `# TYPE` satırı yazar, label'lar yalnızca örneklerde bulunur. 0.4 çıktısı bu satırları her uygulama için tekrarlıyor ve label'ları metrik adının içine koyuyordu. Prometheus bu çıktıyı reddediyordu.
- İki middleware de artık `req.path ?? req.url` yerine `req.originalUrl ?? req.url` değerini render eder. Parça servisleri query string'i `path` içinde alır, `app.use('/prefix', ...)` altında da `/prefix` dahil tam URL'yi görür.
- `ssrUrl` mutlak olmalıdır. Göreli bir adres artık o uygulama için hata yorumu üretir. `ssrUrl` içindeki query parametreleri ikinci bir `?` üretmek yerine korunur.
- Stream edilen parçalardaki script'ler artık çalışır. Etkisiz kalmalarına güveniyorduysanız onları parça servisinde temizleyin.
- Kendiliğinden kapanan `<tuvix-slot name="x" />` de artık streaming yer tutucusu alır.

0.4 dokümanları `createMiddleware({ template })`, `renderer.render({ apps, props })` ve orchestrator için `hydrate: true` seçeneğini gösteriyordu. Bunların hiçbiri yok. `createMiddleware` fonksiyonuna bir renderer verin:

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

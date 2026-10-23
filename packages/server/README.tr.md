# @tuvix.js/server

> Mikro uygulamaların HTML parçalarını çeker ve bir shell sayfasında birleştirir; sonucu tek yanıt ya da BigPipe akışı olarak gönderir

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır. Dokümantasyonun tamamı: [tuvix.js.org/tr/packages/server](https://tuvix.js.org/tr/packages/server).

`<tuvix-slot name="...">` yer tutucuları içeren bir shell şablonu yazarsınız. Renderer her istekte `routes` değeri path ile eşleşen uygulamaları seçer (`@tuvix.js/router` paketindeki `matchPath` ile), parçalarını HTTP üzerinden paralel çeker ve her parçayı kendi slot'unun yerine koyar. Node.js 18+ gerekir (global `fetch`).

## Kurulum

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

## Hızlı başlangıç

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

`/cart/42?coupon=x` isteğinde renderer iki servise de `GET <ssrUrl>` isteği gönderir. `path=%2Fcart%2F42%3Fcoupon%3Dx` parametresini `URL.searchParams` üzerinden ekler (`ssrUrl` içindeki parametreler korunur, `#hash` atılır) ve `Accept: text/html` header'ını gönderir. `ssrUrl` mutlak olmalıdır. Her 2xx yanıtın gövdesi kendi `<tuvix-slot>` etiketinin yerine geçer. 2xx dışı bir durum kodu, ağ hatası, zaman aşımı ya da göreli bir `ssrUrl` şu yoruma dönüşür: `<!-- SSR error: <app> (<reason>) -->`. İstemci adaptörünün hydrate edebilmesi için parça servisinden uygulamanızın container elemanını döndürün (`<div id="cart">...</div>`).

## API

### `createServerRenderer(config)`

`{ render, matchApps, fetchAppHTML }` döndürür.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | zorunlu | `<tuvix-slot name="x">fallback</tuvix-slot>` ya da `<tuvix-slot name="x" />` içeren HTML. |
| `apps` | `ServerAppConfig[]` | zorunlu | `{ name, ssrUrl, routes, timeout? }`. `name` slot'u seçer; `routes` için `matchPath` önek kuralları geçerlidir (query ve hash yok sayılır). |
| `timeout` | `number` | `5000` | Uygulama kendi değerini vermediğinde ms cinsinden fetch zaman aşımı. |
| `metrics` | `TuvixMetrics` | yok | `createMetricsCollector()` ile oluşturulan toplayıcı. |

- `render(path)`, `{ html, statusCode, headers }` ile resolve olur. En az bir uygulama eşleşmiş ve tüm parçalar başarısız olmuşsa `statusCode` değeri `502`, aksi halde `200` olur. Eşleşmeyen slot'lar fallback içeriğini korur. Pathname'i `://` içeren ya da `//` ile başlayan bir path için `Bad Request` metniyle `400` döndürür ve hiçbir şey çekmez.
- `matchApps(path)` eşleşen uygulamaları döndürür.
- `fetchAppHTML(app, path)` tek bir parçayı (ya da hata yorumunu) metrik kaydetmeden çeker.

### `createStreamingRenderer(config)`

Aynı config'i alır. `{ stream, matchApps }` döndürür. `stream(path, res, { nonce? })` önce shell'i `</body>` etiketine kadar yazar ve slot'ların yerine `<div id="tvx-slot-x" style="display:contents">` yer tutucularını koyar (çift etiketli slot'lar iç HTML'lerini fallback olarak korur, kendiliğinden kapanan slot'lar boş kalır). Ardından her parça geldikçe onun için bir inline `<script>` yazar. Bu script parçayı bir `<template>` içinde parse eder, yer tutucuyu değiştirir ve parçadaki her `<script>` elemanını (`nonce` dahil tüm attribute'ları ve metniyle) doküman sırasıyla, birer birer yeniden oluşturur. `async` olmayan harici bir script'ten sonraki script, onun `load` ya da `error` olayını bekler. Bu sayede `<script src="/lib.js"></script><script>Lib.init()</script>` çalışır. `async` script'ler ve veri blokları (`type="application/json"`) hiçbir şeyi bekletmez. Parça JSON ile escape edilir, bu yüzden `</script>` dışarı taşamaz. Son olarak shell'in geri kalanını yazar. Durum kodu 200'dür, başka bir host'u gösteren bir path için ise 400 olur (`Bad Request`, shell yazılmaz). `res` bir `StreamingResponse` nesnesidir (`write`, `end`, `setHeader`, isteğe bağlı `statusCode`); Node'un `ServerResponse` nesnesi buna uyar.

`'unsafe-inline'` içermeyen bir CSP altında her yanıt için yeni bir `nonce` verin; renderer onu kendi inline script'lerine ekler. Parça script'lerinin kendi `nonce` attribute'una ya da `'strict-dynamic'` içeren bir policy'ye ihtiyacı vardır.

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

Express/Connect handler'ı: `(req, res, next?)`. `req.originalUrl ?? req.url` değerini render eder (query string ve Express mount öneki dahil), header'ları `res.set` ya da `res.setHeader` ile ayarlar ve `res.status(statusCode).send(html)` gönderir. Hata fırlatılırsa `next(error)` çağırır, `next` yoksa 500 gönderir.

### `createStreamingMiddleware(renderer, options?)`

`renderer.stream(req.originalUrl ?? req.url, res, { nonce })` çağırır. `nonce` değeri `options.nonce?.(req, res)` sonucundan gelir (örneğin `res.locals.cspNonce`). İlk yazmadan önceki hata: `next(error)`; `next` yoksa Express'te `res.status(500).send()`, Node `ServerResponse` nesnesinde `statusCode = 500` ve ardından `end()`. İlk yazmadan sonraki hata: yanıtı sonlandırır, `next` çağırmaz.

### `composeHTML(template, slots)` ve `compileShellTemplate(template)`

`composeHTML`, `slots` içinde adı geçen her slot'u tek geçişte değiştirir; diğerleri yazıldığı gibi kalır. Parça HTML'i içindeki `$&`, `$1` ve `<tuvix-slot>` olduğu gibi kalır. `compileShellTemplate` slot adlarını bir kez tarar ve `{ slotNames, render(slots) }` döndürür.

```ts
import { composeHTML } from '@tuvix.js/server';

composeHTML('<main><tuvix-slot name="main" /></main>', { main: '<p>Hello</p>' }); // '<main><p>Hello</p></main>'
```

### `createMetricsCollector()`

`TuvixMetrics` döndürür: `recordRender(ms)`, `recordFragment(name, ms, isError)`, `toPrometheusText()`, `reset()`. Metrikler: `tuvix_renders_total`, `tuvix_render_duration_ms_total` (counter), `tuvix_render_duration_ms_avg`, `tuvix_render_duration_ms_max` (gauge) ve uygulama başına (`{app="..."}`) `tuvix_fragment_fetches_total`, `tuvix_fragment_errors_total`, `tuvix_fragment_avg_duration_ms`, `tuvix_fragment_max_duration_ms`. Her aile için bir `# HELP` ve bir `# TYPE` satırı vardır; label değerlerinde `\`, `"` ve satır sonları escape edilir. Çıktıyı `Content-Type: text/plain; version=0.0.4` ile sunun.

### Tipler

`ServerRendererConfig`, `ServerAppConfig`, `RenderResult`, `StreamingResponse`, `StreamOptions`, `StreamingMiddlewareOptions`, `StreamingMiddlewareResponse`, `MiddlewareRequest`, `CompiledTemplate`, `TuvixMetrics`.

## Sınır durumlar

- `render` ve `stream`, pathname'i `://` içeren ya da `//` ile başlayan bir isteğe bir kez `400 Bad Request` ile yanıt verir; hiçbir parça çekmez, parça metriği de kaydetmez. Query kontrol edilmez. Böyle bir path için `fetchAppHTML` `<!-- SSR error: invalid path -->` döndürür. Pathname parça servislerine gitmeden önce içindeki `..` dizileri silinir.
- Stream edilen parçalardaki script'ler çalışır. Etkisiz kalmaları gerekiyorsa onları parça servisinde temizleyin.
- Eşleşen ama aynı adda slot'u olmayan bir uygulamanın parçası yine çekilir, HTML'i atılır.

## Ne yapmaz

- Bileşen render etmez, parçaları cache'lemez, başarısız istekleri tekrar denemez, cookie ve header'ları iletmez.
- Hydrate etmez. Bunu istemci adaptörleri (`createSsrReactMicroApp` ve Vue, Svelte, Angular karşılıkları) yapar.
- Parçaların `<head>` içeriğini shell'in `<head>` bölümüne taşımaz.

## 0.4 sürümünden geçiş

- Eşleşen tüm parçalar başarısız olduğunda `render()` 502 döndürür; `createMiddleware` bu kodu gönderir.
- İki middleware de hatalarda `next()` yerine `next(error)` çağırır.
- Route'lar `matchPath` kullanır: `/dashboard?tab=1` artık `/dashboard/*` ile eşleşir.
- `toPrometheusText()` çıktısı geçerli bir Prometheus metnidir: her aile için bir HELP/TYPE.
- İki middleware de `req.path ?? req.url` yerine `req.originalUrl ?? req.url` değerini render eder.
- `ssrUrl` mutlak olmalıdır; içindeki mevcut query parametreleri korunur.
- Stream edilen parçalardaki script'ler artık çalışır, kendiliğinden kapanan slot'lar da streaming yer tutucusu alır.
- Pathname'i `://` içeren ya da `//` ile başlayan bir istek, `render` ve `stream` fonksiyonlarından `400 Bad Request` alır.

## Lisans

MIT

# @tuvix.js/server

> Obtén fragmentos HTML de micro apps y compónlos en una página shell, como una única respuesta o como un stream BigPipe

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentación completa: [tuvix.js.org/packages/server](https://tuvix.js.org/packages/server).

Escribes una plantilla de shell con marcadores `<tuvix-slot name="...">`. En cada petición, el renderizador elige las apps cuyas `routes` coinciden con la ruta (con `matchPath` de `@tuvix.js/router`), obtiene sus fragmentos en paralelo por HTTP y coloca cada fragmento donde estaba su slot. Requiere Node.js 18+ (`fetch` global).

## Instalación

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

## Inicio rápido

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

Para `/cart/42?coupon=x`, el renderizador llama a `GET <ssrUrl>` con `path=%2Fcart%2F42%3Fcoupon%3Dx` definido mediante `URL.searchParams` (los parámetros que ya tiene `ssrUrl` se mantienen; el `#hash` se descarta) y `Accept: text/html` en ambos servicios. `ssrUrl` debe ser absoluta. Cada body 2xx reemplaza su etiqueta `<tuvix-slot>`. Un estado distinto de 2xx, un error de red, un timeout o una `ssrUrl` relativa se convierten en `<!-- SSR error: <app> (<reason>) -->`. Devuelve el elemento contenedor de tu app desde el servicio de fragmentos (`<div id="cart">...</div>`) para que el adaptador del cliente pueda hidratarlo.

## API

### `createServerRenderer(config)`

Devuelve `{ render, matchApps, fetchAppHTML }`.

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | obligatorio | HTML con `<tuvix-slot name="x">fallback</tuvix-slot>` o `<tuvix-slot name="x" />`. |
| `apps` | `ServerAppConfig[]` | obligatorio | `{ name, ssrUrl, routes, timeout? }`. `name` elige el slot; `routes` usa las reglas de prefijo de `matchPath` (se ignoran query y hash). |
| `timeout` | `number` | `5000` | Timeout de la petición en ms cuando una app no define ninguno. |
| `metrics` | `TuvixMetrics` | ninguno | Colector creado con `createMetricsCollector()`. |

- `render(path)` se resuelve en `{ html, statusCode, headers }`. `statusCode` es `502` cuando al menos una app coincidió y todos los fragmentos fallaron; en otro caso es `200`. Los slots sin coincidencia conservan su fallback. Una ruta cuyo pathname contiene `://` o empieza por `//` devuelve `400` con el texto `Bad Request` y no solicita nada.
- `matchApps(path)` devuelve las apps que coinciden.
- `fetchAppHTML(app, path)` obtiene un fragmento (o el comentario de error), sin métricas.

### `createStreamingRenderer(config)`

Misma configuración. Devuelve `{ stream, matchApps }`. `stream(path, res, { nonce? })` escribe la shell hasta `</body>` con marcadores `<div id="tvx-slot-x" style="display:contents">` (los slots con apertura y cierre conservan su HTML interno como fallback; los slots autocerrados quedan vacíos). Después escribe un `<script>` en línea por fragmento a medida que llegan: el script analiza el fragmento en un `<template>`, reemplaza el marcador y vuelve a crear cada `<script>` del fragmento (todos los atributos, incluido `nonce`, además del texto) de uno en uno, en el orden del documento. Después de un script externo sin `async`, el siguiente espera a su `load` o `error`, así que `<script src="/lib.js"></script><script>Lib.init()</script>` funciona. Los scripts `async` y los bloques de datos (`type="application/json"`) nunca bloquean. El fragmento se escapa como JSON para que `</script>` no pueda romper el script. Luego escribe el resto de la shell. El estado es 200, o 400 (`Bad Request`, sin shell) para una ruta que nombra otro host. `res` es un `StreamingResponse` (`write`, `end`, `setHeader`, `statusCode` opcional); el `ServerResponse` de Node encaja.

Con una CSP sin `'unsafe-inline'`, pasa un `nonce` nuevo por respuesta; el renderizador lo pone en sus scripts en línea. Los scripts de los fragmentos necesitan su propio atributo `nonce`, o una política con `'strict-dynamic'`.

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

Handler de Express/Connect `(req, res, next?)`. Renderiza `req.originalUrl ?? req.url` (incluidos el query string y el prefijo de montaje de Express), define los headers con `res.set` o `res.setHeader` y envía `res.status(statusCode).send(html)`. Si se lanza un error: `next(error)`, o 500 si no hay `next`.

### `createStreamingMiddleware(renderer, options?)`

Llama a `renderer.stream(req.originalUrl ?? req.url, res, { nonce })`, con `nonce` obtenido de `options.nonce?.(req, res)` (por ejemplo, `res.locals.cspNonce`). Error antes de la primera escritura: `next(error)`; si no hay `next`, `res.status(500).send()` en Express, o `statusCode = 500` más `end()` en un `ServerResponse` de Node. Error después: termina la respuesta y no llama a `next`.

### `composeHTML(template, slots)` y `compileShellTemplate(template)`

`composeHTML` reemplaza en una sola pasada cada slot nombrado en `slots`; los demás quedan tal como están escritos. `$&`, `$1` y un `<tuvix-slot>` dentro del HTML de un fragmento se mantienen literales. `compileShellTemplate` devuelve `{ slotNames, render(slots) }` con los nombres analizados una sola vez.

```ts
import { composeHTML } from '@tuvix.js/server';

composeHTML('<main><tuvix-slot name="main" /></main>', { main: '<p>Hello</p>' }); // '<main><p>Hello</p></main>'
```

### `createMetricsCollector()`

Devuelve `TuvixMetrics`: `recordRender(ms)`, `recordFragment(name, ms, isError)`, `toPrometheusText()`, `reset()`. Métricas: `tuvix_renders_total`, `tuvix_render_duration_ms_total` (contadores), `tuvix_render_duration_ms_avg`, `tuvix_render_duration_ms_max` (gauges) y, por app (`{app="..."}`), `tuvix_fragment_fetches_total`, `tuvix_fragment_errors_total`, `tuvix_fragment_avg_duration_ms`, `tuvix_fragment_max_duration_ms`. Un `# HELP` y un `# TYPE` por familia; los valores de las etiquetas escapan `\`, `"` y los saltos de línea. Sírvelo con `Content-Type: text/plain; version=0.0.4`.

### Tipos

`ServerRendererConfig`, `ServerAppConfig`, `RenderResult`, `StreamingResponse`, `StreamOptions`, `StreamingMiddlewareOptions`, `StreamingMiddlewareResponse`, `MiddlewareRequest`, `CompiledTemplate`, `TuvixMetrics`.

## Casos límite

- `render` y `stream` responden `400 Bad Request` una sola vez para un pathname de petición que contiene `://` o empieza por `//`; no solicitan ningún fragmento ni registran métricas de fragmentos. El query no se comprueba. `fetchAppHTML` devuelve `<!-- SSR error: invalid path -->` para una ruta así. Las secuencias `..` se eliminan del pathname antes de enviarlo a los servicios de fragmentos.
- Los scripts de los fragmentos enviados por streaming se ejecutan. Elimínalos en el servicio de fragmentos si deben quedar inertes.
- Una app que coincide pero no tiene un slot con el mismo nombre se solicita igualmente y su HTML se descarta.

## Lo que no hace

- No renderiza componentes, no cachea fragmentos, no reintenta peticiones ni reenvía cookies y headers.
- No hidrata. Eso lo hacen los adaptadores del cliente (`createSsrReactMicroApp` y sus equivalentes de Vue, Svelte y Angular).
- No mueve el contenido `<head>` de los fragmentos al `<head>` de la shell.

## Migrar desde 0.4

- `render()` devuelve 502 cuando todos los fragmentos que coincidieron fallaron; `createMiddleware` lo envía.
- Ambos middlewares llaman a `next(error)` en lugar de `next()` cuando hay errores.
- Las rutas usan `matchPath`: `/dashboard?tab=1` coincide con `/dashboard/*`.
- La salida de `toPrometheusText()` es texto Prometheus válido: un HELP/TYPE por familia.
- Ambos middlewares renderizan `req.originalUrl ?? req.url` en lugar de `req.path ?? req.url`.
- `ssrUrl` debe ser absoluta; sus parámetros de query existentes se conservan.
- Los scripts de los fragmentos enviados por streaming ahora se ejecutan, y los slots autocerrados reciben un marcador de streaming.
- Un pathname de petición que contiene `://` o empieza por `//` recibe `400 Bad Request` de `render` y `stream`.

## Licencia

MIT

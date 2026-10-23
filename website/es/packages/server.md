---
title: '@tuvix.js/server'
---

<PackageHeader
  name="@tuvix.js/server"
  title="Server"
  description="Composición de páginas en el servidor para Tuvix.js. Obtén por HTTP el fragmento HTML de cada micro app y rellena los slots de una plantilla de shell, como una única respuesta o como un stream BigPipe."
  icon="🖥️"
  npm="true"
/>

## Instalación

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

El paquete funciona en Node.js 18 o posterior y usa el `fetch` global. Depende de `@tuvix.js/router` para la coincidencia de rutas.

## Cuándo usarlo

Úsalo cuando cada micro app ejecuta su propio servicio de renderizado y un servidor de shell ensambla la página. Escribes una plantilla HTML de shell con marcadores `<tuvix-slot name="...">`. En cada petición, el renderer elige las apps cuyas `routes` coinciden con la ruta, obtiene sus fragmentos en paralelo y coloca cada fragmento donde estaba su slot.

Elige `createServerRenderer` con `createMiddleware` cuando quieras una respuesta HTML completa y un estado 502 cuando fallen todos los fragmentos. Elige `createStreamingRenderer` con `createStreamingMiddleware` cuando quieras que el `<head>` de la shell llegue al navegador antes de que vuelva el fragmento más lento.

Si un único servidor renderiza todas las islas por sí mismo (una app de Next.js, Astro o Vite SSR que llama a `renderVueToString` o a `renderToString` de React), no necesitas este paquete. Consulta [`@tuvix.js/vite`](/es/packages/vite) para enlazar los assets de las islas en ese escenario.

## Inicio rápido

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

Una petición a `/cart/42?coupon=x`:

1. `header` coincide (`'/'` coincide con cualquier ruta) y `cart` coincide con `/cart/*`.
2. El renderer envía `GET http://header-service:3001/render?path=%2Fcart%2F42%3Fcoupon%3Dx` y lo mismo al servicio de cart, en paralelo. El middleware lee `req.originalUrl`, así que la query string llega a los servicios de fragmentos.
3. El cuerpo de cada respuesta reemplaza su elemento `<tuvix-slot>` completo.
4. El middleware envía el estado 200 con `Content-Type: text/html; charset=utf-8` y `X-Powered-By: Tuvix.js`.

En `/about`, solo coincide `header`. El slot `cart` se queda en el HTML como `<tuvix-slot name="cart"><p>Loading cart...</p></tuvix-slot>`, y el navegador renderiza su contenido de fallback.

## Servicios de fragmentos

El renderer llama al `ssrUrl` de cada app con `GET` y `Accept: text/html`. Construye la URL con `new URL(ssrUrl)` y asigna a un parámetro de búsqueda `path` el pathname de la petición más la query, sin el `#hash`. Los parámetros que ya estén en `ssrUrl` se conservan: `http://cart:3002/render?v=2` pasa a ser `http://cart:3002/render?v=2&path=%2Fshop%3Fsort%3Dasc` para `/shop?sort=asc`. El cuerpo de una respuesta 2xx es el fragmento. Cualquier otro estado, un error de red, un timeout o un `ssrUrl` relativo cuenta como fallo, y el renderer coloca `<!-- SSR error: <app> (<status or message>) -->` en el slot.

El fragmento reemplaza la propia etiqueta `<tuvix-slot>`, así que el renderer no añade ningún elemento envolvente. Devuelve el elemento en el que se monta tu app del lado del cliente, para que el orquestador encuentre el contenedor y el adaptador lo hidrate:

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

En el cliente, registra la app con `container: '#cart'` y constrúyela con un adaptador compatible con SSR (`createSsrReactMicroApp`, `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`). El adaptador hidrata el marcado del servidor en lugar de renderizar desde cero.

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

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | obligatorio | HTML de la página con marcadores `<tuvix-slot name="x"></tuvix-slot>` o `<tuvix-slot name="x" />`. El renderer analiza los nombres de los slots una sola vez, al crearse. |
| `apps` | `ServerAppConfig[]` | obligatorio | Apps que se pueden renderizar en el servidor. |
| `timeout` | `number` | `5000` | Timeout de la petición en ms para las apps sin `timeout` propio. |
| `metrics` | `TuvixMetrics` | ninguno | Colector de `createMetricsCollector()`. El renderer registra cada obtención de fragmento y cada renderizado. |

`ServerAppConfig`:

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Nombre de la app. El fragmento rellena el slot con el mismo nombre. |
| `ssrUrl` | `string` | obligatorio | Endpoint absoluto del fragmento. El renderer asigna un parámetro de búsqueda `path` y conserva los parámetros que ya estén en la URL. Una URL relativa hace fallar el fragmento de esa app. |
| `routes` | `string[]` | obligatorio | Patrones con la sintaxis de [`matchPath`](/es/packages/router#matchpath) y sus reglas de prefijo por defecto, igual que `activeWhen` en core: `'/'` coincide con cualquier ruta y `'/cart'` coincide con `/cart` y lo que cuelga de ella. Las `routes` del router son distintas: coinciden con la ruta completa. La app se renderiza cuando coincide cualquier patrón. |
| `timeout` | `number` | `timeout` de la configuración | Timeout de la petición en ms para esta app. El renderer aborta la petición cuando expira. |

Funciones devueltas:

- `render(path)` busca las apps que coinciden, obtiene todos los fragmentos en paralelo, rellena los slots y se resuelve con `{ html, statusCode, headers }`. `statusCode` es `502` cuando coincidió al menos una app y fallaron todos los fragmentos; en otro caso es `200`. `headers` contiene `Content-Type: text/html; charset=utf-8` y `X-Powered-By: Tuvix.js`. Un fragmento fallido aparece como un comentario HTML en su slot; `render` no se rechaza por ello. Una ruta cuyo pathname contiene `://` o empieza por `//` se resuelve con `400` y el texto `Bad Request`, tras un aviso y sin obtener ningún fragmento.
- `matchApps(path)` devuelve las apps cuyas `routes` coinciden con `path` según las reglas de prefijo de `matchPath(pattern, path)`. La query string y el hash no afectan a la coincidencia.
- `fetchAppHTML(app, path)` obtiene un fragmento y devuelve su HTML, o el comentario de error. No registra métricas.

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

Recibe el mismo `ServerRendererConfig`. Al crearse, convierte cada `<tuvix-slot name="x">fallback</tuvix-slot>` en `<div id="tvx-slot-x" style="display:contents">fallback</div>` y divide la shell en el último `</body>`.

`stream(path, res, options?)`:

1. Asigna `Content-Type: text/html; charset=utf-8`, `Transfer-Encoding: chunked` y `X-Powered-By: Tuvix.js`.
2. Escribe la shell hasta `</body>`. Cada slot se convierte en `<div id="tvx-slot-x" style="display:contents">`, que contiene como fallback el HTML interior de la forma con etiqueta de cierre, o nada en el caso de un `<tuvix-slot name="x" />` autocerrado.
3. Obtiene en paralelo los fragmentos que coinciden. A medida que llega cada uno, escribe un `<script>` en línea que analiza el fragmento dentro de un `<template>` y reemplaza el marcador con él. Después, el script vuelve a crear cada `<script>` del fragmento, uno a uno en el orden del documento, copiando todos sus atributos (incluido `nonce`) y su texto para que el navegador lo ejecute. Tras un script externo sin `async`, el siguiente espera a su evento `load` o `error`, así que `<script src="/lib.js"></script><script>Lib.init()</script>` encuentra `Lib`. Los scripts `async` y los bloques de datos (`type="application/json"`) no retrasan al resto.
4. Escribe `</body></html>` (el resto de la shell) y llama a `res.end()`.

El estado es 200: las cabeceras salen con la shell, antes de obtener ningún fragmento. Para una ruta cuyo pathname contiene `://` o empieza por `//`, `stream` asigna `res.statusCode = 400`, escribe `Bad Request` como `text/plain` y termina, sin la shell. El renderer codifica en JSON el HTML del fragmento y escapa `<`, `>`, U+2028 y U+2029, así que un fragmento que contenga `</script>` o `<!--` no puede cerrar el script en línea.

Con una Content Security Policy sin `'unsafe-inline'`, pasa un nonce nuevo por respuesta como `options.nonce`. El renderer lo escribe como `<script nonce="...">` en cada script en línea. Los scripts que vuelve a crear a partir de un fragmento llevan solo el atributo `nonce` propio del fragmento, así que da ese nonce a los scripts del fragmento o añade `'strict-dynamic'` a la política. Sin nonce, la política bloquea los scripts en línea y los marcadores conservan su fallback.

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

Handler al estilo de Express/Connect. Renderiza `req.originalUrl ?? req.url`, así que la query string y un prefijo de montaje de Express (`app.use('/shop', ...)`) forman parte de la ruta con la que coinciden las rutas y que reciben los servicios de fragmentos. Asigna las cabeceras del resultado con `res.set` (o con `res.setHeader` por cada cabecera cuando falta `set`) y llama a `res.status(result.statusCode).send(result.html)`. Cuando `render` lanza un error, lo registra en el log y llama a `next(error)`, o envía `500 Internal Server Error` si no pasaste `next`.

El middleware renderiza todas las peticiones que recibe, incluidas las rutas con las que no coincide ninguna app. Móntalo en las rutas que controla tu shell, después de los handlers de archivos estáticos.

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

Llama a `renderer.stream(req.originalUrl ?? req.url, res, { nonce })`, donde `nonce` es `options.nonce?.(req, res)`. Léelo de donde lo guarde tu middleware de CSP, por ejemplo `res.locals.cspNonce`. Ante un error:

- antes de la primera escritura: llama a `next(error)`. Sin `next`, envía 500 a través de `res.status` (Express), o asigna `res.statusCode = 500`, escribe `Internal Server Error` y termina la respuesta (Node `http`);
- después de la primera escritura: termina la respuesta y no llama a `next`, porque las cabeceras ya se enviaron.

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

Reemplaza cada `<tuvix-slot name="x">...</tuvix-slot>` o `<tuvix-slot name="x" />` cuyo nombre es una clave propia de `slots` por `slots[x]`. Los slots sin entrada se quedan tal como están escritos. Rellena todos los slots en una sola pasada con una función de reemplazo, así que `$&`, `$1`, `` $` ``, `$'` y `$$` en el HTML del fragmento se mantienen literales y un `<tuvix-slot>` dentro de un fragmento no se rellena.

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

Analiza los nombres de los slots una sola vez y devuelve `{ slotNames, render }`. `slotNames` lista cada nombre una vez, en el orden de su primera aparición. `render(slots)` devuelve la misma salida que `composeHTML(template, slots)`. `createServerRenderer` lo llama por ti.

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

Un colector en memoria. Pásalo como `metrics` a cualquiera de los dos renderers, o llama a sus métodos tú mismo:

| Método | Firma | Comportamiento |
| --- | --- | --- |
| `recordRender` | `(durationMs: number) => void` | Cuenta un renderizado y su duración. |
| `recordFragment` | `(name: string, durationMs: number, isError: boolean) => void` | Cuenta una obtención para la app `name`, su duración y si falló. |
| `toPrometheusText` | `() => string` | Formato de exposición de texto de Prometheus 0.0.4. |
| `reset` | `() => void` | Pone a cero todos los contadores. |

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

Salida después de un renderizado en el que `header` tardó 12 ms y `cart` falló tras 2000 ms:

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

Cada familia de métricas tiene una línea `# HELP` y una línea `# TYPE`. Las etiquetas aparecen solo en las muestras, y sus valores escapan `\`, `"` y los saltos de línea. El colector omite las familias sin muestras: antes del primer renderizado solo obtienes los dos totales de renderizado a 0, y las cuatro familias de fragmentos aparecen después de la primera obtención de un fragmento. Guarda totales, medias y máximos; no hay histogramas ni cuantiles.

### Tipos

| Tipo | Significado |
| --- | --- |
| `ServerRendererConfig` | `{ shellTemplate, apps, timeout?, metrics? }`, opciones para ambos renderers. |
| `ServerAppConfig` | `{ name, ssrUrl, routes, timeout? }`, una app. |
| `RenderResult` | `{ html: string; statusCode: number; headers: Record<string, string> }` devuelto por `render`. |
| `StreamingResponse` | `{ write(chunk: string): void; end(): void; setHeader(name: string, value: string): void; statusCode?: number }`. El `ServerResponse` de Node encaja. |
| `StreamOptions` | `{ nonce?: string }`, opciones por petición para `stream`. |
| `StreamingMiddlewareOptions` | `{ nonce?: (req, res) => string \| undefined }` para `createStreamingMiddleware`. |
| `MiddlewareRequest` | `{ url: string; originalUrl?: string }`, los campos de la petición que leen ambos middlewares. |
| `StreamingMiddlewareResponse` | `StreamingResponse` más un `status(code).send(body)` opcional al estilo de Express. |
| `CompiledTemplate` | `{ slotNames: string[]; render(slots: Record<string, string>): string }`. |
| `TuvixMetrics` | Interfaz del colector que devuelve `createMetricsCollector`. |

## Casos límite

- El fragmento rellena el slot cuyo nombre es igual al `name` de la app. Una app que coincide pero no tiene slot se obtiene igualmente y su HTML se descarta.
- `render` y `stream` rechazan un pathname de petición que contenga `://` o empiece por `//` con un aviso y un `400 Bad Request`. No obtienen ningún fragmento ni registran métricas de fragmentos. La comprobación ignora la query, así que `?next=https://...` pasa. `fetchAppHTML` devuelve `<!-- SSR error: invalid path -->` para una ruta así. El renderer elimina las secuencias `..` y colapsa las barras repetidas en el pathname (no en la query) antes de enviarlo a los servicios de fragmentos.
- Los scripts de un fragmento enviado por stream se ejecutan cuando se ejecuta su script de intercambio, después de los scripts propios de la shell que están por encima. Elimina los elementos `<script>` en el servicio de fragmentos si deben permanecer inertes.
- El renderer escapa el nombre de la app y el mensaje de error en los comentarios de error, así que un texto de error que contenga `-->` no puede cerrar el comentario.
- Un `statusCode` de 200 puede ocultar fallos parciales. Lee `tuvix_fragment_errors_total` o busca `<!-- SSR error` en el HTML.

## Lo que no hace

- No renderiza componentes. Cada servicio de fragmentos renderiza su propia app con el renderer de servidor de su framework.
- No cachea fragmentos ni reintenta una obtención fallida.
- No reenvía cookies ni cabeceras de la petición a los servicios de fragmentos. Solo envía `Accept: text/html`.
- No hidrata nada. De eso se encargan los adaptadores del lado del cliente.
- No fusiona el contenido del `<head>` de los fragmentos (estilos, meta tags) en el `<head>` de la shell. Pon los assets compartidos en la shell, o usa [`@tuvix.js/vite`](/es/packages/vite) cuando un único servidor de Vite renderiza las islas.

## Migrar desde 0.4

- `createServerRenderer().render()` devuelve `statusCode: 502` cuando coincidió al menos una app y fallaron todos los fragmentos. `createMiddleware` lo envía. El renderer de streaming sigue enviando 200.
- Un pathname de petición que contenga `://` o empiece por `//` recibe `400 Bad Request` de `render` y `stream`. En 0.4 todos los fragmentos fallaban con un comentario de error dentro de una página 200.
- `createMiddleware` y `createStreamingMiddleware` llaman a `next(error)` en lugar de `next()` cuando el renderizado lanza un error, así que Express ejecuta tu handler de errores.
- Las rutas usan `matchPath`, así que `/dashboard?tab=1` coincide con `/dashboard/*` y `/users/42#bio` coincide con `/users/:id`.
- `toPrometheusText()` escribe una línea `# HELP` y una línea `# TYPE` por familia, con las etiquetas solo en las muestras. La salida de 0.4 las repetía por cada app con las etiquetas en el nombre de la métrica, algo que Prometheus rechazaba.
- Ambos middlewares renderizan `req.originalUrl ?? req.url` en lugar de `req.path ?? req.url`. Los servicios de fragmentos reciben la query string en `path`, y bajo `app.use('/prefix', ...)` ven la URL completa con `/prefix`.
- `ssrUrl` debe ser absoluto. Uno relativo produce ahora el comentario de error para esa app. Los parámetros de query de `ssrUrl` se conservan en lugar de producir un segundo `?`.
- Los scripts de los fragmentos enviados por stream ahora se ejecutan. Elimínalos en el servicio de fragmentos si dependías de que permanecieran inertes.
- Un `<tuvix-slot name="x" />` autocerrado también recibe un marcador de streaming.

La documentación de 0.4 mostraba `createMiddleware({ template })`, `renderer.render({ apps, props })` y una opción `hydrate: true` del orquestador. Nada de eso existe. Pasa un renderer a `createMiddleware`:

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

---
title: '@tuvix.js/server'
---

<PackageHeader
  name="@tuvix.js/server"
  title="Server"
  description="Composizione delle pagine lato server per Tuvix.js. Recupera via HTTP il frammento HTML di ogni micro app e riempie gli slot di un template della shell, in un'unica risposta o come stream BigPipe."
  icon="🖥️"
  npm="true"
/>

## Installazione

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

Il pacchetto funziona su Node.js 18 o successivo e usa il `fetch` globale. Dipende da `@tuvix.js/router` per il matching delle route.

## Quando usarlo

Usalo quando ogni micro app ha un proprio servizio di rendering e un server della shell ricompone la pagina. Scrivi un template HTML della shell con segnaposto `<tuvix-slot name="...">`. Per ogni richiesta, il renderer sceglie le app le cui `routes` corrispondono al path, recupera i loro frammenti in parallelo e mette ogni frammento al posto del suo slot.

Scegli `createServerRenderer` con `createMiddleware` quando vuoi un'unica risposta HTML completa e uno stato 502 quando tutti i frammenti falliscono. Scegli `createStreamingRenderer` con `createStreamingMiddleware` quando vuoi che il `<head>` della shell arrivi al browser prima che torni il frammento più lento.

Se un solo server esegue il rendering di ogni island (un'app Next.js, Astro o Vite SSR che chiama `renderVueToString` o `renderToString` di React), questo pacchetto non ti serve. Vedi [`@tuvix.js/vite`](/it/packages/vite) per collegare gli asset delle island in quella configurazione.

## Avvio rapido

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

Una richiesta per `/cart/42?coupon=x`:

1. `header` corrisponde (`'/'` corrisponde a ogni path) e `cart` corrisponde a `/cart/*`.
2. Il renderer invia `GET http://header-service:3001/render?path=%2Fcart%2F42%3Fcoupon%3Dx` e la stessa richiesta al servizio del carrello, in parallelo. Il middleware legge `req.originalUrl`, quindi la query string arriva ai servizi dei frammenti.
3. Il corpo di ogni risposta sostituisce l'intero elemento `<tuvix-slot>` corrispondente.
4. Il middleware invia lo stato 200 con `Content-Type: text/html; charset=utf-8` e `X-Powered-By: Tuvix.js`.

Su `/about` corrisponde solo `header`. Lo slot `cart` resta nell'HTML come `<tuvix-slot name="cart"><p>Loading cart...</p></tuvix-slot>` e il browser mostra il suo contenuto di fallback.

## Servizi dei frammenti

Il renderer chiama l'`ssrUrl` di ogni app con `GET` e `Accept: text/html`. Costruisce l'URL con `new URL(ssrUrl)` e imposta un parametro di ricerca `path` con il pathname della richiesta più la query, senza l'`#hash`. I parametri già presenti in `ssrUrl` restano: `http://cart:3002/render?v=2` diventa `http://cart:3002/render?v=2&path=%2Fshop%3Fsort%3Dasc` per `/shop?sort=asc`. Il corpo di una risposta 2xx è il frammento. Qualsiasi altro stato, un errore di rete, un timeout o un `ssrUrl` relativo conta come errore, e il renderer mette `<!-- SSR error: <app> (<status or message>) -->` nello slot.

Il frammento sostituisce il tag `<tuvix-slot>` stesso, quindi il renderer non aggiunge alcun elemento contenitore. Restituisci l'elemento in cui la tua app lato client si monta, così l'orchestratore trova il container e l'adapter lo idrata:

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

Sul client, registra l'app con `container: '#cart'` e costruiscila con un adapter compatibile con SSR (`createSsrReactMicroApp`, `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`). L'adapter idrata il markup del server invece di eseguire il rendering da zero.

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

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | obbligatorio | HTML della pagina con segnaposto `<tuvix-slot name="x"></tuvix-slot>` o `<tuvix-slot name="x" />`. Il renderer analizza i nomi degli slot una sola volta, alla creazione. |
| `apps` | `ServerAppConfig[]` | obbligatorio | App che possono essere renderizzate sul server. |
| `timeout` | `number` | `5000` | Timeout del fetch in ms per le app senza un proprio `timeout`. |
| `metrics` | `TuvixMetrics` | nessuno | Collector creato da `createMetricsCollector()`. Il renderer registra ogni fetch di frammento e ogni render. |

`ServerAppConfig`:

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Nome dell'app. Il frammento riempie lo slot con lo stesso nome. |
| `ssrUrl` | `string` | obbligatorio | Endpoint assoluto del frammento. Il renderer imposta un parametro di ricerca `path` e mantiene i parametri già presenti nell'URL. Un URL relativo fa fallire il frammento di quell'app. |
| `routes` | `string[]` | obbligatorio | Pattern nella sintassi di [`matchPath`](/it/packages/router#matchpath) con le sue regole di prefisso predefinite, come per `activeWhen` di core: `'/'` corrisponde a ogni path e `'/cart'` corrisponde a `/cart` e a ciò che sta sotto. Le `routes` del router sono diverse: corrispondono all'intero path. L'app viene renderizzata quando un qualsiasi pattern corrisponde. |
| `timeout` | `number` | `timeout` della configurazione | Timeout del fetch in ms per questa app. Il renderer interrompe la richiesta quando scade. |

Funzioni restituite:

- `render(path)` trova le app corrispondenti, recupera tutti i frammenti in parallelo, riempie gli slot e si risolve in `{ html, statusCode, headers }`. `statusCode` vale `502` quando almeno un'app corrisponde e tutti i frammenti falliscono, altrimenti `200`. `headers` contiene `Content-Type: text/html; charset=utf-8` e `X-Powered-By: Tuvix.js`. Un frammento fallito compare come commento HTML nel suo slot; `render` non viene rifiutata per questo. Un path il cui pathname contiene `://` o inizia con `//` si risolve in `400` con il testo `Bad Request`, dopo un avviso e senza alcun fetch di frammenti.
- `matchApps(path)` restituisce le app le cui `routes` corrispondono a `path` con le regole di prefisso di `matchPath(pattern, path)`. Query string e hash non influiscono sul matching.
- `fetchAppHTML(app, path)` recupera un frammento e restituisce il suo HTML, oppure il commento di errore. Non registra metriche.

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

Accetta lo stesso `ServerRendererConfig`. Alla creazione trasforma ogni `<tuvix-slot name="x">fallback</tuvix-slot>` in `<div id="tvx-slot-x" style="display:contents">fallback</div>` e divide la shell all'ultimo `</body>`.

`stream(path, res, options?)`:

1. Imposta `Content-Type: text/html; charset=utf-8`, `Transfer-Encoding: chunked` e `X-Powered-By: Tuvix.js`.
2. Scrive la shell fino a `</body>`. Ogni slot diventa `<div id="tvx-slot-x" style="display:contents">`, che contiene come fallback l'HTML interno della forma con tag di apertura e chiusura, oppure niente per un `<tuvix-slot name="x" />` autochiudente.
3. Recupera i frammenti corrispondenti in parallelo. All'arrivo di ognuno, scrive uno `<script>` inline che analizza il frammento in un `<template>` e sostituisce il segnaposto con esso. Lo script poi ricrea ogni `<script>` del frammento, uno alla volta nell'ordine del documento, copiando ogni attributo (incluso `nonce`) e il suo testo, così il browser lo esegue. Dopo uno script esterno senza `async`, il successivo attende il suo evento `load` o `error`, quindi `<script src="/lib.js"></script><script>Lib.init()</script>` trova `Lib`. Gli script `async` e i blocchi di dati (`type="application/json"`) non bloccano gli altri.
4. Scrive `</body></html>` (il resto della shell) e chiama `res.end()`.

Lo stato è 200: gli header partono con la shell, prima che venga recuperato qualsiasi frammento. Per un path il cui pathname contiene `://` o inizia con `//`, `stream` imposta `res.statusCode = 400`, scrive `Bad Request` come `text/plain` e termina, senza la shell. Il renderer codifica l'HTML dei frammenti in JSON ed esegue l'escape di `<`, `>`, U+2028 e U+2029, quindi un frammento che contiene `</script>` o `<!--` non può chiudere lo script inline.

Con una Content Security Policy senza `'unsafe-inline'`, passa un nonce nuovo per ogni risposta come `options.nonce`. Il renderer lo scrive come `<script nonce="...">` su ogni script inline. Gli script che ricrea da un frammento portano solo l'attributo `nonce` del frammento stesso, quindi assegna quel nonce agli script dei frammenti oppure aggiungi `'strict-dynamic'` alla policy. Senza un nonce, la policy blocca gli script inline e i segnaposto mantengono il loro fallback.

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

Handler in stile Express/Connect. Esegue il rendering di `req.originalUrl ?? req.url`, quindi la query string e un prefisso di mount di Express (`app.use('/shop', ...)`) fanno parte del path confrontato con le route e ricevuto dai servizi dei frammenti. Imposta gli header del risultato con `res.set` (o con `res.setHeader` per ogni header quando `set` manca) e chiama `res.status(result.statusCode).send(result.html)`. Quando `render` lancia un'eccezione, registra l'errore e chiama `next(error)`, oppure invia `500 Internal Server Error` se non hai passato `next`.

Il middleware esegue il rendering di ogni richiesta che riceve, compresi i path a cui non corrisponde nessuna app. Montalo sulle route gestite dalla tua shell, dopo gli handler dei file statici.

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

Chiama `renderer.stream(req.originalUrl ?? req.url, res, { nonce })`, dove `nonce` è `options.nonce?.(req, res)`. Leggilo da dove lo salva il tuo middleware CSP, per esempio `res.locals.cspNonce`. In caso di errore:

- prima della prima scrittura: chiama `next(error)`. Senza `next`, invia 500 tramite `res.status` (Express), oppure imposta `res.statusCode = 500`, scrive `Internal Server Error` e chiude la risposta (`http` di Node);
- dopo la prima scrittura: chiude la risposta e non chiama `next`, perché gli header sono già stati inviati.

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

Sostituisce con `slots[x]` ogni `<tuvix-slot name="x">...</tuvix-slot>` o `<tuvix-slot name="x" />` il cui nome è una chiave propria di `slots`. Gli slot senza una voce restano come sono scritti. Riempie tutti gli slot in un solo passaggio con una funzione di sostituzione, quindi `$&`, `$1`, `` $` ``, `$'` e `$$` nell'HTML dei frammenti restano letterali e un `<tuvix-slot>` dentro un frammento non viene riempito.

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

Analizza i nomi degli slot una sola volta e restituisce `{ slotNames, render }`. `slotNames` elenca ogni nome una volta, nell'ordine della prima occorrenza. `render(slots)` restituisce lo stesso output di `composeHTML(template, slots)`. `createServerRenderer` la chiama per te.

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

Un collector in memoria. Passalo come `metrics` a uno dei due renderer, oppure chiama tu i suoi metodi:

| Metodo | Firma | Comportamento |
| --- | --- | --- |
| `recordRender` | `(durationMs: number) => void` | Conta un render e la sua durata. |
| `recordFragment` | `(name: string, durationMs: number, isError: boolean) => void` | Conta un fetch per l'app `name`, la sua durata e se è fallito. |
| `toPrometheusText` | `() => string` | Formato di esposizione testuale di Prometheus 0.0.4. |
| `reset` | `() => void` | Azzera tutti i contatori. |

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

Output dopo un render in cui `header` ha impiegato 12 ms e `cart` è fallito dopo 2000 ms:

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

Ogni famiglia di metriche riceve una riga `# HELP` e una riga `# TYPE`. Le label compaiono solo sui campioni, e nei valori delle label viene eseguito l'escape di `\`, `"` e dei ritorni a capo. Il collector salta una famiglia senza campioni: prima del primo render ottieni solo i due totali dei render a 0, e le quattro famiglie dei frammenti compaiono dopo il primo fetch di un frammento. Mantiene totali, medie e massimi; non ci sono istogrammi né quantili.

### Tipi

| Tipo | Significato |
| --- | --- |
| `ServerRendererConfig` | `{ shellTemplate, apps, timeout?, metrics? }`, opzioni per entrambi i renderer. |
| `ServerAppConfig` | `{ name, ssrUrl, routes, timeout? }`, un'app. |
| `RenderResult` | `{ html: string; statusCode: number; headers: Record<string, string> }` restituito da `render`. |
| `StreamingResponse` | `{ write(chunk: string): void; end(): void; setHeader(name: string, value: string): void; statusCode?: number }`. Il `ServerResponse` di Node è compatibile. |
| `StreamOptions` | `{ nonce?: string }`, opzioni per richiesta di `stream`. |
| `StreamingMiddlewareOptions` | `{ nonce?: (req, res) => string \| undefined }` per `createStreamingMiddleware`. |
| `MiddlewareRequest` | `{ url: string; originalUrl?: string }`, i campi della richiesta letti da entrambi i middleware. |
| `StreamingMiddlewareResponse` | `StreamingResponse` più un `status(code).send(body)` opzionale in stile Express. |
| `CompiledTemplate` | `{ slotNames: string[]; render(slots: Record<string, string>): string }`. |
| `TuvixMetrics` | Interfaccia del collector restituito da `createMetricsCollector`. |

## Casi limite

- Il frammento riempie lo slot il cui nome è uguale al `name` dell'app. Un'app corrispondente senza slot viene comunque recuperata e il suo HTML scartato.
- `render` e `stream` rifiutano un pathname di richiesta che contiene `://` o inizia con `//` con un avviso e un `400 Bad Request`. Non recuperano alcun frammento e non registrano metriche dei frammenti. Il controllo ignora la query, quindi `?next=https://...` passa. `fetchAppHTML` restituisce `<!-- SSR error: invalid path -->` per un path del genere. Il renderer rimuove le sequenze `..` e comprime gli slash ripetuti nel pathname (non nella query) prima di inviarlo ai servizi dei frammenti.
- Gli script in un frammento in streaming vengono eseguiti quando viene eseguito il suo script di sostituzione, dopo gli script della shell che lo precedono. Rimuovi gli elementi `<script>` nel servizio del frammento se devono restare inerti.
- Il renderer esegue l'escape del nome dell'app e del messaggio di errore nei commenti di errore, quindi un testo di errore che contiene `-->` non può chiudere il commento.
- Uno `statusCode` 200 può nascondere errori parziali. Leggi `tuvix_fragment_errors_total` o cerca `<!-- SSR error` nell'HTML.

## Cosa non fa

- Non esegue il rendering dei componenti. Ogni servizio di frammento renderizza la propria app con il renderer lato server del suo framework.
- Non mette in cache i frammenti e non ripete un fetch fallito.
- Non inoltra cookie o header della richiesta ai servizi dei frammenti. Invia solo `Accept: text/html`.
- Non esegue la hydration di nulla. Se ne occupano gli adapter lato client.
- Non unisce il contenuto del `<head>` dei frammenti (stili, meta tag) nel `<head>` della shell. Metti gli asset condivisi nella shell, oppure usa [`@tuvix.js/vite`](/it/packages/vite) quando un solo server Vite esegue il rendering delle island.

## Migrazione dalla 0.4

- `createServerRenderer().render()` restituisce `statusCode: 502` quando almeno un'app corrisponde e tutti i frammenti falliscono. `createMiddleware` lo invia. Il renderer in streaming invia ancora 200.
- Un pathname di richiesta che contiene `://` o inizia con `//` riceve `400 Bad Request` da `render` e `stream`. Nella 0.4 ogni frammento falliva con un commento di errore dentro una pagina 200.
- `createMiddleware` e `createStreamingMiddleware` chiamano `next(error)` invece di `next()` quando il rendering lancia un'eccezione, così Express esegue il tuo error handler.
- Le route usano `matchPath`, quindi `/dashboard?tab=1` corrisponde a `/dashboard/*` e `/users/42#bio` corrisponde a `/users/:id`.
- `toPrometheusText()` scrive una riga `# HELP` e una riga `# TYPE` per famiglia, con le label solo sui campioni. L'output della 0.4 le ripeteva per ogni app con le label nel nome della metrica, e Prometheus lo rifiutava.
- Entrambi i middleware eseguono il rendering di `req.originalUrl ?? req.url` invece di `req.path ?? req.url`. I servizi dei frammenti ricevono la query string in `path` e, sotto `app.use('/prefix', ...)`, vedono l'URL completo con `/prefix`.
- `ssrUrl` deve essere assoluto. Uno relativo ora produce il commento di errore per quell'app. I parametri di query in `ssrUrl` vengono mantenuti invece di produrre un secondo `?`.
- Gli script nei frammenti in streaming ora vengono eseguiti. Rimuovili nel servizio del frammento se contavi sul fatto che restassero inerti.
- Anche un `<tuvix-slot name="x" />` autochiudente riceve un segnaposto in streaming.

La documentazione della 0.4 mostrava `createMiddleware({ template })`, `renderer.render({ apps, props })` e un'opzione `hydrate: true` dell'orchestratore. Nessuno di questi esiste. Passa un renderer a `createMiddleware`:

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

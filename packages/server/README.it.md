# @tuvix.js/server

> Recupera i frammenti HTML delle micro app e componili in una pagina shell, come risposta unica o come stream BigPipe

Fa parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentazione completa: [tuvix.js.org/it/packages/server](https://tuvix.js.org/it/packages/server).

Scrivi un template della shell con i segnaposto `<tuvix-slot name="...">`. A ogni richiesta, il renderer sceglie le app le cui `routes` corrispondono al percorso (con `matchPath` di `@tuvix.js/router`), recupera i loro frammenti in parallelo via HTTP e mette ogni frammento al posto del suo slot. Richiede Node.js 18+ (`fetch` globale).

## Installazione

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

## Avvio rapido

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

Per `/cart/42?coupon=x`, il renderer chiama `GET <ssrUrl>` con `path=%2Fcart%2F42%3Fcoupon%3Dx` impostato tramite `URL.searchParams` (i parametri già presenti in `ssrUrl` restano; l'`#hash` viene scartato) e `Accept: text/html` su entrambi i servizi. `ssrUrl` deve essere assoluto. Ogni body 2xx sostituisce il proprio tag `<tuvix-slot>`. Uno status non 2xx, un errore di rete, un timeout o un `ssrUrl` relativo diventano `<!-- SSR error: <app> (<reason>) -->`. Restituisci dal servizio dei frammenti l'elemento container della tua app (`<div id="cart">...</div>`), così l'adapter lato client può eseguirne la hydration.

## API

### `createServerRenderer(config)`

Restituisce `{ render, matchApps, fetchAppHTML }`.

| Opzione | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | obbligatorio | HTML con `<tuvix-slot name="x">fallback</tuvix-slot>` o `<tuvix-slot name="x" />`. |
| `apps` | `ServerAppConfig[]` | obbligatorio | `{ name, ssrUrl, routes, timeout? }`. `name` sceglie lo slot; `routes` usano le regole di prefisso di `matchPath` (query e hash ignorati). |
| `timeout` | `number` | `5000` | Timeout del fetch in ms quando un'app non ne imposta uno. |
| `metrics` | `TuvixMetrics` | nessuno | Collector creato da `createMetricsCollector()`. |

- `render(path)` si risolve in `{ html, statusCode, headers }`. `statusCode` è `502` quando almeno un'app corrisponde e tutti i frammenti falliscono, altrimenti `200`. Gli slot senza corrispondenza mantengono il loro fallback. Un percorso il cui pathname contiene `://` o inizia con `//` restituisce `400` con il testo `Bad Request` e non recupera nulla.
- `matchApps(path)` restituisce le app corrispondenti.
- `fetchAppHTML(app, path)` recupera un frammento (o il commento di errore), senza metriche.

### `createStreamingRenderer(config)`

Stessa configurazione. Restituisce `{ stream, matchApps }`. `stream(path, res, { nonce? })` scrive la shell fino a `</body>` con i segnaposto `<div id="tvx-slot-x" style="display:contents">` (gli slot con tag di chiusura mantengono il loro HTML interno come fallback, quelli autochiudenti sono vuoti). Poi scrive uno `<script>` inline per ogni frammento man mano che arriva: lo script analizza il frammento in un `<template>`, sostituisce il segnaposto e ricrea uno alla volta, nell'ordine del documento, ogni `<script>` del frammento (tutti gli attributi, `nonce` compreso, più il testo). Dopo uno script esterno senza `async`, il successivo attende il suo `load` o `error`, quindi `<script src="/lib.js"></script><script>Lib.init()</script>` funziona. Gli script `async` e i blocchi di dati (`type="application/json"`) non bloccano mai. Il frammento viene escapato in JSON così `</script>` non può uscirne. Infine scrive il resto della shell. Lo status è 200, oppure 400 (`Bad Request`, senza shell) per un percorso che indica un altro host. `res` è uno `StreamingResponse` (`write`, `end`, `setHeader`, `statusCode` opzionale); il `ServerResponse` di Node è compatibile.

Con una CSP senza `'unsafe-inline'`, passa un `nonce` nuovo per ogni risposta; il renderer lo applica ai propri script inline. Gli script dei frammenti hanno bisogno di un proprio attributo `nonce` o di una policy con `'strict-dynamic'`.

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

Handler Express/Connect `(req, res, next?)`. Renderizza `req.originalUrl ?? req.url` (query string e prefisso di mount di Express inclusi), imposta gli header con `res.set` o `res.setHeader`, invia `res.status(statusCode).send(html)`. Se viene lanciata un'eccezione: `next(error)`, o 500 senza `next`.

### `createStreamingMiddleware(renderer, options?)`

Chiama `renderer.stream(req.originalUrl ?? req.url, res, { nonce })`, con `nonce` preso da `options.nonce?.(req, res)` (per esempio `res.locals.cspNonce`). Errore prima della prima scrittura: `next(error)`; senza `next`, `res.status(500).send()` su Express, oppure `statusCode = 500` più `end()` su un `ServerResponse` di Node. Errore dopo: chiude la risposta, non chiama `next`.

### `composeHTML(template, slots)` e `compileShellTemplate(template)`

`composeHTML` sostituisce in un solo passaggio ogni slot nominato in `slots`; gli altri restano come sono scritti. `$&`, `$1` e un `<tuvix-slot>` dentro l'HTML del frammento restano letterali. `compileShellTemplate` restituisce `{ slotNames, render(slots) }` con i nomi analizzati una sola volta.

```ts
import { composeHTML } from '@tuvix.js/server';

composeHTML('<main><tuvix-slot name="main" /></main>', { main: '<p>Hello</p>' }); // '<main><p>Hello</p></main>'
```

### `createMetricsCollector()`

Restituisce `TuvixMetrics`: `recordRender(ms)`, `recordFragment(name, ms, isError)`, `toPrometheusText()`, `reset()`. Metriche: `tuvix_renders_total`, `tuvix_render_duration_ms_total` (counter), `tuvix_render_duration_ms_avg`, `tuvix_render_duration_ms_max` (gauge) e, per app (`{app="..."}`), `tuvix_fragment_fetches_total`, `tuvix_fragment_errors_total`, `tuvix_fragment_avg_duration_ms`, `tuvix_fragment_max_duration_ms`. Un `# HELP` e un `# TYPE` per famiglia; i valori delle label fanno l'escape di `\`, `"` e dei ritorni a capo. Servilo con `Content-Type: text/plain; version=0.0.4`.

### Tipi

`ServerRendererConfig`, `ServerAppConfig`, `RenderResult`, `StreamingResponse`, `StreamOptions`, `StreamingMiddlewareOptions`, `StreamingMiddlewareResponse`, `MiddlewareRequest`, `CompiledTemplate`, `TuvixMetrics`.

## Casi limite

- `render` e `stream` rispondono `400 Bad Request` una sola volta a una richiesta il cui pathname contiene `://` o inizia con `//`; non recuperano alcun frammento e non registrano metriche dei frammenti. La query non viene verificata. Per un percorso del genere `fetchAppHTML` restituisce `<!-- SSR error: invalid path -->`. Le sequenze `..` vengono rimosse dal pathname prima che arrivi ai servizi dei frammenti.
- Gli script nei frammenti in streaming vengono eseguiti. Rimuovili nel servizio dei frammenti se devono restare inerti.
- Un'app corrispondente senza uno slot con lo stesso nome viene recuperata e il suo HTML scartato.

## Cosa non fa

- Non renderizza componenti, non mette in cache i frammenti, non ripete i fetch e non inoltra cookie e header.
- Non esegue la hydration. Se ne occupano gli adapter lato client (`createSsrReactMicroApp` e gli equivalenti per Vue, Svelte e Angular).
- Non sposta il contenuto `<head>` dei frammenti nell'`<head>` della shell.

## Migrazione dalla 0.4

- `render()` restituisce 502 quando tutti i frammenti corrispondenti falliscono; `createMiddleware` lo invia.
- Entrambi i middleware chiamano `next(error)` invece di `next()` in caso di errore.
- Le route usano `matchPath`: `/dashboard?tab=1` corrisponde a `/dashboard/*`.
- L'output di `toPrometheusText()` è testo Prometheus valido: un HELP/TYPE per famiglia.
- Entrambi i middleware renderizzano `req.originalUrl ?? req.url` invece di `req.path ?? req.url`.
- `ssrUrl` deve essere assoluto; i suoi parametri di query esistenti vengono mantenuti.
- Gli script nei frammenti in streaming ora vengono eseguiti, e gli slot autochiudenti ricevono un segnaposto di streaming.
- Un pathname di richiesta che contiene `://` o inizia con `//` riceve `400 Bad Request` da `render` e `stream`.

## Licenza

MIT

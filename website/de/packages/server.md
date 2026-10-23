---
title: '@tuvix.js/server'
---

<PackageHeader
  name="@tuvix.js/server"
  title="Server"
  description="Serverseitige Seitenkomposition für Tuvix.js. Hole das HTML-Fragment jeder Micro App per HTTP und fülle die Slots eines Shell-Templates, als eine Antwort oder als BigPipe-Stream."
  icon="🖥️"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

Das Paket läuft auf Node.js 18 oder neuer und nutzt das globale `fetch`. Für das Route-Matching hängt es von `@tuvix.js/router` ab.

## Wann du es verwendest {#when-to-use-it}

Verwende es, wenn jede Micro App ihren eigenen Render-Service betreibt und ein Shell-Server die Seite zusammensetzt. Du schreibst ein Shell-HTML-Template mit Platzhaltern `<tuvix-slot name="...">`. Für jeden Request wählt der Renderer die Apps aus, deren `routes` zum Pfad passen, holt ihre Fragmente parallel und setzt jedes Fragment an die Stelle seines Slots.

Nimm `createServerRenderer` mit `createMiddleware`, wenn du eine vollständige HTML-Antwort und den Status 502 willst, sobald jedes Fragment fehlschlägt. Nimm `createStreamingRenderer` mit `createStreamingMiddleware`, wenn der `<head>` der Shell im Browser ankommen soll, bevor das langsamste Fragment zurückkommt.

Rendert ein einziger Server jedes Island selbst (eine Next.js-, Astro- oder Vite-SSR-App, die `renderVueToString` oder Reacts `renderToString` aufruft), brauchst du dieses Paket nicht. Wie du in diesem Setup Island-Assets verlinkst, steht bei [`@tuvix.js/vite`](/de/packages/vite).

## Schnellstart {#quick-start}

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

Ein Request für `/cart/42?coupon=x`:

1. `header` passt (`'/'` passt auf jeden Pfad) und `cart` passt auf `/cart/*`.
2. Der Renderer sendet parallel `GET http://header-service:3001/render?path=%2Fcart%2F42%3Fcoupon%3Dx` und denselben Request an den Cart-Service. Die Middleware liest `req.originalUrl`, daher erreicht der Query-String die Fragment-Services.
3. Jeder Response-Body ersetzt sein gesamtes `<tuvix-slot>`-Element.
4. Die Middleware sendet den Status 200 mit `Content-Type: text/html; charset=utf-8` und `X-Powered-By: Tuvix.js`.

Auf `/about` passt nur `header`. Der Slot `cart` bleibt als `<tuvix-slot name="cart"><p>Loading cart...</p></tuvix-slot>` im HTML, und der Browser rendert seinen Fallback-Inhalt.

## Fragment-Services {#fragment-services}

Der Renderer ruft die `ssrUrl` jeder App mit `GET` und `Accept: text/html` auf. Er baut die URL mit `new URL(ssrUrl)` und setzt einen Suchparameter `path` auf den Pfadnamen des Requests plus Query, ohne `#hash`. Parameter, die schon in `ssrUrl` stehen, bleiben erhalten: Aus `http://cart:3002/render?v=2` wird für `/shop?sort=asc` die URL `http://cart:3002/render?v=2&path=%2Fshop%3Fsort%3Dasc`. Der Body einer 2xx-Antwort ist das Fragment. Jeder andere Status, ein Netzwerkfehler, ein Timeout oder eine relative `ssrUrl` gilt als Fehlschlag, und der Renderer setzt `<!-- SSR error: <app> (<status or message>) -->` in den Slot.

Das Fragment ersetzt das `<tuvix-slot>`-Tag selbst, der Renderer fügt also kein Wrapper-Element hinzu. Gib das Element zurück, in das deine clientseitige App mountet, damit der Orchestrator den Container findet und der Adapter ihn hydriert:

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

Registriere die App auf dem Client mit `container: '#cart'` und baue sie mit einem SSR-fähigen Adapter (`createSsrReactMicroApp`, `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`). Der Adapter hydriert das Server-Markup, statt von Grund auf zu rendern.

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

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | erforderlich | Seiten-HTML mit Platzhaltern `<tuvix-slot name="x"></tuvix-slot>` oder `<tuvix-slot name="x" />`. Der Renderer liest die Slot-Namen einmal beim Erstellen aus. |
| `apps` | `ServerAppConfig[]` | erforderlich | Apps, die auf dem Server rendern können. |
| `timeout` | `number` | `5000` | Fetch-Timeout in ms für Apps ohne eigenes `timeout`. |
| `metrics` | `TuvixMetrics` | keiner | Collector aus `createMetricsCollector()`. Der Renderer erfasst jeden Fragment-Fetch und jedes Rendering. |

`ServerAppConfig`:

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | App-Name. Das Fragment füllt den Slot mit demselben Namen. |
| `ssrUrl` | `string` | erforderlich | Absoluter Fragment-Endpunkt. Der Renderer setzt einen Suchparameter `path` und behält die Parameter, die schon in der URL stehen. Eine relative URL lässt das Fragment dieser App fehlschlagen. |
| `routes` | `string[]` | erforderlich | Muster in der Syntax von [`matchPath`](/de/packages/router#matchpath) mit dessen Standard-Präfixregeln, genau wie `activeWhen` im Core: `'/'` passt auf jeden Pfad und `'/cart'` passt auf `/cart` und alles darunter. Router-`routes` verhalten sich anders: Sie matchen den ganzen Pfad. Die App rendert, wenn irgendein Muster passt. |
| `timeout` | `number` | `timeout` der Config | Fetch-Timeout in ms für diese App. Der Renderer bricht den Request ab, wenn er abläuft. |

Zurückgegebene Funktionen:

- `render(path)` ermittelt die passenden Apps, holt jedes Fragment parallel, füllt die Slots und liefert `{ html, statusCode, headers }`. `statusCode` ist `502`, wenn mindestens eine App gepasst hat und jedes Fragment fehlgeschlagen ist, sonst `200`. `headers` enthält `Content-Type: text/html; charset=utf-8` und `X-Powered-By: Tuvix.js`. Ein fehlgeschlagenes Fragment erscheint als HTML-Kommentar in seinem Slot; `render` wird deshalb nicht abgelehnt. Ein Pfad, dessen Pfadname `://` enthält oder mit `//` beginnt, liefert `400` mit dem Text `Bad Request`, nach einer Warnung und ohne Fragment-Fetch.
- `matchApps(path)` gibt die Apps zurück, deren `routes` nach den Präfixregeln von `matchPath(pattern, path)` auf `path` passen. Query-String und Hash beeinflussen das Matching nicht.
- `fetchAppHTML(app, path)` holt ein einzelnes Fragment und gibt sein HTML oder den Fehlerkommentar zurück. Es erfasst keine Metriken.

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

Nimmt dieselbe `ServerRendererConfig`. Beim Erstellen wandelt er jedes `<tuvix-slot name="x">fallback</tuvix-slot>` in `<div id="tvx-slot-x" style="display:contents">fallback</div>` um und teilt die Shell am letzten `</body>`.

`stream(path, res, options?)`:

1. Setzt `Content-Type: text/html; charset=utf-8`, `Transfer-Encoding: chunked` und `X-Powered-By: Tuvix.js`.
2. Schreibt die Shell bis `</body>`. Jeder Slot wird zu `<div id="tvx-slot-x" style="display:contents">` und enthält als Fallback das innere HTML der paarigen Form, bei einem selbstschließenden `<tuvix-slot name="x" />` nichts.
3. Holt die passenden Fragmente parallel. Sobald eines ankommt, schreibt er ein Inline-`<script>`, das das Fragment in einem `<template>` parst und den Platzhalter damit ersetzt. Danach erzeugt das Skript jedes `<script>` im Fragment neu, eines nach dem anderen in Dokumentreihenfolge, und kopiert jedes Attribut (auch `nonce`) und den Text, damit der Browser es ausführt. Nach einem externen Skript ohne `async` wartet das nächste auf dessen Event `load` oder `error`, daher findet `<script src="/lib.js"></script><script>Lib.init()</script>` das Objekt `Lib`. `async`-Skripte und Datenblöcke (`type="application/json"`) halten den Rest nicht auf.
4. Schreibt `</body></html>` (den Rest der Shell) und ruft `res.end()` auf.

Der Status ist 200: Die Header gehen mit der Shell raus, bevor irgendein Fragment geholt wird. Für einen Pfad, dessen Pfadname `://` enthält oder mit `//` beginnt, setzt `stream` `res.statusCode = 400`, schreibt `Bad Request` als `text/plain` und beendet die Antwort, ohne die Shell. Der Renderer kodiert das Fragment-HTML als JSON und escapet `<`, `>`, U+2028 und U+2029, damit ein Fragment mit `</script>` oder `<!--` das Inline-Skript nicht beenden kann.

Unter einer Content Security Policy ohne `'unsafe-inline'` übergibst du als `options.nonce` eine frische Nonce pro Antwort. Der Renderer schreibt sie als `<script nonce="...">` an jedes Inline-Skript. Die Skripte, die er aus einem Fragment neu erzeugt, tragen nur das eigene `nonce`-Attribut des Fragments. Gib den Fragment-Skripten also diese Nonce oder ergänze die Policy um `'strict-dynamic'`. Ohne Nonce blockiert die Policy die Inline-Skripte, und die Platzhalter behalten ihren Fallback.

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

Handler im Stil von Express/Connect. Er rendert `req.originalUrl ?? req.url`, daher gehören der Query-String und ein Express-Mount-Präfix (`app.use('/shop', ...)`) zum Pfad, auf den die Routes matchen und den die Fragment-Services erhalten. Er setzt die Header des Ergebnisses mit `res.set` (oder pro Header mit `res.setHeader`, wenn `set` fehlt) und ruft `res.status(result.statusCode).send(result.html)` auf. Wirft `render`, loggt er den Fehler und ruft `next(error)` auf oder sendet `500 Internal Server Error`, wenn du kein `next` übergeben hast.

Die Middleware rendert jeden Request, den sie erhält, auch Pfade, auf die keine App passt. Mounte sie auf die Routes, die deiner Shell gehören, nach den Handlern für statische Dateien.

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

Ruft `renderer.stream(req.originalUrl ?? req.url, res, { nonce })` auf, wobei `nonce` den Wert `options.nonce?.(req, res)` hat. Lies die Nonce dort aus, wo deine CSP-Middleware sie ablegt, zum Beispiel `res.locals.cspNonce`. Bei einem Fehler:

- vor dem ersten Schreiben: ruft `next(error)` auf. Ohne `next` sendet sie 500 über `res.status` (Express) oder setzt `res.statusCode = 500`, schreibt `Internal Server Error` und beendet die Antwort (Node `http`);
- nach dem ersten Schreiben: beendet die Antwort und ruft `next` nicht auf, weil die Header schon gesendet sind.

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

Ersetzt jedes `<tuvix-slot name="x">...</tuvix-slot>` oder `<tuvix-slot name="x" />`, dessen Name ein eigener Schlüssel von `slots` ist, durch `slots[x]`. Slots ohne Eintrag bleiben unverändert. Die Funktion füllt alle Slots in einem Durchgang mit einer Replacer-Funktion, daher bleiben `$&`, `$1`, `` $` ``, `$'` und `$$` im Fragment-HTML wörtlich erhalten, und ein `<tuvix-slot>` innerhalb eines Fragments wird nicht gefüllt.

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

Liest die Slot-Namen einmal aus und gibt `{ slotNames, render }` zurück. `slotNames` führt jeden Namen einmal auf, in der Reihenfolge seines ersten Vorkommens. `render(slots)` liefert dieselbe Ausgabe wie `composeHTML(template, slots)`. `createServerRenderer` ruft die Funktion für dich auf.

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

Ein In-Memory-Collector. Übergib ihn als `metrics` an einen der beiden Renderer, oder ruf seine Methoden selbst auf:

| Methode | Signatur | Verhalten |
| --- | --- | --- |
| `recordRender` | `(durationMs: number) => void` | Zählt ein Rendering und seine Dauer. |
| `recordFragment` | `(name: string, durationMs: number, isError: boolean) => void` | Zählt einen Fetch für die App `name`, seine Dauer und ob er fehlgeschlagen ist. |
| `toPrometheusText` | `() => string` | Prometheus-Text-Expositionsformat 0.0.4. |
| `reset` | `() => void` | Setzt jeden Zähler zurück. |

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

Ausgabe nach einem Rendering, bei dem `header` 12 ms gebraucht hat und `cart` nach 2000 ms fehlgeschlagen ist:

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

Jede Metrikfamilie bekommt genau eine Zeile `# HELP` und eine Zeile `# TYPE`. Labels erscheinen nur an Samples, und Label-Werte escapen `\`, `"` und Zeilenumbrüche. Der Collector überspringt Familien ohne Samples: Vor dem ersten Rendering bekommst du nur die beiden Render-Summen mit 0, und die vier Fragment-Familien erscheinen nach dem ersten Fragment-Fetch. Er führt Summen, Durchschnitte und Maxima; Histogramme oder Quantile gibt es nicht.

### Typen {#types}

| Typ | Bedeutung |
| --- | --- |
| `ServerRendererConfig` | `{ shellTemplate, apps, timeout?, metrics? }`, Optionen für beide Renderer. |
| `ServerAppConfig` | `{ name, ssrUrl, routes, timeout? }`, eine App. |
| `RenderResult` | `{ html: string; statusCode: number; headers: Record<string, string> }` aus `render`. |
| `StreamingResponse` | `{ write(chunk: string): void; end(): void; setHeader(name: string, value: string): void; statusCode?: number }`. Nodes `ServerResponse` erfüllt es. |
| `StreamOptions` | `{ nonce?: string }`, Optionen pro Request für `stream`. |
| `StreamingMiddlewareOptions` | `{ nonce?: (req, res) => string \| undefined }` für `createStreamingMiddleware`. |
| `MiddlewareRequest` | `{ url: string; originalUrl?: string }`, die Request-Felder, die beide Middlewares lesen. |
| `StreamingMiddlewareResponse` | `StreamingResponse` plus ein optionales `status(code).send(body)` im Stil von Express. |
| `CompiledTemplate` | `{ slotNames: string[]; render(slots: Record<string, string>): string }`. |
| `TuvixMetrics` | Collector-Interface, das `createMetricsCollector` zurückgibt. |

## Sonderfälle {#edge-cases}

- Das Fragment füllt den Slot, dessen Name dem `name` der App entspricht. Eine passende App ohne Slot wird trotzdem abgerufen, und ihr HTML wird verworfen.
- `render` und `stream` lehnen einen Request-Pfadnamen, der `://` enthält oder mit `//` beginnt, mit einer Warnung und `400 Bad Request` ab. Sie holen kein Fragment und erfassen keine Fragment-Metriken. Die Prüfung ignoriert die Query, daher kommt `?next=https://...` durch. `fetchAppHTML` gibt für einen solchen Pfad `<!-- SSR error: invalid path -->` zurück. Bevor der Renderer den Pfadnamen (nicht die Query) an Fragment-Services sendet, entfernt er `..`-Folgen und fasst wiederholte Schrägstriche zusammen.
- Skripte in einem gestreamten Fragment laufen, sobald sein Swap-Skript läuft, also nach den Skripten der Shell darüber. Entferne `<script>`-Elemente auf dem Fragment-Service, wenn sie wirkungslos bleiben müssen.
- Der Renderer escapet App-Namen und Fehlermeldung in Fehlerkommentaren, daher kann ein Fehlertext mit `-->` den Kommentar nicht schließen.
- Ein `statusCode` von 200 kann Teilausfälle verbergen. Lies `tuvix_fragment_errors_total` aus oder such im HTML nach `<!-- SSR error`.

## Was es nicht tut {#what-it-does-not-do}

- Es rendert keine Komponenten. Jeder Fragment-Service rendert seine eigene App mit dem Server-Renderer seines Frameworks.
- Es cacht keine Fragmente und wiederholt keinen fehlgeschlagenen Fetch.
- Es leitet keine Cookies oder Request-Header an Fragment-Services weiter. Es sendet nur `Accept: text/html`.
- Es hydriert nichts. Das übernehmen die clientseitigen Adapter.
- Es führt `<head>`-Inhalte der Fragmente (Styles, Meta-Tags) nicht in den `<head>` der Shell zusammen. Leg gemeinsame Assets in die Shell, oder nutze [`@tuvix.js/vite`](/de/packages/vite), wenn ein Vite-Server die Islands rendert.

## Migration von 0.4 {#migrating-from-0-4}

- `createServerRenderer().render()` gibt `statusCode: 502` zurück, wenn mindestens eine App gepasst hat und jedes Fragment fehlgeschlagen ist. `createMiddleware` sendet ihn. Der Streaming-Renderer sendet weiterhin 200.
- Ein Request-Pfadname, der `://` enthält oder mit `//` beginnt, bekommt von `render` und `stream` die Antwort `400 Bad Request`. In 0.4 schlug jedes Fragment mit einem Fehlerkommentar in einer Seite mit Status 200 fehl.
- `createMiddleware` und `createStreamingMiddleware` rufen `next(error)` statt `next()` auf, wenn das Rendering wirft, damit Express deinen Error-Handler ausführt.
- Routes nutzen `matchPath`, daher passt `/dashboard?tab=1` auf `/dashboard/*` und `/users/42#bio` auf `/users/:id`.
- `toPrometheusText()` schreibt pro Familie genau eine Zeile `# HELP` und eine Zeile `# TYPE`, mit Labels nur an Samples. Die Ausgabe von 0.4 wiederholte sie pro App mit Labels im Metriknamen, was Prometheus ablehnte.
- Beide Middlewares rendern `req.originalUrl ?? req.url` statt `req.path ?? req.url`. Fragment-Services erhalten den Query-String in `path` und sehen unter `app.use('/prefix', ...)` die vollständige URL mit `/prefix`.
- `ssrUrl` muss absolut sein. Eine relative URL erzeugt jetzt den Fehlerkommentar für diese App. Query-Parameter in `ssrUrl` bleiben erhalten, statt ein zweites `?` zu erzeugen.
- Skripte in gestreamten Fragmenten laufen jetzt. Entferne sie auf dem Fragment-Service, wenn du dich darauf verlassen hast, dass sie wirkungslos bleiben.
- Ein selbstschließendes `<tuvix-slot name="x" />` bekommt jetzt ebenfalls einen Streaming-Platzhalter.

Die Doku zu 0.4 zeigte `createMiddleware({ template })`, `renderer.render({ apps, props })` und eine Orchestrator-Option `hydrate: true`. Nichts davon existiert. Übergib einen Renderer an `createMiddleware`:

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

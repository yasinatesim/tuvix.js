# @tuvix.js/server

> Lädt HTML-Fragmente von Micro Apps und setzt sie zu einer Shell-Seite zusammen, als eine Antwort oder als BigPipe-Stream

Teil des [Tuvix.js](https://github.com/yasinatesim/tuvix.js) Microfrontend-Frameworks. Vollständige Dokumentation: [tuvix.js.org/de/packages/server](https://tuvix.js.org/de/packages/server).

Du schreibst ein Shell-Template mit Platzhaltern `<tuvix-slot name="...">`. Pro Request wählt der Renderer die Apps aus, deren `routes` den Pfad treffen (mit `matchPath` aus `@tuvix.js/router`), lädt ihre Fragmente parallel über HTTP und setzt jedes Fragment an die Stelle seines Slots. Benötigt Node.js 18+ (globales `fetch`).

## Installation

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

## Schnellstart

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

Für `/cart/42?coupon=x` ruft der Renderer auf beiden Services `GET <ssrUrl>` mit `path=%2Fcart%2F42%3Fcoupon%3Dx` (gesetzt über `URL.searchParams`; Parameter, die schon in `ssrUrl` stehen, bleiben erhalten; der `#hash` fällt weg) und `Accept: text/html` auf. `ssrUrl` muss absolut sein. Jeder 2xx-Body ersetzt sein `<tuvix-slot>`-Tag. Ein Status außerhalb von 2xx, ein Netzwerkfehler, ein Timeout oder eine relative `ssrUrl` wird zu `<!-- SSR error: <app> (<reason>) -->`. Gib vom Fragment-Service das Container-Element deiner App zurück (`<div id="cart">...</div>`), damit der Client-Adapter es hydrieren kann.

## API

### `createServerRenderer(config)`

Gibt `{ render, matchApps, fetchAppHTML }` zurück.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | erforderlich | HTML mit `<tuvix-slot name="x">fallback</tuvix-slot>` oder `<tuvix-slot name="x" />`. |
| `apps` | `ServerAppConfig[]` | erforderlich | `{ name, ssrUrl, routes, timeout? }`. `name` wählt den Slot; `routes` verwenden die Präfixregeln von `matchPath` (Query und Hash werden ignoriert). |
| `timeout` | `number` | `5000` | Fetch-Timeout in ms, wenn eine App keinen setzt. |
| `metrics` | `TuvixMetrics` | keiner | Collector aus `createMetricsCollector()`. |

- `render(path)` löst zu `{ html, statusCode, headers }` auf. `statusCode` ist `502`, wenn mindestens eine App getroffen wurde und jedes Fragment fehlgeschlagen ist, sonst `200`. Nicht getroffene Slots behalten ihren Fallback. Ein Pfad, dessen Pathname `://` enthält oder mit `//` beginnt, gibt `400` mit dem Text `Bad Request` zurück und lädt nichts.
- `matchApps(path)` gibt die passenden Apps zurück.
- `fetchAppHTML(app, path)` lädt ein Fragment (oder den Fehlerkommentar), ohne Metriken.

### `createStreamingRenderer(config)`

Gleiche Konfiguration. Gibt `{ stream, matchApps }` zurück. `stream(path, res, { nonce? })` schreibt die Shell bis `</body>` mit Platzhaltern `<div id="tvx-slot-x" style="display:contents">` (Slots mit Start- und End-Tag behalten ihr inneres HTML als Fallback, selbstschließende Slots sind leer). Danach schreibt es pro Fragment ein Inline-`<script>`, sobald das Fragment eintrifft: Das Skript parst das Fragment in einem `<template>`, ersetzt den Platzhalter und erzeugt jedes `<script>` des Fragments neu (alle Attribute inklusive `nonce`, dazu der Text), eines nach dem anderen in Dokumentreihenfolge. Nach einem externen Skript ohne `async` wartet das nächste auf dessen `load` oder `error`, sodass `<script src="/lib.js"></script><script>Lib.init()</script>` funktioniert. `async`-Skripte und Datenblöcke (`type="application/json"`) blockieren nie. Das Fragment ist JSON-escaped, sodass `</script>` nicht ausbrechen kann. Danach schreibt es den Rest der Shell. Der Status ist 200, oder 400 (`Bad Request`, keine Shell) für einen Pfad, der einen anderen Host nennt. `res` ist eine `StreamingResponse` (`write`, `end`, `setHeader`, optional `statusCode`); die `ServerResponse` von Node passt.

Unter einer CSP ohne `'unsafe-inline'` übergibst du pro Antwort eine frische `nonce`; der Renderer setzt sie auf seine Inline-Skripte. Skripte in Fragmenten brauchen ein eigenes `nonce`-Attribut oder eine Policy mit `'strict-dynamic'`.

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

Express/Connect-Handler `(req, res, next?)`. Rendert `req.originalUrl ?? req.url` (inklusive Query-String und Mount-Präfix von Express), setzt Header mit `res.set` oder `res.setHeader` und sendet `res.status(statusCode).send(html)`. Bei einem geworfenen Fehler: `next(error)`, ohne `next` 500.

### `createStreamingMiddleware(renderer, options?)`

Ruft `renderer.stream(req.originalUrl ?? req.url, res, { nonce })` auf, mit `nonce` aus `options.nonce?.(req, res)` (zum Beispiel `res.locals.cspNonce`). Fehler vor dem ersten Schreiben: `next(error)`; ohne `next` unter Express `res.status(500).send()`, bei einer Node-`ServerResponse` `statusCode = 500` plus `end()`. Fehler danach: beendet die Antwort und ruft `next` nicht auf.

### `composeHTML(template, slots)` und `compileShellTemplate(template)`

`composeHTML` ersetzt jeden in `slots` genannten Slot in einem Durchlauf; die übrigen bleiben, wie sie geschrieben sind. `$&`, `$1` und ein `<tuvix-slot>` im HTML eines Fragments bleiben wörtlich erhalten. `compileShellTemplate` gibt `{ slotNames, render(slots) }` zurück und scannt die Namen einmal.

```ts
import { composeHTML } from '@tuvix.js/server';

composeHTML('<main><tuvix-slot name="main" /></main>', { main: '<p>Hello</p>' }); // '<main><p>Hello</p></main>'
```

### `createMetricsCollector()`

Gibt `TuvixMetrics` zurück: `recordRender(ms)`, `recordFragment(name, ms, isError)`, `toPrometheusText()`, `reset()`. Metriken: `tuvix_renders_total`, `tuvix_render_duration_ms_total` (Counter), `tuvix_render_duration_ms_avg`, `tuvix_render_duration_ms_max` (Gauges) und pro App (`{app="..."}`) `tuvix_fragment_fetches_total`, `tuvix_fragment_errors_total`, `tuvix_fragment_avg_duration_ms`, `tuvix_fragment_max_duration_ms`. Ein `# HELP` und ein `# TYPE` pro Familie; Label-Werte escapen `\`, `"` und Zeilenumbrüche. Liefere die Ausgabe mit `Content-Type: text/plain; version=0.0.4` aus.

### Typen

`ServerRendererConfig`, `ServerAppConfig`, `RenderResult`, `StreamingResponse`, `StreamOptions`, `StreamingMiddlewareOptions`, `StreamingMiddlewareResponse`, `MiddlewareRequest`, `CompiledTemplate`, `TuvixMetrics`.

## Sonderfälle

- `render` und `stream` antworten einmalig mit `400 Bad Request` auf einen Request-Pathname, der `://` enthält oder mit `//` beginnt; sie laden kein Fragment und zeichnen keine Fragment-Metriken auf. Die Query wird nicht geprüft. `fetchAppHTML` gibt für einen solchen Pfad `<!-- SSR error: invalid path -->` zurück. Folgen von `..` werden aus dem Pathname entfernt, bevor er an die Fragment-Services geht.
- Skripte in gestreamten Fragmenten laufen. Entferne sie im Fragment-Service, wenn sie inaktiv bleiben müssen.
- Eine getroffene App ohne Slot mit demselben Namen wird geladen, und ihr HTML wird verworfen.

## Was es nicht tut

- Es rendert keine Komponenten, cacht keine Fragmente, wiederholt keine Fetches und leitet keine Cookies und Header weiter.
- Es hydriert nicht. Das übernehmen die Client-Adapter (`createSsrReactMicroApp` und die Entsprechungen für Vue, Svelte und Angular).
- Es verschiebt keinen `<head>`-Inhalt von Fragmenten in den `<head>` der Shell.

## Migration von 0.4

- `render()` gibt 502 zurück, wenn jedes getroffene Fragment fehlgeschlagen ist; `createMiddleware` sendet diesen Status.
- Beide Middlewares rufen bei Fehlern `next(error)` statt `next()` auf.
- Routen verwenden `matchPath`: `/dashboard?tab=1` trifft `/dashboard/*`.
- Die Ausgabe von `toPrometheusText()` ist gültiger Prometheus-Text: ein HELP/TYPE pro Familie.
- Beide Middlewares rendern `req.originalUrl ?? req.url` statt `req.path ?? req.url`.
- `ssrUrl` muss absolut sein; vorhandene Query-Parameter bleiben erhalten.
- Skripte in gestreamten Fragmenten laufen jetzt, und selbstschließende Slots bekommen einen Streaming-Platzhalter.
- Ein Request-Pathname, der `://` enthält oder mit `//` beginnt, bekommt von `render` und `stream` die Antwort `400 Bad Request`.

## Lizenz

MIT

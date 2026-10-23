# @tuvix.js/server

> Récupère les fragments HTML des micro apps et les compose dans une page shell, en une seule réponse ou en flux BigPipe

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentation complète : [tuvix.js.org/packages/server](https://tuvix.js.org/packages/server).

Vous écrivez un template de shell avec des emplacements `<tuvix-slot name="...">`. À chaque requête, le renderer choisit les apps dont les `routes` correspondent au chemin (avec `matchPath` de `@tuvix.js/router`), récupère leurs fragments en parallèle via HTTP et place chaque fragment à l'endroit de son slot. Nécessite Node.js 18+ (`fetch` global).

## Installation

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

## Démarrage rapide

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

Pour `/cart/42?coupon=x`, le renderer appelle `GET <ssrUrl>` avec `path=%2Fcart%2F42%3Fcoupon%3Dx` défini via `URL.searchParams` (les paramètres déjà présents dans `ssrUrl` sont conservés ; le `#hash` est supprimé) et `Accept: text/html` sur les deux services. `ssrUrl` doit être absolue. Chaque corps de réponse 2xx remplace sa balise `<tuvix-slot>`. Un statut non 2xx, une erreur réseau, un timeout ou une `ssrUrl` relative devient `<!-- SSR error: <app> (<reason>) -->`. Renvoyez l'élément conteneur de votre app depuis le service de fragments (`<div id="cart">...</div>`) pour que l'adaptateur client puisse l'hydrater.

## API

### `createServerRenderer(config)`

Renvoie `{ render, matchApps, fetchAppHTML }`.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | requis | HTML avec `<tuvix-slot name="x">fallback</tuvix-slot>` ou `<tuvix-slot name="x" />`. |
| `apps` | `ServerAppConfig[]` | requis | `{ name, ssrUrl, routes, timeout? }`. `name` choisit le slot ; `routes` suit les règles de préfixe de `matchPath` (query et hash ignorés). |
| `timeout` | `number` | `5000` | Timeout de récupération en ms quand une app n'en définit aucun. |
| `metrics` | `TuvixMetrics` | aucun | Collecteur issu de `createMetricsCollector()`. |

- `render(path)` se résout en `{ html, statusCode, headers }`. `statusCode` vaut `502` quand au moins une app correspond et que tous les fragments ont échoué, sinon `200`. Les slots sans correspondance gardent leur fallback. Un chemin dont le pathname contient `://` ou commence par `//` renvoie `400` avec le texte `Bad Request` et ne récupère rien.
- `matchApps(path)` renvoie les apps correspondantes.
- `fetchAppHTML(app, path)` récupère un fragment (ou le commentaire d'erreur), sans métriques.

### `createStreamingRenderer(config)`

Même config. Renvoie `{ stream, matchApps }`. `stream(path, res, { nonce? })` écrit le shell jusqu'à `</body>` avec des emplacements `<div id="tvx-slot-x" style="display:contents">` (les slots appariés gardent leur HTML interne comme fallback, les slots auto-fermants sont vides). Ensuite, il écrit un `<script>` inline par fragment dès son arrivée : le script analyse le fragment dans un `<template>`, remplace l'emplacement et recrée chaque `<script>` du fragment (tous les attributs, `nonce` compris, plus le texte) un par un, dans l'ordre du document. Après un script externe sans `async`, le suivant attend son `load` ou son `error`, donc `<script src="/lib.js"></script><script>Lib.init()</script>` fonctionne. Les scripts `async` et les blocs de données (`type="application/json"`) ne bloquent jamais. Le fragment est échappé en JSON pour que `</script>` ne puisse pas en sortir. Enfin, il écrit le reste du shell. Le statut est 200, ou 400 (`Bad Request`, sans shell) pour un chemin qui désigne un autre hôte. `res` est une `StreamingResponse` (`write`, `end`, `setHeader`, `statusCode` facultatif) ; la `ServerResponse` de Node convient.

Sous une CSP sans `'unsafe-inline'`, passez un `nonce` neuf pour chaque réponse ; le renderer le place sur ses scripts inline. Les scripts des fragments ont besoin de leur propre attribut `nonce`, ou d'une politique avec `'strict-dynamic'`.

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

Handler Express/Connect `(req, res, next?)`. Rend `req.originalUrl ?? req.url` (query string et préfixe de montage Express inclus), définit les en-têtes avec `res.set` ou `res.setHeader`, envoie `res.status(statusCode).send(html)`. En cas d'erreur levée : `next(error)`, ou 500 sans `next`.

### `createStreamingMiddleware(renderer, options?)`

Appelle `renderer.stream(req.originalUrl ?? req.url, res, { nonce })`, avec `nonce` issu de `options.nonce?.(req, res)` (par exemple `res.locals.cspNonce`). Erreur avant la première écriture : `next(error)` ; sans `next`, `res.status(500).send()` sur Express, ou `statusCode = 500` puis `end()` sur une `ServerResponse` Node. Erreur après : termine la réponse, n'appelle pas `next`.

### `composeHTML(template, slots)` et `compileShellTemplate(template)`

`composeHTML` remplace en une passe chaque slot nommé dans `slots` ; les autres restent tels quels. `$&`, `$1` et un `<tuvix-slot>` à l'intérieur du HTML d'un fragment restent littéraux. `compileShellTemplate` renvoie `{ slotNames, render(slots) }` avec les noms analysés une seule fois.

```ts
import { composeHTML } from '@tuvix.js/server';

composeHTML('<main><tuvix-slot name="main" /></main>', { main: '<p>Hello</p>' }); // '<main><p>Hello</p></main>'
```

### `createMetricsCollector()`

Renvoie `TuvixMetrics` : `recordRender(ms)`, `recordFragment(name, ms, isError)`, `toPrometheusText()`, `reset()`. Métriques : `tuvix_renders_total`, `tuvix_render_duration_ms_total` (compteurs), `tuvix_render_duration_ms_avg`, `tuvix_render_duration_ms_max` (jauges), et par app (`{app="..."}`) `tuvix_fragment_fetches_total`, `tuvix_fragment_errors_total`, `tuvix_fragment_avg_duration_ms`, `tuvix_fragment_max_duration_ms`. Un seul `# HELP` et `# TYPE` par famille ; les valeurs de label échappent `\`, `"` et les retours à la ligne. Servez-le avec `Content-Type: text/plain; version=0.0.4`.

### Types

`ServerRendererConfig`, `ServerAppConfig`, `RenderResult`, `StreamingResponse`, `StreamOptions`, `StreamingMiddlewareOptions`, `StreamingMiddlewareResponse`, `MiddlewareRequest`, `CompiledTemplate`, `TuvixMetrics`.

## Cas particuliers

- `render` et `stream` répondent une seule fois `400 Bad Request` pour un pathname de requête contenant `://` ou commençant par `//` ; ils ne récupèrent aucun fragment et n'enregistrent aucune métrique de fragment. La query n'est pas vérifiée. `fetchAppHTML` renvoie `<!-- SSR error: invalid path -->` pour un tel chemin. Les séquences `..` sont retirées du pathname avant qu'il parte vers les services de fragments.
- Les scripts des fragments envoyés en flux s'exécutent. Retirez-les côté service de fragments s'ils doivent rester inertes.
- Une app correspondante sans slot du même nom est récupérée et son HTML est ignoré.

## Ce qu'il ne fait pas

- Il ne rend pas de composants, ne met pas les fragments en cache, ne retente pas les récupérations et ne transmet ni les cookies ni les en-têtes.
- Il n'hydrate pas. Ce sont les adaptateurs client (`createSsrReactMicroApp` et ses équivalents Vue, Svelte et Angular) qui le font.
- Il ne déplace pas le contenu `<head>` des fragments dans le `<head>` du shell.

## Migrer depuis la 0.4

- `render()` renvoie 502 quand tous les fragments correspondants ont échoué ; `createMiddleware` l'envoie.
- Les deux middlewares appellent `next(error)` au lieu de `next()` en cas d'erreur.
- Les routes utilisent `matchPath` : `/dashboard?tab=1` correspond à `/dashboard/*`.
- La sortie de `toPrometheusText()` est du texte Prometheus valide : un seul HELP/TYPE par famille.
- Les deux middlewares rendent `req.originalUrl ?? req.url` au lieu de `req.path ?? req.url`.
- `ssrUrl` doit être absolue ; ses paramètres de query existants sont conservés.
- Les scripts des fragments envoyés en flux s'exécutent désormais, et les slots auto-fermants reçoivent un emplacement de streaming.
- Un pathname de requête contenant `://` ou commençant par `//` reçoit `400 Bad Request` de `render` et `stream`.

## Licence

MIT

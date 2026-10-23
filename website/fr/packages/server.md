---
title: '@tuvix.js/server'
---

<PackageHeader
  name="@tuvix.js/server"
  title="Serveur"
  description="Composition de pages côté serveur pour Tuvix.js. Récupère par HTTP le fragment HTML de chaque micro app et remplit les slots d'un template de shell, en une seule réponse ou en flux BigPipe."
  icon="🖥️"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/server
# or pnpm add @tuvix.js/server
```

Le paquet fonctionne sur Node.js 18 ou supérieur et utilise le `fetch` global. Il dépend de `@tuvix.js/router` pour la correspondance des routes.

## Quand l'utiliser {#when-to-use-it}

Utilisez-le quand chaque micro app tourne sur son propre service de rendu et qu'un serveur shell assemble la page. Vous écrivez un template HTML de shell avec des emplacements `<tuvix-slot name="...">`. Pour chaque requête, le moteur de rendu choisit les apps dont les `routes` correspondent au chemin, récupère leurs fragments en parallèle et place chaque fragment à l'endroit de son slot.

Choisissez `createServerRenderer` avec `createMiddleware` si vous voulez une réponse HTML complète et un statut 502 quand tous les fragments échouent. Choisissez `createStreamingRenderer` avec `createStreamingMiddleware` si vous voulez que le `<head>` du shell arrive dans le navigateur avant le retour du fragment le plus lent.

Si un seul serveur rend lui-même chaque îlot (une app Next.js, Astro ou Vite SSR qui appelle `renderVueToString` ou le `renderToString` de React), vous n'avez pas besoin de ce paquet. Consultez [`@tuvix.js/vite`](/fr/packages/vite) pour lier les assets des îlots dans cette configuration.

## Démarrage rapide {#quick-start}

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

Une requête pour `/cart/42?coupon=x` :

1. `header` correspond (`'/'` correspond à tous les chemins) et `cart` correspond à `/cart/*`.
2. Le moteur de rendu envoie `GET http://header-service:3001/render?path=%2Fcart%2F42%3Fcoupon%3Dx`, et la même requête au service du panier, en parallèle. Le middleware lit `req.originalUrl`, donc la query string parvient aux services de fragments.
3. Le corps de chaque réponse remplace tout son élément `<tuvix-slot>`.
4. Le middleware envoie le statut 200 avec `Content-Type: text/html; charset=utf-8` et `X-Powered-By: Tuvix.js`.

Sur `/about`, seul `header` correspond. Le slot `cart` reste dans le HTML sous la forme `<tuvix-slot name="cart"><p>Loading cart...</p></tuvix-slot>`, et le navigateur affiche son contenu de repli.

## Services de fragments {#fragment-services}

Le moteur de rendu appelle le `ssrUrl` de chaque app en `GET` avec `Accept: text/html`. Il construit l'URL avec `new URL(ssrUrl)` et définit un paramètre de recherche `path` égal au pathname de la requête suivi de la query, sans le `#hash`. Les paramètres déjà présents dans `ssrUrl` sont conservés : `http://cart:3002/render?v=2` devient `http://cart:3002/render?v=2&path=%2Fshop%3Fsort%3Dasc` pour `/shop?sort=asc`. Le corps d'une réponse 2xx est le fragment. Tout autre statut, une erreur réseau, un timeout ou un `ssrUrl` relatif compte comme un échec, et le moteur de rendu place `<!-- SSR error: <app> (<status or message>) -->` dans le slot.

Le fragment remplace la balise `<tuvix-slot>` elle-même, donc le moteur de rendu n'ajoute aucun élément englobant. Renvoyez l'élément dans lequel votre app côté client se monte, pour que l'orchestrateur trouve le conteneur et que l'adaptateur l'hydrate :

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

Côté client, enregistrez l'app avec `container: '#cart'` et construisez-la avec un adaptateur compatible SSR (`createSsrReactMicroApp`, `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`). L'adaptateur hydrate le balisage du serveur au lieu de tout rendre à partir de zéro.

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

`ServerRendererConfig` :

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `shellTemplate` | `string` | requis | HTML de la page avec des emplacements `<tuvix-slot name="x"></tuvix-slot>` ou `<tuvix-slot name="x" />`. Le moteur de rendu analyse les noms de slots une seule fois, à la création. |
| `apps` | `ServerAppConfig[]` | requis | Apps qui peuvent être rendues sur le serveur. |
| `timeout` | `number` | `5000` | Timeout de fetch en ms pour les apps qui n'ont pas leur propre `timeout`. |
| `metrics` | `TuvixMetrics` | aucun | Collecteur issu de `createMetricsCollector()`. Le moteur de rendu enregistre chaque récupération de fragment et chaque rendu. |

`ServerAppConfig` :

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Nom de l'app. Le fragment remplit le slot du même nom. |
| `ssrUrl` | `string` | requis | Endpoint absolu du fragment. Le moteur de rendu définit un paramètre de recherche `path` et conserve les paramètres déjà présents dans l'URL. Une URL relative fait échouer le fragment de cette app. |
| `routes` | `string[]` | requis | Motifs en syntaxe [`matchPath`](/fr/packages/router#matchpath) avec ses règles de préfixe par défaut, comme `activeWhen` dans core : `'/'` correspond à tous les chemins et `'/cart'` correspond à `/cart` et à ce qui se trouve en dessous. Les `routes` du routeur diffèrent : elles correspondent au chemin entier. L'app est rendue quand un motif correspond. |
| `timeout` | `number` | `timeout` de la config | Timeout de fetch en ms pour cette app. Le moteur de rendu annule la requête à son expiration. |

Fonctions renvoyées :

- `render(path)` sélectionne les apps correspondantes, récupère tous les fragments en parallèle, remplit les slots et se résout en `{ html, statusCode, headers }`. `statusCode` vaut `502` quand au moins une app correspond et que tous les fragments échouent, sinon `200`. `headers` contient `Content-Type: text/html; charset=utf-8` et `X-Powered-By: Tuvix.js`. Un fragment en échec apparaît comme un commentaire HTML dans son slot ; `render` ne rejette pas pour autant. Un chemin dont le pathname contient `://` ou commence par `//` se résout en `400` avec le texte `Bad Request`, après un avertissement et sans récupération de fragment.
- `matchApps(path)` renvoie les apps dont les `routes` correspondent à `path` selon les règles de préfixe de `matchPath(pattern, path)`. La query string et le hash n'influencent pas la correspondance.
- `fetchAppHTML(app, path)` récupère un fragment et renvoie son HTML, ou le commentaire d'erreur. Il n'enregistre aucune métrique.

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

Prend le même `ServerRendererConfig`. À la création, il transforme chaque `<tuvix-slot name="x">fallback</tuvix-slot>` en `<div id="tvx-slot-x" style="display:contents">fallback</div>` et coupe le shell au dernier `</body>`.

`stream(path, res, options?)` :

1. Définit `Content-Type: text/html; charset=utf-8`, `Transfer-Encoding: chunked` et `X-Powered-By: Tuvix.js`.
2. Écrit le shell jusqu'à `</body>`. Chaque slot devient `<div id="tvx-slot-x" style="display:contents">`, qui contient le HTML intérieur de la forme appariée comme contenu de repli, ou rien pour un `<tuvix-slot name="x" />` auto-fermant.
3. Récupère les fragments correspondants en parallèle. À l'arrivée de chacun, écrit un `<script>` inline qui analyse le fragment dans un `<template>` et remplace l'emplacement par ce fragment. Le script recrée ensuite chaque `<script>` du fragment, un par un dans l'ordre du document, en copiant tous ses attributs (`nonce` compris) et son texte pour que le navigateur l'exécute. Après un script externe sans `async`, le suivant attend son événement `load` ou `error`, donc `<script src="/lib.js"></script><script>Lib.init()</script>` trouve `Lib`. Les scripts `async` et les blocs de données (`type="application/json"`) ne retardent pas les autres.
4. Écrit `</body></html>` (le reste du shell) et appelle `res.end()`.

Le statut vaut 200 : les en-têtes partent avec le shell, avant la récupération du moindre fragment. Pour un chemin dont le pathname contient `://` ou commence par `//`, `stream` définit `res.statusCode = 400`, écrit `Bad Request` en `text/plain` et termine, sans le shell. Le moteur de rendu encode en JSON le HTML des fragments et échappe `<`, `>`, U+2028 et U+2029, pour qu'un fragment contenant `</script>` ou `<!--` ne puisse pas terminer le script inline.

Avec une Content Security Policy sans `'unsafe-inline'`, passez un nonce neuf propre à chaque réponse dans `options.nonce`. Le moteur de rendu l'écrit sous la forme `<script nonce="...">` sur chaque script inline. Les scripts qu'il recrée à partir d'un fragment portent uniquement l'attribut `nonce` du fragment lui-même : donnez ce nonce aux scripts des fragments ou ajoutez `'strict-dynamic'` à la politique. Sans nonce, la politique bloque les scripts inline et les emplacements gardent leur contenu de repli.

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

Handler de style Express/Connect. Il rend `req.originalUrl ?? req.url`, donc la query string et un préfixe de montage Express (`app.use('/shop', ...)`) font partie du chemin que les routes comparent et que les services de fragments reçoivent. Il définit les en-têtes du résultat avec `res.set` (ou `res.setHeader` pour chaque en-tête quand `set` est absent) et appelle `res.status(result.statusCode).send(result.html)`. Quand `render` lève une exception, il journalise l'erreur et appelle `next(error)`, ou envoie `500 Internal Server Error` si vous n'avez passé aucun `next`.

Le middleware rend chaque requête qu'il reçoit, y compris les chemins auxquels aucune app ne correspond. Montez-le sur les routes que votre shell possède, après les handlers de fichiers statiques.

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

Appelle `renderer.stream(req.originalUrl ?? req.url, res, { nonce })`, où `nonce` vaut `options.nonce?.(req, res)`. Lisez-le à l'endroit où votre middleware CSP le stocke, par exemple `res.locals.cspNonce`. En cas d'erreur :

- avant la première écriture : appelle `next(error)`. Sans `next`, il envoie 500 via `res.status` (Express), ou définit `res.statusCode = 500`, écrit `Internal Server Error` et termine la réponse (Node `http`) ;
- après la première écriture : termine la réponse et n'appelle pas `next`, car les en-têtes sont déjà envoyés.

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

Remplace chaque `<tuvix-slot name="x">...</tuvix-slot>` ou `<tuvix-slot name="x" />` dont le nom est une clé propre de `slots` par `slots[x]`. Les slots sans entrée restent tels quels. Il remplit tous les slots en une seule passe avec une fonction de remplacement, donc `$&`, `$1`, `` $` ``, `$'` et `$$` dans le HTML d'un fragment restent littéraux et un `<tuvix-slot>` à l'intérieur d'un fragment n'est pas rempli.

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

Analyse les noms de slots une seule fois et renvoie `{ slotNames, render }`. `slotNames` liste chaque nom une fois, dans l'ordre de première apparition. `render(slots)` renvoie le même résultat que `composeHTML(template, slots)`. `createServerRenderer` l'appelle pour vous.

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

Un collecteur en mémoire. Passez-le comme `metrics` à l'un ou l'autre moteur de rendu, ou appelez ses méthodes vous-même :

| Méthode | Signature | Comportement |
| --- | --- | --- |
| `recordRender` | `(durationMs: number) => void` | Compte un rendu et sa durée. |
| `recordFragment` | `(name: string, durationMs: number, isError: boolean) => void` | Compte une récupération pour l'app `name`, sa durée et son éventuel échec. |
| `toPrometheusText` | `() => string` | Format d'exposition texte Prometheus 0.0.4. |
| `reset` | `() => void` | Remet tous les compteurs à zéro. |

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

Sortie après un rendu où `header` a pris 12 ms et `cart` a échoué au bout de 2000 ms :

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

Chaque famille de métriques reçoit une ligne `# HELP` et une ligne `# TYPE`. Les labels apparaissent uniquement sur les échantillons, et les valeurs de labels échappent `\`, `"` et les retours à la ligne. Le collecteur ignore une famille sans échantillon : avant le premier rendu, vous obtenez uniquement les deux totaux de rendu à 0, et les quatre familles de fragments apparaissent après la première récupération de fragment. Il conserve les totaux, les moyennes et les maximums ; il n'y a ni histogrammes ni quantiles.

### Types {#types}

| Type | Signification |
| --- | --- |
| `ServerRendererConfig` | `{ shellTemplate, apps, timeout?, metrics? }`, options des deux moteurs de rendu. |
| `ServerAppConfig` | `{ name, ssrUrl, routes, timeout? }`, une app. |
| `RenderResult` | `{ html: string; statusCode: number; headers: Record<string, string> }` renvoyé par `render`. |
| `StreamingResponse` | `{ write(chunk: string): void; end(): void; setHeader(name: string, value: string): void; statusCode?: number }`. Le `ServerResponse` de Node y correspond. |
| `StreamOptions` | `{ nonce?: string }`, options par requête pour `stream`. |
| `StreamingMiddlewareOptions` | `{ nonce?: (req, res) => string \| undefined }` pour `createStreamingMiddleware`. |
| `MiddlewareRequest` | `{ url: string; originalUrl?: string }`, les champs de requête que lisent les deux middlewares. |
| `StreamingMiddlewareResponse` | `StreamingResponse` plus un `status(code).send(body)` optionnel de style Express. |
| `CompiledTemplate` | `{ slotNames: string[]; render(slots: Record<string, string>): string }`. |
| `TuvixMetrics` | Interface du collecteur renvoyé par `createMetricsCollector`. |

## Cas limites {#edge-cases}

- Le fragment remplit le slot dont le nom est égal au `name` de l'app. Une app correspondante sans slot est récupérée et son HTML est ignoré.
- `render` et `stream` rejettent un pathname de requête qui contient `://` ou commence par `//` avec un avertissement et un `400 Bad Request`. Ils ne récupèrent aucun fragment et n'enregistrent aucune métrique de fragment. La vérification ignore la query, donc `?next=https://...` passe. `fetchAppHTML` renvoie `<!-- SSR error: invalid path -->` pour un tel chemin. Le moteur de rendu supprime les séquences `..` et fusionne les slashs répétés dans le pathname (pas dans la query) avant de l'envoyer aux services de fragments.
- Les scripts d'un fragment diffusé en flux s'exécutent quand son script de remplacement s'exécute, après les scripts du shell placés au-dessus. Retirez les éléments `<script>` côté service de fragments s'ils doivent rester inertes.
- Le moteur de rendu échappe le nom de l'app et le message d'erreur dans les commentaires d'erreur, pour qu'un texte d'erreur contenant `-->` ne puisse pas fermer le commentaire.
- Un `statusCode` de 200 peut masquer des échecs partiels. Lisez `tuvix_fragment_errors_total` ou cherchez `<!-- SSR error` dans le HTML.

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Il ne rend pas de composants. Chaque service de fragments rend sa propre app avec le moteur de rendu serveur de son framework.
- Il ne met pas les fragments en cache et ne relance pas une récupération échouée.
- Il ne transmet ni les cookies ni les en-têtes de requête aux services de fragments. Il envoie uniquement `Accept: text/html`.
- Il n'hydrate rien. Les adaptateurs côté client s'en chargent.
- Il ne fusionne pas le contenu `<head>` des fragments (styles, balises meta) dans le `<head>` du shell. Placez les assets partagés dans le shell, ou utilisez [`@tuvix.js/vite`](/fr/packages/vite) quand un seul serveur Vite rend les îlots.

## Migrer depuis la 0.4 {#migrating-from-0-4}

- `createServerRenderer().render()` renvoie `statusCode: 502` quand au moins une app correspond et que tous les fragments échouent. `createMiddleware` l'envoie. Le moteur de rendu en flux envoie toujours 200.
- Un pathname de requête qui contient `://` ou commence par `//` reçoit `400 Bad Request` de `render` et de `stream`. En 0.4, tous les fragments échouaient avec un commentaire d'erreur dans une page 200.
- `createMiddleware` et `createStreamingMiddleware` appellent `next(error)` au lieu de `next()` quand le rendu lève une exception, donc Express exécute votre handler d'erreur.
- Les routes utilisent `matchPath`, donc `/dashboard?tab=1` correspond à `/dashboard/*` et `/users/42#bio` correspond à `/users/:id`.
- `toPrometheusText()` écrit une ligne `# HELP` et une ligne `# TYPE` par famille, avec les labels uniquement sur les échantillons. La sortie de la 0.4 les répétait pour chaque app avec les labels dans le nom de la métrique, ce que Prometheus rejetait.
- Les deux middlewares rendent `req.originalUrl ?? req.url` au lieu de `req.path ?? req.url`. Les services de fragments reçoivent la query string dans `path`, et sous `app.use('/prefix', ...)` ils voient l'URL complète avec `/prefix`.
- `ssrUrl` doit être absolu. Une URL relative produit désormais le commentaire d'erreur pour cette app. Les paramètres de query dans `ssrUrl` sont conservés au lieu de produire un second `?`.
- Les scripts des fragments diffusés en flux s'exécutent désormais. Retirez-les côté service de fragments si vous comptiez sur leur inertie.
- Un `<tuvix-slot name="x" />` auto-fermant reçoit lui aussi un emplacement de streaming.

La documentation de la 0.4 montrait `createMiddleware({ template })`, `renderer.render({ apps, props })` et une option d'orchestrateur `hydrate: true`. Aucun de ces éléments n'existe. Passez un moteur de rendu à `createMiddleware` :

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

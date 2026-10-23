---
title: '@tuvix.js/router'
---

<PackageHeader
  name="@tuvix.js/router"
  title="Routeur"
  description="Routage history et hash pour les micro apps, un matcher de chemins unique partagé avec core et le serveur, et interception des liens pour la navigation côté client."
  icon="🔀"
  npm="true"
/>

## Installation {#installation}

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

`@tuvix.js/core` dépend de ce paquet et réexporte `createRouter`, `matchPath` et `interceptLinks`, donc vous pouvez aussi importer ces trois fonctions depuis core.

## Quand l'utiliser {#when-to-use-it}

Le routeur associe des chemins d'URL à des noms de micro apps et vous signale les changements de chemin. Utilisez-le lorsque le shell gère la navigation et décide quelle micro app est active pour une URL. L'orchestrateur en crée un pour vous lorsque vous passez `router` à `createOrchestrator`, donc la plupart des shells ne le construisent jamais à la main.

`matchPath` est l'unique matcher de motifs de Tuvix.js. Core l'utilise pour les chaînes `activeWhen` et `@tuvix.js/server` l'utilise pour les `routes` des apps, donc un motif a le même sens aux trois endroits. Vous pouvez l'appeler seul, sans routeur.

Si votre shell utilise déjà React Router, TanStack Router ou le routeur d'un autre framework, conservez-le. Connectez-le à l'orchestrateur avec `orchestrator.connectRouter({ subscribe, getPath })` de `@tuvix.js/core` et passez-vous de ce routeur. Vous pouvez toujours utiliser `matchPath` et `interceptLinks` en parallèle.

## Démarrage rapide {#quick-start}

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
    { path: '/settings', app: 'settings' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

router.beforeEach(({ from }) => !from.startsWith('/settings') || confirm('Discard unsaved settings?'));

// <a href="/app/users/42"> now calls router.push('/users/42') instead of reloading.
const stopLinks = interceptLinks({
  navigate: (path) => router.push(path),
  base: '/app',
});

await router.push('/users/42?tab=posts');
console.log(router.currentPath); // '/users/42?tab=posts'
console.log(router.currentRoute?.params); // { id: '42' }
console.log(window.location.pathname); // '/app/users/42'

// On teardown:
stopLinks();
router.destroy();
```

Le routeur attache son écouteur `popstate` (mode history) ou `hashchange` (mode hash) dans le constructeur. Il n'y a pas d'appel `start()`.

Avec l'orchestrateur, passez la même configuration dans `router` et naviguez via l'orchestrateur :

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { interceptLinks } from '@tuvix.js/router';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Une app sans `activeWhen` suit les `routes` qui la nomment. `orchestrator.getRouter()` renvoie l'instance `IRouter`.

## API {#api}

### `createRouter`

```ts
import type { IRouter, RouterConfig } from '@tuvix.js/router';

declare function createRouter(config: RouterConfig): IRouter;
```

Renvoie `new Router(config)` typé comme `IRouter`.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | requis | Table des routes. Le routeur vérifie les routes dans l'ordre du tableau et la première correspondance l'emporte. |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` lit `location.pathname + location.search` et écrit avec `pushState`. `hash` lit et écrit `#/path`. |
| `base` | `string` | `'/'` | Préfixe de chemin sous lequel l'app est servie, en mode history uniquement. Le routeur le retire lorsqu'il lit l'URL et l'ajoute lorsqu'il écrit. Le mode hash l'ignore. |

Chaque `RouteConfig` :

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `path` | `string` | requis | Motif en syntaxe `matchPath`, comparé au chemin entier. `'/'` ne correspond qu'à la page d'accueil, `'/*'` correspond à tous les chemins, `'/blog/*'` correspond à `/blog` et à tout ce qui se trouve en dessous. |
| `app` | `string` | requis | Nom de la micro app à activer. |
| `meta` | `Record<string, unknown>` | aucun | Vos données. Le routeur les transmet dans `MatchedRoute.route.meta`. |

### `Router`

```ts
import { Router } from '@tuvix.js/router';

const router = new Router({ routes: [{ path: '/cart', app: 'cart' }] });
```

La classe derrière `createRouter`. Elle implémente `IRouter` :

| Membre | Signature | Comportement |
| --- | --- | --- |
| `currentPath` | `readonly string` | Chemin relatif à l'app, sans `base`. En mode history, il inclut la query string. |
| `currentRoute` | `readonly MatchedRoute \| null` | Résultat de `match(currentPath)`. |
| `push` | `(path: string) => Promise<void>` | Exécute les gardes, écrit l'URL avec `history.pushState` (`base + path` en mode history, `#path` en mode hash), puis exécute les handlers `onChange`. |
| `replace` | `(path: string) => Promise<void>` | Comme `push`, avec `history.replaceState`. |
| `back` | `() => void` | Appelle `window.history.back()`. |
| `forward` | `() => void` | Appelle `window.history.forward()`. |
| `onChange` | `(handler: RouteChangeHandler) => () => void` | Exécute `handler` après chaque navigation terminée. Renvoie une fonction de désabonnement. |
| `beforeEach` | `(guard: NavigationGuard) => () => void` | Ajoute une garde. Renvoie une fonction qui la retire. |
| `match` | `(path: string) => MatchedRoute \| null` | Première route qui correspond à `path`, ou `null`. |
| `getActiveApps` | `(path?: string) => string[]` | Noms des apps de chaque route qui correspond au `path` entier (par défaut : `currentPath`), dans l'ordre des routes, sans doublons. |
| `destroy` | `() => void` | Retire l'écouteur de window et vide les handlers et les gardes. |

Passez à `push` et `replace` un chemin relatif à `base`. Avec `base: '/app'`, `router.push('/x')` écrit `/app/x` et `currentPath` devient `/x`.

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  base: '/app',
  routes: [
    { path: '/*', app: 'header' },
    { path: '/docs/*', app: 'docs' },
    { path: '/docs/:page', app: 'doc-sidebar' },
  ],
});

router.match('/docs/intro')?.route.app; // 'header' (first match wins)
router.getActiveApps('/docs/intro'); // ['header', 'docs', 'doc-sidebar']
router.getActiveApps('/'); // ['header']
await router.replace('/docs/intro'); // URL: /app/docs/intro, no new history entry
router.back();
```

`match`, `getActiveApps` et `isPathActive` appliquent les mêmes règles de chemin entier. Une route `'/'` n'est active que sur `/` ; utilisez `'/*'` pour une app qui s'affiche sur toutes les pages.

#### Gardes {#guards}

Les gardes s'exécutent dans l'ordre où vous les avez ajoutées, une à la fois, avant que l'URL ne change. Une résolution à `false` annule la navigation et saute les gardes restantes. Toute autre valeur la laisse continuer. Une garde qui lève une erreur ou rejette annule la navigation, et le routeur journalise l'erreur avec `console.error`.

```ts
import { createRouter } from '@tuvix.js/router';

declare function isAdmin(): Promise<boolean>;

const router = createRouter({
  routes: [{ path: '/admin/*', app: 'admin' }],
});

const removeGuard = router.beforeEach(async ({ to }) => {
  if (to.startsWith('/admin')) return isAdmin();
  return true;
});

removeGuard();
```

Les gardes s'exécutent aussi pour les boutons précédent et suivant. Le navigateur s'est déjà déplacé à ce moment-là, donc lorsqu'une garde annule, le routeur appelle `history.replaceState` pour remettre l'URL précédente (avec `base`) dans la barre d'adresse. L'entrée d'historique reste là où le navigateur l'a déplacée.

### `matchPath`

```ts
import type { MatchPathOptions, PathMatch } from '@tuvix.js/router';

declare function matchPath(
  pattern: string,
  path: string,
  options?: MatchPathOptions
): PathMatch;
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | `true` impose qu'un motif sans `/*` corresponde au chemin entier. `false` correspond aussi à tous les sous-chemins. |

Renvoie `{ matched, params }`. Règles :

- Le matcher retire `?query` et `#hash` de `path` et ignore une barre oblique finale des deux côtés.
- `:name` capture un segment non vide dans `params.name`, décodé au format URI. Une valeur dont l'encodage en pourcentage est malformé reste telle qu'écrite. Un segment peut mélanger texte et paramètres : `/v:version` correspond à `/v2`.
- Un `/*` final correspond au chemin de base et à tout ce qui se trouve en dessous : `/docs/*` correspond à `/docs` et à `/docs/a/b`. Le reste n'est pas capturé dans `params`.
- Un `*` au milieu d'un motif correspond à un segment.
- Par défaut, un motif simple correspond à ses sous-chemins sur une frontière de segment : `/docs` correspond à `/docs/intro` et ne correspond pas à `/docsify`.
- `'/'` correspond par défaut à tous les chemins. Avec `{ end: true }`, il ne correspond qu'à `/`. Les routes du routeur utilisent toujours les règles `end: true` ; les chaînes `activeWhen` de core et les `routes` des apps de `@tuvix.js/server` utilisent les règles de préfixe par défaut.
- Les autres caractères d'expression régulière d'un motif correspondent littéralement. La correspondance est sensible à la casse.

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts#bio'); // { matched: true, params: { id: '42' } }
matchPath('/files/:name', '/files/a%20b.txt').params.name; // 'a b.txt'
matchPath('/docs', '/docs/intro').matched; // true
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
matchPath('/docs', '/docsify').matched; // false
matchPath('/', '/anything').matched; // true
matchPath('/a/*/c', '/a/b/c').matched; // true
```

Le matcher compile chaque motif une seule fois et met la `RegExp` en cache, donc vous pouvez l'appeler à chaque navigation.

### `matchRoute`

```ts
import type { MatchedRoute, RouteConfig } from '@tuvix.js/router';

declare function matchRoute(path: string, routes: RouteConfig[]): MatchedRoute | null;
```

Renvoie la première route dont le `path` correspond entièrement à `path` (règles `end: true`), avec le chemin nettoyé, les paramètres décodés et la query analysée. Elle ignore le `#hash`. `Router.match` l'appelle.

```ts
import { matchRoute } from '@tuvix.js/router';

matchRoute('/users/42?tab=info', [{ path: '/users/:id', app: 'users' }]);
// { route: { path: '/users/:id', app: 'users' }, path: '/users/42', params: { id: '42' }, query: { tab: 'info' } }
```

### `isPathActive`

```ts
declare function isPathActive(path: string, pattern: string): boolean;
```

`matchPath(pattern, path, { end: true }).matched` : les règles de chemin entier qu'utilisent les routes, donc `'/'` n'est actif que sur `/`. `Router.getActiveApps` l'utilise.

```ts
import { isPathActive } from '@tuvix.js/router';

isPathActive('/settings/profile', '/settings'); // false
isPathActive('/settings/profile', '/settings/*'); // true
isPathActive('/settings/profile', '/'); // false
isPathActive('/settings/profile', '/*'); // true
```

### `pathToRegex`

```ts
declare function pathToRegex(pattern: string): { regex: RegExp; paramNames: string[] };
```

Renvoie la `RegExp` compilée de correspondance complète d'un motif et ses noms de paramètres dans l'ordre. L'objet `regex` provient du cache partagé : ne modifiez pas son `lastIndex` ni aucun autre état. La regex s'exécute sur un chemin normalisé sans query ni hash ; utilisez `matchPath` lorsque le chemin peut en contenir.

```ts
import { pathToRegex } from '@tuvix.js/router';

const { regex, paramNames } = pathToRegex('/posts/:slug');
regex.test('/posts/hello'); // true
paramNames; // ['slug']
```

### `parseQuery`

```ts
declare function parseQuery(queryString: string): Record<string, string>;
```

Analyse `a=1&b=2`, avec ou sans le `?` initial. Elle sépare chaque paire sur le premier `=`, donc les valeurs comme les JWT conservent leurs caractères `=`, décode les clés et les valeurs, et garde le texte brut lorsque le décodage échoue. Une clé sans `=` est associée à `''`. Une clé répétée garde la dernière valeur.

```ts
import { parseQuery } from '@tuvix.js/router';

parseQuery('?token=abc.def=ghi&debug'); // { token: 'abc.def=ghi', debug: '' }
```

### `normalizePath`

```ts
declare function normalizePath(path: string): string;
```

Ajoute une barre oblique initiale et retire une barre oblique finale. Elle ne touche ni à la query ni au hash.

```ts
import { normalizePath } from '@tuvix.js/router';

normalizePath('users/42/'); // '/users/42'
```

### `interceptLinks`

```ts
import type { InterceptLinksOptions } from '@tuvix.js/router';

declare function interceptLinks(options: InterceptLinksOptions): () => void;
```

Écoute les clics sur les éléments `<a href>` sous `root`, appelle `preventDefault()` sur ceux qu'elle prend en charge et passe leur chemin à `navigate`. Renvoie une fonction qui retire tous les écouteurs qu'elle a ajoutés.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | requis | Reçoit `pathname + search + hash` sans `base`. La fonction journalise une erreur levée ou une promesse rejetée avec `console.error`. |
| `root` | `Document \| HTMLElement` | `document` | Élément sur lequel se trouve l'écouteur de clics. |
| `base` | `string` | `'/'` | Préfixe de chemin sous lequel l'app est servie. Les liens en dehors sont laissés au navigateur. La fonction le retire avant d'appeler `navigate` et `prefetch`. |
| `shouldIntercept` | `(anchor: HTMLAnchorElement, url: URL, event: MouseEvent) => boolean` | aucun | S'exécute après les vérifications intégrées. Renvoyez `false` pour laisser le navigateur gérer le clic. |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | aucun | S'exécute sur `pointerenter` ou `focusin` au-dessus d'un lien éligible, une fois par `pathname + search`. Le chemin n'a pas de hash. |

`interceptLinks` laisse un clic au navigateur lorsque l'une de ces conditions est remplie :

- Un autre handler a déjà appelé `preventDefault()`.
- Le bouton n'est pas le bouton principal, ou Ctrl, Meta, Shift ou Alt est enfoncé.
- L'ancre a un `target` autre que `_self`, un attribut `download`, un `rel` contenant `external`, ou un attribut `data-tuvix-reload`.
- L'URL résolue a une origine différente de celle de la page.
- Le chemin de l'URL est en dehors de `base` (`/app` couvre `/app` et `/app/...`, pas `/application`).
- Le lien a un hash et le même chemin et la même query que la page courante. Le navigateur fait défiler jusqu'à l'ancre.
- `shouldIntercept` renvoie `false`.

`prefetch` applique les vérifications d'attributs, d'origine et de `base`. Il ignore les touches de modification et la règle du hash seul, et se déclenche bien pour un lien vers la page courante.

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/shop/*', app: 'shop' }] });
const nav = document.querySelector('nav') ?? document;

const stop = interceptLinks({
  navigate: (path) => router.push(path),
  root: nav,
  shouldIntercept: (anchor) => !anchor.closest('[data-legacy]'),
  prefetch: (path) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.append(link);
  },
});

stop();
```

`interceptLinks` trouve l'ancre avec [`resolveLink`](#resolvelink), donc les liens à l'intérieur de shadow roots ouverts fonctionnent et les éléments SVG `<a>` sont laissés au navigateur. Dans un environnement sans `document` ni `window`, elle renvoie une fonction de nettoyage sans effet.

### `resolveLink`

```ts
import type { ResolvedLink, ResolveLinkOptions } from '@tuvix.js/router';

declare function resolveLink(
  event: Event,
  options?: ResolveLinkOptions
): ResolvedLink | null;
```

Trouve le `<a href>` sur lequel un événement s'est produit et le renvoie avec son URL absolue et son chemin relatif à l'app. Elle renvoie `null` lorsque le navigateur doit gérer le lien. `interceptLinks` et le `prefetch: { strategy: 'hover' }` de l'orchestrateur l'utilisent. Appelez-la depuis vos propres écouteurs lorsque vous avez besoin des mêmes règles de liens, par exemple pour préchauffer des données au survol ou pour journaliser la navigation interne à l'app.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `base` | `string` | `'/'` | Préfixe de chemin sous lequel l'app est servie. Un lien en dehors renvoie `null`. La fonction le retire de `path`. |

| Champ | Type | Signification |
| --- | --- | --- |
| `anchor` | `HTMLAnchorElement` | L'élément `<a>`. |
| `url` | `URL` | URL absolue du lien. |
| `path` | `string` | `pathname + search + hash`, sans `base`. |

```ts
import { resolveLink } from '@tuvix.js/router';

const warmed = new Set<string>();

function warmUp(event: Event): void {
  const link = resolveLink(event, { base: '/app' });
  if (!link || warmed.has(link.url.pathname)) return;
  warmed.add(link.url.pathname);
  void fetch(`/api/page-data?path=${encodeURIComponent(link.path)}`);
}

// pointerenter does not bubble, so listen in the capture phase.
document.addEventListener('pointerenter', warmUp, true);
document.addEventListener('focusin', warmUp);
```

`resolveLink` renvoie `null` lorsque l'une de ces conditions est remplie :

- Le `<a>` le plus proche sur le chemin de l'événement est un `<a>` SVG, ou un `<a>` HTML sans `href`, ou il n'y a aucun `<a>`. La recherche s'arrête au premier `<a>` rencontré.
- L'ancre a un `target` autre que `_self`, un attribut `download`, un `rel` contenant `external`, ou un attribut `data-tuvix-reload`.
- L'URL a une origine différente de celle de la page.
- Le chemin de l'URL est en dehors de `base` (`/app` couvre `/app` et `/app/...`, pas `/application`).
- Il n'y a pas de `window`, comme côté serveur.

Elle lit `event.composedPath()`, donc un écouteur sur `document` trouve les liens à l'intérieur de shadow roots ouverts. Les liens à l'intérieur de shadow roots fermés lui restent cachés. Appelez-la pendant le dispatch de l'événement : une fois le dispatch terminé, le chemin composé est vide et la fonction se rabat sur `event.target.closest('a')`, qui ne peut pas regarder à l'intérieur d'un shadow root.

Elle ne vérifie ni le bouton de la souris, ni les touches de modification, ni `defaultPrevented`, ni la règle du hash seul. `interceptLinks` applique ces vérifications en plus pour les clics.

### Types {#types}

| Type | Signification |
| --- | --- |
| `RouterMode` | `'history' \| 'hash'`. |
| `RouterConfig` | `{ mode?, base?, routes }`, les options de `createRouter`. |
| `RouteConfig` | `{ path, app, meta? }`, une route. |
| `MatchedRoute` | `{ route, path, params, query }`. `path` est le pathname nettoyé, `params` les valeurs `:param` décodées, `query` la query string analysée. |
| `NavigationEvent` | `{ from, to, fromRoute, toRoute }`. `from` et `to` sont des chemins relatifs à l'app, sans `base`. |
| `NavigationGuard` | `(event: NavigationEvent) => boolean \| Promise<boolean>`. |
| `RouteChangeHandler` | `(event: NavigationEvent) => void`. |
| `IRouter` | Interface que `Router` implémente et que `createRouter` renvoie. |
| `PathMatch` | `{ matched: boolean; params: Record<string, string> }`, le résultat de `matchPath`. `params` vaut `{}` lorsque rien ne correspond. |
| `MatchPathOptions` | `{ end?: boolean }`. |
| `InterceptLinksOptions` | Options de `interceptLinks`. |
| `ResolveLinkOptions` | `{ base?: string }`, les options de `resolveLink`. |
| `ResolvedLink` | `{ anchor: HTMLAnchorElement; url: URL; path: string }`, le résultat de `resolveLink`. |

## Cas particuliers {#edge-cases}

- `push` et `replace` vers le chemin courant (même chaîne, query comprise) retournent sans exécuter les gardes ni les handlers.
- Le routeur n'annule pas une navigation en attente lorsque vous en lancez une autre. Chaque `push` attend ses propres gardes, puis écrit l'URL, donc la dernière chaîne de gardes à terminer l'emporte.
- Le routeur apprend les changements d'URL par ses propres `push`/`replace` et par `popstate`/`hashchange`. Si un autre code appelle `history.pushState`, `currentPath` reste obsolète jusqu'au prochain événement ou à la prochaine navigation du routeur.
- Après `destroy()`, `push`, `replace`, `back`, `forward`, `onChange` et `beforeEach` lèvent `[Tuvix Router] Cannot use a destroyed Router. Create a new one.` `match` et `getActiveApps` continuent de fonctionner.
- Le routeur journalise avec `console.error` un handler `onChange` qui lève une erreur et appelle quand même les autres handlers.
- Avec `base: '/app'`, le routeur lit `/application` comme `/application` : il ne retire la base que sur une frontière de segment. En mode history, il retire le `#hash` lorsqu'il lit l'URL.
- Côté serveur (pas de `window`), le constructeur définit `currentPath` à `'/'` et n'attache aucun écouteur. `push`, `replace`, `back` et `forward` nécessitent `window`.
- `matchPath` avec un motif `/*` correspond au chemin de base lui-même : `/dashboard/*` correspond à `/dashboard`.
- Un événement sur un `<a>` à l'intérieur d'un `<svg>` se résout en `null`, même lorsqu'un `<a>` HTML enveloppe le SVG. `interceptLinks` et le prefetch au survol de l'orchestrateur laissent ce lien au navigateur, qui charge la page complète.

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Il ne monte ni ne démonte les micro apps. Il signale les correspondances et les changements ; l'orchestrateur de `@tuvix.js/core` agit en conséquence.
- Il n'intercepte pas les clics sur les liens, sauf si vous appelez `interceptLinks`.
- Il n'a ni routes imbriquées, ni routes nommées, ni redirections, ni gardes par route. Utilisez `beforeEach` et vérifiez `to` ou `toRoute`.
- Il ne capture pas le reste `/*` d'un chemin dans `params`.
- Il ne restaure pas la position de défilement.

## Migration depuis la 0.4 {#migrating-from-0-4}

`push()` et `replace()` préfixent désormais `base`. Passez des chemins relatifs à `base` :

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ base: '/app', routes: [] });

// 0.4: router.push('/app/x') wrote /app/x, router.push('/x') wrote /x
// 0.5: router.push('/x') writes /app/x
await router.push('/x');
```

Autres changements cassants :

- `base` n'est retirée que sur une frontière de segment : `/application` n'est plus lu comme `/lication`.
- Les routes correspondent au chemin entier dans `match`, `getActiveApps` et `isPathActive`. En 0.4, `getActiveApps` et `isPathActive` considéraient une route `'/'` comme active sur tous les chemins. Remplacez une route fourre-tout `{ path: '/', app }` par `{ path: '/*', app }`.
- `RouteConfig.exact` est supprimé. Il était accepté et ignoré ; retirez-le de vos objets de route.
- `pathToRegex(pattern)` a perdu son second argument `exact` et renvoie une `RegExp` en cache.
- Les caractères d'expression régulière dans les motifs correspondent littéralement, et un `*` au milieu d'un motif correspond à un segment.
- `matchRoute()` et `isPathActive()` ignorent un `#hash` dans le chemin.
- La documentation 0.4 mentionnait `navigate`, `go` et `onRouteChange`, une option `orchestrator` du routeur et une `guard` par route. Rien de tout cela n'existe. Utilisez `push`, `back`/`forward`, `onChange`, la configuration `router` de l'orchestrateur et `beforeEach`.

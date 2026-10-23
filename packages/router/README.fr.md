# @tuvix.js/router

> Routage history et hash pour les micro apps, le matcher partagé `matchPath` et l'interception des liens

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentation complète : [tuvix.js.org/packages/router](https://tuvix.js.org/packages/router).

Le routeur associe des chemins d'URL à des noms de micro apps et vous prévient quand le chemin change. `matchPath` est le matcher de motifs qu'utilisent aussi `activeWhen` du core et `@tuvix.js/server`. Si votre shell utilise déjà React Router ou TanStack Router, connectez-le plutôt avec `orchestrator.connectRouter()` de `@tuvix.js/core`.

## Installation

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

## Démarrage rapide

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

const stopLinks = interceptLinks({ navigate: (path) => router.push(path), base: '/app' });

await router.push('/users/42'); // URL: /app/users/42, currentPath: '/users/42'

stopLinks();
router.destroy();
```

Le constructeur attache l'écouteur `popstate` ou `hashchange`. Il n'y a pas d'appel `start()`.

## API

### `createRouter(config)` et `Router`

`createRouter(config)` renvoie `new Router(config)` typé comme `IRouter`.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | requis | `{ path, app, meta? }`. Vérifiées dans l'ordre, la première correspondance l'emporte. Les chemins doivent correspondre au chemin entier : `'/'` est uniquement la page d'accueil, `'/*'` tous les chemins, `'/blog/*'` `/blog` et ce qui est en dessous. |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` utilise `pushState` et `location.pathname + search`. `hash` utilise `#/path`. |
| `base` | `string` | `'/'` | Préfixe en mode history. Retiré à la lecture (uniquement à une limite de segment), ajouté à l'écriture. |

| Membre | Comportement |
| --- | --- |
| `currentPath`, `currentRoute` | Chemin relatif à l'app (query incluse en mode history) et son `MatchedRoute \| null`. |
| `push(path)`, `replace(path)` | `Promise<void>`. Exécutent les guards, écrivent `base + path` (ou `#path`), exécutent les handlers `onChange`. Même chemin : aucune action. |
| `back()`, `forward()` | `window.history.back()` / `forward()`. |
| `onChange(handler)` | S'exécute après chaque navigation terminée. Renvoie une fonction de désabonnement. |
| `beforeEach(guard)` | Les guards s'exécutent dans l'ordre. `false`, une erreur levée ou un rejet annule. Sur précédent/suivant, le routeur restaure l'URL précédente avec `replaceState`. Renvoie une fonction de retrait. |
| `match(path)` | Première route correspondante ou `null`. |
| `getActiveApps(path?)` | Apps de chaque route qui correspond au chemin entier, sans doublons. Une route `'/'` n'est active que sur `/` ; utilisez `'/*'` pour toutes les pages. |
| `destroy()` | Retire les écouteurs. Ensuite, `push`, `replace`, `back`, `forward`, `onChange`, `beforeEach` lèvent une erreur. |

### `matchPath(pattern, path, options?)`

Renvoie `{ matched, params }`.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | Exige qu'un motif sans `/*` corresponde au chemin entier. |

- Ignore `?query` et `#hash`, ainsi qu'une barre oblique finale.
- `:name` capture un segment, décodé au format URI. Un `/*` final correspond au chemin de base et à tout ce qui est en dessous ; le reste n'est pas capturé. Un `*` au milieu correspond à un segment.
- Par défaut, `/docs` correspond à `/docs/intro` mais pas à `/docsify`, et `'/'` correspond à tous les chemins. Avec `{ end: true }`, `'/'` ne correspond qu'à `/`. Les routes du routeur utilisent les règles `end: true` ; `activeWhen` du core et les routes de `@tuvix.js/server` utilisent le comportement par préfixe par défaut.
- Les motifs compilés sont mis en cache. La correspondance est sensible à la casse.

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
```

### Utilitaires

| Export | Comportement |
| --- | --- |
| `matchRoute(path, routes)` | Première correspondance complète sous la forme `{ route, path, params, query }`, ou `null`. Ignore `#hash`. |
| `isPathActive(path, pattern)` | `matchPath(pattern, path, { end: true }).matched`, les règles de chemin entier qu'utilisent les routes. |
| `pathToRegex(pattern)` | `{ regex, paramNames }` en correspondance complète, mis en cache. Ne modifiez pas `regex`. |
| `parseQuery(query)` | `'?a=1&b'` vers `{ a: '1', b: '' }`. Découpe sur le premier `=`, décode, conserve le texte brut si l'encodage est invalide. |
| `normalizePath(path)` | Ajoute une barre oblique initiale, retire une barre oblique finale. |

### `interceptLinks(options)`

Transforme les clics sur des `<a href>` de même origine en appels `navigate(path)`. Renvoie une fonction de nettoyage.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | requis | Reçoit `pathname + search + hash` sans `base`. Les erreurs sont journalisées. |
| `root` | `Document \| HTMLElement` | `document` | Où se trouve l'écouteur de clic. |
| `base` | `string` | `'/'` | Les liens en dehors sont laissés au navigateur ; retiré avant `navigate`/`prefetch`. |
| `shouldIntercept` | `(anchor, url, event) => boolean` | aucun | Renvoyez `false` pour laisser le navigateur gérer le clic. S'exécute après les vérifications intégrées. |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | aucun | Sur `pointerenter` ou `focusin`, une fois par `pathname + search`. |

Le navigateur garde le clic quand : un autre handler a appelé `preventDefault()` ; il s'agit d'un bouton autre que le principal ou de Ctrl/Meta/Shift/Alt ; `target` est autre que `_self` ; `download` ; `rel` contient `external` ; `data-tuvix-reload` ; une autre origine ; un chemin en dehors de `base` ; un lien d'ancre vers le chemin et la query courants ; ou `shouldIntercept` renvoie `false`. Les liens à l'intérieur de shadow roots ouverts sont gérés ; les éléments SVG `<a>` sont laissés au navigateur.

### `resolveLink(event, options?)`

Renvoie `{ anchor, url, path }` pour l'`<a href>` HTML sur lequel un événement s'est produit, ou `null` quand le navigateur doit gérer le lien. `path` vaut `pathname + search + hash` sans `base`. `interceptLinks` et le prefetch au survol de l'orchestrateur l'utilisent ; appelez-le depuis vos propres écouteurs pour appliquer les mêmes règles.

```ts
import { resolveLink } from '@tuvix.js/router';

document.addEventListener('focusin', (event) => {
  const link = resolveLink(event, { base: '/app' });
  if (link) console.log('next page might be', link.path);
});
```

Il renvoie `null` pour : un `<a>` SVG, un `<a>` sans `href` ou l'absence d'`<a>` (le `<a>` le plus proche sur le chemin de l'événement décide) ; `target` autre que `_self` ; `download` ; `rel` contenant `external` ; `data-tuvix-reload` ; une autre origine ; un chemin en dehors de `base` ; l'absence de `window`. Il lit `event.composedPath()`, il trouve donc les liens dans les shadow roots ouverts, pas dans les fermés. Appelez-le pendant la propagation de l'événement. Il ne vérifie ni les boutons, ni les touches de modification, ni les liens d'ancre seule.

### Types

`RouterMode`, `RouterConfig`, `RouteConfig`, `MatchedRoute`, `NavigationEvent` (`{ from, to, fromRoute, toRoute }`, chemins sans `base`), `NavigationGuard`, `RouteChangeHandler`, `IRouter`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolveLinkOptions` (`{ base? }`), `ResolvedLink` (`{ anchor, url, path }`).

## Cas particuliers

- Le routeur n'annule pas une navigation en cours quand une autre démarre ; la dernière chaîne de guards à se terminer écrit l'URL.
- Si un autre code appelle `history.pushState`, `currentPath` reste obsolète jusqu'au prochain `popstate`, `hashchange` ou navigation du routeur.
- Sur le serveur, le constructeur fixe `currentPath` à `'/'` et n'attache rien. Les méthodes de navigation ont besoin de `window`.
- Un guard qui annule une navigation précédent/suivant corrige la barre d'adresse ; la position dans l'historique reste là où le navigateur l'a déplacée.

## Ce qu'il ne fait pas

- Il ne monte pas les apps. C'est l'orchestrateur de `@tuvix.js/core` qui le fait, avec la config `router` ou `connectRouter`.
- Il n'intercepte pas les liens, sauf si vous appelez `interceptLinks`.
- Pas de routes imbriquées, de redirections, de guards par route ni de restauration du défilement.

## Migrer depuis la 0.4

- `push()`/`replace()` ajoutent le préfixe `base` : avec `base: '/app'`, `push('/x')` écrit `/app/x`. Passez des chemins relatifs à `base`.
- `base` n'est retiré qu'à une limite de segment.
- Les routes doivent correspondre au chemin entier dans `match`, `getActiveApps` et `isPathActive` ; une route `'/'` n'est active que sur `/`. Utilisez `'/*'` pour une route attrape-tout.
- `RouteConfig.exact` est supprimé (il était ignoré).
- `pathToRegex(pattern)` a perdu son argument `exact` et renvoie une `RegExp` mise en cache.
- Les caractères regex dans les motifs correspondent littéralement ; un `*` au milieu correspond à un segment.
- `matchRoute()` et `isPathActive()` ignorent `#hash`.

## Licence

MIT

# Routage

Tuvix.js décide quelles apps monter à partir du chemin courant. Vous le décrivez avec `activeWhen` sur chaque app, avec `routes` sur le routeur intégré, ou avec les deux. Un seul matcher, `matchPath` de `@tuvix.js/router`, interprète chaque motif : `activeWhen`, le routeur et `@tuvix.js/server` s'accordent donc sur le sens de `/users/:id`.

## Règles des motifs {#pattern-rules}

Les chaînes `activeWhen` utilisent une correspondance par préfixe :

| Motif | Correspond à | Ne correspond pas à | Params |
| --- | --- | --- | --- |
| `/dashboard` | `/dashboard`, `/dashboard/`, `/dashboard/stats` | `/dashboards` | aucun |
| `/dashboard/*` | les mêmes chemins que `/dashboard` | `/dashboards` | aucun |
| `/users/:id` | `/users/42`, `/users/42/posts` | `/users` | `{ id: '42' }` |
| `/v:version/docs` | `/v2/docs` | `/2/docs` | `{ version: '2' }` |
| `/` | tous les chemins | aucun | aucun |

- Le matcher retire `?query` et `#hash` avant la comparaison : `/dashboard?tab=1` correspond donc toujours à `/dashboard`.
- Il décode les params : `/users/J%C3%BCrgen` donne `{ id: 'Jürgen' }`.
- Les caractères comme `.` et `(` correspondent littéralement.
- Un `*` au milieu d'un motif correspond à un segment.

Vérifiez un motif vous-même :

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/settings', '/settings/profile').matched; // true
matchPath('/settings', '/settings/profile', { end: true }).matched; // false
matchPath('/', '/about', { end: true }).matched; // false
```

## Activer des apps avec activeWhen {#activate-apps-with-activewhen}

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  activeWhen: '/users/:id',
});

orchestrator.register({
  name: 'header',
  entry: () => import('./apps/header'),
  container: '#header',
  activeWhen: '/', // every page
});

await orchestrator.start();
```

Une fonction reçoit le chemin et renvoie un booléen. Utilisez-la pour des correspondances exactes, plusieurs préfixes ou des feature flags.

## Le routeur intégré {#the-built-in-router}

Passez `router` à `createOrchestrator` et l'orchestrateur réconcilie après chaque navigation effectuée par le routeur :

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/settings', app: 'settings' },
      { path: '/billing/*', app: 'billing' },
    ],
  },
});

orchestrator.register({ name: 'settings', entry: () => import('./apps/settings'), container: '#app' });
orchestrator.register({ name: 'billing', entry: () => import('./apps/billing'), container: '#app' });

await orchestrator.start();
await orchestrator.navigateTo('/billing/invoices');
```

Une app sans `activeWhen` suit les routes qui la nomment. Deux différences avec `activeWhen` :

- Les chemins des routes correspondent en entier. `/settings` correspond à `/settings` et à `/settings/`, pas à `/settings/profile`. Ajoutez `/*` pour les sous-chemins.
- Une route de chemin `/` n'active son app que sur `/`. Utilisez `/*` pour une route qui correspond à tous les chemins.

Quand une app a `activeWhen`, l'orchestrateur l'utilise et ignore `routes`.

Le routeur écoute `popstate` (mode history) ou `hashchange` (mode hash). Il n'intercepte pas les clics sur les liens ; voir la section suivante.

## Clics sur les liens {#link-clicks}

`interceptLinks` transforme les clics sur des `<a href>` de même origine en appels à votre fonction `navigate` et renvoie une fonction de nettoyage :

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

const stop = interceptLinks({
  navigate: (path) => orchestrator.navigateTo(path),
  prefetch: (path) => console.debug('user may open', path),
});

// later, when the shell leaves the page
stop();
```

Il laisse ces clics au navigateur :

- une touche de modification (Ctrl, Meta, Shift, Alt) ou un bouton autre que le bouton principal ;
- `event.defaultPrevented` déjà à true ;
- un `target` autre que `_self`, un attribut `download`, `rel="external"` ou `data-tuvix-reload` ;
- une autre origine, ou un chemin hors de `base` ;
- un lien composé uniquement d'un hash sur le chemin courant, pour que le navigateur fasse défiler la page.

`prefetch(path)` s'exécute au pointerenter ou au focus, une fois par chemin. `shouldIntercept(anchor, url, event)` ajoute votre propre filtre ; renvoyez `false` pour laisser le navigateur gérer le clic. `root` limite l'écoute à un seul élément.

## Navigation et gardes {#navigation-and-guards}

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/users/:id', app: 'user' }] });

const offGuard = router.beforeEach(async ({ to }) => {
  if (!to.startsWith('/admin')) return true;
  const response = await fetch('/api/me');
  return response.ok;
});

const offChange = router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} → ${to}`, toRoute?.params);
});

await router.push('/users/42'); // pushState
await router.replace('/users/43'); // replaceState
router.back();

router.currentPath; // '/users/43'
router.currentRoute?.params; // { id: '43' }
router.currentRoute?.query; // parsed ?query
router.match('/users/7'); // MatchedRoute | null, no navigation
router.getActiveApps('/users/7'); // ['user']

offGuard();
offChange();
router.destroy();
```

- Les gardes s'exécutent dans l'ordre avant `push`, `replace` et les navigations back/forward. `false` annule. Une garde qui lève une exception annule la navigation et journalise l'erreur.
- Une navigation back/forward annulée restaure l'URL précédente avec `replaceState`.
- Un `push` vers le chemin courant ne fait rien.
- `router.match` renvoie la première route qui correspond ; `getActiveApps` renvoie toutes les apps dont la route correspond.

## Chemin de base {#base-path}

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { base: '/app', routes: [{ path: '/reports/*', app: 'reports' }] },
});

interceptLinks({ base: '/app', navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.navigateTo('/reports'); // URL becomes /app/reports
```

Avec `base: '/app'` :

- le routeur retire `/app` avant la comparaison, donc les routes et les motifs `activeWhen` l'omettent ;
- `push('/x')` et `replace('/x')` écrivent `/app/x` ;
- `/application` reste `/application` : la base n'est retirée que sur une frontière de segment ;
- `interceptLinks` a besoin de la même `base`, sinon il transmet `/app/x` à `navigateTo`, qui écrit `/app/app/x`.

## Mode hash {#hash-mode}

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ mode: 'hash', routes: [{ path: '/about', app: 'about' }] });
await router.push('/about'); // URL: /#/about
```

Utilisez-le sur les hébergeurs statiques qui ne peuvent pas réécrire chaque chemin vers `index.html`. Le routeur ignore `base` en mode hash.

## Lire les params dans une app {#read-params-in-an-app}

Le contexte de montage ne contient pas de params. Lisez-les depuis le chemin, ou transmettez-les en props :

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { routes: [{ path: '/users/:id', app: 'user' }] },
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  props: { id: matchPath('/users/:id', location.pathname).params.id },
});

orchestrator.getRouter()?.onChange(({ toRoute }) => {
  if (toRoute?.route.app === 'user') {
    void orchestrator.updateAppProps('user', { id: toRoute.params.id });
  }
});

await orchestrator.start();
```

## Routeurs externes {#external-routers}

Si TanStack Router, React Router ou un autre routeur gère la navigation, omettez `config.router` et appelez `orchestrator.connectRouter({ subscribe, getPath })`. Voir [Routeur externe](/fr/guide/external-router).

## Ce que le routage ne fait pas {#what-routing-does-not-do}

- Il ne rend pas les composants de route. Les apps se rendent elles-mêmes dans des conteneurs.
- Il ne charge pas de données. Utilisez une garde, `onChange` ou le `mount` de l'app.
- Le routeur ne gère pas les clics sur les liens, sauf si vous appelez `interceptLinks`.

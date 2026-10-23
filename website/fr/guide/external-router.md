# Routeur externe

Quand TanStack Router, React Router ou un autre routeur gère déjà la navigation de votre shell, laissez-lui ce rôle. `orchestrator.connectRouter()` fait suivre ce routeur à l'orchestrateur, et `interceptLinks()` transmet à ce routeur les clics sur les `<a href>` simples des micro apps.

## Quand l'utiliser {#when-to-use-it}

- Votre shell est une app React avec son propre routeur, et certaines routes hébergent des micro apps.
- Vos micro apps rendent des liens simples (templates Vue, Svelte, Angular ou HTML) qui doivent naviguer sans rechargement de page.

Si le shell n'a pas son propre routeur, utilisez plutôt le routeur intégré ; voir [Routage](/fr/guide/routing).

## connectRouter {#connectrouter}

```ts
import { createOrchestrator, type RouterSource } from 'tuvix.js';

const source: RouterSource = {
  // Call `callback` after every navigation; return an unsubscribe function.
  subscribe(callback) {
    window.addEventListener('popstate', callback);
    return () => window.removeEventListener('popstate', callback);
  },
  // The path activeWhen patterns are matched against.
  getPath: () => window.location.pathname,
};

const orchestrator = createOrchestrator(); // no `router` option
const disconnect = orchestrator.connectRouter(source);
await orchestrator.start();

// later
disconnect();
```

- `start()` réconcilie à partir de `getPath()`. Ensuite, chaque appel du callback de `subscribe` met en file une réconciliation pour le nouveau `getPath()`.
- Connecter un orchestrateur déjà démarré déclenche une réconciliation immédiate.
- Les réconciliations s'exécutent une par une, et seul le chemin le plus récent en file passe ensuite : une rafale d'événements du routeur coûte donc une réconciliation par chemin stabilisé.
- `destroy()` déconnecte tous les routeurs connectés.

## TanStack Router {#tanstack-router}

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // your createRouter({ routeTree }) instance

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'blog',
  entry: () => import('./micro-apps/blog'),
  container: '#micro-app',
  activeWhen: '/blog/*',
});

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});

// Plain <a href> inside micro apps → TanStack history.
interceptLinks({ navigate: (path) => router.history.push(path) });

await orchestrator.start();
```

`onResolved` se déclenche une fois que le routeur a résolu la nouvelle location. Utilisez-le plutôt que `onLoad` accompagné d'un `setTimeout`.

## React Router {#react-router}

Avec un data router créé par `createBrowserRouter` :

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // createBrowserRouter(routes)

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'account',
  entry: () => import('./micro-apps/account'),
  container: '#micro-app',
  activeWhen: '/account/*',
});

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe(() => callback()),
  getPath: () => router.state.location.pathname,
});

interceptLinks({ navigate: (path) => router.navigate(path) });

await orchestrator.start();
```

Avec `<BrowserRouter>`, il n'existe pas d'objet routeur auquel s'abonner. Faites le pont depuis un composant qui lit `useLocation()` :

```tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { Orchestrator, RouterSource } from 'tuvix.js';

export function TuvixBridge({ orchestrator }: { orchestrator: Orchestrator }) {
  const location = useLocation();
  const listeners = useRef(new Set<() => void>());
  const path = useRef<string>(location.pathname);
  path.current = location.pathname;

  useEffect(() => {
    const source: RouterSource = {
      subscribe(callback) {
        listeners.current.add(callback);
        return () => listeners.current.delete(callback);
      },
      getPath: () => path.current,
    };
    return orchestrator.connectRouter(source);
  }, [orchestrator]);

  useEffect(() => {
    for (const callback of listeners.current) callback();
  }, [location.pathname]);

  return null;
}
```

## Liens simples dans les micro apps {#plain-links-inside-micro-apps}

Les composants `<Link>` de votre routeur naviguent déjà côté client. Les liens que les micro apps rendent sous forme de `<a href>` simples ne le font pas : sans `interceptLinks`, ils rechargent la page. `interceptLinks` ignore les clics avec touche de modification, les autres origines, `target="_blank"`, `download`, `rel="external"`, `data-tuvix-reload` et les liens composés uniquement d'un hash sur le chemin courant, et appelle votre `navigate` pour le reste. Ajoutez `prefetch` pour préparer la route suivante au survol ou au focus. Avec TanStack Router :

```ts
import { interceptLinks } from 'tuvix.js';
import { router } from './router';

const stop = interceptLinks({
  navigate: (path) => router.history.push(path),
  prefetch: (path) => void router.preloadRoute({ to: path }),
});
```

Appelez `stop()` quand le shell est démonté.

## Chemins de base {#base-paths}

Avec un basename de routeur comme `/app` :

- Les motifs `activeWhen` correspondent à la chaîne exacte que renvoie `getPath()`. Si votre routeur renvoie des chemins avec `/app`, écrivez `'/app/blog/*'`, ou retirez la base dans `getPath`.
- `interceptLinks({ base: '/app', ... })` ignore les liens hors de `/app` et retire `/app` avant d'appeler `navigate`. Utilisez-le quand le `navigate` de votre routeur attend des chemins relatifs au basename (`router.navigate` de React Router). Omettez `base` quand `navigate` prend le chemin d'URL complet (`router.history.push` de TanStack).

## Conteneurs rendus par les routes {#containers-rendered-by-routes}

L'orchestrateur cherche `container` au moment du montage. Si un composant de route rend l'élément conteneur, celui-ci peut ne pas encore être dans le DOM quand le callback du routeur se déclenche, et le montage échoue avec `Container "#micro-app" not found in DOM`. Deux solutions :

- Gardez le conteneur dans un layout que partagent toutes les routes de micro apps, pour qu'il existe avant la navigation.
- Rendez la micro app depuis le composant de route lui-même avec `TuvixIsland` (`@tuvix.js/react`), et n'utilisez pas l'orchestrateur pour cette app.

## Ce que connectRouter ne fait pas {#what-connectrouter-does-not-do}

- Il ne navigue pas. La navigation reste la tâche de votre routeur.
- Il ne lit pas les params de route. Passez-les en props avec `updateAppProps`, ou lisez-les dans l'app.
- Il ne gère pas les clics sur les liens. Appelez `interceptLinks` pour cela.

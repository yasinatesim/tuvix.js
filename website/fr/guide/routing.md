# Routage

`@tuvix.js/router` fournit l'activation de micro apps basée sur les URL. Quand une URL correspond à une route, la micro app correspondante est montée. Quand l'URL change, l'app est démontée.

## Configuration

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });

const router = createRouter({
  orchestrator,
  mode: 'history', // ou 'hash'
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

orchestrator.start();
```

## Correspondance des Routes

Les routes sont comparées dans l'ordre. La première correspondance l'emporte.

| Motif | Correspond à | Paramètres |
|-------|-------------|------------|
| `/` | `/` | - |
| `/dashboard` | `/dashboard` | - |
| `/users/:id` | `/users/42` | `{ id: '42' }` |
| `/files/*` | `/files/a/b/c` | `{ '*': 'a/b/c' }` |

Les paramètres de route sont passés à la micro app comme `props.params` :

```ts
// Dans votre micro app
async mount(container, props) {
  const { id } = (props?.params ?? {}) as { id: string };
  // récupérer l'utilisateur avec id
}
```

## Guards de Navigation

Protégez les routes avec des fonctions guard :

```ts
routes: [
  {
    path: '/admin',
    app: 'admin',
    guard: async () => {
      const user = await getUser();
      if (!user.isAdmin) {
        router.navigate('/login');
        return false; // Bloquer la navigation
      }
      return true;
    },
  },
],
```

## Navigation Programmatique

```ts
// Naviguer vers un chemin
router.navigate('/dashboard');

// Naviguer avec des paramètres de requête
router.navigate('/search?q=tuvix');

// Remplacer l'entrée d'historique actuelle (pas de bouton retour)
router.replace('/dashboard');

// Aller en arrière / en avant
router.go(-1);
```

## Mode Hash

Utilisez le mode hash pour les environnements sans réécriture d'URL côté serveur (ex. hébergement statique sans fallback SPA) :

```ts
const router = createRouter({
  orchestrator,
  mode: 'hash',
  routes: [
    { path: '/', app: 'home' },
    { path: '/about', app: 'about' },
  ],
});
// URLs : /#/, /#/about
```

## Route Active

```ts
const currentRoute = router.currentRoute;
// { path: '/dashboard', app: 'dashboard', params: {} }

router.onRouteChange((route) => {
  console.log('Navigated to:', route.path);
});
```

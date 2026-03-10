# Routing

`@tuvix.js/router` provides URL-based micro app activation. When a URL matches a route, the corresponding micro app is mounted. When the URL changes away, the app is unmounted.

## Setup

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });

const router = createRouter({
  orchestrator,
  mode: 'history', // or 'hash'
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

orchestrator.start();
```

## Route Matching

Routes are matched in order. The first match wins.

| Pattern | Matches | Params |
|---------|---------|--------|
| `/` | `/` | — |
| `/dashboard` | `/dashboard` | — |
| `/users/:id` | `/users/42` | `{ id: '42' }` |
| `/files/*` | `/files/a/b/c` | `{ '*': 'a/b/c' }` |

Route params are passed to the micro app as `props.params`:

```ts
// In your micro app
async mount(container, props) {
  const { id } = (props?.params ?? {}) as { id: string };
  // fetch user with id
}
```

## Navigation Guards

Protect routes with guard functions:

```ts
routes: [
  {
    path: '/admin',
    app: 'admin',
    guard: async () => {
      const user = await getUser();
      if (!user.isAdmin) {
        router.navigate('/login');
        return false; // Block navigation
      }
      return true;
    },
  },
],
```

## Programmatic Navigation

```ts
// Navigate to a path
router.navigate('/dashboard');

// Navigate with query params
router.navigate('/search?q=tuvix');

// Replace current history entry (no back button)
router.replace('/dashboard');

// Go back / forward
router.go(-1);
```

## Hash Mode

Use hash mode for environments without server-side URL rewriting (e.g. static hosting without SPA fallback):

```ts
const router = createRouter({
  orchestrator,
  mode: 'hash',
  routes: [
    { path: '/', app: 'home' },
    { path: '/about', app: 'about' },
  ],
});
// URLs: /#/, /#/about
```

## Active Route

```ts
const currentRoute = router.currentRoute;
// { path: '/dashboard', app: 'dashboard', params: {} }

router.onRouteChange((route) => {
  console.log('Navigated to:', route.path);
});
```

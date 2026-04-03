# Routing

`@tuvix.js/router` bietet URL-basierte Micro-App-Aktivierung. Wenn eine URL mit einer Route übereinstimmt, wird die entsprechende Micro App gemountet. Wenn sich die URL ändert, wird die App unmountet.

## Einrichtung

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });

const router = createRouter({
  orchestrator,
  mode: 'history', // oder 'hash'
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

orchestrator.start();
```

## Route-Matching

Routes werden in Reihenfolge abgeglichen. Der erste Treffer gewinnt.

| Muster | Trifft auf | Parameter |
|--------|-----------|-----------|
| `/` | `/` | - |
| `/dashboard` | `/dashboard` | - |
| `/users/:id` | `/users/42` | `{ id: '42' }` |
| `/files/*` | `/files/a/b/c` | `{ '*': 'a/b/c' }` |

Route-Parameter werden der Micro App als `props.params` übergeben:

```ts
// In Ihrer Micro App
async mount(container, props) {
  const { id } = (props?.params ?? {}) as { id: string };
  // Benutzer mit id abrufen
}
```

## Navigations-Guards

Schützen Sie Routes mit Guard-Funktionen:

```ts
routes: [
  {
    path: '/admin',
    app: 'admin',
    guard: async () => {
      const user = await getUser();
      if (!user.isAdmin) {
        router.navigate('/login');
        return false; // Navigation blockieren
      }
      return true;
    },
  },
],
```

## Programmatische Navigation

```ts
// Zu einem Pfad navigieren
router.navigate('/dashboard');

// Mit Query-Parametern navigieren
router.navigate('/search?q=tuvix');

// Aktuellen History-Eintrag ersetzen (kein Zurück-Button)
router.replace('/dashboard');

// Zurück / Vorwärts
router.go(-1);
```

## Hash-Modus

Verwenden Sie den Hash-Modus für Umgebungen ohne serverseitige URL-Umschreibung (z.B. statisches Hosting ohne SPA-Fallback):

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

## Aktive Route

```ts
const currentRoute = router.currentRoute;
// { path: '/dashboard', app: 'dashboard', params: {} }

router.onRouteChange((route) => {
  console.log('Navigated to:', route.path);
});
```

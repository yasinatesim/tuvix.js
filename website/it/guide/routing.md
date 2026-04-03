# Routing

`@tuvix.js/router` fornisce l'attivazione di micro app basata su URL. Quando un URL corrisponde a una route, la micro app corrispondente viene montata. Quando l'URL cambia, l'app viene smontata.

## Configurazione

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });

const router = createRouter({
  orchestrator,
  mode: 'history', // o 'hash'
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

orchestrator.start();
```

## Corrispondenza delle Route

Le route vengono confrontate in ordine. La prima corrispondenza vince.

| Pattern | Corrisponde a | Parametri |
|---------|--------------|-----------|
| `/` | `/` | - |
| `/dashboard` | `/dashboard` | - |
| `/users/:id` | `/users/42` | `{ id: '42' }` |
| `/files/*` | `/files/a/b/c` | `{ '*': 'a/b/c' }` |

I parametri della route vengono passati alla micro app come `props.params`:

```ts
// Nella tua micro app
async mount(container, props) {
  const { id } = (props?.params ?? {}) as { id: string };
  // recupera utente con id
}
```

## Guard di Navigazione

Proteggi le route con funzioni guard:

```ts
routes: [
  {
    path: '/admin',
    app: 'admin',
    guard: async () => {
      const user = await getUser();
      if (!user.isAdmin) {
        router.navigate('/login');
        return false; // Blocca la navigazione
      }
      return true;
    },
  },
],
```

## Navigazione Programmatica

```ts
// Naviga verso un percorso
router.navigate('/dashboard');

// Naviga con parametri di query
router.navigate('/search?q=tuvix');

// Sostituisci la voce corrente della cronologia (nessun pulsante indietro)
router.replace('/dashboard');

// Vai indietro / avanti
router.go(-1);
```

## Modalità Hash

Usa la modalità hash per ambienti senza riscrittura URL lato server (es. hosting statico senza fallback SPA):

```ts
const router = createRouter({
  orchestrator,
  mode: 'hash',
  routes: [
    { path: '/', app: 'home' },
    { path: '/about', app: 'about' },
  ],
});
// URL: /#/, /#/about
```

## Route Attiva

```ts
const currentRoute = router.currentRoute;
// { path: '/dashboard', app: 'dashboard', params: {} }

router.onRouteChange((route) => {
  console.log('Navigated to:', route.path);
});
```

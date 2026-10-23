# Router esterno

Quando TanStack Router, React Router o un altro router gestisce già la navigazione nella tua shell, lascia a lui quel compito. `orchestrator.connectRouter()` fa sì che l'orchestratore segua quel router, e `interceptLinks()` gli inoltra i clic sui semplici `<a href>` delle micro app.

## Quando usarlo

- La tua shell è un'app React con un proprio router e alcune route ospitano micro app.
- Le tue micro app eseguono il rendering di link semplici (template Vue, Svelte, Angular o HTML) che devono navigare senza ricaricare la pagina.

Se la shell non ha un proprio router, usa quello integrato; vedi [Routing](/it/guide/routing).

## connectRouter

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

- `start()` riconcilia in base a `getPath()`. Da quel momento ogni callback di `subscribe` accoda una riconciliazione per il nuovo `getPath()`.
- Collegare un orchestratore già avviato riconcilia subito.
- Le riconciliazioni vengono eseguite una alla volta e come successiva parte solo l'ultima accodata, quindi una raffica di eventi del router costa una riconciliazione per ogni percorso stabilizzato.
- `destroy()` scollega ogni router collegato.

## TanStack Router

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

`onResolved` scatta quando il router ha risolto la nuova location. Usalo al posto di `onLoad` più un `setTimeout`.

## React Router

Con un data router creato da `createBrowserRouter`:

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

Con `<BrowserRouter>` non esiste un oggetto router a cui iscriversi. Crea il collegamento da un componente che legge `useLocation()`:

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

## Link semplici nelle micro app

I componenti `<Link>` del tuo router navigano già lato client. I link che le micro app rendono come semplici `<a href>` no: senza `interceptLinks` ricaricano la pagina. `interceptLinks` ignora i clic con tasti modificatori, le altre origini, `target="_blank"`, `download`, `rel="external"`, `data-tuvix-reload` e i link solo hash nel percorso corrente, e chiama il tuo `navigate` per tutti gli altri. Aggiungi `prefetch` per preparare la route successiva al passaggio del mouse o al focus. Con TanStack Router:

```ts
import { interceptLinks } from 'tuvix.js';
import { router } from './router';

const stop = interceptLinks({
  navigate: (path) => router.history.push(path),
  prefetch: (path) => void router.preloadRoute({ to: path }),
});
```

Chiama `stop()` quando la shell viene smontata.

## Percorsi base

Con un basename del router come `/app`:

- i pattern di `activeWhen` corrispondono alla stringa esatta restituita da `getPath()`. Se il tuo router riporta percorsi con `/app`, scrivi `'/app/blog/*'`, oppure rimuovi il base in `getPath`.
- `interceptLinks({ base: '/app', ... })` ignora i link fuori da `/app` e rimuove `/app` prima di chiamare `navigate`. Usalo quando il `navigate` del tuo router si aspetta percorsi relativi al basename (`router.navigate` di React Router). Ometti `base` quando `navigate` accetta il percorso URL completo (`router.history.push` di TanStack).

## Container renderizzati dalle route {#containers-rendered-by-routes}

L'orchestratore cerca `container` al momento del mount. Se è un componente di route a renderizzare l'elemento container, questo potrebbe non essere ancora nel DOM quando scatta la callback del router, e il mount fallisce con `Container "#micro-app" not found in DOM`. Hai due soluzioni:

- Tieni il container in un layout condiviso da tutte le route delle micro app, così esiste prima della navigazione.
- Esegui il rendering della micro app dal componente di route stesso con `TuvixIsland` (`@tuvix.js/react`) e non usare l'orchestratore per quell'app.

## Cosa non fa connectRouter

- Non naviga. La navigazione resta compito del tuo router.
- Non legge i parametri della route. Passali come props con `updateAppProps`, oppure leggili dentro l'app.
- Non gestisce i clic sui link. Per quello chiama `interceptLinks`.

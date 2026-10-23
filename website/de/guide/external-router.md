# Externer Router

Wenn TanStack Router, React Router oder ein anderer Router in deiner Shell bereits die Navigation steuert, lass ihm diese Aufgabe. `orchestrator.connectRouter()` sorgt dafür, dass der Orchestrator diesem Router folgt, und `interceptLinks()` leitet einfache `<a href>`-Klicks aus Micro Apps an ihn weiter.

## Wann du es verwendest

- Deine Shell ist eine React-App mit eigenem Router, und einige Routen beherbergen Micro Apps.
- Deine Micro Apps rendern einfache Links (Vue-, Svelte-, Angular- oder HTML-Templates), die ohne Neuladen der Seite navigieren sollen.

Hat die Shell keinen eigenen Router, verwende stattdessen den eingebauten; siehe [Routing](/de/guide/routing).

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

- `start()` gleicht gegen `getPath()` ab. Danach stellt jeder `subscribe`-Callback einen Abgleich für das neue `getPath()` in die Warteschlange.
- Verbindest du einen Orchestrator, der bereits gestartet ist, gleicht er sofort ab.
- Abgleiche laufen nacheinander, und als Nächstes läuft nur der neueste wartende Pfad. Eine Serie von Router-Events kostet daher einen Abgleich pro feststehendem Pfad.
- `destroy()` trennt jeden verbundenen Router.

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

`onResolved` wird ausgelöst, sobald der Router die neue Location aufgelöst hat. Verwende es statt `onLoad` plus `setTimeout`.

## React Router

Mit einem Data Router aus `createBrowserRouter`:

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

Mit `<BrowserRouter>` gibt es kein Router-Objekt, das du abonnieren kannst. Überbrücke es aus einer Komponente, die `useLocation()` liest:

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

## Einfache Links in Micro Apps

Die eigenen `<Link>`-Komponenten deines Routers navigieren bereits clientseitig. Links, die Micro Apps als einfaches `<a href>` rendern, tun das nicht; ohne `interceptLinks` laden sie die Seite neu. `interceptLinks` überspringt Klicks mit Modifikatortasten, andere Origins, `target="_blank"`, `download`, `rel="external"`, `data-tuvix-reload` und reine Hash-Links auf dem aktuellen Pfad und ruft für den Rest dein `navigate` auf. Ergänze `prefetch`, um die nächste Route bei Hover oder Fokus vorzuwärmen. Mit TanStack Router:

```ts
import { interceptLinks } from 'tuvix.js';
import { router } from './router';

const stop = interceptLinks({
  navigate: (path) => router.history.push(path),
  prefetch: (path) => void router.preloadRoute({ to: path }),
});
```

Rufe `stop()` auf, wenn die Shell unmountet.

## Basispfade

Mit einem Router-Basename wie `/app`:

- passen `activeWhen`-Muster auf genau den String, den `getPath()` zurückgibt. Meldet dein Router Pfade mit `/app`, schreibe `'/app/blog/*'` oder entferne die Basis in `getPath`.
- ignoriert `interceptLinks({ base: '/app', ... })` Links außerhalb von `/app` und entfernt `/app`, bevor es `navigate` aufruft. Nutze das, wenn das `navigate` deines Routers Pfade relativ zum Basename erwartet (`router.navigate` von React Router). Lass `base` weg, wenn `navigate` den vollständigen URL-Pfad erwartet (`router.history.push` von TanStack).

## Von Routen gerenderte Container {#containers-rendered-by-routes}

Der Orchestrator sucht `container` beim Mounten. Rendert eine Routenkomponente das Container-Element, ist es beim Auslösen des Router-Callbacks womöglich noch nicht im DOM, und der Mount schlägt mit `Container "#micro-app" not found in DOM` fehl. Zwei Auswege:

- Halte den Container in einem Layout, das alle Micro-App-Routen teilen, damit er vor der Navigation existiert.
- Rendere die Micro App mit `TuvixIsland` (`@tuvix.js/react`) direkt aus der Routenkomponente und verzichte für diese App auf den Orchestrator.

## Was connectRouter nicht tut

- Es navigiert nicht. Die Navigation bleibt bei deinem Router.
- Es liest keine Routen-Params. Übergib sie mit `updateAppProps` als Props oder lies sie innerhalb der App.
- Es behandelt keine Link-Klicks. Rufe dafür `interceptLinks` auf.

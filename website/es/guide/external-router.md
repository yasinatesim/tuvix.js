# Router externo

Cuando TanStack Router, React Router u otro router ya controla la navegación en tu shell, deja que siga haciéndolo. `orchestrator.connectRouter()` hace que el orquestador siga a ese router, e `interceptLinks()` envía a ese router los clics en `<a href>` simples de las micro apps.

## Cuándo usarlo

- Tu shell es una app de React con su propio router, y algunas rutas alojan micro apps.
- Tus micro apps renderizan enlaces simples (plantillas de Vue, Svelte, Angular o HTML) que deben navegar sin recargar la página.

Si la shell no tiene router propio, usa el integrado; consulta [Enrutamiento](/es/guide/routing).

## connectRouter

```ts
import { createOrchestrator, type RouterSource } from 'tuvix.js';

const source: RouterSource = {
  // Llama a `callback` después de cada navegación; devuelve una función para cancelar la suscripción.
  subscribe(callback) {
    window.addEventListener('popstate', callback);
    return () => window.removeEventListener('popstate', callback);
  },
  // La ruta con la que se comparan los patrones de activeWhen.
  getPath: () => window.location.pathname,
};

const orchestrator = createOrchestrator(); // sin la opción `router`
const disconnect = orchestrator.connectRouter(source);
await orchestrator.start();

// más tarde
disconnect();
```

- `start()` reconcilia con `getPath()`. A partir de ahí, cada callback de `subscribe` encola una reconciliación para el nuevo `getPath()`.
- Conectar un orquestador que ya arrancó reconcilia de inmediato.
- Las reconciliaciones se ejecutan de una en una y solo la ruta encolada más reciente se ejecuta a continuación, así que una ráfaga de eventos del router cuesta una reconciliación por ruta estabilizada.
- `destroy()` desconecta todos los routers conectados.

## TanStack Router

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // tu instancia de createRouter({ routeTree })

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

// <a href> simples dentro de las micro apps → historial de TanStack.
interceptLinks({ navigate: (path) => router.history.push(path) });

await orchestrator.start();
```

`onResolved` se dispara cuando el router ha resuelto la nueva ubicación. Úsalo en lugar de `onLoad` más un `setTimeout`.

## React Router

Con un data router de `createBrowserRouter`:

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

Con `<BrowserRouter>` no hay un objeto router al que suscribirse. Crea el puente desde un componente que lea `useLocation()`:

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

## Enlaces simples dentro de las micro apps

Los componentes `<Link>` de tu router ya navegan en el cliente. Los enlaces que las micro apps renderizan como `<a href>` simples no lo hacen; sin `interceptLinks` recargan la página. `interceptLinks` omite los clics con modificadores, otros orígenes, `target="_blank"`, `download`, `rel="external"`, `data-tuvix-reload` y los enlaces solo con hash en la ruta actual, y llama a tu `navigate` para el resto. Añade `prefetch` para precargar la siguiente ruta al pasar el cursor o al recibir el foco. Con TanStack Router:

```ts
import { interceptLinks } from 'tuvix.js';
import { router } from './router';

const stop = interceptLinks({
  navigate: (path) => router.history.push(path),
  prefetch: (path) => void router.preloadRoute({ to: path }),
});
```

Llama a `stop()` cuando la shell se desmonte.

## Rutas base

Con un basename de router como `/app`:

- Los patrones de `activeWhen` coinciden con la cadena exacta que devuelve `getPath()`. Si tu router informa las rutas con `/app`, escribe `'/app/blog/*'`, o quita la base en `getPath`.
- `interceptLinks({ base: '/app', ... })` ignora los enlaces fuera de `/app` y quita `/app` antes de llamar a `navigate`. Úsalo cuando el `navigate` de tu router espera rutas relativas al basename (el `router.navigate` de React Router). No pases `base` cuando `navigate` recibe la ruta completa de la URL (el `router.history.push` de TanStack).

## Contenedores renderizados por rutas {#containers-rendered-by-routes}

El orquestador busca `container` al montar. Si un componente de ruta renderiza el elemento contenedor, puede que todavía no esté en el DOM cuando se dispara el callback del router, y el montaje falla con `Container "#micro-app" not found in DOM`. Hay dos salidas:

- Mantén el contenedor en un layout que compartan todas las rutas de micro apps, para que exista antes de la navegación.
- Renderiza la micro app desde el propio componente de ruta con `TuvixIsland` (`@tuvix.js/react`), y omite el orquestador para esa app.

## Lo que no hace connectRouter

- No navega. La navegación sigue en manos de tu router.
- No lee los params de ruta. Pásalos como props con `updateAppProps`, o léelos dentro de la app.
- No gestiona los clics en enlaces. Llama a `interceptLinks` para eso.

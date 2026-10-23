# Enrutamiento

Tuvix.js decide qué apps montar a partir de la ruta actual. Lo describes con `activeWhen` en cada app, con `routes` en el router integrado, o con ambos. Un único matcher, `matchPath` de `@tuvix.js/router`, interpreta todos los patrones, así que `activeWhen`, el router y `@tuvix.js/server` coinciden en lo que significa `/users/:id`.

## Reglas de patrones

Las cadenas de `activeWhen` usan coincidencia por prefijo:

| Patrón | Coincide con | No coincide con | Params |
| --- | --- | --- | --- |
| `/dashboard` | `/dashboard`, `/dashboard/`, `/dashboard/stats` | `/dashboards` | ninguno |
| `/dashboard/*` | las mismas rutas que `/dashboard` | `/dashboards` | ninguno |
| `/users/:id` | `/users/42`, `/users/42/posts` | `/users` | `{ id: '42' }` |
| `/v:version/docs` | `/v2/docs` | `/2/docs` | `{ version: '2' }` |
| `/` | todas las rutas | ninguna | ninguno |

- El matcher descarta `?query` y `#hash` antes de comparar, así que `/dashboard?tab=1` sigue coincidiendo con `/dashboard`.
- Decodifica los params: `/users/J%C3%BCrgen` da `{ id: 'Jürgen' }`.
- Caracteres como `.` y `(` coinciden de forma literal.
- Un `*` en medio de un patrón coincide con un segmento.

Comprueba un patrón tú mismo:

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/settings', '/settings/profile').matched; // true
matchPath('/settings', '/settings/profile', { end: true }).matched; // false
matchPath('/', '/about', { end: true }).matched; // false
```

## Activar apps con activeWhen

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
  activeWhen: '/', // todas las páginas
});

await orchestrator.start();
```

Una función recibe la ruta y devuelve un booleano. Úsala para coincidencias exactas, varios prefijos o feature flags.

## El router integrado

Pasa `router` a `createOrchestrator` y el orquestador reconcilia después de cada navegación que hace el router:

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

Una app sin `activeWhen` sigue las rutas que la nombran. Dos diferencias respecto a `activeWhen`:

- Las rutas coinciden completas. `/settings` coincide con `/settings` y `/settings/`, no con `/settings/profile`. Añade `/*` para las subrutas.
- Una ruta con path `/` activa su app solo en `/`. Usa `/*` para una ruta que coincida con todas las rutas.

Cuando una app tiene `activeWhen`, el orquestador lo usa e ignora `routes`.

El router escucha `popstate` (modo history) o `hashchange` (modo hash). No intercepta los clics en enlaces; consulta la siguiente sección.

## Clics en enlaces

`interceptLinks` convierte los clics en `<a href>` del mismo origen en llamadas a tu función `navigate` y devuelve una función de limpieza:

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

const stop = interceptLinks({
  navigate: (path) => orchestrator.navigateTo(path),
  prefetch: (path) => console.debug('user may open', path),
});

// más tarde, cuando la shell abandona la página
stop();
```

Deja estos clics al navegador:

- una tecla modificadora (Ctrl, Meta, Shift, Alt) o un botón distinto del principal;
- `event.defaultPrevented` ya en true;
- un `target` distinto de `_self`, un atributo `download`, `rel="external"` o `data-tuvix-reload`;
- otro origen, o una ruta fuera de `base`;
- un enlace solo con hash en la ruta actual, para que el navegador haga scroll.

`prefetch(path)` se ejecuta en pointerenter o focus, una vez por ruta. `shouldIntercept(anchor, url, event)` añade tu propio filtro; devuelve `false` para que el navegador gestione el clic. `root` limita la escucha a un elemento.

## Navegación y guards

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
router.currentRoute?.query; // ?query parseada
router.match('/users/7'); // MatchedRoute | null, sin navegación
router.getActiveApps('/users/7'); // ['user']

offGuard();
offChange();
router.destroy();
```

- Los guards se ejecutan en orden antes de `push`, `replace` y atrás/adelante. `false` cancela. Un guard que lanza una excepción cancela y registra el error.
- Una navegación atrás/adelante cancelada restaura la URL anterior con `replaceState`.
- `push` a la ruta actual no hace nada.
- `router.match` devuelve la primera ruta que coincide; `getActiveApps` devuelve todas las apps cuya ruta coincide.

## Ruta base

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { base: '/app', routes: [{ path: '/reports/*', app: 'reports' }] },
});

interceptLinks({ base: '/app', navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.navigateTo('/reports'); // la URL pasa a ser /app/reports
```

Con `base: '/app'`:

- el router quita `/app` antes de comparar, así que las rutas y los patrones de `activeWhen` lo omiten;
- `push('/x')` y `replace('/x')` escriben `/app/x`;
- `/application` sigue siendo `/application`: la base solo se quita en un límite de segmento;
- `interceptLinks` necesita la misma `base`; si no, pasa `/app/x` a `navigateTo`, que escribe `/app/app/x`.

## Modo hash

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ mode: 'hash', routes: [{ path: '/about', app: 'about' }] });
await router.push('/about'); // URL: /#/about
```

Úsalo en hosts estáticos que no pueden reescribir todas las rutas a `index.html`. El router ignora `base` en modo hash.

## Leer params en una app

El contexto de montaje no tiene params. Léelos de la ruta o envíalos como props:

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

## Routers externos

Si TanStack Router, React Router u otro router controla la navegación, omite `config.router` y llama a `orchestrator.connectRouter({ subscribe, getPath })`. Consulta [Router externo](/es/guide/external-router).

## Lo que no hace el enrutamiento

- No renderiza componentes de ruta. Las apps se renderizan a sí mismas en sus contenedores.
- No carga datos. Usa un guard, `onChange` o el propio `mount` de la app.
- El router no gestiona los clics en enlaces a menos que llames a `interceptLinks`.

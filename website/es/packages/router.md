---
title: '@tuvix.js/router'
---

<PackageHeader
  name="@tuvix.js/router"
  title="Router"
  description="Enrutamiento por history y por hash para micro apps, un único matcher de rutas compartido con core y el servidor, e interceptación de enlaces para la navegación en el cliente."
  icon="🔀"
  npm="true"
/>

## Instalación

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

`@tuvix.js/core` depende de este paquete y reexporta `createRouter`, `matchPath` e `interceptLinks`, así que también puedes importar esos tres desde core.

## Cuándo usarlo

El router asigna rutas de URL a nombres de micro apps y te avisa cuando la ruta cambia. Úsalo cuando la shell controla la navegación y decide qué micro app está activa para una URL. El orquestador crea uno por ti cuando pasas `router` a `createOrchestrator`, así que la mayoría de las shells nunca lo construyen a mano.

`matchPath` es el único matcher de patrones de Tuvix.js. Core lo usa para las cadenas de `activeWhen` y `@tuvix.js/server` lo usa para las `routes` de las apps, así que un patrón significa lo mismo en los tres sitios. Puedes llamarlo por separado, sin router.

Si tu shell ya usa React Router, TanStack Router u otro router de framework, mantenlo. Conéctalo al orquestador con `orchestrator.connectRouter({ subscribe, getPath })` de `@tuvix.js/core` y prescinde de este router. Aun así puedes usar `matchPath` e `interceptLinks` junto a él.

## Inicio rápido

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
    { path: '/settings', app: 'settings' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

router.beforeEach(({ from }) => !from.startsWith('/settings') || confirm('Discard unsaved settings?'));

// <a href="/app/users/42"> now calls router.push('/users/42') instead of reloading.
const stopLinks = interceptLinks({
  navigate: (path) => router.push(path),
  base: '/app',
});

await router.push('/users/42?tab=posts');
console.log(router.currentPath); // '/users/42?tab=posts'
console.log(router.currentRoute?.params); // { id: '42' }
console.log(window.location.pathname); // '/app/users/42'

// On teardown:
stopLinks();
router.destroy();
```

El router añade su listener de `popstate` (modo history) o `hashchange` (modo hash) en el constructor. No hay que llamar a `start()`.

Con el orquestador, pasa la misma configuración como `router` y navega a través del orquestador:

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { interceptLinks } from '@tuvix.js/router';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Una app sin `activeWhen` sigue las `routes` que la nombran. `orchestrator.getRouter()` devuelve la instancia de `IRouter`.

## API

### `createRouter`

```ts
import type { IRouter, RouterConfig } from '@tuvix.js/router';

declare function createRouter(config: RouterConfig): IRouter;
```

Devuelve `new Router(config)` tipado como `IRouter`.

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | obligatorio | Tabla de rutas. El router comprueba las rutas en el orden del array y gana la primera que coincide. |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` lee `location.pathname + location.search` y escribe con `pushState`. `hash` lee y escribe `#/path`. |
| `base` | `string` | `'/'` | Prefijo de ruta bajo el que se sirve la app, solo en modo history. El router lo quita al leer la URL y lo añade al escribirla. El modo hash lo ignora. |

Cada `RouteConfig`:

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `path` | `string` | obligatorio | Patrón con la sintaxis de `matchPath`, comparado con la ruta completa. `'/'` coincide solo con la página de inicio, `'/*'` coincide con todas las rutas y `'/blog/*'` coincide con `/blog` y todo lo que hay debajo. |
| `app` | `string` | obligatorio | Nombre de la micro app que se activa. |
| `meta` | `Record<string, unknown>` | ninguno | Tus datos. El router los transmite en `MatchedRoute.route.meta`. |

### `Router`

```ts
import { Router } from '@tuvix.js/router';

const router = new Router({ routes: [{ path: '/cart', app: 'cart' }] });
```

La clase que hay detrás de `createRouter`. Implementa `IRouter`:

| Miembro | Firma | Comportamiento |
| --- | --- | --- |
| `currentPath` | `readonly string` | Ruta relativa a la app, sin `base`. En modo history incluye la query string. |
| `currentRoute` | `readonly MatchedRoute \| null` | Resultado de `match(currentPath)`. |
| `push` | `(path: string) => Promise<void>` | Ejecuta los guards, escribe la URL con `history.pushState` (`base + path` en modo history, `#path` en modo hash) y después ejecuta los handlers de `onChange`. |
| `replace` | `(path: string) => Promise<void>` | Igual que `push`, pero con `history.replaceState`. |
| `back` | `() => void` | Llama a `window.history.back()`. |
| `forward` | `() => void` | Llama a `window.history.forward()`. |
| `onChange` | `(handler: RouteChangeHandler) => () => void` | Ejecuta `handler` después de cada navegación completada. Devuelve una función para cancelar la suscripción. |
| `beforeEach` | `(guard: NavigationGuard) => () => void` | Añade un guard. Devuelve una función que lo elimina. |
| `match` | `(path: string) => MatchedRoute \| null` | Primera ruta que coincide con `path`, o `null`. |
| `getActiveApps` | `(path?: string) => string[]` | Nombres de las apps de todas las rutas que coinciden con `path` completo (por defecto, `currentPath`), en el orden de las rutas y sin duplicados. |
| `destroy` | `() => void` | Elimina el listener de window y borra los handlers y los guards. |

Pasa a `push` y `replace` una ruta relativa a `base`. Con `base: '/app'`, `router.push('/x')` escribe `/app/x` y `currentPath` pasa a ser `/x`.

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  base: '/app',
  routes: [
    { path: '/*', app: 'header' },
    { path: '/docs/*', app: 'docs' },
    { path: '/docs/:page', app: 'doc-sidebar' },
  ],
});

router.match('/docs/intro')?.route.app; // 'header' (first match wins)
router.getActiveApps('/docs/intro'); // ['header', 'docs', 'doc-sidebar']
router.getActiveApps('/'); // ['header']
await router.replace('/docs/intro'); // URL: /app/docs/intro, no new history entry
router.back();
```

`match`, `getActiveApps` e `isPathActive` aplican las mismas reglas de ruta completa. Una ruta `'/'` solo está activa en `/`; usa `'/*'` para una app que se muestra en todas las páginas.

#### Guards

Los guards se ejecutan en el orden en que los añadiste, de uno en uno, antes de que cambie la URL. Resolver a `false` cancela la navegación y omite los guards restantes. Cualquier otro valor la deja continuar. Un guard que lanza un error o rechaza cancela la navegación, y el router registra el error con `console.error`.

```ts
import { createRouter } from '@tuvix.js/router';

declare function isAdmin(): Promise<boolean>;

const router = createRouter({
  routes: [{ path: '/admin/*', app: 'admin' }],
});

const removeGuard = router.beforeEach(async ({ to }) => {
  if (to.startsWith('/admin')) return isAdmin();
  return true;
});

removeGuard();
```

Los guards también se ejecutan con los botones de atrás y adelante. Para entonces el navegador ya se ha movido, así que cuando un guard cancela, el router llama a `history.replaceState` para volver a poner la URL anterior (con `base`) en la barra de direcciones. La entrada del historial se queda donde la movió el navegador.

### `matchPath`

```ts
import type { MatchPathOptions, PathMatch } from '@tuvix.js/router';

declare function matchPath(
  pattern: string,
  path: string,
  options?: MatchPathOptions
): PathMatch;
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | `true` exige que un patrón sin `/*` coincida con la ruta completa. `false` también coincide con todas las subrutas. |

Devuelve `{ matched, params }`. Reglas:

- El matcher quita `?query` y `#hash` de `path` e ignora la barra final en ambos lados.
- `:name` captura un segmento no vacío en `params.name`, decodificado como URI. Un valor con una codificación porcentual mal formada se queda tal como está escrito. Un segmento puede mezclar texto y parámetros: `/v:version` coincide con `/v2`.
- Un `/*` final coincide con la ruta base y todo lo que hay debajo: `/docs/*` coincide con `/docs` y `/docs/a/b`. El resto no se captura en `params`.
- Un `*` en mitad de un patrón coincide con un segmento.
- Por defecto, un patrón simple coincide con sus subrutas en un límite de segmento: `/docs` coincide con `/docs/intro` y no coincide con `/docsify`.
- `'/'` coincide por defecto con todas las rutas. Con `{ end: true }` solo coincide con `/`. Las rutas del router siempre usan las reglas de `end: true`; las cadenas de `activeWhen` de core y las `routes` de las apps de `@tuvix.js/server` usan las reglas por prefijo por defecto.
- Los demás caracteres de regex de un patrón coinciden de forma literal. La coincidencia distingue mayúsculas de minúsculas.

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts#bio'); // { matched: true, params: { id: '42' } }
matchPath('/files/:name', '/files/a%20b.txt').params.name; // 'a b.txt'
matchPath('/docs', '/docs/intro').matched; // true
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
matchPath('/docs', '/docsify').matched; // false
matchPath('/', '/anything').matched; // true
matchPath('/a/*/c', '/a/b/c').matched; // true
```

El matcher compila cada patrón una vez y guarda en caché la `RegExp`, así que puedes llamarlo en cada navegación.

### `matchRoute`

```ts
import type { MatchedRoute, RouteConfig } from '@tuvix.js/router';

declare function matchRoute(path: string, routes: RouteConfig[]): MatchedRoute | null;
```

Devuelve la primera ruta cuyo `path` coincide con `path` completo (reglas de `end: true`), con la ruta limpia, los parámetros decodificados y la query parseada. Ignora el `#hash`. `Router.match` la llama.

```ts
import { matchRoute } from '@tuvix.js/router';

matchRoute('/users/42?tab=info', [{ path: '/users/:id', app: 'users' }]);
// { route: { path: '/users/:id', app: 'users' }, path: '/users/42', params: { id: '42' }, query: { tab: 'info' } }
```

### `isPathActive`

```ts
declare function isPathActive(path: string, pattern: string): boolean;
```

`matchPath(pattern, path, { end: true }).matched`: las reglas de ruta completa que usan las rutas del router, así que `'/'` solo está activa en `/`. `Router.getActiveApps` la usa.

```ts
import { isPathActive } from '@tuvix.js/router';

isPathActive('/settings/profile', '/settings'); // false
isPathActive('/settings/profile', '/settings/*'); // true
isPathActive('/settings/profile', '/'); // false
isPathActive('/settings/profile', '/*'); // true
```

### `pathToRegex`

```ts
declare function pathToRegex(pattern: string): { regex: RegExp; paramNames: string[] };
```

Devuelve la `RegExp` compilada de coincidencia completa para un patrón y los nombres de sus parámetros en orden. El objeto `regex` viene de la caché compartida: no cambies su `lastIndex` ni ningún otro estado. La regex se ejecuta sobre una ruta normalizada sin query ni hash; usa `matchPath` cuando la ruta pueda contenerlos.

```ts
import { pathToRegex } from '@tuvix.js/router';

const { regex, paramNames } = pathToRegex('/posts/:slug');
regex.test('/posts/hello'); // true
paramNames; // ['slug']
```

### `parseQuery`

```ts
declare function parseQuery(queryString: string): Record<string, string>;
```

Parsea `a=1&b=2`, con o sin el `?` inicial. Divide cada par por el primer `=`, para que valores como los JWT conserven sus caracteres `=`, decodifica claves y valores, y conserva el texto sin procesar cuando la decodificación falla. Una clave sin `=` se asigna a `''`. Una clave repetida conserva el último valor.

```ts
import { parseQuery } from '@tuvix.js/router';

parseQuery('?token=abc.def=ghi&debug'); // { token: 'abc.def=ghi', debug: '' }
```

### `normalizePath`

```ts
declare function normalizePath(path: string): string;
```

Añade una barra inicial y quita una barra final. No toca la query ni el hash.

```ts
import { normalizePath } from '@tuvix.js/router';

normalizePath('users/42/'); // '/users/42'
```

### `interceptLinks`

```ts
import type { InterceptLinksOptions } from '@tuvix.js/router';

declare function interceptLinks(options: InterceptLinksOptions): () => void;
```

Escucha los clics en los elementos `<a href>` dentro de `root`, llama a `preventDefault()` en los que gestiona y pasa su ruta a `navigate`. Devuelve una función que elimina todos los listeners que añadió.

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | obligatorio | Recibe `pathname + search + hash` sin `base`. La función registra con `console.error` un error lanzado o una promesa rechazada. |
| `root` | `Document \| HTMLElement` | `document` | Elemento en el que está el listener de clics. |
| `base` | `string` | `'/'` | Prefijo de ruta bajo el que se sirve la app. Los enlaces fuera de él quedan para el navegador. La función lo quita antes de llamar a `navigate` y `prefetch`. |
| `shouldIntercept` | `(anchor: HTMLAnchorElement, url: URL, event: MouseEvent) => boolean` | ninguno | Se ejecuta después de las comprobaciones integradas. Devuelve `false` para que el navegador gestione el clic. |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | ninguno | Se ejecuta en `pointerenter` o `focusin` sobre un enlace válido, una vez por `pathname + search`. La ruta no lleva hash. |

`interceptLinks` deja el clic al navegador cuando se cumple cualquiera de estas condiciones:

- Otro handler ya llamó a `preventDefault()`.
- El botón no es el principal, o está pulsada Ctrl, Meta, Shift o Alt.
- El enlace tiene un `target` distinto de `_self`, un atributo `download`, un `rel` que contiene `external` o un atributo `data-tuvix-reload`.
- La URL resuelta tiene un origen distinto al de la página.
- La ruta de la URL está fuera de `base` (`/app` cubre `/app` y `/app/...`, no `/application`).
- El enlace tiene un hash y la misma ruta y query que la página actual. El navegador se desplaza hasta el ancla.
- `shouldIntercept` devuelve `false`.

`prefetch` aplica las comprobaciones de atributos, de origen y de `base`. Ignora las teclas modificadoras y la regla de solo hash, y sí se dispara para un enlace a la página actual.

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/shop/*', app: 'shop' }] });
const nav = document.querySelector('nav') ?? document;

const stop = interceptLinks({
  navigate: (path) => router.push(path),
  root: nav,
  shouldIntercept: (anchor) => !anchor.closest('[data-legacy]'),
  prefetch: (path) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.append(link);
  },
});

stop();
```

`interceptLinks` encuentra el enlace con [`resolveLink`](#resolvelink), así que funcionan los enlaces dentro de shadow roots abiertos y los elementos `<a>` de SVG quedan para el navegador. En un entorno sin `document` ni `window` devuelve una función de limpieza que no hace nada.

### `resolveLink`

```ts
import type { ResolvedLink, ResolveLinkOptions } from '@tuvix.js/router';

declare function resolveLink(
  event: Event,
  options?: ResolveLinkOptions
): ResolvedLink | null;
```

Encuentra el `<a href>` en el que ocurrió un evento y lo devuelve junto con su URL absoluta y su ruta relativa a la app. Devuelve `null` cuando el navegador debe gestionar el enlace. `interceptLinks` y el `prefetch: { strategy: 'hover' }` del orquestador lo usan. Llámalo desde tus propios listeners cuando necesites las mismas reglas de enlaces, por ejemplo para precalentar datos con hover o para registrar la navegación dentro de la app.

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `base` | `string` | `'/'` | Prefijo de ruta bajo el que se sirve la app. Un enlace fuera de él devuelve `null`. La función lo quita de `path`. |

| Campo | Tipo | Significado |
| --- | --- | --- |
| `anchor` | `HTMLAnchorElement` | El elemento `<a>`. |
| `url` | `URL` | URL absoluta del enlace. |
| `path` | `string` | `pathname + search + hash`, sin `base`. |

```ts
import { resolveLink } from '@tuvix.js/router';

const warmed = new Set<string>();

function warmUp(event: Event): void {
  const link = resolveLink(event, { base: '/app' });
  if (!link || warmed.has(link.url.pathname)) return;
  warmed.add(link.url.pathname);
  void fetch(`/api/page-data?path=${encodeURIComponent(link.path)}`);
}

// pointerenter does not bubble, so listen in the capture phase.
document.addEventListener('pointerenter', warmUp, true);
document.addEventListener('focusin', warmUp);
```

`resolveLink` devuelve `null` cuando se cumple cualquiera de estas condiciones:

- El `<a>` más cercano en la ruta del evento es un `<a>` de SVG, o un `<a>` de HTML sin `href`, o no hay ningún `<a>`. La búsqueda se detiene en el primer `<a>` que encuentra.
- El enlace tiene un `target` distinto de `_self`, un atributo `download`, un `rel` que contiene `external` o un atributo `data-tuvix-reload`.
- La URL tiene un origen distinto al de la página.
- La ruta de la URL está fuera de `base` (`/app` cubre `/app` y `/app/...`, no `/application`).
- No hay `window`, como en el servidor.

Lee `event.composedPath()`, así que un listener en `document` encuentra los enlaces dentro de shadow roots abiertos. Los enlaces dentro de shadow roots cerrados quedan ocultos para él. Llámalo mientras se despacha el evento: cuando termina el despacho, la ruta compuesta está vacía y la función recurre a `event.target.closest('a')`, que no puede mirar dentro de un shadow root.

No comprueba el botón del ratón, las teclas modificadoras, `defaultPrevented` ni la regla de solo hash. `interceptLinks` aplica esas comprobaciones encima para los clics.

### Tipos

| Tipo | Significado |
| --- | --- |
| `RouterMode` | `'history' \| 'hash'`. |
| `RouterConfig` | `{ mode?, base?, routes }`, las opciones de `createRouter`. |
| `RouteConfig` | `{ path, app, meta? }`, una ruta. |
| `MatchedRoute` | `{ route, path, params, query }`. `path` es el pathname limpio, `params` los valores decodificados de `:param` y `query` la query string parseada. |
| `NavigationEvent` | `{ from, to, fromRoute, toRoute }`. `from` y `to` son rutas relativas a la app, sin `base`. |
| `NavigationGuard` | `(event: NavigationEvent) => boolean \| Promise<boolean>`. |
| `RouteChangeHandler` | `(event: NavigationEvent) => void`. |
| `IRouter` | Interfaz que implementa `Router` y que devuelve `createRouter`. |
| `PathMatch` | `{ matched: boolean; params: Record<string, string> }`, el resultado de `matchPath`. `params` es `{}` cuando no hay coincidencia. |
| `MatchPathOptions` | `{ end?: boolean }`. |
| `InterceptLinksOptions` | Opciones de `interceptLinks`. |
| `ResolveLinkOptions` | `{ base?: string }`, las opciones de `resolveLink`. |
| `ResolvedLink` | `{ anchor: HTMLAnchorElement; url: URL; path: string }`, el resultado de `resolveLink`. |

## Casos límite

- `push` y `replace` a la ruta en la que ya estás (la misma cadena, query incluida) retornan sin ejecutar guards ni handlers.
- El router no cancela una navegación pendiente cuando empiezas otra. Cada `push` espera a sus propios guards y después escribe la URL, así que gana la última cadena de guards que termine.
- El router se entera de los cambios de URL por sus propios `push`/`replace` y por `popstate`/`hashchange`. Si otro código llama a `history.pushState`, `currentPath` queda desactualizado hasta el siguiente evento o la siguiente navegación del router.
- Después de `destroy()`, `push`, `replace`, `back`, `forward`, `onChange` y `beforeEach` lanzan `[Tuvix Router] Cannot use a destroyed Router. Create a new one.` `match` y `getActiveApps` siguen funcionando.
- El router registra con `console.error` un handler de `onChange` que lanza un error y sigue llamando a los demás handlers.
- Con `base: '/app'`, el router lee `/application` como `/application`: solo quita la base en un límite de segmento. En modo history descarta el `#hash` al leer la URL.
- En el servidor (sin `window`), el constructor fija `currentPath` en `'/'` y no añade ningún listener. `push`, `replace`, `back` y `forward` necesitan `window`.
- `matchPath` con un patrón `/*` coincide con la propia ruta base: `/dashboard/*` coincide con `/dashboard`.
- Un evento sobre un `<a>` dentro de un `<svg>` se resuelve a `null`, incluso cuando un `<a>` de HTML envuelve el SVG. `interceptLinks` y la precarga por hover del orquestador dejan ese enlace al navegador, que carga la página completa.

## Lo que no hace

- No monta ni desmonta micro apps. Informa de coincidencias y cambios; el orquestador de `@tuvix.js/core` actúa sobre ellos.
- No intercepta los clics en enlaces salvo que llames a `interceptLinks`.
- No tiene rutas anidadas, rutas con nombre, redirecciones ni guards por ruta. Usa `beforeEach` y comprueba `to` o `toRoute`.
- No captura en `params` el resto `/*` de una ruta.
- No restaura la posición de scroll.

## Migrar desde 0.4

`push()` y `replace()` ahora anteponen `base`. Pasa rutas relativas a `base`:

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ base: '/app', routes: [] });

// 0.4: router.push('/app/x') wrote /app/x, router.push('/x') wrote /x
// 0.5: router.push('/x') writes /app/x
await router.push('/x');
```

Otros cambios incompatibles:

- `base` solo se quita en un límite de segmento: `/application` ya no se lee como `/lication`.
- Las rutas coinciden con la ruta completa en `match`, `getActiveApps` e `isPathActive`. En 0.4, `getActiveApps` e `isPathActive` trataban una ruta `'/'` como activa en todas las rutas. Cambia un comodín `{ path: '/', app }` por `{ path: '/*', app }`.
- `RouteConfig.exact` se ha eliminado. Se aceptaba y se ignoraba; bórralo de tus objetos de ruta.
- `pathToRegex(pattern)` perdió su segundo argumento `exact` y devuelve una `RegExp` en caché.
- Los caracteres de regex de los patrones coinciden de forma literal, y un `*` en mitad de un patrón coincide con un segmento.
- `matchRoute()` e `isPathActive()` ignoran un `#hash` en la ruta.
- La documentación de 0.4 listaba `navigate`, `go` y `onRouteChange`, una opción `orchestrator` del router y un `guard` por ruta. Nada de eso existe. Usa `push`, `back`/`forward`, `onChange`, la configuración `router` del orquestador y `beforeEach`.

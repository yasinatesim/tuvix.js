# @tuvix.js/router

> Enrutamiento history y hash para micro apps, el matcher compartido `matchPath` e intercepción de enlaces

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentación completa: [tuvix.js.org/packages/router](https://tuvix.js.org/packages/router).

El router asigna rutas de URL a nombres de micro apps y te avisa cuando cambia la ruta. `matchPath` es el matcher de patrones que también usan `activeWhen` de core y `@tuvix.js/server`. Si tu shell ya usa React Router o TanStack Router, conéctalo con `orchestrator.connectRouter()` de `@tuvix.js/core`.

## Instalación

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

## Inicio rápido

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

const stopLinks = interceptLinks({ navigate: (path) => router.push(path), base: '/app' });

await router.push('/users/42'); // URL: /app/users/42, currentPath: '/users/42'

stopLinks();
router.destroy();
```

El constructor añade el listener de `popstate` o `hashchange`. No hay que llamar a `start()`.

## API

### `createRouter(config)` y `Router`

`createRouter(config)` devuelve `new Router(config)` con el tipo `IRouter`.

| Opción | Tipo | Por defecto | Significado |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | obligatorio | `{ path, app, meta? }`. Se comprueban en orden y gana la primera coincidencia. Las rutas coinciden con la ruta completa: `'/'` es solo la página de inicio, `'/*'` es cualquier ruta y `'/blog/*'` es `/blog` y lo que cuelga de él. |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` usa `pushState` y `location.pathname + search`. `hash` usa `#/path`. |
| `base` | `string` | `'/'` | Prefijo en modo history. Se quita al leer (solo en un límite de segmento) y se añade al escribir. |

| Miembro | Comportamiento |
| --- | --- |
| `currentPath`, `currentRoute` | Ruta relativa a la app (con la query incluida en modo history) y su `MatchedRoute \| null`. |
| `push(path)`, `replace(path)` | `Promise<void>`. Ejecutan los guards, escriben `base + path` (o `#path`) y ejecutan los handlers de `onChange`. Con la misma ruta no hacen nada. |
| `back()`, `forward()` | `window.history.back()` / `forward()`. |
| `onChange(handler)` | Se ejecuta después de cada navegación completada. Devuelve una función para cancelar la suscripción. |
| `beforeEach(guard)` | Los guards se ejecutan en orden. `false`, una excepción o un rechazo cancelan. En atrás/adelante, el router restaura la URL anterior con `replaceState`. Devuelve una función para quitarlo. |
| `match(path)` | Primera ruta que coincide o `null`. |
| `getActiveApps(path?)` | Apps de todas las rutas que coinciden con la ruta completa, sin duplicados. Una ruta `'/'` solo está activa en `/`; usa `'/*'` para todas las páginas. |
| `destroy()` | Quita los listeners. Después, `push`, `replace`, `back`, `forward`, `onChange` y `beforeEach` lanzan un error. |

### `matchPath(pattern, path, options?)`

Devuelve `{ matched, params }`.

| Opción | Tipo | Por defecto | Significado |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | Exige que un patrón sin `/*` coincida con la ruta completa. |

- Descarta `?query` y `#hash`, e ignora una barra final.
- `:name` captura un segmento, decodificado como URI. Un `/*` final coincide con la ruta base y con todo lo que cuelga de ella; el resto no se captura. Un `*` intermedio coincide con un segmento.
- Por defecto, `/docs` coincide con `/docs/intro` pero no con `/docsify`, y `'/'` coincide con cualquier ruta. Con `{ end: true }`, `'/'` solo coincide con `/`. Las rutas del router usan las reglas de `end: true`; `activeWhen` de core y las rutas de `@tuvix.js/server` usan el prefijo por defecto.
- Los patrones compilados se guardan en caché. La coincidencia distingue mayúsculas y minúsculas.

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
```

### Helpers

| Export | Comportamiento |
| --- | --- |
| `matchRoute(path, routes)` | Primera coincidencia completa como `{ route, path, params, query }`, o `null`. Ignora `#hash`. |
| `isPathActive(path, pattern)` | `matchPath(pattern, path, { end: true }).matched`, las reglas de ruta completa que usan las rutas. |
| `pathToRegex(pattern)` | `{ regex, paramNames }` de coincidencia completa, en caché. No modifiques `regex`. |
| `parseQuery(query)` | De `'?a=1&b'` a `{ a: '1', b: '' }`. Divide en el primer `=`, decodifica y conserva el texto original si la codificación es incorrecta. |
| `normalizePath(path)` | Añade una barra inicial y quita una barra final. |

### `interceptLinks(options)`

Convierte los clics en `<a href>` del mismo origen en llamadas a `navigate(path)`. Devuelve una función de limpieza.

| Opción | Tipo | Por defecto | Significado |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | obligatorio | Recibe `pathname + search + hash` sin `base`. Los errores se registran en la consola. |
| `root` | `Document \| HTMLElement` | `document` | Dónde se coloca el listener de clics. |
| `base` | `string` | `'/'` | Los enlaces fuera de él van al navegador; se quita antes de `navigate`/`prefetch`. |
| `shouldIntercept` | `(anchor, url, event) => boolean` | ninguno | Devuelve `false` para que el navegador gestione el clic. Se ejecuta después de las comprobaciones integradas. |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | ninguno | En `pointerenter` o `focusin`, una vez por `pathname + search`. |

El navegador conserva el clic cuando: otro handler llamó a `preventDefault()`; se usa un botón que no es el principal o Ctrl/Meta/Shift/Alt; `target` es distinto de `_self`; hay `download`; `rel` contiene `external`; hay `data-tuvix-reload`; el origen es otro; la ruta está fuera de `base`; es un enlace hash a la ruta y query actuales; o `shouldIntercept` devuelve `false`. Los enlaces dentro de shadow roots abiertos se gestionan; los elementos `<a>` de SVG se dejan al navegador.

### `resolveLink(event, options?)`

Devuelve `{ anchor, url, path }` para el `<a href>` HTML sobre el que ocurrió un evento, o `null` cuando el navegador debe gestionar el enlace. `path` es `pathname + search + hash` sin `base`. `interceptLinks` y la precarga al pasar el puntero del orquestador lo usan; llámalo desde tus propios listeners para aplicar las mismas reglas.

```ts
import { resolveLink } from '@tuvix.js/router';

document.addEventListener('focusin', (event) => {
  const link = resolveLink(event, { base: '/app' });
  if (link) console.log('next page might be', link.path);
});
```

Devuelve `null` para: un `<a>` de SVG, un `<a>` sin `href` o la ausencia de `<a>` (decide el `<a>` más cercano en la ruta del evento); `target` distinto de `_self`; `download`; `rel` que contiene `external`; `data-tuvix-reload`; otro origen; una ruta fuera de `base`; la ausencia de `window`. Lee `event.composedPath()`, así que encuentra enlaces en shadow roots abiertos, no en los cerrados. Llámalo durante el despacho del evento. No comprueba botones, teclas modificadoras ni enlaces solo de hash.

### Tipos

`RouterMode`, `RouterConfig`, `RouteConfig`, `MatchedRoute`, `NavigationEvent` (`{ from, to, fromRoute, toRoute }`, rutas sin `base`), `NavigationGuard`, `RouteChangeHandler`, `IRouter`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolveLinkOptions` (`{ base? }`), `ResolvedLink` (`{ anchor, url, path }`).

## Casos límite

- El router no cancela una navegación pendiente cuando empieza otra; la última cadena de guards en terminar escribe la URL.
- Si otro código llama a `history.pushState`, `currentPath` queda desactualizado hasta el siguiente `popstate`, `hashchange` o navegación del router.
- En el servidor, el constructor asigna `'/'` a `currentPath` y no añade nada. Los métodos de navegación necesitan `window`.
- Un guard que cancela una navegación atrás/adelante corrige la barra de direcciones; la posición en el historial se queda donde la movió el navegador.

## Lo que no hace

- No monta apps. Lo hace el orquestador de `@tuvix.js/core`, usando la configuración `router` o `connectRouter`.
- No intercepta enlaces salvo que llames a `interceptLinks`.
- No hay rutas anidadas, redirecciones, guards por ruta ni restauración del scroll.

## Migrar desde 0.4

- `push()`/`replace()` añaden el prefijo `base`: con `base: '/app'`, `push('/x')` escribe `/app/x`. Pasa rutas relativas a `base`.
- `base` solo se quita en un límite de segmento.
- Las rutas coinciden con la ruta completa en `match`, `getActiveApps` e `isPathActive`; una ruta `'/'` solo está activa en `/`. Usa `'/*'` para capturar todo.
- Se elimina `RouteConfig.exact` (se ignoraba).
- `pathToRegex(pattern)` pierde su argumento `exact` y devuelve un `RegExp` en caché.
- Los caracteres de regex en los patrones coinciden de forma literal; un `*` intermedio coincide con un segmento.
- `matchRoute()` e `isPathActive()` ignoran `#hash`.

## Licencia

MIT

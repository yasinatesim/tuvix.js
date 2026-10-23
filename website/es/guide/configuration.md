# Configuración

Toda la configuración se hace en código. Tuvix.js no lee variables de entorno ni archivos de configuración.

## Opciones del orquestador

```ts
import { createOrchestrator } from 'tuvix.js';

declare function reportError(error: Error, app: string): void;

const orchestrator = createOrchestrator({
  // Built-in router. Omit it when you follow an external router with connectRouter().
  router: {
    mode: 'history', // or 'hash'
    base: '/',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },

  // Passing eventBus options gives this orchestrator a private bus.
  // Omit it to share getGlobalBus() with every app on the page.
  eventBus: { maxListeners: 50, debug: false },

  // Forwarded to the module loader.
  loader: { timeout: 10000, retries: 2, retryDelay: 1000, globals: {} },

  // 'immediate' | 'idle' | 'hover' | 'none' (default)
  prefetch: { strategy: 'hover' },

  onError: (error, appName) => reportError(error, appName),
  onStatusChange: (appName, status) => console.debug(appName, status),
});
```

| Opción | Valor por defecto | Efecto |
| --- | --- | --- |
| `router` | ninguno | Crea el router integrado. Consulta [Enrutamiento](/es/guide/routing). |
| `eventBus` | ninguno (bus global) | Bus privado con estas opciones. `destroy()` destruye un bus privado y deja vivo el global. |
| `loader.timeout` | `10000` | Milisegundos antes de que se aborte un intento de carga. También limita la espera de las hojas de estilo con sandbox. |
| `loader.retries` | `2` | Intentos adicionales tras el primer fallo. |
| `loader.retryDelay` | `1000` | Milisegundos entre intentos. |
| `loader.globals` | `{}` | Propiedades que se escriben en `window` antes de que se ejecuten los scripts de un entry. |
| `prefetch.strategy` | `'none'` | Cuándo descargar los entries antes de montarlos. Consulta la tabla de abajo. |
| `onError` | ninguno | Se llama con `(error, appName)` cuando falla la carga, bootstrap, mount, update o unmount. |
| `onStatusChange` | ninguno | Se llama con `(appName, status)` en cada cambio de estado. |

Para compartir dependencias como React entre apps, usa `@tuvix.js/module-federation` o import maps. El orquestador no tiene ninguna opción para ello.

### Estrategias de precarga

| Estrategia | Cuándo se descargan los entries |
| --- | --- |
| `none` | Solo cuando una app se monta. |
| `immediate` | Todos los entries registrados, justo después de `start()`. |
| `idle` | Todos los entries registrados, en el primer `requestIdleCallback` después de `start()` (timeout de 200 ms donde falta la API). |
| `hover` | Cuando el puntero entra en un enlace del mismo origen, o el foco cae en él, y su ruta activaría una app. Cada app se descarga una vez. |

La precarga añade `<link rel="modulepreload">` para los scripts de módulo y `<link rel="prefetch">` para los scripts clásicos y los estilos. Omite los entries que son funciones loader, porque llamar a la función ejecutaría el módulo.

## Registrar una micro app

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main',
  activeWhen: '/dashboard/*',
  props: { theme: 'dark' },
  fallback: '<p>Dashboard is unavailable.</p>',
  sandbox: false,
  mountWhenVisible: false,
});
```

| Campo | Tipo | Efecto |
| --- | --- | --- |
| `name` | `string` | Único. Debe coincidir con el nombre con el que se registra el módulo. |
| `entry` | `string \| EntryConfig \| EntryLoader` | De dónde viene el código. Consulta más abajo. |
| `container` | `string \| HTMLElement` | Selector o elemento. Se resuelve al montar, así que el elemento solo tiene que existir en ese momento. |
| `activeWhen` | `string \| (path) => boolean` | Patrón de ruta o predicado. Sin él, la app sigue las `routes` del router que la nombran, o la montas tú. |
| `props` | `Record<string, unknown>` | Props iniciales. `updateAppProps` fusiona sobre ellas. |
| `fallback` | `string` | HTML que se escribe en el contenedor cuando falla la carga, bootstrap o mount. |
| `sandbox` | `boolean \| { css?: boolean }` | `true` renderiza la app en un shadow root. Consulta [Sandboxing](/es/guide/sandbox). |
| `mountWhenVisible` | `boolean` | Monta la app en cuanto el contenedor es visible al 10%. A partir de ahí, los cambios de ruta no la afectan. |

### Formas de entry

```ts
import type { Entry } from 'tuvix.js';

// One classic script (UMD or IIFE bundle).
const classic: Entry = 'https://cdn.example.com/legacy/app.js';

// Scripts and styles. `type: 'module'` for ES module bundles such as Vite's `.js` output.
const esm: Entry = {
  scripts: ['https://cdn.example.com/cart/main.js'],
  styles: ['https://cdn.example.com/cart/main.css'],
  type: 'module',
  integrity: { 'https://cdn.example.com/cart/main.js': 'sha384-...' },
};

// A loader function. Your bundler code-splits it; the loader passes an AbortSignal.
const lazy: Entry = () => import('./apps/profile');
```

Sin `type`, las URLs que terminan en `.mjs`, `.mts`, `.ts`, `.tsx` o `.jsx` se cargan como módulos y todo lo demás se carga como script clásico. Un navegador ejecuta un script de módulo una vez por URL, así que una app con `type: 'module'` que descargas no puede volver a cargarse desde la misma URL. Usa una función loader cuando necesites descargarla y volver a cargarla.

### Qué debes saber sobre el registro

- `register` lanza un error si el nombre está duplicado, si falta `entry` o si falta `container`.
- `register` después de `start()` tiene efecto de inmediato: una app gestionada por rutas se monta si la ruta actual la activa, y una app con `mountWhenVisible` empieza a observarse. Antes de `start()`, `register` solo guarda la configuración.
- Una app de viewport sigue montada después de salir de la vista al hacer scroll. Desmóntala con `unmountApp(name)`.
- Una app sin `activeWhen` ni ruta del router se queda como la dejes. Llama tú a `mountApp(name)` y `unmountApp(name)`.
- `fallback` es HTML sin procesar. No lo construyas a partir de entrada del usuario.

## Opciones del router

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // 'hash' reads the path from location.hash
  base: '/app', // stripped before matching, added by push() and replace()
  routes: [
    { path: '/users/:id', app: 'users', meta: { title: 'User' } },
    { path: '/settings/*', app: 'settings' },
  ],
});

router.beforeEach(async ({ to }) => !to.startsWith('/admin'));
```

Las rutas coinciden con la ruta completa, así que `/settings` coincide solo con `/settings` y `/settings/`, y `'/'` coincide solo con `/`. Termina una ruta con `/*` para que coincida con sus subrutas; `'/*'` coincide con cualquier ruta.

## Opciones del sandbox

```ts
import { createSandbox } from 'tuvix.js';

const sandbox = createSandbox({
  css: true, // shadow root on activate()
  js: true, // proxy window for execScript()
  allowedGlobals: ['gtag'], // extra globals strict mode lets you write
  strict: false, // true: writing any other global throws a TypeError
});
```

El orquestador aplica aislamiento de CSS a las apps registradas con `sandbox: true`. Nunca aplica `JsSandbox`. Consulta [Sandboxing](/es/guide/sandbox).

## Opciones del event bus

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus({
  maxListeners: 0, // 0 = unlimited; past the limit, `on` still adds the listener and warns once per event
  debug: false, // log every emit and subscription
  logger: console.log,
});
```

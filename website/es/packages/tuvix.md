---
title: 'tuvix.js'
---

<PackageHeader
  name="tuvix.js"
  title="tuvix.js (paquete paraguas)"
  description="Un paquete, una ruta de importación. Reexporta el orquestador de @tuvix.js/core y las APIs públicas de @tuvix.js/router, @tuvix.js/event-bus, @tuvix.js/loader y @tuvix.js/sandbox."
  icon="🎁"
  github="tuvix"
/>

## Instalación

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

Instalar `tuvix.js` instala `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` y `@tuvix.js/sandbox`. Los seis paquetes incluyen builds de ES module y CommonJS y declaran `"sideEffects": false`.

## Cuándo usarlo

Instala `tuvix.js` en una aplicación shell que usa el orquestador junto con el router, el event bus o el sandbox. Tienes una sola dependencia que versionar y una sola ruta de importación, y tu bundler descarta los exports que nunca importas.

Instala en su lugar los paquetes con scope cuando:

- Una micro app solo se comunica con la shell. `@tuvix.js/event-bus` por sí solo le da `getGlobalBus()`, sin meter el orquestador en su `node_modules`.
- Necesitas un export que el paquete paraguas deja fuera, como `registerModule` o `emitLifecycle` de `@tuvix.js/loader`, o `pathToRegex` de `@tuvix.js/router`. Consulta [No incluido](#not-included).
- Quieres que tu `package.json` indique de qué partes de Tuvix.js depende un paquete.

Combinar ambos es seguro. El paquete paraguas reexporta los mismos módulos, así que `getGlobalBus` de `tuvix.js` y de `@tuvix.js/event-bus` devuelven el mismo bus, y los helpers de ciclo de vida comparten un registro en `window`.

## Inicio rápido

Una shell que monta `about` en `/about`, convierte los clics en enlaces en navegaciones del router y registra los errores de las apps:

```ts
import { createOrchestrator, getGlobalBus, interceptLinks, OrchestratorEvent, type AppErrorEvent } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

orchestrator.register({
  name: 'about',
  entry: 'https://cdn.example.com/about/main.js',
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

La app `about`, compilada en `https://cdn.example.com/about/main.js`:

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Al hacer clic en `<a href="/about?ref=nav">` se añade `/about?ref=nav` al historial, y el orquestador monta `about` en `#main` (la query string no afecta a la coincidencia).

## API

Todos los exports siguientes son reexportaciones. La página del paquete enlazado documenta su firma, sus opciones y sus casos límite.

### Desde `@tuvix.js/core`

Documentación: [`@tuvix.js/core`](/es/packages/core).

| Export | Tipo | Qué hace |
| --- | --- | --- |
| `createOrchestrator` | función | Crea un `Orchestrator`. |
| `Orchestrator` | clase | Registra apps, las reconcilia con la URL, sigue a un router (`connectRouter`), actualiza props y destruye. |
| `defineMicroApp` | función | Valida un objeto `{ name, bootstrap?, mount, unmount, update?, ssr? }`, lo registra para el loader y hace que emita `tuvix:mounted` / `tuvix:unmounted` / `tuvix:error`. |
| `OrchestratorEvent` | enum | Nombres de los eventos que el orquestador emite en su bus (`tuvix:app:mount`, `tuvix:app:error`, ...). |
| `OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition` | tipo | Argumentos de `createOrchestrator`, `register` y `defineMicroApp`. |
| `AppStatus`, `AppSandboxOption`, `RouterSource`, `RegisteredApp` | tipo | Unión de estados de una app, la opción `sandbox`, el argumento de `connectRouter` y la forma del registro de una app. |
| `AppErrorEvent`, `AppErrorPhase` | tipo | Payload de `APP_ERROR` `{ name, error, phase }` y su unión de fases (`'load'`, `'bootstrap'`, `'mount'`, `'update'`, `'unmount'`). |

### Desde `@tuvix.js/event-bus`

Documentación: [`@tuvix.js/event-bus`](/es/packages/event-bus).

| Export | Tipo | Qué hace |
| --- | --- | --- |
| `EventBus` | clase | Bus pub/sub con `on`, `once`, `emit`, `off`, `onAny`. |
| `createEventBus` | función | Crea un `EventBus` nuevo e independiente. |
| `getGlobalBus` | función | Devuelve el bus de toda la página guardado en `window.__TUVIX_GLOBAL_BUS__`. El orquestador lo usa por defecto. |
| `resetGlobalBus` | función | Destruye el bus de toda la página; el siguiente `getGlobalBus()` crea uno nuevo. |
| `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` | tipo | Interfaz del bus, firmas de los handlers, función para cancelar la suscripción y opciones del constructor. |

### Desde `@tuvix.js/router`

Documentación: [`@tuvix.js/router`](/es/packages/router).

| Export | Tipo | Qué hace |
| --- | --- | --- |
| `Router` | clase | Router de history o hash que asocia rutas a nombres de apps. |
| `createRouter` | función | Crea un `Router`. |
| `matchPath` | función | Compara una ruta con un patrón (`:param`, `/*`; ignora la query y el hash). Las cadenas de `activeWhen` lo usan. |
| `matchRoute` | función | Devuelve la primera ruta de un `RouteConfig[]` que coincide por completo con una ruta, con `params` y `query`. |
| `normalizePath` | función | Añade una barra inicial y elimina la final. |
| `interceptLinks` | función | Convierte los clics en enlaces del mismo origen en una llamada a `navigate(path)`, con precarga opcional por intención. |
| `resolveLink` | función | Devuelve `{ anchor, url, path }` para el enlace HTML en el que ocurrió un evento, o `null` cuando el navegador debe gestionarlo. |
| `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute` | tipo | Interfaz del router, opciones y formas de las rutas. |
| `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler` | tipo | Payload de navegación y firmas del guard y del listener. |
| `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` | tipo | Resultado y opciones de `matchPath`, opciones de `interceptLinks`, resultado y opciones de `resolveLink`. |

### Desde `@tuvix.js/loader`

Documentación: [`@tuvix.js/loader`](/es/packages/loader).

| Export | Tipo | Qué hace |
| --- | --- | --- |
| `ModuleLoader` | clase | Carga una entry (URL, configuración de scripts y estilos o función loader) con timeout, reintentos y caché. |
| `createLoader` | función | Crea un `ModuleLoader`. |
| `whenMounted` | función | Resuelve cuando una app emite su evento de ciclo de vida `mounted`. |
| `onLifecycle` | función | Escucha los eventos del DOM `tuvix:mounted`, `tuvix:unmounted` o `tuvix:error`. |
| `isMounted` | función | `true` mientras algún contenedor de la app esté montado, según los eventos de ciclo de vida. |
| `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext` | tipo | Formatos de entry y el contrato de ciclo de vida que implementa una micro app. |
| `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy` | tipo | Opciones y resultados del loader. |
| `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` | tipo | Nombres de los eventos de ciclo de vida, payload y tipo de evento del DOM. |

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

const off = onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer', { signal: AbortSignal.timeout(5000) });
console.log(container.id, hydrated);
off();
```

### Desde `@tuvix.js/sandbox`

Documentación: [`@tuvix.js/sandbox`](/es/packages/sandbox).

| Export | Tipo | Qué hace |
| --- | --- | --- |
| `CssSandbox` | clase | Mueve un contenedor a un shadow root y carga hojas de estilos dentro de él. El orquestador lo usa para `sandbox: true`. |
| `JsSandbox` | clase | `window` Proxy que mantiene los globals que escribe un script fuera del `window` real. |
| `Sandbox` | clase | `CssSandbox` y `JsSandbox` detrás de un único par `activate` / `deactivate`. |
| `createSandbox` | función | Crea un `Sandbox`. |
| `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox` | tipo | Opciones e interfaces de los sandboxes. |
| `AdoptStylesOptions`, `AdoptedStyles` | tipo | Argumento y valor de retorno de `CssSandbox.adoptStyles`. |

### No incluido {#not-included}

El paquete paraguas deja fuera lo siguiente. Instala el paquete que lo proporciona.

| Necesitas | Instala |
| --- | --- |
| `registerModule`, `unregisterModule`, `getRegisteredModule`, `emitLifecycle`, `hasServerMarkup`, `normalizeEntry`, `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource`, y los tipos `EntryLoader`, `EntryLoaderContext`, `MicroAppBus`, `ScriptType`, `CacheEntry`, `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions` | [`@tuvix.js/loader`](/es/packages/loader) |
| `pathToRegex`, `parseQuery`, `isPathActive` | [`@tuvix.js/router`](/es/packages/router) |
| Micro apps de React, Vue, Svelte o Angular | [`@tuvix.js/react`](/es/packages/react), [`@tuvix.js/vue`](/es/packages/vue), [`@tuvix.js/svelte`](/es/packages/svelte), [`@tuvix.js/angular`](/es/packages/angular) |
| Composición en el servidor | [`@tuvix.js/server`](/es/packages/server) |
| Remotes de Module Federation | [`@tuvix.js/module-federation`](/es/packages/module-federation) |
| Assets de islas en builds de Vite | [`@tuvix.js/vite`](/es/packages/vite) |
| El panel de DevTools | [`@tuvix.js/devtools`](/es/packages/devtools) |
| Scaffolding de proyectos | [`create-tuvix-app`](/es/packages/create-tuvix-app) |

## Casos límite

- `tuvix.js` tiene un único punto de entrada. Los imports de subrutas como `tuvix.js/core` o `tuvix.js/router` no se resuelven; importa desde `tuvix.js` o desde el paquete con scope.
- El paquete paraguas fija sus dependencias a la misma versión. Instalar `tuvix.js` junto a otra versión de un paquete con scope te deja dos copias de ese paquete. `getGlobalBus()` y el registro de ciclo de vida siguen compartiendo estado a través de `window`, pero las comprobaciones `instanceof Orchestrator` o `instanceof EventBus` fallan entre copias.
- `whenMounted`, `onLifecycle` e `isMounted` reaccionan a los eventos del DOM `tuvix:*`. Los módulos de `defineMicroApp` y los adaptadores de frameworks los emiten; un módulo escrito a mano no emite ninguno salvo que llame a `emitLifecycle` de `@tuvix.js/loader`. Los eventos de un contenedor que está fuera del documento se despachan en `document`.
- `resetGlobalBus()` destruye el bus que tiene un orquestador en ejecución. El orquestador conserva ese bus destruido, así que sus eventos ya no llegan a los suscriptores del siguiente `getGlobalBus()`. Llámalo entre tests, después de `orchestrator.destroy()`.
- Los cambios de comportamiento y los cambios incompatibles de `@tuvix.js/core` y `@tuvix.js/router` se aplican aquí sin cambios. Consulta [Migrar desde 0.4](/es/packages/core#migrating-from-0-4).

## Lo que no hace

- No añade código propio. Cada export viene de uno de los cinco paquetes con scope.
- No incluye los adaptadores de frameworks, el paquete de servidor, Module Federation, Vite ni DevTools.
- No ofrece entradas de subruta por paquete.

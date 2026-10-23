# @tuvix.js/core

> Orquestador que carga micro apps y las monta o desmonta a medida que cambia la URL.

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

Documentación completa: [tuvix.js.org/packages/core](https://tuvix.js.org/packages/core)

## Instalación

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

Depende de `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` y `@tuvix.js/sandbox`.

## Inicio rápido

Shell:

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/settings/*', app: 'settings' }] },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

orchestrator.register({
  name: 'settings',
  entry: { scripts: ['/settings/main.js'], styles: ['/settings/main.css'] },
  container: '#main',
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

App remota (`dashboard/main.js`):

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## Cómo se activan las apps

- `activeWhen: '/path'`: se compara con `matchPath` de `@tuvix.js/router`. Se ignoran la query y el hash; `'/dashboard'` y `'/dashboard/*'` coinciden con `/dashboard` y con cada subruta (no con `/dashboards`), `:id` coincide con un segmento y `'/'` coincide con todas las rutas.
- `activeWhen: (path) => boolean`: tu función decide.
- Sin `activeWhen`, con nombre en `router.routes`: activa mientras una ruta con `app: name` coincida por completo. Una ruta `'/'` significa solo la página de inicio; `'/*'` significa todas las rutas.
- Ninguna de las dos: tú llamas a `mountApp` / `unmountApp`; las reconciliaciones no tocan la app.
- `mountWhenVisible: true`: se monta cuando el contenedor es visible al 10 %; se ignora `activeWhen`.

La ruta actual viene de `getPath()` de `connectRouter`; si no, del router integrado; si no, de `window.location.pathname`. Las reconciliaciones se ejecutan una a una: primero se desmontan las apps inactivas y después se montan las activas. Las navegaciones en cola se reducen a la ruta más reciente. Una app que pasa a estar inactiva mientras carga se salta su montaje; una que pasa a estar inactiva a mitad del montaje se desmonta cuando el montaje termina.

## API

### `createOrchestrator(config?)` / `new Orchestrator(config?)`

| Opción | Tipo | Por defecto | Significado |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | ninguno | Router integrado: `mode` (`'history'` por defecto o `'hash'`), `base`, `routes` (obligatorio). |
| `eventBus` | `EventBusOptions` | ninguno | Opciones de un bus privado. Si se omite, el orquestador usa `getGlobalBus()`. |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | Se pasan al module loader, además de `globals`. |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | `immediate` en `start()`, `idle` en el primer periodo de inactividad, `hover` cuando un enlace del mismo origen que activa una app recibe el puntero o el foco. |
| `onError` | `(error: Error, appName: string) => void` | ninguno | Fallos de carga, bootstrap, montaje, actualización y desmontaje. |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | ninguno | Cada cambio de estado. |

### Métodos de `Orchestrator`

| Método | Comportamiento |
| --- | --- |
| `register(appConfig: MicroAppConfig): void` | Guarda la configuración. No carga, no monta ni reconcilia. |
| `unregister(name): Promise<void>` | Desmonta, elimina las etiquetas de la entrada y el módulo en caché, y olvida la app. |
| `start(): Promise<void>` | Sigue al router, reconcilia, inicia la precarga y la observación del viewport. Emite `STARTED`. |
| `mountApp(name): Promise<void>` | Espera a un desmontaje en curso y monta. Rechaza con el error después de renderizar `fallback`. |
| `unmountApp(name): Promise<void>` | Espera a una carga o un montaje en curso y desmonta. |
| `updateAppProps(name, props): Promise<void>` | Combina las props de forma superficial. Llama a `update({ props, container })` en una app montada; si no, las guarda para el siguiente montaje. |
| `reconcile(path?): Promise<void>` | Pone en cola una reconciliación contra `path` o la ruta actual. |
| `connectRouter({ subscribe, getPath }): () => void` | Sigue a un router externo. Devuelve `disconnect`. |
| `navigateTo(path): Promise<void>` | `push(path)` en el router integrado. Lanza `[Tuvix] No router configured.` si no hay ninguno. |
| `getAppStatus(name): AppStatus \| null` | Estado, o `null` para nombres desconocidos. |
| `getRegisteredApps(): string[]` | Nombres registrados. |
| `getMountedApps(): string[]` | Nombres con estado `'mounted'`. |
| `getEventBus(): IEventBus` | `getGlobalBus()` o el bus privado. |
| `getRouter(): IRouter \| null` | Router integrado o `null`. |
| `destroy(): Promise<void>` | Espera a una reconciliación en curso, desmonta todas las apps, deja de escuchar y emite `DESTROYED`. Deja vivo el bus global. |

Opciones de `register`:

| Opción | Tipo | Por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Único; la app remota se registra con el mismo nombre. |
| `entry` | `Entry` | obligatorio | URL, `{ scripts, styles?, type?, integrity? }` o `() => import('./app')`. |
| `container` | `string \| HTMLElement` | obligatorio | Selector (se resuelve en cada montaje) o elemento. |
| `activeWhen` | `string \| ((path: string) => boolean)` | ninguno | Regla de activación. |
| `props` | `Record<string, unknown>` | ninguno | Se pasan a `mount()`. |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | Renderiza dentro de un shadow root con los `styles` de la entrada cargados ahí. |
| `fallback` | `string` | ninguno | HTML que se asigna con `innerHTML` ante un fallo de carga, bootstrap o montaje. |
| `mountWhenVisible` | `boolean` | `false` | Monta cuando es visible el 10 % en el viewport. |

`connectRouter` con TanStack Router:

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
// later: disconnect();
```

### `defineMicroApp(definition): MicroAppModule`

| Opción | Tipo | Por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Debe ser igual al nombre registrado. |
| `bootstrap` | `() => void \| Promise<void>` | ninguno | Se ejecuta antes del primer montaje. Un bootstrap fallido se vuelve a ejecutar en el siguiente montaje; uno correcto se ejecuta una sola vez. |
| `mount` | `(context: MountContext) => void \| Promise<void>` | obligatorio | Recibe `container`, `props`, `name` y `bus`. |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | obligatorio | Recibe `container`. |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | ninguno | Recibe `props` y `container`. |
| `ssr` | `boolean` | `false` | `mount` adopta el markup del servidor; el evento `mounted` informa `hydrated: true` cuando el contenedor tenía markup. |

Publica el módulo con `registerModule` de `@tuvix.js/loader` y lo devuelve. El módulo despacha los eventos DOM `tuvix:mounted`, `tuvix:unmounted` y `tuvix:error` (que burbujean hasta `document`), así que `whenMounted`, `isMounted` y `onLifecycle` funcionan con él. Un `unmount` durante un `mount` en curso sobre el mismo contenedor lo espera. Lanza un error si falta `name`, `mount` o `unmount`.

### `OrchestratorEvent`

Eventos en el bus del orquestador: `APP_REGISTERED` (`tuvix:app:registered`), `APP_BOOTSTRAP`, `APP_MOUNT`, `APP_UNMOUNT`, `APP_ERROR` (`AppErrorEvent`: `{ name, error, phase }` para fallos de `'load'`, `'bootstrap'`, `'mount'`, `'update'` o `'unmount'`), `APP_STATUS_CHANGE` (`{ name, status }`), `ROUTE_CHANGE` (solo router integrado), `STARTED`, `DESTROYED`.

```ts
import { getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

### Aislamiento de CSS

`sandbox: true` o `{ css: true }` adjunta un shadow root abierto al contenedor (se reutiliza al volver a montar), monta la app en un `<div data-tuvix-sandbox-root>` dentro de él y carga ahí los `styles` de la entrada. El montaje espera a las hojas de estilo hasta `loader.timeout`. El JavaScript no se aísla; `JsSandbox` de `@tuvix.js/sandbox` es una utilidad independiente.

### Tipos

`OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition`, `AppSandboxOption`, `RouterSource`, `AppErrorEvent`, `AppErrorPhase`, `AppStatus` (`registered`, `bootstrapping`, `bootstrapped`, `mounting`, `mounted`, `updating`, `unmounting`, `unmounted`, `error`), `RegisteredApp` (forma del registro; ningún método lo devuelve).

### Reexportaciones

- De `@tuvix.js/event-bus`: `createEventBus`, `getGlobalBus`, tipos `IEventBus`, `EventHandler`, `Unsubscribe`.
- De `@tuvix.js/router`: `createRouter`, `matchPath`, `interceptLinks`, tipos `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions`.
- De `@tuvix.js/loader`: `createLoader`, tipos `Entry`, `MicroAppModule`.

## Casos límite

- `register()` después de `start()` reconcilia una app gestionada por rutas contra la ruta actual, así que se monta en el acto si está activa. Una app `mountWhenVisible` registrada después de `start()` se observa en el acto; si su contenedor no está en el DOM en ese momento, nunca se observa.
- Los fallos de reconciliación no rechazan `start()` ni `reconcile()`; van a `onError` y a la consola. `mountApp` sí rechaza.
- Una app en `error` se reintenta en la siguiente reconciliación que la quiera activa. `fallback` solo se renderiza ante fallos de carga, bootstrap y montaje.
- El desmontaje elimina de `document.head` las hojas de estilo de la entrada; el siguiente montaje las vuelve a añadir.
- Dos orquestadores comparten `getGlobalBus()`. Pasa `eventBus: {}` para tener un bus privado.
- Después de `destroy()`, los métodos que modifican el estado lanzan `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`.

## Lo que no hace

- Aislar el JavaScript.
- Interceptar clics en enlaces (usa `interceptLinks`).
- Renderizar en el servidor (usa `@tuvix.js/server`).
- Compartir dependencias entre apps (usa `@tuvix.js/module-federation` o import maps).
- Emitir eventos DOM `tuvix:mounted` para módulos escritos a mano; eso lo hacen `defineMicroApp` y los adaptadores de framework.

## Migrar desde 0.4

- El orquestador usa `getGlobalBus()` salvo que pases `eventBus`; `destroy()` deja vivo el bus global.
- Las reconciliaciones ya no desmontan las apps montadas manualmente ni las `mountWhenVisible`.
- `sandbox: true` renderiza dentro de un shadow root.
- `prefetch: 'hover'` solo precarga las apps que activa un enlace con el puntero encima o con el foco.
- `activeWhen` usa `matchPath`: se ignoran la query y el hash, `:param` funciona, y `.` y `(` coinciden de forma literal.
- Se elimina `OrchestratorConfig.shared` (nunca se leía). Usa `@tuvix.js/module-federation` o import maps.
- Las `routes` del router coinciden por completo: una ruta `'/'` es solo la página de inicio; usa `'/*'` para todas las rutas. Se elimina `RouteConfig.exact`.
- `APP_ERROR` incluye `phase` y también se dispara ante fallos de actualización y desmontaje.
- `connectRouter({ subscribe, getPath })` sustituye el puente `setTimeout` + `reconcile()` para routers externos.

## Licencia

MIT

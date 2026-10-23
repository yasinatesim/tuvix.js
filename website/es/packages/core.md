---
title: '@tuvix.js/core'
---

<PackageHeader
  name="@tuvix.js/core"
  title="Orquestador central"
  description="Registra micro apps, carga sus entradas y las monta o desmonta según cambia la URL. Sigue al router integrado o a uno externo, aísla el CSS de cada app en un shadow root si lo pides e informa de los eventos de ciclo de vida en un event bus compartido."
  icon="⚙️"
  npm="true"
/>

## Instalación

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

`@tuvix.js/core` depende de `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` y `@tuvix.js/sandbox`. Tu gestor de paquetes los instala junto con él.

## Cuándo usarlo

Usa el orquestador en la página host (la shell) cuando varias apps construidas de forma independiente comparten una página y la URL decide cuál de ellas se ve. Registras cada app una vez con la URL de su entrada, su contenedor y las rutas que le pertenecen. El orquestador carga la entrada la primera vez que se usa, llama a `bootstrap`, `mount` y `unmount` de la app y mantiene la página sincronizada con cada navegación.

Elige otra opción en estos casos:

- Renderizas una isla de framework por página y el servidor ya decide qué mostrar. Los adaptadores (`@tuvix.js/react`, `@tuvix.js/vue`, `@tuvix.js/svelte`, `@tuvix.js/angular`) y [`@tuvix.js/vite`](/es/packages/vite) montan islas sin orquestador.
- Solo necesitas cargar un script remoto y llamar tú mismo a su ciclo de vida. Usa [`@tuvix.js/loader`](/es/packages/loader).
- Quieres todo desde un único import. Instala el paquete paraguas [`tuvix.js`](/es/packages/tuvix), que reexporta este paquete.

## Inicio rápido

La shell registra dos apps que comparten `#main`, sigue la URL del navegador con el router integrado y convierte los clics en enlaces del mismo origen en navegaciones del router:

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/settings/*', app: 'settings' }],
  },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

// Active on /dashboard and every path below it.
orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

// No activeWhen: the router route above activates it on /settings/*.
orchestrator.register({
  name: 'settings',
  entry: {
    scripts: ['https://cdn.example.com/settings/main.js'],
    styles: ['https://cdn.example.com/settings/main.css'],
  },
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Cada remoto publica su ciclo de vida con el nombre que registró la shell. `defineMicroApp` lo hace para código DOM sin framework; los adaptadores de framework lo hacen para componentes de React, Vue, Svelte y Angular.

```ts
// dashboard/main.ts, built to https://cdn.example.com/dashboard/main.js
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props, bus }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
    bus?.emit('dashboard:ready', { at: Date.now() });
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## Cómo se activan las apps {#how-apps-become-active}

Cada app registrada sigue una de cinco reglas de activación. El orquestador elige la regla a partir de la configuración de la app.

| Configuración | La app está activa cuando | Quién la desmonta |
| --- | --- | --- |
| `activeWhen: '/path'` | `matchPath('/path', currentPath).matched` es `true` | la siguiente reconciliación en la que la ruta ya no coincide |
| `activeWhen: (path) => boolean` | tu función devuelve `true` | la siguiente reconciliación en la que devuelve `false` |
| sin `activeWhen`, nombrada en `router.routes` | una ruta con `app: name` coincide con la ruta completa | la siguiente reconciliación en la que no coincide ninguna ruta así |
| sin `activeWhen`, sin ruta | nunca por sí sola | tú, con `mountApp` / `unmountApp` |
| `mountWhenVisible: true` | al menos el 10 % de su contenedor está dentro del viewport | tú; las reconciliaciones la omiten y se ignora `activeWhen` |

Las cadenas de `activeWhen` pasan por [`matchPath`](/es/packages/router) de `@tuvix.js/router`, el mismo matcher que usan el router y `@tuvix.js/server`:

- Se ignoran `?query` y `#hash`, así que `/dashboard?tab=2` mantiene montado el dashboard.
- Un patrón simple coincide con sus subrutas en los límites de segmento: `'/dashboard'` coincide con `/dashboard` y `/dashboard/stats`, y no coincide con `/dashboards`.
- `'/dashboard/*'` coincide con las mismas rutas que `'/dashboard'`.
- `:name` coincide con un segmento: `'/users/:id'` coincide con `/users/42`.
- `'/'` coincide con todas las rutas.
- Los demás caracteres, como `.` y `(`, coinciden de forma literal.

Las `routes` del router usan en cambio una coincidencia completa. `{ path: '/settings' }` solo coincide con `/settings`; escribe `'/settings/*'` para incluir las subrutas. Una ruta `'/'` se activa solo en la página de inicio, y `'/*'` se activa en todas las rutas. Aquí también se ignoran las query strings y los hashes.

### De dónde sale la ruta actual {#where-the-current-path-comes-from}

El orquestador lee la ruta de la primera fuente que exista:

1. El router que pasaste a `connectRouter` (su `getPath()`).
2. El router integrado de `config.router` (su `currentPath`).
3. `window.location.pathname`.

Con `config.router` o `connectRouter`, cada navegación lanza una reconciliación. Sin ninguno de los dos, `start()` reconcilia una vez contra `window.location.pathname` y nada reacciona a las navegaciones posteriores hasta que llames a `reconcile()`.

### Las reconciliaciones se ejecutan de una en una {#reconciles-run-one-at-a-time}

Una reconciliación compara cada app gestionada por rutas con la ruta y hace que el DOM coincida:

1. Primero se desmontan, todas en paralelo, las apps que deben quedar inactivas, para que dos apps que comparten contenedor nunca se solapen.
2. Después, las apps que deben estar activas se cargan (solo la primera vez), se inicializan (hasta que una llamada a `bootstrap` tenga éxito) y se montan, en paralelo.

Cuando llega una navegación durante una reconciliación, el orquestador la pone en cola. Si se acumulan tres navegaciones, solo se ejecuta a continuación la ruta más reciente, y la promesa de cada llamador se resuelve cuando la cola se vacía. Una app que pasa a inactiva mientras se carga su entrada omite su montaje. Una app que pasa a inactiva en mitad de `mount()` se desmonta en cuanto ese montaje termina. Navegar rápido `/a` → `/b` → `/a` deja montada solo `a`.

## API

### `createOrchestrator`

```ts no-check
function createOrchestrator(config?: OrchestratorConfig): Orchestrator;
```

Crea un `Orchestrator`. Equivale a `new Orchestrator(config)`.

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | ninguno | Crea el router integrado de `@tuvix.js/router` con `mode` (`'history'` o `'hash'`, por defecto `'history'`), `base` y `routes` (obligatorio, puede ser `[]`). Necesario para `navigateTo` y los eventos `ROUTE_CHANGE`. |
| `eventBus` | `EventBusOptions` | ninguno | Opciones (`maxListeners`, `debug`, `logger`) para un bus privado. Si lo omites, el orquestador usa `getGlobalBus()`, el bus que comparten todas las apps de la página. |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | Se pasa al `ModuleLoader` interno. `timeout` es por intento, en ms (`0` lo desactiva); los `globals` se escriben en `window` antes de que se ejecuten los scripts de una entrada. |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | Cuándo descargar las entradas antes de que se necesiten. Consulta más abajo. |
| `onError` | `(error: Error, appName: string) => void` | ninguno | Se llama cuando una app falla al cargar, inicializar, montar, actualizar o desmontar. `OrchestratorEvent.APP_ERROR` informa de los mismos fallos con la fase. |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | ninguno | Se llama en cada cambio de estado de cada app. |

Las estrategias de precarga descargan las URL de scripts y estilos con `<link rel="prefetch">` o `<link rel="modulepreload">` sin ejecutarlos. Las entradas que son funciones loader se omiten, porque llamar a la función ejecutaría el módulo.

- `'immediate'`: todas las apps registradas, durante `start()`.
- `'idle'`: todas las apps registradas, en el primer `requestIdleCallback` después de `start()` (un `setTimeout` de 200 ms donde esa API no existe).
- `'hover'`: cuando el puntero entra en un enlace del mismo origen, o este recibe el foco, el orquestador precarga las apps que activaría la ruta de ese enlace. Cada app se precarga una sola vez. Se respetan el modo hash y `router.base`.

`destroy()` cancela la precarga pendiente por inactividad y por hover.

### `Orchestrator`

```ts no-check
class Orchestrator {
  constructor(config?: OrchestratorConfig);
  register(appConfig: MicroAppConfig): void;
  unregister(name: string): Promise<void>;
  start(): Promise<void>;
  mountApp(name: string): Promise<void>;
  unmountApp(name: string): Promise<void>;
  updateAppProps(name: string, props: Record<string, unknown>): Promise<void>;
  reconcile(path?: string): Promise<void>;
  connectRouter(source: RouterSource): () => void;
  navigateTo(path: string): Promise<void>;
  getAppStatus(name: string): AppStatus | null;
  getRegisteredApps(): string[];
  getMountedApps(): string[];
  getEventBus(): IEventBus;
  getRouter(): IRouter | null;
  destroy(): Promise<void>;
}
```

#### `register(appConfig)`

Guarda la configuración de una app. No carga, monta ni reconcilia nada; de eso se encargan `start()` y las navegaciones posteriores.

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Nombre único de la app. El módulo remoto debe registrarse con el mismo nombre (`defineMicroApp({ name })` o el `name` de un adaptador), o exponer un único global nuevo en `window` con una función `mount`. |
| `entry` | `Entry` | obligatorio | Una URL de script, un `EntryConfig` (`{ scripts, styles?, type?, integrity? }`) o una función loader como `() => import('./dashboard')`. Consulta [`@tuvix.js/loader`](/es/packages/loader). |
| `container` | `string \| HTMLElement` | obligatorio | Selector CSS o elemento. Un selector se resuelve con `document.querySelector` en cada montaje. |
| `activeWhen` | `string \| ((path: string) => boolean)` | ninguno | Regla de activación. Consulta [Cómo se activan las apps](#how-apps-become-active). |
| `props` | `Record<string, unknown>` | ninguno | Se pasan a `mount()`. `updateAppProps` las fusiona con las nuevas. |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | `true` o `{ css: true }` renderiza la app dentro de un shadow root en su contenedor. Consulta [Aislamiento de CSS](#css-isolation). |
| `fallback` | `string` | ninguno | HTML que se escribe en el contenedor con `innerHTML` cuando falla la carga, la inicialización o el montaje. Los fallos de actualización y desmontaje no tocan el contenedor. |
| `mountWhenVisible` | `boolean` | `false` | Monta la app cuando el 10 % del contenedor es visible, usando `IntersectionObserver`. Las reconciliaciones ignoran la app y su `activeWhen`. |

Lanza `[Tuvix] App name is required.`, `[Tuvix] App "<name>" is already registered.`, `[Tuvix] App "<name>" requires an entry.` o `[Tuvix] App "<name>" requires a container.`.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile'),
  container: '#main',
  activeWhen: '/users/:id',
  fallback: '<p>The profile is unavailable.</p>',
});

orchestrator.register({
  name: 'comments',
  entry: 'https://cdn.example.com/comments/main.js',
  container: '#comments',
  mountWhenVisible: true,
});

await orchestrator.start();
```

#### `start()`

Se suscribe al router integrado (si existe), reconcilia contra la ruta actual, configura la precarga y empieza a observar los contenedores con `mountWhenVisible`. Emite `OrchestratorEvent.STARTED`. Se resuelve después de la primera reconciliación, también cuando una app falló en ella; los fallos van a `onError`, a `APP_ERROR` y a la consola. Una segunda llamada registra `[Tuvix] Orchestrator is already started.` y retorna.

#### `mountApp(name)` / `unmountApp(name)`

Montan o desmontan una app a mano. Úsalos para apps sin `activeWhen` ni ruta; en las apps gestionadas por rutas, la siguiente reconciliación anula tu decisión.

`mountApp` espera a que termine un desmontaje en curso y después carga y monta. Rechaza con el error de carga o de montaje después de renderizar `fallback`. `unmountApp` espera a que termine una carga o un montaje en curso y después desmonta; si se llama durante la carga, omite el montaje por completo.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'chat', entry: '/chat/main.js', container: '#chat' });
await orchestrator.start();

document.querySelector('#open-chat')?.addEventListener('click', () => {
  orchestrator.mountApp('chat').catch(() => {
    // fallback HTML is already in #chat
  });
});
```

#### `updateAppProps(name, props)`

Fusiona de forma superficial `props` con las props actuales de la app. Una app montada que tenga una función `update` recibe el objeto fusionado como `update({ props, container })`. Si no, el orquestador guarda las props fusionadas y las pasa al siguiente `mount()`. Primero espera a que termine un montaje pendiente, para que la actualización llegue a la nueva instancia. Cuando `update` lanza un error, el estado pasa a `error`, se ejecuta `onError`, la promesa se rechaza y las props guardadas no cambian.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'cart', entry: '/cart/main.js', container: '#cart', activeWhen: '/' });
await orchestrator.start();

await orchestrator.updateAppProps('cart', { currency: 'EUR' });
```

#### `reconcile(path?)`

Pone en cola una reconciliación contra `path`, o contra la ruta actual si lo omites. Úsalo cuando ningún router informa al orquestador de las navegaciones. Se aplican las reglas de cola de [Las reconciliaciones se ejecutan de una en una](#reconciles-run-one-at-a-time).

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.reconcile('/dashboard?tab=stats');
```

#### `connectRouter(source)`

Sigue a un router externo (TanStack Router, React Router, uno propio) en lugar del integrado. `source.subscribe(callback)` debe llamar a `callback` después de cada navegación y devolver una función para cancelar la suscripción; `source.getPath()` devuelve la ruta actual. Después de `start()`, cada callback reconcilia contra `getPath()`. `start()` también lee `getPath()`. Conectar un orquestador que ya arrancó reconcilia de inmediato. Devuelve `disconnect()`.

```ts
import { createOrchestrator } from '@tuvix.js/core';

// TanStack Router instance created elsewhere in your shell.
declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'billing', entry: '/billing/main.js', container: '#main', activeWhen: '/billing' });

const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();

// Later, when the shell tears down:
disconnect();
```

Un data router de React Router (`createBrowserRouter`) encaja en la misma forma: `subscribe: (callback) => router.subscribe(() => callback())` y `getPath: () => router.state.location.pathname`.

#### `navigateTo(path)`

Llama a `push(path)` en el router integrado. La promesa se resuelve después de que cambie la URL; la reconciliación que provoca se ejecuta en segundo plano. Lanza `[Tuvix] No router configured.` sin `config.router`.

#### `getAppStatus(name)`, `getRegisteredApps()`, `getMountedApps()`

`getAppStatus` devuelve el `AppStatus` de la app, o `null` para un nombre desconocido. `getRegisteredApps` devuelve todos los nombres registrados. `getMountedApps` devuelve los nombres cuyo estado es `'mounted'` (una app en `'updating'` queda fuera).

#### `getEventBus()`, `getRouter()`

`getEventBus` devuelve el bus en el que el orquestador emite los `OrchestratorEvent` y que pasa a `mount()`: `getGlobalBus()`, o el bus privado si defines `eventBus`. `getRouter` devuelve el router integrado, o `null`.

#### `unregister(name)`

Desmonta la app (esperando a un montaje en curso), deja de observar su contenedor, elimina las etiquetas de script y de estilo de la entrada, descarta el módulo en caché y olvida la app. Rechaza con nombres desconocidos. Los navegadores ejecutan un script de módulo una sola vez por URL, así que volver a registrar una entrada de URL con `type: 'module'` necesita una URL nueva o una función loader.

#### `destroy()`

Detiene la precarga, cancela la suscripción al router integrado y a todos los routers conectados, espera a la reconciliación en curso, desmonta todas las apps, vacía la caché del loader y emite `OrchestratorEvent.DESTROYED`. Destruye un bus privado y deja vivo el bus global. Las llamadas repetidas devuelven la misma promesa. Después, `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` y `connectRouter` lanzan `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`.

### `defineMicroApp`

```ts no-check
function defineMicroApp(definition: MicroAppDefinition): MicroAppModule;
```

Valida un objeto de ciclo de vida, lo publica con `registerModule(definition.name, module)` de `@tuvix.js/loader` y lo devuelve. Llámalo en la entrada de la app remota. El orquestador encuentra el módulo por su nombre después de que se ejecuten los scripts de la entrada, tanto si la entrada es una URL como si es una función loader.

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Debe ser igual al `name` que registró la shell. |
| `bootstrap` | `() => void \| Promise<void>` | ninguno | Se ejecuta después de la primera carga, antes del primer montaje. Si lanza un error, el montaje falla y el siguiente montaje vuelve a llamarlo; tras un éxito no vuelve a ejecutarse nunca para ese orquestador. |
| `mount` | `(context: MountContext) => void \| Promise<void>` | obligatorio | Renderiza en `context.container`. |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | obligatorio | Limpia y vacía `context.container`. |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | ninguno | Aplica `context.props` sin volver a montar. Sin ella, las props nuevas esperan al siguiente montaje. |
| `ssr` | `boolean` | `false` | Actívalo cuando `mount` adopta markup renderizado en el servidor. El evento `tuvix:mounted` informa entonces `hydrated: true` si el contenedor tenía markup antes de que se ejecutara `mount`. |

`MountContext` contiene:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `container` | `HTMLElement` | Elemento en el que renderizar. En las apps con CSS aislado es un `<div data-tuvix-sandbox-root>` dentro del shadow root. |
| `props` | `Record<string, unknown> \| undefined` | Props actuales. |
| `name` | `string \| undefined` | El nombre registrado de la app. |
| `bus` | `MicroAppBus \| undefined` | El event bus del orquestador (`on`, `once`, `emit`, `off`). |

El módulo devuelto envuelve tus `mount` y `unmount` y despacha los mismos eventos DOM de ciclo de vida que los adaptadores de framework, así que `whenMounted(name)`, `isMounted(name)` y `onLifecycle` de `@tuvix.js/loader` funcionan con estas apps:

- `tuvix:mounted` después de que `mount` se resuelve, con `{ name, container, hydrated }`.
- `tuvix:unmounted` después de que `unmount` se resuelve.
- `tuvix:error` cuando cualquiera de los dos lanza un error. El wrapper vuelve a lanzar entonces el error.

Los eventos burbujean desde el contenedor hasta `document`. En un contenedor que no está conectado al documento, el runtime los despacha directamente en `document`. Un `unmount` que llega mientras `mount` todavía se ejecuta para el mismo contenedor espera primero a ese montaje.

Lanza `[Tuvix] defineMicroApp requires a "name" property.`, `[Tuvix] defineMicroApp "<name>" requires a "mount" function.` o `[Tuvix] defineMicroApp "<name>" requires an "unmount" function.`.

```ts
import { defineMicroApp } from '@tuvix.js/core';

let offCart: (() => void) | undefined;

export default defineMicroApp({
  name: 'header',
  bootstrap() {
    console.log('header loaded');
  },
  mount({ container, props, bus }) {
    container.innerHTML = `<header>Hello, ${String(props?.user ?? 'guest')} <span id="count">0</span></header>`;
    offCart = bus?.on<{ count: number }>('cart:changed', ({ count }) => {
      const badge = container.querySelector('#count');
      if (badge) badge.textContent = String(count);
    });
  },
  update({ props, container }) {
    const header = container?.querySelector('header');
    if (header?.firstChild) header.firstChild.textContent = `Hello, ${String(props.user ?? 'guest')} `;
  },
  unmount({ container }) {
    offCart?.();
    container.replaceChildren();
  },
});
```

### `OrchestratorEvent`

Enum de cadenas con los eventos que el orquestador emite en su bus. Como el bus por defecto es `getGlobalBus()`, cualquier app de la página puede escucharlos.

| Miembro | Nombre del evento | Payload |
| --- | --- | --- |
| `APP_REGISTERED` | `'tuvix:app:registered'` | `{ name }` |
| `APP_BOOTSTRAP` | `'tuvix:app:bootstrap'` | `{ name }` |
| `APP_MOUNT` | `'tuvix:app:mount'` | `{ name }` |
| `APP_UNMOUNT` | `'tuvix:app:unmount'` | `{ name }` |
| `APP_ERROR` | `'tuvix:app:error'` | `AppErrorEvent`: `{ name, error, phase }`, donde `phase` es `'load'`, `'bootstrap'`, `'mount'`, `'update'` o `'unmount'` |
| `APP_STATUS_CHANGE` | `'tuvix:app:status-change'` | `{ name, status }` |
| `ROUTE_CHANGE` | `'tuvix:route:change'` | el `NavigationEvent` del router integrado (`from`, `to`, `fromRoute`, `toRoute`) |
| `STARTED` | `'tuvix:started'` | `{}` |
| `DESTROYED` | `'tuvix:destroyed'` | `{}` |

`phase: 'load'` cubre tanto la resolución del contenedor como la carga de la entrada.

```ts
import { createOrchestrator, getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
```

### Aislamiento de CSS {#css-isolation}

`sandbox: true` o `sandbox: { css: true }` aísla el CSS de una app:

1. En el primer montaje, el orquestador adjunta un shadow root abierto al contenedor con `CssSandbox` de [`@tuvix.js/sandbox`](/es/packages/sandbox) y mueve los hijos existentes (markup renderizado en el servidor) a un `<div data-tuvix-sandbox-root="<name>">` dentro de él. La app se monta en ese div.
2. Los `styles` de la entrada se cargan como elementos `<link>` dentro del shadow root en lugar de en `document.head`. El montaje espera a que se carguen o fallen, durante un máximo de `loader.timeout` ms (10000 por defecto; con `0` espera sin límite).
3. El desmontaje conserva el shadow root. El siguiente montaje lo reutiliza.

Las hojas de estilo de la página dejan de aplicarse a los elementos de la app, y las hojas de estilo de la app dejan de llegar a la página. Las propiedades heredadas, como `color` y `font-family`, siguen atravesando el límite del shadow. `{ css: false }` y `false` renderizan en el light DOM.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'checkout',
  entry: { scripts: ['/checkout/main.js'], styles: ['/checkout/main.css'] },
  container: '#checkout',
  activeWhen: '/checkout',
  sandbox: { css: true },
});

await orchestrator.start();
```

El orquestador no aísla JavaScript. `JsSandbox` de [`@tuvix.js/sandbox`](/es/packages/sandbox) es una utilidad independiente que llamas tú mismo.

### Tipos

| Tipo | Significado |
| --- | --- |
| `OrchestratorConfig` | Argumento de `createOrchestrator` y `new Orchestrator`. Consulta la tabla de `createOrchestrator`. |
| `MicroAppConfig` | Argumento de `register`. Consulta la tabla de `register`. |
| `MicroAppDefinition` | Argumento de `defineMicroApp`: `name`, `bootstrap?`, `mount`, `unmount`, `update?`. |
| `AppSandboxOption` | `boolean \| { css?: boolean }`, el campo `sandbox`. |
| `RouterSource` | `{ subscribe(callback: () => void): () => void; getPath(): string }`, el argumento de `connectRouter`. |
| `AppErrorEvent` | `{ name: string; error: Error; phase: AppErrorPhase }`, el payload de `APP_ERROR`. |
| `AppErrorPhase` | `'load' \| 'bootstrap' \| 'mount' \| 'update' \| 'unmount'`. |
| `AppStatus` | `'registered' \| 'bootstrapping' \| 'bootstrapped' \| 'mounting' \| 'mounted' \| 'updating' \| 'unmounting' \| 'unmounted' \| 'error'`. El primer montaje recorre `registered → bootstrapping → bootstrapped → mounting → mounted`; un nuevo montaje va de `unmounted → mounting → mounted`. |
| `RegisteredApp` | Forma del registro que el orquestador guarda para una app: `config`, `status`, `module`, `container`, `error`, `lastUpdated`. Ningún método de `Orchestrator` lo devuelve en 0.5.0. |

### Reexportaciones

`@tuvix.js/core` reexporta lo siguiente de sus dependencias, para que una shell pueda importarlo todo desde un único paquete. Cada enlace documenta la API completa.

| Export | Tipo | Origen |
| --- | --- | --- |
| `createEventBus`, `getGlobalBus` | función | [`@tuvix.js/event-bus`](/es/packages/event-bus) |
| `IEventBus`, `EventHandler`, `Unsubscribe` | tipo | [`@tuvix.js/event-bus`](/es/packages/event-bus) |
| `createRouter`, `matchPath`, `interceptLinks` | función | [`@tuvix.js/router`](/es/packages/router) |
| `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions` | tipo | [`@tuvix.js/router`](/es/packages/router) |
| `createLoader` | función | [`@tuvix.js/loader`](/es/packages/loader) |
| `Entry`, `MicroAppModule` | tipo | [`@tuvix.js/loader`](/es/packages/loader) |

`getGlobalBus()` guarda su instancia en `window.__TUVIX_GLOBAL_BUS__`, así que una micro app que incluye en su bundle su propia copia de `@tuvix.js/event-bus` obtiene el mismo bus que la shell.

## Casos límite

- `register()` antes de `start()` solo guarda la configuración. Después de `start()`, registrar una app gestionada por rutas (tiene `activeWhen`, o una ruta del router la nombra) reconcilia contra la ruta actual, así que la app se monta de inmediato si la ruta la activa.
- Una app con `mountWhenVisible` registrada después de `start()` se observa de inmediato. Si su contenedor no está en el DOM en ese momento (o en `start()`), se omite y nunca se observa. Sin `IntersectionObserver` (servidor, navegadores antiguos), las apps de viewport nunca se montan.
- Una app de viewport que no pudo montarse se queda en `error`; el observer no la reintenta.
- Una app gestionada por rutas en `error` se reintenta en la siguiente reconciliación que la quiera activa. Una carga fallida vuelve a cargar. Un `bootstrap` fallido vuelve a ejecutar `bootstrap` en el reintento; uno que tuvo éxito no se repite, así que un `mount` fallido solo reintenta `mount`.
- Si falta el contenedor, el montaje falla con `[Tuvix] Container "#main" not found in DOM.`. En un primer montaje, `fallback` no tiene dónde renderizarse.
- Los fallos de reconciliación no rechazan `start()`, `reconcile()` ni las navegaciones. El orquestador registra `[Tuvix] Failed to mount "<name>":` (o `unmount`) en la consola y llama a `onError`. `mountApp` y `unmountApp` sí rechazan.
- `APP_ERROR` se dispara para los fallos de cualquier fase, con `phase` indicándola. `fallback` solo se renderiza en fallos de `load`, `bootstrap` y `mount`.
- Una app cuyo desmontaje lanza un error termina en `error` y cuenta como desmontada.
- `fallback` pasa por `innerHTML`. Pasa solo markup de confianza.
- El desmontaje elimina de `document.head` las hojas de estilo de la entrada de la app, salvo que otra app cargada use la misma URL. El siguiente montaje las vuelve a añadir y espera a que carguen.
- Dos orquestadores en una página comparten `getGlobalBus()` y ven los `OrchestratorEvent` del otro. Pasa `eventBus: {}` para dar a uno de ellos un bus privado.
- `resetGlobalBus()` de `@tuvix.js/event-bus` destruye el bus que tiene un orquestador en ejecución. El orquestador se queda con el bus destruido; llama a `resetGlobalBus()` solo después de `destroy()`, por ejemplo entre tests.
- Se ignoran los callbacks de `connectRouter` que se disparan antes de `start()`. Llamar dos veces a `connectRouter` mantiene ambas suscripciones; la fuente más reciente proporciona la ruta para `start()` y `reconcile()`.
- Con `config.router` y `connectRouter` a la vez, cada fuente reconcilia contra su propia ruta. Usa solo uno de ellos.
- Las funciones `activeWhen` reciben la ruta tal como llega de la fuente. Con el router integrado o `connectRouter`, esa ruta puede contener una query string; `matchPath` la elimina en los patrones de cadena.
- `updateAppProps` reemplaza los objetos anidados: `{ user: { id: 2 } }` sobrescribe la prop `user` completa.

## Lo que no hace

- No aísla JavaScript. Los globales, timers y listeners que crea una app se quedan en `window`. Usa `JsSandbox` de [`@tuvix.js/sandbox`](/es/packages/sandbox).
- No intercepta los clics en enlaces. Llama a `interceptLinks` (reexportado aquí) o deja que navegue el router de tu framework.
- No renderiza en el servidor. Usa [`@tuvix.js/server`](/es/packages/server) y las entradas `./server` de los adaptadores.
- No comparte dependencias entre apps. Usa [`@tuvix.js/module-federation`](/es/packages/module-federation) o import maps.
- No emite por sí mismo los eventos DOM de ciclo de vida (`tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`). Los emiten los módulos de `defineMicroApp` y los adaptadores de framework; un `MicroAppModule` escrito a mano no emite ninguno salvo que llame a `emitLifecycle` de `@tuvix.js/loader`.
- No mantiene viva una app cuando se desmonta. El estado dentro de la app se pierde salvo que la app lo guarde en otro sitio.

## Migrar desde 0.4 {#migrating-from-0-4}

Cambios incompatibles en 0.5.0:

- **Event bus compartido.** El bus del orquestador es `getGlobalBus()` salvo que pases `eventBus`. En 0.4 cada orquestador creaba su propio bus. Ahora `destroy()` deja vivo el bus global.

  ```ts
  import { createOrchestrator } from '@tuvix.js/core';

  // 0.5: keep a private bus as in 0.4
  const orchestrator = createOrchestrator({ eventBus: {} });
  ```

- **Las apps manuales siguen montadas.** Las reconciliaciones ya no desmontan las apps que no tienen ni `activeWhen` ni ruta del router, ni las apps con `mountWhenVisible`. En 0.4 el siguiente cambio de ruta desmontaba una app montada a mano. Llama a `unmountApp(name)` donde dependías de eso.
- **`sandbox: true` usa un shadow root.** El CSS de la página ya no llega a la app, y los `styles` de la entrada ya no llegan a la página. Elimina `sandbox` o define `{ css: false }` para mantener el renderizado de 0.4.
- **`prefetch: { strategy: 'hover' }`** precarga solo las apps que activa un enlace con hover o con foco. En 0.4 el primer movimiento del ratón en cualquier parte precargaba todas las apps.
- **`activeWhen` usa `matchPath`.** Una query string o un hash ya no desmontan una app, los segmentos `:param` funcionan, y caracteres como `.` y `(` coinciden de forma literal.
- **`shared` ya no existe.** `OrchestratorConfig.shared` nunca se leía y se ha eliminado del tipo. Bórralo; comparte dependencias con [`@tuvix.js/module-federation`](/es/packages/module-federation) o import maps.
- **Las `routes` del router coinciden con la ruta completa.** Una ruta `{ path: '/', app: 'home' }` se activa solo en `/`. Usa `'/*'` para una app que se muestra en todas las rutas, o `activeWhen: '/'`, que mantiene la coincidencia por prefijo. `RouteConfig.exact` se ha eliminado; quítalo.
- **Payload de `APP_ERROR`.** Ahora incluye `phase` y también se dispara en fallos de actualización y desmontaje. Los handlers que suponían un fallo de montaje deben comprobar `phase`.

Ya puedes quitar el workaround de 0.4 para routers externos:

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();

// 0.4:
// router.subscribe('onResolved', () => setTimeout(() => orchestrator.reconcile(location.pathname)));

// 0.5:
orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
```

Versiones anteriores de esta página describían métodos y opciones que `Orchestrator` no tiene. Usa los nombres reales:

| Página anterior | API real |
| --- | --- |
| `createOrchestrator({ container })` | `container` pertenece a cada app en `register()` |
| `register(name, options)` | `register({ name, entry, container, ... })` |
| `mount(name, props)` | `updateAppProps(name, props)` y después `mountApp(name)` |
| `unmount(name)` | `unmountApp(name)` |
| `update(name, props)` | `updateAppProps(name, props)` |
| `stop()` | `destroy()` |
| `onBeforeMount`, `onAfterMount` | `onStatusChange(name, status)` u `OrchestratorEvent.APP_MOUNT` |
| `sandbox: { js: true }` | `JsSandbox` de `@tuvix.js/sandbox` |

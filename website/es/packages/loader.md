---
title: '@tuvix.js/loader'
---

<PackageHeader
  name="@tuvix.js/loader"
  title="Loader"
  description="Carga bundles de micro apps por nombre desde URLs de scripts o funciones loader, con reintentos, timeouts, un registro de módulos compartido y eventos de ciclo de vida."
  icon="📦"
  npm="true"
/>

## Instalación

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

## Cuándo usarlo

`@tuvix.js/loader` convierte una entry (una URL de script, una lista de scripts y estilos, o `() => import('./app')`) en un módulo de micro app con `mount` y `unmount`. Añade las etiquetas `<script>` y `<link>`, reintenta los intentos fallidos, se rinde tras un timeout y guarda el resultado en caché por nombre de app.

`@tuvix.js/core` crea un `ModuleLoader` por ti y le pasa la opción `loader` de `createOrchestrator`, así que la mayoría de las shells nunca importan este paquete. Impórtalo cuando:

- escribas una micro app o un adaptador que se publica con `registerModule`, o que informa `tuvix:mounted` con `emitLifecycle`
- necesites saber cuándo se montó otra app (`whenMounted`, `onLifecycle`)
- cargues micro apps sin el orquestador, por ejemplo desde tu propio router
- cargues un solo script u hoja de estilos con deduplicación (`loadScript`, `loadStyle`)

Si tu bundler puede importar la app en tiempo de build y nunca cargas código de otro origen, basta con un `import()` normal.

## Inicio rápido

La micro app publica su módulo bajo un nombre. Este archivo se compila en `https://cdn.example.com/dashboard/main.js`:

```ts
// dashboard/src/main.ts
import { registerModule } from '@tuvix.js/loader';

registerModule('dashboard', {
  mount({ container, props }) {
    container.innerHTML = `<h2>Dashboard for user ${String(props?.userId)}</h2>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

La shell lo carga por nombre y lo monta:

```ts
// shell/src/main.ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 15000, retries: 1 });
const container = document.getElementById('dashboard')!;

const result = await loader.load('dashboard', {
  scripts: ['https://cdn.example.com/dashboard/main.js'],
  styles: ['https://cdn.example.com/dashboard/main.css'],
  type: 'module',
});

if (result.module) {
  await result.module.mount({ container, props: { userId: 42 } });
} else {
  container.textContent = 'The dashboard is unavailable.';
  console.error(result.error);
}
```

`load()` nunca lanza excepciones. Una carga fallida devuelve `status: 'error'`, `module: null` y el último error.

## Formas de entry {#entry-forms}

Una `Entry` le indica al loader dónde está el código de una app. Admite tres formas.

**Una cadena con una URL.** El loader trata `'https://cdn.example.com/app.js'` como `{ scripts: ['https://cdn.example.com/app.js'] }`.

**Un objeto `EntryConfig`:**

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `scripts` | `string[]` | obligatorio | URLs de scripts. El loader las ejecuta una tras otra en este orden. Un array vacío no carga nada y resuelve el módulo desde el registro. |
| `styles` | `string[]` | `[]` | URLs de hojas de estilos, cargadas en paralelo con los scripts. La carga espera a ambos. |
| `type` | `'module' \| 'classic'` | se infiere por URL | Tipo de script para cada URL de `scripts`. Sin él, las URLs que terminan en `.mjs`, `.mts`, `.ts`, `.tsx` o `.jsx` se cargan como `type="module"` y el resto se carga como script clásico. Usa `'module'` para la salida ES de Vite o Rollup, que termina en `.js`. |
| `integrity` | `Record<string, string>` | ninguno | Hashes de Subresource Integrity indexados por URL. El loader los escribe en las etiquetas `<script>`, `<link>` y de precarga. |

**Una función loader (`EntryLoader`).** El loader la llama con `{ signal }` y acepta tres resultados, comprobados en este orden:

1. un módulo con una función `mount`
2. un objeto cuyo export `default` es un módulo así (un namespace de ES module)
3. nada utilizable, en cuyo caso el loader busca el módulo que el import registró con `registerModule(name, ...)`

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();
```

Tu bundler separa `./dashboard` en su propio chunk y lo descarga en el primer montaje. Las funciones loader son también la forma en que [`@tuvix.js/module-federation`](/es/packages/module-federation) conecta un remote federado al orquestador.

`signal` se aborta cuando el intento supera el timeout. Pásalo a todo lo que hagas `fetch` por el camino:

```ts
import type { EntryLoader } from '@tuvix.js/loader';

const entry: EntryLoader = async ({ signal }) => {
  const response = await fetch('/api/manifest/dashboard.json', { signal });
  const { url } = (await response.json()) as { url: string };
  return import(/* @vite-ignore */ url);
};
```

## API

### `ModuleLoader`

```ts no-check
class ModuleLoader {
  constructor(options?: LoaderOptions);
  load(name: string, entry: Entry): Promise<LoadResult>;
  prefetch(entry: Entry): void;
  removeStyles(name: string): void;
  unload(name: string): void;
  clearCache(): void;
  isLoaded(name: string): boolean;
  getModule(name: string): MicroAppModule | null;
  getStatus(name: string): LoadStatus;
  getCachedNames(): string[];
}
```

Cada `ModuleLoader` mantiene su propia caché de módulos resueltos por nombre de app. Las etiquetas `<script>` y `<link>` son de toda la página: dos loaders que cargan la misma URL comparten una etiqueta.

`LoaderOptions`:

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Límite de tiempo en ms para un intento, que cubre todos los scripts y hojas de estilos de la entry. `0` lo desactiva. |
| `retries` | `number` | `2` | Intentos extra después de que falle el primero. `2` significa hasta 3 intentos. |
| `retryDelay` | `number` | `1000` | Espera en ms entre intentos. |
| `globals` | `Record<string, unknown>` | `{}` | Propiedades que el loader asigna a `window` antes de cada intento de una entry con URL, para bundles UMD que esperan `window.React` o un objeto de configuración. Las entries con función loader lo ignoran. |

#### `load(name, entry)`

Resuelve a un `LoadResult`:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `status` | `'loaded' \| 'error'` | Resultado de la carga. |
| `module` | `MicroAppModule \| null` | El módulo resuelto, `null` si hay error. |
| `error` | `Error \| null` | El error del último intento. |
| `duration` | `number` | Milisegundos desde la llamada hasta el resultado, medidos con `performance.now()`. |

Para una entry con URL, un intento:

1. asigna `options.globals` a `window`
2. añade los scripts en orden, cada uno esperando al anterior, y las hojas de estilos en paralelo
3. lee el módulo del registro (`getRegisteredModule(name)`)
4. recurre a un global UMD como fallback: una propiedad de `window` con una función `mount` que apareció durante esta carga

Después el loader comprueba que el módulo tenga las funciones `mount` y `unmount` y lo guarda en caché bajo `name`. Las llamadas posteriores con el mismo nombre devuelven el módulo en caché e ignoran `entry`. Una segunda llamada mientras la primera sigue cargando devuelve la misma promesa. Las cargas de nombres distintos se ejecutan en paralelo.

#### `prefetch(entry)`

Pide al navegador que descargue los archivos de una entry sin ejecutarlos. Los scripts de módulo reciben `<link rel="modulepreload">`; los scripts clásicos y las hojas de estilos reciben `<link rel="prefetch">`. Las entries con función loader se omiten, porque llamar a la función ejecutaría el módulo. El orquestador lo llama según su ajuste `prefetch`.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
loader.prefetch({ scripts: ['/apps/settings/main.js'], type: 'module' });
```

#### `removeStyles(name)`

Elimina las hojas de estilos de una app cargada para que su CSS deje de aplicarse mientras está desmontada. Una hoja de estilos se mantiene cuando otra app en caché, cuyos estilos no hayas eliminado, incluye la misma URL. El siguiente `load(name)` vuelve a añadir las hojas de estilos y las espera antes de resolver. El orquestador llama a `removeStyles` después de cada desmontaje.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
const container = document.getElementById('cart')!;
const { module } = await loader.load('cart', { scripts: ['/cart.js'], styles: ['/cart.css'] });

await module?.mount({ container });
await module?.unmount({ container });
loader.removeStyles('cart');
```

#### `unload(name)`

Olvida una app: elimina sus hojas de estilos y sus etiquetas de script, la quita de la caché y la da de baja del registro compartido cuando el módulo registrado es el que resolvió este loader. El siguiente `load(name)` descarga y ejecuta la entry de nuevo. El orquestador lo llama desde `unregister(name)`.

#### `clearCache()`

Llama a `unload` para cada app en caché. El orquestador lo llama desde `destroy()`.

#### `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()`

Leen la caché. `getStatus` devuelve `'loading'` mientras se ejecuta una carga, `'loaded'` cuando el módulo está en caché y `'idle'` en cualquier otro caso. Una carga fallida deja el estado en `'idle'`.

### `createLoader`

```ts no-check
function createLoader(options?: LoaderOptions): ModuleLoader;
```

Equivale a `new ModuleLoader(options)`. Recibe las `LoaderOptions` de la tabla anterior.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 8000, retries: 0, globals: { APP_ENV: 'production' } });
```

Para definir estas opciones en el orquestador, pásalas como `loader`:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({ loader: { timeout: 15000, retries: 1, retryDelay: 500 } });
```

### `normalizeEntry`

```ts no-check
function normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

Convierte una URL en `{ scripts: [url] }` y devuelve un `EntryConfig` sin cambios. No acepta funciones loader; comprueba primero `typeof entry === 'function'`.

```ts
import { normalizeEntry } from '@tuvix.js/loader';

normalizeEntry('https://cdn.example.com/app.js'); // { scripts: ['https://cdn.example.com/app.js'] }
```

### `loadScript`

```ts no-check
function loadScript(url: string, options?: LoadScriptOptions | string): Promise<void>;
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `type` | `'module' \| 'classic'` | se infiere de la extensión | Tipo de script, con las mismas reglas que `EntryConfig.type`. |
| `integrity` | `string` | ninguno | Hash SRI para el atributo `integrity`. |
| `signal` | `AbortSignal` | ninguno | Deja de esperar al abortarse. La promesa se rechaza con el motivo de la señal. |

Añade `<script crossorigin="anonymous">` a `document.head` y resuelve en su evento `load`. Las llamadas concurrentes para una URL comparten una etiqueta, y una llamada para una URL que ya se cargó resuelve al instante. Una carga fallida elimina su etiqueta y se rechaza con `[Tuvix Loader] Failed to load script: <url>`, así que la siguiente llamada empieza con una etiqueta nueva. Una llamada abortada elimina la etiqueta solo cuando ningún otro llamador sigue esperándola. `loadScript` no tiene timeout propio; pasa un `signal`.

Una cadena como segundo argumento se interpreta como el hash de integridad, igual que en 0.4.

```ts
import { loadScript } from '@tuvix.js/loader';

await loadScript('https://cdn.example.com/charts.js', { type: 'classic', signal: AbortSignal.timeout(5000) });
```

### `loadStyle`

```ts no-check
function loadStyle(url: string, options?: LoadStyleOptions | number): Promise<void>;
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Hace fallar la carga tras esta cantidad de ms con `[Tuvix Loader] Style load timed out: <url>`. `0` lo desactiva. |
| `integrity` | `string` | ninguno | Hash SRI para el atributo `integrity`. |
| `signal` | `AbortSignal` | ninguno | Deja de esperar al abortarse. |

Añade `<link rel="stylesheet" crossorigin="anonymous">` a `document.head` con las mismas reglas de compartición, fallo y aborto que `loadScript`. Un número como segundo argumento se interpreta como el timeout, igual que en 0.4.

```ts
import { loadStyle } from '@tuvix.js/loader';

await loadStyle('https://cdn.example.com/app.css', { timeout: 5000 });
```

### `removeScript`

```ts no-check
function removeScript(url: string): void;
```

Elimina la etiqueta que `loadScript` añadió para `url`, además de cualquier `<script>` cuyo atributo `src` sea igual a `url`. Una carga todavía en curso para esa URL se rechaza con `[Tuvix Loader] Removed before load: <url>`. El siguiente `loadScript(url)` añade una etiqueta nueva. El código que el script ya ejecutó permanece en memoria.

### `removeStyle`

```ts no-check
function removeStyle(url: string): void;
```

Igual que `removeScript`, para etiquetas `<link rel="stylesheet">`.

### `prefetchResource`

```ts no-check
function prefetchResource(url: string, options?: PrefetchOptions): void;
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `as` | `'script' \| 'style'` | `'style'` para URLs `.css`, si no `'script'` | Tipo de recurso. |
| `type` | `'module' \| 'classic'` | se infiere de la extensión | Los scripts de módulo reciben `rel="modulepreload"`. |
| `integrity` | `string` | ninguno | Hash SRI para el link. |

Añade un `<link>` por URL y página. Se omite una URL que `loadScript` o `loadStyle` ya gestionan, o que ya se precargó antes.

```ts
import { prefetchResource } from '@tuvix.js/loader';

prefetchResource('https://cdn.example.com/app.js', { type: 'module' });
```

### `registerModule`

```ts no-check
function registerModule(name: string, module: MicroAppModule): void;
```

Publica un módulo bajo un nombre para que un loader pueda encontrarlo después de que se ejecute el script de la app. Una segunda llamada con el mismo nombre reemplaza el primer módulo. Los adaptadores de React, Vue, Svelte y Angular y `defineMicroApp` de core lo llaman por ti; llámalo tú mismo cuando escribas el módulo a mano.

El registro y el estado de las apps montadas viven en `window.__TUVIX_RUNTIME__`, y el mapa de módulos también es accesible como `window.__TUVIX_MODULES__`. Las micro apps que empaquetan cada una su propia copia de `@tuvix.js/loader` leen y escriben el mismo registro. En el servidor, sin `window`, el estado vive en el módulo.

Una micro app escrita a mano que sigue el contrato de los adaptadores:

```ts
import { emitLifecycle, hasServerMarkup, registerModule } from '@tuvix.js/loader';

registerModule('clock', {
  mount({ container }) {
    const hydrated = hasServerMarkup(container);
    if (!hydrated) container.textContent = new Date().toLocaleTimeString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
});
```

### `unregisterModule`

```ts no-check
function unregisterModule(name: string): void;
```

Elimina un módulo del registro. `ModuleLoader.unload` lo llama para los módulos que resolvió.

### `getRegisteredModule`

```ts no-check
function getRegisteredModule(name: string): MicroAppModule | undefined;
```

Devuelve el módulo registrado, o `undefined`.

### `emitLifecycle`

```ts no-check
function emitLifecycle(type: 'mounted' | 'unmounted' | 'error', detail: LifecycleDetail): void;
```

Registra un cambio de ciclo de vida y despacha un `CustomEvent` llamado `tuvix:mounted`, `tuvix:unmounted` o `tuvix:error`. El evento hace bubbling y es `composed`, así que un listener en `document` recibe eventos de contenedores dentro de shadow roots. Cuando `detail.container` está en el DOM, el evento se dispara en el contenedor y sube hasta `document` una sola vez. Cuando el contenedor está desconectado (`isConnected` es `false`), por ejemplo porque React eliminó una isla antes de que el adaptador informara `unmounted`, el evento se dispara en el propio `document`, ya que un evento en un elemento desconectado nunca llega a él. `detail.container` sigue apuntando al elemento en ambos casos. `event.detail` es el `LifecycleDetail`:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `name` | `string` | Nombre de la micro app. |
| `container` | `HTMLElement` | Elemento en el que se renderizó la app. |
| `hydrated` | `boolean` | `true` cuando el adaptador adoptó el markup renderizado en el servidor en lugar de renderizar desde cero. |
| `error` | `unknown` | El valor lanzado, presente en los eventos `error`. |

`mounted` registra el contenedor como montado para `detail.name` y resuelve las promesas pendientes de `whenMounted(name)`. `unmounted` elimina ese contenedor del registro. `error` solo despacha el evento. Los adaptadores de React, Vue, Svelte y Angular y `defineMicroApp` de core lo llaman cuando terminan mount y unmount, y cuando cualquiera de los dos lanza un error.

### `isMounted`

```ts no-check
function isMounted(name: string): boolean;
```

`true` mientras al menos un contenedor de `name` esté montado. El runtime lleva el registro de los contenedores montados por app, así que si un módulo se monta en dos contenedores y desmontas uno, `isMounted(name)` sigue siendo `true` hasta que se desmonta el segundo.

### `whenMounted`

```ts no-check
function whenMounted(name: string, options?: { signal?: AbortSignal }): Promise<LifecycleDetail>;
```

Resuelve con el `LifecycleDetail` del primer montaje. Si la app ya está montada, resuelve al instante con el detail de su contenedor montado más antiguo. Aborta `signal` para dejar de esperar; entonces la promesa se rechaza con el motivo de la señal.

```ts
import { whenMounted } from '@tuvix.js/loader';

const { container, hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log(`header mounted into #${container.id}, hydrated: ${hydrated}`);
```

### `onLifecycle`

```ts no-check
function onLifecycle(type: LifecycleType, handler: (detail: LifecycleDetail) => void, target?: EventTarget): () => void;
```

Escucha `tuvix:<type>` en `target` (por defecto `document`) y devuelve una función que elimina el listener. Con el target por defecto, el handler se ejecuta una vez por evento, tanto para contenedores conectados como desconectados. Un listener en un elemento contenedor no recibe los eventos despachados mientras ese contenedor está desconectado.

```ts
import { onLifecycle } from '@tuvix.js/loader';

const stop = onLifecycle('error', ({ name, error }) => {
  console.error(`Micro app "${name}" failed`, error);
});

// later
stop();
```

Sin este paquete, escucha el evento del DOM:

```ts
import type { LifecycleEvent } from '@tuvix.js/loader';

document.addEventListener('tuvix:mounted', (event) => {
  const { name, hydrated } = (event as LifecycleEvent).detail;
  console.log(name, hydrated);
});
```

### `hasServerMarkup`

```ts no-check
function hasServerMarkup(container: Element): boolean;
```

`true` cuando el elemento tiene un elemento hijo o un nodo de texto con texto que no sea solo espacios en blanco. Los comentarios y los espacios en blanco no cuentan. Los adaptadores lo usan para elegir entre hidratar y renderizar desde cero.

### Tipos

Las interfaces que implementa un módulo de micro app:

```ts
interface MicroAppModule {
  bootstrap?: () => void | Promise<void>;
  mount: (context: MountContext) => void | Promise<void>;
  unmount: (context: UnmountContext) => void | Promise<void>;
  update?: (context: UpdateContext) => void | Promise<void>;
  [key: string]: unknown;
}

interface MountContext {
  container: HTMLElement;
  props?: Record<string, unknown>;
  /** App name the orchestrator registered this module under */
  name?: string;
  /** The orchestrator's event bus */
  bus?: MicroAppBus;
}

interface UnmountContext {
  container: HTMLElement;
}

interface UpdateContext {
  props: Record<string, unknown>;
  /** Container to update; without it, adapters update every mounted instance */
  container?: HTMLElement;
}

interface MicroAppBus {
  on<T = unknown>(event: string, handler: (data: T) => void): () => void;
  once<T = unknown>(event: string, handler: (data: T) => void): () => void;
  emit<T = unknown>(event: string, data?: T): void;
  off<T = unknown>(event: string, handler: (data: T) => void): void;
}
```

El orquestador pasa `name` y `bus` en cada montaje. `bus` es la instancia de [`@tuvix.js/event-bus`](/es/packages/event-bus) del orquestador; `MicroAppBus` la describe de forma estructural, así que el loader no depende del paquete del event bus.

| Tipo | Significado |
| --- | --- |
| `Entry` | `string \| EntryConfig \| EntryLoader`. |
| `EntryConfig` | `{ scripts, styles?, type?, integrity? }`, consulta [Formas de entry](#entry-forms). |
| `EntryLoader` | `(context: EntryLoaderContext) => Promise<MicroAppModule \| { default: MicroAppModule }>`. |
| `EntryLoaderContext` | `{ signal: AbortSignal }`. |
| `ScriptType` | `'module' \| 'classic'`. |
| `MicroAppModule` | Objeto de ciclo de vida que exporta una micro app. |
| `MountContext`, `UnmountContext`, `UpdateContext` | Argumentos de `mount`, `unmount` y `update`. |
| `MicroAppBus` | `{ on, once, emit, off }`; `IEventBus` lo cumple. |
| `LoaderOptions` | `{ timeout?, retries?, retryDelay?, globals? }`. |
| `LoadResult` | `{ status, module, error, duration }`. |
| `LoadStatus` | `'idle' \| 'loading' \| 'loaded' \| 'error'`. |
| `CacheEntry` | `{ module, loadedAt, entry }`, un módulo en caché. |
| `PrefetchStrategy` | `'immediate' \| 'idle' \| 'hover' \| 'none'`. El loader no lo lee. |
| `ResourceOptions` | `{ integrity?, signal? }`, compartido por `loadScript` y `loadStyle`. |
| `LoadScriptOptions` | `ResourceOptions` más `type?`. |
| `LoadStyleOptions` | `ResourceOptions` más `timeout?`. |
| `PrefetchOptions` | `{ as?, type?, integrity? }`. |
| `LifecycleType` | `'mounted' \| 'unmounted' \| 'error'`. |
| `LifecycleDetail` | `{ name, container, hydrated, error? }`. |
| `LifecycleEvent` | `CustomEvent<LifecycleDetail>`. |

## Casos límite

- **Timeouts.** `timeout` cubre un intento completo. Cuando se cumple, el loader aborta el `signal` del intento, elimina las etiquetas del intento que ninguna otra carga espera, espera `retryDelay` y lo intenta de nuevo. El error dice `[Tuvix Loader] Loading "<name>" timed out after <timeout>ms`. Una función loader que ignora `signal` sigue ejecutándose en segundo plano; el loader deja de esperarla.
- **Reintentos.** Un `<script>` fallido se elimina antes del siguiente intento, así que un reintento añade una sola etiqueta nueva. Tras el último intento, `load()` resuelve con el último error.
- **Misma URL, varias apps.** Dos entries que incluyen el mismo script de vendor comparten una etiqueta y una descarga.
- **Entries en caché.** `load(name, otherEntry)` devuelve el módulo en caché bajo `name` e ignora `otherEntry`. Llama primero a `unload(name)` para cambiar de entry.
- **Los scripts de módulo se ejecutan una vez por URL.** Después de `unload(name)`, una app cuyo script `type: 'module'` llamó a `registerModule` no vuelve a cargarse desde la misma URL, porque el navegador no ejecuta un script de módulo dos veces. La carga falla con `no exports found`. Usa una entry con función loader o una URL nueva (un hash de contenido o `?v=2`).
- **`unload` elimina etiquetas de script compartidas.** Elimina todas las URLs de script de la entry, incluido un script de vendor que otra app también incluye. El código que ya se ejecutó permanece; una carga posterior que incluya la URL vuelve a añadir la etiqueta y un script clásico se ejecuta otra vez.
- **CORS.** El loader pone `crossorigin="anonymous"` en cada etiqueta. Un script o una hoja de estilos de otro origen necesita una cabecera `Access-Control-Allow-Origin`; si no, el navegador lo bloquea y la carga falla.
- **Globals UMD.** Cuando dos bundles UMD se cargan a la vez, el loader omite los globals que otra carga ya reclamó y asocia el resto al nombre de la app, sin distinguir mayúsculas ni puntuación (`my-app` coincide con `MyApp`). Si quedan varios candidatos, la carga falla con `several globals with mount() appeared while it loaded (<names>)`. `registerModule` evita tener que adivinar.
- **Ciclo de vida incompleto.** Un módulo sin `mount` o `unmount` falla con `[Tuvix Loader] Module "<name>" is missing required "unmount" function.`
- **Nada encontrado.** Una entry con URL cuyos scripts no registran ningún módulo ni definen ningún global UMD falla con `Module "<name>" loaded but no exports found`.
- **Varios contenedores.** El runtime lleva el estado de montaje por contenedor. Desmontar uno de dos contenedores mantiene `isMounted(name)` en `true`; `whenMounted(name)` devuelve el contenedor montado más antiguo.
- **Contenedores desconectados.** Cuando un framework host elimina el contenedor antes de que el adaptador informe `unmounted` o `error`, `emitLifecycle` despacha el evento en `document`. Escucha en `document` (el valor por defecto de `onLifecycle`) para recibir todos los eventos.
- **`whenMounted` ignora los errores.** Un evento `tuvix:error` no lo rechaza. Pasa un `signal` o escucha con `onLifecycle('error', ...)`.
- **Servidor.** Las funciones del runtime funcionan sin `window`; `emitLifecycle` omite el evento del DOM cuando `CustomEvent` no está definido. `ModuleLoader`, `loadScript`, `loadStyle` y `prefetchResource` necesitan `document`.

## Lo que no hace

- No descarga una página HTML para extraer sus scripts. Indica las URLs de scripts y estilos, o usa una función loader.
- No aísla JavaScript. Los scripts se ejecutan en el ámbito global de la página. Para aislar CSS usa la opción `sandbox` del orquestador o [`@tuvix.js/sandbox`](/es/packages/sandbox).
- No monta apps. A `module.mount` lo llamas tú o el orquestador.
- No mantiene una caché entre cargas de página. De eso se encarga la caché HTTP del navegador.
- No lee `PrefetchStrategy`; el ajuste `prefetch` del orquestador decide cuándo llamar a `prefetch`.

## Migrar desde 0.4

- `LoaderOptions.fetch` y `EntryConfig.html` ya no existen. El loader nunca los leía. Elimínalos de tu configuración.
- `loadScript(url, integrity)` y `loadStyle(url, timeoutMs)` siguen funcionando. La forma con objeto de opciones añade `type` y `signal`:

  ```ts
  import { loadScript } from '@tuvix.js/loader';

  // 0.4
  await loadScript('/vendor.js', 'sha384-abc');
  // 0.5
  await loadScript('/vendor.js', { integrity: 'sha384-abc', type: 'classic' });
  ```

- La salida ES de Vite que termina en `.js` se cargaba como script clásico en 0.4 y fallaba en su primera sentencia `import`. Pon `type: 'module'` en la entry.
- Una entry `type: 'module'` ya no vuelve a cargarse desde la misma URL después de `unload`. Usa una función loader o una URL nueva.
- `load()` para un módulo en caché informa la `duration` real en lugar de `0`.
- La versión 0.4 de esta página mostraba `loader.load(url)`, `result.app`, `onLoadStart`, `cache` y `loader.clear()`. Ninguno de ellos existía. Usa `load(name, entry)`, `result.module`, `unload(name)` y `clearCache()`.

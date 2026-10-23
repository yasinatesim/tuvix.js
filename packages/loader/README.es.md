# @tuvix.js/loader

> Carga bundles de micro apps por nombre desde URLs de scripts o funciones loader, con reintentos, timeouts, un registro de módulos compartido y eventos de ciclo de vida.

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentación completa: [tuvix.js.org/packages/loader](https://tuvix.js.org/packages/loader).

## Instalación

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

`@tuvix.js/core` crea un `ModuleLoader` por ti y le pasa `createOrchestrator({ loader })`. Importa este paquete cuando escribas una micro app o un adaptador, cuando quieras esperar a que otra app se monte o cuando cargues apps sin el orquestador.

## Inicio rápido

La micro app, compilada en `https://cdn.example.com/dashboard/main.js`:

```ts
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

La shell:

```ts
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
  console.error(result.error);
}
```

`load()` nunca lanza. Un fallo se resuelve con `status: 'error'`, `module: null` y el último error.

## Entradas

`Entry` es uno de estos:

- una URL en forma de string, que se interpreta como `{ scripts: [url] }`
- un `EntryConfig`
- una función loader como `() => import('./dashboard')`. Recibe `{ signal }`, que se aborta al agotarse el timeout, y puede resolverse con el módulo, con `{ default: module }` o con cualquier valor después de llamar a `registerModule(name, module)`.

| Opción | Tipo | Por defecto | Significado |
| --- | --- | --- | --- |
| `scripts` | `string[]` | obligatorio | URLs de scripts, que se ejecutan una tras otra. |
| `styles` | `string[]` | `[]` | URLs de hojas de estilo, que se cargan en paralelo con los scripts. |
| `type` | `'module' \| 'classic'` | se infiere por URL | `.mjs`, `.mts`, `.ts`, `.tsx` y `.jsx` se cargan como módulos, el resto como clásicos. Usa `'module'` para la salida `.js` de Vite. |
| `integrity` | `Record<string, string>` | ninguno | Hashes SRI indexados por URL. |

## API

### `ModuleLoader` y `createLoader`

```ts no-check
new ModuleLoader(options?: LoaderOptions);
createLoader(options?: LoaderOptions): ModuleLoader;
```

| Opción | Tipo | Por defecto | Significado |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | ms por intento, que cubren todos los scripts y hojas de estilo. `0` lo desactiva. |
| `retries` | `number` | `2` | Intentos adicionales después del primer fallo. |
| `retryDelay` | `number` | `1000` | ms entre intentos. |
| `globals` | `Record<string, unknown>` | `{}` | Se asignan a `window` antes de cada intento de una entrada URL. |

| Método | Comportamiento |
| --- | --- |
| `load(name, entry): Promise<LoadResult>` | Carga, valida `mount`/`unmount` y guarda en caché por nombre. Primero resuelve el módulo desde `registerModule(name)` y después desde un nuevo global UMD con `mount`. Un nombre en caché ignora `entry`; un nombre que ya se está cargando devuelve la misma promesa. |
| `prefetch(entry)` | `<link rel="modulepreload">` para scripts de módulo, `<link rel="prefetch">` en otro caso. Omite las funciones loader. |
| `removeStyles(name)` | Elimina las hojas de estilo de la app salvo que otra app en caché las use. El siguiente `load(name)` las vuelve a añadir. |
| `unload(name)` | Elimina los estilos y las etiquetas de script, descarta la entrada de la caché y anula el registro del módulo que resolvió este loader. |
| `clearCache()` | `unload` para cada app en caché. |
| `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()` | Leen la caché. `getStatus` devuelve `'idle'`, `'loading'` o `'loaded'`. |

### `normalizeEntry`

```ts no-check
normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

### `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource`

```ts no-check
loadScript(url: string, options?: { type?, integrity?, signal? } | string): Promise<void>;
loadStyle(url: string, options?: { timeout?, integrity?, signal? } | number): Promise<void>;
removeScript(url: string): void;
removeStyle(url: string): void;
prefetchResource(url: string, options?: { as?, type?, integrity? }): void;
```

Una etiqueta por URL, compartida por las llamadas concurrentes. Una carga fallida elimina su etiqueta y rechaza con `[Tuvix Loader] Failed to load script: <url>`. Una llamada abortada elimina la etiqueta cuando ninguna otra llamada la espera. `loadStyle` agota el timeout tras `10000` ms por defecto. Cada etiqueta recibe `crossorigin="anonymous"`. Un string como segundo argumento de `loadScript` es el hash de integridad; un número en `loadStyle` es el timeout (formas de 0.4).

### Registro de runtime y ciclo de vida

El estado vive en `window.__TUVIX_RUNTIME__`, así que las micro apps que empaquetan su propia copia lo comparten. Sin `window`, vive en el módulo.

| Export | Comportamiento |
| --- | --- |
| `registerModule(name, module)` | Publica un módulo para el loader. Los adaptadores y `defineMicroApp` lo llaman. |
| `unregisterModule(name)` | Lo elimina. |
| `getRegisteredModule(name)` | Lo devuelve o devuelve `undefined`. |
| `emitLifecycle(type, { name, container, hydrated, error? })` | Despacha un `CustomEvent` `tuvix:mounted`, `tuvix:unmounted` o `tuvix:error` que burbujea y es composed sobre `container`, o sobre `document` cuando el contenedor está desconectado, y registra los contenedores montados. Los adaptadores y `defineMicroApp` lo llaman. |
| `isMounted(name)` | `true` mientras cualquier contenedor de la app esté montado. |
| `whenMounted(name, { signal? })` | Se resuelve con el `LifecycleDetail` del primer montaje, o de inmediato con el contenedor más antiguo que siga montado; rechaza con `signal.reason` al abortar. |
| `onLifecycle(type, handler, target = document)` | Escucha `tuvix:<type>`; devuelve una función para quitar el listener. |
| `hasServerMarkup(el)` | `true` si hay un elemento hijo o texto que no sea solo espacios en blanco. |

```ts
import { onLifecycle, whenMounted } from '@tuvix.js/loader';

onLifecycle('error', ({ name, error }) => console.error(name, error));
const { hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log('header hydrated:', hydrated);
```

### Tipos

`Entry`, `EntryConfig`, `EntryLoader`, `EntryLoaderContext`, `ScriptType`, `MicroAppModule`, `MountContext` (`container`, `props?`, `name?`, `bus?`), `UnmountContext`, `UpdateContext` (`props`, `container?`), `MicroAppBus` (`on`, `once`, `emit`, `off`; `IEventBus` lo cumple), `LoaderOptions`, `LoadResult`, `LoadStatus`, `CacheEntry`, `PrefetchStrategy` (el loader no lo lee), `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent`.

## Casos límite

- Un timeout aborta el `signal` del intento, elimina sus etiquetas y reintenta tras `retryDelay`. Una función loader que ignora `signal` sigue ejecutándose; el loader deja de esperarla.
- Después de `unload(name)`, un script `type: 'module'` que se registró a sí mismo no se vuelve a ejecutar desde la misma URL. Usa una función loader o una URL nueva.
- `unload` elimina todas las URLs de scripts de la entrada, incluidos los scripts de vendor que otras apps también listan.
- Dos bundles UMD que se cargan a la vez: el loader asocia los nuevos globales con el nombre de la app y falla indicando los nombres candidatos cuando no puede distinguirlos.
- Los scripts y estilos de otro origen necesitan `Access-Control-Allow-Origin`.
- El estado de montaje es por contenedor: desmontar uno de dos contenedores mantiene `isMounted(name)` en `true`. `whenMounted` no rechaza ante `tuvix:error`.
- El evento de ciclo de vida de un contenedor desconectado se dispara en `document` con `detail.container` todavía asignado. `onLifecycle` sobre `document` (el valor por defecto) recibe cada evento una vez.

## Lo que no hace

- No descarga páginas HTML ni extrae sus scripts.
- No aísla el JavaScript; los scripts se ejecutan en el ámbito global de la página.
- No monta apps ni enruta.

## Licencia

MIT

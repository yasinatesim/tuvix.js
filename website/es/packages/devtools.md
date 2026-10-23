---
title: '@tuvix.js/devtools'
---

<PackageHeader
  name="@tuvix.js/devtools"
  title="DevTools"
  description="Overlay de depuración en la página para un orquestador. Lista las micro apps registradas y montadas, la ruta actual y el tráfico más reciente del event bus."
  icon="🛠️"
  npm="true"
/>

## Instalación

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## Cuándo usarlo

Instálalo en desarrollo cuando necesites ver qué micro apps conoce el orquestador, cuáles están montadas en este momento y qué eventos pasan por el bus. El overlay se sitúa en la esquina inferior derecha de la página y se actualiza una vez por segundo.

Recurre a las DevTools de tu navegador o a una extensión de devtools de tu framework cuando necesites árboles de componentes, tiempos de red o payloads de eventos en una interfaz. Este paquete muestra nombres de apps, una cadena de ruta y nombres de eventos con una marca de tiempo. Los payloads se quedan en el logger, que puedes leer desde la consola.

## Inicio rápido

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
orchestrator.register({ name: 'settings', entry: '/apps/settings.js', container: '#main' });

await orchestrator.start();
```

Abre `/dashboard` y el overlay lista `dashboard` con un punto verde y `settings` con uno blanco. La fila Route muestra `/dashboard`, y la lista Events muestra los eventos `tuvix:app:status-change` y `tuvix:app:mount` del montaje de dashboard.

## Qué muestra el panel

`installDevTools` añade un `<div id="tuvix-devtools">` a `document.body`. Contiene un botón redondo para mostrar u ocultar el panel (fijo a 12px de la esquina inferior derecha, `z-index: 99999`) y, encima, un panel de 280px de ancho con tres secciones:

| Sección | Origen | Contenido |
| --- | --- | --- |
| Apps | `orchestrator.getRegisteredApps()` y `getMountedApps()` | Una fila por cada app registrada. Un punto verde indica que su estado es `mounted`. Un punto blanco cubre cualquier otro estado, incluidos `loading` y `error`. |
| Route | `orchestrator.getRouter()?.currentPath` | La ruta actual del router: sin el prefijo `base`, con la query string incluida. Muestra `/` cuando el orquestador no tiene router. |
| Events | `EventLogger` conectado a `orchestrator.getEventBus()` | Los 10 eventos más recientes, del más nuevo al más antiguo. Cada fila muestra la hora local, un guion y el nombre del evento. |

Por defecto el orquestador usa `getGlobalBus()`, así que la lista Events también muestra los eventos que tus micro apps emiten en el bus compartido, junto a los eventos propios del orquestador:

| Evento | Se emite cuando |
| --- | --- |
| `tuvix:app:registered` | `register()` añade una app |
| `tuvix:app:bootstrap`, `tuvix:app:mount`, `tuvix:app:unmount` | Una app pasa por ese paso del ciclo de vida |
| `tuvix:app:error` | Falla la carga, la inicialización o el montaje de una app |
| `tuvix:app:status-change` | Cambia el estado de una app. Espera varios por cada montaje. |
| `tuvix:route:change` | El router navega |
| `tuvix:started`, `tuvix:destroyed` | Terminan `start()` y `destroy()` |

El panel también expone `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`. Ejecuta `__TUVIX_DEVTOOLS__.logger.getEntries()` en la consola del navegador para leer los payloads que el panel no imprime.

## API

### `installDevTools`

```ts
import type { DevToolsOptions } from '@tuvix.js/devtools';
import type { IEventBus } from '@tuvix.js/core';

declare function installDevTools(
  orchestrator: {
    getRegisteredApps(): string[];
    getMountedApps(): string[];
    getEventBus(): IEventBus;
    getRouter(): { currentPath: string } | null;
  },
  options?: DevToolsOptions
): () => void;
```

El primer argumento acepta cualquier objeto con esos cuatro métodos. Un `Orchestrator` de `@tuvix.js/core` o de `tuvix.js` encaja.

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | Número máximo de eventos que guarda el logger. El panel imprime 10; el resto se puede leer a través de `__TUVIX_DEVTOOLS__.logger`. |
| `autoOpen` | `boolean` | `true` | `false` monta el panel oculto. El botón sigue visible y lo abre. |
| `updateInterval` | `number` | `1000` | Milisegundos entre actualizaciones del panel. |

En cada llamada:

1. crea un `DevToolsPanel` y un `EventLogger(maxLogEntries)`,
2. conecta el logger a `orchestrator.getEventBus()` con `onAny`,
3. monta el panel y lo oculta cuando `autoOpen` es `false`,
4. inicia un `setInterval` que lee el orquestador y llama a `panel.update()`,
5. asigna `window.__TUVIX_DEVTOOLS__`.

Devuelve una función de limpieza que borra el intervalo, desconecta el logger, elimina el panel y borra `window.__TUVIX_DEVTOOLS__`.

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { installDevTools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator();
const removeDevTools = installDevTools(orchestrator, {
  autoOpen: false,
  updateInterval: 250,
  maxLogEntries: 500,
});

// Later, for example in a hot-module-replacement dispose hook:
removeDevTools();
await orchestrator.destroy();
```

### `EventLogger`

```ts no-check
class EventLogger {
  constructor(maxEntries?: number); // default 200
  attach(bus: IEventBus): void;
  detach(): void;
  getEntries(): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>;
  getRecent(count?: number): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>; // default 20
  clear(): void;
}
```

`EventLogger` registra todos los eventos de un bus mediante `bus.onAny`. Cada entrada contiene `timestamp` (`Date.now()` en el momento de la emisión), `event` (el nombre) y `data` (el payload tal como se emitió, sin clonar). Cuando el registro supera `maxEntries`, el logger descarta las entradas más antiguas.

| Método | Comportamiento |
| --- | --- |
| `attach(bus)` | Se suscribe a todos los eventos de `bus`. Lanza un error cuando el bus está destruido. |
| `detach()` | Cancela la suscripción. Las entradas registradas se conservan. |
| `getEntries()` | Devuelve el registro completo, de la más antigua a la más reciente. |
| `getRecent(count)` | Devuelve las últimas `count` entradas, de la más antigua a la más reciente. |
| `clear()` | Vacía el registro y mantiene la suscripción. |

Úsalo sin el panel para hacer aserciones sobre el tráfico del bus en un test o para volcar los eventos de una página:

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);

bus.emit('cart:add', { sku: 'A-1' });

console.log(logger.getRecent(1)); // [{ timestamp: 1761..., event: 'cart:add', data: { sku: 'A-1' } }]
logger.detach();
```

### `DevToolsPanel`

```ts no-check
class DevToolsPanel {
  constructor();
  mount(): void;
  unmount(): void;
  toggle(): void;
  update(state: {
    registeredApps: string[];
    mountedApps: string[];
    currentRoute: string;
    events: Array<{ timestamp: number; event: string }>;
  }): void;
}
```

`DevToolsPanel` es la parte DOM del overlay, sin ningún sondeo periódico. Tú llamas a `update()` con el estado que quieres mostrar.

| Método | Comportamiento |
| --- | --- |
| `mount()` | Añade `#tuvix-devtools` a `document.body`, abierto. Una segunda llamada sobre la misma instancia no hace nada. |
| `unmount()` | Elimina el elemento. |
| `toggle()` | Muestra u oculta el cuerpo del panel. El botón se mantiene. No hace nada antes de `mount()`. |
| `update(state)` | Reconstruye las secciones Apps, Route y Events. Imprime los últimos 10 elementos de `events`, del más nuevo al más antiguo. No hace nada antes de `mount()`. |

```ts
import { DevToolsPanel } from '@tuvix.js/devtools';

const panel = new DevToolsPanel();
panel.mount();
panel.update({
  registeredApps: ['header', 'cart'],
  mountedApps: ['header'],
  currentRoute: '/checkout',
  events: [{ timestamp: Date.now(), event: 'cart:open' }],
});
```

### Tipos

| Nombre | Significado |
| --- | --- |
| `DevToolsOptions` | Opciones de `installDevTools`: `maxLogEntries`, `autoOpen`, `updateInterval`. |

La forma del orquestador y la forma de las entradas del registro no se exportan. Usa `Parameters<typeof installDevTools>[0]` y `ReturnType<EventLogger['getEntries']>[number]` cuando las necesites como tipos.

## Builds de producción

El paquete declara `"sideEffects": false`, pero un `import { installDevTools } from '@tuvix.js/devtools'` estático que tu código llama acaba igualmente en el bundle. Cárgalo detrás de un flag de build con un `import()` dinámico, como en el inicio rápido. Los bundlers reemplazan `process.env.NODE_ENV` por una cadena y eliminan la rama muerta y su chunk. En una app de Vite puedes comprobar `import.meta.env.DEV` en su lugar.

Dejar el overlay activo en producción te cuesta un `setInterval` que reconstruye tres secciones del DOM cada segundo, una suscripción a todos los eventos del bus y una variable global que entrega el orquestador a cualquier script de la página.

## Casos límite

- Instálalo antes de `register()` y `start()`. El logger solo ve los eventos emitidos después de `attach`, y el panel queda vacío hasta la primera actualización, `updateInterval` milisegundos después de la llamada.
- `installDevTools` necesita `document` y `window`. Llamarlo durante el renderizado en el servidor lanza un `ReferenceError`. Llámalo desde código que solo se ejecuta en el cliente.
- Con `connectRouter()` y sin la opción `router`, `getRouter()` devuelve `null` y la fila Route muestra `/`.
- `getMountedApps()` solo cuenta el estado `mounted`. Una app en `mounting` o `error` recibe un punto blanco, y el panel nunca imprime el nombre del estado.
- Un bus privado (`createOrchestrator({ eventBus: {...} })`) se destruye con `orchestrator.destroy()`. Instalarlo después de eso lanza un error desde `onAny`. Con el bus global por defecto, el logger sigue registrando después de `destroy()` hasta que llamas a la función de limpieza.
- Cada llamada crea un panel nuevo. Dos llamadas ponen en la página dos overlays con los mismos ids de elemento, y la segunda llamada sobrescribe `window.__TUVIX_DEVTOOLS__`. La primera función de limpieza borra entonces la variable global que asignó la segunda llamada.
- Llamar a `EventLogger.attach()` dos veces sobre la misma instancia reemplaza la función de cancelación guardada. `detach()` elimina entonces solo la segunda suscripción.
- Cuando el registro alcanza `maxLogEntries`, el logger copia el array con cada evento nuevo. Mantén `maxLogEntries` en los cientos en páginas con buses muy activos.
- El panel escribe los nombres de apps, las rutas y los nombres de eventos con `textContent`, así que el marcado dentro de un nombre de evento se muestra como texto.

## Lo que no hace

- No tiene atajo de teclado ni opciones de posición, tamaño o tema. El overlay siempre se sitúa abajo a la derecha con estilos en línea.
- No muestra en la interfaz payloads de eventos, URLs de entrada, estado de la caché del loader ni tiempos de montaje. Lee los payloads desde `__TUVIX_DEVTOOLS__.logger.getEntries()`.
- No hay extensión de navegador ni conexión con las devtools de React, Vue, Svelte o Angular.
- No hay viaje en el tiempo ni reproducción de eventos. El logger registra y nunca vuelve a emitir.
- No se elimina automáticamente en builds de producción. Tú condicionas el import.

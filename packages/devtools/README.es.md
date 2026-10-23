# @tuvix.js/devtools

> Overlay de depuración dentro de la página que muestra las apps registradas y montadas de un orquestador, su ruta actual y el tráfico reciente del event bus

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Instalación

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## Inicio rápido

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/dashboard/*', app: 'dashboard' }] },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
await orchestrator.start();
```

Aparece un botón redondo en la esquina inferior derecha. El panel que hay encima se actualiza cada segundo y muestra:

- **Apps**: todas las apps registradas, con un punto verde cuando su estado es `mounted` y un punto blanco en otro caso.
- **Route**: `orchestrator.getRouter()?.currentPath`, o `/` si no hay router.
- **Events**: los 10 eventos más recientes del bus (hora y nombre), del más nuevo al más antiguo.

El overlay también define `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`. Ejecuta `__TUVIX_DEVTOOLS__.logger.getEntries()` en la consola para leer los payloads de los eventos.

## API

### `installDevTools(orchestrator, options?): () => void`

Acepta cualquier objeto con `getRegisteredApps()`, `getMountedApps()`, `getEventBus()` y `getRouter()`, como un `Orchestrator`. Devuelve una función de limpieza que detiene el sondeo, desconecta el logger, elimina el panel y borra la variable global.

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | Número máximo de eventos que guarda el logger |
| `autoOpen` | `boolean` | `true` | `false` monta el panel oculto; el botón de alternancia lo abre |
| `updateInterval` | `number` | `1000` | Milisegundos entre actualizaciones del panel |

### `EventLogger`

`new EventLogger(maxEntries = 200)` registra todos los eventos de un bus mediante `onAny`. Las entradas son `{ timestamp, event, data }`.

| Método | Comportamiento |
| --- | --- |
| `attach(bus)` | Se suscribe a todos los eventos. Lanza un error si el bus está destruido. |
| `detach()` | Cancela la suscripción y conserva las entradas |
| `getEntries()` | El log completo, del más antiguo al más nuevo |
| `getRecent(count = 20)` | Las últimas `count` entradas, de la más antigua a la más nueva |
| `clear()` | Vacía el log |

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);
bus.emit('cart:add', { sku: 'A-1' });
console.log(logger.getRecent(1)); // [{ timestamp, event: 'cart:add', data: { sku: 'A-1' } }]
```

### `DevToolsPanel`

El DOM del overlay sin sondeo. Tú le pasas el estado.

| Método | Comportamiento |
| --- | --- |
| `mount()` | Añade `#tuvix-devtools` a `document.body`, abierto. Una segunda llamada no hace nada. |
| `unmount()` | Lo elimina |
| `toggle()` | Muestra u oculta el cuerpo del panel; el botón se mantiene |
| `update({ registeredApps, mountedApps, currentRoute, events })` | Vuelve a renderizar las tres secciones |

### `DevToolsOptions`

Tipo de las opciones de `installDevTools` descritas arriba.

## Casos límite

- El logger solo ve los eventos emitidos después de `installDevTools`, y el panel se llena en la primera actualización, `updateInterval` ms más tarde.
- Solo navegador: `installDevTools` lanza un `ReferenceError` durante el renderizado en el servidor.
- Una app en `mounting` o `error` muestra un punto blanco; el panel no muestra los nombres de estado.
- Con el bus global por defecto, el logger sigue registrando después de `orchestrator.destroy()` hasta que llamas a la función de limpieza.
- Dos llamadas a `installDevTools` crean dos overlays con los mismos ids de elemento, y la segunda sobrescribe `window.__TUVIX_DEVTOOLS__`.

## Lo que no hace

- No tiene atajo de teclado ni opciones de posición, tamaño o tema.
- No muestra en la interfaz payloads, URLs de entrada, estado del loader ni tiempos.
- No tiene extensión de navegador ni enlace a las devtools del framework.
- No se elimina automáticamente en producción: protege la importación con un flag de build, como en el inicio rápido.

Documentación completa: [tuvix.js.org/packages/devtools](https://tuvix.js.org/packages/devtools)

## Licencia

MIT

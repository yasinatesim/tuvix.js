# Hooks de ciclo de vida

El orquestador lleva cada app registrada por una secuencia fija de hooks y estados. Esta página cubre los hooks que implementa tu módulo, los estados que puede leer la shell y lo que ocurre ante errores y navegaciones rápidas. Para saber desde fuera cuándo una app está en la página, usa los [Eventos de ciclo de vida](/es/guide/lifecycle-events).

## Orden de los hooks

```text
register()
  └─ first activation: load entry → bootstrap() → mount()
       ├─ updateAppProps() while mounted → update()
       └─ deactivation → unmount()
  └─ next activation: mount()   (module cached, no bootstrap)
```

El orquestador espera a cada hook. Nunca llama a `mount` en una app que todavía se está montando, y nunca llama a `unmount` mientras `mount` sigue en ejecución: el desmontaje espera a que termine el montaje.

## bootstrap

Se ejecuta una vez por cada módulo cargado, después de que cargue el entry y antes del primer `mount`. Úsalo para trabajo que deba sobrevivir a los remontajes, como leer la configuración.

```ts
import { defineMicroApp } from '@tuvix.js/core';

let config: { apiUrl: string } | undefined;

export default defineMicroApp({
  name: 'reports',
  async bootstrap() {
    const response = await fetch('/reports/config.json');
    config = (await response.json()) as { apiUrl: string };
  },
  mount({ container }) {
    container.textContent = `API: ${config?.apiUrl ?? 'unknown'}`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Si `bootstrap` lanza un error, la app pasa al estado `error` y el montaje falla. El siguiente intento de montaje vuelve a llamar a `bootstrap`. Tras una ejecución correcta, los remontajes lo omiten.

## mount

Se ejecuta cada vez que la app pasa a estar activa, o cuando llamas a `mountApp(name)`. El contexto contiene:

| Campo | Valor |
| --- | --- |
| `container` | El elemento en el que renderizar. En las apps con `sandbox: true`, un elemento dentro del shadow root. |
| `props` | Las props registradas fusionadas con cada llamada a `updateAppProps`. |
| `name` | El nombre registrado de la app. |
| `bus` | El event bus del orquestador. |

`mountApp(name)` se resuelve cuando `mount` termina y se rechaza con el error de carga o de montaje.

## update

Se ejecuta cuando la shell llama a `updateAppProps(name, props)` mientras la app está montada:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('reports', { range: '7d' });
```

El contexto contiene las `props` fusionadas y el `container`. Si falta `update` o la app no está montada, el orquestador guarda las props y las pasa al siguiente `mount`. Nunca vuelve a montar una app porque cambien sus props.

`updateAppProps` espera primero a un montaje pendiente, para que la actualización llegue a la nueva instancia. Un `unmount` que llega durante una actualización espera a que esta termine.

## unmount

Se ejecuta cuando la app pasa a estar inactiva, y en `unmountApp(name)`, `unregister(name)` y `destroy()`. Elimina todo lo que creó `mount`: raíces del framework, listeners, timers, suscripciones al bus.

Después de `unmount`, el orquestador elimina de `document.head` las hojas de estilo del entry de la app. El siguiente montaje las vuelve a añadir y espera a que carguen.

## Estado de la app

```ts
import { createOrchestrator, type AppStatus } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
const status: AppStatus | null = orchestrator.getAppStatus('reports');
// 'registered' | 'bootstrapping' | 'bootstrapped' | 'mounting' | 'mounted'
// | 'updating' | 'unmounting' | 'unmounted' | 'error' | null (not registered)
```

| Método | Devuelve |
| --- | --- |
| `getAppStatus(name)` | El estado, o `null` para un nombre desconocido. |
| `getMountedApps()` | Los nombres con estado `mounted`. |
| `getRegisteredApps()` | Todos los nombres registrados. |

## Errores y fallback

Cuando falla la carga, `bootstrap` o `mount`, el orquestador:

1. escribe el HTML de `fallback` de la app en su contenedor, si definiste uno;
2. pone el estado `error`;
3. emite `OrchestratorEvent.APP_ERROR` (`tuvix:app:error`) en el bus con `{ name, error, phase }`;
4. llama a `onError(error, name)`;
5. rechaza `mountApp`. Un montaje fallido durante un cambio de ruta se registra con `console.error` en su lugar, y las demás apps se montan igualmente.

Un `update` o `unmount` fallido ejecuta los pasos 2 a 4 y rechaza `updateAppProps` o `unmountApp`; no escribe HTML de fallback. `phase` es `'load'` (que incluye la resolución del contenedor), `'bootstrap'`, `'mount'`, `'update'` o `'unmount'`.

```ts
import { createOrchestrator, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.getEventBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, phase, error }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

El siguiente cambio de ruta que active una app en estado `error` intenta montarla de nuevo.

## Navegación rápida

Los cambios de ruta se reconcilian de uno en uno. Las apps inactivas se desmontan antes de que se monten las activas. Cuando las rutas llegan más rápido de lo que se montan las apps:

- solo la ruta en cola más reciente se ejecuta a continuación;
- una app que pasa a estar inactiva mientras carga su entry omite su montaje;
- una app que pasa a estar inactiva mientras se ejecuta `mount` se desmonta en cuanto `mount` termina.

Así, A → B → A en rápida sucesión termina con solo A montada, y ninguna app renderiza en un contenedor que otra app todavía ocupa.

## Hooks a nivel de shell

```ts
import { createOrchestrator, OrchestratorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  onError: (error, name) => console.error(`[${name}]`, error),
  onStatusChange: (name, status) => console.debug(`[${name}] ${status}`),
});

const bus = orchestrator.getEventBus();
bus.on<{ name: string }>(OrchestratorEvent.APP_MOUNT, ({ name }) => {
  console.log('mounted', name);
});
bus.on<{ name: string }>(OrchestratorEvent.APP_UNMOUNT, ({ name }) => {
  console.log('unmounted', name);
});
bus.on<{ to: string }>(OrchestratorEvent.ROUTE_CHANGE, ({ to }) => {
  console.log('route', to);
});
```

| Evento | Payload | Se emite |
| --- | --- | --- |
| `tuvix:app:registered` | `{ name }` | `register()` |
| `tuvix:app:bootstrap` | `{ name }` | después de `bootstrap` |
| `tuvix:app:mount` | `{ name }` | después de `mount` |
| `tuvix:app:unmount` | `{ name }` | después de `unmount` |
| `tuvix:app:error` | `{ name, error, phase }` | falló la carga, bootstrap, mount, update o unmount |
| `tuvix:app:status-change` | `{ name, status }` | en cada cambio de estado |
| `tuvix:route:change` | `{ from, to, fromRoute, toRoute }` | solo en navegaciones del router integrado |
| `tuvix:started` | `{}` | al final de `start()` |
| `tuvix:destroyed` | `{}` | al final de `destroy()` |

Estos eventos del bus provienen del orquestador. Los eventos DOM `tuvix:mounted` de [Eventos de ciclo de vida](/es/guide/lifecycle-events) provienen de los adaptadores y de `defineMicroApp`, y también se disparan para islas montadas sin orquestador.

## Desmontaje completo

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.destroy();
```

`destroy()` espera a una reconciliación en curso, desmonta todas las apps, detiene el router, las suscripciones de `connectRouter`, la precarga y el observador del viewport, y vacía la caché del loader. Destruye un event bus privado y deja vivo el bus global. Llamarlo dos veces es seguro. Después, `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` y `connectRouter` lanzan un error; crea un nuevo orquestador en su lugar.

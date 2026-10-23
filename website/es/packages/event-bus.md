---
title: '@tuvix.js/event-bus'
---

<PackageHeader
  name="@tuvix.js/event-bus"
  title="Event bus"
  description="Bus publish/subscribe síncrono para mensajes entre micro apps. Un único bus global por página, compartido por todas las copias del paquete incluidas en los bundles."
  icon="📡"
  npm="true"
/>

## Instalación

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## Cuándo usarlo

Las micro apps de una página necesitan comunicarse cosas: la app del carrito anuncia `cart:updated` y el header muestra el nuevo total de artículos. El event bus les permite hacerlo por nombre de evento, sin importarse entre sí.

El orquestador de `@tuvix.js/core` usa `getGlobalBus()` y se lo entrega a cada app como `bus` en el contexto de montaje. Dentro de una micro app, usa ese `bus` o llama a `getGlobalBus()`; ambos devuelven la misma instancia. Crea un bus privado con `createEventBus()` para tests o para mensajes que se quedan dentro de una app.

Elige otra opción para el estado que un suscriptor tardío debe poder leer (un store, o la URL), y para mensajes entre pestañas o iframes (`BroadcastChannel`, `postMessage`).

## Inicio rápido

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

interface CartUpdated {
  itemCount: number;
  total: number;
}

const bus = getGlobalBus();

// header app
const stop = bus.on<CartUpdated>('cart:updated', ({ itemCount }) => {
  document.querySelector('#cart-count')!.textContent = String(itemCount);
});

// cart app
bus.emit<CartUpdated>('cart:updated', { itemCount: 3, total: 59.9 });

// header app, on unmount
stop();
```

Una micro app que monta el orquestador recibe el bus en su contexto de montaje:

```ts
import { registerModule } from '@tuvix.js/loader';

let stop: (() => void) | undefined;

registerModule('header', {
  mount({ container, bus }) {
    stop = bus?.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
      container.textContent = `Cart: ${itemCount}`;
    });
  },
  unmount({ container }) {
    stop?.();
    container.replaceChildren();
  },
});
```

## API

### `EventBus`

```ts no-check
class EventBus implements IEventBus {
  constructor(options?: EventBusOptions);
}
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | Número de listeners por evento a partir del cual `on` muestra un `console.warn` al añadir uno más, una vez por nombre de evento durante toda la vida del bus. El listener se añade de todos modos. `0` desactiva el aviso. El aviso ignora `debug`. |
| `debug` | `boolean` | `false` | Registra cada suscripción, cancelación de suscripción y emisión a través de `logger`. |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | Recibe los mensajes de depuración, cada uno con el prefijo `[Tuvix EventBus]`. El aviso de `maxListeners` no pasa por él. |

```ts
import { EventBus } from '@tuvix.js/event-bus';

const bus = new EventBus({ debug: true, maxListeners: 20 });
```

#### `on(event, handler)`

```ts no-check
on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

Suscribe `handler` a `event` y devuelve una función que cancela la suscripción. `T` tipa el payload; el bus no lo comprueba en runtime.

#### `once(event, handler)`

```ts no-check
once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

Como `on`, pero elimina el handler antes de su primera llamada. Para cancelar antes de que se dispare el evento, llama a la función devuelta. `off(event, handler)` no lo encuentra, porque el bus guarda un wrapper.

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
const cancel = bus.once('app:ready', () => console.log('ready'));
cancel();
```

#### `emit(event, data?)`

```ts no-check
emit<T = unknown>(event: string, data?: T): void;
```

Llama a todos los handlers de `event` en el orden de suscripción y después a todos los handlers de `onAny`, todo antes de que `emit` retorne. Un handler que lanza un error se registra con `console.error('[Tuvix EventBus] Error in handler for "<event>":', error)` y los handlers restantes se siguen ejecutando.

#### `off(event, handler)`

```ts no-check
off<T = unknown>(event: string, handler: EventHandler<T>): void;
```

Elimina un handler. Los eventos y handlers desconocidos se ignoran.

#### `offAll(event?)`

```ts no-check
offAll(event?: string): void;
```

Con `event`, elimina todos los handlers de ese evento. Sin él, elimina todos los handlers de todos los eventos y todos los handlers de `onAny`.

#### `onAny(handler)`

```ts no-check
onAny<T = unknown>(handler: WildcardHandler<T>): Unsubscribe;
```

Se suscribe a todos los eventos. El handler recibe `(eventName, data)`. Úsalo para logging y devtools.

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const stopLogging = getGlobalBus().onAny((event, data) => {
  console.debug('[bus]', event, data);
});
```

#### `offAny(handler)`

```ts no-check
offAny<T = unknown>(handler: WildcardHandler<T>): void;
```

Elimina un handler de `onAny`.

#### `hasListeners(event)`, `listenerCount(event)`, `eventNames()`

```ts no-check
hasListeners(event: string): boolean;
listenerCount(event: string): number;
eventNames(): string[];
```

Inspeccionan las suscripciones. Los handlers de `onAny` no se cuentan, y `eventNames()` solo lista los eventos con al menos un handler.

#### `destroy()`

```ts no-check
destroy(): void;
```

Elimina todos los handlers y marca el bus como destruido. A partir de ahí, `on`, `once`, `emit` y `onAny` lanzan `[Tuvix EventBus] Cannot use a destroyed EventBus instance. Create a new one.` El orquestador destruye un bus privado (uno que creó a partir de las opciones de `eventBus`) en `destroy()` y deja vivo el bus global.

### `createEventBus`

```ts no-check
function createEventBus(options?: EventBusOptions): IEventBus;
```

Devuelve `new EventBus(options)` tipado como `IEventBus`. Acepta las opciones de la tabla anterior.

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
bus.on<string>('hello', (name) => console.log(`Hello, ${name}!`));
bus.emit('hello', 'World');
```

### `getGlobalBus`

```ts no-check
function getGlobalBus(options?: EventBusOptions): IEventBus;
```

Devuelve el bus compartido de la página y lo crea en la primera llamada. El bus vive en `window.__TUVIX_GLOBAL_BUS__`, así que una micro app que incluye en su bundle su propia copia de `@tuvix.js/event-bus` obtiene la misma instancia que la shell. `options` solo se aplica en la llamada que crea el bus. En el servidor, sin `window`, el bus es un singleton a nivel de módulo.

El orquestador usa este bus salvo que pases opciones de `eventBus` a `createOrchestrator`, así que `orchestrator.getEventBus() === getGlobalBus()`.

### `resetGlobalBus`

```ts no-check
function resetGlobalBus(): void;
```

Destruye el bus global y borra `window.__TUVIX_GLOBAL_BUS__`. El siguiente `getGlobalBus()` crea un bus nuevo. El código que conservó la instancia antigua, incluido un orquestador, lanza entonces un error en `emit`. Llámalo entre tests.

```ts
import { getGlobalBus, resetGlobalBus } from '@tuvix.js/event-bus';

getGlobalBus().emit('test:start');
resetGlobalBus();
```

### Tipos

```ts
type EventHandler<T = unknown> = (data: T) => void;
type WildcardHandler<T = unknown> = (eventName: string, data: T) => void;
type Unsubscribe = () => void;
```

| Tipo | Significado |
| --- | --- |
| `EventHandler<T>` | Handler para un evento. |
| `WildcardHandler<T>` | Handler para `onAny`; recibe el nombre del evento y los datos. |
| `Unsubscribe` | Función que devuelven `on`, `once` y `onAny`. |
| `EventBusOptions` | `{ maxListeners?, debug?, logger? }`. |
| `IEventBus` | Interfaz que implementa `EventBus`: todos los métodos listados arriba. Cumple `MicroAppBus` de `@tuvix.js/loader`. |

## Casos límite

- **Instantánea por emisión.** `emit` copia primero la lista de handlers. Un handler añadido durante una emisión se ejecuta a partir de la siguiente emisión; un handler eliminado durante una emisión se sigue ejecutando en la actual.
- **La misma función dos veces.** Suscribir dos veces la misma función al mismo evento la guarda una sola vez, y un único `off` la elimina.
- **Handlers async.** `emit` no espera a las promesas devueltas. Una promesa rechazada escapa del `try`/`catch` del bus y aparece como un rechazo no gestionado.
- **Entrada no válida.** `on`, `once` y `emit` lanzan `[Tuvix EventBus] Event name must be a non-empty string.` con `''` o solo espacios en blanco. `on` y `onAny` lanzan `[Tuvix EventBus] Handler must be a function.` cuando el handler no es una función. `once` envuelve primero el handler, así que un valor que no es función pasa y falla en el primer `emit`, donde el bus registra el error.
- **Después de `destroy()`.** `off`, `offAll`, `offAny`, `hasListeners`, `listenerCount` y `eventNames` siguen funcionando e informan de un bus vacío.
- **Versiones mezcladas.** Una micro app que incluye en su bundle `@tuvix.js/event-bus` 0.4 mantiene su propio bus a nivel de módulo y no ve el compartido.
- **Límite de listeners.** Con `maxListeners: 20`, añadir el handler número 21 a un evento muestra `[Tuvix EventBus] Max listeners (20) reached for event "<event>". The listener was added; check for handlers that are never removed.` El bus avisa una vez por nombre de evento durante toda su vida, así que eliminar handlers y volver a añadirlos no genera un segundo aviso.
- **Iframes.** Cada window tiene su propio `__TUVIX_GLOBAL_BUS__`.

## Lo que no hace

- No tipa los eventos por nombre. No hay mapa de eventos ni interfaz `TuvixEvents` que ampliar; pasa el tipo del payload como `on<T>` y `emit<T>`.
- No reproduce eventos pasados. Un handler suscrito después de un `emit` se lo pierde.
- No hace coincidir patrones como `user:*`. `onAny` recibe todos los eventos.
- No envía mensajes a otras pestañas, ventanas ni iframes.

## Migrar desde 0.4

- `getGlobalBus()` ahora guarda su singleton en `window.__TUVIX_GLOBAL_BUS__`. En 0.4 cada copia del paquete incluida en un bundle creaba su propio bus "global", así que las micro apps con su propia copia nunca recibían los mensajes de la shell. Ahora `resetGlobalBus()` desde cualquier copia reinicia el bus para todas ellas.
- La versión 0.4 de esta página documentaba `clear(event?)`, `createEventBus<EventMap>()` y una interfaz `TuvixEvents`. Nada de eso existía. Usa `offAll(event?)` y el genérico por llamada `on<T>` / `emit<T>`.

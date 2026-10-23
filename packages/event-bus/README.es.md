# @tuvix.js/event-bus

> Bus síncrono de publicación/suscripción para mensajes entre micro apps, con un bus global por página.

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentación completa: [tuvix.js.org/packages/event-bus](https://tuvix.js.org/packages/event-bus).

## Instalación

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## Inicio rápido

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const stop = bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
  console.log('Items in cart:', itemCount);
});

bus.emit('cart:updated', { itemCount: 3 });
stop();
```

El orquestador de `@tuvix.js/core` usa `getGlobalBus()` (salvo que pases opciones `eventBus`) y se lo pasa a cada app como `bus` en el contexto de montaje.

## API

### `EventBus` y `createEventBus`

```ts no-check
new EventBus(options?: EventBusOptions);
createEventBus(options?: EventBusOptions): IEventBus;
```

| Opción | Tipo | Por defecto | Significado |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | Número de handlers por evento a partir del cual `on` muestra un `console.warn` al añadir uno más, una vez por nombre de evento, con o sin `debug`. El listener se añade igualmente. `0` significa sin aviso. |
| `debug` | `boolean` | `false` | Registra las llamadas de suscripción, cancelación y emisión. |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | Recibe la salida de depuración. |

| Método | Comportamiento |
| --- | --- |
| `on<T>(event, handler): Unsubscribe` | Suscribe; devuelve una función para quitar el handler. |
| `once<T>(event, handler): Unsubscribe` | Quita el handler antes de su primera llamada. Cancélalo con la función devuelta, no con `off`. |
| `emit<T>(event, data?)` | Llama a los handlers del evento en orden y después a los handlers `onAny`, antes de retornar. Un handler que lanza un error se registra con `console.error`; el resto se sigue ejecutando. |
| `off(event, handler)` | Quita un handler. |
| `offAll(event?)` | Quita los handlers de un evento, o todos los handlers, incluidos los de `onAny`. |
| `onAny(handler): Unsubscribe` | El handler recibe `(eventName, data)` para cada evento. |
| `offAny(handler)` | Quita un handler `onAny`. |
| `hasListeners(event)`, `listenerCount(event)`, `eventNames()` | Inspeccionan las suscripciones; los handlers `onAny` no se cuentan. |
| `destroy()` | Quita todos los handlers. Después, las llamadas a `on`, `once`, `emit` y `onAny` lanzan un error. |

### `getGlobalBus`

```ts no-check
getGlobalBus(options?: EventBusOptions): IEventBus;
```

Devuelve el bus compartido de la página, guardado en `window.__TUVIX_GLOBAL_BUS__`, así que las micro apps que empaquetan su propia copia de este paquete obtienen la misma instancia. Las `options` solo se aplican en la llamada que lo crea. Sin `window`, el bus es un singleton a nivel de módulo.

### `resetGlobalBus`

```ts no-check
resetGlobalBus(): void;
```

Destruye el bus global; el siguiente `getGlobalBus()` crea uno nuevo. Las referencias antiguas lanzan un error al usarlas. Está pensado para tests.

### Tipos

`EventHandler<T>` (`(data: T) => void`), `WildcardHandler<T>` (`(eventName: string, data: T) => void`), `Unsubscribe` (`() => void`), `EventBusOptions`, `IEventBus`.

## Casos límite

- `emit` trabaja sobre una copia de la lista de handlers: los handlers añadidos durante un emit se ejecutan a partir del siguiente emit.
- La misma función suscrita dos veces a un evento se guarda una sola vez.
- `emit` no espera a los handlers async; sus rechazos quedan sin gestionar.
- Los nombres de evento vacíos o formados solo por espacios lanzan `[Tuvix EventBus] Event name must be a non-empty string.`
- Una micro app que empaqueta la versión 0.4 de este paquete mantiene su propio bus.

## Lo que no hace

- No hay tipado por mapa de eventos; pasa el tipo del payload como `on<T>` / `emit<T>`.
- No hay reproducción para suscriptores tardíos, ni patrones `user:*`, ni mensajes entre pestañas o iframes.

## Licencia

MIT

# Event bus

`@tuvix.js/event-bus` es un canal publish/subscribe síncrono. Las apps de una página lo usan para avisarse de lo que ha pasado ("carrito actualizado", "el usuario cerró sesión") sin importar el código de las demás.

## Elige un bus

| Bus | Cómo obtenerlo | Cuándo usarlo |
| --- | --- | --- |
| Bus global | `getGlobalBus()` | Por defecto. Todas las apps de la página, en cualquier bundle, obtienen la misma instancia. |
| Bus del orquestador | `orchestrator.getEventBus()` o `bus` en el contexto de montaje | Dentro de las micro apps. Es el bus global salvo que la shell haya pasado opciones `eventBus`. |
| Bus privado | `createEventBus(options)` | Tests, o un canal que usa una sola app. |

`getGlobalBus()` guarda su instancia en `window.__TUVIX_GLOBAL_BUS__`. Dos micro apps que empaquetan cada una `@tuvix.js/event-bus` la siguen compartiendo. En el servidor, sin `window`, cada copia del módulo tiene la suya.

## Emitir y suscribirse

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => {
  console.log('logged in', userId);
});

bus.emit('user:login', { userId: '42' });

off();
```

`emit` llama a todos los handlers antes de retornar. Un handler que lanza una excepción se registra con `console.error`; los demás handlers se siguen ejecutando. No se encola nada: un suscriptor que se une después de un `emit` no lo ve.

## Eventos tipados

El genérico de `on`, `once` y `emit` tipa el payload. Para un mapa de eventos de todo el proyecto, envuelve el bus:

```ts
import { getGlobalBus, type IEventBus } from '@tuvix.js/event-bus';

export interface AppEvents {
  'user:login': { userId: string };
  'user:logout': { userId: string };
  'cart:updated': { itemCount: number; total: number };
}

export function emit<E extends keyof AppEvents>(bus: IEventBus, event: E, payload: AppEvents[E]): void {
  bus.emit(event, payload);
}

export function on<E extends keyof AppEvents>(
  bus: IEventBus,
  event: E,
  handler: (payload: AppEvents[E]) => void,
): () => void {
  return bus.on<AppEvents[E]>(event, handler);
}

emit(getGlobalBus(), 'cart:updated', { itemCount: 3, total: 42 });
```

## Usar el bus en una micro app

Toma el bus del contexto de montaje y cancela las suscripciones en `unmount`:

```ts
import { defineMicroApp } from '@tuvix.js/core';

const subscriptions: Array<() => void> = [];

export default defineMicroApp({
  name: 'header',

  mount({ container, bus }) {
    const badge = document.createElement('span');
    container.replaceChildren(badge);
    if (!bus) return;
    subscriptions.push(
      bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
        badge.textContent = String(itemCount);
      }),
      bus.on('user:logout', () => {
        badge.textContent = '';
      }),
    );
  },

  unmount({ container }) {
    for (const off of subscriptions.splice(0)) off();
    container.replaceChildren();
  },
});
```

Los componentes de React y Vue pueden usar `useTuvixBus(bus, event, handler)`, que cancela la suscripción cuando el componente se desmonta. Consulta [React](/es/guide/react) y [Vue](/es/guide/vue).

## once y comodines

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

bus.once('app:ready', () => console.log('first ready event only'));

const offAny = bus.onAny((event, data) => console.debug('[bus]', event, data));
offAny();
```

Los handlers de `onAny` se ejecutan después de los handlers con nombre en cada evento, incluidos los eventos `tuvix:app:*` del orquestador.

## Eliminar listeners

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
const handler = (data: unknown) => console.log(data);

bus.on('ping', handler);
bus.off('ping', handler); // un handler
bus.offAll('ping'); // todos los handlers de 'ping'
bus.offAll(); // todos los handlers, comodines incluidos
```

Llama a `offAll()` en el bus global solo cuando controlas toda la página. También elimina los listeners de otras apps.

## Errores y buses destruidos

- `on`, `once`, `emit` y `onAny` lanzan una excepción si el nombre del evento está vacío o si el handler no es una función.
- Después de `bus.destroy()`, todos los métodos que suscriben o emiten lanzan una excepción. `resetGlobalBus()` destruye el bus global; la siguiente llamada a `getGlobalBus()` crea uno nuevo.
- `orchestrator.destroy()` solo destruye un bus privado.

## Introspección

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
bus.hasListeners('user:login'); // boolean
bus.listenerCount('user:login'); // number
bus.eventNames(); // string[]
```

## Lo que no hace el bus

- No persiste ni reproduce eventos. Pasa el estado actual como props, o haz que la app que llega tarde lo pida con un evento que responda la app propietaria.
- No cruza ventanas, pestañas ni iframes. Usa `BroadcastChannel` o `postMessage` para eso.
- No valida los payloads en runtime. Los genéricos solo existen en tiempo de compilación.

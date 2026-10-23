# Event bus

`@tuvix.js/event-bus` è un canale publish/subscribe sincrono. Le app di una stessa pagina lo usano per comunicarsi cosa è successo ("carrello aggiornato", "utente disconnesso") senza importare il codice l'una dell'altra.

## Scegliere un bus

| Bus | Come ottenerlo | Quando usarlo |
| --- | --- | --- |
| Bus globale | `getGlobalBus()` | Predefinito. Ogni app della pagina, in qualsiasi bundle, riceve la stessa istanza. |
| Bus dell'orchestratore | `orchestrator.getEventBus()` o `bus` nel contesto di mount | Dentro le micro app. È il bus globale, a meno che la shell non abbia passato opzioni `eventBus`. |
| Bus privato | `createEventBus(options)` | Test, o un canale usato da una sola app. |

`getGlobalBus()` conserva la sua istanza in `window.__TUVIX_GLOBAL_BUS__`. Due micro app che includono ciascuna `@tuvix.js/event-bus` nel proprio bundle la condividono comunque. Sul server, senza `window`, ogni copia del modulo ha la propria.

## Emettere e sottoscrivere

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => {
  console.log('logged in', userId);
});

bus.emit('user:login', { userId: '42' });

off();
```

`emit` chiama ogni handler prima di restituire il controllo. Un handler che lancia un'eccezione viene registrato con `console.error`; gli handler rimanenti vengono eseguiti comunque. Niente viene accodato: un sottoscrittore che si aggiunge dopo un `emit` non lo riceve.

## Eventi tipizzati

Il generico su `on`, `once` ed `emit` tipizza il payload. Per una mappa valida in tutto il progetto, avvolgi il bus:

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

## Usare il bus in una micro app

Prendi il bus dal contesto di mount e annulla le sottoscrizioni in `unmount`:

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

I componenti React e Vue possono usare `useTuvixBus(bus, event, handler)`, che annulla la sottoscrizione quando il componente viene smontato. Vedi [React](/it/guide/react) e [Vue](/it/guide/vue).

## once e wildcard

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

bus.once('app:ready', () => console.log('first ready event only'));

const offAny = bus.onAny((event, data) => console.debug('[bus]', event, data));
offAny();
```

Gli handler di `onAny` vengono eseguiti dopo gli handler con nome per ogni evento, compresi gli eventi `tuvix:app:*` dell'orchestratore.

## Rimuovere i listener

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
const handler = (data: unknown) => console.log(data);

bus.on('ping', handler);
bus.off('ping', handler); // one handler
bus.offAll('ping'); // every handler for 'ping'
bus.offAll(); // every handler, wildcards included
```

Chiama `offAll()` sul bus globale solo quando controlli l'intera pagina. Rimuove anche i listener delle altre app.

## Errori e bus distrutti

- `on`, `once`, `emit` e `onAny` lanciano un'eccezione per un nome di evento vuoto o per un handler che non è una funzione.
- Dopo `bus.destroy()`, ogni metodo che sottoscrive o emette lancia un'eccezione. `resetGlobalBus()` distrugge il bus globale; la chiamata successiva a `getGlobalBus()` ne crea uno nuovo.
- `orchestrator.destroy()` distrugge solo un bus privato.

## Introspezione

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
bus.hasListeners('user:login'); // boolean
bus.listenerCount('user:login'); // number
bus.eventNames(); // string[]
```

## Cosa non fa il bus

- Non conserva né riproduce gli eventi. Passa lo stato corrente come props, oppure fai in modo che l'app arrivata dopo lo richieda con un evento a cui risponde chi possiede lo stato.
- Non attraversa finestre, schede o iframe. Per questo usa `BroadcastChannel` o `postMessage`.
- Non convalida i payload a runtime. I generici valgono solo in fase di compilazione.

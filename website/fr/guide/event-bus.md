# Event bus

`@tuvix.js/event-bus` est un canal publish/subscribe synchrone. Les apps d'une même page l'utilisent pour se signaler ce qui s'est passé (« panier mis à jour », « utilisateur déconnecté ») sans importer le code les unes des autres.

## Choisir un bus {#pick-a-bus}

| Bus | Comment l'obtenir | Quand l'utiliser |
| --- | --- | --- |
| Bus global | `getGlobalBus()` | Par défaut. Toutes les apps de la page, quel que soit leur bundle, obtiennent la même instance. |
| Bus de l'orchestrateur | `orchestrator.getEventBus()` ou `bus` dans le contexte de montage | Dans les micro apps. C'est le bus global, sauf si le shell a passé des options `eventBus`. |
| Bus privé | `createEventBus(options)` | Tests, ou canal utilisé par une seule app. |

`getGlobalBus()` conserve son instance dans `window.__TUVIX_GLOBAL_BUS__`. Deux micro apps qui embarquent chacune `@tuvix.js/event-bus` la partagent quand même. Sur le serveur, sans `window`, chaque copie du module a la sienne.

## Émettre et s'abonner {#emit-and-subscribe}

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => {
  console.log('logged in', userId);
});

bus.emit('user:login', { userId: '42' });

off();
```

`emit` appelle tous les handlers avant de retourner. Un handler qui lève une exception est journalisé avec `console.error` ; les handlers restants s'exécutent quand même. Rien n'est mis en file : un abonné qui arrive après un `emit` ne le voit pas.

## Événements typés {#typed-events}

Le générique de `on`, `once` et `emit` type le payload. Pour une table d'événements à l'échelle du projet, enveloppez le bus :

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

## Utiliser le bus dans une micro app {#use-the-bus-in-a-micro-app}

Récupérez le bus dans le contexte de montage et désabonnez-vous dans `unmount` :

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

Les composants React et Vue peuvent utiliser `useTuvixBus(bus, event, handler)`, qui se désabonne quand le composant est démonté. Voir [React](/fr/guide/react) et [Vue](/fr/guide/vue).

## once et wildcards {#once-and-wildcards}

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

bus.once('app:ready', () => console.log('first ready event only'));

const offAny = bus.onAny((event, data) => console.debug('[bus]', event, data));
offAny();
```

Les handlers `onAny` s'exécutent après les handlers nommés, pour chaque événement, y compris les événements `tuvix:app:*` de l'orchestrateur.

## Retirer des listeners {#remove-listeners}

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus();
const handler = (data: unknown) => console.log(data);

bus.on('ping', handler);
bus.off('ping', handler); // one handler
bus.offAll('ping'); // every handler for 'ping'
bus.offAll(); // every handler, wildcards included
```

N'appelez `offAll()` sur le bus global que si toute la page vous appartient. Il retire aussi les listeners des autres apps.

## Erreurs et bus détruits {#errors-and-destroyed-buses}

- `on`, `once`, `emit` et `onAny` lèvent une exception pour un nom d'événement vide ou un handler qui n'est pas une fonction.
- Après `bus.destroy()`, toutes les méthodes qui abonnent ou émettent lèvent une exception. `resetGlobalBus()` détruit le bus global ; l'appel suivant à `getGlobalBus()` en crée un nouveau.
- `orchestrator.destroy()` ne détruit qu'un bus privé.

## Introspection {#introspection}

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();
bus.hasListeners('user:login'); // boolean
bus.listenerCount('user:login'); // number
bus.eventNames(); // string[]
```

## Ce que le bus ne fait pas {#what-the-bus-does-not-do}

- Il ne persiste ni ne rejoue les événements. Passez l'état courant en props, ou faites demander cet état par l'app arrivée en retard, via un événement auquel le propriétaire répond.
- Il ne traverse pas les fenêtres, les onglets ni les iframes. Utilisez `BroadcastChannel` ou `postMessage` pour cela.
- Il ne valide pas les payloads à l'exécution. Les génériques n'agissent qu'à la compilation.

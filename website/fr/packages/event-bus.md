---
title: '@tuvix.js/event-bus'
---

<PackageHeader
  name="@tuvix.js/event-bus"
  title="Event Bus"
  description="Bus publish/subscribe synchrone pour les messages entre micro apps. Un seul bus global par page, partagé par chaque copie embarquée du paquet."
  icon="📡"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## Quand l'utiliser {#when-to-use-it}

Les micro apps d'une même page doivent se transmettre des informations : l'app du panier annonce `cart:updated`, l'en-tête affiche le nouveau nombre d'articles. L'event bus leur permet de le faire par nom d'événement, sans s'importer mutuellement.

L'orchestrateur de `@tuvix.js/core` utilise `getGlobalBus()` et le transmet à chaque app sous le nom `bus` dans le contexte de montage. Dans une micro app, utilisez ce `bus` ou appelez `getGlobalBus()` ; les deux renvoient la même instance. Créez un bus privé avec `createEventBus()` pour les tests ou pour des messages qui restent dans une seule app.

Choisissez autre chose pour un état qu'un abonné tardif doit lire (un store, ou l'URL), et pour les messages entre onglets ou iframes (`BroadcastChannel`, `postMessage`).

## Démarrage rapide {#quick-start}

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

Une micro app montée par l'orchestrateur reçoit le bus dans son contexte de montage :

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

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | Nombre d'écouteurs par événement à partir duquel `on` affiche un `console.warn` quand vous en ajoutez un de plus, une fois par nom d'événement pendant toute la vie du bus. L'écouteur est ajouté dans tous les cas. `0` désactive l'avertissement. L'avertissement ignore `debug`. |
| `debug` | `boolean` | `false` | Journalise chaque abonnement, désabonnement et émission via `logger`. |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | Reçoit les messages de debug, chacun préfixé par `[Tuvix EventBus]`. L'avertissement de `maxListeners` ne passe pas par lui. |

```ts
import { EventBus } from '@tuvix.js/event-bus';

const bus = new EventBus({ debug: true, maxListeners: 20 });
```

#### `on(event, handler)`

```ts no-check
on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

Abonne `handler` à `event` et renvoie une fonction qui le désabonne. `T` type le payload ; le bus ne le vérifie pas à l'exécution.

#### `once(event, handler)`

```ts no-check
once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;
```

Comme `on`, mais retire le handler avant son premier appel. Pour annuler avant que l'événement se déclenche, appelez la fonction renvoyée. `off(event, handler)` ne le trouve pas, car le bus stocke une fonction enveloppe.

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

Appelle chaque handler de `event` dans l'ordre d'abonnement, puis chaque handler `onAny`, le tout avant le retour de `emit`. Un handler qui lève une exception est journalisé avec `console.error('[Tuvix EventBus] Error in handler for "<event>":', error)` et les handlers restants s'exécutent quand même.

#### `off(event, handler)`

```ts no-check
off<T = unknown>(event: string, handler: EventHandler<T>): void;
```

Retire un handler. Les événements et handlers inconnus sont ignorés.

#### `offAll(event?)`

```ts no-check
offAll(event?: string): void;
```

Avec `event`, retire tous les handlers de cet événement. Sans argument, retire tous les handlers de tous les événements et tous les handlers `onAny`.

#### `onAny(handler)`

```ts no-check
onAny<T = unknown>(handler: WildcardHandler<T>): Unsubscribe;
```

S'abonne à tous les événements. Le handler reçoit `(eventName, data)`. Utilisez-le pour la journalisation et les devtools.

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

Retire un handler `onAny`.

#### `hasListeners(event)`, `listenerCount(event)`, `eventNames()`

```ts no-check
hasListeners(event: string): boolean;
listenerCount(event: string): number;
eventNames(): string[];
```

Inspectent les abonnements. Les handlers `onAny` ne sont pas comptés, et `eventNames()` liste uniquement les événements qui ont au moins un handler.

#### `destroy()`

```ts no-check
destroy(): void;
```

Retire tous les handlers et marque le bus comme détruit. Ensuite, `on`, `once`, `emit` et `onAny` lèvent `[Tuvix EventBus] Cannot use a destroyed EventBus instance. Create a new one.` L'orchestrateur détruit un bus privé (un bus qu'il a créé à partir des options `eventBus`) dans `destroy()` et laisse le bus global en vie.

### `createEventBus`

```ts no-check
function createEventBus(options?: EventBusOptions): IEventBus;
```

Renvoie `new EventBus(options)` typé comme `IEventBus`. Accepte les options du tableau ci-dessus.

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

Renvoie le bus partagé de la page et le crée au premier appel. Le bus réside sur `window.__TUVIX_GLOBAL_BUS__`, donc une micro app qui embarque sa propre copie de `@tuvix.js/event-bus` obtient la même instance que le shell. Les `options` s'appliquent uniquement lors de l'appel qui crée le bus. Sur le serveur, sans `window`, le bus est un singleton au niveau du module.

L'orchestrateur utilise ce bus sauf si vous passez des options `eventBus` à `createOrchestrator`, donc `orchestrator.getEventBus() === getGlobalBus()`.

### `resetGlobalBus`

```ts no-check
function resetGlobalBus(): void;
```

Détruit le bus global et efface `window.__TUVIX_GLOBAL_BUS__`. Le prochain `getGlobalBus()` crée un nouveau bus. Le code qui a conservé l'ancienne instance, orchestrateur compris, lève alors une exception sur `emit`. Appelez-le entre les tests.

```ts
import { getGlobalBus, resetGlobalBus } from '@tuvix.js/event-bus';

getGlobalBus().emit('test:start');
resetGlobalBus();
```

### Types {#types}

```ts
type EventHandler<T = unknown> = (data: T) => void;
type WildcardHandler<T = unknown> = (eventName: string, data: T) => void;
type Unsubscribe = () => void;
```

| Type | Signification |
| --- | --- |
| `EventHandler<T>` | Handler d'un événement. |
| `WildcardHandler<T>` | Handler pour `onAny`, reçoit le nom de l'événement et les données. |
| `Unsubscribe` | Fonction renvoyée par `on`, `once` et `onAny`. |
| `EventBusOptions` | `{ maxListeners?, debug?, logger? }`. |
| `IEventBus` | Interface implémentée par `EventBus` : toutes les méthodes listées ci-dessus. Elle satisfait `MicroAppBus` de `@tuvix.js/loader`. |

## Cas limites {#edge-cases}

- **Instantané à chaque émission.** `emit` copie d'abord la liste des handlers. Un handler ajouté pendant une émission s'exécute à partir de l'émission suivante ; un handler retiré pendant une émission s'exécute quand même dans l'émission en cours.
- **Même fonction deux fois.** Abonner deux fois la même fonction au même événement ne la stocke qu'une fois, et un seul `off` la retire.
- **Handlers asynchrones.** `emit` n'attend pas les promesses renvoyées. Une promesse rejetée échappe au `try`/`catch` du bus et apparaît comme un rejet non géré.
- **Entrée invalide.** `on`, `once` et `emit` lèvent `[Tuvix EventBus] Event name must be a non-empty string.` pour `''` ou une chaîne composée d'espaces. `on` et `onAny` lèvent `[Tuvix EventBus] Handler must be a function.` quand le handler n'est pas une fonction. `once` enveloppe d'abord le handler, donc une valeur qui n'est pas une fonction passe et échoue au premier `emit`, où le bus journalise l'erreur.
- **Après `destroy()`.** `off`, `offAll`, `offAny`, `hasListeners`, `listenerCount` et `eventNames` continuent de fonctionner et décrivent un bus vide.
- **Versions mélangées.** Une micro app qui embarque `@tuvix.js/event-bus` 0.4 garde son propre bus au niveau du module et ne voit pas le bus partagé.
- **Limite d'écouteurs.** Avec `maxListeners: 20`, ajouter le 21e handler à un événement affiche `[Tuvix EventBus] Max listeners (20) reached for event "<event>". The listener was added; check for handlers that are never removed.` Le bus avertit une seule fois par nom d'événement pendant toute sa vie, donc retirer puis rajouter des handlers ne produit pas de second avertissement.
- **Iframes.** Chaque fenêtre a son propre `__TUVIX_GLOBAL_BUS__`.

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Il ne type pas les événements par nom. Il n'existe ni event map ni interface `TuvixEvents` à augmenter ; passez le type du payload via `on<T>` et `emit<T>`.
- Il ne rejoue pas les événements. Un handler abonné après un `emit` le manque.
- Il ne gère pas les motifs comme `user:*`. `onAny` reçoit tous les événements.
- Il n'envoie pas de messages vers d'autres onglets, fenêtres ou iframes.

## Migrer depuis la 0.4 {#migrating-from-0-4}

- `getGlobalBus()` conserve désormais son singleton sur `window.__TUVIX_GLOBAL_BUS__`. En 0.4, chaque copie embarquée du paquet créait son propre bus « global », donc les micro apps qui avaient leur propre copie n'entendaient jamais le shell. `resetGlobalBus()`, appelé depuis n'importe quelle copie, réinitialise maintenant le bus pour toutes.
- La version 0.4 de cette page documentait `clear(event?)`, `createEventBus<EventMap>()` et une interface `TuvixEvents`. Aucun de ces éléments n'existait. Utilisez `offAll(event?)` et le générique par appel `on<T>` / `emit<T>`.

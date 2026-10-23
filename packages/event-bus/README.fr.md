# @tuvix.js/event-bus

> Bus publish/subscribe synchrone pour les messages entre micro apps, avec un bus global par page.

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentation complète : [tuvix.js.org/packages/event-bus](https://tuvix.js.org/packages/event-bus).

## Installation

```bash
npm install @tuvix.js/event-bus
# or pnpm add @tuvix.js/event-bus
```

## Démarrage rapide

```ts
import { getGlobalBus } from '@tuvix.js/event-bus';

const bus = getGlobalBus();

const stop = bus.on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
  console.log('Items in cart:', itemCount);
});

bus.emit('cart:updated', { itemCount: 3 });
stop();
```

L'orchestrateur de `@tuvix.js/core` utilise `getGlobalBus()` (sauf si vous passez des options `eventBus`) et le transmet à chaque app sous le nom `bus` dans le contexte de montage.

## API

### `EventBus` et `createEventBus`

```ts no-check
new EventBus(options?: EventBusOptions);
createEventBus(options?: EventBusOptions): IEventBus;
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `maxListeners` | `number` | `0` | Nombre d'écouteurs par événement à partir duquel `on` affiche un `console.warn` quand vous en ajoutez un de plus, une fois par nom d'événement, avec ou sans `debug`. L'écouteur est quand même ajouté. `0` signifie aucun avertissement. |
| `debug` | `boolean` | `false` | Journalise les appels d'abonnement, de désabonnement et d'émission. |
| `logger` | `(message: string, ...args: unknown[]) => void` | `console.log` | Reçoit la sortie de débogage. |

| Méthode | Comportement |
| --- | --- |
| `on<T>(event, handler): Unsubscribe` | S'abonne ; renvoie une fonction de retrait. |
| `once<T>(event, handler): Unsubscribe` | Retire le handler avant son premier appel. Annulez-le via la fonction renvoyée, pas avec `off`. |
| `emit<T>(event, data?)` | Appelle les handlers de l'événement dans l'ordre, puis les handlers `onAny`, avant de rendre la main. Un handler qui lève une erreur est journalisé avec `console.error` ; les autres s'exécutent quand même. |
| `off(event, handler)` | Retire un handler. |
| `offAll(event?)` | Retire les handlers d'un événement, ou tous les handlers, y compris ceux de `onAny`. |
| `onAny(handler): Unsubscribe` | Le handler reçoit `(eventName, data)` pour chaque événement. |
| `offAny(handler)` | Retire un handler `onAny`. |
| `hasListeners(event)`, `listenerCount(event)`, `eventNames()` | Inspectent les abonnements ; les handlers `onAny` ne sont pas comptés. |
| `destroy()` | Retire tous les handlers. Les appels suivants à `on`, `once`, `emit` et `onAny` lèvent une erreur. |

### `getGlobalBus`

```ts no-check
getGlobalBus(options?: EventBusOptions): IEventBus;
```

Renvoie le bus partagé de la page, stocké sur `window.__TUVIX_GLOBAL_BUS__`, donc les micro apps qui bundlent leur propre copie de ce paquet obtiennent la même instance. `options` ne s'applique qu'à l'appel qui le crée. Sans `window`, le bus est un singleton au niveau du module.

### `resetGlobalBus`

```ts no-check
resetGlobalBus(): void;
```

Détruit le bus global ; le prochain `getGlobalBus()` en crée un nouveau. Les anciennes références lèvent une erreur à l'utilisation. Destiné aux tests.

### Types

`EventHandler<T>` (`(data: T) => void`), `WildcardHandler<T>` (`(eventName: string, data: T) => void`), `Unsubscribe` (`() => void`), `EventBusOptions`, `IEventBus`.

## Cas limites

- `emit` travaille sur une copie de la liste des handlers : les handlers ajoutés pendant une émission s'exécutent à partir de l'émission suivante.
- La même fonction abonnée deux fois au même événement n'est stockée qu'une fois.
- `emit` n'attend pas les handlers asynchrones ; leurs rejets ne sont pas gérés.
- Les noms d'événements vides ou composés d'espaces lèvent `[Tuvix EventBus] Event name must be a non-empty string.`
- Une micro app qui bundle la 0.4 de ce paquet conserve son propre bus.

## Ce qu'il ne fait pas

- Pas de typage par map d'événements ; passez le type du payload avec `on<T>` / `emit<T>`.
- Pas de rejeu pour les abonnés tardifs, pas de motifs `user:*`, pas de messages entre onglets ou iframes.

## Licence

MIT

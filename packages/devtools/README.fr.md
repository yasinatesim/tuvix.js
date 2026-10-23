# @tuvix.js/devtools

> Overlay de débogage intégré à la page qui liste les apps enregistrées et montées d'un orchestrateur, sa route courante et le trafic récent de l'event bus

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Installation

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## Démarrage rapide

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

Un bouton rond apparaît dans le coin inférieur droit. Le panneau au-dessus se rafraîchit chaque seconde et affiche :

- **Apps** : chaque app enregistrée, avec un point vert quand son statut est `mounted` et un point blanc sinon.
- **Route** : `orchestrator.getRouter()?.currentPath`, ou `/` sans routeur.
- **Events** : les 10 événements de bus les plus récents (heure et nom), du plus récent au plus ancien.

L'overlay définit aussi `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`. Exécutez `__TUVIX_DEVTOOLS__.logger.getEntries()` dans la console pour lire les payloads des événements.

## API

### `installDevTools(orchestrator, options?): () => void`

Accepte tout objet qui possède `getRegisteredApps()`, `getMountedApps()`, `getEventBus()` et `getRouter()`, comme un `Orchestrator`. Renvoie une fonction de nettoyage qui arrête le polling, détache le logger, supprime le panneau et efface la variable globale.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | Nombre maximal d'événements conservés par le logger |
| `autoOpen` | `boolean` | `true` | `false` monte le panneau masqué ; le bouton bascule l'ouvre |
| `updateInterval` | `number` | `1000` | Millisecondes entre deux rafraîchissements du panneau |

### `EventLogger`

`new EventLogger(maxEntries = 200)` enregistre chaque événement d'un bus via `onAny`. Les entrées ont la forme `{ timestamp, event, data }`.

| Méthode | Comportement |
| --- | --- |
| `attach(bus)` | S'abonne à tous les événements. Lève une erreur sur un bus détruit. |
| `detach()` | Se désabonne et conserve les entrées |
| `getEntries()` | Tout le journal, du plus ancien au plus récent |
| `getRecent(count = 20)` | Les `count` dernières entrées, de la plus ancienne à la plus récente |
| `clear()` | Vide le journal |

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

Le DOM de l'overlay, sans polling. C'est vous qui lui fournissez l'état.

| Méthode | Comportement |
| --- | --- |
| `mount()` | Ajoute `#tuvix-devtools` à `document.body`, ouvert. Un second appel ne fait rien. |
| `unmount()` | Le supprime |
| `toggle()` | Affiche ou masque le corps du panneau ; le bouton reste |
| `update({ registeredApps, mountedApps, currentRoute, events })` | Refait le rendu des trois sections |

### `DevToolsOptions`

Type des options de `installDevTools` ci-dessus.

## Cas limites

- Le logger ne voit que les événements émis après `installDevTools`, et le panneau se remplit au premier rafraîchissement, `updateInterval` ms plus tard.
- Navigateur uniquement : `installDevTools` lève une `ReferenceError` pendant le rendu côté serveur.
- Une app en `mounting` ou en `error` affiche un point blanc ; le panneau n'affiche pas les noms de statut.
- Avec le bus global par défaut, le logger continue d'enregistrer après `orchestrator.destroy()` jusqu'à ce que vous appeliez la fonction de nettoyage.
- Deux appels à `installDevTools` créent deux overlays avec les mêmes identifiants d'éléments, et le second écrase `window.__TUVIX_DEVTOOLS__`.

## Ce qu'il ne fait pas

- Pas de raccourci clavier ni d'options de position, de taille ou de thème.
- Pas de payloads, d'URL d'entrée, d'état du loader ni de durées dans l'interface.
- Pas d'extension de navigateur ni de lien vers les devtools des frameworks.
- Pas de suppression automatique en production : conditionnez l'import à un flag de build, comme dans le démarrage rapide.

Documentation complète : [tuvix.js.org/packages/devtools](https://tuvix.js.org/packages/devtools)

## Licence

MIT

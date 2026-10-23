---
title: '@tuvix.js/devtools'
---

<PackageHeader
  name="@tuvix.js/devtools"
  title="DevTools"
  description="Overlay de débogage intégré à la page pour un orchestrateur. Liste les micro apps enregistrées et montées, la route courante et le trafic récent de l'event bus."
  icon="🛠️"
  npm="true"
/>

## Installation {#installation}

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## Quand l'utiliser {#when-to-use-it}

Installez-le en développement quand vous devez voir quelles micro apps l'orchestrateur connaît, lesquelles sont montées en ce moment et quels événements passent sur le bus. L'overlay se place dans le coin inférieur droit de la page et se rafraîchit une fois par seconde.

Utilisez plutôt les DevTools de votre navigateur ou une extension devtools de framework quand vous avez besoin d'arbres de composants, de temps réseau ou de payloads d'événements dans une interface. Ce paquet affiche les noms des apps, une chaîne de route et les noms des événements avec un horodatage. Les payloads restent dans le logger, que vous pouvez lire depuis la console.

## Démarrage rapide {#quick-start}

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
orchestrator.register({ name: 'settings', entry: '/apps/settings.js', container: '#main' });

await orchestrator.start();
```

Ouvrez `/dashboard` : l'overlay liste `dashboard` avec un point vert et `settings` avec un point blanc. La ligne Route affiche `/dashboard`, et la liste Events montre les événements `tuvix:app:status-change` et `tuvix:app:mount` du montage de dashboard.

## Ce qu'affiche le panneau {#what-the-panel-shows}

`installDevTools` ajoute un `<div id="tuvix-devtools">` à `document.body`. Il contient un bouton rond de bascule (fixé à 12px du coin inférieur droit, `z-index: 99999`) et, au-dessus, un panneau de 280px de large avec trois sections :

| Section | Source | Contenu |
| --- | --- | --- |
| Apps | `orchestrator.getRegisteredApps()` et `getMountedApps()` | Une ligne par app enregistrée. Un point vert signifie que son statut est `mounted`. Un point blanc couvre tous les autres statuts, y compris `loading` et `error`. |
| Route | `orchestrator.getRouter()?.currentPath` | Le chemin courant du routeur : sans le préfixe `base`, query string incluse. Affiche `/` quand l'orchestrateur n'a pas de routeur. |
| Events | `EventLogger` attaché à `orchestrator.getEventBus()` | Les 10 événements les plus récents, le plus récent en premier. Chaque ligne affiche l'heure locale, un tiret et le nom de l'événement. |

Par défaut, l'orchestrateur utilise `getGlobalBus()`, donc la liste Events montre aussi les événements que vos micro apps émettent sur le bus partagé, à côté des événements propres à l'orchestrateur :

| Événement | Émis quand |
| --- | --- |
| `tuvix:app:registered` | `register()` ajoute une app |
| `tuvix:app:bootstrap`, `tuvix:app:mount`, `tuvix:app:unmount` | Une app passe par cette étape du cycle de vie |
| `tuvix:app:error` | Le chargement, le bootstrap ou le montage d'une app échoue |
| `tuvix:app:status-change` | Le statut d'une app change. Comptez-en plusieurs par montage. |
| `tuvix:route:change` | Le routeur navigue |
| `tuvix:started`, `tuvix:destroyed` | `start()` et `destroy()` se terminent |

Le panneau expose aussi `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`. Lancez `__TUVIX_DEVTOOLS__.logger.getEntries()` dans la console du navigateur pour lire les payloads que le panneau n'affiche pas.

## API {#api}

### `installDevTools`

```ts
import type { DevToolsOptions } from '@tuvix.js/devtools';
import type { IEventBus } from '@tuvix.js/core';

declare function installDevTools(
  orchestrator: {
    getRegisteredApps(): string[];
    getMountedApps(): string[];
    getEventBus(): IEventBus;
    getRouter(): { currentPath: string } | null;
  },
  options?: DevToolsOptions
): () => void;
```

Le premier argument accepte tout objet doté de ces quatre méthodes. Un `Orchestrator` de `@tuvix.js/core` ou de `tuvix.js` convient.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | Nombre maximal d'événements que le logger conserve. Le panneau en affiche 10 ; les autres restent lisibles via `__TUVIX_DEVTOOLS__.logger`. |
| `autoOpen` | `boolean` | `true` | `false` monte le panneau masqué. Le bouton de bascule reste visible et l'ouvre. |
| `updateInterval` | `number` | `1000` | Millisecondes entre deux rafraîchissements du panneau. |

À chaque appel, la fonction :

1. crée un `DevToolsPanel` et un `EventLogger(maxLogEntries)`,
2. attache le logger à `orchestrator.getEventBus()` avec `onAny`,
3. monte le panneau et le masque quand `autoOpen` vaut `false`,
4. démarre un `setInterval` qui lit l'orchestrateur et appelle `panel.update()`,
5. définit `window.__TUVIX_DEVTOOLS__`.

Elle renvoie une fonction de nettoyage qui arrête l'intervalle, détache le logger, retire le panneau et supprime `window.__TUVIX_DEVTOOLS__`.

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { installDevTools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator();
const removeDevTools = installDevTools(orchestrator, {
  autoOpen: false,
  updateInterval: 250,
  maxLogEntries: 500,
});

// Later, for example in a hot-module-replacement dispose hook:
removeDevTools();
await orchestrator.destroy();
```

### `EventLogger`

```ts no-check
class EventLogger {
  constructor(maxEntries?: number); // default 200
  attach(bus: IEventBus): void;
  detach(): void;
  getEntries(): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>;
  getRecent(count?: number): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>; // default 20
  clear(): void;
}
```

`EventLogger` enregistre chaque événement d'un bus via `bus.onAny`. Chaque entrée contient `timestamp` (`Date.now()` au moment de l'émission), `event` (le nom) et `data` (le payload tel qu'émis, non cloné). Quand le journal dépasse `maxEntries`, le logger supprime les entrées les plus anciennes.

| Méthode | Comportement |
| --- | --- |
| `attach(bus)` | S'abonne à tous les événements de `bus`. Lève une erreur quand le bus est détruit. |
| `detach()` | Se désabonne. Les entrées enregistrées restent. |
| `getEntries()` | Renvoie tout le journal, de la plus ancienne à la plus récente. |
| `getRecent(count)` | Renvoie les `count` dernières entrées, de la plus ancienne à la plus récente. |
| `clear()` | Vide le journal et conserve l'abonnement. |

Utilisez-le sans le panneau pour vérifier le trafic du bus dans un test ou pour afficher les événements d'une page :

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);

bus.emit('cart:add', { sku: 'A-1' });

console.log(logger.getRecent(1)); // [{ timestamp: 1761..., event: 'cart:add', data: { sku: 'A-1' } }]
logger.detach();
```

### `DevToolsPanel`

```ts no-check
class DevToolsPanel {
  constructor();
  mount(): void;
  unmount(): void;
  toggle(): void;
  update(state: {
    registeredApps: string[];
    mountedApps: string[];
    currentRoute: string;
    events: Array<{ timestamp: number; event: string }>;
  }): void;
}
```

`DevToolsPanel` est la partie DOM de l'overlay, sans aucun polling. Vous appelez `update()` avec l'état que vous voulez afficher.

| Méthode | Comportement |
| --- | --- |
| `mount()` | Ajoute `#tuvix-devtools` à `document.body`, ouvert. Un second appel sur la même instance ne fait rien. |
| `unmount()` | Retire l'élément. |
| `toggle()` | Affiche ou masque le corps du panneau. Le bouton de bascule reste. Ne fait rien avant `mount()`. |
| `update(state)` | Reconstruit les sections Apps, Route et Events. Affiche les 10 derniers éléments de `events`, le plus récent en premier. Ne fait rien avant `mount()`. |

```ts
import { DevToolsPanel } from '@tuvix.js/devtools';

const panel = new DevToolsPanel();
panel.mount();
panel.update({
  registeredApps: ['header', 'cart'],
  mountedApps: ['header'],
  currentRoute: '/checkout',
  events: [{ timestamp: Date.now(), event: 'cart:open' }],
});
```

### Types {#types}

| Nom | Signification |
| --- | --- |
| `DevToolsOptions` | Options de `installDevTools` : `maxLogEntries`, `autoOpen`, `updateInterval`. |

La forme de l'orchestrateur et celle d'une entrée du journal ne sont pas exportées. Utilisez `Parameters<typeof installDevTools>[0]` et `ReturnType<EventLogger['getEntries']>[number]` quand vous en avez besoin comme types.

## Builds de production {#production-builds}

Le paquet déclare `"sideEffects": false`, mais un `import { installDevTools } from '@tuvix.js/devtools'` statique que votre code appelle finit quand même dans le bundle. Chargez-le derrière un flag de build avec un `import()` dynamique, comme dans le démarrage rapide. Les bundlers remplacent `process.env.NODE_ENV` par une chaîne et éliminent la branche morte et son chunk. Dans une app Vite, vous pouvez tester `import.meta.env.DEV` à la place.

Laisser l'overlay actif en production vous coûte un `setInterval` qui reconstruit trois sections DOM chaque seconde, un abonnement à chaque événement du bus et une variable globale qui livre l'orchestrateur à n'importe quel script de la page.

## Cas limites {#edge-cases}

- Installez-le avant `register()` et `start()`. Le logger ne voit que les événements émis après `attach`, et le panneau reste vide jusqu'au premier rafraîchissement, `updateInterval` millisecondes après l'appel.
- `installDevTools` a besoin de `document` et de `window`. L'appeler pendant le rendu côté serveur lève une `ReferenceError`. Appelez-le depuis du code exécuté uniquement côté client.
- Avec `connectRouter()` et sans option `router`, `getRouter()` renvoie `null` et la ligne Route affiche `/`.
- `getMountedApps()` ne compte que le statut `mounted`. Une app en `mounting` ou en `error` reçoit un point blanc, et le panneau n'affiche jamais le nom du statut.
- Un bus privé (`createOrchestrator({ eventBus: {...} })`) est détruit par `orchestrator.destroy()`. Installer après cela lève une erreur depuis `onAny`. Avec le bus global par défaut, le logger continue d'enregistrer après `destroy()` jusqu'à ce que vous appeliez la fonction de nettoyage.
- Chaque appel crée un nouveau panneau. Deux appels placent sur la page deux overlays avec les mêmes ids d'éléments, et le second appel écrase `window.__TUVIX_DEVTOOLS__`. La première fonction de nettoyage supprime alors la variable globale définie par le second appel.
- Appeler `EventLogger.attach()` deux fois sur une même instance remplace la fonction de désabonnement stockée. `detach()` ne retire alors que le second abonnement.
- Une fois que le journal atteint `maxLogEntries`, le logger copie le tableau à chaque nouvel événement. Gardez `maxLogEntries` dans les centaines sur les pages dont le bus est très bavard.
- Le panneau écrit les noms d'apps, les routes et les noms d'événements avec `textContent`, donc du balisage dans un nom d'événement s'affiche comme du texte.

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Pas de raccourci clavier, ni d'options de position, de taille ou de thème. L'overlay se place toujours en bas à droite avec des styles inline.
- Pas de payloads d'événements, d'URL d'entrée, d'état du cache du loader ni de durées de montage dans l'interface. Lisez les payloads depuis `__TUVIX_DEVTOOLS__.logger.getEntries()`.
- Pas d'extension de navigateur ni de connexion aux devtools de React, Vue, Svelte ou Angular.
- Pas de voyage dans le temps ni de rejeu d'événements. Le logger enregistre et ne réémet jamais.
- Pas de suppression automatique dans les builds de production. Vous conditionnez l'import vous-même.

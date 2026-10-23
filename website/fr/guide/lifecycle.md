# Hooks de cycle de vie

L'orchestrateur fait passer chaque app enregistrée par une séquence fixe de hooks et de statuts. Cette page couvre les hooks que votre module implémente, les statuts que le shell peut lire, et ce qui se passe en cas d'erreur et de navigation rapide. Pour savoir depuis l'extérieur quand une app est sur la page, utilisez les [Événements de cycle de vie](/fr/guide/lifecycle-events).

## Ordre des hooks {#hook-order}

```text
register()
  └─ first activation: load entry → bootstrap() → mount()
       ├─ updateAppProps() while mounted → update()
       └─ deactivation → unmount()
  └─ next activation: mount()   (module cached, no bootstrap)
```

L'orchestrateur attend chaque hook. Il n'appelle jamais `mount` sur une app encore en cours de montage, et il n'appelle jamais `unmount` pendant que `mount` s'exécute : le démontage attend que le montage ait abouti.

## bootstrap {#bootstrap}

S'exécute une fois par module chargé, après le chargement de l'entrée et avant le premier `mount`. Utilisez-le pour le travail qui doit survivre aux remontages, comme la lecture de la configuration.

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

Si `bootstrap` lève une erreur, l'app passe en statut `error` et le montage échoue. La tentative de montage suivante appelle `bootstrap` à nouveau. Après une exécution réussie, les remontages l'ignorent.

## mount {#mount}

S'exécute chaque fois que l'app devient active, ou quand vous appelez `mountApp(name)`. Le contexte contient :

| Champ | Valeur |
| --- | --- |
| `container` | L'élément dans lequel rendre. Pour les apps `sandbox: true`, un élément à l'intérieur du shadow root. |
| `props` | Les props enregistrées, fusionnées avec chaque appel à `updateAppProps`. |
| `name` | Le nom enregistré de l'app. |
| `bus` | L'event bus de l'orchestrateur. |

`mountApp(name)` se résout une fois que `mount` a abouti et se rejette avec l'erreur de chargement ou de montage.

## update {#update}

S'exécute quand le shell appelle `updateAppProps(name, props)` pendant que l'app est montée :

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('reports', { range: '7d' });
```

Le contexte contient les `props` fusionnées et le `container`. Si `update` est absent ou que l'app n'est pas montée, l'orchestrateur conserve les props et les transmet au prochain `mount`. Il ne remonte jamais une app parce que les props ont changé.

`updateAppProps` attend d'abord un montage en cours, pour que la mise à jour atteigne la nouvelle instance. Un `unmount` qui arrive pendant une mise à jour attend la fin de celle-ci.

## unmount {#unmount}

S'exécute quand l'app devient inactive, lors de `unmountApp(name)`, `unregister(name)` et `destroy()`. Retirez tout ce que `mount` a créé : racines de framework, listeners, timers, abonnements au bus.

Après `unmount`, l'orchestrateur retire de `document.head` les feuilles de style de l'entrée de l'app. Le montage suivant les rajoute et attend leur chargement.

## Statut de l'app {#app-status}

```ts
import { createOrchestrator, type AppStatus } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
const status: AppStatus | null = orchestrator.getAppStatus('reports');
// 'registered' | 'bootstrapping' | 'bootstrapped' | 'mounting' | 'mounted'
// | 'updating' | 'unmounting' | 'unmounted' | 'error' | null (not registered)
```

| Méthode | Renvoie |
| --- | --- |
| `getAppStatus(name)` | Le statut, ou `null` pour un nom inconnu. |
| `getMountedApps()` | Les noms au statut `mounted`. |
| `getRegisteredApps()` | Tous les noms enregistrés. |

## Erreurs et fallback {#errors-and-fallback}

Quand le chargement, `bootstrap` ou `mount` échoue, l'orchestrateur :

1. écrit le HTML `fallback` de l'app dans son conteneur, si vous en avez défini un ;
2. définit le statut `error` ;
3. émet `OrchestratorEvent.APP_ERROR` (`tuvix:app:error`) sur le bus avec `{ name, error, phase }` ;
4. appelle `onError(error, name)` ;
5. rejette `mountApp`. Un montage échoué pendant un changement de route est plutôt journalisé avec `console.error`, et les autres apps se montent quand même.

Un `update` ou un `unmount` échoué exécute les étapes 2 à 4 et rejette `updateAppProps` ou `unmountApp` ; il n'écrit aucun HTML de fallback. `phase` vaut `'load'` (qui inclut la résolution du conteneur), `'bootstrap'`, `'mount'`, `'update'` ou `'unmount'`.

```ts
import { createOrchestrator, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.getEventBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, phase, error }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

Le prochain changement de route qui active une app au statut `error` tente de la monter à nouveau.

## Navigation rapide {#fast-navigation}

Les changements de route se réconcilient un par un. Les apps inactives se démontent avant que les apps actives se montent. Quand les chemins arrivent plus vite que les apps ne se montent :

- seul le chemin le plus récent en file d'attente s'exécute ensuite ;
- une app qui devient inactive pendant le chargement de son entrée saute son montage ;
- une app qui devient inactive pendant l'exécution de `mount` est démontée une fois que `mount` a abouti.

Ainsi, A → B → A en succession rapide se termine avec seulement A montée, et aucune app ne se rend dans un conteneur qu'une autre app occupe encore.

## Hooks au niveau du shell {#shell-level-hooks}

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

| Événement | Payload | Émis |
| --- | --- | --- |
| `tuvix:app:registered` | `{ name }` | `register()` |
| `tuvix:app:bootstrap` | `{ name }` | après `bootstrap` |
| `tuvix:app:mount` | `{ name }` | après `mount` |
| `tuvix:app:unmount` | `{ name }` | après `unmount` |
| `tuvix:app:error` | `{ name, error, phase }` | échec du chargement, bootstrap, mount, update ou unmount |
| `tuvix:app:status-change` | `{ name, status }` | à chaque changement de statut |
| `tuvix:route:change` | `{ from, to, fromRoute, toRoute }` | navigation du routeur intégré uniquement |
| `tuvix:started` | `{}` | fin de `start()` |
| `tuvix:destroyed` | `{}` | fin de `destroy()` |

Ces événements du bus viennent de l'orchestrateur. Les événements DOM `tuvix:mounted` décrits dans [Événements de cycle de vie](/fr/guide/lifecycle-events) viennent des adaptateurs et de `defineMicroApp`, et se déclenchent aussi pour les îlots montés sans orchestrateur.

## Destruction {#tearing-down}

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.destroy();
```

`destroy()` attend une réconciliation en cours, démonte chaque app, arrête le routeur, les abonnements `connectRouter`, le prefetch et l'observateur de viewport, et vide le cache du loader. Il détruit un event bus privé et laisse le bus global en vie. L'appeler deux fois ne pose pas de problème. Ensuite, `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` et `connectRouter` lèvent une erreur ; créez plutôt un nouvel orchestrateur.

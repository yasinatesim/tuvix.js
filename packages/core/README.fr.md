# @tuvix.js/core

> Orchestrateur qui charge les micro apps et les monte ou les démonte quand l'URL change.

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

Documentation complète : [tuvix.js.org/packages/core](https://tuvix.js.org/packages/core)

## Installation

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

Il dépend de `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` et `@tuvix.js/sandbox`.

## Démarrage rapide

Shell :

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/settings/*', app: 'settings' }] },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

orchestrator.register({
  name: 'settings',
  entry: { scripts: ['/settings/main.js'], styles: ['/settings/main.css'] },
  container: '#main',
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

App distante (`dashboard/main.js`) :

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## Comment les apps deviennent actives

- `activeWhen: '/path'` : comparé avec `matchPath` de `@tuvix.js/router`. La query et le hash sont ignorés, `'/dashboard'` et `'/dashboard/*'` correspondent à `/dashboard` et à tous ses sous-chemins (pas à `/dashboards`), `:id` correspond à un segment, `'/'` correspond à tous les chemins.
- `activeWhen: (path) => boolean` : votre fonction décide.
- Pas de `activeWhen`, mais nommée dans `router.routes` : active tant qu'une route avec `app: name` correspond entièrement. Une route `'/'` désigne uniquement la page d'accueil ; `'/*'` désigne tous les chemins.
- Ni l'un ni l'autre : vous appelez `mountApp` / `unmountApp` ; les réconciliations ne touchent pas à l'app.
- `mountWhenVisible: true` : monte l'app dès que le conteneur est visible à 10 % ; `activeWhen` est ignoré.

Le chemin courant vient de `getPath()` de `connectRouter`, sinon du routeur intégré, sinon de `window.location.pathname`. Les réconciliations s'exécutent une par une : les apps inactives sont démontées d'abord, puis les apps actives sont montées. Les navigations en file d'attente se réduisent au chemin le plus récent. Une app qui devient inactive pendant son chargement saute son montage ; une app qui devient inactive en plein montage est démontée une fois le montage terminé.

## API

### `createOrchestrator(config?)` / `new Orchestrator(config?)`

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | aucun | Routeur intégré : `mode` (`'history'` par défaut ou `'hash'`), `base`, `routes` (requis). |
| `eventBus` | `EventBusOptions` | aucun | Options d'un bus privé. Omis : l'orchestrateur utilise `getGlobalBus()`. |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | Transmis au loader de modules, avec `globals`. |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | `immediate` au `start()`, `idle` pendant la première période d'inactivité, `hover` quand un lien de même origine qui active une app reçoit le pointeur ou le focus. |
| `onError` | `(error: Error, appName: string) => void` | aucun | Échecs de chargement, de bootstrap, de montage, de mise à jour et de démontage. |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | aucun | Chaque changement de statut. |

### Méthodes de `Orchestrator`

| Méthode | Comportement |
| --- | --- |
| `register(appConfig: MicroAppConfig): void` | Enregistre la config. Ne charge pas, ne monte pas et ne réconcilie pas. |
| `unregister(name): Promise<void>` | Démonte, supprime les balises de l'entrée et le module en cache, oublie l'app. |
| `start(): Promise<void>` | Suit le routeur, réconcilie, démarre le prefetch et l'observation du viewport. Émet `STARTED`. |
| `mountApp(name): Promise<void>` | Attend un démontage en cours, monte. Rejette avec l'erreur après avoir rendu `fallback`. |
| `unmountApp(name): Promise<void>` | Attend un chargement ou un montage en cours, démonte. |
| `updateAppProps(name, props): Promise<void>` | Fusionne les props en surface. Appelle `update({ props, container })` sur une app montée, sinon les conserve pour le prochain montage. |
| `reconcile(path?): Promise<void>` | Met en file une réconciliation sur `path` ou sur le chemin courant. |
| `connectRouter({ subscribe, getPath }): () => void` | Suit un routeur externe. Renvoie `disconnect`. |
| `navigateTo(path): Promise<void>` | `push(path)` sur le routeur intégré. Lève `[Tuvix] No router configured.` en l'absence de routeur. |
| `getAppStatus(name): AppStatus \| null` | Statut, ou `null` pour les noms inconnus. |
| `getRegisteredApps(): string[]` | Noms enregistrés. |
| `getMountedApps(): string[]` | Noms dont le statut est `'mounted'`. |
| `getEventBus(): IEventBus` | `getGlobalBus()` ou le bus privé. |
| `getRouter(): IRouter \| null` | Routeur intégré ou `null`. |
| `destroy(): Promise<void>` | Attend une réconciliation en cours, démonte chaque app, arrête l'écoute, émet `DESTROYED`. Laisse le bus global actif. |

Options de `register` :

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Unique ; l'app distante s'enregistre sous le même nom. |
| `entry` | `Entry` | requis | URL, `{ scripts, styles?, type?, integrity? }`, ou `() => import('./app')`. |
| `container` | `string \| HTMLElement` | requis | Sélecteur (résolu à chaque montage) ou élément. |
| `activeWhen` | `string \| ((path: string) => boolean)` | aucun | Règle d'activation. |
| `props` | `Record<string, unknown>` | aucun | Transmises à `mount()`. |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | Rend dans un shadow root où les `styles` de l'entrée sont chargés. |
| `fallback` | `string` | aucun | HTML défini avec `innerHTML` en cas d'échec de chargement, de bootstrap ou de montage. |
| `mountWhenVisible` | `boolean` | `false` | Monte quand 10 % du conteneur est visible dans le viewport. |

`connectRouter` avec TanStack Router :

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
// later: disconnect();
```

### `defineMicroApp(definition): MicroAppModule`

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Doit être identique au nom enregistré. |
| `bootstrap` | `() => void \| Promise<void>` | aucun | S'exécute avant le premier montage. Un bootstrap en échec s'exécute de nouveau au montage suivant ; un bootstrap réussi ne s'exécute qu'une fois. |
| `mount` | `(context: MountContext) => void \| Promise<void>` | requis | Reçoit `container`, `props`, `name` et `bus`. |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | requis | Reçoit `container`. |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | aucun | Reçoit `props` et `container`. |
| `ssr` | `boolean` | `false` | `mount` reprend le balisage serveur ; l'événement `mounted` indique `hydrated: true` quand le conteneur contenait du balisage. |

Publie le module avec `registerModule` de `@tuvix.js/loader` et le renvoie. Le module émet les événements DOM `tuvix:mounted`, `tuvix:unmounted` et `tuvix:error` (qui remontent jusqu'à `document`), donc `whenMounted`, `isMounted` et `onLifecycle` fonctionnent avec lui. Un `unmount` pendant un `mount` en cours sur le même conteneur attend sa fin. Lève une erreur quand `name`, `mount` ou `unmount` manque.

### `OrchestratorEvent`

Événements sur le bus de l'orchestrateur : `APP_REGISTERED` (`tuvix:app:registered`), `APP_BOOTSTRAP`, `APP_MOUNT`, `APP_UNMOUNT`, `APP_ERROR` (`AppErrorEvent` : `{ name, error, phase }` pour les échecs `'load'`, `'bootstrap'`, `'mount'`, `'update'` ou `'unmount'`), `APP_STATUS_CHANGE` (`{ name, status }`), `ROUTE_CHANGE` (routeur intégré uniquement), `STARTED`, `DESTROYED`.

```ts
import { getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

### Isolation CSS

`sandbox: true` ou `{ css: true }` attache un shadow root ouvert au conteneur (réutilisé lors d'un nouveau montage), monte l'app dans un `<div data-tuvix-sandbox-root>` à l'intérieur et y charge les `styles` de l'entrée. Le montage attend les feuilles de style jusqu'à `loader.timeout`. Le JavaScript n'est pas isolé ; `JsSandbox` de `@tuvix.js/sandbox` est un utilitaire autonome.

### Types

`OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition`, `AppSandboxOption`, `RouterSource`, `AppErrorEvent`, `AppErrorPhase`, `AppStatus` (`registered`, `bootstrapping`, `bootstrapped`, `mounting`, `mounted`, `updating`, `unmounting`, `unmounted`, `error`), `RegisteredApp` (forme d'enregistrement ; aucune méthode ne le renvoie).

### Réexportations

- Depuis `@tuvix.js/event-bus` : `createEventBus`, `getGlobalBus`, types `IEventBus`, `EventHandler`, `Unsubscribe`.
- Depuis `@tuvix.js/router` : `createRouter`, `matchPath`, `interceptLinks`, types `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions`.
- Depuis `@tuvix.js/loader` : `createLoader`, types `Entry`, `MicroAppModule`.

## Cas limites

- `register()` après `start()` réconcilie une app gérée par les routes avec le chemin courant, donc elle est montée immédiatement si elle est active. Une app `mountWhenVisible` enregistrée après `start()` est observée immédiatement ; un conteneur absent du DOM à ce moment n'est jamais observé.
- Les échecs de réconciliation ne font pas rejeter `start()` ni `reconcile()` ; ils vont à `onError` et à la console. `mountApp` rejette.
- Une app en `error` réessaie à la prochaine réconciliation qui la veut active. `fallback` n'est rendu que pour les échecs de chargement, de bootstrap et de montage.
- Le démontage supprime les feuilles de style de l'entrée de `document.head` ; le montage suivant les rajoute.
- Deux orchestrateurs partagent `getGlobalBus()`. Passez `eventBus: {}` pour obtenir un bus privé.
- Après `destroy()`, les méthodes de modification lèvent `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`.

## Ce qu'il ne fait pas

- Isoler le JavaScript.
- Intercepter les clics sur les liens (utilisez `interceptLinks`).
- Rendre côté serveur (utilisez `@tuvix.js/server`).
- Partager des dépendances entre les apps (utilisez `@tuvix.js/module-federation` ou les import maps).
- Émettre les événements DOM `tuvix:mounted` pour les modules écrits à la main ; `defineMicroApp` et les adaptateurs de framework s'en chargent.

## Migrer depuis la 0.4

- L'orchestrateur utilise `getGlobalBus()` sauf si vous passez `eventBus` ; `destroy()` laisse le bus global actif.
- Les réconciliations ne démontent plus les apps montées manuellement ni les apps `mountWhenVisible`.
- `sandbox: true` rend dans un shadow root.
- `prefetch: 'hover'` ne fait le prefetch que des apps qu'un lien survolé ou focalisé active.
- `activeWhen` utilise `matchPath` : query et hash ignorés, `:param` fonctionne, `.` et `(` correspondent littéralement.
- `OrchestratorConfig.shared` est supprimé (il n'était jamais lu). Utilisez `@tuvix.js/module-federation` ou les import maps.
- Les `routes` du routeur correspondent entièrement : une route `'/'` désigne uniquement la page d'accueil ; utilisez `'/*'` pour tous les chemins. `RouteConfig.exact` est supprimé.
- `APP_ERROR` porte `phase` et se déclenche aussi pour les échecs de mise à jour et de démontage.
- `connectRouter({ subscribe, getPath })` remplace le pont `setTimeout` + `reconcile()` pour les routeurs externes.

## Licence

MIT

---
title: '@tuvix.js/core'
---

<PackageHeader
  name="@tuvix.js/core"
  title="Orchestrateur principal"
  description="Enregistre les micro apps, charge leurs entrées, puis les monte ou les démonte quand l'URL change. Suit le routeur intégré ou un routeur externe, isole le CSS d'une app dans un shadow root sur demande et signale les événements de cycle de vie sur un event bus partagé."
  icon="⚙️"
  npm="true"
/>

## Installation {#installation}

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

`@tuvix.js/core` dépend de `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` et `@tuvix.js/sandbox`. Votre gestionnaire de paquets les installe avec lui.

## Quand l'utiliser {#when-to-use-it}

Utilisez l'orchestrateur dans la page hôte (le shell) quand plusieurs apps construites indépendamment partagent une page et que l'URL décide laquelle est visible. Vous enregistrez chaque app une fois, avec l'URL de son entrée, son conteneur et les chemins qui lui reviennent. L'orchestrateur charge l'entrée à la première utilisation, appelle `bootstrap`, `mount` et `unmount` de l'app, et garde la page synchronisée à chaque navigation.

Choisissez autre chose dans ces cas :

- Vous rendez un îlot de framework par page et le serveur décide déjà quoi afficher. Les adaptateurs (`@tuvix.js/react`, `@tuvix.js/vue`, `@tuvix.js/svelte`, `@tuvix.js/angular`) et [`@tuvix.js/vite`](/fr/packages/vite) montent les îlots sans orchestrateur.
- Vous avez seulement besoin de charger un script distant et d'appeler vous-même son cycle de vie. Utilisez [`@tuvix.js/loader`](/fr/packages/loader).
- Vous voulez tout obtenir d'un seul import. Installez le paquet tout-en-un [`tuvix.js`](/fr/packages/tuvix), qui réexporte ce paquet.

## Démarrage rapide {#quick-start}

Le shell enregistre deux apps qui partagent `#main`, suit l'URL du navigateur avec le routeur intégré et transforme les clics sur les liens de même origine en navigations du routeur :

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/settings/*', app: 'settings' }],
  },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

// Active on /dashboard and every path below it.
orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

// No activeWhen: the router route above activates it on /settings/*.
orchestrator.register({
  name: 'settings',
  entry: {
    scripts: ['https://cdn.example.com/settings/main.js'],
    styles: ['https://cdn.example.com/settings/main.css'],
  },
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Chaque app distante publie son cycle de vie sous le nom que le shell a enregistré. `defineMicroApp` s'en charge pour du code DOM simple ; les adaptateurs de framework s'en chargent pour les composants React, Vue, Svelte et Angular.

```ts
// dashboard/main.ts, built to https://cdn.example.com/dashboard/main.js
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props, bus }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
    bus?.emit('dashboard:ready', { at: Date.now() });
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## Comment les apps deviennent actives {#how-apps-become-active}

Chaque app enregistrée suit l'une de cinq règles d'activation. L'orchestrateur choisit la règle d'après la configuration de l'app.

| Configuration | L'app est active quand | Qui la démonte |
| --- | --- | --- |
| `activeWhen: '/path'` | `matchPath('/path', currentPath).matched` vaut `true` | la réconciliation suivante où le chemin ne correspond plus |
| `activeWhen: (path) => boolean` | votre fonction renvoie `true` | la réconciliation suivante où elle renvoie `false` |
| pas de `activeWhen`, nommée dans `router.routes` | une route avec `app: name` correspond entièrement au chemin | la réconciliation suivante où aucune route de ce type ne correspond |
| pas de `activeWhen`, pas de route | jamais d'elle-même | vous, avec `mountApp` / `unmountApp` |
| `mountWhenVisible: true` | son conteneur est visible à au moins 10 % dans le viewport | vous ; les réconciliations l'ignorent et `activeWhen` n'est pas pris en compte |

Les chaînes `activeWhen` passent par [`matchPath`](/fr/packages/router) de `@tuvix.js/router`, le même matcher que celui du routeur et de `@tuvix.js/server` :

- `?query` et `#hash` sont ignorés, donc `/dashboard?tab=2` garde le dashboard monté.
- Un motif simple correspond à ses sous-chemins aux limites de segment : `'/dashboard'` correspond à `/dashboard` et `/dashboard/stats`, et ne correspond pas à `/dashboards`.
- `'/dashboard/*'` correspond aux mêmes chemins que `'/dashboard'`.
- `:name` correspond à un segment : `'/users/:id'` correspond à `/users/42`.
- `'/'` correspond à tous les chemins.
- Les autres caractères, comme `.` et `(`, correspondent littéralement.

Les `routes` du routeur utilisent au contraire une correspondance complète. `{ path: '/settings' }` correspond uniquement à `/settings` ; écrivez `'/settings/*'` pour inclure les sous-chemins. Une route `'/'` s'active uniquement sur la page d'accueil, et `'/*'` s'active sur tous les chemins. Les query strings et les hashes sont aussi ignorés ici.

### D'où vient le chemin courant {#where-the-current-path-comes-from}

L'orchestrateur lit le chemin depuis la première source qui existe :

1. Le routeur passé à `connectRouter` (son `getPath()`).
2. Le routeur intégré issu de `config.router` (son `currentPath`).
3. `window.location.pathname`.

Avec `config.router` ou `connectRouter`, chaque navigation déclenche une réconciliation. Sans aucun des deux, `start()` réconcilie une fois avec `window.location.pathname`, et rien ne réagit aux navigations suivantes tant que vous n'appelez pas `reconcile()`.

### Les réconciliations s'exécutent une par une {#reconciles-run-one-at-a-time}

Une réconciliation compare chaque app gérée par les routes avec le chemin et met le DOM en accord :

1. Les apps qui doivent être inactives sont démontées d'abord, toutes en parallèle, afin que deux apps qui partagent un conteneur ne se chevauchent jamais.
2. Les apps qui doivent être actives sont ensuite chargées (la première fois seulement), passent par la phase bootstrap (jusqu'à ce qu'un appel à `bootstrap` réussisse) et sont montées, en parallèle.

Quand une navigation arrive pendant une réconciliation, l'orchestrateur la met en file d'attente. Si trois navigations s'accumulent, seul le chemin le plus récent s'exécute ensuite, et la promesse de chaque appelant se résout quand la file se vide. Une app qui devient inactive pendant le chargement de son entrée saute son montage. Une app qui devient inactive au milieu de `mount()` est démontée dès que ce montage se termine. Naviguer rapidement de `/a` à `/b` puis à `/a` ne laisse que `a` monté.

## API {#api}

### `createOrchestrator`

```ts no-check
function createOrchestrator(config?: OrchestratorConfig): Orchestrator;
```

Crée un `Orchestrator`. Équivaut à `new Orchestrator(config)`.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | aucun | Crée le routeur intégré de `@tuvix.js/router` avec `mode` (`'history'` ou `'hash'`, `'history'` par défaut), `base` et `routes` (obligatoire, peut valoir `[]`). Nécessaire pour `navigateTo` et les événements `ROUTE_CHANGE`. |
| `eventBus` | `EventBusOptions` | aucun | Options (`maxListeners`, `debug`, `logger`) d'un bus privé. Sans cette option, l'orchestrateur utilise `getGlobalBus()`, le bus que partagent toutes les apps de la page. |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | Transmis au `ModuleLoader` interne. `timeout` s'applique à chaque tentative, en ms (`0` le désactive) ; `globals` est écrit sur `window` avant l'exécution des scripts d'une entrée. |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | Moment où télécharger les entrées avant qu'elles soient nécessaires. Voir ci-dessous. |
| `onError` | `(error: Error, appName: string) => void` | aucun | Appelé quand une app échoue au chargement, au bootstrap, au montage, à la mise à jour ou au démontage. `OrchestratorEvent.APP_ERROR` signale les mêmes échecs avec la phase. |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | aucun | Appelé à chaque changement de statut de chaque app. |

Les stratégies de prefetch téléchargent les URL de scripts et de styles avec `<link rel="prefetch">` ou `<link rel="modulepreload">` sans les exécuter. Les entrées de type fonction loader sont ignorées, car appeler la fonction exécuterait le module.

- `'immediate'` : toutes les apps enregistrées, pendant `start()`.
- `'idle'` : toutes les apps enregistrées, dans le premier `requestIdleCallback` après `start()` (un `setTimeout` de 200 ms là où cette API manque).
- `'hover'` : quand le pointeur entre sur un lien de même origine, ou que le focus s'y pose, l'orchestrateur fait le prefetch des apps que le chemin de ce lien activerait. Chaque app n'est préchargée qu'une fois. Le mode hash et `router.base` sont respectés.

`destroy()` annule les prefetch `idle` et `hover` en attente.

### `Orchestrator`

```ts no-check
class Orchestrator {
  constructor(config?: OrchestratorConfig);
  register(appConfig: MicroAppConfig): void;
  unregister(name: string): Promise<void>;
  start(): Promise<void>;
  mountApp(name: string): Promise<void>;
  unmountApp(name: string): Promise<void>;
  updateAppProps(name: string, props: Record<string, unknown>): Promise<void>;
  reconcile(path?: string): Promise<void>;
  connectRouter(source: RouterSource): () => void;
  navigateTo(path: string): Promise<void>;
  getAppStatus(name: string): AppStatus | null;
  getRegisteredApps(): string[];
  getMountedApps(): string[];
  getEventBus(): IEventBus;
  getRouter(): IRouter | null;
  destroy(): Promise<void>;
}
```

#### `register(appConfig)`

Stocke la configuration d'une app. Rien n'est chargé, monté ni réconcilié ; `start()` et les navigations suivantes s'en chargent.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | obligatoire | Nom unique de l'app. Le module distant doit s'enregistrer sous le même nom (`defineMicroApp({ name })` ou le `name` d'un adaptateur), ou exposer une nouvelle variable globale sur `window` avec une fonction `mount`. |
| `entry` | `Entry` | obligatoire | Une URL de script, un `EntryConfig` (`{ scripts, styles?, type?, integrity? }`) ou une fonction loader comme `() => import('./dashboard')`. Voir [`@tuvix.js/loader`](/fr/packages/loader). |
| `container` | `string \| HTMLElement` | obligatoire | Sélecteur CSS ou élément. Un sélecteur est résolu avec `document.querySelector` à chaque montage. |
| `activeWhen` | `string \| ((path: string) => boolean)` | aucun | Règle d'activation. Voir [Comment les apps deviennent actives](#how-apps-become-active). |
| `props` | `Record<string, unknown>` | aucun | Transmis à `mount()`. `updateAppProps` y fusionne ses valeurs. |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | `true` ou `{ css: true }` rend l'app dans un shadow root sur son conteneur. Voir [Isolation CSS](#css-isolation). |
| `fallback` | `string` | aucun | HTML écrit dans le conteneur avec `innerHTML` quand le chargement, le bootstrap ou le montage échoue. Les échecs de mise à jour et de démontage ne touchent pas au conteneur. |
| `mountWhenVisible` | `boolean` | `false` | Monte l'app dès que le conteneur est visible à 10 %, avec `IntersectionObserver`. Les réconciliations ignorent l'app et son `activeWhen`. |

Lève `[Tuvix] App name is required.`, `[Tuvix] App "<name>" is already registered.`, `[Tuvix] App "<name>" requires an entry.` ou `[Tuvix] App "<name>" requires a container.`.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile'),
  container: '#main',
  activeWhen: '/users/:id',
  fallback: '<p>The profile is unavailable.</p>',
});

orchestrator.register({
  name: 'comments',
  entry: 'https://cdn.example.com/comments/main.js',
  container: '#comments',
  mountWhenVisible: true,
});

await orchestrator.start();
```

#### `start()`

S'abonne au routeur intégré (s'il existe), réconcilie avec le chemin courant, met en place le prefetch et commence à observer les conteneurs `mountWhenVisible`. Émet `OrchestratorEvent.STARTED`. Se résout après la première réconciliation, y compris quand une app y a échoué ; les échecs vont à `onError`, à `APP_ERROR` et à la console. Un second appel journalise `[Tuvix] Orchestrator is already started.` et rend la main.

#### `mountApp(name)` / `unmountApp(name)`

Montent ou démontent une app à la main. Utilisez-les pour les apps sans `activeWhen` ni route ; pour les apps gérées par les routes, la réconciliation suivante remplace votre choix.

`mountApp` attend la fin d'un démontage en cours, puis charge et monte. Elle rejette avec l'erreur de chargement ou de montage après avoir rendu `fallback`. `unmountApp` attend la fin d'un chargement ou d'un montage en cours, puis démonte ; appelée pendant le chargement, elle saute entièrement le montage.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'chat', entry: '/chat/main.js', container: '#chat' });
await orchestrator.start();

document.querySelector('#open-chat')?.addEventListener('click', () => {
  orchestrator.mountApp('chat').catch(() => {
    // fallback HTML is already in #chat
  });
});
```

#### `updateAppProps(name, props)`

Fusionne superficiellement `props` dans les props actuelles de l'app. Une app montée qui possède une fonction `update` reçoit l'objet fusionné sous la forme `update({ props, container })`. Sinon, l'orchestrateur stocke les props fusionnées et les transmet au prochain `mount()`. Il attend d'abord la fin d'un montage en cours, pour que la mise à jour atteigne la nouvelle instance. Quand `update` lève une erreur, le statut passe à `error`, `onError` s'exécute, la promesse rejette et les props stockées restent inchangées.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'cart', entry: '/cart/main.js', container: '#cart', activeWhen: '/' });
await orchestrator.start();

await orchestrator.updateAppProps('cart', { currency: 'EUR' });
```

#### `reconcile(path?)`

Met en file une réconciliation avec `path`, ou avec le chemin courant si vous l'omettez. Utilisez-la quand aucun routeur n'informe l'orchestrateur des navigations. Les règles de file de [Les réconciliations s'exécutent une par une](#reconciles-run-one-at-a-time) s'appliquent.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.reconcile('/dashboard?tab=stats');
```

#### `connectRouter(source)`

Suit un routeur externe (TanStack Router, React Router, le vôtre) à la place du routeur intégré. `source.subscribe(callback)` doit appeler `callback` après chaque navigation et renvoyer une fonction de désabonnement ; `source.getPath()` renvoie le chemin courant. Après `start()`, chaque callback déclenche une réconciliation avec `getPath()`. `start()` lit aussi `getPath()`. Connecter un orchestrateur déjà démarré réconcilie immédiatement. Renvoie `disconnect()`.

```ts
import { createOrchestrator } from '@tuvix.js/core';

// TanStack Router instance created elsewhere in your shell.
declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'billing', entry: '/billing/main.js', container: '#main', activeWhen: '/billing' });

const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();

// Later, when the shell tears down:
disconnect();
```

Un data router de React Router (`createBrowserRouter`) suit la même forme : `subscribe: (callback) => router.subscribe(() => callback())` et `getPath: () => router.state.location.pathname`.

#### `navigateTo(path)`

Appelle `push(path)` sur le routeur intégré. La promesse se résout après le changement d'URL ; la réconciliation déclenchée s'exécute en arrière-plan. Lève `[Tuvix] No router configured.` sans `config.router`.

#### `getAppStatus(name)`, `getRegisteredApps()`, `getMountedApps()`

`getAppStatus` renvoie l'`AppStatus` de l'app, ou `null` pour un nom inconnu. `getRegisteredApps` renvoie tous les noms enregistrés. `getMountedApps` renvoie les noms dont le statut est `'mounted'` (une app en `'updating'` est exclue).

#### `getEventBus()`, `getRouter()`

`getEventBus` renvoie le bus sur lequel l'orchestrateur émet les `OrchestratorEvent` et qu'il transmet à `mount()` : `getGlobalBus()`, ou le bus privé si vous avez défini `eventBus`. `getRouter` renvoie le routeur intégré, ou `null`.

#### `unregister(name)`

Démonte l'app (en attendant un montage en cours), cesse d'observer son conteneur, retire les balises de script et de style de l'entrée, supprime le module en cache et oublie l'app. Rejette pour les noms inconnus. Les navigateurs n'exécutent un script module qu'une fois par URL, donc réenregistrer une entrée URL `type: 'module'` exige une nouvelle URL ou une fonction loader.

#### `destroy()`

Arrête le prefetch, se désabonne du routeur intégré et de chaque routeur connecté, attend la réconciliation en cours, démonte toutes les apps, vide le cache du loader et émet `OrchestratorEvent.DESTROYED`. Détruit un bus privé et laisse le bus global en vie. Les appels répétés renvoient la même promesse. Ensuite, `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` et `connectRouter` lèvent `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`.

### `defineMicroApp`

```ts no-check
function defineMicroApp(definition: MicroAppDefinition): MicroAppModule;
```

Valide un objet de cycle de vie, le publie avec `registerModule(definition.name, module)` de `@tuvix.js/loader` et le renvoie. Appelez-la dans l'entrée de l'app distante. L'orchestrateur trouve le module par son nom après l'exécution des scripts de l'entrée, que l'entrée soit une URL ou une fonction loader.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | obligatoire | Doit être égal au `name` enregistré par le shell. |
| `bootstrap` | `() => void \| Promise<void>` | aucun | S'exécute après le premier chargement, avant le premier montage. Quand elle lève une erreur, le montage échoue et le montage suivant la rappelle ; après un succès, elle ne s'exécute plus jamais pour cet orchestrateur. |
| `mount` | `(context: MountContext) => void \| Promise<void>` | obligatoire | Rend dans `context.container`. |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | obligatoire | Nettoie et vide `context.container`. |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | aucun | Applique `context.props` sans remontage. Sans elle, les nouvelles props attendent le prochain montage. |
| `ssr` | `boolean` | `false` | À définir quand `mount` adopte un balisage rendu côté serveur. L'événement `tuvix:mounted` signale alors `hydrated: true` si le conteneur contenait du balisage avant l'exécution de `mount`. |

`MountContext` contient :

| Champ | Type | Signification |
| --- | --- | --- |
| `container` | `HTMLElement` | Élément dans lequel rendre. Pour les apps à CSS isolé, c'est un `<div data-tuvix-sandbox-root>` dans le shadow root. |
| `props` | `Record<string, unknown> \| undefined` | Props actuelles. |
| `name` | `string \| undefined` | Le nom d'app enregistré. |
| `bus` | `MicroAppBus \| undefined` | L'event bus de l'orchestrateur (`on`, `once`, `emit`, `off`). |

Le module renvoyé enveloppe vos `mount` et `unmount` et émet les mêmes événements de cycle de vie DOM que les adaptateurs de framework, donc `whenMounted(name)`, `isMounted(name)` et `onLifecycle` de `@tuvix.js/loader` fonctionnent pour ces apps :

- `tuvix:mounted` après la résolution de `mount`, avec `{ name, container, hydrated }`.
- `tuvix:unmounted` après la résolution de `unmount`.
- `tuvix:error` quand l'une ou l'autre lève une erreur. L'enveloppe relance alors l'erreur.

Les événements remontent du conteneur jusqu'à `document`. Sur un conteneur non attaché au document, le runtime les émet directement sur `document`. Un `unmount` qui arrive pendant que `mount` s'exécute encore pour le même conteneur attend d'abord la fin de ce montage.

Lève `[Tuvix] defineMicroApp requires a "name" property.`, `[Tuvix] defineMicroApp "<name>" requires a "mount" function.` ou `[Tuvix] defineMicroApp "<name>" requires an "unmount" function.`.

```ts
import { defineMicroApp } from '@tuvix.js/core';

let offCart: (() => void) | undefined;

export default defineMicroApp({
  name: 'header',
  bootstrap() {
    console.log('header loaded');
  },
  mount({ container, props, bus }) {
    container.innerHTML = `<header>Hello, ${String(props?.user ?? 'guest')} <span id="count">0</span></header>`;
    offCart = bus?.on<{ count: number }>('cart:changed', ({ count }) => {
      const badge = container.querySelector('#count');
      if (badge) badge.textContent = String(count);
    });
  },
  update({ props, container }) {
    const header = container?.querySelector('header');
    if (header?.firstChild) header.firstChild.textContent = `Hello, ${String(props.user ?? 'guest')} `;
  },
  unmount({ container }) {
    offCart?.();
    container.replaceChildren();
  },
});
```

### `OrchestratorEvent`

Enum de chaînes des événements que l'orchestrateur émet sur son bus. Comme le bus par défaut est `getGlobalBus()`, n'importe quelle app de la page peut les écouter.

| Membre | Nom de l'événement | Payload |
| --- | --- | --- |
| `APP_REGISTERED` | `'tuvix:app:registered'` | `{ name }` |
| `APP_BOOTSTRAP` | `'tuvix:app:bootstrap'` | `{ name }` |
| `APP_MOUNT` | `'tuvix:app:mount'` | `{ name }` |
| `APP_UNMOUNT` | `'tuvix:app:unmount'` | `{ name }` |
| `APP_ERROR` | `'tuvix:app:error'` | `AppErrorEvent` : `{ name, error, phase }`, où `phase` vaut `'load'`, `'bootstrap'`, `'mount'`, `'update'` ou `'unmount'` |
| `APP_STATUS_CHANGE` | `'tuvix:app:status-change'` | `{ name, status }` |
| `ROUTE_CHANGE` | `'tuvix:route:change'` | le `NavigationEvent` du routeur intégré (`from`, `to`, `fromRoute`, `toRoute`) |
| `STARTED` | `'tuvix:started'` | `{}` |
| `DESTROYED` | `'tuvix:destroyed'` | `{}` |

`phase: 'load'` couvre la résolution du conteneur ainsi que le chargement de l'entrée.

```ts
import { createOrchestrator, getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
```

### Isolation CSS {#css-isolation}

`sandbox: true` ou `sandbox: { css: true }` isole le CSS d'une app :

1. Au premier montage, l'orchestrateur attache un shadow root ouvert au conteneur avec `CssSandbox` de [`@tuvix.js/sandbox`](/fr/packages/sandbox) et déplace les enfants existants (balisage rendu côté serveur) dans un `<div data-tuvix-sandbox-root="<name>">` à l'intérieur. L'app se monte dans ce div.
2. Les `styles` de l'entrée se chargent sous forme d'éléments `<link>` dans le shadow root au lieu de `document.head`. Le montage attend qu'ils se chargent ou échouent, pendant au plus `loader.timeout` ms (10000 par défaut ; avec `0`, il attend sans limite).
3. Le démontage conserve le shadow root. Le montage suivant le réutilise.

Les feuilles de style de la page ne ciblent plus les éléments de l'app, et les feuilles de style de l'app n'atteignent plus la page. Les propriétés héritées comme `color` et `font-family` traversent toujours la frontière du shadow DOM. `{ css: false }` et `false` rendent dans le light DOM.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'checkout',
  entry: { scripts: ['/checkout/main.js'], styles: ['/checkout/main.css'] },
  container: '#checkout',
  activeWhen: '/checkout',
  sandbox: { css: true },
});

await orchestrator.start();
```

L'orchestrateur n'isole pas le JavaScript. `JsSandbox` de [`@tuvix.js/sandbox`](/fr/packages/sandbox) est un utilitaire autonome que vous appelez vous-même.

### Types {#types}

| Type | Signification |
| --- | --- |
| `OrchestratorConfig` | Argument de `createOrchestrator` et de `new Orchestrator`. Voir le tableau sous `createOrchestrator`. |
| `MicroAppConfig` | Argument de `register`. Voir le tableau sous `register`. |
| `MicroAppDefinition` | Argument de `defineMicroApp` : `name`, `bootstrap?`, `mount`, `unmount`, `update?`. |
| `AppSandboxOption` | `boolean \| { css?: boolean }`, le champ `sandbox`. |
| `RouterSource` | `{ subscribe(callback: () => void): () => void; getPath(): string }`, l'argument de `connectRouter`. |
| `AppErrorEvent` | `{ name: string; error: Error; phase: AppErrorPhase }`, le payload de `APP_ERROR`. |
| `AppErrorPhase` | `'load' \| 'bootstrap' \| 'mount' \| 'update' \| 'unmount'`. |
| `AppStatus` | `'registered' \| 'bootstrapping' \| 'bootstrapped' \| 'mounting' \| 'mounted' \| 'updating' \| 'unmounting' \| 'unmounted' \| 'error'`. Le premier montage passe par `registered → bootstrapping → bootstrapped → mounting → mounted` ; un remontage suit `unmounted → mounting → mounted`. |
| `RegisteredApp` | Forme de l'enregistrement que l'orchestrateur tient pour une app : `config`, `status`, `module`, `container`, `error`, `lastUpdated`. Aucune méthode d'`Orchestrator` ne le renvoie en 0.5.0. |

### Réexportations {#re-exports}

`@tuvix.js/core` réexporte ces éléments depuis ses dépendances, pour qu'un shell puisse tout importer depuis un seul paquet. Chaque lien documente l'API complète.

| Export | Nature | Source |
| --- | --- | --- |
| `createEventBus`, `getGlobalBus` | fonction | [`@tuvix.js/event-bus`](/fr/packages/event-bus) |
| `IEventBus`, `EventHandler`, `Unsubscribe` | type | [`@tuvix.js/event-bus`](/fr/packages/event-bus) |
| `createRouter`, `matchPath`, `interceptLinks` | fonction | [`@tuvix.js/router`](/fr/packages/router) |
| `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions` | type | [`@tuvix.js/router`](/fr/packages/router) |
| `createLoader` | fonction | [`@tuvix.js/loader`](/fr/packages/loader) |
| `Entry`, `MicroAppModule` | type | [`@tuvix.js/loader`](/fr/packages/loader) |

`getGlobalBus()` conserve son instance sur `window.__TUVIX_GLOBAL_BUS__`, donc une micro app qui embarque sa propre copie de `@tuvix.js/event-bus` obtient le même bus que le shell.

## Cas limites {#edge-cases}

- `register()` avant `start()` stocke seulement la configuration. Après `start()`, enregistrer une app gérée par les routes (elle a un `activeWhen`, ou une route du routeur la nomme) réconcilie avec le chemin courant, donc l'app se monte immédiatement quand le chemin l'active.
- Une app `mountWhenVisible` enregistrée après `start()` est observée immédiatement. Un conteneur absent du DOM à ce moment (ou au moment de `start()`) est ignoré et jamais observé. Sans `IntersectionObserver` (serveur, anciens navigateurs), les apps liées au viewport ne se montent jamais.
- Une app liée au viewport dont le montage a échoué reste en `error` ; l'observer ne réessaie pas.
- Une app gérée par les routes en `error` réessaie à la prochaine réconciliation qui la veut active. Un chargement échoué recharge. Un `bootstrap` échoué relance `bootstrap` à la nouvelle tentative ; un `bootstrap` réussi ne se répète pas, donc un `mount` échoué ne réessaie que `mount`.
- Un conteneur manquant fait échouer le montage avec `[Tuvix] Container "#main" not found in DOM.`. Lors d'un premier montage, `fallback` n'a nulle part où se rendre.
- Les échecs de réconciliation ne font pas rejeter `start()`, `reconcile()` ni les navigations. L'orchestrateur journalise `[Tuvix] Failed to mount "<name>":` (ou `unmount`) dans la console et appelle `onError`. `mountApp` et `unmountApp` rejettent.
- `APP_ERROR` se déclenche pour les échecs de toutes les phases, avec `phase` qui la nomme. `fallback` ne se rend que pour les échecs de `load`, `bootstrap` et `mount`.
- Une app dont le démontage lève une erreur finit en `error` et compte comme démontée.
- `fallback` passe par `innerHTML`. Ne transmettez que du balisage de confiance.
- Le démontage retire de `document.head` les feuilles de style de l'entrée de l'app, sauf si une autre app chargée utilise la même URL. Le montage suivant les rajoute et les attend.
- Deux orchestrateurs sur une même page partagent `getGlobalBus()` et voient les `OrchestratorEvent` l'un de l'autre. Passez `eventBus: {}` pour donner un bus privé à l'un d'eux.
- `resetGlobalBus()` de `@tuvix.js/event-bus` détruit le bus que détient un orchestrateur en cours d'exécution. L'orchestrateur garde le bus détruit ; n'appelez `resetGlobalBus()` qu'après `destroy()`, par exemple entre deux tests.
- Les callbacks de `connectRouter` déclenchés avant `start()` sont ignorés. Appeler `connectRouter` deux fois conserve les deux abonnements ; la source la plus récente fournit le chemin pour `start()` et `reconcile()`.
- Avec à la fois `config.router` et `connectRouter`, chaque source réconcilie avec son propre chemin. Utilisez l'un ou l'autre.
- Les fonctions `activeWhen` reçoivent le chemin brut de la source. Avec le routeur intégré ou `connectRouter`, ce chemin peut contenir une query string ; `matchPath` la retire pour les motifs de type chaîne.
- `updateAppProps` remplace les objets imbriqués : `{ user: { id: 2 } }` écrase toute la prop `user`.

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Il n'isole pas le JavaScript. Les variables globales, les timers et les listeners créés par une app restent sur `window`. Utilisez `JsSandbox` de [`@tuvix.js/sandbox`](/fr/packages/sandbox).
- Il n'intercepte pas les clics sur les liens. Appelez `interceptLinks` (réexporté ici) ou laissez le routeur de votre framework naviguer.
- Il ne fait pas de rendu côté serveur. Utilisez [`@tuvix.js/server`](/fr/packages/server) et les entrées `./server` des adaptateurs.
- Il ne partage pas les dépendances entre apps. Utilisez [`@tuvix.js/module-federation`](/fr/packages/module-federation) ou les import maps.
- Il n'émet pas lui-même les événements de cycle de vie DOM (`tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`). Les modules issus de `defineMicroApp` et les adaptateurs de framework les émettent ; un `MicroAppModule` écrit à la main n'en émet aucun, sauf s'il appelle `emitLifecycle` de `@tuvix.js/loader`.
- Il ne garde pas une app en vie quand elle est démontée. L'état interne de l'app disparaît, sauf si l'app le stocke ailleurs.

## Migrer depuis 0.4 {#migrating-from-0-4}

Changements cassants de la 0.5.0 :

- **Event bus partagé.** Le bus de l'orchestrateur est `getGlobalBus()`, sauf si vous passez `eventBus`. En 0.4, chaque orchestrateur créait son propre bus. `destroy()` laisse désormais le bus global en vie.

  ```ts
  import { createOrchestrator } from '@tuvix.js/core';

  // 0.5: keep a private bus as in 0.4
  const orchestrator = createOrchestrator({ eventBus: {} });
  ```

- **Les apps manuelles restent montées.** Les réconciliations ne démontent plus les apps qui n'ont ni `activeWhen` ni route du routeur, ni les apps `mountWhenVisible`. En 0.4, le changement de route suivant démontait une app montée à la main. Appelez `unmountApp(name)` là où vous comptiez sur ce comportement.
- **`sandbox: true` utilise un shadow root.** Le CSS de la page n'atteint plus l'app, et les `styles` de l'entrée n'atteignent plus la page. Retirez `sandbox` ou définissez `{ css: false }` pour garder le rendu de la 0.4.
- **`prefetch: { strategy: 'hover' }`** ne fait le prefetch que des apps qu'active un lien survolé ou ayant le focus. En 0.4, le premier mouvement de souris n'importe où préchargeait toutes les apps.
- **`activeWhen` utilise `matchPath`.** Une query string ou un hash ne démonte plus une app, les segments `:param` fonctionnent, et les caractères comme `.` et `(` correspondent littéralement.
- **`shared` a disparu.** `OrchestratorConfig.shared` n'a jamais été lu et est retiré du type. Supprimez-le ; partagez les dépendances avec [`@tuvix.js/module-federation`](/fr/packages/module-federation) ou les import maps.
- **Les `routes` du routeur correspondent en entier.** Une route `{ path: '/', app: 'home' }` ne s'active que sur `/`. Utilisez `'/*'` pour une app qui s'affiche sur tous les chemins, ou `activeWhen: '/'`, qui garde la correspondance par préfixe. `RouteConfig.exact` est supprimé ; retirez-le.
- **Payload de `APP_ERROR`.** Il contient désormais `phase` et se déclenche aussi pour les échecs de mise à jour et de démontage. Les handlers qui supposaient un échec de montage doivent vérifier `phase`.

Le contournement de la 0.4 pour les routeurs externes peut disparaître :

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();

// 0.4:
// router.subscribe('onResolved', () => setTimeout(() => orchestrator.reconcile(location.pathname)));

// 0.5:
orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
```

Les versions précédentes de cette page décrivaient des méthodes et des options que `Orchestrator` ne possède pas. Utilisez les vrais noms :

| Ancienne page | API réelle |
| --- | --- |
| `createOrchestrator({ container })` | `container` appartient à chaque app dans `register()` |
| `register(name, options)` | `register({ name, entry, container, ... })` |
| `mount(name, props)` | `updateAppProps(name, props)` puis `mountApp(name)` |
| `unmount(name)` | `unmountApp(name)` |
| `update(name, props)` | `updateAppProps(name, props)` |
| `stop()` | `destroy()` |
| `onBeforeMount`, `onAfterMount` | `onStatusChange(name, status)` ou `OrchestratorEvent.APP_MOUNT` |
| `sandbox: { js: true }` | `JsSandbox` de `@tuvix.js/sandbox` |

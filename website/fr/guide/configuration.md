# Configuration

Toute la configuration se fait dans le code. Tuvix.js ne lit aucune variable d'environnement ni aucun fichier de configuration.

## Options de l'orchestrateur {#orchestrator-options}

```ts
import { createOrchestrator } from 'tuvix.js';

declare function reportError(error: Error, app: string): void;

const orchestrator = createOrchestrator({
  // Built-in router. Omit it when you follow an external router with connectRouter().
  router: {
    mode: 'history', // or 'hash'
    base: '/',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },

  // Passing eventBus options gives this orchestrator a private bus.
  // Omit it to share getGlobalBus() with every app on the page.
  eventBus: { maxListeners: 50, debug: false },

  // Forwarded to the module loader.
  loader: { timeout: 10000, retries: 2, retryDelay: 1000, globals: {} },

  // 'immediate' | 'idle' | 'hover' | 'none' (default)
  prefetch: { strategy: 'hover' },

  onError: (error, appName) => reportError(error, appName),
  onStatusChange: (appName, status) => console.debug(appName, status),
});
```

| Option | Défaut | Effet |
| --- | --- | --- |
| `router` | aucun | Crée le routeur intégré. Voir [Routage](/fr/guide/routing). |
| `eventBus` | aucun (bus global) | Bus privé avec ces options. `destroy()` détruit un bus privé et laisse le bus global en vie. |
| `loader.timeout` | `10000` | Millisecondes avant l'abandon d'une tentative de chargement. Plafonne aussi l'attente des feuilles de style en sandbox. |
| `loader.retries` | `2` | Tentatives supplémentaires après le premier échec. |
| `loader.retryDelay` | `1000` | Millisecondes entre les tentatives. |
| `loader.globals` | `{}` | Propriétés écrites sur `window` avant l'exécution des scripts d'une entrée. |
| `prefetch.strategy` | `'none'` | Quand récupérer les entrées avant leur montage. Voir le tableau ci-dessous. |
| `onError` | aucun | Appelé avec `(error, appName)` quand le chargement, bootstrap, mount, update ou unmount échoue. |
| `onStatusChange` | aucun | Appelé avec `(appName, status)` à chaque changement de statut. |

Pour partager des dépendances comme React entre les apps, utilisez `@tuvix.js/module-federation` ou des import maps. L'orchestrateur n'a pas d'option pour cela.

### Stratégies de prefetch {#prefetch-strategies}

| Stratégie | Quand les entrées sont récupérées |
| --- | --- |
| `none` | Uniquement au montage d'une app. |
| `immediate` | Chaque entrée enregistrée, juste après `start()`. |
| `idle` | Chaque entrée enregistrée, au premier `requestIdleCallback` après `start()` (délai de 200 ms là où l'API manque). |
| `hover` | Quand le pointeur entre sur un lien de même origine dont le chemin activerait une app, ou quand ce lien reçoit le focus. Chaque app est récupérée une seule fois. |

Le prefetch ajoute `<link rel="modulepreload">` pour les scripts module et `<link rel="prefetch">` pour les scripts classiques et les styles. Il ignore les entrées sous forme de fonction de chargement, car appeler la fonction exécuterait le module.

## Enregistrer une micro app {#registering-a-micro-app}

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main',
  activeWhen: '/dashboard/*',
  props: { theme: 'dark' },
  fallback: '<p>Dashboard is unavailable.</p>',
  sandbox: false,
  mountWhenVisible: false,
});
```

| Champ | Type | Effet |
| --- | --- | --- |
| `name` | `string` | Unique. Doit correspondre au nom sous lequel le module s'enregistre. |
| `entry` | `string \| EntryConfig \| EntryLoader` | La provenance du code. Voir ci-dessous. |
| `container` | `string \| HTMLElement` | Sélecteur ou élément. Résolu au moment du montage, donc l'élément doit seulement exister à ce moment-là. |
| `activeWhen` | `string \| (path) => boolean` | Motif de route ou prédicat. Sans lui, l'app suit les `routes` du routeur qui la nomment, ou vous la montez vous-même. |
| `props` | `Record<string, unknown>` | Props initiales. `updateAppProps` fusionne avec elles. |
| `fallback` | `string` | HTML écrit dans le conteneur quand le chargement, bootstrap ou mount échoue. |
| `sandbox` | `boolean \| { css?: boolean }` | `true` rend l'app dans un shadow root. Voir [Sandbox](/fr/guide/sandbox). |
| `mountWhenVisible` | `boolean` | Monte l'app dès que le conteneur est visible à 10 %. Les changements de route laissent alors l'app tranquille. |

### Formes d'entrée {#entry-forms}

```ts
import type { Entry } from 'tuvix.js';

// One classic script (UMD or IIFE bundle).
const classic: Entry = 'https://cdn.example.com/legacy/app.js';

// Scripts and styles. `type: 'module'` for ES module bundles such as Vite's `.js` output.
const esm: Entry = {
  scripts: ['https://cdn.example.com/cart/main.js'],
  styles: ['https://cdn.example.com/cart/main.css'],
  type: 'module',
  integrity: { 'https://cdn.example.com/cart/main.js': 'sha384-...' },
};

// A loader function. Your bundler code-splits it; the loader passes an AbortSignal.
const lazy: Entry = () => import('./apps/profile');
```

Sans `type`, les URL qui se terminent par `.mjs`, `.mts`, `.ts`, `.tsx` ou `.jsx` se chargent comme modules, et tout le reste se charge comme script classique. Un navigateur exécute un script module une seule fois par URL, donc une app `type: 'module'` que vous déchargez ne peut pas se recharger depuis la même URL. Utilisez une fonction de chargement quand vous devez décharger puis recharger.

### À savoir sur l'enregistrement {#things-to-know-about-registration}

- `register` lève une erreur pour un nom en double, une `entry` manquante ou un `container` manquant.
- `register` après `start()` prend effet immédiatement : une app gérée par les routes se monte si le chemin courant l'active, et une app `mountWhenVisible` est observée. Avant `start()`, `register` stocke seulement la configuration.
- Une app de viewport reste montée après être sortie de l'écran. Démontez-la avec `unmountApp(name)`.
- Une app sans `activeWhen` ni route du routeur reste dans l'état où vous la laissez. Appelez vous-même `mountApp(name)` et `unmountApp(name)`.
- `fallback` est du HTML brut. Ne le construisez pas à partir d'une saisie utilisateur.

## Options du routeur {#router-options}

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // 'hash' reads the path from location.hash
  base: '/app', // stripped before matching, added by push() and replace()
  routes: [
    { path: '/users/:id', app: 'users', meta: { title: 'User' } },
    { path: '/settings/*', app: 'settings' },
  ],
});

router.beforeEach(async ({ to }) => !to.startsWith('/admin'));
```

Les chemins de route correspondent au chemin entier, donc `/settings` correspond uniquement à `/settings` et `/settings/`, et `'/'` correspond uniquement à `/`. Terminez un chemin par `/*` pour inclure les sous-chemins ; `'/*'` correspond à tous les chemins.

## Options de la sandbox {#sandbox-options}

```ts
import { createSandbox } from 'tuvix.js';

const sandbox = createSandbox({
  css: true, // shadow root on activate()
  js: true, // proxy window for execScript()
  allowedGlobals: ['gtag'], // extra globals strict mode lets you write
  strict: false, // true: writing any other global throws a TypeError
});
```

L'orchestrateur applique l'isolation CSS aux apps enregistrées avec `sandbox: true`. Il n'applique jamais `JsSandbox`. Voir [Sandbox](/fr/guide/sandbox).

## Options de l'event bus {#event-bus-options}

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus({
  maxListeners: 0, // 0 = unlimited; past the limit, `on` still adds the listener and warns once per event
  debug: false, // log every emit and subscription
  logger: console.log,
});
```

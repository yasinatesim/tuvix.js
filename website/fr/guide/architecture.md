# Architecture

Tuvix.js se compose de petits paquets. L'orchestrateur de `@tuvix.js/core` les relie entre eux ; chaque autre paquet fonctionne aussi seul.

## Les paquets et leurs rôles {#packages-and-their-jobs}

```text
@tuvix.js/core          createOrchestrator, defineMicroApp: registry, reconcile, props
@tuvix.js/router        createRouter, matchPath, interceptLinks
@tuvix.js/loader        ModuleLoader, registerModule, lifecycle runtime
@tuvix.js/event-bus     createEventBus, getGlobalBus
@tuvix.js/sandbox       CssSandbox (shadow DOM), JsSandbox (proxy window)
@tuvix.js/react         createReactMicroApp, TuvixReactApp, TuvixIsland
@tuvix.js/vue           createVueMicroApp, renderVueToString (/server)
@tuvix.js/svelte        createSvelteMicroApp, renderSvelteToString (/server)
@tuvix.js/angular       createAngularMicroApp, renderAngularToString (/server)
@tuvix.js/vite          Vite plugin: island CSS links for the server-rendered <head>
@tuvix.js/server        Server-side composition of HTML fragments
@tuvix.js/module-federation  Entries backed by webpack remotes
@tuvix.js/devtools      In-page debug panel
tuvix.js                Umbrella: core, router, loader, event bus, sandbox
create-tuvix-app        Project scaffolding
```

## De la navigation au montage {#from-navigation-to-mount}

```text
URL changes (router.push, popstate, connectRouter callback, or reconcile(path))
  │
  ▼
orchestrator queues a reconcile for the path
  │  (only the newest queued path runs next)
  ▼
for each app: should it be mounted?  activeWhen string → matchPath
  │                                   activeWhen function → your code
  │                                   no activeWhen → router routes naming it
  ▼
phase 1: unmount every app that turned inactive
phase 2: mount every app that turned active
  │
  ▼
loader.load(name, entry)   function entry → await it
  │                        URL entry → <script>/<link> tags, then registry lookup
  ▼
module.bootstrap()  (first load only)
module.mount({ container, props, name, bus })
```

La phase 1 se termine avant que la phase 2 commence, donc deux apps qui partagent `#app` ne s'y trouvent jamais en même temps. Si un nouveau chemin arrive pendant une réconciliation, l'orchestrateur termine l'étape en cours puis réconcilie le chemin le plus récent. Naviguer de A → B → A en succession rapide ne laisse que A montée.

## Le contrat du module {#the-module-contract}

Chaque micro app, écrite à la main ou produite par un adaptateur, a cette forme (`MicroAppModule` de `@tuvix.js/loader`) :

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  async bootstrap() {
    // once, before the first mount
  },
  async mount({ container, props, name, bus }) {
    container.textContent = `${name ?? ''}: ${JSON.stringify(props ?? {})}`;
    bus?.emit('app:ready', { name });
  },
  async update({ props, container }) {
    if (container) container.textContent = JSON.stringify(props);
  },
  async unmount({ container }) {
    container.replaceChildren();
  },
};
```

- `bootstrap` s'exécute une fois par module chargé.
- `mount` reçoit le conteneur, les props courantes, le nom de l'app et l'event bus de l'orchestrateur.
- `update` reçoit les props fusionnées quand le shell appelle `updateAppProps`. `container` indique à un module monté à plusieurs endroits quel montage mettre à jour.
- `unmount` doit retirer tout ce que `mount` a créé.

## Comment le loader trouve un module {#how-the-loader-finds-a-module}

1. **Entrée sous forme de fonction de chargement** (`() => import('./app')`) : le loader utilise le module résolu, sinon son export `default`, sinon le module enregistré sous le nom de l'app.
2. **Entrée sous forme d'URL** : le loader ajoute des balises `<script>` et `<link>`, attend leur chargement, puis lit le module dans le registre que remplit `registerModule(name, module)`. Les adaptateurs et `defineMicroApp` appellent `registerModule` pour vous.
3. **Fallback UMD** : si rien n'a été enregistré, le loader choisit une nouvelle variable globale de `window` qui possède une fonction `mount`. Quand plusieurs sont apparues, il choisit celle dont le nom correspond au nom de l'app, et échoue sinon.

Le registre et l'état du cycle de vie résident sur `window.__TUVIX_RUNTIME__`, donc des micro apps construites séparément, chacune avec sa propre copie de `@tuvix.js/loader`, voient toujours un seul registre.

Les scripts se chargent en `type="module"` quand l'entrée définit `type: 'module'` ou que l'URL se termine par `.mjs`, `.mts`, `.ts`, `.tsx` ou `.jsx`. Les autres URL se chargent comme des scripts classiques.

## État partagé à l'exécution {#shared-runtime-state}

| État | Où il réside | Pourquoi |
| --- | --- | --- |
| Registre des modules | `window.__TUVIX_RUNTIME__` (aussi `window.__TUVIX_MODULES__`) | Le loader trouve les apps de n'importe quel bundle |
| Apps montées et attentes | `window.__TUVIX_RUNTIME__` | `whenMounted` fonctionne d'un bundle à l'autre |
| Event bus global | `window.__TUVIX_GLOBAL_BUS__` | `getGlobalBus()` renvoie un seul bus par page |

Côté serveur, sans `window`, chacun de ces états est limité au module.

## Modèle d'isolation {#isolation-model}

- **CSS** : `sandbox: true` sur `register` rend l'app dans un shadow root et y charge les `styles` de son entrée. Voir [Sandbox](/fr/guide/sandbox).
- **JavaScript** : aucune isolation par défaut. Toutes les apps partagent `window`, `document` et les variables globales. `JsSandbox` isole uniquement le code que vous exécutez via son proxy.

## Pour aller plus loin {#where-to-look-next}

- [Hooks de cycle de vie](/fr/guide/lifecycle) : le contrat en détail.
- [Événements de cycle de vie](/fr/guide/lifecycle-events) : savoir quand une app est sur la page.
- [Routage](/fr/guide/routing) : les règles des motifs.

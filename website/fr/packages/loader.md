---
title: '@tuvix.js/loader'
---

<PackageHeader
  name="@tuvix.js/loader"
  title="Loader"
  description="Charge les bundles de micro apps par nom depuis des URL de scripts ou des fonctions loader, avec nouvelles tentatives, délais d'expiration, un registre de modules partagé et des événements de cycle de vie."
  icon="📦"
  npm="true"
/>

## Installation {#installation}

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

## Quand l'utiliser {#when-to-use-it}

`@tuvix.js/loader` transforme une entrée (une URL de script, une liste de scripts et de styles, ou `() => import('./app')`) en un module de micro app avec `mount` et `unmount`. Il ajoute les balises `<script>` et `<link>`, relance les tentatives échouées, abandonne après un délai d'expiration et met le résultat en cache par nom d'app.

`@tuvix.js/core` crée un `ModuleLoader` pour vous et lui transmet l'option `loader` de `createOrchestrator`, donc la plupart des shells n'importent jamais ce paquet. Importez-le quand vous :

- écrivez une micro app ou un adaptateur qui se publie avec `registerModule`, ou qui signale `tuvix:mounted` avec `emitLifecycle`
- devez savoir quand une autre app s'est montée (`whenMounted`, `onLifecycle`)
- chargez des micro apps sans l'orchestrateur, par exemple depuis votre propre routeur
- chargez un seul script ou une seule feuille de style avec déduplication (`loadScript`, `loadStyle`)

Si votre bundler peut importer l'app au moment du build et que vous ne chargez jamais de code depuis une autre origine, un simple `import()` suffit.

## Démarrage rapide {#quick-start}

La micro app publie son module sous un nom. Ce fichier est construit vers `https://cdn.example.com/dashboard/main.js` :

```ts
// dashboard/src/main.ts
import { registerModule } from '@tuvix.js/loader';

registerModule('dashboard', {
  mount({ container, props }) {
    container.innerHTML = `<h2>Dashboard for user ${String(props?.userId)}</h2>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Le shell le charge par son nom et le monte :

```ts
// shell/src/main.ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 15000, retries: 1 });
const container = document.getElementById('dashboard')!;

const result = await loader.load('dashboard', {
  scripts: ['https://cdn.example.com/dashboard/main.js'],
  styles: ['https://cdn.example.com/dashboard/main.css'],
  type: 'module',
});

if (result.module) {
  await result.module.mount({ container, props: { userId: 42 } });
} else {
  container.textContent = 'The dashboard is unavailable.';
  console.error(result.error);
}
```

`load()` ne lève jamais d'erreur. Un chargement échoué revient avec `status: 'error'`, `module: null` et la dernière erreur.

## Formes d'entrée {#entry-forms}

Une `Entry` indique au loader où se trouve le code d'une app. Elle prend trois formes.

**Une chaîne d'URL.** Le loader traite `'https://cdn.example.com/app.js'` comme `{ scripts: ['https://cdn.example.com/app.js'] }`.

**Un objet `EntryConfig` :**

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `scripts` | `string[]` | obligatoire | URL de scripts. Le loader les exécute l'une après l'autre dans cet ordre. Un tableau vide ne charge rien et résout le module depuis le registre. |
| `styles` | `string[]` | `[]` | URL de feuilles de style, chargées en parallèle des scripts. Le chargement attend les deux. |
| `type` | `'module' \| 'classic'` | déduit par URL | Type de script pour chaque URL de `scripts`. Sans cette option, les URL qui se terminent par `.mjs`, `.mts`, `.ts`, `.tsx` ou `.jsx` se chargent en `type="module"` et toutes les autres en script classique. Indiquez `'module'` pour une sortie ES de Vite ou Rollup, qui se termine par `.js`. |
| `integrity` | `Record<string, string>` | aucun | Empreintes Subresource Integrity indexées par URL. Le loader les écrit sur les balises `<script>`, `<link>` et de prefetch. |

**Une fonction loader (`EntryLoader`).** Le loader l'appelle avec `{ signal }` et accepte trois résultats, vérifiés dans cet ordre :

1. un module avec une fonction `mount`
2. un objet dont l'export `default` est un tel module (un namespace de module ES)
3. rien d'exploitable, auquel cas le loader cherche le module que l'import a enregistré avec `registerModule(name, ...)`

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();
```

Votre bundler découpe `./dashboard` dans son propre chunk et le télécharge au premier montage. Les fonctions loader sont aussi le moyen par lequel [`@tuvix.js/module-federation`](/fr/packages/module-federation) branche un remote fédéré sur l'orchestrateur.

`signal` est annulé quand la tentative dépasse le délai. Transmettez-le à tout ce que vous appelez avec `fetch` en chemin :

```ts
import type { EntryLoader } from '@tuvix.js/loader';

const entry: EntryLoader = async ({ signal }) => {
  const response = await fetch('/api/manifest/dashboard.json', { signal });
  const { url } = (await response.json()) as { url: string };
  return import(/* @vite-ignore */ url);
};
```

## API {#api}

### `ModuleLoader`

```ts no-check
class ModuleLoader {
  constructor(options?: LoaderOptions);
  load(name: string, entry: Entry): Promise<LoadResult>;
  prefetch(entry: Entry): void;
  removeStyles(name: string): void;
  unload(name: string): void;
  clearCache(): void;
  isLoaded(name: string): boolean;
  getModule(name: string): MicroAppModule | null;
  getStatus(name: string): LoadStatus;
  getCachedNames(): string[];
}
```

Chaque `ModuleLoader` garde son propre cache de modules résolus, indexé par nom d'app. Les balises `<script>` et `<link>` valent pour toute la page : deux loaders qui chargent la même URL partagent une seule balise.

`LoaderOptions` :

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Limite de temps en ms pour une tentative, qui couvre tous les scripts et toutes les feuilles de style de l'entrée. `0` la désactive. |
| `retries` | `number` | `2` | Tentatives supplémentaires après l'échec de la première. `2` signifie jusqu'à 3 tentatives. |
| `retryDelay` | `number` | `1000` | Attente en ms entre deux tentatives. |
| `globals` | `Record<string, unknown>` | `{}` | Propriétés que le loader assigne à `window` avant chaque tentative d'une entrée URL, pour les bundles UMD qui attendent `window.React` ou un objet de configuration. Les entrées de type fonction loader l'ignorent. |

#### `load(name, entry)`

Se résout en un `LoadResult` :

| Champ | Type | Signification |
| --- | --- | --- |
| `status` | `'loaded' \| 'error'` | Résultat du chargement. |
| `module` | `MicroAppModule \| null` | Le module résolu, `null` en cas d'erreur. |
| `error` | `Error \| null` | L'erreur de la dernière tentative. |
| `duration` | `number` | Millisecondes entre l'appel et le résultat, mesurées avec `performance.now()`. |

Pour une entrée URL, une tentative :

1. assigne `options.globals` à `window`
2. ajoute les scripts dans l'ordre, chacun attendant le précédent, et les feuilles de style en parallèle
3. lit le module dans le registre (`getRegisteredModule(name)`)
4. se rabat sur une variable globale UMD : une propriété de `window` avec une fonction `mount` apparue pendant ce chargement

Le loader vérifie ensuite que le module possède les fonctions `mount` et `unmount` et le met en cache sous `name`. Les appels suivants avec le même nom renvoient le module en cache et ignorent `entry`. Un second appel pendant que le premier charge encore renvoie la même promesse. Les chargements de noms différents s'exécutent en parallèle.

#### `prefetch(entry)`

Demande au navigateur de télécharger les fichiers d'une entrée sans les exécuter. Les scripts module reçoivent `<link rel="modulepreload">` ; les scripts classiques et les feuilles de style reçoivent `<link rel="prefetch">`. Les entrées de type fonction loader sont ignorées, car appeler la fonction exécuterait le module. L'orchestrateur l'appelle pour son réglage `prefetch`.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
loader.prefetch({ scripts: ['/apps/settings/main.js'], type: 'module' });
```

#### `removeStyles(name)`

Retire les feuilles de style d'une app chargée pour que son CSS cesse de s'appliquer pendant qu'elle est démontée. Une feuille de style reste en place quand une autre app en cache, dont vous n'avez pas retiré les styles, liste la même URL. Le `load(name)` suivant rajoute les feuilles de style et les attend avant de se résoudre. L'orchestrateur appelle `removeStyles` après chaque démontage.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
const container = document.getElementById('cart')!;
const { module } = await loader.load('cart', { scripts: ['/cart.js'], styles: ['/cart.css'] });

await module?.mount({ container });
await module?.unmount({ container });
loader.removeStyles('cart');
```

#### `unload(name)`

Oublie une app : retire ses feuilles de style et ses balises de script, la supprime du cache et la désenregistre du registre partagé quand le module enregistré est celui que ce loader a résolu. Le `load(name)` suivant télécharge et exécute de nouveau l'entrée. L'orchestrateur l'appelle depuis `unregister(name)`.

#### `clearCache()`

Appelle `unload` pour chaque app en cache. L'orchestrateur l'appelle depuis `destroy()`.

#### `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()`

Lisent le cache. `getStatus` renvoie `'loading'` pendant un chargement, `'loaded'` une fois le module en cache, et `'idle'` sinon. Un chargement échoué laisse le statut à `'idle'`.

### `createLoader`

```ts no-check
function createLoader(options?: LoaderOptions): ModuleLoader;
```

Équivaut à `new ModuleLoader(options)`. Prend les `LoaderOptions` du tableau ci-dessus.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 8000, retries: 0, globals: { APP_ENV: 'production' } });
```

Pour définir ces options pour l'orchestrateur, passez-les dans `loader` :

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({ loader: { timeout: 15000, retries: 1, retryDelay: 500 } });
```

### `normalizeEntry`

```ts no-check
function normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

Transforme une URL en `{ scripts: [url] }` et renvoie un `EntryConfig` tel quel. N'accepte pas les fonctions loader ; vérifiez d'abord `typeof entry === 'function'`.

```ts
import { normalizeEntry } from '@tuvix.js/loader';

normalizeEntry('https://cdn.example.com/app.js'); // { scripts: ['https://cdn.example.com/app.js'] }
```

### `loadScript`

```ts no-check
function loadScript(url: string, options?: LoadScriptOptions | string): Promise<void>;
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `type` | `'module' \| 'classic'` | déduit de l'extension | Type de script, avec les mêmes règles que `EntryConfig.type`. |
| `integrity` | `string` | aucun | Empreinte SRI pour l'attribut `integrity`. |
| `signal` | `AbortSignal` | aucun | Arrête l'attente en cas d'annulation. La promesse rejette avec la raison du signal. |

Ajoute `<script crossorigin="anonymous">` à `document.head` et se résout sur son événement `load`. Les appels simultanés pour une même URL partagent une balise, et un appel pour une URL déjà chargée se résout immédiatement. Un chargement échoué retire sa balise et rejette avec `[Tuvix Loader] Failed to load script: <url>`, donc l'appel suivant repart d'une balise neuve. Un appel annulé ne retire la balise que si aucun autre appelant ne l'attend encore. `loadScript` n'a pas de délai d'expiration propre ; passez un `signal`.

Une chaîne en second argument est lue comme l'empreinte d'intégrité, comme en 0.4.

```ts
import { loadScript } from '@tuvix.js/loader';

await loadScript('https://cdn.example.com/charts.js', { type: 'classic', signal: AbortSignal.timeout(5000) });
```

### `loadStyle`

```ts no-check
function loadStyle(url: string, options?: LoadStyleOptions | number): Promise<void>;
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Fait échouer le chargement après ce nombre de ms avec `[Tuvix Loader] Style load timed out: <url>`. `0` le désactive. |
| `integrity` | `string` | aucun | Empreinte SRI pour l'attribut `integrity`. |
| `signal` | `AbortSignal` | aucun | Arrête l'attente en cas d'annulation. |

Ajoute `<link rel="stylesheet" crossorigin="anonymous">` à `document.head`, avec les mêmes règles de partage, d'échec et d'annulation que `loadScript`. Un nombre en second argument est lu comme le délai d'expiration, comme en 0.4.

```ts
import { loadStyle } from '@tuvix.js/loader';

await loadStyle('https://cdn.example.com/app.css', { timeout: 5000 });
```

### `removeScript`

```ts no-check
function removeScript(url: string): void;
```

Retire la balise que `loadScript` a ajoutée pour `url`, ainsi que tout `<script>` dont l'attribut `src` vaut `url`. Un chargement encore en cours pour cette URL rejette avec `[Tuvix Loader] Removed before load: <url>`. Le `loadScript(url)` suivant ajoute une nouvelle balise. Le code que le script a déjà exécuté reste en mémoire.

### `removeStyle`

```ts no-check
function removeStyle(url: string): void;
```

Équivaut à `removeScript` pour les balises `<link rel="stylesheet">`.

### `prefetchResource`

```ts no-check
function prefetchResource(url: string, options?: PrefetchOptions): void;
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `as` | `'script' \| 'style'` | `'style'` pour les URL `.css`, sinon `'script'` | Nature de la ressource. |
| `type` | `'module' \| 'classic'` | déduit de l'extension | Les scripts module reçoivent `rel="modulepreload"`. |
| `integrity` | `string` | aucun | Empreinte SRI pour le lien. |

Ajoute un seul `<link>` par URL et par page. Une URL que `loadScript` ou `loadStyle` gère déjà, ou qui a déjà fait l'objet d'un prefetch, est ignorée.

```ts
import { prefetchResource } from '@tuvix.js/loader';

prefetchResource('https://cdn.example.com/app.js', { type: 'module' });
```

### `registerModule`

```ts no-check
function registerModule(name: string, module: MicroAppModule): void;
```

Publie un module sous un nom pour qu'un loader puisse le trouver après l'exécution du script de l'app. Un second appel avec le même nom remplace le premier module. Les adaptateurs React, Vue, Svelte et Angular ainsi que `defineMicroApp` de core l'appellent pour vous ; appelez-le vous-même quand vous écrivez le module à la main.

Le registre et l'état des apps montées résident sur `window.__TUVIX_RUNTIME__`, et la table des modules est aussi accessible via `window.__TUVIX_MODULES__`. Des micro apps qui embarquent chacune leur propre copie de `@tuvix.js/loader` lisent et écrivent le même registre. Sur le serveur, sans `window`, l'état réside dans le module.

Une micro app écrite à la main qui respecte le contrat des adaptateurs :

```ts
import { emitLifecycle, hasServerMarkup, registerModule } from '@tuvix.js/loader';

registerModule('clock', {
  mount({ container }) {
    const hydrated = hasServerMarkup(container);
    if (!hydrated) container.textContent = new Date().toLocaleTimeString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
});
```

### `unregisterModule`

```ts no-check
function unregisterModule(name: string): void;
```

Retire un module du registre. `ModuleLoader.unload` l'appelle pour les modules qu'il a résolus.

### `getRegisteredModule`

```ts no-check
function getRegisteredModule(name: string): MicroAppModule | undefined;
```

Renvoie le module enregistré, ou `undefined`.

### `emitLifecycle`

```ts no-check
function emitLifecycle(type: 'mounted' | 'unmounted' | 'error', detail: LifecycleDetail): void;
```

Enregistre un changement de cycle de vie et émet un `CustomEvent` nommé `tuvix:mounted`, `tuvix:unmounted` ou `tuvix:error`. L'événement remonte (bubbles) et est `composed`, donc un listener sur `document` entend les événements des conteneurs situés dans des shadow roots. Quand `detail.container` est dans le DOM, l'événement est émis sur le conteneur et remonte une fois jusqu'à `document`. Quand le conteneur est détaché (`isConnected` vaut `false`), par exemple parce que React a retiré un îlot avant que l'adaptateur signale `unmounted`, l'événement est émis sur `document` lui-même, car un événement émis sur un élément détaché ne l'atteint jamais. Dans les deux cas, `detail.container` pointe toujours vers l'élément. `event.detail` est le `LifecycleDetail` :

| Champ | Type | Signification |
| --- | --- | --- |
| `name` | `string` | Nom de la micro app. |
| `container` | `HTMLElement` | Élément dans lequel l'app a été rendue. |
| `hydrated` | `boolean` | `true` quand l'adaptateur a adopté un balisage rendu côté serveur au lieu de faire un rendu neuf. |
| `error` | `unknown` | La valeur levée, définie sur les événements `error`. |

`mounted` enregistre le conteneur comme monté pour `detail.name` et résout les promesses `whenMounted(name)` en attente. `unmounted` retire ce conteneur de l'enregistrement. `error` se contente d'émettre l'événement. Les adaptateurs React, Vue, Svelte et Angular ainsi que `defineMicroApp` de core l'appellent à la fin du montage et du démontage, et quand l'un ou l'autre lève une erreur.

### `isMounted`

```ts no-check
function isMounted(name: string): boolean;
```

`true` tant qu'au moins un conteneur de `name` est monté. Le runtime suit les conteneurs montés par app, donc si un module se monte dans deux conteneurs et que vous en démontez un, `isMounted(name)` reste `true` jusqu'au démontage du second.

### `whenMounted`

```ts no-check
function whenMounted(name: string, options?: { signal?: AbortSignal }): Promise<LifecycleDetail>;
```

Se résout avec le `LifecycleDetail` du premier montage. Si l'app est déjà montée, elle se résout immédiatement avec le détail de son plus ancien conteneur encore monté. Annulez `signal` pour arrêter l'attente ; la promesse rejette alors avec la raison du signal.

```ts
import { whenMounted } from '@tuvix.js/loader';

const { container, hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log(`header mounted into #${container.id}, hydrated: ${hydrated}`);
```

### `onLifecycle`

```ts no-check
function onLifecycle(type: LifecycleType, handler: (detail: LifecycleDetail) => void, target?: EventTarget): () => void;
```

Écoute `tuvix:<type>` sur `target` (`document` par défaut) et renvoie une fonction qui retire le listener. Avec la cible par défaut, le handler s'exécute une fois par événement, que le conteneur soit attaché ou détaché. Un listener sur un élément conteneur n'entend pas les événements émis pendant que ce conteneur est détaché.

```ts
import { onLifecycle } from '@tuvix.js/loader';

const stop = onLifecycle('error', ({ name, error }) => {
  console.error(`Micro app "${name}" failed`, error);
});

// later
stop();
```

Sans ce paquet, écoutez l'événement DOM :

```ts
import type { LifecycleEvent } from '@tuvix.js/loader';

document.addEventListener('tuvix:mounted', (event) => {
  const { name, hydrated } = (event as LifecycleEvent).detail;
  console.log(name, hydrated);
});
```

### `hasServerMarkup`

```ts no-check
function hasServerMarkup(container: Element): boolean;
```

`true` quand l'élément a un élément enfant ou un nœud texte contenant du texte autre que des espaces. Les commentaires et les espaces ne comptent pas. Les adaptateurs s'en servent pour choisir entre hydrater et faire un rendu neuf.

### Types {#types}

Les interfaces qu'implémente un module de micro app :

```ts
interface MicroAppModule {
  bootstrap?: () => void | Promise<void>;
  mount: (context: MountContext) => void | Promise<void>;
  unmount: (context: UnmountContext) => void | Promise<void>;
  update?: (context: UpdateContext) => void | Promise<void>;
  [key: string]: unknown;
}

interface MountContext {
  container: HTMLElement;
  props?: Record<string, unknown>;
  /** App name the orchestrator registered this module under */
  name?: string;
  /** The orchestrator's event bus */
  bus?: MicroAppBus;
}

interface UnmountContext {
  container: HTMLElement;
}

interface UpdateContext {
  props: Record<string, unknown>;
  /** Container to update; without it, adapters update every mounted instance */
  container?: HTMLElement;
}

interface MicroAppBus {
  on<T = unknown>(event: string, handler: (data: T) => void): () => void;
  once<T = unknown>(event: string, handler: (data: T) => void): () => void;
  emit<T = unknown>(event: string, data?: T): void;
  off<T = unknown>(event: string, handler: (data: T) => void): void;
}
```

L'orchestrateur transmet `name` et `bus` à chaque montage. `bus` est l'instance [`@tuvix.js/event-bus`](/fr/packages/event-bus) de l'orchestrateur ; `MicroAppBus` la décrit de façon structurelle, donc le loader ne dépend pas du paquet event bus.

| Type | Signification |
| --- | --- |
| `Entry` | `string \| EntryConfig \| EntryLoader`. |
| `EntryConfig` | `{ scripts, styles?, type?, integrity? }`, voir [Formes d'entrée](#entry-forms). |
| `EntryLoader` | `(context: EntryLoaderContext) => Promise<MicroAppModule \| { default: MicroAppModule }>`. |
| `EntryLoaderContext` | `{ signal: AbortSignal }`. |
| `ScriptType` | `'module' \| 'classic'`. |
| `MicroAppModule` | Objet de cycle de vie qu'exporte une micro app. |
| `MountContext`, `UnmountContext`, `UpdateContext` | Arguments de `mount`, `unmount` et `update`. |
| `MicroAppBus` | `{ on, once, emit, off }` ; `IEventBus` le satisfait. |
| `LoaderOptions` | `{ timeout?, retries?, retryDelay?, globals? }`. |
| `LoadResult` | `{ status, module, error, duration }`. |
| `LoadStatus` | `'idle' \| 'loading' \| 'loaded' \| 'error'`. |
| `CacheEntry` | `{ module, loadedAt, entry }`, un module en cache. |
| `PrefetchStrategy` | `'immediate' \| 'idle' \| 'hover' \| 'none'`. Le loader ne le lit pas. |
| `ResourceOptions` | `{ integrity?, signal? }`, commun à `loadScript` et `loadStyle`. |
| `LoadScriptOptions` | `ResourceOptions` plus `type?`. |
| `LoadStyleOptions` | `ResourceOptions` plus `timeout?`. |
| `PrefetchOptions` | `{ as?, type?, integrity? }`. |
| `LifecycleType` | `'mounted' \| 'unmounted' \| 'error'`. |
| `LifecycleDetail` | `{ name, container, hydrated, error? }`. |
| `LifecycleEvent` | `CustomEvent<LifecycleDetail>`. |

## Cas limites {#edge-cases}

- **Délais d'expiration.** `timeout` couvre une tentative entière. Quand il expire, le loader annule le `signal` de la tentative, retire les balises de la tentative qu'aucun autre chargement n'attend, attend `retryDelay` et réessaie. L'erreur indique `[Tuvix Loader] Loading "<name>" timed out after <timeout>ms`. Une fonction loader qui ignore `signal` continue de s'exécuter en arrière-plan ; le loader cesse de l'attendre.
- **Nouvelles tentatives.** Un `<script>` en échec est retiré avant la tentative suivante, donc une nouvelle tentative ajoute une seule balise neuve. Après la dernière tentative, `load()` se résout avec la dernière erreur.
- **Même URL, plusieurs apps.** Deux entrées qui listent le même script vendor partagent une balise et un téléchargement.
- **Entrées en cache.** `load(name, otherEntry)` renvoie le module en cache sous `name` et ignore `otherEntry`. Appelez d'abord `unload(name)` pour changer d'entrée.
- **Les scripts module s'exécutent une fois par URL.** Après `unload(name)`, une app dont le script `type: 'module'` a appelé `registerModule` ne se recharge pas depuis la même URL, car le navigateur n'exécute pas deux fois un script module. Le chargement échoue avec `no exports found`. Utilisez une entrée de type fonction loader ou une nouvelle URL (une empreinte de contenu ou `?v=2`).
- **`unload` retire les balises de script partagées.** Il retire chaque URL de script de l'entrée, y compris un script vendor qu'une autre app liste aussi. Le code déjà exécuté reste ; un chargement ultérieur qui liste l'URL rajoute la balise, et un script classique s'exécute de nouveau.
- **CORS.** Le loader définit `crossorigin="anonymous"` sur chaque balise. Un script ou une feuille de style venant d'une autre origine a besoin d'un en-tête `Access-Control-Allow-Origin`, sinon le navigateur le bloque et le chargement échoue.
- **Variables globales UMD.** Quand deux bundles UMD se chargent en même temps, le loader ignore les variables globales qu'un autre chargement a déjà revendiquées et associe les autres au nom de l'app, sans tenir compte de la casse ni de la ponctuation (`my-app` correspond à `MyApp`). S'il reste plusieurs candidates, le chargement échoue avec `several globals with mount() appeared while it loaded (<names>)`. `registerModule` évite ces suppositions.
- **Cycle de vie manquant.** Un module sans `mount` ou `unmount` échoue avec `[Tuvix Loader] Module "<name>" is missing required "unmount" function.`
- **Rien trouvé.** Une entrée URL dont les scripts n'enregistrent aucun module et ne définissent aucune variable globale UMD échoue avec `Module "<name>" loaded but no exports found`.
- **Plusieurs conteneurs.** Le runtime suit l'état de montage par conteneur. Démonter l'un de deux conteneurs laisse `isMounted(name)` à `true` ; `whenMounted(name)` renvoie le plus ancien conteneur encore monté.
- **Conteneurs détachés.** Quand un framework hôte retire le conteneur avant que l'adaptateur signale `unmounted` ou `error`, `emitLifecycle` émet l'événement sur `document`. Écoutez sur `document` (la valeur par défaut de `onLifecycle`) pour recevoir tous les événements.
- **`whenMounted` ignore les erreurs.** Un événement `tuvix:error` ne la fait pas rejeter. Passez un `signal` ou écoutez avec `onLifecycle('error', ...)`.
- **Serveur.** Les fonctions du runtime fonctionnent sans `window` ; `emitLifecycle` saute l'événement DOM quand `CustomEvent` n'est pas défini. `ModuleLoader`, `loadScript`, `loadStyle` et `prefetchResource` ont besoin de `document`.

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Il ne télécharge pas une page HTML pour en extraire les scripts. Listez les URL de scripts et de styles, ou utilisez une fonction loader.
- Il n'isole pas le JavaScript. Les scripts s'exécutent dans la portée globale de la page. Pour isoler le CSS, utilisez l'option `sandbox` de l'orchestrateur ou [`@tuvix.js/sandbox`](/fr/packages/sandbox).
- Il ne monte pas les apps. Vous ou l'orchestrateur appelez `module.mount`.
- Il ne garde pas de cache d'un chargement de page à l'autre. Le cache HTTP du navigateur s'en charge.
- Il ne lit pas `PrefetchStrategy` ; le réglage `prefetch` de l'orchestrateur décide quand appeler `prefetch`.

## Migrer depuis 0.4 {#migrating-from-0-4}

- `LoaderOptions.fetch` et `EntryConfig.html` ont disparu. Le loader ne les a jamais lus. Supprimez-les de votre configuration.
- `loadScript(url, integrity)` et `loadStyle(url, timeoutMs)` fonctionnent toujours. La forme avec options ajoute `type` et `signal` :

  ```ts
  import { loadScript } from '@tuvix.js/loader';

  // 0.4
  await loadScript('/vendor.js', 'sha384-abc');
  // 0.5
  await loadScript('/vendor.js', { integrity: 'sha384-abc', type: 'classic' });
  ```

- La sortie ES de Vite qui se termine par `.js` se chargeait comme script classique en 0.4 et échouait sur sa première instruction `import`. Indiquez `type: 'module'` sur l'entrée.
- Une entrée `type: 'module'` ne se recharge plus depuis la même URL après `unload`. Utilisez une fonction loader ou une nouvelle URL.
- `load()` pour un module en cache indique la vraie `duration` au lieu de `0`.
- La version 0.4 de cette page montrait `loader.load(url)`, `result.app`, `onLoadStart`, `cache` et `loader.clear()`. Aucun d'eux n'existait. Utilisez `load(name, entry)`, `result.module`, `unload(name)` et `clearCache()`.

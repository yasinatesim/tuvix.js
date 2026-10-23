# @tuvix.js/loader

> Charge les bundles de micro apps par nom depuis des URL de scripts ou des fonctions loader, avec nouvelles tentatives, timeouts, un registre de modules partagé et des événements de cycle de vie.

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentation complète : [tuvix.js.org/packages/loader](https://tuvix.js.org/packages/loader).

## Installation

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

`@tuvix.js/core` crée un `ModuleLoader` pour vous et lui transmet `createOrchestrator({ loader })`. Importez ce paquet quand vous écrivez une micro app ou un adaptateur, quand vous attendez le montage d'une autre app, ou quand vous chargez des apps sans l'orchestrateur.

## Démarrage rapide

La micro app, buildée vers `https://cdn.example.com/dashboard/main.js` :

```ts
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

Le shell :

```ts
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
  console.error(result.error);
}
```

`load()` ne lève jamais d'erreur. Un échec se résout avec `status: 'error'`, `module: null` et la dernière erreur.

## Entrées

`Entry` est l'un des éléments suivants :

- une chaîne d'URL, lue comme `{ scripts: [url] }`
- un `EntryConfig`
- une fonction loader comme `() => import('./dashboard')`. Elle reçoit `{ signal }`, qui est annulé au timeout, et peut se résoudre avec le module, avec `{ default: module }`, ou avec n'importe quelle valeur après avoir appelé `registerModule(name, module)`.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `scripts` | `string[]` | requis | URL de scripts, exécutés les uns après les autres. |
| `styles` | `string[]` | `[]` | URL de feuilles de style, chargées en parallèle des scripts. |
| `type` | `'module' \| 'classic'` | déduit pour chaque URL | `.mjs`, `.mts`, `.ts`, `.tsx`, `.jsx` se chargent comme modules, le reste comme scripts classiques. Indiquez `'module'` pour la sortie `.js` de Vite. |
| `integrity` | `Record<string, string>` | aucun | Hashes SRI indexés par URL. |

## API

### `ModuleLoader` et `createLoader`

```ts no-check
new ModuleLoader(options?: LoaderOptions);
createLoader(options?: LoaderOptions): ModuleLoader;
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | ms par tentative, pour l'ensemble des scripts et feuilles de style. `0` le désactive. |
| `retries` | `number` | `2` | Tentatives supplémentaires après le premier échec. |
| `retryDelay` | `number` | `1000` | ms entre deux tentatives. |
| `globals` | `Record<string, unknown>` | `{}` | Assignées à `window` avant chaque tentative d'une entrée URL. |

| Méthode | Comportement |
| --- | --- |
| `load(name, entry): Promise<LoadResult>` | Charge, valide `mount`/`unmount` et met en cache par nom. Résout le module d'abord depuis `registerModule(name)`, puis depuis une nouvelle variable globale UMD qui possède `mount`. Un nom en cache ignore `entry` ; un nom déjà en cours de chargement renvoie la même promesse. |
| `prefetch(entry)` | `<link rel="modulepreload">` pour les scripts modules, `<link rel="prefetch">` sinon. Ignore les fonctions loader. |
| `removeStyles(name)` | Supprime les feuilles de style de l'app, sauf si une autre app en cache les utilise. Le prochain `load(name)` les rajoute. |
| `unload(name)` | Supprime les styles et les balises script, retire l'entrée du cache et désenregistre le module que ce loader a résolu. |
| `clearCache()` | `unload` pour chaque app en cache. |
| `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()` | Lisent le cache. `getStatus` renvoie `'idle'`, `'loading'` ou `'loaded'`. |

### `normalizeEntry`

```ts no-check
normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

### `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource`

```ts no-check
loadScript(url: string, options?: { type?, integrity?, signal? } | string): Promise<void>;
loadStyle(url: string, options?: { timeout?, integrity?, signal? } | number): Promise<void>;
removeScript(url: string): void;
removeStyle(url: string): void;
prefetchResource(url: string, options?: { as?, type?, integrity? }): void;
```

Une balise par URL, partagée entre les appelants concurrents. Un chargement en échec supprime sa balise et rejette avec `[Tuvix Loader] Failed to load script: <url>`. Un appel annulé supprime la balise quand aucun autre appelant ne l'attend. `loadStyle` expire après `10000` ms par défaut. Chaque balise reçoit `crossorigin="anonymous"`. Un second argument de type chaîne pour `loadScript` est le hash d'intégrité ; un nombre pour `loadStyle` est le timeout (formes de la 0.4).

### Registre runtime et cycle de vie

L'état vit sur `window.__TUVIX_RUNTIME__`, donc les micro apps qui bundlent leur propre copie le partagent. Sans `window`, il vit dans le module.

| Export | Comportement |
| --- | --- |
| `registerModule(name, module)` | Publie un module pour le loader. Les adaptateurs et `defineMicroApp` l'appellent. |
| `unregisterModule(name)` | Le retire. |
| `getRegisteredModule(name)` | Le renvoie, ou `undefined`. |
| `emitLifecycle(type, { name, container, hydrated, error? })` | Émet un `CustomEvent` `tuvix:mounted`, `tuvix:unmounted` ou `tuvix:error` (bubbling, composed) sur `container`, ou sur `document` quand le conteneur est détaché, et suit les conteneurs montés. Les adaptateurs et `defineMicroApp` l'appellent. |
| `isMounted(name)` | `true` tant qu'un conteneur de l'app est monté. |
| `whenMounted(name, { signal? })` | Se résout avec le `LifecycleDetail` du premier montage, ou immédiatement avec le plus ancien conteneur encore monté ; rejette avec `signal.reason` en cas d'annulation. |
| `onLifecycle(type, handler, target = document)` | Écoute `tuvix:<type>` ; renvoie une fonction de retrait. |
| `hasServerMarkup(el)` | `true` pour un élément enfant ou un texte non vide (hors espaces). |

```ts
import { onLifecycle, whenMounted } from '@tuvix.js/loader';

onLifecycle('error', ({ name, error }) => console.error(name, error));
const { hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log('header hydrated:', hydrated);
```

### Types

`Entry`, `EntryConfig`, `EntryLoader`, `EntryLoaderContext`, `ScriptType`, `MicroAppModule`, `MountContext` (`container`, `props?`, `name?`, `bus?`), `UnmountContext`, `UpdateContext` (`props`, `container?`), `MicroAppBus` (`on`, `once`, `emit`, `off` ; `IEventBus` le satisfait), `LoaderOptions`, `LoadResult`, `LoadStatus`, `CacheEntry`, `PrefetchStrategy` (non lu par le loader), `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent`.

## Cas limites

- Un timeout annule le `signal` de la tentative, supprime ses balises et réessaie après `retryDelay`. Une fonction loader qui ignore `signal` continue de s'exécuter ; le loader cesse de l'attendre.
- Après `unload(name)`, un script `type: 'module'` qui s'est enregistré lui-même ne s'exécute plus depuis la même URL. Utilisez une fonction loader ou une nouvelle URL.
- `unload` supprime toutes les URL de scripts de l'entrée, y compris les scripts vendor que d'autres apps listent.
- Deux bundles UMD chargés en même temps : le loader associe les nouvelles variables globales au nom de l'app et échoue en listant les noms candidats quand il ne peut pas les distinguer.
- Les scripts et styles cross-origin ont besoin de `Access-Control-Allow-Origin`.
- L'état monté est propre à chaque conteneur : démonter l'un de deux conteneurs laisse `isMounted(name)` à `true`. `whenMounted` ne rejette pas sur `tuvix:error`.
- L'événement de cycle de vie d'un conteneur détaché se déclenche sur `document`, avec `detail.container` toujours défini. `onLifecycle` sur `document` (la cible par défaut) reçoit chaque événement une seule fois.

## Ce qu'il ne fait pas

- Il ne récupère pas de pages HTML pour en extraire les scripts.
- Il n'isole pas le JavaScript ; les scripts s'exécutent dans la portée globale de la page.
- Il ne monte pas les apps et ne gère pas le routage.

## Licence

MIT

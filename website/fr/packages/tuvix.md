---
title: 'tuvix.js'
---

<PackageHeader
  name="tuvix.js"
  title="tuvix.js (paquet tout-en-un)"
  description="Un seul paquet, un seul chemin d'import. Réexporte l'orchestrateur de @tuvix.js/core ainsi que les API publiques de @tuvix.js/router, @tuvix.js/event-bus, @tuvix.js/loader et @tuvix.js/sandbox."
  icon="🎁"
  github="tuvix"
/>

## Installation {#installation}

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

Installer `tuvix.js` installe `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` et `@tuvix.js/sandbox`. Les six paquets livrent des builds ES module et CommonJS et déclarent `"sideEffects": false`.

## Quand l'utiliser {#when-to-use-it}

Installez `tuvix.js` dans une application shell qui utilise l'orchestrateur avec le routeur, l'event bus ou la sandbox. Vous avez une seule dépendance à versionner et un seul chemin d'import, et votre bundler élimine les exports que vous n'importez jamais.

Installez plutôt les paquets scopés quand :

- Une micro app ne communique qu'avec le shell. `@tuvix.js/event-bus` seul lui fournit `getGlobalBus()`, sans faire entrer l'orchestrateur dans ses `node_modules`.
- Vous avez besoin d'un export que le paquet tout-en-un laisse de côté, comme `registerModule` ou `emitLifecycle` de `@tuvix.js/loader`, ou `pathToRegex` de `@tuvix.js/router`. Voir [Non inclus](#not-included).
- Vous voulez que votre `package.json` indique de quelles parties de Tuvix.js un paquet dépend.

Mélanger les deux ne pose pas de problème. Le paquet tout-en-un réexporte les mêmes modules, donc `getGlobalBus` de `tuvix.js` et de `@tuvix.js/event-bus` renvoient le même bus, et les helpers de cycle de vie partagent un seul registre sur `window`.

## Démarrage rapide {#quick-start}

Un shell qui monte `about` sur `/about`, transforme les clics sur les liens en navigations du routeur et journalise les erreurs des apps :

```ts
import { createOrchestrator, getGlobalBus, interceptLinks, OrchestratorEvent, type AppErrorEvent } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

orchestrator.register({
  name: 'about',
  entry: 'https://cdn.example.com/about/main.js',
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

L'app `about`, compilée vers `https://cdn.example.com/about/main.js` :

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Cliquer sur `<a href="/about?ref=nav">` pousse `/about?ref=nav`, et l'orchestrateur monte `about` dans `#main` (la query string n'influe pas sur la correspondance).

## API {#api}

Chaque export ci-dessous est une réexportation. La page du paquet en lien documente sa signature, ses options et ses cas limites.

### Depuis `@tuvix.js/core` {#from-tuvix-js-core}

Docs : [`@tuvix.js/core`](/fr/packages/core).

| Export | Nature | Rôle |
| --- | --- | --- |
| `createOrchestrator` | fonction | Crée un `Orchestrator`. |
| `Orchestrator` | classe | Enregistre les apps, les réconcilie avec l'URL, suit un routeur (`connectRouter`), met à jour les props, détruit. |
| `defineMicroApp` | fonction | Valide un objet `{ name, bootstrap?, mount, unmount, update?, ssr? }`, l'enregistre pour le loader et lui fait émettre `tuvix:mounted` / `tuvix:unmounted` / `tuvix:error`. |
| `OrchestratorEvent` | enum | Noms des événements que l'orchestrateur émet sur son bus (`tuvix:app:mount`, `tuvix:app:error`, ...). |
| `OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition` | type | Arguments de `createOrchestrator`, `register` et `defineMicroApp`. |
| `AppStatus`, `AppSandboxOption`, `RouterSource`, `RegisteredApp` | type | Union des statuts d'app, l'option `sandbox`, l'argument de `connectRouter`, la forme d'un enregistrement d'app. |
| `AppErrorEvent`, `AppErrorPhase` | type | Payload `{ name, error, phase }` de `APP_ERROR` et l'union de ses phases (`'load'`, `'bootstrap'`, `'mount'`, `'update'`, `'unmount'`). |

### Depuis `@tuvix.js/event-bus` {#from-tuvix-js-event-bus}

Docs : [`@tuvix.js/event-bus`](/fr/packages/event-bus).

| Export | Nature | Rôle |
| --- | --- | --- |
| `EventBus` | classe | Bus pub/sub avec `on`, `once`, `emit`, `off`, `onAny`. |
| `createEventBus` | fonction | Crée un nouvel `EventBus` distinct. |
| `getGlobalBus` | fonction | Renvoie le bus commun à toute la page, stocké sur `window.__TUVIX_GLOBAL_BUS__`. L'orchestrateur l'utilise par défaut. |
| `resetGlobalBus` | fonction | Détruit le bus commun à la page ; le `getGlobalBus()` suivant en crée un nouveau. |
| `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` | type | Interface du bus, signatures des handlers, fonction de désabonnement, options du constructeur. |

### Depuis `@tuvix.js/router` {#from-tuvix-js-router}

Docs : [`@tuvix.js/router`](/fr/packages/router).

| Export | Nature | Rôle |
| --- | --- | --- |
| `Router` | classe | Routeur history ou hash qui associe des chemins à des noms d'apps. |
| `createRouter` | fonction | Crée un `Router`. |
| `matchPath` | fonction | Compare un chemin à un motif (`:param`, `/*`, query et hash ignorés). Les chaînes `activeWhen` l'utilisent. |
| `matchRoute` | fonction | Renvoie la première route d'un `RouteConfig[]` qui correspond entièrement à un chemin, avec `params` et `query`. |
| `normalizePath` | fonction | Ajoute un slash initial et retire un slash final. |
| `interceptLinks` | fonction | Transforme les clics sur des liens de même origine en appel `navigate(path)`, avec un prefetch d'intention optionnel. |
| `resolveLink` | fonction | Renvoie `{ anchor, url, path }` pour le lien HTML sur lequel un événement s'est produit, ou `null` lorsque le navigateur doit le gérer. |
| `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute` | type | Interface du routeur, options et formes des routes. |
| `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler` | type | Payload de navigation, signatures du guard et du listener. |
| `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` | type | Résultat et options de `matchPath`, options de `interceptLinks`, résultat et options de `resolveLink`. |

### Depuis `@tuvix.js/loader` {#from-tuvix-js-loader}

Docs : [`@tuvix.js/loader`](/fr/packages/loader).

| Export | Nature | Rôle |
| --- | --- | --- |
| `ModuleLoader` | classe | Charge une entrée (URL, configuration script/style ou fonction loader) avec timeout, retries et cache. |
| `createLoader` | fonction | Crée un `ModuleLoader`. |
| `whenMounted` | fonction | Se résout quand une app émet son événement de cycle de vie `mounted`. |
| `onLifecycle` | fonction | Écoute les événements DOM `tuvix:mounted`, `tuvix:unmounted` ou `tuvix:error`. |
| `isMounted` | fonction | `true` tant qu'un conteneur de l'app est monté, d'après les événements de cycle de vie. |
| `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext` | type | Formats d'entrée et contrat de cycle de vie qu'une micro app implémente. |
| `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy` | type | Options et résultats du loader. |
| `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` | type | Noms des événements de cycle de vie, payload et type d'événement DOM. |

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

const off = onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer', { signal: AbortSignal.timeout(5000) });
console.log(container.id, hydrated);
off();
```

### Depuis `@tuvix.js/sandbox` {#from-tuvix-js-sandbox}

Docs : [`@tuvix.js/sandbox`](/fr/packages/sandbox).

| Export | Nature | Rôle |
| --- | --- | --- |
| `CssSandbox` | classe | Déplace un conteneur dans un shadow root et charge les feuilles de style à l'intérieur. L'orchestrateur l'utilise pour `sandbox: true`. |
| `JsSandbox` | classe | Proxy de `window` qui tient les variables globales écrites par un script à l'écart du vrai `window`. |
| `Sandbox` | classe | `CssSandbox` et `JsSandbox` derrière une seule paire `activate` / `deactivate`. |
| `createSandbox` | fonction | Crée une `Sandbox`. |
| `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox` | type | Options et interfaces des sandboxes. |
| `AdoptStylesOptions`, `AdoptedStyles` | type | Argument et valeur de retour de `CssSandbox.adoptStyles`. |

### Non inclus {#not-included}

Le paquet tout-en-un laisse ces éléments de côté. Installez le paquet qui les fournit.

| Vous avez besoin de | Installez |
| --- | --- |
| `registerModule`, `unregisterModule`, `getRegisteredModule`, `emitLifecycle`, `hasServerMarkup`, `normalizeEntry`, `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource`, et des types `EntryLoader`, `EntryLoaderContext`, `MicroAppBus`, `ScriptType`, `CacheEntry`, `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions` | [`@tuvix.js/loader`](/fr/packages/loader) |
| `pathToRegex`, `parseQuery`, `isPathActive` | [`@tuvix.js/router`](/fr/packages/router) |
| Micro apps React, Vue, Svelte ou Angular | [`@tuvix.js/react`](/fr/packages/react), [`@tuvix.js/vue`](/fr/packages/vue), [`@tuvix.js/svelte`](/fr/packages/svelte), [`@tuvix.js/angular`](/fr/packages/angular) |
| Composition côté serveur | [`@tuvix.js/server`](/fr/packages/server) |
| Remotes Module Federation | [`@tuvix.js/module-federation`](/fr/packages/module-federation) |
| Assets d'îlots dans les builds Vite | [`@tuvix.js/vite`](/fr/packages/vite) |
| Le panneau DevTools | [`@tuvix.js/devtools`](/fr/packages/devtools) |
| Génération de projet | [`create-tuvix-app`](/fr/packages/create-tuvix-app) |

## Cas limites {#edge-cases}

- `tuvix.js` a un seul point d'entrée. Les imports de sous-chemins comme `tuvix.js/core` ou `tuvix.js/router` ne se résolvent pas ; importez depuis `tuvix.js` ou depuis le paquet scopé.
- Le paquet tout-en-un fixe ses dépendances sur la même release. Installer `tuvix.js` à côté d'une autre version d'un paquet scopé vous donne deux copies de ce paquet. `getGlobalBus()` et le registre de cycle de vie partagent toujours leur état via `window`, mais les vérifications `instanceof Orchestrator` ou `instanceof EventBus` échouent d'une copie à l'autre.
- `whenMounted`, `onLifecycle` et `isMounted` réagissent aux événements DOM `tuvix:*`. Les modules issus de `defineMicroApp` et des adaptateurs de framework les émettent ; un module écrit à la main n'en émet aucun sauf s'il appelle `emitLifecycle` de `@tuvix.js/loader`. Les événements d'un conteneur hors du document sont dispatchés sur `document`.
- `resetGlobalBus()` détruit le bus que détient un orchestrateur en cours d'exécution. L'orchestrateur garde ce bus détruit, donc ses événements n'atteignent plus les abonnés du `getGlobalBus()` suivant. Appelez-le entre les tests, après `orchestrator.destroy()`.
- Les changements de comportement et les changements cassants de `@tuvix.js/core` et `@tuvix.js/router` s'appliquent ici tels quels. Voir [Migrer depuis 0.4](/fr/packages/core#migrating-from-0-4).

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Il n'ajoute aucun code propre. Chaque export vient de l'un des cinq paquets scopés.
- Il n'inclut pas les adaptateurs de framework, le paquet serveur, Module Federation, Vite ni DevTools.
- Il ne propose pas d'entrées de sous-chemin par paquet.

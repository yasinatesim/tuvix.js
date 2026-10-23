# Migrer vers 0.5

La version 0.5 corrige des bugs qui modifiaient le comportement observable, et certains de ces correctifs cassent du code écrit pour 0.4. Cette page liste chaque changement cassant par paquet, avec le code à modifier. Mettez à jour tous les paquets `tuvix.js` et `@tuvix.js/*` vers `^0.5.0` en même temps : mélanger des adaptateurs 0.4 et 0.5 sur une même page n'est pas pris en charge.

```bash
pnpm up --latest "tuvix.js" "@tuvix.js/*"
```

Les projets créés avec `create-tuvix-app` avant 0.5 dépendent de `^0.1.0`, qui ne se résout jamais vers 0.4 ni vers 0.5. Modifiez ces plages à la main.

## Core {#core}

### L'orchestrateur utilise le bus global {#the-orchestrator-uses-the-global-bus}

En 0.4, chaque orchestrateur avait un bus privé, distinct de `getGlobalBus()`. En 0.5, le bus de l'orchestrateur est `getGlobalBus()` sauf si vous passez des options `eventBus`, et `destroy()` laisse le bus global en vie.

```ts no-check
// 0.4: two buses; apps listening on getGlobalBus() missed orchestrator events
const orchestrator = createOrchestrator();
orchestrator.getEventBus() === getGlobalBus(); // false
```

```ts
// 0.5
import { createOrchestrator, getGlobalBus } from 'tuvix.js';

const shared = createOrchestrator();
console.log(shared.getEventBus() === getGlobalBus()); // true

const isolated = createOrchestrator({ eventBus: {} }); // private bus, as in 0.4
console.log(isolated.getEventBus() === getGlobalBus()); // false
```

Si vous exposiez le bus de l'orchestrateur sur `window` pour que les apps le trouvent, vous pouvez supprimer ce code et utiliser le `bus` du contexte de montage ou `getGlobalBus()`.

### Les changements de route ne touchent plus les apps manuelles {#route-changes-leave-manual-apps-alone}

En 0.4, une app sans `activeWhen` ni route du routeur était démontée au changement de route suivant, de même que les apps `mountWhenVisible`. En 0.5, la réconciliation ne touche que les apps contrôlées par `activeWhen` ou par une route. Si vous comptiez sur une navigation pour retirer une app montée manuellement, démontez-la vous-même :

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.unmountApp('cookie-banner');
```

### sandbox: true affiche l'app dans un shadow root {#sandbox-true-renders-in-a-shadow-root}

En 0.4, `sandbox` dans `register` ne faisait rien. En 0.5, `sandbox: true` monte l'app dans un shadow root et y charge les `styles` de son entrée. Le CSS de la page n'atteint plus l'app, et les styles d'entrée de l'app n'atteignent plus la page. Retirez `sandbox: true` des apps qui dépendent des styles de la page. Voir [Sandbox](/fr/guide/sandbox).

### prefetch: 'hover' {#prefetch-hover}

En 0.4, chaque app était préchargée au premier mouvement de souris n'importe où sur la page. En 0.5, une app est préchargée quand le pointeur entre sur un lien de même origine dont le chemin l'active, ou quand ce lien reçoit le focus. Utilisez `'idle'` ou `'immediate'` pour charger toutes les apps dès le départ.

### OrchestratorConfig.shared n'existe plus {#orchestratorconfig-shared-is-gone}

L'orchestrateur ne lisait jamais `shared`. Supprimez-le, et partagez les dépendances avec `@tuvix.js/module-federation` ou des import maps.

### Motifs activeWhen {#activewhen-patterns}

Les chaînes `activeWhen` utilisent désormais `matchPath`. Une query string ou un hash ne démonte plus une app, les segments `:param` fonctionnent, et des caractères comme `.` et `(` correspondent littéralement.

```ts no-check
// 0.4: `.` was a regex wildcard and matched '/v1x0'
activeWhen: '/v1.0/*'
// 0.4: query strings broke matching, so people wrote functions
activeWhen: (path) => path.split('?')[0].startsWith('/dashboard')
```

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'dashboard',
  entry: () => import('./apps/dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*', // also active on /dashboard?tab=1
});
```

## Routeur {#router}

### La route '/' et RouteConfig.exact {#the-route-and-routeconfig-exact}

Les chemins de route correspondent au chemin entier partout. Une route `'/'` ne s'active plus que sur `/` ; en 0.4, `getActiveApps()` la traitait comme correspondant à tous les chemins, alors que `match()` la traitait comme exacte. `RouteConfig.exact` n'existe plus, car il ne changeait jamais rien.

```ts no-check
// 0.4
routes: [{ path: '/', app: 'shell-nav' }, { path: '/settings', app: 'settings', exact: true }]
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({
  routes: [
    { path: '/*', app: 'shell-nav' }, // every path
    { path: '/settings', app: 'settings' }, // /settings only
  ],
});
void router;
```

`activeWhen: '/'` dans `register` correspond toujours à tous les chemins, car les chaînes `activeWhen` utilisent une correspondance par préfixe.

### push et replace ajoutent la base {#push-and-replace-add-the-base}

```ts no-check
// 0.4 with base: '/app'
router.push('/app/settings'); // you had to add the base yourself
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({ base: '/app', routes: [] });
await router.push('/settings'); // URL: /app/settings
```

En 0.5, passer `/app/settings` écrit `/app/app/settings`. Un guard qui annule une navigation arrière ou avant restaure aussi l'URL avec la base.

### Autres changements du routeur {#other-router-changes}

- `base` n'est retirée que sur une frontière de segment. Avec `base: '/app'`, `/application` reste `/application`.
- `pathToRegex()` renvoie une `RegExp` mise en cache ; ne la modifiez pas. Son second argument `exact` n'existe plus.
- Les caractères d'expression régulière dans les motifs correspondent littéralement. Un `*` au milieu d'un motif correspond à un seul segment.
- `matchRoute()` et `isPathActive()` ignorent un `#hash` dans le chemin.

## Loader {#loader}

### Options supprimées {#removed-options}

`LoaderOptions.fetch` et `EntryConfig.html` n'existent plus. Le loader ne les lisait jamais ; supprimez-les de votre configuration.

```ts no-check
// 0.4
new ModuleLoader({ fetch: myFetch });
orchestrator.register({ name: 'x', entry: { scripts: ['/x.js'], html: '<div></div>' }, container: '#x' });
```

```ts
// 0.5
import { ModuleLoader } from '@tuvix.js/loader';

const loader = new ModuleLoader({ timeout: 10000 });
void loader;
```

### Les scripts module s'exécutent une fois par URL {#module-scripts-run-once-per-url}

Après `unload(name)`, une app dont le script `type: 'module'` s'est enregistré lui-même ne se recharge pas depuis la même URL, car les navigateurs exécutent un script module une seule fois par URL. Utilisez une entrée sous forme de fonction de chargement pour les apps que vous déchargez puis rechargez :

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

`load()` pour un module en cache indique désormais sa vraie `duration` au lieu de `0`.

## Module Federation {#module-federation}

`federatedEntry` et `createFederatedEntry` renvoient une fonction de chargement au lieu de `{ scripts: [remoteEntry.js] }`. L'entrée de 0.4 chargeait le script du conteneur puis échouait avec « no exports found ».

```ts no-check
// 0.4
orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }),
  container: '#main',
});
```

```ts
// 0.5
import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader, federatedEntry } from '@tuvix.js/module-federation';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry(
    { name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' },
    './App', // exposed module path
  ),
  container: '#main',
  activeWhen: '/dashboard/*',
});

const remotes = createFederatedLoader({
  remotes: [{ name: 'settings', url: 'https://cdn.example.com/settings/remoteEntry.js' }],
  shareScope: {}, // replaces 0.4 `shared`
});

orchestrator.register({
  name: 'settings',
  entry: remotes.createFederatedEntry('settings', './App'),
  container: '#main',
  activeWhen: '/settings/*',
});
```

- `FederatedLoaderConfig.shared` est remplacé par `shareScope`. 0.4 ne lisait jamais `shared`.
- `loadRemoteContainer` renvoie `FederatedContainer` au lieu de `any`.

## React {#react}

- Le HTML serveur de `TuvixReactApp` contient désormais des marqueurs de commentaire Suspense (`<!--$-->...<!--/$-->`). Faites le rendu et l'hydratation avec `@tuvix.js/react` 0.5 des deux côtés.
- `mount` rejette sa promesse quand le premier rendu lève une erreur. En 0.4, l'erreur atteignait le gestionnaire d'erreurs racine de React et `mount` se résolvait. L'orchestrateur affiche maintenant le `fallback` de l'app et appelle `onError`.
- `unmount` sur un conteneur que le module n'a jamais monté ne fait rien. 0.4 le vidait.

## Vue {#vue}

`update()` n'écrit plus `app.config.globalProperties.$tuvixProps`. Les props sont maintenant réactives :

```vue
<!-- 0.4 -->
<template>{{ $tuvixProps.theme }}</template>
```

```vue
<!-- 0.5 -->
<script setup lang="ts">
defineProps<{ theme?: string }>();
</script>

<template>{{ theme }}</template>
```

Les composants descendants peuvent appeler `inject('tuvixProps')`, qui renvoie le même objet réactif.

- `VueSsrMicroAppConfig` n'accepte plus `ssr`. `createSsrVueMicroApp` le définit.
- `unmount` sur un conteneur que le module n'a jamais monté ne fait rien.

## Svelte {#svelte}

- Sans `ssr`, `createSvelteMicroApp` vide le conteneur avant le rendu. 0.4 ajoutait les composants Svelte 3/4 après le balisage existant. Utilisez `createSsrSvelteMicroApp` pour conserver et hydrater le balisage serveur.
- `unmount` sur un conteneur que le module n'a jamais monté, ou dont le montage a échoué, ne fait rien. 0.4 le vidait. Les quatre adaptateurs se comportent désormais ainsi.
- `renderSvelteToString` ne se replie plus sur `App.render` quand `svelte/server` ne se charge pas. Si `render` est passé, il utilise Svelte 5 ; sinon, il prend le chemin Svelte 5 quand `svelte` exporte `mount`, et n'appelle `App.render` que pour Svelte 3/4. Une erreur d'import ou de rendu Svelte 5 vous parvient.

Les composants Svelte 5 fonctionnent en 0.5 ; en 0.4, `createSvelteMicroApp` échouait avec eux. Avec Svelte 5, `update()` remonte le composant, sauf si vous passez `SvelteMap` depuis `svelte/reactivity` dans la configuration, ce qui met à jour les props sur place :

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

## Angular {#angular}

### Nouvelle forme de configuration {#new-config-shape}

```ts no-check
// 0.4
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

export default createAngularMicroApp({
  name: 'admin',
  module: AppModule,
  platform: platformBrowserDynamic,
  selector: 'app-root',
});
```

```ts
// 0.5
import { createAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AppComponent, // required
  module: AppModule, // only when AppComponent is declared in an NgModule
});
```

`platform` et `compilerOptions` n'existent plus. Retirez `import '@angular/compiler'` de votre entrée ; l'adaptateur charge le compilateur pour les composants JIT.

### Sans zone.js par défaut {#zoneless-by-default}

Les apps s'exécutent sans zone.js sauf si vous passez `zone: true`. Sur Angular 15-17, les événements DOM ne déclenchent plus la détection de changements ; appelez `ChangeDetectorRef.detectChanges()` dans les gestionnaires, ou importez `zone.js` dans votre entrée et passez `zone: true`. Angular 18+ planifie la détection de changements sans zone.js. Voir [Angular](/fr/guide/angular).

### Les props sont des inputs {#props-are-inputs}

`update()` n'écrit plus `window.__TUVIX_ANGULAR_PROPS__`. Déclarez plutôt des propriétés `@Input()` ; l'adaptateur les définit avec `setInput`.

```ts no-check
// 0.4
ngOnInit() {
  this.userId = (window as any).__TUVIX_ANGULAR_PROPS__?.admin?.userId;
}
```

```ts
// 0.5
import { Component, Input } from '@angular/core';

@Component({ selector: 'app-admin', standalone: true, template: '{{ userId }}' })
export class AdminComponent {
  @Input() userId = '';
}
```

### Autres changements Angular {#other-angular-changes}

- `createSsrAngularMicroApp` n'ajoute plus `provideClientHydration()`. Il refait le rendu dans l'élément hôte rendu par le serveur.
- `unmount` sur un conteneur que le module n'a jamais monté ne fait rien.

## Sandbox {#sandbox}

- `Sandbox({ css: false }).activate(container)` renvoie `null` et n'attache aucun shadow root. `ISandbox.activate` renvoie `ShadowRoot | null` ; vérifiez `null` avant d'appeler `addStyle`.
- En mode strict, `JsSandbox` lève une `TypeError` sur une écriture bloquée. 0.4 affichait un avertissement et stockait quand même la valeur. Ajoutez à `allowedGlobals` les globales que votre code écrit.

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });
const shadow = sandbox.activate(container);
if (shadow) sandbox.css.addStyle(shadow, ':host { display: block; }');
```

## Serveur {#server}

- `createServerRenderer().render()` renvoie `statusCode: 502` quand au moins une app correspondait au chemin et que toutes les récupérations de fragments ont échoué. Il renvoie toujours 200 quand aucune app ne correspondait ou qu'un fragment a réussi. `createMiddleware` envoie ce statut. Le renderer en streaming envoie toujours 200.
- `createMiddleware` et `createStreamingMiddleware` appellent `next(error)` au lieu de `next()` quand le rendu lève une erreur, et Express transmet donc la requête à votre gestionnaire d'erreurs.

## Correctifs non cassants à connaître {#non-breaking-fixes-worth-knowing}

- `require('@tuvix.js/core')` et les autres points d'entrée CommonJS fonctionnent. En 0.4, cinq paquets faisaient pointer `require` vers des fichiers que le build ne générait jamais.
- `getGlobalBus()` conserve son instance sur `window`, donc des micro apps empaquetées séparément partagent un seul bus.
- Les adaptateurs et `defineMicroApp` émettent `tuvix:mounted`, `tuvix:unmounted` et `tuvix:error`. Voir [Événements de cycle de vie](/fr/guide/lifecycle-events).
- Un `bootstrap()` qui lève une erreur s'exécute de nouveau au montage suivant. 0.4 l'ignorait ensuite.
- `register()` après `start()` monte l'app immédiatement quand le chemin courant l'active, et commence à observer une app `mountWhenVisible`.
- Chaque échec du cycle de vie émet `tuvix:app:error` sur le bus avec `{ name, error, phase }`. 0.4 ne l'émettait que pour les échecs de chargement et de montage.
- `maxListeners` avertit avec `console.warn` une fois par événement, avec ou sans `debug`.
- `orchestrator.connectRouter()` remplace les ponts `setTimeout` + `reconcile()`. Voir [Routeur externe](/fr/guide/external-router).

---
title: '@tuvix.js/angular'
---

<PackageHeader
  name="@tuvix.js/angular"
  title="Liaisons Angular"
  description="Transforme un composant Angular 15+ en micro app Tuvix.js : sans zone par défaut, une application par conteneur, les props comme inputs du composant, et rendu côté serveur avec les styles."
  icon="🔺"
  npm="true"
/>

## Installation {#installation}

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

Ajoutez `@angular/compiler` lorsque vos composants ne sont pas compilés en AOT (JIT), ainsi que `@angular/platform-server` et `@angular/compiler` côté serveur lorsque vous appelez `renderAngularToString`. L'adaptateur client nécessite Angular 15 ou plus récent ; le moteur de rendu serveur nécessite Angular 16 ou plus récent.

## Quand l'utiliser {#when-to-use-it}

Utilisez ce paquet lorsqu'un composant Angular doit fonctionner comme une micro app parmi d'autres : l'orchestrateur le monte dans un conteneur sur une route, lui passe des props, les met à jour et le démonte en sortant. Plusieurs apps Angular, ou plusieurs copies d'une même app, peuvent partager une page, car chaque montage obtient sa propre application Angular et son propre élément hôte. L'adaptateur ne charge jamais zone.js, donc un îlot Angular ne patche pas `Promise` ni `addEventListener` pour les apps React ou Vue voisines.

Si Angular possède toute la page, lancez-le de la manière habituelle avec `bootstrapApplication`. L'adaptateur ne vous apporte rien dans ce cas.

## Démarrage rapide {#quick-start}

Un composant standalone avec un input :

```ts
// greeting.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}
```

L'entrée de la micro app l'enveloppe :

```ts
// greeting-app.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { GreetingComponent } from './greeting.component';

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

Le shell enregistre l'app et démarre l'orchestrateur :

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'greeting',
  entry: () => import('./greeting-app'),
  container: '#greeting',
  activeWhen: '/hello',
  props: { name: 'Ada' },
});

await orchestrator.start();

// Later: setInput('name', 'Grace') and one change detection pass.
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

L'adaptateur crée un élément hôte `<app-greeting>` dans `#greeting` et, après la mise à jour, celui-ci affiche « Hello Grace ».

## API {#api}

### `createAngularMicroApp`

```ts no-check
function createAngularMicroApp<C>(config: AngularMicroAppConfig<C>): MicroAppModule;
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Nom de l'app. L'adaptateur enregistre le module sous ce nom avec `registerModule` de `@tuvix.js/loader`. |
| `component` | `Type<C>` | requis | Composant racine. Les composants standalone fonctionnent seuls. |
| `module` | `Type<unknown>` | aucun | NgModule qui déclare `component`. L'adaptateur ajoute ses providers avec `importProvidersFrom`. |
| `providers` | `AngularProviders` | `[]` | Providers d'environnement de l'application, comme `provideHttpClient()`. |
| `selector` | `string` | partie élément du sélecteur du composant, sinon `'div'` | Nom de balise de l'élément hôte que l'adaptateur crée dans le conteneur. |
| `zone` | `boolean` | `false` | Utilise la détection de changements de zone.js. Votre entrée client doit d'abord importer `zone.js`. |
| `ssr` | `boolean` | `false` | Reprend le balisage produit par `renderAngularToString`. Voir `createSsrAngularMicroApp`. |
| `bootstrap` | `() => void \| Promise<void>` | aucun | Initialisation unique. Le `bootstrap()` du module l'attend. |

Chaque `mount({ container, props })` :

1. Charge d'abord `@angular/compiler` lorsque `component` ou `module` n'a pas de définition AOT (`ɵcmp` / `ɵmod`), puis `@angular/core` et `@angular/platform-browser`. Cela n'aide que si l'adaptateur est le premier code à charger un paquet Angular autre que `@angular/core`. Si vos fichiers de composants importent `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` ou une autre bibliothèque Angular, ces paquets sont évalués avant l'exécution de l'adaptateur et échouent avec « JIT compilation failed ». Gardez `import '@angular/compiler'` en première ligne de votre entrée client, ou compilez en AOT.
2. Appelle `createApplication({ providers })` avec les providers de détection de changements adaptés à votre version d'Angular (voir [Détection de changements](#change-detection)), les providers du module et `providers`.
3. Crée l'élément hôte (`<app-greeting>` pour le sélecteur `'app-greeting'`, `<div>` pour un sélecteur d'attribut comme `'[card]'`), le place dans le conteneur et y lance le composant.
4. Définit les props comme inputs du composant avec `ComponentRef.setInput` avant la première détection de changements, donc `ngOnInit` les voit déjà. Sur les versions d'Angular sans `ComponentFactoryResolver`, les inputs sont définis juste après le bootstrap, suivi d'un tick.
5. Émet `tuvix:mounted` sur le conteneur. Un échec émet `tuvix:error` et rejette avec l'erreur d'origine.

`update({ props, container? })` écrit les nouvelles valeurs avec `setInput` et exécute `appRef.tick()`, pour un conteneur ou pour chaque montage si vous omettez `container`. Le rendu a lieu sur toutes les versions d'Angular, avec ou sans zone.

`unmount({ container })` détruit l'application, vide le conteneur et émet `tuvix:unmounted`.

Un composant déclaré dans un NgModule :

```ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin/admin.component';
import { AdminModule } from './admin/admin.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  module: AdminModule,
  providers: [provideHttpClient()],
});
```

### `createSsrAngularMicroApp`

```ts no-check
function createSsrAngularMicroApp<C>(config: AngularSsrMicroAppConfig<C>): MicroAppModule;
```

Mêmes options que `createAngularMicroApp` sans `ssr` ; se comporte comme `createAngularMicroApp({ ...config, ssr: true })`. Utilisez-la côté client pour les îlots que le serveur a rendus avec `renderAngularToString`.

Lorsque le conteneur contient du balisage serveur, l'adaptateur réutilise l'élément hôte s'il est un enfant direct du conteneur avec la balise attendue. Angular effectue son rendu dans cet élément et remplace les enfants produits par le serveur. Une fois qu'Angular a ajouté les styles du composant dans `<head>`, l'adaptateur supprime les balises `<style>` serveur intégrées et tout ce qui se trouve à côté de l'hôte. `tuvix:mounted` indique `hydrated: true`. Un conteneur vide reçoit un rendu client normal.

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `renderAngularToString`

```ts no-check
// import from '@tuvix.js/angular/server'
function renderAngularToString(component: unknown, options?: AngularSsrOptions): Promise<string>;
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `props` | `Record<string, unknown>` | `{}` | Valeurs des inputs, indexées par nom d'input (ou alias). Définies avant la première détection de changements, comme au montage client. Les clés qui ne sont pas des inputs sont ignorées. |
| `providers` | `AngularProviders` | `[]` | Providers d'environnement pour le rendu serveur. |
| `appId` | `string` | `'ng'` (valeur par défaut d'Angular) | `APP_ID` d'Angular. Angular l'écrit dans l'attribut `ng-app-id` des balises de style. |
| `document` | `string` | un document vide avec l'élément hôte dans `<body>` | Document HTML dans lequel effectuer le rendu. Il doit contenir l'élément hôte. |
| `selector` | `string` | partie élément du sélecteur du composant, sinon `'app-root'` | Balise de l'élément hôte pour le document par défaut ; Angular se lance dans l'élément qu'il cible. |

Rend un composant standalone avec `renderApplication` de `@angular/platform-server` et renvoie un fragment unique : les balises `<style>` du composant issues du `<head>` rendu, suivies du HTML interne de `<body>`. Placez le fragment dans le conteneur où `createSsrAngularMicroApp` effectue le montage ; l'îlot dispose de ses styles dès le premier affichage (first paint).

Les `props` atteignent le composant via `setInput` avant la première détection de changements, de la même façon que le `mount` client les définit, donc `ngOnInit` les voit des deux côtés. Passez le même objet au rendu serveur et au montage client, et les deux produisent le même balisage.

Le rendu s'exécute sans zone et ne patche jamais la `Promise` globale. Il charge toujours `@angular/compiler` en premier, car Node charge les paquets Angular depuis `node_modules` sans le linker Angular. Appelez-la depuis une fonction serveur, pas depuis du code qui s'exécute aussi dans le navigateur : dans un navigateur, elle renvoie `''`.

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAboutIsland(): Promise<string> {
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props: { title: 'About us' } });
  return `<section id="about" data-tuvix-app="about">${html}</section>`;
}
```

### Types {#types}

| Type | Signification |
| --- | --- |
| `AngularMicroAppConfig<C>` | Options de `createAngularMicroApp`. |
| `AngularSsrMicroAppConfig<C>` | `AngularMicroAppConfig<C>` sans `ssr` ; options de `createSsrAngularMicroApp`. |
| `AngularSsrOptions` | Options de `renderAngularToString`. Importez le type depuis `@tuvix.js/angular`. |
| `AngularProviders` | `Array<Provider \| EnvironmentProviders>`, ce qu'acceptent `createApplication` et `bootstrapApplication`. |

## Détection de changements {#change-detection}

L'adaptateur n'importe jamais zone.js. Sauf si vous passez `zone: true`, il choisit la configuration sans zone que votre version d'Angular prend en charge :

| Angular | Provider ajouté par l'adaptateur | Ce qui déclenche la détection de changements |
| --- | --- | --- |
| 20 et plus récent | `provideZonelessChangeDetection()` | Écouteurs d'événements du template, écritures de signals, `markForCheck()`, `AsyncPipe`, `setInput` |
| 18 et 19 | `provideExperimentalZonelessChangeDetection()` | Comme pour 20 |
| 15 à 17 | `NgZone` remplacé par `ɵNoopNgZone` | Rien par lui-même. `update()` depuis l'hôte effectue toujours le rendu. |

Sur Angular 18 et plus récent, un champ simple que vous modifiez dans un callback de `setTimeout` ou de `fetch` ne relance pas le rendu du template. Gardez cet état dans un signal, ou appelez `ChangeDetectorRef.markForCheck()` :

```ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-clock',
  standalone: true,
  template: `<time>{{ now() }}</time>`,
})
export class ClockComponent {
  readonly now = signal(new Date().toLocaleTimeString());

  constructor() {
    setInterval(() => this.now.set(new Date().toLocaleTimeString()), 1000);
  }
}
```

Sur Angular 15 à 17, les clics et autres événements DOM ne déclenchent pas non plus la détection de changements. Appelez `ChangeDetectorRef.detectChanges()` après avoir modifié l'état :

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="increment()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  increment(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

Pour conserver la détection de changements basée sur zone.js, importez zone.js dans votre entrée client avant que l'adaptateur ne monte, et passez `zone: true`. L'adaptateur laisse alors le `NgZone` par défaut d'Angular en place et lance l'application à l'intérieur :

```ts
import 'zone.js';
import { createAngularMicroApp } from '@tuvix.js/angular';
import { DashboardComponent } from './dashboard.component';

export default createAngularMicroApp({ name: 'dashboard', component: DashboardComponent, zone: true });
```

zone.js patche `Promise`, les timers et les écouteurs DOM pour toute la page, y compris les apps des autres frameworks.

## Rendu côté serveur {#server-rendering}

1. Côté serveur, appelez `renderAngularToString(Component)` et placez le fragment dans l'élément conteneur.
2. Côté client, exportez `createSsrAngularMicroApp({ name, component })` depuis l'entrée de l'îlot.
3. L'orchestrateur monte l'app dans ce conteneur. Angular effectue son rendu dans l'élément hôte produit par le serveur et l'adaptateur supprime les styles serveur.

L'adaptateur refait le rendu par-dessus le DOM serveur. Il n'utilise pas l'hydratation non destructive d'Angular (`provideClientHydration`), car celle-ci attend une page qu'Angular a rendue de haut en bas : elle cherche le commentaire marqueur d'hydratation d'Angular comme enfant direct de `<body>` et des annotations `ngh` sur les composants. Un îlot dans une page rendue par React, Vue ou un simple template serveur n'a ni l'un ni l'autre. Le compromis : le balisage visible et les styles arrivent avec le HTML, mais l'état à l'intérieur de l'îlot (focus, valeur saisie, position de défilement) est réinitialisé lorsqu'Angular prend le relais, et les clics avant ce moment n'ont aucun effet.

Passez les mêmes props au rendu serveur et au montage client, afin que le rendu client corresponde au balisage serveur. Le rendu n'attend pas les requêtes HTTP ni les timers que le composant démarre : chargez d'abord les données et transmettez-les comme props.

```ts
// server.ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<{ html: string; props: { text: string } }> {
  const response = await fetch('https://api.example.com/about');
  const props = { text: await response.text() };
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props });
  return { html, props };
}
```

Envoyez `props` au navigateur avec la page (par exemple en JSON dans une balise `<script type="application/json">`) et enregistrez l'app avec :

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const props = JSON.parse(document.getElementById('about-props')?.textContent ?? '{}') as Record<string, unknown>;
const orchestrator = createOrchestrator();

orchestrator.register({ name: 'about', entry: () => import('./about-app'), container: '#about', props });
await orchestrator.start();
```

Pour les valeurs qui ne sont pas des inputs, comme l'URL de base d'une API, passez plutôt `providers` des deux côtés.

## Cas particuliers {#edge-cases}

- `zone: true` sans zone.js sur la page rejette le montage avec `[tuvix.js/angular] "<name>" sets zone: true, but zone.js is not loaded. Import 'zone.js' in your client entry before mounting, or drop zone: true.` et émet `tuvix:error`.
- Les props dont les clés ne sont pas des inputs du composant sont ignorées, donc Angular n'affiche pas NG0303. Les inputs sont associés par leur nom public (l'alias, si vous en définissez un).
- Un input présent dans les anciennes props et absent des nouvelles est défini à `undefined`. L'initialiseur du champ (`name = ''`) ne s'exécute pas à nouveau.
- Un `update` avant la fin du montage stocke les props ; le bootstrap en attente utilise les plus récentes. `update({ container })` pour un conteneur que ce module n'a pas monté ne fait rien.
- Un `unmount` pendant que `mount` charge encore Angular l'annule : l'application est détruite, le conteneur reste vide et aucun `tuvix:mounted` n'est émis. Si l'annulation arrive après le bootstrap, vous recevez `tuvix:mounted` suivi de `tuvix:unmounted`.
- Un second `mount` sur le même conteneur détruit la première application avant de lancer la nouvelle.
- `unmount` sur un conteneur que ce module n'a jamais monté ne fait rien.
- Si la destruction de l'application lève une erreur, l'adaptateur vide le conteneur, émet `tuvix:error` et relance l'erreur.
- Avec le SSR, un conteneur dont le balisage n'a aucun enfant direct correspondant à la balise hôte reçoit un nouvel élément hôte. `hydrated` vaut toujours `true`, car le conteneur contenait du balisage.
- Côté serveur, un composant à sélecteur d'attribut (`'[card]'`) se rabat sur un hôte `<app-root>`, que le sélecteur ne cible pas. Passez un `document` dont le `<body>` contient un élément correspondant.
- Sur Angular 16, `@angular/platform-server` copie les classes DOM de Domino (`Event`, `Node` et d'autres) sur l'objet global de Node pendant un rendu serveur. C'est Angular qui le fait, pas l'adaptateur.
- Les composants JIT sans le plugin du compilateur Angular nécessitent toujours `experimentalDecorators` de TypeScript ; Angular ne prend pas en charge la proposition de décorateurs standard.

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Il ne charge pas zone.js ni aucun autre polyfill.
- Il n'ajoute pas `provideClientHydration()` et n'effectue pas d'hydratation non destructive.
- Il n'envoie pas les props serveur au navigateur. Sérialisez-les vous-même dans la page et passez le même objet au montage client.
- Il n'attend pas les appels HTTP, les timers ni les `PendingTasks` que le composant démarre pendant un rendu serveur.
- Il ne conserve pas les nœuds DOM du serveur, le focus ni l'état des formulaires lorsque le client prend le relais.
- Il ne fournit au composant ni service de props Tuvix ni bus. Déclarez des inputs pour les props, et utilisez [`@tuvix.js/event-bus`](/fr/packages/event-bus) pour communiquer avec les autres apps.

## Migration depuis la 0.4 {#migrating-from-0-4}

**`createAngularMicroApp` prend un composant.** `platform` et `compilerOptions` ont disparu. Passez le composant racine dans `component` et, s'il est déclaré dans un NgModule, le module dans `module`.

```ts no-check
// 0.4
createAngularMicroApp({
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

export default createAngularMicroApp({ name: 'admin', component: AppComponent, module: AppModule });
```

**Les props sont des inputs.** `update()` n'écrit plus `window.__TUVIX_ANGULAR_PROPS__`. Supprimez les services qui lisent cette variable globale et déclarez à la place des champs `@Input()` portant les noms des props.

**Sans zone par défaut.** Les apps s'exécutent sans zone.js, sauf si vous passez `zone: true`. Sur Angular 15 à 17, les événements DOM ne déclenchent plus la détection de changements ; appelez `ChangeDetectorRef.detectChanges()` dans les handlers ou activez zone.js. Vous pouvez retirer `provideZonelessChangeDetection()` de votre entrée. Ne retirez `import '@angular/compiler'` que si vos fichiers de composants n'importent rien d'Angular hormis `@angular/core` ; sinon, gardez-le en première ligne de l'entrée client, ou compilez en AOT.

**Pas de `provideClientHydration()` automatique.** `createSsrAngularMicroApp` refait le rendu par-dessus le balisage serveur. N'incluez pas `provideClientHydration()` dans ses `providers`.

**`appId` est pris en compte.** En 0.4, `renderAngularToString` acceptait `appId` et l'ignorait. Il définit désormais l'`APP_ID` d'Angular, donc l'attribut `ng-app-id` des balises de style passe de `ng` à votre valeur.

**Élément hôte.** Côté client comme côté serveur, la balise hôte provient du sélecteur du composant au lieu d'un `'app-root'` fixe, et l'adaptateur client la crée dans le conteneur. `unmount` sur un conteneur que le module n'a jamais monté ne le vide plus.

Consultez le [guide Angular](/fr/guide/angular) pour une app complète.

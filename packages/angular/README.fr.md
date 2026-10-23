# @tuvix.js/angular

> Liaisons Angular 15+ pour le framework microfrontend Tuvix.js

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Installation

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

Ajoutez `@angular/compiler` pour les composants JIT, et `@angular/platform-server` avec `@angular/compiler` côté serveur pour `renderAngularToString` (Angular 16+).

## Démarrage rapide

```ts
import { Component, Input } from '@angular/core';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

L'adaptateur enregistre le module avec `registerModule` de `@tuvix.js/loader`. Les props de l'orchestrateur deviennent des inputs du composant :

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'greeting', entry: () => import('./greeting-app'), container: '#greeting', props: { name: 'Ada' } });
await orchestrator.start();
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

## API

### `createAngularMicroApp(config)`

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Nom de l'app, enregistré avec `registerModule` |
| `component` | `Type<C>` | requis | Composant racine |
| `module` | `Type<unknown>` | aucun | NgModule qui déclare `component` ; ses providers sont ajoutés avec `importProvidersFrom` |
| `providers` | `AngularProviders` | `[]` | Providers d'environnement, comme `provideHttpClient()` |
| `selector` | `string` | partie élément du sélecteur du composant, sinon `'div'` | Nom de balise de l'élément hôte |
| `zone` | `boolean` | `false` | Utilise zone.js ; votre entrée doit importer `zone.js` en premier |
| `ssr` | `boolean` | `false` | Reprend le balisage produit par `renderAngularToString` |
| `bootstrap` | `() => void \| Promise<void>` | aucun | Initialisation unique |

- Chaque montage appelle `createApplication` et bootstrappe le composant dans son propre élément hôte à l'intérieur du conteneur, donc deux apps Angular (ou deux copies d'une même app) n'entrent jamais en collision sur un seul `app-root`.
- Les props sont définies avec `ComponentRef.setInput` avant la première détection de changements, donc `ngOnInit` les voit. Les clés qui ne sont pas des inputs sont ignorées.
- `update({ props, container? })` définit les nouveaux inputs et exécute `appRef.tick()` pour un conteneur ou pour chaque montage. Les inputs absents des nouvelles props reviennent à `undefined`.
- Pour les composants JIT (sans `ɵcmp`), `@angular/compiler` est chargé avant `@angular/platform-browser`. Cela n'aide que si l'adaptateur est le premier code à charger un paquet Angular autre que `@angular/core`. Si vos fichiers de composants importent `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` ou une autre bibliothèque Angular, ces paquets sont évalués avant l'exécution de l'adaptateur et échouent avec « JIT compilation failed ». Gardez `import '@angular/compiler'` comme première ligne de votre entrée client, ou compilez en AOT.
- `unmount` détruit l'application, vide le conteneur et émet `tuvix:unmounted`. Appelé pendant que `mount` charge encore, il annule le montage.

### `createSsrAngularMicroApp(config)`

Identique à `createAngularMicroApp({ ...config, ssr: true })`. Quand le conteneur contient du balisage serveur, Angular rend dans l'élément hôte du serveur et l'adaptateur supprime les balises `<style>` serveur intégrées. `tuvix:mounted` indique `hydrated: true`.

Ce mode refait le rendu par-dessus le DOM serveur. L'hydratation non destructive d'Angular (`provideClientHydration`) exige un commentaire marqueur d'hydratation directement sous `<body>`, ce qu'un îlot placé dans une autre page ne peut pas fournir, donc l'adaptateur ne l'ajoute pas.

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `renderAngularToString(component, options?)` depuis `@tuvix.js/angular/server`

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `providers` | `AngularProviders` | `[]` | Providers pour le rendu serveur |
| `appId` | `string` | `'ng'` | `APP_ID` d'Angular |
| `document` | `string` | document vide avec l'élément hôte | Document dans lequel rendre |
| `selector` | `string` | partie élément du sélecteur du composant, sinon `'app-root'` | Balise hôte du document par défaut |
| `props` | `Record<string, unknown>` | `{}` | Valeurs des inputs du composant, définies avant la première détection de changements |

Renvoie les balises `<style>` du composant suivies du balisage du body. La fonction s'exécute sans zone, ne patche jamais `Promise` et n'attend pas les requêtes HTTP que le composant lance. Appelez-la depuis une fonction serveur ; dans un navigateur, elle renvoie `''`.

`props` fonctionne comme les props côté client : les clés sont des noms d'inputs (ou des alias), les clés qui ne sont pas des inputs sont ignorées, et `ngOnInit` voit les valeurs. Passez le même objet au rendu serveur et à `mount` pour que les deux côtés produisent le même balisage.

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

const props = { name: 'Ada' };
const aboutHtml = await renderAngularToString(AboutComponent, { appId: 'about', props });
// Client: aboutApp.mount({ container, props })
```

### Types

`AngularMicroAppConfig<C>`, `AngularSsrMicroAppConfig<C>`, `AngularSsrOptions`, `AngularProviders` (tous depuis `@tuvix.js/angular`).

## Détection de changements

L'adaptateur n'importe jamais zone.js. Sans `zone: true`, il ajoute `provideZonelessChangeDetection()` sur Angular 20+, `provideExperimentalZonelessChangeDetection()` sur 18-19, et remplace `NgZone` par `ɵNoopNgZone` sur 15-17.

- Angular 18+ : les écouteurs d'événements, les signals, `markForCheck()` et `AsyncPipe` planifient la détection de changements. Un simple champ modifié dans un timer ou un callback de `fetch` ne le fait pas ; utilisez un signal ou `markForCheck()`.
- Angular 15-17 : les événements DOM ne déclenchent pas la détection de changements. Appelez `ChangeDetectorRef.detectChanges()` après avoir modifié l'état, ou passez `zone: true`.

## Cas limites

- `zone: true` sans zone.js chargé fait échouer le montage et émet `tuvix:error`.
- `unmount` sur un conteneur que ce module n'a jamais monté ne fait rien.
- Sur Angular 16, `@angular/platform-server` copie les classes DOM de Domino (`Event`, `Node`, ...) sur l'objet global de Node pendant un rendu serveur. C'est Angular qui le fait, pas l'adaptateur.
- Les composants à sélecteur d'attribut ont besoin, côté serveur, d'un `document` contenant un élément hôte correspondant.

## Ce qu'il ne fait pas

- Il ne charge pas zone.js, n'ajoute pas `provideClientHydration()` et ne conserve ni les nœuds DOM serveur ni l'état des formulaires.
- Il n'écrit pas `window.__TUVIX_ANGULAR_PROPS__` ; déclarez des inputs.

Documentation complète : [tuvix.js.org/packages/angular](https://tuvix.js.org/packages/angular)

## Licence

MIT

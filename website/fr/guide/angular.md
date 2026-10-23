# Avec Angular

`@tuvix.js/angular` bootstrape un composant Angular comme micro app, sans zone.js par défaut. Il rend aussi les composants standalone en HTML sur le serveur.

Prend en charge Angular 15 et versions ultérieures. `renderAngularToString` nécessite Angular 16 ou ultérieur avec `@angular/platform-server`.

## Installation {#install}

```bash
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
# JIT components (no AOT build step) also need the compiler
pnpm add @angular/compiler
# for renderAngularToString
pnpm add @angular/platform-server
```

## Transformer un composant en micro app {#turn-a-component-into-a-micro-app}

```ts
// src/main.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin.component';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  providers: [provideHttpClient()],
});
```

| Option | Type | Description |
| --- | --- | --- |
| `name` | `string` | Obligatoire. Doit correspondre au nom de l'app enregistrée. |
| `component` | `Type<C>` | Obligatoire. Composant racine, standalone ou déclaré dans `module`. |
| `module` | `Type<unknown>` | NgModule qui déclare `component`. Ses providers sont importés avec `importProvidersFrom`. |
| `providers` | `Array<Provider \| EnvironmentProviders>` | Providers d'environnement. |
| `selector` | `string` | Balise de l'élément hôte. Par défaut : la partie élément du sélecteur du composant, ou `div`. |
| `zone` | `boolean` | Utilise la détection de changements de zone.js. `false` par défaut. |
| `ssr` | `boolean` | Reprend le balisage produit par `renderAngularToString`. `createSsrAngularMicroApp` l'active. |
| `bootstrap` | `() => void \| Promise<void>` | S'exécute une fois avant le premier montage. |

Chaque montage appelle `createApplication` et bootstrape le composant dans son propre élément hôte à l'intérieur du conteneur. Deux apps Angular sur une même page, ou un même module dans deux conteneurs, n'entrent pas en collision sur un `app-root` partagé.

Quand le composant n'a pas de `ɵcmp` compilé (JIT), l'adaptateur charge `@angular/compiler` avant `@angular/platform-browser`. Cela n'aide que si l'adaptateur est le premier code à charger un paquet Angular autre que `@angular/core`. Si vos fichiers de composants importent `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` ou une autre bibliothèque Angular, ces paquets sont évalués avant l'exécution de l'adaptateur et échouent avec « JIT compilation failed ». Gardez `import '@angular/compiler'` en première ligne de votre entrée client, ou compilez en AOT.

## Inputs à partir des props {#inputs-from-props}

Déclarez les props comme inputs du composant :

```ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `<h1>Admin for {{ userId }}</h1>`,
})
export class AdminComponent {
  @Input() userId = '';
}
```

- Le montage définit les inputs avec `ComponentRef.setInput` avant la première détection de changements, donc `ngOnInit` les voit.
- `update({ props })` définit les nouvelles valeurs et lance la détection de changements. Avec `container`, il met à jour uniquement ce montage.
- Les clés qui ne sont pas des inputs sont ignorées. Les inputs absents des nouvelles props reviennent à `undefined`.

## Détection de changements sans zone.js {#change-detection-without-zone-js}

L'adaptateur n'importe jamais zone.js, donc il ne modifie pas `Promise`, les timers ni les événements DOM dans la page ou sur le serveur. Il choisit le provider selon la version d'Angular :

| Angular | Provider | Les événements DOM déclenchent la détection de changements |
| --- | --- | --- |
| 20+ | `provideZonelessChangeDetection()` | oui |
| 18-19 | `provideExperimentalZonelessChangeDetection()` | oui |
| 15-17 | `NgZone` remplacé par une zone sans effet | non |

Sous Angular 15-17, rien ne lance la détection de changements après un clic. Appelez `detectChanges()` dans vos handlers :

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="add()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  add(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

Pour conserver la détection de changements basée sur les zones, importez `zone.js` en haut de votre entrée client et passez `zone: true`. Si zone.js n'est pas chargé, `mount` est rejeté.

## Rendu côté serveur {#server-rendering}

```ts
// server-only module
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<string> {
  return renderAngularToString(AboutComponent, { appId: 'about', props: { userId: '42' } });
}
```

```ts
// client
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export const about = createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

- `renderAngularToString(component, { props?, providers?, appId?, document?, selector? })` renvoie les balises `<style>` du composant suivies de l'élément hôte, donc l'îlot est stylé dès le premier affichage (first paint). Il s'exécute sans zone.
- `props` définit les inputs du composant avant la première détection de changements, comme `mount` le fait côté client. Les clés qui ne sont pas des inputs sont ignorées. Passez les mêmes props à l'îlot côté client, sinon l'hydratation affiche un contenu différent.
- Il n'attend pas les requêtes HTTP ni les timers lancés par le composant. Chargez d'abord les données et fournissez-les.
- Appelez-la depuis du code serveur. Dans le navigateur, elle renvoie `''`.

Côté client, `createSsrAngularMicroApp` rend dans l'élément hôte produit par le serveur, puis retire les balises `<style>` serveur en ligne une fois qu'Angular a ajouté les siennes. L'événement `tuvix:mounted` indique `hydrated: true`. Cela remplace le DOM serveur. L'hydratation non destructive d'Angular nécessite un marqueur directement sous `<body>`, qu'un îlot à l'intérieur d'une autre page ne peut pas fournir, donc l'adaptateur n'ajoute pas `provideClientHydration()`.

## Event bus {#event-bus}

```ts
import { Component, OnDestroy, signal } from '@angular/core';
import { getGlobalBus } from '@tuvix.js/event-bus';

@Component({
  selector: 'app-cart-badge',
  standalone: true,
  template: `<span>{{ count() }}</span>`,
})
export class CartBadgeComponent implements OnDestroy {
  readonly count = signal(0);
  private readonly off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) =>
    this.count.set(itemCount),
  );

  ngOnDestroy(): void {
    this.off();
  }
}
```

Les signals planifient la détection de changements sous Angular 18+ sans zone. Sous 15-17, appelez `ChangeDetectorRef.detectChanges()` après `set`.

## Ce que l'adaptateur ne fait pas {#what-the-adapter-does-not-do}

- Il ne charge pas zone.js ni `@angular/localize`. Importez-les dans votre entrée quand vous en avez besoin.
- Il n'hydrate pas de façon non destructive ; voir ci-dessus.
- Il ne partage pas d'état entre les montages. Chaque montage est sa propre application Angular avec son propre injecteur racine, donc un service `providedIn: 'root'` existe une fois par montage.

## API {#api}

| Export | Rôle |
| --- | --- |
| `createAngularMicroApp({ name, component, module?, providers?, selector?, zone?, ssr?, bootstrap? })` | Module de micro app Angular |
| `createSsrAngularMicroApp(config)` | Identique avec `ssr: true` |
| `renderAngularToString(component, options?)` depuis `@tuvix.js/angular/server` | Styles + HTML de l'élément hôte |

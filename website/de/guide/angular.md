# Mit Angular

`@tuvix.js/angular` bootstrappt eine Angular-Komponente als Micro App, standardmäßig ohne zone.js. Außerdem rendert es Standalone-Komponenten auf dem Server zu HTML.

Unterstützt Angular 15 und neuer. `renderAngularToString` benötigt Angular 16 oder neuer mit `@angular/platform-server`.

## Installation

```bash
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
# JIT components (no AOT build step) also need the compiler
pnpm add @angular/compiler
# for renderAngularToString
pnpm add @angular/platform-server
```

## Eine Komponente in eine Micro App verwandeln

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

| Option | Typ | Beschreibung |
| --- | --- | --- |
| `name` | `string` | Pflicht. Muss mit dem registrierten App-Namen übereinstimmen. |
| `component` | `Type<C>` | Pflicht. Root-Komponente, standalone oder in `module` deklariert. |
| `module` | `Type<unknown>` | NgModule, das `component` deklariert. Seine Provider werden mit `importProvidersFrom` importiert. |
| `providers` | `Array<Provider \| EnvironmentProviders>` | Environment-Provider. |
| `selector` | `string` | Tag des Host-Elements. Standard: der Elementteil des Komponentenselektors oder `div`. |
| `zone` | `boolean` | Change Detection über zone.js verwenden. Standard `false`. |
| `ssr` | `boolean` | Übernimmt Markup aus `renderAngularToString`. `createSsrAngularMicroApp` setzt es. |
| `bootstrap` | `() => void \| Promise<void>` | Läuft einmal vor dem ersten Mount. |

Jeder Mount ruft `createApplication` auf und bootstrappt die Komponente in ein eigenes Host-Element innerhalb des Containers. Zwei Angular-Apps auf einer Seite oder ein Modul in zwei Containern kollidieren nicht an einem gemeinsamen `app-root`.

Hat die Komponente kein kompiliertes `ɵcmp` (JIT), lädt der Adapter `@angular/compiler` vor `@angular/platform-browser`. Das hilft nur, wenn der Adapter als erster Code ein anderes Angular-Paket als `@angular/core` lädt. Importieren deine Komponentendateien `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` oder eine andere Angular-Bibliothek, werden diese Pakete ausgewertet, bevor der Adapter läuft, und schlagen mit „JIT compilation failed“ fehl. Behalte `import '@angular/compiler'` als erste Zeile deines Client-Entry oder baue mit AOT.

## Inputs aus Props

Deklariere Props als Komponenten-Inputs:

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

- Der Mount setzt Inputs mit `ComponentRef.setInput` vor der ersten Change Detection, sodass `ngOnInit` sie sieht.
- `update({ props })` setzt die neuen Werte und führt die Change Detection aus. Mit `container` aktualisiert es nur diesen Mount.
- Schlüssel, die keine Inputs sind, werden übersprungen. Inputs, die in den neuen Props fehlen, werden auf `undefined` zurückgesetzt.

## Change Detection ohne zone.js

Der Adapter importiert zone.js nie, daher patcht er weder `Promise` noch Timer oder DOM-Events auf der Seite oder auf dem Server. Er wählt den Provider nach der Angular-Version:

| Angular | Provider | DOM-Events lösen Change Detection aus |
| --- | --- | --- |
| 20+ | `provideZonelessChangeDetection()` | ja |
| 18-19 | `provideExperimentalZonelessChangeDetection()` | ja |
| 15-17 | `NgZone` durch eine No-op-Zone ersetzt | nein |

Unter Angular 15-17 führt nach einem Klick nichts die Change Detection aus. Rufe `detectChanges()` in deinen Handlern auf:

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

Um die zonenbasierte Change Detection zu behalten, importiere `zone.js` am Anfang deines Client-Entry und übergib `zone: true`. Ist zone.js nicht geladen, wird `mount` abgelehnt.

## Server-Rendering

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

- `renderAngularToString(component, { props?, providers?, appId?, document?, selector? })` gibt die `<style>`-Tags der Komponente gefolgt vom Host-Element zurück, sodass die Island beim ersten Paint gestylt ist. Es läuft ohne Zone.
- `props` setzt Komponenten-Inputs vor der ersten Change Detection, so wie `mount` es auf dem Client tut. Schlüssel, die keine Inputs sind, werden übersprungen. Übergib der Island auf dem Client dieselben Props, sonst zeigt die Hydration anderen Inhalt.
- Es wartet nicht auf HTTP-Requests oder Timer, die die Komponente startet. Lade die Daten vorher und stelle sie bereit.
- Rufe es aus Server-Code auf. Im Browser gibt es `''` zurück.

Auf dem Client rendert `createSsrAngularMicroApp` in das Host-Element des Servers und entfernt dann die inline eingefügten `<style>`-Tags des Servers, sobald Angular seine eigenen hinzugefügt hat. Das Event `tuvix:mounted` meldet `hydrated: true`. Dabei wird das Server-DOM ersetzt. Die nicht-destruktive Hydration von Angular braucht einen Marker direkt unter `<body>`, den eine Island innerhalb einer anderen Seite nicht liefern kann, daher fügt der Adapter kein `provideClientHydration()` hinzu.

## Event Bus

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

Signals planen unter Angular 18+ ohne Zone die Change Detection ein. Unter 15-17 rufst du nach `set` `ChangeDetectorRef.detectChanges()` auf.

## Was der Adapter nicht tut

- Er lädt weder zone.js noch `@angular/localize`. Importiere sie in deinem Entry, wenn du sie brauchst.
- Er hydriert nicht nicht-destruktiv; siehe oben.
- Er teilt keinen Zustand zwischen Mounts. Jeder Mount ist eine eigene Angular-Anwendung mit eigenem Root-Injector, daher existiert ein Service mit `providedIn: 'root'` einmal pro Mount.

## API

| Export | Zweck |
| --- | --- |
| `createAngularMicroApp({ name, component, module?, providers?, selector?, zone?, ssr?, bootstrap? })` | Angular-Micro-App-Modul |
| `createSsrAngularMicroApp(config)` | Dasselbe mit `ssr: true` |
| `renderAngularToString(component, options?)` aus `@tuvix.js/angular/server` | Styles + HTML des Host-Elements |

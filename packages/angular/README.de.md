# @tuvix.js/angular

> Angular-15+-Bindungen für das Microfrontend-Framework Tuvix.js

Teil des Microfrontend-Frameworks [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Installation

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

Füge `@angular/compiler` für JIT-Komponenten hinzu, und auf dem Server `@angular/platform-server` plus `@angular/compiler` für `renderAngularToString` (Angular 16+).

## Schnellstart

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

Der Adapter registriert das Modul mit `registerModule` aus `@tuvix.js/loader`. Props vom Orchestrator werden zu Inputs der Komponente:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'greeting', entry: () => import('./greeting-app'), container: '#greeting', props: { name: 'Ada' } });
await orchestrator.start();
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

## API

### `createAngularMicroApp(config)`

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | App-Name, wird mit `registerModule` registriert |
| `component` | `Type<C>` | erforderlich | Root-Komponente |
| `module` | `Type<unknown>` | keiner | NgModule, das `component` deklariert; seine Provider werden mit `importProvidersFrom` hinzugefügt |
| `providers` | `AngularProviders` | `[]` | Environment-Provider wie `provideHttpClient()` |
| `selector` | `string` | Element-Teil des Komponenten-Selektors, sonst `'div'` | Tag-Name des Host-Elements |
| `zone` | `boolean` | `false` | zone.js verwenden; dein Entry muss zuerst `zone.js` importieren |
| `ssr` | `boolean` | `false` | Markup von `renderAngularToString` übernehmen |
| `bootstrap` | `() => void \| Promise<void>` | keiner | Einmaliges Setup |

- Jeder Mount ruft `createApplication` auf und bootstrappt die Komponente in ein eigenes Host-Element im Container. So kollidieren zwei Angular-Apps (oder zwei Kopien einer App) nie auf einem `app-root`.
- Props werden vor der ersten Change Detection mit `ComponentRef.setInput` gesetzt, daher sieht `ngOnInit` sie. Schlüssel, die keine Inputs sind, werden übersprungen.
- `update({ props, container? })` setzt die neuen Inputs und führt `appRef.tick()` für einen Container oder für jeden Mount aus. Inputs, die in den neuen Props fehlen, werden auf `undefined` zurückgesetzt.
- Bei JIT-Komponenten (ohne `ɵcmp`) wird `@angular/compiler` vor `@angular/platform-browser` geladen. Das hilft nur, wenn der Adapter als erster Code ein anderes Angular-Paket als `@angular/core` lädt. Importieren deine Komponentendateien `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` oder eine andere Angular-Bibliothek, werden diese Pakete ausgewertet, bevor der Adapter läuft, und schlagen mit „JIT compilation failed“ fehl. Behalte `import '@angular/compiler'` als erste Zeile deines Client-Entrys oder baue mit AOT.
- `unmount` zerstört die Application, leert den Container und löst `tuvix:unmounted` aus. Rufst du es auf, während `mount` noch lädt, bricht es den Mount ab.

### `createSsrAngularMicroApp(config)`

Entspricht `createAngularMicroApp({ ...config, ssr: true })`. Enthält der Container Server-Markup, rendert Angular in das Host-Element des Servers, und der Adapter entfernt die inline eingebetteten `<style>`-Tags des Servers. `tuvix:mounted` meldet `hydrated: true`.

Dabei wird über das Server-DOM neu gerendert. Angulars nicht-destruktive Hydration (`provideClientHydration`) braucht einen Hydration-Marker-Kommentar direkt unter `<body>`. Eine Island innerhalb einer anderen Seite kann diesen nicht liefern, daher fügt der Adapter ihn nicht hinzu.

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `renderAngularToString(component, options?)` aus `@tuvix.js/angular/server`

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `providers` | `AngularProviders` | `[]` | Provider für das Server-Rendering |
| `appId` | `string` | `'ng'` | Angulars `APP_ID` |
| `document` | `string` | leeres Dokument mit dem Host-Element | Dokument, in das gerendert wird |
| `selector` | `string` | Element-Teil des Komponenten-Selektors, sonst `'app-root'` | Host-Tag für das Standarddokument |
| `props` | `Record<string, unknown>` | `{}` | Werte für die Inputs der Komponente, vor der ersten Change Detection gesetzt |

Gibt die `<style>`-Tags der Komponente gefolgt vom Body-Markup zurück. Die Funktion läuft zoneless, patcht nie `Promise` und wartet nicht auf HTTP-Requests, die die Komponente startet. Rufe sie aus einer Serverfunktion auf; im Browser gibt sie `''` zurück.

`props` funktioniert wie die Client-Props: Schlüssel sind Input-Namen (oder Aliase), Schlüssel, die keine Inputs sind, werden übersprungen, und `ngOnInit` sieht die Werte. Übergib dasselbe Objekt an das Server-Rendering und an `mount`, damit beide Seiten dasselbe Markup rendern.

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

const props = { name: 'Ada' };
const aboutHtml = await renderAngularToString(AboutComponent, { appId: 'about', props });
// Client: aboutApp.mount({ container, props })
```

### Typen

`AngularMicroAppConfig<C>`, `AngularSsrMicroAppConfig<C>`, `AngularSsrOptions`, `AngularProviders` (alle aus `@tuvix.js/angular`).

## Change Detection

Der Adapter importiert nie zone.js. Ohne `zone: true` fügt er auf Angular 20+ `provideZonelessChangeDetection()` hinzu, auf 18-19 `provideExperimentalZonelessChangeDetection()`, und auf 15-17 ersetzt er `NgZone` durch `ɵNoopNgZone`.

- Angular 18+: Event Listener, Signals, `markForCheck()` und `AsyncPipe` planen eine Change Detection ein. Ein normales Feld, das du in einem Timer- oder `fetch`-Callback änderst, tut das nicht; verwende ein Signal oder `markForCheck()`.
- Angular 15-17: DOM-Events lösen keine Change Detection aus. Rufe nach einer Zustandsänderung `ChangeDetectorRef.detectChanges()` auf oder übergib `zone: true`.

## Sonderfälle

- `zone: true` ohne geladenes zone.js lässt den Mount mit einem Reject scheitern und löst `tuvix:error` aus.
- `unmount` auf einem Container, den dieses Modul nie gemountet hat, tut nichts.
- Auf Angular 16 kopiert `@angular/platform-server` während eines Server-Renderings Dominos DOM-Klassen (`Event`, `Node`, ...) auf das globale Objekt von Node. Das macht Angular, nicht der Adapter.
- Komponenten mit Attribut-Selektor brauchen auf dem Server ein `document` mit einem passenden Host-Element.

## Was es nicht tut

- Es lädt kein zone.js, fügt kein `provideClientHydration()` hinzu und behält weder Server-DOM-Knoten noch Formularzustand.
- Es schreibt kein `window.__TUVIX_ANGULAR_PROPS__`; deklariere Inputs.

Vollständige Dokumentation: [tuvix.js.org/de/packages/angular](https://tuvix.js.org/de/packages/angular)

## Lizenz

MIT

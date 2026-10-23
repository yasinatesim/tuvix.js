---
title: '@tuvix.js/angular'
---

<PackageHeader
  name="@tuvix.js/angular"
  title="Angular Bindings"
  description="Macht aus einer Angular-15+-Komponente eine Tuvix.js Micro App: standardmäßig zoneless, eine Application pro Container, Props als Component-Inputs und Server-Rendering mit Styles."
  icon="🔺"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

Füge `@angular/compiler` hinzu, wenn deine Komponenten nicht AOT-kompiliert sind (JIT), und auf dem Server `@angular/platform-server` plus `@angular/compiler`, wenn du `renderAngularToString` aufrufst. Der Client-Adapter braucht Angular 15 oder neuer, der Server-Renderer Angular 16 oder neuer.

## Wann du es verwendest {#when-to-use-it}

Verwende dieses Paket, wenn eine Angular-Komponente als eine Micro App unter mehreren laufen soll: Der Orchestrator mountet sie auf einer Route in einen Container, übergibt Props, aktualisiert sie und unmountet die Komponente beim Verlassen der Route. Mehrere Angular-Apps oder mehrere Kopien einer App können sich eine Seite teilen, weil jeder Mount seine eigene Angular-Application und sein eigenes Host-Element bekommt. Der Adapter lädt nie zone.js, daher patcht ein Angular-Island weder `Promise` noch `addEventListener` für die React- oder Vue-Apps daneben.

Wenn Angular die ganze Seite besitzt, bootstrappe es wie gewohnt mit `bootstrapApplication`. Der Adapter bringt dir dort nichts.

## Schnellstart {#quick-start}

Eine Standalone-Komponente mit einem Input:

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

Der Micro-App-Entry umschließt sie:

```ts
// greeting-app.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { GreetingComponent } from './greeting.component';

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

Die Shell registriert die App und startet den Orchestrator:

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

Der Adapter erzeugt in `#greeting` ein Host-Element `<app-greeting>` und zeigt nach dem Update „Hello Grace“ an.

## API

### `createAngularMicroApp`

```ts no-check
function createAngularMicroApp<C>(config: AngularMicroAppConfig<C>): MicroAppModule;
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | App-Name. Der Adapter registriert das Modul unter diesem Namen mit `registerModule` aus `@tuvix.js/loader`. |
| `component` | `Type<C>` | erforderlich | Root-Komponente. Standalone-Komponenten funktionieren ohne weitere Angaben. |
| `module` | `Type<unknown>` | keiner | NgModule, das `component` deklariert. Der Adapter fügt seine Provider mit `importProvidersFrom` hinzu. |
| `providers` | `AngularProviders` | `[]` | Environment-Provider für die Application, etwa `provideHttpClient()`. |
| `selector` | `string` | Elementteil des Komponenten-Selektors, sonst `'div'` | Tag-Name des Host-Elements, das der Adapter im Container erzeugt. |
| `zone` | `boolean` | `false` | Change Detection über zone.js nutzen. Dein Client-Entry muss zuerst `zone.js` importieren. |
| `ssr` | `boolean` | `false` | Markup aus `renderAngularToString` übernehmen. Siehe `createSsrAngularMicroApp`. |
| `bootstrap` | `() => void \| Promise<void>` | keiner | Einmaliges Setup. `bootstrap()` des Moduls wartet darauf. |

Jeder `mount({ container, props })`:

1. Lädt zuerst `@angular/compiler`, wenn `component` oder `module` keine AOT-Definition (`ɵcmp` / `ɵmod`) hat, dann `@angular/core` und `@angular/platform-browser`. Das hilft nur, wenn der Adapter als erster Code ein Angular-Paket außer `@angular/core` lädt. Importieren deine Komponentendateien `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` oder eine andere Angular-Bibliothek, werden diese Pakete ausgewertet, bevor der Adapter läuft, und schlagen mit „JIT compilation failed“ fehl. Behalte `import '@angular/compiler'` als erste Zeile deines Client-Entrys oder baue AOT.
2. Ruft `createApplication({ providers })` mit den Change-Detection-Providern für deine Angular-Version (siehe [Change Detection](#change-detection)), den Modul-Providern und `providers` auf.
3. Erzeugt das Host-Element (`<app-greeting>` für den Selektor `'app-greeting'`, `<div>` für einen Attribut-Selektor wie `'[card]'`), legt es in den Container und bootstrappt die Komponente hinein.
4. Setzt Props als Component-Inputs mit `ComponentRef.setInput` vor der ersten Change Detection, sodass `ngOnInit` sie schon sieht. Auf Angular-Versionen ohne `ComponentFactoryResolver` werden die Inputs direkt nach dem Bootstrap gesetzt, gefolgt von einem Tick.
5. Löst `tuvix:mounted` auf dem Container aus. Ein Fehler löst `tuvix:error` aus und lehnt mit dem ursprünglichen Fehler ab.

`update({ props, container? })` schreibt die neuen Werte mit `setInput` und führt `appRef.tick()` aus, für einen Container oder für jeden Mount, wenn du `container` weglässt. Das rendert auf jeder Angular-Version, zoneless oder nicht.

`unmount({ container })` zerstört die Application, leert den Container und löst `tuvix:unmounted` aus.

Eine Komponente, die in einem NgModule deklariert ist:

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

Dieselben Optionen wie `createAngularMicroApp` ohne `ssr`; die Funktion verhält sich wie `createAngularMicroApp({ ...config, ssr: true })`. Verwende sie auf dem Client für Islands, die der Server mit `renderAngularToString` gerendert hat.

Enthält der Container Server-Markup, verwendet der Adapter das Host-Element wieder, wenn es ein direktes Kind des Containers mit dem erwarteten Tag ist. Angular rendert in dieses Element und ersetzt dabei die Kinder vom Server. Sobald Angular die Komponenten-Styles in den `<head>` eingefügt hat, entfernt der Adapter die inline eingebetteten `<style>`-Tags vom Server und alles andere neben dem Host. `tuvix:mounted` meldet `hydrated: true`. Ein leerer Container bekommt ein normales Client-Rendering.

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

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `props` | `Record<string, unknown>` | `{}` | Input-Werte nach Input-Name (oder Alias). Werden vor der ersten Change Detection gesetzt, wie beim Client-Mount. Schlüssel, die keine Inputs sind, werden übersprungen. |
| `providers` | `AngularProviders` | `[]` | Environment-Provider für das Server-Rendering. |
| `appId` | `string` | `'ng'` (Angulars Standard) | Angulars `APP_ID`. Angular schreibt sie in das Attribut `ng-app-id` der Style-Tags. |
| `document` | `string` | ein leeres Dokument mit dem Host-Element im `<body>` | HTML-Dokument, in das gerendert wird. Es muss das Host-Element enthalten. |
| `selector` | `string` | Elementteil des Komponenten-Selektors, sonst `'app-root'` | Tag des Host-Elements für das Standarddokument; Angular bootstrappt in das Element, auf das er passt. |

Rendert eine Standalone-Komponente mit `renderApplication` aus `@angular/platform-server` und gibt ein Fragment zurück: die `<style>`-Tags der Komponente aus dem gerenderten `<head>`, gefolgt vom inneren HTML des `<body>`. Leg das Fragment in den Container, in den `createSsrAngularMicroApp` mountet; das Island hat seine Styles dann beim ersten Paint.

`props` erreichen die Komponente über `setInput` vor der ersten Change Detection, genauso wie beim Client-`mount`, daher sieht `ngOnInit` sie auf beiden Seiten. Übergib dasselbe Objekt an das Server-Rendering und an den Client-Mount, dann erzeugen beide dasselbe Markup.

Das Rendering läuft zoneless und patcht nie das globale `Promise`. Es lädt immer zuerst `@angular/compiler`, weil Node die Angular-Pakete aus `node_modules` ohne den Angular-Linker lädt. Ruf es aus einer Serverfunktion auf, nicht aus Code, der auch im Browser läuft: Im Browser gibt es `''` zurück.

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAboutIsland(): Promise<string> {
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props: { title: 'About us' } });
  return `<section id="about" data-tuvix-app="about">${html}</section>`;
}
```

### Typen {#types}

| Typ | Bedeutung |
| --- | --- |
| `AngularMicroAppConfig<C>` | Optionen von `createAngularMicroApp`. |
| `AngularSsrMicroAppConfig<C>` | `AngularMicroAppConfig<C>` ohne `ssr`; Optionen von `createSsrAngularMicroApp`. |
| `AngularSsrOptions` | Optionen von `renderAngularToString`. Importiere den Typ aus `@tuvix.js/angular`. |
| `AngularProviders` | `Array<Provider \| EnvironmentProviders>`, das, was `createApplication` und `bootstrapApplication` akzeptieren. |

## Change Detection {#change-detection}

Der Adapter importiert nie zone.js. Solange du nicht `zone: true` übergibst, wählt er das zoneless Setup, das deine Angular-Version unterstützt:

| Angular | Provider, den der Adapter hinzufügt | Was Change Detection auslöst |
| --- | --- | --- |
| 20 und neuer | `provideZonelessChangeDetection()` | Event-Listener im Template, Schreibzugriffe auf Signals, `markForCheck()`, `AsyncPipe`, `setInput` |
| 18 und 19 | `provideExperimentalZonelessChangeDetection()` | Wie bei 20 |
| 15 bis 17 | `NgZone` ersetzt durch `ɵNoopNgZone` | Nichts von selbst. `update()` vom Host rendert trotzdem. |

Auf Angular 18 und neuer rendert ein einfaches Feld, das du in einem `setTimeout`- oder `fetch`-Callback änderst, das Template nicht neu. Halte diesen State in einem Signal oder ruf `ChangeDetectorRef.markForCheck()` auf:

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

Auf Angular 15 bis 17 lösen auch Klicks und andere DOM-Events keine Change Detection aus. Ruf `ChangeDetectorRef.detectChanges()` auf, nachdem du State änderst:

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

Um die zone-basierte Change Detection zu behalten, importiere zone.js in deinem Client-Entry, bevor der Adapter mountet, und übergib `zone: true`. Der Adapter lässt dann Angulars Standard-`NgZone` bestehen und bootstrappt darin:

```ts
import 'zone.js';
import { createAngularMicroApp } from '@tuvix.js/angular';
import { DashboardComponent } from './dashboard.component';

export default createAngularMicroApp({ name: 'dashboard', component: DashboardComponent, zone: true });
```

zone.js patcht `Promise`, Timer und DOM-Listener für die ganze Seite, einschließlich der Apps anderer Frameworks.

## Server-Rendering {#server-rendering}

1. Ruf auf dem Server `renderAngularToString(Component)` auf und leg das Fragment in das Container-Element.
2. Exportiere auf dem Client `createSsrAngularMicroApp({ name, component })` aus dem Island-Entry.
3. Der Orchestrator mountet die App in diesen Container. Angular rendert in das Host-Element vom Server, und der Adapter entfernt die Server-Styles.

Der Adapter rendert über das Server-DOM neu. Er nutzt nicht Angulars nicht-destruktive Hydration (`provideClientHydration`), weil diese Hydration eine Seite erwartet, die Angular von oben bis unten gerendert hat: Sie sucht Angulars Hydration-Markierungskommentar als direktes Kind von `<body>` und `ngh`-Annotationen an den Komponenten. Ein Island in einer Seite, die React, Vue oder ein einfaches Server-Template gerendert hat, hat beides nicht. Der Kompromiss: Sichtbares Markup und Styles kommen mit dem HTML an, aber State im Island (Fokus, ein eingetippter Wert, Scroll-Position) wird zurückgesetzt, wenn Angular übernimmt, und Klicks vor diesem Zeitpunkt bewirken nichts.

Übergib dieselben Props an das Server-Rendering und an den Client-Mount, damit das Client-Rendering zum Server-Markup passt. Das Rendering wartet nicht auf HTTP-Requests oder Timer, die die Komponente startet: Lade die Daten vorher und gib sie als Props weiter.

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

Schick `props` mit der Seite an den Browser (zum Beispiel als JSON in einem Tag `<script type="application/json">`) und registriere die App damit:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const props = JSON.parse(document.getElementById('about-props')?.textContent ?? '{}') as Record<string, unknown>;
const orchestrator = createOrchestrator();

orchestrator.register({ name: 'about', entry: () => import('./about-app'), container: '#about', props });
await orchestrator.start();
```

Für Werte, die keine Inputs sind, etwa eine API-Basis-URL, übergib stattdessen auf beiden Seiten `providers`.

## Sonderfälle {#edge-cases}

- `zone: true` ohne zone.js auf der Seite lehnt den Mount mit `[tuvix.js/angular] "<name>" sets zone: true, but zone.js is not loaded. Import 'zone.js' in your client entry before mounting, or drop zone: true.` ab und löst `tuvix:error` aus.
- Props, deren Schlüssel keine Component-Inputs sind, werden übersprungen, daher loggt Angular kein NG0303. Inputs werden über ihren öffentlichen Namen zugeordnet (den Alias, falls du einen setzt).
- Ein Input, der in den alten Props vorkommt und in den neuen fehlt, wird auf `undefined` gesetzt. Der Feld-Initializer (`name = ''`) läuft nicht erneut.
- `update`, bevor der Mount fertig ist, speichert die Props; der ausstehende Bootstrap verwendet die neuesten. `update({ container })` für einen Container, den dieses Modul nicht gemountet hat, bewirkt nichts.
- `unmount`, während `mount` noch Angular lädt, bricht den Mount ab: Die Application wird zerstört, der Container bleibt leer und es wird kein `tuvix:mounted` ausgelöst. Kommt der Abbruch nach dem Bootstrap, bekommst du `tuvix:mounted` gefolgt von `tuvix:unmounted`.
- Ein zweiter `mount` auf denselben Container zerstört die erste Application, bevor er die neue bootstrappt.
- `unmount` auf einem Container, den dieses Modul nie gemountet hat, bewirkt nichts.
- Wirft das Zerstören der Application, leert der Adapter den Container, löst `tuvix:error` aus und wirft den Fehler erneut.
- Mit SSR bekommt ein Container, dessen Markup kein direktes Kind mit dem Host-Tag hat, ein neues Host-Element. `hydrated` ist trotzdem `true`, weil der Container Markup enthielt.
- Auf dem Server fällt eine Komponente mit Attribut-Selektor (`'[card]'`) auf einen Host `<app-root>` zurück, auf den der Selektor nicht passt. Übergib ein `document`, dessen `<body>` ein passendes Element enthält.
- Auf Angular 16 kopiert `@angular/platform-server` während eines Server-Renderings die DOM-Klassen von Domino (`Event`, `Node` und weitere) auf das globale Objekt von Node. Das macht Angular, nicht der Adapter.
- JIT-Komponenten ohne das Angular-Compiler-Plugin brauchen weiterhin TypeScript `experimentalDecorators`; Angular unterstützt den Standard-Decorator-Vorschlag nicht.

## Was es nicht tut {#what-it-does-not-do}

- Es lädt weder zone.js noch ein anderes Polyfill.
- Es fügt kein `provideClientHydration()` hinzu und führt keine nicht-destruktive Hydration durch.
- Es schickt keine Server-Props an den Browser. Serialisiere sie selbst in die Seite und übergib dasselbe Objekt an den Client-Mount.
- Es wartet nicht auf HTTP-Aufrufe, Timer oder `PendingTasks`, die die Komponente während eines Server-Renderings startet.
- Es behält die DOM-Knoten, den Fokus oder den Formular-State vom Server nicht, wenn der Client übernimmt.
- Es gibt der Komponente keinen Tuvix-Props-Service und keinen Bus. Deklariere Inputs für Props und nutze [`@tuvix.js/event-bus`](/de/packages/event-bus), um mit anderen Apps zu kommunizieren.

## Migration von 0.4 {#migrating-from-0-4}

**`createAngularMicroApp` nimmt eine Komponente.** `platform` und `compilerOptions` sind entfallen. Übergib die Root-Komponente als `component` und, falls sie in einem NgModule deklariert ist, das Modul als `module`.

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

**Props sind Inputs.** `update()` schreibt nicht mehr `window.__TUVIX_ANGULAR_PROPS__`. Lösche Services, die dieses Global lesen, und deklariere stattdessen `@Input()`-Felder mit den Prop-Namen.

**Standardmäßig zoneless.** Apps laufen ohne zone.js, solange du nicht `zone: true` übergibst. Auf Angular 15 bis 17 lösen DOM-Events keine Change Detection mehr aus; ruf in Handlern `ChangeDetectorRef.detectChanges()` auf oder aktiviere zone.js. Du kannst `provideZonelessChangeDetection()` aus deinem Entry entfernen. Entferne `import '@angular/compiler'` nur, wenn deine Komponentendateien aus Angular nichts außer `@angular/core` importieren; sonst behalte es als erste Zeile des Client-Entrys oder baue AOT.

**Kein automatisches `provideClientHydration()`.** `createSsrAngularMicroApp` rendert über das Server-Markup neu. Lass `provideClientHydration()` aus seinen `providers` weg.

**`appId` wirkt.** In 0.4 akzeptierte `renderAngularToString` `appId` und ignorierte es. Jetzt setzt es Angulars `APP_ID`, daher ändert sich das Attribut `ng-app-id` der Style-Tags von `ng` auf deinen Wert.

**Host-Element.** Auf Client und Server kommt das Host-Tag aus dem Komponenten-Selektor statt aus einem festen `'app-root'`, und der Client-Adapter erzeugt es im Container. `unmount` auf einem Container, den das Modul nie gemountet hat, leert ihn nicht mehr.

Eine vollständige App findest du in der [Angular-Anleitung](/de/guide/angular).

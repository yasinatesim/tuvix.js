# Migration auf 0.5

0.5 behebt Fehler, die beobachtbares Verhalten verändert haben. Einige dieser Korrekturen brechen deshalb 0.4-Code. Diese Seite listet jeden Breaking Change nach Paket auf, zusammen mit dem Code, den du ändern musst. Aktualisiere alle Pakete `tuvix.js` und `@tuvix.js/*` gemeinsam auf `^0.5.0`; 0.4- und 0.5-Adapter auf einer Seite zu mischen wird nicht unterstützt.

```bash
pnpm up --latest "tuvix.js" "@tuvix.js/*"
```

Projekte, die vor 0.5 mit `create-tuvix-app` erstellt wurden, hängen von `^0.1.0` ab, was nie auf 0.4 oder 0.5 auflöst. Passe diese Versionsbereiche von Hand an.

## Core

### Der Orchestrator nutzt den globalen Bus

0.4 gab jedem Orchestrator einen privaten Bus, getrennt von `getGlobalBus()`. In 0.5 ist der Bus des Orchestrators `getGlobalBus()`, sofern du keine `eventBus`-Optionen übergibst, und `destroy()` lässt den globalen Bus bestehen.

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

Wenn du den Bus des Orchestrators auf `window` bereitgestellt hast, damit Apps ihn finden, kannst du das entfernen und den `bus` aus dem Mount-Kontext oder `getGlobalBus()` verwenden.

### Routenwechsel lassen manuelle Apps in Ruhe

0.4 hat beim nächsten Routenwechsel eine App unmountet, die weder `activeWhen` noch eine Router-Route hatte, und ebenso `mountWhenVisible`-Apps. In 0.5 betreffen Reconciles nur Apps, die `activeWhen` oder eine Route steuert. Wenn du dich darauf verlassen hast, dass eine Navigation eine manuell gemountete App entfernt, unmounte sie selbst:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.unmountApp('cookie-banner');
```

### sandbox: true rendert in einem Shadow Root

In 0.4 hatte `sandbox` bei `register` keine Wirkung. In 0.5 mountet `sandbox: true` die App in einem Shadow Root und lädt die `styles` ihres Entrys dort. Seiten-CSS erreicht die App nicht mehr, und die Entry-Styles der App erreichen die Seite nicht mehr. Entferne `sandbox: true` bei Apps, die von Seiten-Styles abhängen. Siehe [Sandboxing](/de/guide/sandbox).

### prefetch: 'hover'

0.4 hat bei der ersten Mausbewegung irgendwo auf der Seite jede App vorgeladen. 0.5 lädt eine App vor, wenn der Zeiger einen Link mit gleichem Origin betritt, dessen Pfad die App aktiviert, oder wenn dieser Link den Fokus erhält. Nutze `'idle'` oder `'immediate'`, um alle Apps im Voraus zu laden.

### OrchestratorConfig.shared entfällt

Der Orchestrator hat `shared` nie gelesen. Lösche es und teile Abhängigkeiten über `@tuvix.js/module-federation` oder Import Maps.

### activeWhen-Muster

`activeWhen`-Strings nutzen jetzt `matchPath`. Ein Query-String oder Hash unmountet eine App nicht mehr, `:param`-Segmente funktionieren, und Zeichen wie `.` und `(` werden wörtlich gematcht.

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

## Router

### Die Route '/' und RouteConfig.exact

Routenpfade matchen überall den gesamten Pfad. Eine Route `'/'` aktiviert jetzt nur noch auf `/`; in 0.4 behandelte `getActiveApps()` sie als jeden Pfad, während `match()` sie als exakt behandelte. `RouteConfig.exact` entfällt, weil es nie etwas verändert hat.

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

`activeWhen: '/'` bei `register` matcht weiterhin jeden Pfad, weil `activeWhen`-Strings Präfix-Matching verwenden.

### push und replace fügen die Base hinzu

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

Übergibst du in 0.5 `/app/settings`, schreibt der Router `/app/app/settings`. Ein Guard, der eine Zurück- oder Vorwärts-Navigation abbricht, stellt die URL ebenfalls mit der Base wieder her.

### Weitere Router-Änderungen

- `base` wird nur an einer Segmentgrenze entfernt. Mit `base: '/app'` bleibt `/application` `/application`.
- `pathToRegex()` gibt eine gecachte `RegExp` zurück; verändere sie nicht. Das zweite Argument `exact` entfällt.
- Regex-Zeichen in Mustern werden wörtlich gematcht. Ein `*` in der Mitte eines Musters matcht ein Segment.
- `matchRoute()` und `isPathActive()` ignorieren einen `#hash` im Pfad.

## Loader

### Entfernte Optionen

`LoaderOptions.fetch` und `EntryConfig.html` entfallen. Der Loader hat sie nie gelesen; lösche sie aus deiner Konfiguration.

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

### Modul-Skripte laufen einmal pro URL

Nach `unload(name)` lädt eine App, deren Skript mit `type: 'module'` sich selbst registriert hat, nicht erneut von derselben URL, weil Browser ein Modul-Skript einmal pro URL ausführen. Nutze für Apps, die du entlädst und neu lädst, einen Entry als Loader-Funktion:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

`load()` meldet für ein gecachtes Modul jetzt seine echte `duration` statt `0`.

## Module Federation

`federatedEntry` und `createFederatedEntry` geben eine Loader-Funktion statt `{ scripts: [remoteEntry.js] }` zurück. Der 0.4-Entry hat das Container-Skript geladen und ist dann mit „no exports found“ fehlgeschlagen.

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

- `FederatedLoaderConfig.shared` wird durch `shareScope` ersetzt. 0.4 hat `shared` nie gelesen.
- `loadRemoteContainer` gibt `FederatedContainer` statt `any` zurück.

## React

- Das Server-HTML von `TuvixReactApp` enthält jetzt Suspense-Kommentarmarker (`<!--$-->...<!--/$-->`). Rendere und hydriere auf beiden Seiten mit `@tuvix.js/react` 0.5.
- `mount` lehnt ab, wenn das erste Rendern wirft. In 0.4 erreichte der Fehler den Root-Error-Handler von React, und `mount` wurde erfüllt. Der Orchestrator zeigt jetzt den `fallback` der App an und ruft `onError` auf.
- `unmount` auf einem Container, den das Modul nie gemountet hat, tut nichts. 0.4 hat ihn geleert.

## Vue

`update()` schreibt nicht mehr in `app.config.globalProperties.$tuvixProps`. Props sind jetzt reaktiv:

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

Nachfahren können `inject('tuvixProps')` aufrufen, das dasselbe reaktive Objekt zurückgibt.

- `VueSsrMicroAppConfig` akzeptiert `ssr` nicht mehr. `createSsrVueMicroApp` setzt es.
- `unmount` auf einem Container, den das Modul nie gemountet hat, tut nichts.

## Svelte

- Ohne `ssr` leert `createSvelteMicroApp` den Container, bevor es rendert. 0.4 hat Svelte-3/4-Komponenten hinter vorhandenes Markup angehängt. Nutze `createSsrSvelteMicroApp`, um Server-Markup zu behalten und zu hydrieren.
- `unmount` auf einem Container, den das Modul nie gemountet hat oder dessen Mount fehlgeschlagen ist, tut nichts. 0.4 hat ihn geleert. Alle vier Adapter verhalten sich jetzt so.
- `renderSvelteToString` fällt nicht mehr auf `App.render` zurück, wenn `svelte/server` nicht geladen werden kann. Mit übergebenem `render` nutzt es Svelte 5; sonst nimmt es den Svelte-5-Pfad, wenn `svelte` `mount` exportiert, und ruft `App.render` nur für Svelte 3/4 auf. Ein Import- oder Render-Fehler von Svelte 5 erreicht dich.

Svelte-5-Komponenten funktionieren in 0.5; in 0.4 ist `createSvelteMicroApp` an ihnen gescheitert. Ein `update()` unter Svelte 5 mountet die Komponente neu, es sei denn, du übergibst in der Konfiguration `SvelteMap` aus `svelte/reactivity`. Dann werden Props an Ort und Stelle aktualisiert:

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

## Angular

### Neue Konfigurationsform

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

`platform` und `compilerOptions` entfallen. Entferne `import '@angular/compiler'` aus deinem Entry; der Adapter lädt den Compiler für JIT-Komponenten.

### Standardmäßig zonenlos

Apps laufen ohne zone.js, sofern du nicht `zone: true` übergibst. Unter Angular 15-17 lösen DOM-Events keine Change Detection mehr aus; rufe `ChangeDetectorRef.detectChanges()` in den Handlern auf, oder importiere `zone.js` in deinem Entry und übergib `zone: true`. Angular 18+ plant die Change Detection ohne zone.js. Siehe [Angular](/de/guide/angular).

### Props sind Inputs

`update()` schreibt nicht mehr in `window.__TUVIX_ANGULAR_PROPS__`. Deklariere stattdessen `@Input()`-Properties; der Adapter setzt sie mit `setInput`.

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

### Weitere Angular-Änderungen

- `createSsrAngularMicroApp` fügt `provideClientHydration()` nicht mehr hinzu. Es rendert neu in das Host-Element des Servers.
- `unmount` auf einem Container, den das Modul nie gemountet hat, tut nichts.

## Sandbox

- `Sandbox({ css: false }).activate(container)` gibt `null` zurück und hängt keinen Shadow Root an. `ISandbox.activate` gibt `ShadowRoot | null` zurück; prüfe auf `null`, bevor du `addStyle` aufrufst.
- Der Strict-Modus von `JsSandbox` wirft bei einem blockierten Schreibzugriff einen `TypeError`. 0.4 hat eine Warnung geloggt und den Wert trotzdem gespeichert. Füge Globals, in die dein Code schreibt, zu `allowedGlobals` hinzu.

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });
const shadow = sandbox.activate(container);
if (shadow) sandbox.css.addStyle(shadow, ':host { display: block; }');
```

## Server

- `createServerRenderer().render()` gibt `statusCode: 502` zurück, wenn mindestens eine App den Pfad gematcht hat und jeder Fragment-Fetch fehlgeschlagen ist. Es gibt weiterhin 200 zurück, wenn keine App gematcht hat oder ein Fragment erfolgreich war. `createMiddleware` sendet diesen Status. Der Streaming-Renderer sendet immer 200.
- `createMiddleware` und `createStreamingMiddleware` rufen `next(error)` statt `next()` auf, wenn das Rendern wirft. Express leitet die Anfrage so an deinen Error-Handler weiter.

## Nicht brechende Korrekturen, die du kennen solltest

- `require('@tuvix.js/core')` und die anderen CommonJS-Entry-Points funktionieren. In 0.4 haben fünf Pakete `require` auf Dateien verwiesen, die der Build nie geschrieben hat.
- `getGlobalBus()` hält seine Instanz auf `window`, sodass separat gebündelte Micro Apps einen gemeinsamen Bus nutzen.
- Adapter und `defineMicroApp` lösen `tuvix:mounted`, `tuvix:unmounted` und `tuvix:error` aus. Siehe [Lifecycle-Events](/de/guide/lifecycle-events).
- Ein `bootstrap()`, das wirft, läuft beim nächsten Mount erneut. 0.4 hat es danach übersprungen.
- `register()` nach `start()` mountet die App sofort, wenn der aktuelle Pfad sie aktiviert, und beginnt, eine `mountWhenVisible`-App zu beobachten.
- Jeder Lifecycle-Fehler sendet `tuvix:app:error` mit `{ name, error, phase }` auf den Bus. 0.4 hat das nur bei Lade- und Mount-Fehlern gesendet.
- `maxListeners` warnt einmal pro Event mit `console.warn`, mit oder ohne `debug`.
- `orchestrator.connectRouter()` ersetzt Brücken aus `setTimeout` + `reconcile()`. Siehe [Externer Router](/de/guide/external-router).

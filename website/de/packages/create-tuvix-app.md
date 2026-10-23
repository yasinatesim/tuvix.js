---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="CLI, die ein Vite-Projekt für eine Tuvix.js-Shell oder eine Micro App mit React, Vue, Svelte, Angular oder Vanilla JS anlegt und danach die Abhängigkeiten installiert."
  icon="🚀"
  npm="true"
  github="cli"
/>

## Verwendung

Der Paketname beginnt mit `create-`, daher findet der `create`-Befehl jedes Paketmanagers das Paket, und `npx` führt sein Binary `create-tuvix-app` aus:

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app
```

`npm create` leitet Flags erst nach `--` weiter. Die anderen Befehle reichen sie direkt durch:

```bash
npm create tuvix-app@latest my-app -- --template react-app --typescript
pnpm create tuvix-app my-app --template react-app --typescript
```

Das Binary braucht Node.js. Es schreibt in einen neuen Ordner unterhalb des aktuellen Verzeichnisses.

## Wann du es verwendest

Verwende es, um einen Baustein von Tuvix.js von null an aufzusetzen: eine Shell, die Micro Apps registriert, oder eine einzelne Micro App in einem bestimmten Framework. Jeder Lauf erzeugt ein Vite-Projekt mit `tuvix.js` und dem passenden `@tuvix.js/*`-Adapter in Version `^0.5.0`.

Greif zu etwas anderem, wenn du Tuvix.js in eine bestehende App einbaust. Installiere dann den Adapter mit deinem Paketmanager und folge stattdessen der [Anleitung](/de/guide/getting-started). Für ein lauffähiges Setup mit mehreren Apps zum Lesen oder Kopieren verwende `--example` (siehe [Beispiele](#examples)).

## Schnellstart

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

Die CLI schreibt sechs Dateien, führt `pnpm install` in `checkout/` aus und gibt die nächsten Schritte aus:

```text
checkout/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    └── main.tsx
```

`src/main.tsx` exportiert das Micro-App-Modul, das eine Shell lädt:

```tsx [src/main.tsx]
import { createReactMicroApp } from '@tuvix.js/react';
import { App } from './App';

export default createReactMicroApp({
  name: 'my-react-app',
  App,
});
```

Benenne `my-react-app` in den Namen um, den deine Shell registriert. Die CLI setzt deinen Projektnamen dort nicht ein.

## Optionen

```text
create-tuvix-app [project-name] [options]
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `project-name` | positional | Abfrage | Ordnername und Name in `package.json`. Das erste Argument, das nicht mit `-` beginnt, legt ihn fest; ein späteres ersetzt ihn. |
| `--template`, `-t` | `string` | Abfrage | Eines von `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app`. |
| `--typescript` | Flag | Abfrage (`Yes` vorausgewählt) | Erzeugt TypeScript-Dateien und eine `tsconfig.json`. |
| `--no-typescript` | Flag | Abfrage | Erzeugt JavaScript-Dateien. `angular-app` ignoriert es. |
| `--example`, `-e` | `string` | keiner | Lädt statt eines Templates einen Ordner aus `examples/` im GitHub-Repository herunter. Überspringt die Abfragen und den Installationsschritt. |
| `--help`, `-h` | Flag | `false` | Gibt die Verwendung aus und beendet sich. |
| `--version`, `-v` | Flag | `false` | Gibt `create-tuvix-app v<version>` aus und beendet sich. Die CLI liest die Version aus ihrer eigenen `package.json`. |

Für jeden Wert, den du weglässt, fragt die CLI interaktiv nach, in dieser Reihenfolge: Projektname (`my-app` als Platzhalter, leere Eingabe wird abgelehnt), Template, dann TypeScript. Übergib alle drei, um ohne Abfragen zu laufen:

```bash
npx create-tuvix-app admin --template angular-app --typescript
```

Flags, die sie nicht kennt, ignoriert die CLI.

## Templates

Jedes Template schreibt `index.html`, `package.json` und `src/main.<ext>`. Die erzeugte `package.json` ist `private`, hat `"type": "module"`, Version `0.1.0` und drei Skripte: `dev` (`vite`), `build` (`vite build`) und `preview` (`vite preview`). `svelte-app` fügt im TypeScript-Modus ein viertes hinzu: `check`. Jede `package.json` listet `tuvix.js@^0.5.0` und `vite@^6.0.0`, im TypeScript-Modus zusätzlich `typescript@^5.7.0`.

| Template | Dateien neben `index.html` und `package.json` | Zusätzliche Abhängigkeiten |
| --- | --- | --- |
| `shell` | `src/main.ts` | keine |
| `react-app` | `src/main.tsx`, `src/App.tsx`, `vite.config.ts` | `react`, `react-dom` `^19.0.0`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3.0`; `@types/react`, `@types/react-dom` im TS-Modus |
| `vue-app` | `src/main.ts`, `src/App.vue`, `vite.config.ts`; `src/vite-env.d.ts` im TS-Modus | `vue@^3.5.0`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2.0` |
| `svelte-app` | `src/main.ts`, `src/App.svelte`, `vite.config.ts`, `svelte.config.js`; `src/vite-env.d.ts` im TS-Modus | `svelte@^5.0.0`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5.0.0`; `svelte-check@^4.0.0` im TS-Modus |
| `angular-app` | `src/main.ts`, `src/app/app.component.ts`, `vite.config.ts` | `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/platform-browser` `^20.0.0`, `rxjs@^7.8.0`, `tslib@^2.6.0`, `@tuvix.js/angular`, `typescript@~5.8.0` |
| `vanilla-app` | `src/main.ts` | keine |

Der TypeScript-Modus fügt `tsconfig.json` hinzu (`ES2020`, `ESNext`-Module, `bundler`-Auflösung, `strict`). Für `react-app`, `vue-app` und `svelte-app` bezieht sie `vite.config.ts` neben `src` mit ein. Der JavaScript-Modus verwendet `.js` und `.jsx` und schreibt keine `tsconfig.json`; `vite.config.ts` bleibt TypeScript, was Vite in beiden Fällen lädt. Alle `@tuvix.js/*`-Pakete bekommen `^0.5.0`.

### `shell`

Ein Orchestrator mit History-Router. `index.html` enthält ein `#header`, ein `<nav>` mit Links auf `/dashboard` und `/settings` und ein `<main id="main">`. `src/main.ts`:

```ts [src/main.ts]
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
  onError(error, appName) {
    console.error(`App "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

orchestrator.start();
```

Ersetze die `entry`-URL durch den gebauten Entry deiner Dashboard-App und registriere `settings` selbst. Das Template registriert nur `dashboard`.

### `react-app`

`createReactMicroApp({ name: 'my-react-app', App })` aus `@tuvix.js/react`. `App` rendert eine Überschrift und die erhaltenen Props als JSON. `vite.config.ts` fügt `@vitejs/plugin-react` hinzu, das JSX mit der automatischen Runtime kompiliert. `App.jsx` braucht im JavaScript-Modus daher keinen Import von `React`. Die TS-`tsconfig.json` setzt `"jsx": "react-jsx"`.

### `vue-app`

`createVueMicroApp({ name: 'my-vue-app', App })` aus `@tuvix.js/vue`, und `vite.config.ts` fügt `@vitejs/plugin-vue` hinzu. `App.vue` ist eine Komponente mit `<script setup>`, die die Props der Shell mit `inject` liest:

```vue [src/App.vue]
<template>
  <div style="padding: 24px; font-family: system-ui">
    <h1>Vue Micro App</h1>
    <p>This is a Tuvix.js micro frontend.</p>
    <pre>{{ JSON.stringify(props, null, 2) }}</pre>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

// The props the shell passes to mount() and update(), kept reactive.
const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
</script>
```

Im TS-Modus referenziert `src/vite-env.d.ts` `vite/client` und deklariert `*.vue`-Module, damit `tsc` den Import von `App` akzeptiert.

### `svelte-app`

Eine Micro App mit Svelte 5. `src/main.ts` übergibt `SvelteMap` aus `svelte/reactivity`, damit `update({ props })` an Ort und Stelle neu rendert, statt neu zu mounten:

```ts [src/main.ts]
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({
  name: 'my-svelte-app',
  App,
  SvelteMap,
});
```

`App.svelte` liest seine Prop `name` mit `$props()`. `vite.config.ts` fügt das Svelte-Plugin hinzu, und `svelte.config.js` setzt `preprocess: vitePreprocess()`, damit `<script lang="ts">` kompiliert. Im TS-Modus referenziert `src/vite-env.d.ts` die Typen von `svelte` und `vite/client`, und `package.json` bekommt ein Skript `check` (`svelte-check --tsconfig ./tsconfig.json`).

### `angular-app`

Angular 20 ohne zone.js. Das Template verwendet immer TypeScript, auch mit `--no-typescript`, und gibt `Angular requires TypeScript. Switching to TypeScript automatically.` aus, wenn du in der Abfrage JavaScript gewählt hast.

```ts [src/main.ts]
// Load the JIT compiler before any Angular package that ships partially
// compiled code (@angular/common, forms, router) is evaluated.
import '@angular/compiler';
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app/app.component';

export default createSsrAngularMicroApp({
  name: 'my-angular-app',
  component: AppComponent,
});
```

`AppComponent` ist eine Standalone-Komponente mit Inline-Template. `createSsrAngularMicroApp` rendert sie frisch in einen leeren Container und rendert über das Markup, wenn der Container HTML aus `renderAngularToString` enthält. Der Adapter läuft zoneless. Vite kompiliert Angular nicht per AOT, daher kompilieren die Komponenten im Browser: Lass `import '@angular/compiler'` als erste Zeile von `src/main.ts` stehen und behalte den Compiler als Laufzeitabhängigkeit. `tsconfig.json` zielt auf `ES2022` mit aktiviertem `experimentalDecorators` und deaktiviertem `useDefineForClassFields`, und `vite.config.ts` setzt das esbuild-Ziel auf `es2022`.

### `vanilla-app`

`defineMicroApp` aus `tuvix.js` mit einem `mount`, das eine Überschrift in `container.innerHTML` schreibt, und einem `unmount`, das sie wieder leert.

## Beispiele {#examples}

`--example <name>` lädt `https://codeload.github.com/yasinatesim/tuvix.js/tar.gz/master` herunter und entpackt `examples/<name>/` in deinen Projektordner. Abfragen, `--template`, `--typescript` und der Installationsschritt entfallen. Die CLI gibt `<pm> install` und `<pm> run dev` als nächste Schritte aus.

```bash
npx create-tuvix-app my-app --example with-multiple-frameworks
```

Ohne Projektnamen heißt der Ordner `my-app`. Der Name darf nur Buchstaben, Ziffern und Bindestriche enthalten. Diese Ordner gibt es in `examples/`:

| Beispiel | Zeigt |
| --- | --- |
| `with-react` | React-Micro-Apps in einer Shell |
| `with-vue` | Vue-Micro-Apps in einer Shell |
| `with-svelte` | Svelte-Micro-Apps in einer Shell |
| `with-angular` | Angular-Micro-Apps in einer Shell |
| `with-vanilla` | Micro Apps ohne Framework |
| `with-multiple-frameworks` | React- und Vue-Micro-Apps auf einer Seite |
| `with-react-router` | `@tuvix.js/router` mit React-Apps |
| `with-react-event-bus` | Apps, die über `@tuvix.js/event-bus` kommunizieren |
| `with-react-sandbox` | CSS-Isolation mit `@tuvix.js/sandbox` |
| `with-react-devtools` | Das Overlay von [`@tuvix.js/devtools`](/de/packages/devtools) |
| `with-module-federation-react` | `@tuvix.js/module-federation` mit React-Remotes |
| `with-ssr-react` | `@tuvix.js/server`, das React-Fragmente zusammensetzt |
| `with-ssr-vanilla` | `@tuvix.js/server`, das reine HTML-Fragmente zusammensetzt |
| `with-ssr-islands` | Serverseitig gerenderte Islands in mehreren Frameworks mit [`@tuvix.js/vite`](/de/packages/vite) |

Die Beispiele liegen im Monorepo, daher hängen ihre `package.json`-Dateien von `workspace:*` ab. Ersetze jedes `workspace:*` und `workspace:^` durch `^0.5.0`, bevor du den Installationsbefehl ausführst, sonst bricht der Paketmanager mit einem Fehler wegen eines nicht unterstützten Protokolls ab.

## Erkennung des Paketmanagers

Die CLI wählt den Paketmanager für den Installationsschritt und die ausgegebenen Befehle danach aus, wie du sie gestartet hast. Sie prüft der Reihe nach:

1. `process.versions.bun` ist gesetzt: `bun`.
2. `npm_execpath` enthält `pnpm` oder `yarn`: dieser Manager.
3. `npm_config_user_agent` beginnt mit `pnpm`, `yarn` oder `bun/`: dieser Manager.
4. Sonst: `npm`.

`pnpm create tuvix-app` und `pnpm dlx create-tuvix-app` installieren mit pnpm, `yarn create` mit yarn, `npx` und `npm create` mit npm. Kein Flag überschreibt diese Wahl.

## Installationsschritt

Nach einem Template-Lauf führt die CLI `<pm> install` im neuen Ordner hinter einem Spinner aus (`Installing dependencies with <pm>`). Die Ausgabe des Paketmanagers blendet sie aus.

- Exit-Code 0: Der Spinner endet mit `Dependencies installed`, und die CLI gibt `cd <name>` und `<pm> run dev` aus.
- Exit-Code ungleich 0 oder fehlendes Binary: Der Spinner endet mit `Install failed. Run manually:`, gefolgt von `cd <absolute path>` und `<pm> install`. Die Projektdateien bleiben erhalten, und die CLI beendet sich trotzdem mit Code 0.

Läufe mit `--example` installieren nie.

## Sonderfälle

- Ein vorhandener Ordner beendet den Lauf mit `Directory "<name>" already exists.` und Exit-Code 1. Die CLI schreibt nie in einen vorhandenen Ordner und führt nichts mit ihm zusammen.
- Ein Name, dessen aufgelöster Pfad nicht mit dem aktuellen Verzeichnis beginnt, etwa `../app`, bricht mit `Project directory must be within the current working directory.` ab.
- Ein unbekannter Wert für `--template` schlägt nach den Abfragen mit `Unknown template "<value>". Available: shell, react-app, vue-app, vanilla-app, svelte-app, angular-app` fehl.
- `--template` oder `--example` als letztes Argument ohne Wert zählt als nicht angegeben: Du bekommst die Template-Abfrage oder einen normalen Template-Lauf.
- Die CLI verwendet den Projektnamen so, wie er geschrieben ist, für den Ordner und für `name` in `package.json`. Sie prüft die npm-Namensregeln nicht, daher ergibt `My App` einen ungültigen Paketnamen.
- Bricht du eine Abfrage ab (Ctrl+C), gibt die CLI `Operation cancelled.` aus und beendet sich mit Code 0.
- Ein Beispielname, der auf `master` nicht existiert, hinterlässt einen leeren Ordner und schlägt mit `Example "<name>" was not found or failed to extract.` fehl. Lösche den Ordner, bevor du es erneut versuchst.
- Die CLI lädt für ein einzelnes Beispiel das Tarball des ganzen Repositorys herunter. Bei einer langsamen Verbindung ist `--example` langsam.

## Was es nicht tut

- Die Micro-App-Templates mounten sich nicht selbst. `src/main` exportiert das Modul, und nichts in `index.html` ruft `mount` auf. `pnpm run dev` zeigt daher ein leeres `#app`, bis eine Shell den Entry lädt.
- Keine Vite-Konfiguration im Library-Modus. `vite build` erzeugt einen normalen App-Build mit gehashten Dateinamen, und du wählst den Entry, den deine Shell lädt.
- Kein Monorepo-, Workspace- oder Multi-App-Setup. Führe die CLI einmal pro App aus oder starte mit einem `--example`.
- Kein git init, kein Linter, kein Test-Runner, kein CSS-Setup.
- Kein Flag `--no-install` und kein Flag für den Paketmanager.
- Keine programmatische API. Ein Import des Pakets führt die CLI aus.

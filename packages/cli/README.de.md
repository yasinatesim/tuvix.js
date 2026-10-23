# create-tuvix-app

> Erzeugt ein Vite-Projekt für eine Tuvix.js-Shell oder eine React-, Vue-, Svelte-, Angular- oder Vanilla-Micro-App

Teil des Microfrontend-Frameworks [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Verwendung

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app

# npm create forwards flags only after --
npm create tuvix-app@latest my-app -- --template react-app --typescript
```

Die CLI fragt jeden Wert ab, den du weglässt (Projektname, Template, TypeScript), schreibt die Dateien nach `./<project-name>` und installiert danach die Abhängigkeiten.

## Schnellstart

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

## Optionen

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `project-name` | positional | Abfrage | Name des Ordners und in `package.json` |
| `--template`, `-t` | `string` | Abfrage | `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app` oder `vanilla-app` |
| `--typescript` / `--no-typescript` | Flag | Abfrage (`Yes` vorausgewählt) | TypeScript-Dateien plus `tsconfig.json`, oder JavaScript. `angular-app` ist immer TypeScript. |
| `--example`, `-e` | `string` | keiner | Lädt `examples/<name>` aus dem GitHub-Repo (`master`) herunter. Überspringt Abfragen und Installation. |
| `--help`, `-h` | Flag | `false` | Gibt die Verwendung aus |
| `--version`, `-v` | Flag | `false` | Gibt `create-tuvix-app v<version>` aus, gelesen aus der `package.json` der CLI |

## Templates

Jedes Projekt erhält `index.html`, `src/main.<ext>` und eine `package.json` mit den Vite-Skripten `dev`/`build`/`preview`, `tuvix.js@^0.5.0` und `vite@^6.0.0` (im TS-Modus zusätzlich `typescript@^5.7.0`).

| Template | Erzeugt | Zusätzliche Abhängigkeiten |
| --- | --- | --- |
| `shell` | `createOrchestrator` mit einem History-Router (`/dashboard/*`, `/settings/*`) und einer registrierten `dashboard`-App, die auf eine Platzhalter-CDN-URL zeigt | keine |
| `react-app` | `createReactMicroApp({ name, App })`, `App.tsx` und eine `vite.config.ts` mit `@vitejs/plugin-react` | `react`, `react-dom` `^19`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3` |
| `vue-app` | `createVueMicroApp({ name, App })`, eine `App.vue`, die Props mit `inject(TUVIX_PROPS_KEY)` liest, eine `vite.config.ts` mit `@vitejs/plugin-vue` und im TS-Modus eine `src/vite-env.d.ts`, die `*.vue`-Module deklariert | `vue@^3.5`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2` |
| `svelte-app` | `createSvelteMicroApp({ name, App, SvelteMap })` mit `SvelteMap` aus `svelte/reactivity`, sodass `update()` an Ort und Stelle neu rendert. Eine Svelte-5-`App.svelte`, die `$props()` liest, `vite.config.ts`, `svelte.config.js` mit `vitePreprocess()` und im TS-Modus `src/vite-env.d.ts` plus ein `check`-Skript | `svelte@^5`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5`, `svelte-check@^4` (TS-Modus) |
| `angular-app` | `createSsrAngularMicroApp({ name, component })` mit einer Standalone-`AppComponent`, zoneless Angular 20. `src/main.ts` importiert zuerst `@angular/compiler`, damit JIT-Komponenten kompilieren. | `@angular/{common,compiler,core,platform-browser}@^20`, `rxjs`, `tslib`, `@tuvix.js/angular` |
| `vanilla-app` | `defineMicroApp` mit `mount`/`unmount`, die `innerHTML` schreiben | keine |

## Paketmanager und Installation

Die CLI wählt `bun`, wenn sie unter Bun läuft, prüft dann `npm_execpath` auf `pnpm`/`yarn`, danach `npm_config_user_agent` auf `pnpm`/`yarn`/`bun/`, und fällt auf `npm` zurück. Nach einem Template-Lauf führt sie `<pm> install` mit verborgener Ausgabe aus. Schlägt das fehl, gibt sie `Install failed. Run manually:` mit den Befehlen aus und beendet sich trotzdem mit 0.

## Sonderfälle

- Ein bereits vorhandener Zielordner führt zu `Directory "<name>" already exists.` (Exit-Code 1).
- Namen, die außerhalb des aktuellen Verzeichnisses auflösen, wie `../app`, schlagen fehl.
- Ein unbekanntes `--template` schlägt mit der Liste der verfügbaren Templates fehl.
- Der Projektname wird so verwendet, wie du ihn schreibst; die npm-Namensregeln werden nicht geprüft.
- Beispiele hängen von `workspace:*` ab. Ersetze diese vor der Installation durch `^0.5.0`.
- Ein fehlendes Beispiel hinterlässt einen leeren Ordner; lösche ihn vor einem erneuten Versuch.

## Was es nicht tut

- Micro-App-Templates exportieren ein Modul und mounten es nie. Deshalb zeigt `pnpm run dev` ein leeres `#app`, bis eine Shell es lädt.
- Keine Build-Konfiguration im Library-Modus, kein git init, kein Linter, keine Tests und kein Monorepo-Setup.
- Kein `--no-install` und kein Flag für den Paketmanager, und keine programmatische API.

Vollständige Dokumentation: [tuvix.js.org/de/packages/create-tuvix-app](https://tuvix.js.org/de/packages/create-tuvix-app)

## Lizenz

MIT

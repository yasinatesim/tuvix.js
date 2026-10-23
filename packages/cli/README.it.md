# create-tuvix-app

> Crea un progetto Vite per una shell Tuvix.js o per una micro app React, Vue, Svelte, Angular o vanilla

Fa parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Utilizzo

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app

# npm create forwards flags only after --
npm create tuvix-app@latest my-app -- --template react-app --typescript
```

La CLI chiede ogni valore che ometti (nome del progetto, template, TypeScript), scrive i file in `./<project-name>`, poi installa le dipendenze.

## Avvio rapido

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

## Opzioni

| Opzione | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `project-name` | posizionale | richiesta | Nome della cartella e del `package.json` |
| `--template`, `-t` | `string` | richiesta | `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app` o `vanilla-app` |
| `--typescript` / `--no-typescript` | flag | richiesta (`Yes` preselezionato) | File TypeScript più `tsconfig.json`, oppure JavaScript. `angular-app` è sempre TypeScript. |
| `--example`, `-e` | `string` | nessuno | Scarica `examples/<name>` dal repository GitHub (`master`). Salta le richieste e l'installazione. |
| `--help`, `-h` | flag | `false` | Stampa l'utilizzo |
| `--version`, `-v` | flag | `false` | Stampa `create-tuvix-app v<version>`, letto dal `package.json` della CLI |

## Template

Ogni progetto riceve `index.html`, `src/main.<ext>` e un `package.json` con gli script Vite `dev`/`build`/`preview`, `tuvix.js@^0.5.0` e `vite@^6.0.0` (più `typescript@^5.7.0` in modalità TS).

| Template | Genera | Dipendenze aggiuntive |
| --- | --- | --- |
| `shell` | `createOrchestrator` con un router history (`/dashboard/*`, `/settings/*`) e un'app `dashboard` registrata che punta a un URL CDN segnaposto | nessuna |
| `react-app` | `createReactMicroApp({ name, App })`, `App.tsx` e un `vite.config.ts` con `@vitejs/plugin-react` | `react`, `react-dom` `^19`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3` |
| `vue-app` | `createVueMicroApp({ name, App })`, `App.vue` che legge le props con `inject(TUVIX_PROPS_KEY)`, `vite.config.ts` con `@vitejs/plugin-vue` e, in modalità TS, `src/vite-env.d.ts` che dichiara i moduli `*.vue` | `vue@^3.5`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2` |
| `svelte-app` | `createSvelteMicroApp({ name, App, SvelteMap })` con `SvelteMap` da `svelte/reactivity`, così `update()` riesegue il render sul posto. `App.svelte` in Svelte 5 che legge `$props()`, `vite.config.ts`, `svelte.config.js` con `vitePreprocess()` e, in modalità TS, `src/vite-env.d.ts` più uno script `check` | `svelte@^5`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5`, `svelte-check@^4` (modalità TS) |
| `angular-app` | `createSsrAngularMicroApp({ name, component })` con un `AppComponent` standalone, Angular 20 zoneless. `src/main.ts` importa prima `@angular/compiler`, così i componenti JIT vengono compilati. | `@angular/{common,compiler,core,platform-browser}@^20`, `rxjs`, `tslib`, `@tuvix.js/angular` |
| `vanilla-app` | `defineMicroApp` con `mount`/`unmount` che scrivono `innerHTML` | nessuna |

## Package manager e installazione

La CLI sceglie `bun` quando gira su Bun, poi controlla `npm_execpath` per `pnpm`/`yarn`, poi `npm_config_user_agent` per `pnpm`/`yarn`/`bun/`, e in mancanza usa `npm`. Dopo l'esecuzione di un template lancia `<pm> install` con l'output nascosto. Se fallisce, stampa `Install failed. Run manually:` con i comandi ed esce comunque con codice 0.

## Casi limite

- Una cartella di destinazione già esistente fallisce con `Directory "<name>" already exists.` (exit 1).
- I nomi che risolvono fuori dalla directory corrente, come `../app`, falliscono.
- Un `--template` sconosciuto fallisce con l'elenco dei template disponibili.
- Il nome del progetto viene usato così com'è scritto; le regole di naming di npm non vengono verificate.
- Gli esempi dipendono da `workspace:*`. Sostituiscili con `^0.5.0` prima dell'installazione.
- Un esempio mancante lascia una cartella vuota; eliminala prima di riprovare.

## Cosa non fa

- I template delle micro app esportano un modulo e non lo montano mai, quindi `pnpm run dev` mostra un `#app` vuoto finché una shell non lo carica.
- Nessuna configurazione di build in modalità libreria, git init, linter, test o setup monorepo.
- Nessun `--no-install` o flag per il package manager, e nessuna API programmatica.

Documentazione completa: [tuvix.js.org/it/packages/create-tuvix-app](https://tuvix.js.org/it/packages/create-tuvix-app)

## Licenza

MIT

---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="CLI che genera un progetto Vite per una shell Tuvix.js o per una micro app React, Vue, Svelte, Angular o vanilla, poi ne installa le dipendenze."
  icon="🚀"
  npm="true"
  github="cli"
/>

## Utilizzo

Il nome del pacchetto inizia con `create-`, quindi il comando `create` di ogni package manager lo trova, e `npx` esegue il suo binario `create-tuvix-app`:

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app
```

`npm create` inoltra i flag solo dopo `--`. Gli altri comandi li passano direttamente:

```bash
npm create tuvix-app@latest my-app -- --template react-app --typescript
pnpm create tuvix-app my-app --template react-app --typescript
```

Il binario richiede Node.js. Scrive in una nuova cartella dentro la directory corrente.

## Quando usarlo

Usalo per iniziare da zero un singolo pezzo di Tuvix.js: una shell che registra micro app, oppure una micro app in un framework specifico. Ogni esecuzione crea un progetto Vite con `tuvix.js` e l'adapter `@tuvix.js/*` corrispondente alla versione `^0.5.0`.

Scegli altro quando aggiungi Tuvix.js a un'app che esiste già. In quel caso installa l'adapter con il tuo package manager e segui la [guida](/it/guide/getting-started). Per un setup multi-app funzionante da leggere o copiare, usa `--example` (vedi [Esempi](#examples)).

## Avvio rapido

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

La CLI scrive sei file, esegue `pnpm install` in `checkout/` e stampa i passi successivi:

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

`src/main.tsx` esporta il modulo della micro app che una shell carica:

```tsx [src/main.tsx]
import { createReactMicroApp } from '@tuvix.js/react';
import { App } from './App';

export default createReactMicroApp({
  name: 'my-react-app',
  App,
});
```

Rinomina `my-react-app` con il nome che registra la tua shell. La CLI non inserisce lì il nome del tuo progetto.

## Opzioni

```text
create-tuvix-app [project-name] [options]
```

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `project-name` | posizionale | prompt | Nome della cartella e `name` in `package.json`. Lo imposta il primo argomento che non inizia con `-`; uno successivo lo sostituisce. |
| `--template`, `-t` | `string` | prompt | Uno tra `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app`. |
| `--typescript` | flag | prompt (`Yes` preselezionato) | Genera file TypeScript e un `tsconfig.json`. |
| `--no-typescript` | flag | prompt | Genera file JavaScript. `angular-app` lo ignora. |
| `--example`, `-e` | `string` | nessuno | Scarica una cartella da `examples/` nel repository GitHub invece di un template. Salta i prompt e il passo di installazione. |
| `--help`, `-h` | flag | `false` | Stampa l'utilizzo ed esce. |
| `--version`, `-v` | flag | `false` | Stampa `create-tuvix-app v<version>` ed esce. La CLI legge la versione dal proprio `package.json`. |

Per ogni valore che ometti, la CLI lo chiede con un prompt interattivo, in questo ordine: nome del progetto (`my-app` come placeholder, input vuoto rifiutato), template, poi TypeScript. Passali tutti e tre per eseguirla senza prompt:

```bash
npx create-tuvix-app admin --template angular-app --typescript
```

La CLI ignora i flag che non conosce.

## Template

Ogni template scrive `index.html`, `package.json` e `src/main.<ext>`. Il `package.json` generato è `private`, ha `"type": "module"`, la versione `0.1.0` e tre script: `dev` (`vite`), `build` (`vite build`) e `preview` (`vite preview`). In modalità TypeScript `svelte-app` aggiunge un quarto script, `check`. Ogni `package.json` elenca `tuvix.js@^0.5.0` e `vite@^6.0.0`, più `typescript@^5.7.0` in modalità TypeScript.

| Template | File oltre a `index.html` e `package.json` | Dipendenze aggiuntive |
| --- | --- | --- |
| `shell` | `src/main.ts` | nessuna |
| `react-app` | `src/main.tsx`, `src/App.tsx`, `vite.config.ts` | `react`, `react-dom` `^19.0.0`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3.0`; `@types/react`, `@types/react-dom` in modalità TS |
| `vue-app` | `src/main.ts`, `src/App.vue`, `vite.config.ts`; `src/vite-env.d.ts` in modalità TS | `vue@^3.5.0`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2.0` |
| `svelte-app` | `src/main.ts`, `src/App.svelte`, `vite.config.ts`, `svelte.config.js`; `src/vite-env.d.ts` in modalità TS | `svelte@^5.0.0`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5.0.0`; `svelte-check@^4.0.0` in modalità TS |
| `angular-app` | `src/main.ts`, `src/app/app.component.ts`, `vite.config.ts` | `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/platform-browser` `^20.0.0`, `rxjs@^7.8.0`, `tslib@^2.6.0`, `@tuvix.js/angular`, `typescript@~5.8.0` |
| `vanilla-app` | `src/main.ts` | nessuna |

La modalità TypeScript aggiunge `tsconfig.json` (`ES2020`, moduli `ESNext`, risoluzione `bundler`, `strict`). Per `react-app`, `vue-app` e `svelte-app` include `vite.config.ts` accanto a `src`. La modalità JavaScript usa `.js` e `.jsx` e non scrive alcun `tsconfig.json`; `vite.config.ts` resta in TypeScript, che Vite carica in entrambi i casi. Tutti i pacchetti `@tuvix.js/*` ricevono `^0.5.0`.

### `shell`

Un orchestratore con un router in modalità history. `index.html` contiene un `#header`, un `<nav>` con link a `/dashboard` e `/settings` e un `<main id="main">`. `src/main.ts`:

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

Sostituisci l'URL di `entry` con l'entry compilata della tua app dashboard e registra tu `settings`. Il template registra solo `dashboard`.

### `react-app`

`createReactMicroApp({ name: 'my-react-app', App })` di `@tuvix.js/react`. `App` renderizza un titolo e le props che riceve in formato JSON. `vite.config.ts` aggiunge `@vitejs/plugin-react`, che compila JSX con il runtime automatico, quindi in modalità JavaScript `App.jsx` non ha bisogno di importare `React`. Il `tsconfig.json` TS imposta `"jsx": "react-jsx"`.

### `vue-app`

`createVueMicroApp({ name: 'my-vue-app', App })` di `@tuvix.js/vue`, e `vite.config.ts` aggiunge `@vitejs/plugin-vue`. `App.vue` è un componente `<script setup>` che legge le props della shell con `inject`:

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

In modalità TS `src/vite-env.d.ts` fa riferimento a `vite/client` e dichiara i moduli `*.vue`, così `tsc` accetta l'import di `App`.

### `svelte-app`

Una micro app Svelte 5. `src/main.ts` passa `SvelteMap` da `svelte/reactivity`, così `update({ props })` esegue di nuovo il rendering sul posto invece di rimontare:

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

`App.svelte` legge la prop `name` con `$props()`. `vite.config.ts` aggiunge il plugin Svelte, e `svelte.config.js` imposta `preprocess: vitePreprocess()` perché `<script lang="ts">` venga compilato. In modalità TS `src/vite-env.d.ts` fa riferimento ai tipi `svelte` e `vite/client`, e `package.json` riceve uno script `check` (`svelte-check --tsconfig ./tsconfig.json`).

### `angular-app`

Angular 20 senza zone.js. Il template usa sempre TypeScript, anche con `--no-typescript`, e stampa `Angular requires TypeScript. Switching to TypeScript automatically.` quando hai scelto JavaScript nel prompt.

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

`AppComponent` è un componente standalone con un template inline. `createSsrAngularMicroApp` lo renderizza da zero in un container vuoto, e lo renderizza sopra il markup quando il container contiene HTML prodotto da `renderAngularToString`. L'adapter gira senza zone. Vite non esegue la compilazione AOT di Angular, quindi i componenti vengono compilati nel browser: mantieni `import '@angular/compiler'` come prima riga di `src/main.ts` e mantieni il compiler come dipendenza di runtime. `tsconfig.json` ha come target `ES2022` con `experimentalDecorators` attivo e `useDefineForClassFields` disattivo, e `vite.config.ts` imposta il target di esbuild su `es2022`.

### `vanilla-app`

`defineMicroApp` di `tuvix.js` con un `mount` che scrive un titolo in `container.innerHTML` e un `unmount` che lo svuota.

## Esempi {#examples}

`--example <name>` scarica `https://codeload.github.com/yasinatesim/tuvix.js/tar.gz/master` ed estrae `examples/<name>/` nella cartella del tuo progetto. Prompt, `--template`, `--typescript` e il passo di installazione vengono saltati. La CLI stampa `<pm> install` e `<pm> run dev` come passi successivi.

```bash
npx create-tuvix-app my-app --example with-multiple-frameworks
```

Senza un nome di progetto la cartella è `my-app`. Il nome deve contenere solo lettere, cifre e trattini. In `examples/` esistono queste cartelle:

| Esempio | Mostra |
| --- | --- |
| `with-react` | Micro app React in una shell |
| `with-vue` | Micro app Vue in una shell |
| `with-svelte` | Micro app Svelte in una shell |
| `with-angular` | Micro app Angular in una shell |
| `with-vanilla` | Micro app senza framework |
| `with-multiple-frameworks` | Micro app React e Vue sulla stessa pagina |
| `with-react-router` | `@tuvix.js/router` con app React |
| `with-react-event-bus` | App che comunicano tramite `@tuvix.js/event-bus` |
| `with-react-sandbox` | Isolamento CSS con `@tuvix.js/sandbox` |
| `with-react-devtools` | L'overlay di [`@tuvix.js/devtools`](/it/packages/devtools) |
| `with-module-federation-react` | `@tuvix.js/module-federation` con remote React |
| `with-ssr-react` | `@tuvix.js/server` che compone frammenti React |
| `with-ssr-vanilla` | `@tuvix.js/server` che compone frammenti HTML semplici |
| `with-ssr-islands` | Island renderizzate sul server in più framework con [`@tuvix.js/vite`](/it/packages/vite) |

Gli esempi si trovano dentro il monorepo, quindi i loro file `package.json` dipendono da `workspace:*`. Sostituisci ogni `workspace:*` e `workspace:^` con `^0.5.0` prima di eseguire il comando di installazione, altrimenti il package manager si ferma con un errore di protocollo non supportato.

## Rilevamento del package manager

La CLI sceglie il package manager per il passo di installazione e per i comandi stampati in base a come l'hai avviata. Controlla, in ordine:

1. `process.versions.bun` è impostato: `bun`.
2. `npm_execpath` contiene `pnpm` o `yarn`: quel manager.
3. `npm_config_user_agent` inizia con `pnpm`, `yarn` o `bun/`: quel manager.
4. Altrimenti: `npm`.

`pnpm create tuvix-app` e `pnpm dlx create-tuvix-app` installano con pnpm, `yarn create` con yarn, `npx` e `npm create` con npm. Nessun flag modifica questa scelta.

## Passo di installazione

Dopo l'esecuzione di un template, la CLI esegue `<pm> install` nella nuova cartella dietro uno spinner (`Installing dependencies with <pm>`). Nasconde l'output del package manager.

- Exit code 0: lo spinner termina con `Dependencies installed` e la CLI stampa `cd <name>` e `<pm> run dev`.
- Exit code diverso da zero, o binario mancante: lo spinner termina con `Install failed. Run manually:` seguito da `cd <absolute path>` e `<pm> install`. I file del progetto restano, e la CLI esce comunque con codice 0.

Le esecuzioni con `--example` non installano mai.

## Casi limite

- Una cartella esistente interrompe l'esecuzione con `Directory "<name>" already exists.` ed exit code 1. La CLI non scrive mai in una cartella esistente né la unisce.
- Un nome il cui percorso risolto non inizia con la directory corrente, come `../app`, si ferma con `Project directory must be within the current working directory.`
- Un valore di `--template` sconosciuto fallisce dopo i prompt con `Unknown template "<value>". Available: shell, react-app, vue-app, vanilla-app, svelte-app, angular-app`.
- `--template` o `--example` come ultimo argomento, senza valore, contano come non forniti: ottieni il prompt del template, o una normale esecuzione con template.
- La CLI usa il nome del progetto così come è scritto sia per la cartella sia per il `name` in `package.json`. Non controlla le regole di naming di npm, quindi `My App` produce un nome di pacchetto non valido.
- Annullare un prompt (Ctrl+C) stampa `Operation cancelled.` ed esce con codice 0.
- Un nome di esempio che non esiste su `master` lascia una cartella vuota e fallisce con `Example "<name>" was not found or failed to extract.` Elimina la cartella prima di riprovare.
- La CLI scarica il tarball dell'intero repository per un singolo esempio. Con una connessione lenta, `--example` è lento.

## Cosa non fa

- I template delle micro app non si montano da soli. `src/main` esporta il modulo e niente in `index.html` chiama `mount`, quindi `pnpm run dev` mostra un `#app` vuoto finché una shell non carica l'entry.
- Nessuna configurazione Vite in library mode. `vite build` produce una normale build di app con nomi di file con hash, e scegli tu l'entry che la shell carica.
- Nessun setup per monorepo, workspace o più app. Esegui la CLI una volta per ogni app, oppure parti da un `--example`.
- Nessun git init, nessun linter, nessun test runner, nessuna configurazione CSS.
- Nessun flag `--no-install` e nessun flag per il package manager.
- Nessuna API programmatica. Importare il pacchetto esegue la CLI.

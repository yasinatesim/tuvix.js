---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="CLI qui génère un projet Vite pour un shell Tuvix.js ou une micro app React, Vue, Svelte, Angular ou vanilla, puis installe ses dépendances."
  icon="🚀"
  npm="true"
  github="cli"
/>

## Utilisation {#usage}

Le nom du paquet commence par `create-`, donc la commande `create` de chaque gestionnaire de paquets le trouve, et `npx` exécute son binaire `create-tuvix-app` :

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app
```

`npm create` ne transmet les flags qu'après `--`. Les autres commandes les transmettent directement :

```bash
npm create tuvix-app@latest my-app -- --template react-app --typescript
pnpm create tuvix-app my-app --template react-app --typescript
```

Le binaire a besoin de Node.js. Il écrit dans un nouveau dossier sous le répertoire courant.

## Quand l'utiliser {#when-to-use-it}

Utilisez-le pour démarrer une pièce Tuvix.js à partir de zéro : un shell qui enregistre des micro apps, ou une micro app dans un framework donné. Chaque exécution crée un projet Vite avec `tuvix.js` et l'adaptateur `@tuvix.js/*` correspondant en `^0.5.0`.

Choisissez autre chose quand vous ajoutez Tuvix.js à une app qui existe déjà. Installez l'adaptateur avec votre gestionnaire de paquets et suivez plutôt le [guide](/fr/guide/getting-started). Pour une configuration multi-apps fonctionnelle à lire ou à copier, utilisez `--example` (voir [Exemples](#examples)).

## Démarrage rapide {#quick-start}

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

La CLI écrit six fichiers, lance `pnpm install` dans `checkout/` et affiche les étapes suivantes :

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

`src/main.tsx` exporte le module de micro app qu'un shell charge :

```tsx [src/main.tsx]
import { createReactMicroApp } from '@tuvix.js/react';
import { App } from './App';

export default createReactMicroApp({
  name: 'my-react-app',
  App,
});
```

Renommez `my-react-app` avec le nom que votre shell enregistre. La CLI n'y insère pas le nom de votre projet.

## Options {#options}

```text
create-tuvix-app [project-name] [options]
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `project-name` | positionnel | prompt | Nom du dossier et `name` du `package.json`. Le premier argument qui ne commence pas par `-` le définit ; un argument suivant le remplace. |
| `--template`, `-t` | `string` | prompt | Un parmi `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app`. |
| `--typescript` | flag | prompt (`Yes` présélectionné) | Génère des fichiers TypeScript et un `tsconfig.json`. |
| `--no-typescript` | flag | prompt | Génère des fichiers JavaScript. `angular-app` l'ignore. |
| `--example`, `-e` | `string` | aucun | Télécharge un dossier de `examples/` du dépôt GitHub au lieu d'un template. Saute les prompts et l'étape d'installation. |
| `--help`, `-h` | flag | `false` | Affiche l'aide et quitte. |
| `--version`, `-v` | flag | `false` | Affiche `create-tuvix-app v<version>` et quitte. La CLI lit la version dans son propre `package.json`. |

Pour chaque valeur que vous omettez, la CLI pose la question avec un prompt interactif, dans cet ordre : nom du projet (`my-app` comme placeholder, saisie vide refusée), template, puis TypeScript. Passez les trois pour exécuter sans prompt :

```bash
npx create-tuvix-app admin --template angular-app --typescript
```

La CLI ignore les flags qu'elle ne connaît pas.

## Templates {#templates}

Chaque template écrit `index.html`, `package.json` et `src/main.<ext>`. Le `package.json` généré est `private`, a `"type": "module"`, la version `0.1.0` et trois scripts : `dev` (`vite`), `build` (`vite build`) et `preview` (`vite preview`). `svelte-app` en mode TypeScript en ajoute un quatrième, `check`. Chaque `package.json` liste `tuvix.js@^0.5.0` et `vite@^6.0.0`, plus `typescript@^5.7.0` en mode TypeScript.

| Template | Fichiers en plus de `index.html` et `package.json` | Dépendances supplémentaires |
| --- | --- | --- |
| `shell` | `src/main.ts` | aucune |
| `react-app` | `src/main.tsx`, `src/App.tsx`, `vite.config.ts` | `react`, `react-dom` `^19.0.0`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3.0` ; `@types/react`, `@types/react-dom` en mode TS |
| `vue-app` | `src/main.ts`, `src/App.vue`, `vite.config.ts` ; `src/vite-env.d.ts` en mode TS | `vue@^3.5.0`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2.0` |
| `svelte-app` | `src/main.ts`, `src/App.svelte`, `vite.config.ts`, `svelte.config.js` ; `src/vite-env.d.ts` en mode TS | `svelte@^5.0.0`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5.0.0` ; `svelte-check@^4.0.0` en mode TS |
| `angular-app` | `src/main.ts`, `src/app/app.component.ts`, `vite.config.ts` | `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/platform-browser` `^20.0.0`, `rxjs@^7.8.0`, `tslib@^2.6.0`, `@tuvix.js/angular`, `typescript@~5.8.0` |
| `vanilla-app` | `src/main.ts` | aucune |

Le mode TypeScript ajoute `tsconfig.json` (`ES2020`, modules `ESNext`, résolution `bundler`, `strict`). Pour `react-app`, `vue-app` et `svelte-app`, il inclut `vite.config.ts` à côté de `src`. Le mode JavaScript utilise `.js` et `.jsx` et n'écrit pas de `tsconfig.json` ; `vite.config.ts` reste en TypeScript, que Vite charge dans les deux cas. Tous les paquets `@tuvix.js/*` reçoivent `^0.5.0`.

### `shell`

Un orchestrateur avec un routeur history. `index.html` contient un `#header`, un `<nav>` avec des liens vers `/dashboard` et `/settings`, et un `<main id="main">`. `src/main.ts` :

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

Remplacez l'URL `entry` par l'entrée compilée de votre app dashboard et enregistrez `settings` vous-même. Le template n'enregistre que `dashboard`.

### `react-app`

`createReactMicroApp({ name: 'my-react-app', App })` de `@tuvix.js/react`. `App` affiche un titre et les props qu'il reçoit en JSON. `vite.config.ts` ajoute `@vitejs/plugin-react`, qui compile le JSX avec le runtime automatique, donc `App.jsx` n'a pas besoin d'importer `React` en mode JavaScript. Le `tsconfig.json` TS définit `"jsx": "react-jsx"`.

### `vue-app`

`createVueMicroApp({ name: 'my-vue-app', App })` de `@tuvix.js/vue`, et `vite.config.ts` ajoute `@vitejs/plugin-vue`. `App.vue` est un composant `<script setup>` qui lit les props du shell avec `inject` :

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

En mode TS, `src/vite-env.d.ts` référence `vite/client` et déclare les modules `*.vue`, donc `tsc` accepte l'import de `App`.

### `svelte-app`

Une micro app Svelte 5. `src/main.ts` passe `SvelteMap` de `svelte/reactivity`, donc `update({ props })` refait le rendu sur place au lieu de remonter l'app :

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

`App.svelte` lit sa prop `name` avec `$props()`. `vite.config.ts` ajoute le plugin Svelte, et `svelte.config.js` définit `preprocess: vitePreprocess()` pour que `<script lang="ts">` compile. En mode TS, `src/vite-env.d.ts` référence les types `svelte` et `vite/client`, et `package.json` reçoit un script `check` (`svelte-check --tsconfig ./tsconfig.json`).

### `angular-app`

Angular 20 sans zone.js. Le template utilise toujours TypeScript, même avec `--no-typescript`, et affiche `Angular requires TypeScript. Switching to TypeScript automatically.` quand vous avez choisi JavaScript dans le prompt.

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

`AppComponent` est un composant standalone avec un template inline. `createSsrAngularMicroApp` le rend à neuf dans un conteneur vide, et le rend par-dessus le balisage quand le conteneur contient du HTML issu de `renderAngularToString`. L'adaptateur fonctionne sans zone. Vite ne compile pas Angular en AOT, donc les composants se compilent dans le navigateur : gardez `import '@angular/compiler'` comme première ligne de `src/main.ts`, et gardez le compilateur comme dépendance d'exécution. `tsconfig.json` cible `ES2022` avec `experimentalDecorators` activé et `useDefineForClassFields` désactivé, et `vite.config.ts` règle la cible esbuild sur `es2022`.

### `vanilla-app`

`defineMicroApp` de `tuvix.js` avec un `mount` qui écrit un titre dans `container.innerHTML` et un `unmount` qui le vide.

## Exemples {#examples}

`--example <name>` télécharge `https://codeload.github.com/yasinatesim/tuvix.js/tar.gz/master` et extrait `examples/<name>/` dans le dossier de votre projet. Les prompts, `--template`, `--typescript` et l'étape d'installation sont sautés. La CLI affiche `<pm> install` et `<pm> run dev` comme étapes suivantes.

```bash
npx create-tuvix-app my-app --example with-multiple-frameworks
```

Sans nom de projet, le dossier s'appelle `my-app`. Le nom ne doit contenir que des lettres, des chiffres et des tirets. Ces dossiers existent dans `examples/` :

| Exemple | Montre |
| --- | --- |
| `with-react` | Des micro apps React dans un shell |
| `with-vue` | Des micro apps Vue dans un shell |
| `with-svelte` | Des micro apps Svelte dans un shell |
| `with-angular` | Des micro apps Angular dans un shell |
| `with-vanilla` | Des micro apps sans framework |
| `with-multiple-frameworks` | Des micro apps React et Vue sur une même page |
| `with-react-router` | `@tuvix.js/router` avec des apps React |
| `with-react-event-bus` | Des apps qui communiquent via `@tuvix.js/event-bus` |
| `with-react-sandbox` | L'isolation CSS avec `@tuvix.js/sandbox` |
| `with-react-devtools` | L'overlay [`@tuvix.js/devtools`](/fr/packages/devtools) |
| `with-module-federation-react` | `@tuvix.js/module-federation` avec des remotes React |
| `with-ssr-react` | `@tuvix.js/server` qui compose des fragments React |
| `with-ssr-vanilla` | `@tuvix.js/server` qui compose des fragments HTML simples |
| `with-ssr-islands` | Des îlots rendus côté serveur dans plusieurs frameworks avec [`@tuvix.js/vite`](/fr/packages/vite) |

Les exemples vivent dans le monorepo, donc leurs fichiers `package.json` dépendent de `workspace:*`. Remplacez chaque `workspace:*` et `workspace:^` par `^0.5.0` avant de lancer la commande d'installation, sinon le gestionnaire de paquets s'arrête avec une erreur de protocole non pris en charge.

## Détection du gestionnaire de paquets {#package-manager-detection}

La CLI choisit le gestionnaire de paquets de l'étape d'installation et des commandes affichées selon la façon dont vous l'avez lancée. Elle vérifie, dans l'ordre :

1. `process.versions.bun` est défini : `bun`.
2. `npm_execpath` contient `pnpm` ou `yarn` : ce gestionnaire.
3. `npm_config_user_agent` commence par `pnpm`, `yarn` ou `bun/` : ce gestionnaire.
4. Sinon : `npm`.

`pnpm create tuvix-app` et `pnpm dlx create-tuvix-app` installent avec pnpm, `yarn create` avec yarn, `npx` et `npm create` avec npm. Aucun flag ne permet de forcer ce choix.

## Étape d'installation {#install-step}

Après l'exécution d'un template, la CLI lance `<pm> install` dans le nouveau dossier derrière un spinner (`Installing dependencies with <pm>`). Elle masque la sortie du gestionnaire de paquets.

- Code de sortie 0 : le spinner se termine par `Dependencies installed`, et la CLI affiche `cd <name>` et `<pm> run dev`.
- Code de sortie non nul, ou binaire absent : le spinner se termine par `Install failed. Run manually:` suivi de `cd <absolute path>` et `<pm> install`. Les fichiers du projet restent, et la CLI quitte quand même avec le code 0.

Les exécutions avec `--example` n'installent jamais.

## Cas limites {#edge-cases}

- Un dossier existant arrête l'exécution avec `Directory "<name>" already exists.` et le code de sortie 1. La CLI n'écrit jamais dans un dossier existant et ne fusionne jamais avec lui.
- Un nom dont le chemin résolu ne commence pas par le répertoire courant, comme `../app`, s'arrête avec `Project directory must be within the current working directory.`
- Une valeur de `--template` inconnue échoue après les prompts avec `Unknown template "<value>". Available: shell, react-app, vue-app, vanilla-app, svelte-app, angular-app`.
- `--template` ou `--example` en dernier argument, sans valeur, compte comme absent : vous obtenez le prompt de template, ou une exécution normale de template.
- La CLI utilise le nom du projet tel qu'écrit pour le dossier et pour le `name` du `package.json`. Elle ne vérifie pas les règles de nommage npm, donc `My App` donne un nom de paquet invalide.
- Annuler un prompt (Ctrl+C) affiche `Operation cancelled.` et quitte avec le code 0.
- Un nom d'exemple qui n'existe pas sur `master` laisse un dossier vide et échoue avec `Example "<name>" was not found or failed to extract.` Supprimez le dossier avant de réessayer.
- La CLI télécharge le tarball complet du dépôt pour un seul exemple. Une connexion lente rend `--example` lent.

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Les templates de micro app ne se montent pas eux-mêmes. `src/main` exporte le module, et rien dans `index.html` n'appelle `mount`, donc `pnpm run dev` affiche un `#app` vide jusqu'à ce qu'un shell charge l'entrée.
- Pas de configuration Vite en mode bibliothèque. `vite build` produit un build d'app classique avec des noms de fichiers hachés, et vous choisissez l'entrée que votre shell charge.
- Pas de configuration monorepo, workspace ou multi-apps. Lancez la CLI une fois par app, ou partez d'un `--example`.
- Pas de git init, pas de linter, pas de test runner, pas de configuration CSS.
- Pas de flag `--no-install` ni de flag de gestionnaire de paquets.
- Pas d'API programmatique. Importer le paquet exécute la CLI.

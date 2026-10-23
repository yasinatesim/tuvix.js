# create-tuvix-app

> Génère un projet Vite pour un shell Tuvix.js ou une micro app React, Vue, Svelte, Angular ou vanilla

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Utilisation

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app

# npm create forwards flags only after --
npm create tuvix-app@latest my-app -- --template react-app --typescript
```

La CLI demande chaque valeur que vous omettez (nom du projet, template, TypeScript), écrit les fichiers dans `./<project-name>`, puis installe les dépendances.

## Démarrage rapide

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

## Options

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `project-name` | positionnel | question | Nom du dossier et du `package.json` |
| `--template`, `-t` | `string` | question | `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app` ou `vanilla-app` |
| `--typescript` / `--no-typescript` | flag | question (`Yes` présélectionné) | Fichiers TypeScript avec `tsconfig.json`, ou JavaScript. `angular-app` est toujours en TypeScript. |
| `--example`, `-e` | `string` | aucun | Télécharge `examples/<name>` depuis le dépôt GitHub (`master`). Ignore les questions et l'installation. |
| `--help`, `-h` | flag | `false` | Affiche l'aide |
| `--version`, `-v` | flag | `false` | Affiche `create-tuvix-app v<version>`, lu depuis le `package.json` de la CLI |

## Templates

Chaque projet reçoit `index.html`, `src/main.<ext>` et un `package.json` avec les scripts Vite `dev`/`build`/`preview`, `tuvix.js@^0.5.0` et `vite@^6.0.0` (plus `typescript@^5.7.0` en mode TS).

| Template | Génère | Dépendances supplémentaires |
| --- | --- | --- |
| `shell` | `createOrchestrator` avec un routeur history (`/dashboard/*`, `/settings/*`) et une app `dashboard` enregistrée qui pointe vers une URL de CDN fictive | aucune |
| `react-app` | `createReactMicroApp({ name, App })`, `App.tsx` et un `vite.config.ts` avec `@vitejs/plugin-react` | `react`, `react-dom` `^19`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3` |
| `vue-app` | `createVueMicroApp({ name, App })`, `App.vue` qui lit les props avec `inject(TUVIX_PROPS_KEY)`, `vite.config.ts` avec `@vitejs/plugin-vue`, et en mode TS `src/vite-env.d.ts` qui déclare les modules `*.vue` | `vue@^3.5`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2` |
| `svelte-app` | `createSvelteMicroApp({ name, App, SvelteMap })` avec `SvelteMap` issu de `svelte/reactivity`, pour que `update()` rende à nouveau sur place. `App.svelte` en Svelte 5 qui lit `$props()`, `vite.config.ts`, `svelte.config.js` avec `vitePreprocess()`, et en mode TS `src/vite-env.d.ts` plus un script `check` | `svelte@^5`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5`, `svelte-check@^4` (mode TS) |
| `angular-app` | `createSsrAngularMicroApp({ name, component })` avec un `AppComponent` standalone, Angular 20 sans zone. `src/main.ts` importe `@angular/compiler` en premier pour que les composants JIT se compilent. | `@angular/{common,compiler,core,platform-browser}@^20`, `rxjs`, `tslib`, `@tuvix.js/angular` |
| `vanilla-app` | `defineMicroApp` avec `mount`/`unmount` qui écrivent `innerHTML` | aucune |

## Gestionnaire de paquets et installation

La CLI choisit `bun` quand elle s'exécute sur Bun, puis cherche `pnpm`/`yarn` dans `npm_execpath`, puis `pnpm`/`yarn`/`bun/` dans `npm_config_user_agent`, et se rabat sur `npm`. Après la génération d'un template, elle exécute `<pm> install` en masquant la sortie. En cas d'échec, elle affiche `Install failed. Run manually:` avec les commandes et se termine quand même avec le code 0.

## Cas limites

- Un dossier cible existant échoue avec `Directory "<name>" already exists.` (code de sortie 1).
- Les noms qui pointent hors du répertoire courant, comme `../app`, échouent.
- Un `--template` inconnu échoue avec la liste des templates disponibles.
- Le nom du projet est utilisé tel quel ; les règles de nommage npm ne sont pas vérifiées.
- Les exemples dépendent de `workspace:*`. Remplacez ces valeurs par `^0.5.0` avant l'installation.
- Un exemple introuvable laisse un dossier vide ; supprimez-le avant de réessayer.

## Ce qu'il ne fait pas

- Les templates de micro app exportent un module sans jamais le monter, donc `pnpm run dev` affiche un `#app` vide tant qu'aucun shell ne le charge.
- Pas de configuration de build en mode bibliothèque, ni d'initialisation git, de linter, de tests ou de configuration monorepo.
- Pas de `--no-install` ni de flag de gestionnaire de paquets, et pas d'API programmatique.

Documentation complète : [tuvix.js.org/packages/create-tuvix-app](https://tuvix.js.org/packages/create-tuvix-app)

## Licence

MIT

---
title: '@tuvix.js/vite'
---

<PackageHeader
  name="@tuvix.js/vite"
  title="Assets d'îlots pour Vite"
  description="Plugin Vite qui indique à votre moteur de rendu serveur les feuilles de style et les chunks JS dont un îlot a besoin, pour que le head rendu côté serveur les lie et que l'îlot soit stylé dès le premier affichage."
  icon="⚡"
  npm="true"
/>

## Installation {#installation}

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

Le plugin nécessite Vite 6 ou 7 (plage de peer `^6.0.0 || ^7.0.0`). La suite de tests s'exécute sur Vite 6.

## Quand l'utiliser {#when-to-use-it}

Vous rendez un îlot côté serveur (React, Vue, Svelte, Angular ou DOM simple) et son balisage atteint le navigateur avant son JavaScript. Vite livre les CSS Modules, les blocs `<style>` des SFC Vue et les styles Svelte via ce JavaScript, donc le navigateur affiche l'îlot sans style jusqu'à l'exécution du bundle. Avec `@tuvix.js/vite`, votre serveur demande « quelles feuilles de style faut-il à `src/islands/footer/index.ts` ? » et imprime les balises `<link>` correspondantes dans `<head>`.

Passez-vous-en quand vos îlots se rendent uniquement côté client, ou quand vous liez une feuille de style globale qui couvre déjà chaque îlot.

## Démarrage rapide {#quick-start}

Ajoutez le plugin à la configuration Vite que vous utilisez pour le build client et le build SSR :

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [tuvix()],
});
```

Ajoutez les types du module virtuel à `tsconfig.json` :

```json
{
  "compilerOptions": {
    "types": ["vite/client", "@tuvix.js/vite/client"]
  }
}
```

Demandez les assets dans votre entrée serveur et imprimez-les dans `<head>` :

```ts
// src/entry-server.ts
/// <reference types="@tuvix.js/vite/client" />
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { renderFooter } from './islands/footer/render';

export async function render(): Promise<string> {
  const assets = await getAssets(['src/islands/footer/index.ts']);
  return `<!doctype html>
<html>
  <head>${renderAssetTags(assets)}</head>
  <body><footer data-tuvix-app="footer">${await renderFooter()}</footer></body>
</html>`;
}
```

Buildez d'abord le client, puis le serveur. Le build SSR lit le manifeste client :

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API {#api}

### `tuvix(options?)`

```ts no-check
function tuvix(options?: TuvixViteOptions): Plugin[];
```

Retourne trois plugins Vite :

- `tuvix:assets` fournit `virtual:tuvix/assets`.
- `tuvix:client-build-info` (builds uniquement) écrit `.vite/tuvix-client.json` à côté du manifeste client. Voir [Builds de production](#production-builds).
- `tuvix:dev-css-handoff` (serveur de développement uniquement) passe le relais du style du `<link>` rendu côté serveur aux balises `<style>` de Vite.

Placez le tableau retourné dans `plugins` comme ci-dessus ; Vite aplatit les tableaux de plugins imbriqués.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | Répertoire de sortie du build client, relatif à la racine Vite ou absolu. Le build SSR lit `<clientOutDir>/.vite/manifest.json`, puis se rabat sur `<clientOutDir>/manifest.json`. |
| `base` | `string` | `base` Vite du build ou du serveur de développement qui charge le module virtuel | Base publique depuis laquelle le navigateur charge les assets client. Définissez-la quand le client est servi depuis une autre base que le bundle serveur, comme `/_build` de vinxi. |

TanStack Start et vinxi écrivent le build du routeur client dans un dossier séparé sous `/_build` :

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries)`

Exporté par `virtual:tuvix/assets`.

```ts no-check
function getAssets(entries: string[]): Promise<TuvixAssets>;
```

Passez les modules d'entrée des îlots sous forme de chemins relatifs à la racine Vite, comme `'src/islands/footer/index.ts'`. La fonction ignore un `./` ou un `/` initial. Avec plusieurs entrées, elle fusionne les listes dans l'ordre des entrées et supprime les doublons.

`getAssets` retourne une promesse, car le serveur de développement doit transformer chaque module avant de pouvoir lire ses imports. Appelez-la uniquement depuis du code serveur.

### `renderAssetTags(assets)`

Exporté par `virtual:tuvix/assets`.

```ts no-check
function renderAssetTags(assets: TuvixAssets): string;
```

Retourne une balise `<link rel="stylesheet">` par URL de `assets.css`, puis une balise `<link rel="modulepreload" crossorigin>` par URL de `assets.modulepreload`. Elle échappe les valeurs `href` pour le HTML. Elle fonctionne côté serveur et dans le navigateur.

Si votre `<head>` est un composant React, rendez les listes vous-même :

```tsx
import type { TuvixAssets } from '@tuvix.js/vite';

export function IslandAssets({ assets }: { assets: TuvixAssets }) {
  return (
    <>
      {assets.css.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {assets.modulepreload.map((href) => (
        <link key={href} rel="modulepreload" crossOrigin="" href={href} />
      ))}
    </>
  );
}
```

### Types {#types}

| Type | Exporté depuis | Signification |
| --- | --- | --- |
| `TuvixViteOptions` | `@tuvix.js/vite` | Options de `tuvix()` : `clientOutDir?`, `base?`. |
| `TuvixAssets` | `@tuvix.js/vite`, `virtual:tuvix/assets` | `{ css: string[]; modulepreload: string[] }`. `css` suit l'ordre de la cascade. `modulepreload` est vide en développement. |
| `@tuvix.js/vite/client` | entrée de types | Déclare le module `virtual:tuvix/assets`. Ajoutez-la à `compilerOptions.types` ou référencez-la avec `/// <reference types="@tuvix.js/vite/client" />`. |

## Builds de production {#production-builds}

- Dans le build client, le plugin active `build.manifest`, sauf si vous définissez `build.manifest` vous-même.
- Le build client écrit aussi `.vite/tuvix-client.json` à côté du manifeste, de forme `{ modules, sharedCss }`. `modules` associe chaque entrée et chaque cible de `import()`, relative à la racine Vite, au chunk dans lequel Rollup l'a placée. `sharedCss` liste la feuille de style unique d'un build `build.cssCodeSplit: false`.
- Dans le build SSR, il lit le manifeste client et `tuvix-client.json`, et intègre en ligne une table qui associe chaque clé du manifeste qui est une entrée (`isEntry`) ou une entrée dynamique (`isDynamicEntry`) à ses URL.
- Rollup fusionne parfois deux entrées dynamiques dans un seul chunk, par exemple une page et un runtime de framework qu'un adaptateur charge avec `import()`. Le manifeste de Vite indexe alors ce chunk sous `_Page-<hash>.js` et ne liste aucune des deux sources. Le plugin trouve le chunk via `modules` dans `tuvix-client.json`.
- Avec `build.cssCodeSplit: false`, Vite écrit tout le CSS dans un unique `style-<hash>.css` qu'aucun chunk du manifeste ne liste. `getAssets` retourne ce fichier pour chaque entrée, avant le CSS propre de l'entrée.
- Sans `tuvix-client.json` (un client buildé sans `tuvix()`), seuls les modules qui ont leur propre clé dans le manifeste sont résolus. Un asset `style.css` du manifeste qu'aucun chunk ne liste compte quand même comme la feuille de style unique de `cssCodeSplit: false`.
- Pour chaque entrée, il collecte le chunk d'entrée et chaque chunk qu'il importe statiquement, de manière transitive, ainsi que leur CSS. Le CSS des chunks importés précède le CSS propre de l'entrée, dans l'ordre où Vite les charge.
- `modulepreload` liste le chunk d'entrée et ses imports statiques. Les URL valent `base + file`.
- La table ignore les cibles de `import()`, car Vite ne charge ces chunks et leur CSS qu'à l'exécution de l'import. Si un module paresseux se rend côté serveur, passez son chemin à `getAssets` comme entrée distincte.
- Quand le navigateur charge ensuite le chunk de l'îlot, le helper de preload de Vite trouve le `<link>` imprimé par votre serveur et n'en ajoute pas un second.

## Serveur de développement {#dev-server}

- `getAssets` parcourt le graphe de modules client du serveur de développement depuis chaque entrée, le long des imports statiques, dans l'ordre des imports. Il retourne des URL comme `/src/islands/footer/footer.module.css?direct` ; Vite répond aux requêtes `?direct` avec du CSS brut. Les blocs Vue reviennent sous la forme `/src/App.vue?direct&vue&type=style&index=0&...&lang.css`.
- Le CSS qu'un îlot atteint via un module virtuel est collecté aussi. Une feuille de style virtuelle comme `\0virtual:theme.css` revient sous la forme `/@id/__x00__virtual:theme.css?direct`, donc le plugin qui la fournit doit charger les ids qui portent une query.
- Une fois le JavaScript de l'îlot exécuté, Vite injecte son propre `<style>` pour chaque module CSS. Le plugin `tuvix:dev-css-handoff` définit alors `link.sheet.disabled = true` sur le `<link>` rendu côté serveur qui a le même href, pour qu'une copie périmée des règles ne puisse pas écraser vos modifications HMR. L'élément `<link>` reste dans le DOM, donc un `<head>` React hydraté ne voit aucun changement.
- Lors d'une modification CSS, `tuvix:dev-css-handoff` exclut la feuille de style `?direct` de la mise à jour HMR. Vite met alors à jour son `<style>` sans recharger la page et sans remplacer le `<link>`. Deux limites s'appliquent :
  - Une modification de CSS Modules change les noms de classes hachés, donc le HMR propre à l'îlot (React Fast Refresh, Vue) doit le rendre à nouveau.
  - Un îlot dont la page n'a pas encore chargé le JavaScript garde la feuille de style du serveur jusqu'à ce que vous rechargiez.
- `modulepreload` est toujours vide en développement.
- `getAssets` communique avec le serveur de développement dans le même processus Node. Il fonctionne avec `ssrLoadModule` et le module runner par défaut de Vite, et continue de fonctionner après `server.restart()`.

## Cas limites {#edge-cases}

- Une entrée qui n'est ni une entrée du build ni une cible de `import()` du build client est rejetée avec `[tuvix] "<key>" is not an entry or a dynamically imported module in <manifest>`. Ajoutez l'îlot à `build.rollupOptions.input`, ou chargez-le avec `import()` depuis le code client.
- Un manifeste client manquant fait échouer le build SSR avec `[tuvix] No client manifest in <dir>`. Buildez d'abord le client, ou corrigez `clientOutDir`.
- En développement, `getAssets` est rejeté avec `found no running Vite dev server with the tuvix() plugin in this process` quand votre code SSR s'exécute dans un autre processus ou dans un runtime de worker, ou après la fermeture du serveur de développement.
- Dans le build navigateur de `virtual:tuvix/assets`, `getAssets` est rejeté avec `runs during server rendering only`. Le bundle client ne peut pas connaître son propre manifeste.
- En développement, le parcours ne descend pas dans les modules sous `/node_modules/`. Une feuille de style que votre propre code importe depuis un paquet est collectée ; une feuille de style qu'un paquet importe depuis son propre JavaScript ne l'est pas.
- Une `base` relative comme `'./'` produit des URL relatives, qui cassent sur les routes imbriquées. Utilisez une base absolue.
- Svelte : gardez la valeur par défaut `emitCss: true` de `vite-plugin-svelte`. Avec `compilerOptions.css: 'injected'`, les styles vivent dans le JavaScript et le plugin ne trouve aucune feuille de style à lier.

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Il n'écrit pas de balises dans votre HTML. Vous décidez où va la sortie de `renderAssetTags`.
- Il ne suit pas les chaînes de `import()`. Passez les modules paresseux qui se rendent côté serveur comme entrées à part entière.
- Il ne prend pas en charge un nom de fichier de manifeste personnalisé (`build.manifest: 'name.json'`). Utilisez `true`.
- Il ne rend pas les îlots et ne les hydrate pas. Associez-le à un adaptateur comme [`@tuvix.js/react`](/fr/packages/react) (`TuvixIsland`), [`@tuvix.js/vue`](/fr/packages/vue) ou [`@tuvix.js/svelte`](/fr/packages/svelte).

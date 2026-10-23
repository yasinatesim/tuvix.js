# @tuvix.js/vite

> Plugin Vite qui place le CSS des îlots et les liens modulepreload dans le `<head>` rendu côté serveur

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentation complète : [tuvix.js.org/packages/vite](https://tuvix.js.org/packages/vite).

Quand vous rendez côté serveur un îlot de micro app, son markup arrive dans le navigateur avant son JavaScript. Vite livre le CSS de l'îlot (CSS Modules, `<style>` des SFC Vue, styles Svelte) à l'intérieur de ce JavaScript, donc le premier affichage (first paint) montre un markup sans style. Ce plugin indique à votre serveur de quelles feuilles de style chaque îlot a besoin, pour que vous puissiez les lier dans `<head>`.

Utilisez-le quand vous rendez des îlots côté serveur avec Vite. Ignorez-le quand vos îlots ne sont rendus que côté client.

## Installation

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

Nécessite Vite 6 ou 7. La suite de tests tourne sur Vite 6.

## Démarrage rapide

Ajoutez le plugin à la config Vite que vous utilisez pour le build client et le build SSR :

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

Demandez les assets dans votre entrée serveur et écrivez-les dans `<head>` :

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

Construisez d'abord le client, puis le serveur :

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?: TuvixViteOptions): Plugin[]`

Renvoie trois plugins : `tuvix:assets` (fournit `virtual:tuvix/assets`), `tuvix:client-build-info` (builds uniquement ; écrit `.vite/tuvix-client.json` dans le build client) et `tuvix:dev-css-handoff` (serveur de dev uniquement).

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | Répertoire de sortie du build client, relatif à la racine Vite ou absolu. Le build SSR lit `<clientOutDir>/.vite/manifest.json`, puis `<clientOutDir>/manifest.json`. |
| `base` | `string` | `base` de Vite | Base publique depuis laquelle le navigateur charge les assets client. Définissez-la quand le client est servi depuis une base différente de celle du bundle serveur. |

Pour TanStack Start ou vinxi, pointez le plugin vers la sortie et la base du routeur client :

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries: string[]): Promise<TuvixAssets>`

Depuis `virtual:tuvix/assets`. Passez les modules d'entrée des îlots sous forme de chemins relatifs à la racine Vite, comme `'src/islands/footer/index.ts'`. Un `./` ou `/` initial est ignoré. Avec plusieurs entrées, `getAssets` fusionne les listes dans l'ordre des entrées et supprime les doublons. Serveur uniquement.

### `renderAssetTags(assets: TuvixAssets): string`

Depuis `virtual:tuvix/assets`. Renvoie des balises `<link rel="stylesheet">` pour `css`, puis des balises `<link rel="modulepreload" crossorigin>` pour `modulepreload`. Il échappe les valeurs d'attribut et fonctionne sur le serveur comme dans le navigateur.

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

### Types

| Type | Signification |
| --- | --- |
| `TuvixViteOptions` | Options de `tuvix()`. |
| `TuvixAssets` | `{ css: string[]; modulepreload: string[] }`. `css` est dans l'ordre de la cascade ; `modulepreload` est vide en dev. |

## Builds de production

- Le plugin active `build.manifest` dans le build client, sauf si vous définissez `build.manifest` vous-même.
- Dans le build SSR, il lit le manifeste client et intègre une table qui associe chaque entrée et entrée dynamique à ses URL.
- Le build client écrit aussi `.vite/tuvix-client.json` à côté du manifeste. Ce fichier associe chaque entrée et cible d'`import()` au chunk dans lequel Rollup l'a placée. Rollup fusionne parfois deux entrées dynamiques dans un seul chunk, par exemple une page et un runtime de framework qu'un adaptateur charge avec `import()`. Le manifeste de Vite indexe alors ce chunk sous `_Page-<hash>.js` et ne liste aucune des deux sources, et le plugin utilise `tuvix-client.json` pour le retrouver. Sans ce fichier (un client construit sans `tuvix()`), seuls les modules qui ont leur propre clé dans le manifeste se résolvent.
- Avec `build.cssCodeSplit: false`, Vite écrit tout le CSS dans un seul `style-<hash>.css` qu'aucun chunk du manifeste ne liste. `getAssets` renvoie ce fichier pour chaque entrée.
- Pour chaque entrée, il collecte le chunk d'entrée et chaque chunk qu'il importe statiquement, avec leur CSS. Le CSS des chunks importés passe avant le CSS propre de l'entrée, dans l'ordre où Vite les charge.
- Il ignore les cibles d'`import()`, car Vite ne charge ces chunks et leur CSS qu'au moment où l'import s'exécute. Si un module chargé à la demande est rendu sur le serveur, passez aussi son chemin à `getAssets`.
- Les URL commencent par `base`. Quand le navigateur charge ensuite le chunk de l'îlot, le helper de preload de Vite trouve le `<link>` existant et n'en ajoute pas un second.

## Serveur de dev

- `getAssets` parcourt le graphe de modules client du serveur de dev depuis chaque entrée en suivant les imports statiques, et renvoie des URL comme `/src/islands/footer/footer.module.css?direct`. Vite répond aux requêtes `?direct` avec du CSS brut.
- Le CSS qu'un îlot atteint via un module virtuel fonctionne aussi. Une feuille de style virtuelle comme `\0virtual:theme.css` revient sous la forme `/@id/__x00__virtual:theme.css?direct`, donc le plugin qui la fournit doit charger les ids qui portent une query.
- Quand le JavaScript de l'îlot s'exécute, Vite injecte son propre `<style>` pour chaque module CSS. Le plugin désactive alors le `<link>` correspondant rendu côté serveur via `link.sheet.disabled`, pour qu'une copie obsolète des règles ne puisse pas écraser vos modifications HMR. L'élément `<link>` reste dans le DOM, et un `<head>` React hydraté ne voit aucun changement.
- Lors d'une modification CSS, le plugin laisse la feuille de style `?direct` hors de la mise à jour HMR. Vite met alors à jour son `<style>` sans recharger la page et sans remplacer le `<link>`. Une modification de CSS Modules change les noms de classes hachés, donc le HMR propre à l'îlot (React Fast Refresh, Vue) doit le rendre à nouveau. Un îlot dont la page n'a pas encore chargé le JavaScript garde la feuille de style du serveur jusqu'au rechargement.
- `modulepreload` est toujours vide en dev.

## Cas particuliers

- `getAssets` est rejeté pour un chemin qui n'est ni une entrée du build ni une cible d'`import()` du build client. Ajoutez l'îlot à `build.rollupOptions.input`, ou chargez-le avec `import()` depuis le code client.
- Le build SSR échoue avec `[tuvix] No client manifest in <dir>` quand le manifeste client est absent.
- En dev, `getAssets` a besoin du serveur de dev dans le même processus Node (`ssrLoadModule` ou le module runner par défaut de Vite). Il est rejeté quand le code SSR s'exécute dans un autre processus ou un runtime worker, ou après la fermeture du serveur de dev. Il continue de fonctionner après un `server.restart()`.
- Le build navigateur de `virtual:tuvix/assets` exporte un `getAssets` qui est rejeté, car le bundle client ne peut pas connaître son propre manifeste.
- En dev, le parcours ne descend pas dans les modules sous `/node_modules/`, donc le CSS qu'un paquet importe depuis son propre JavaScript n'est pas collecté.
- Une `base` relative comme `'./'` produit des URL relatives, qui cassent sur les routes imbriquées. Utilisez une base absolue.
- Svelte : gardez la valeur par défaut `emitCss: true` de `vite-plugin-svelte`. Avec `compilerOptions.css: 'injected'`, les styles vivent dans le JavaScript, et le plugin ne trouve aucune feuille de style à lier.

## Ce qu'il ne fait pas

- Il n'écrit pas les balises dans votre HTML. C'est vous qui choisissez où elles vont.
- Il ne suit pas les chaînes d'`import()`.
- Il ne prend pas en charge un nom de fichier de manifeste personnalisé (`build.manifest: 'name.json'`). Utilisez `true`.
- Il ne rend pas et n'hydrate pas les îlots. Utilisez un adaptateur comme `@tuvix.js/react` (`TuvixIsland`), `@tuvix.js/vue` ou `@tuvix.js/svelte`.

## Licence

MIT

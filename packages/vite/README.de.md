# @tuvix.js/vite

> Vite-Plugin, das Island-CSS und Modulepreload-Links in den serverseitig gerenderten `<head>` bringt

Teil des [Tuvix.js](https://github.com/yasinatesim/tuvix.js) Microfrontend-Frameworks. Vollständige Dokumentation: [tuvix.js.org/de/packages/vite](https://tuvix.js.org/de/packages/vite).

Wenn du eine Micro-App-Island serverseitig renderst, erreicht ihr Markup den Browser vor ihrem JavaScript. Vite liefert das CSS der Island (CSS Modules, `<style>` aus Vue-SFCs, Svelte-Styles) innerhalb dieses JavaScripts aus, sodass der erste Paint ungestyltes Markup zeigt. Dieses Plugin teilt deinem Server mit, welche Stylesheets jede Island braucht, damit du sie im `<head>` verlinken kannst.

Verwende es, wenn du Islands mit Vite serverseitig renderst. Lass es weg, wenn deine Islands nur auf dem Client rendern.

## Installation

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

Benötigt Vite 6 oder 7. Die Testsuite läuft auf Vite 6.

## Schnellstart

Füge das Plugin der Vite-Konfiguration hinzu, die du für den Client-Build und den SSR-Build verwendest:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [tuvix()],
});
```

Füge die Typen des virtuellen Moduls zu `tsconfig.json` hinzu:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "@tuvix.js/vite/client"]
  }
}
```

Frag in deinem Server-Entry nach den Assets und gib sie im `<head>` aus:

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

Baue zuerst den Client, dann den Server:

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?: TuvixViteOptions): Plugin[]`

Gibt drei Plugins zurück: `tuvix:assets` (stellt `virtual:tuvix/assets` bereit), `tuvix:client-build-info` (nur bei Builds; schreibt im Client-Build `.vite/tuvix-client.json`) und `tuvix:dev-css-handoff` (nur im Dev-Server).

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | Ausgabeverzeichnis des Client-Builds, relativ zum Vite-Root oder absolut. Der SSR-Build liest `<clientOutDir>/.vite/manifest.json`, dann `<clientOutDir>/manifest.json`. |
| `base` | `string` | Vite-`base` | Öffentliche Basis, von der der Browser die Client-Assets lädt. Setz sie, wenn der Client unter einer anderen Basis ausgeliefert wird als das Server-Bundle. |

Für TanStack Start oder vinxi richtest du das Plugin auf die Ausgabe und die Basis des Client-Routers aus:

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries: string[]): Promise<TuvixAssets>`

Aus `virtual:tuvix/assets`. Übergib die Entry-Module der Islands als Pfade relativ zum Vite-Root, zum Beispiel `'src/islands/footer/index.ts'`. Ein führendes `./` oder `/` wird ignoriert. Bei mehreren Entries führt `getAssets` die Listen in der Reihenfolge der Entries zusammen und entfernt Duplikate. Nur auf dem Server.

### `renderAssetTags(assets: TuvixAssets): string`

Aus `virtual:tuvix/assets`. Gibt `<link rel="stylesheet">`-Tags für `css` zurück, danach `<link rel="modulepreload" crossorigin>`-Tags für `modulepreload`. Es escaped Attributwerte und funktioniert auf dem Server und im Browser.

Wenn dein `<head>` eine React-Komponente ist, renderst du die Listen selbst:

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

### Typen

| Typ | Bedeutung |
| --- | --- |
| `TuvixViteOptions` | Optionen von `tuvix()`. |
| `TuvixAssets` | `{ css: string[]; modulepreload: string[] }`. `css` steht in Kaskadenreihenfolge; `modulepreload` ist im Dev-Modus leer. |

## Produktions-Builds

- Das Plugin schaltet `build.manifest` im Client-Build ein, außer du setzt `build.manifest` selbst.
- Im SSR-Build liest es das Client-Manifest und bettet eine Zuordnung von jedem Entry und jedem dynamischen Entry zu seinen URLs ein.
- Der Client-Build schreibt außerdem `.vite/tuvix-client.json` neben das Manifest. Diese Datei ordnet jeden Entry und jedes `import()`-Ziel dem Chunk zu, in den Rollup es gelegt hat. Rollup führt manchmal zwei dynamische Entries in einem Chunk zusammen, zum Beispiel eine Seite und eine Framework-Runtime, die ein Adapter mit `import()` lädt. Das Manifest von Vite benennt diesen Chunk dann mit `_Page-<hash>.js` und führt keine der beiden Quellen auf, und das Plugin findet ihn über `tuvix-client.json`. Ohne diese Datei (ein Client, der ohne `tuvix()` gebaut wurde) werden nur Module aufgelöst, die einen eigenen Schlüssel im Manifest haben.
- Mit `build.cssCodeSplit: false` schreibt Vite das gesamte CSS in eine einzige `style-<hash>.css`, die kein Chunk im Manifest aufführt. `getAssets` gibt diese Datei für jeden Entry zurück.
- Für jeden Entry sammelt es den Entry-Chunk und jeden Chunk, den er statisch importiert, samt deren CSS. Das CSS importierter Chunks kommt vor dem eigenen CSS des Entrys, in der Reihenfolge, in der Vite sie lädt.
- Es überspringt `import()`-Ziele, weil Vite diese Chunks und ihr CSS erst lädt, wenn der Import ausgeführt wird. Wenn ein Lazy-Modul auf dem Server rendert, übergib seinen Pfad ebenfalls an `getAssets`.
- URLs beginnen mit `base`. Wenn der Browser später den Chunk der Island lädt, findet der Preload-Helfer von Vite den vorhandenen `<link>` und fügt keinen zweiten hinzu.

## Dev-Server

- `getAssets` durchläuft den Client-Modulgraphen des Dev-Servers von jedem Entry entlang statischer Imports und gibt URLs wie `/src/islands/footer/footer.module.css?direct` zurück. Vite beantwortet `?direct`-Requests mit reinem CSS.
- CSS, das eine Island über ein virtuelles Modul erreicht, funktioniert ebenfalls. Ein virtuelles Stylesheet wie `\0virtual:theme.css` kommt als `/@id/__x00__virtual:theme.css?direct` zurück, deshalb muss das Plugin, das es bereitstellt, IDs mit Query laden können.
- Wenn das JavaScript der Island läuft, fügt Vite für jedes CSS-Modul ein eigenes `<style>` ein. Das Plugin deaktiviert dann den passenden serverseitig gerenderten `<link>` über `link.sheet.disabled`, sodass eine veraltete Kopie der Regeln deine HMR-Änderungen nicht überschreiben kann. Das `<link>`-Element bleibt im DOM, und ein hydrierter React-`<head>` sieht keine Änderung.
- Bei einer CSS-Änderung lässt das Plugin das `?direct`-Stylesheet aus dem HMR-Update heraus. Vite aktualisiert dann sein `<style>`, ohne die Seite neu zu laden und ohne den `<link>` auszutauschen. Eine Änderung an CSS Modules ändert die gehashten Klassennamen, deshalb muss das eigene HMR der Island (React Fast Refresh, Vue) sie neu rendern. Eine Island, deren JavaScript die Seite noch nicht geladen hat, behält das Server-Stylesheet, bis du neu lädst.
- `modulepreload` ist im Dev-Modus immer leer.

## Sonderfälle

- `getAssets` lehnt einen Pfad ab, der weder ein Build-Input noch ein `import()`-Ziel des Client-Builds ist. Füge die Island zu `build.rollupOptions.input` hinzu oder lade sie mit `import()` aus Client-Code.
- Der SSR-Build schlägt mit `[tuvix] No client manifest in <dir>` fehl, wenn das Client-Manifest fehlt.
- Im Dev-Modus braucht `getAssets` den Dev-Server im selben Node-Prozess (`ssrLoadModule` oder der Standard-Module-Runner von Vite). Es lehnt ab, wenn der SSR-Code in einem anderen Prozess oder einer Worker-Runtime läuft oder nachdem der Dev-Server geschlossen wurde. Über `server.restart()` hinweg funktioniert es weiter.
- Der Browser-Build von `virtual:tuvix/assets` exportiert ein `getAssets`, das ablehnt, weil das Client-Bundle sein eigenes Manifest nicht kennen kann.
- Im Dev-Modus steigt der Walker nicht in Module unter `/node_modules/` ab, sodass CSS, das ein Paket aus seinem eigenen JavaScript importiert, nicht gesammelt wird.
- Eine relative `base` wie `'./'` ergibt relative URLs, die bei verschachtelten Routen brechen. Verwende eine absolute Basis.
- Svelte: Behalte das Standard-`emitCss: true` von `vite-plugin-svelte`. Mit `compilerOptions.css: 'injected'` stecken die Styles im JavaScript, und das Plugin findet kein Stylesheet zum Verlinken.

## Was es nicht tut

- Es schreibt keine Tags in dein HTML. Du entscheidest, wo sie hinkommen.
- Es folgt keinen `import()`-Ketten.
- Es unterstützt keinen eigenen Dateinamen für das Manifest (`build.manifest: 'name.json'`). Verwende `true`.
- Es rendert oder hydriert keine Islands. Verwende einen Adapter wie `@tuvix.js/react` (`TuvixIsland`), `@tuvix.js/vue` oder `@tuvix.js/svelte`.

## Lizenz

MIT

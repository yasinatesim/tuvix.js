---
title: '@tuvix.js/vite'
---

<PackageHeader
  name="@tuvix.js/vite"
  title="Vite Island Assets"
  description="Vite-Plugin, das deinem Server-Renderer sagt, welche Stylesheets und JS-Chunks ein Island braucht, damit der serverseitig gerenderte Head sie verlinkt und das Island schon beim ersten Paint gestylt ist."
  icon="⚡"
  npm="true"
/>

## Installation

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

Das Plugin braucht Vite 6 oder 7 (Peer-Bereich `^6.0.0 || ^7.0.0`). Die Testsuite läuft auf Vite 6.

## Wann du es verwendest

Du renderst ein Island serverseitig (React, Vue, Svelte, Angular oder reines DOM), und sein Markup erreicht den Browser vor seinem JavaScript. Vite liefert CSS Modules, `<style>`-Blöcke aus Vue SFCs und Svelte-Styles über dieses JavaScript aus, daher zeichnet der Browser das Island ungestylt, bis das Bundle läuft. Mit `@tuvix.js/vite` fragt dein Server „Welche Stylesheets braucht `src/islands/footer/index.ts`?“ und gibt `<link>`-Tags dafür in `<head>` aus.

Lass es weg, wenn deine Islands nur auf dem Client rendern oder wenn du ein globales Stylesheet verlinkst, das bereits jedes Island abdeckt.

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

Frage die Assets in deinem Server-Entry ab und gib sie in `<head>` aus:

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

Baue zuerst den Client, dann den Server. Der SSR-Build liest das Client-Manifest:

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?)`

```ts no-check
function tuvix(options?: TuvixViteOptions): Plugin[];
```

Gibt drei Vite-Plugins zurück:

- `tuvix:assets` stellt `virtual:tuvix/assets` bereit.
- `tuvix:client-build-info` (nur Builds) schreibt `.vite/tuvix-client.json` neben das Client-Manifest. Siehe [Produktions-Builds](#production-builds).
- `tuvix:dev-css-handoff` (nur Dev-Server) übergibt das Styling vom serverseitig gerenderten `<link>` an Vites eigene `<style>`-Tags.

Lege das zurückgegebene Array wie oben gezeigt in `plugins`; Vite flacht verschachtelte Plugin-Arrays ab.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | Ausgabeverzeichnis des Client-Builds, relativ zum Vite-Root oder absolut. Der SSR-Build liest `<clientOutDir>/.vite/manifest.json` und greift ersatzweise auf `<clientOutDir>/manifest.json` zurück. |
| `base` | `string` | Vite-`base` des Builds oder Dev-Servers, der das virtuelle Modul lädt | Öffentliche Base, von der der Browser Client-Assets lädt. Setze sie, wenn der Client unter einer anderen Base ausgeliefert wird als das Server-Bundle, etwa unter `/_build` bei vinxi. |

TanStack Start und vinxi schreiben den Build des Client-Routers in einen eigenen Ordner unter `/_build`:

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries)`

Exportiert von `virtual:tuvix/assets`.

```ts no-check
function getAssets(entries: string[]): Promise<TuvixAssets>;
```

Übergib Entry-Module von Islands als Pfade relativ zum Vite-Root, etwa `'src/islands/footer/index.ts'`. Die Funktion ignoriert ein führendes `./` oder `/`. Bei mehreren Entries führt sie die Listen in Entry-Reihenfolge zusammen und verwirft Duplikate.

`getAssets` gibt ein Promise zurück, weil der Dev-Server jedes Modul transformieren muss, bevor er dessen Imports lesen kann. Rufe es nur aus Server-Code auf.

### `renderAssetTags(assets)`

Exportiert von `virtual:tuvix/assets`.

```ts no-check
function renderAssetTags(assets: TuvixAssets): string;
```

Gibt ein `<link rel="stylesheet">`-Tag pro URL in `assets.css` zurück, danach ein `<link rel="modulepreload" crossorigin>`-Tag pro URL in `assets.modulepreload`. Es maskiert die `href`-Werte für HTML. Es funktioniert auf dem Server und im Browser.

Ist dein `<head>` eine React-Komponente, renderst du die Listen selbst:

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

| Typ | Exportiert aus | Bedeutung |
| --- | --- | --- |
| `TuvixViteOptions` | `@tuvix.js/vite` | Optionen von `tuvix()`: `clientOutDir?`, `base?`. |
| `TuvixAssets` | `@tuvix.js/vite`, `virtual:tuvix/assets` | `{ css: string[]; modulepreload: string[] }`. `css` steht in Kaskadenreihenfolge. `modulepreload` ist im Dev-Modus leer. |
| `@tuvix.js/vite/client` | Typ-Entry | Deklariert das Modul `virtual:tuvix/assets`. Füge es zu `compilerOptions.types` hinzu oder referenziere es mit `/// <reference types="@tuvix.js/vite/client" />`. |

## Produktions-Builds {#production-builds}

- Im Client-Build schaltet das Plugin `build.manifest` ein, sofern du `build.manifest` nicht selbst setzt.
- Der Client-Build schreibt außerdem `.vite/tuvix-client.json` neben das Manifest, in der Form `{ modules, sharedCss }`. `modules` ordnet jeden Entry und jedes `import()`-Ziel, relativ zum Vite-Root, dem Chunk zu, in den Rollup es gelegt hat. `sharedCss` listet das einzige Stylesheet eines Builds mit `build.cssCodeSplit: false`.
- Im SSR-Build liest es das Client-Manifest und `tuvix-client.json` und bettet eine Zuordnung ein, die jeden Manifest-Schlüssel, der ein Entry (`isEntry`) oder ein dynamischer Entry (`isDynamicEntry`) ist, auf seine URLs abbildet.
- Rollup führt manchmal zwei dynamische Entries in einem Chunk zusammen, zum Beispiel eine Seite und eine Framework-Runtime, die ein Adapter mit `import()` lädt. Vites Manifest führt diesen Chunk dann unter dem Schlüssel `_Page-<hash>.js` und nennt keine der beiden Quellen. Das Plugin findet den Chunk über `modules` in `tuvix-client.json`.
- Mit `build.cssCodeSplit: false` schreibt Vite das gesamte CSS in eine einzige `style-<hash>.css`, die kein Chunk im Manifest listet. `getAssets` gibt diese Datei für jeden Entry zurück, vor dem eigenen CSS des Entry.
- Ohne `tuvix-client.json` (ein Client, der ohne `tuvix()` gebaut wurde) werden nur Module mit eigenem Manifest-Schlüssel aufgelöst. Ein `style.css`-Asset im Manifest, das kein Chunk listet, gilt trotzdem als das einzige Stylesheet von `cssCodeSplit: false`.
- Für jeden Entry sammelt es den Entry-Chunk und jeden Chunk, den dieser statisch importiert, transitiv, samt deren CSS. Das CSS importierter Chunks steht vor dem eigenen CSS des Entry, in der Reihenfolge, in der Vite sie lädt.
- `modulepreload` listet den Entry-Chunk und seine statischen Imports. URLs sind `base + file`.
- Die Zuordnung überspringt `import()`-Ziele, weil Vite diese Chunks und ihr CSS erst lädt, wenn der Import ausgeführt wird. Rendert ein Lazy-Modul auf dem Server, übergib seinen Pfad als separaten Entry an `getAssets`.
- Lädt der Browser später den Chunk des Islands, findet Vites Preload-Helper das `<link>`, das dein Server ausgegeben hat, und fügt kein zweites hinzu.

## Dev-Server

- `getAssets` durchläuft den Client-Modulgraphen des Dev-Servers von jedem Entry aus entlang statischer Imports, in Import-Reihenfolge. Es gibt URLs wie `/src/islands/footer/footer.module.css?direct` zurück; Vite beantwortet `?direct`-Anfragen mit reinem CSS. Vue-Blöcke kommen als `/src/App.vue?direct&vue&type=style&index=0&...&lang.css` zurück.
- CSS, das ein Island über ein virtuelles Modul erreicht, wird ebenfalls gesammelt. Ein virtuelles Stylesheet wie `\0virtual:theme.css` kommt als `/@id/__x00__virtual:theme.css?direct` zurück, daher muss das Plugin, das es bereitstellt, IDs mit Query laden können.
- Sobald das JavaScript des Islands läuft, injiziert Vite für jedes CSS-Modul ein eigenes `<style>`. Das Plugin `tuvix:dev-css-handoff` setzt dann `link.sheet.disabled = true` auf dem serverseitig gerenderten `<link>` mit demselben href, damit eine veraltete Kopie der Regeln deine HMR-Änderungen nicht überschreibt. Das `<link>`-Element bleibt im DOM, daher sieht ein hydrierter React-`<head>` keine Änderung.
- Bei einer CSS-Änderung lässt `tuvix:dev-css-handoff` das `?direct`-Stylesheet aus dem HMR-Update heraus. Vite aktualisiert dann sein `<style>`, ohne die Seite neu zu laden und ohne das `<link>` auszutauschen. Dabei gelten zwei Grenzen:
  - Eine Änderung an CSS Modules ändert die gehashten Klassennamen, daher muss das eigene HMR des Islands (React Fast Refresh, Vue) es neu rendern.
  - Ein Island, dessen JavaScript die Seite noch nicht geladen hat, behält das Server-Stylesheet, bis du neu lädst.
- `modulepreload` ist im Dev-Modus immer leer.
- `getAssets` spricht mit dem Dev-Server im selben Node-Prozess. Es funktioniert mit `ssrLoadModule` und dem Standard-Module-Runner von Vite und funktioniert auch nach `server.restart()` weiter.

## Sonderfälle

- Ein Entry, der weder ein Build-Input noch ein `import()`-Ziel des Client-Builds ist, lehnt mit `[tuvix] "<key>" is not an entry or a dynamically imported module in <manifest>` ab. Füge das Island zu `build.rollupOptions.input` hinzu oder lade es mit `import()` aus Client-Code.
- Ein fehlendes Client-Manifest lässt den SSR-Build mit `[tuvix] No client manifest in <dir>` scheitern. Baue zuerst den Client oder korrigiere `clientOutDir`.
- Im Dev-Modus lehnt `getAssets` mit `found no running Vite dev server with the tuvix() plugin in this process` ab, wenn dein SSR-Code in einem anderen Prozess oder einer Worker-Runtime läuft oder nachdem der Dev-Server geschlossen wurde.
- Im Browser-Build von `virtual:tuvix/assets` lehnt `getAssets` mit `runs during server rendering only` ab. Das Client-Bundle kann sein eigenes Manifest nicht kennen.
- Im Dev-Modus steigt der Walker nicht in Module unter `/node_modules/` hinab. Ein Stylesheet, das dein eigener Code aus einem Paket importiert, wird gesammelt; ein Stylesheet, das ein Paket aus seinem eigenen JavaScript importiert, nicht.
- Eine relative `base` wie `'./'` ergibt relative URLs, die auf verschachtelten Routen brechen. Verwende eine absolute Base.
- Svelte: Behalte den Standardwert `emitCss: true` von `vite-plugin-svelte` bei. Mit `compilerOptions.css: 'injected'` stecken die Styles im JavaScript, und das Plugin findet kein Stylesheet zum Verlinken.

## Was es nicht tut

- Es schreibt keine Tags in dein HTML. Du entscheidest, wohin die Ausgabe von `renderAssetTags` kommt.
- Es folgt keinen `import()`-Ketten. Übergib Lazy-Module, die auf dem Server rendern, als eigene Entries.
- Es unterstützt keinen eigenen Dateinamen für das Manifest (`build.manifest: 'name.json'`). Verwende `true`.
- Es rendert und hydriert keine Islands. Kombiniere es mit einem Adapter wie [`@tuvix.js/react`](/de/packages/react) (`TuvixIsland`), [`@tuvix.js/vue`](/de/packages/vue) oder [`@tuvix.js/svelte`](/de/packages/svelte).

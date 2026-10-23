---
title: '@tuvix.js/vite'
---

<PackageHeader
  name="@tuvix.js/vite"
  title="Asset delle island per Vite"
  description="Plugin Vite che indica al tuo renderer lato server quali fogli di stile e chunk JS servono a un'island, così l'head renderizzato dal server li collega e l'island ha già i suoi stili al primo paint."
  icon="⚡"
  npm="true"
/>

## Installazione

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

Il plugin richiede Vite 6 o 7 (range peer `^6.0.0 || ^7.0.0`). La suite di test gira su Vite 6.

## Quando usarlo

Renderizzi lato server un'island (React, Vue, Svelte, Angular o DOM puro) e il suo markup arriva al browser prima del suo JavaScript. Vite distribuisce CSS Modules, blocchi `<style>` dei SFC Vue e stili Svelte attraverso quel JavaScript, quindi il browser disegna l'island senza stili finché il bundle non viene eseguito. Con `@tuvix.js/vite` il tuo server chiede "di quali fogli di stile ha bisogno `src/islands/footer/index.ts`?" e stampa i tag `<link>` corrispondenti in `<head>`.

Non ti serve quando le tue island vengono renderizzate solo sul client, o quando colleghi un unico foglio di stile globale che copre già tutte le island.

## Avvio rapido

Aggiungi il plugin alla configurazione Vite che usi per la build client e per la build SSR:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [tuvix()],
});
```

Aggiungi i tipi del modulo virtuale a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "@tuvix.js/vite/client"]
  }
}
```

Richiedi gli asset nella entry del server e stampali in `<head>`:

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

Esegui prima la build del client, poi quella del server. La build SSR legge il manifest del client:

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?)`

```ts no-check
function tuvix(options?: TuvixViteOptions): Plugin[];
```

Restituisce tre plugin Vite:

- `tuvix:assets` fornisce `virtual:tuvix/assets`.
- `tuvix:client-build-info` (solo build) scrive `.vite/tuvix-client.json` accanto al manifest del client. Vedi [Build di produzione](#production-builds).
- `tuvix:dev-css-handoff` (solo dev server) passa la gestione degli stili dal `<link>` renderizzato dal server ai tag `<style>` di Vite.

Metti l'array restituito in `plugins` come mostrato sopra; Vite appiattisce gli array di plugin annidati.

| Opzione | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | Directory di output della build client, relativa alla root di Vite o assoluta. La build SSR legge `<clientOutDir>/.vite/manifest.json`, poi ripiega su `<clientOutDir>/manifest.json`. |
| `base` | `string` | `base` di Vite della build o del dev server che carica il modulo virtuale | Base pubblica da cui il browser carica gli asset del client. Impostala quando il client è servito da una base diversa da quella del bundle server, come `/_build` di vinxi. |

TanStack Start e vinxi scrivono la build del router client in una cartella separata sotto `/_build`:

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries)`

Esportata da `virtual:tuvix/assets`.

```ts no-check
function getAssets(entries: string[]): Promise<TuvixAssets>;
```

Passa i moduli entry delle island come percorsi relativi alla root di Vite, per esempio `'src/islands/footer/index.ts'`. La funzione ignora un `./` o `/` iniziale. Con più entry unisce gli elenchi nell'ordine delle entry ed elimina i duplicati.

`getAssets` restituisce una promise perché il dev server deve trasformare ogni modulo prima di poterne leggere gli import. Chiamala solo da codice server.

### `renderAssetTags(assets)`

Esportata da `virtual:tuvix/assets`.

```ts no-check
function renderAssetTags(assets: TuvixAssets): string;
```

Restituisce un tag `<link rel="stylesheet">` per ogni URL in `assets.css`, poi un tag `<link rel="modulepreload" crossorigin>` per ogni URL in `assets.modulepreload`. Esegue l'escape HTML dei valori `href`. Funziona sul server e nel browser.

Se il tuo `<head>` è un componente React, renderizza tu gli elenchi:

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

### Tipi

| Tipo | Esportato da | Significato |
| --- | --- | --- |
| `TuvixViteOptions` | `@tuvix.js/vite` | Opzioni di `tuvix()`: `clientOutDir?`, `base?`. |
| `TuvixAssets` | `@tuvix.js/vite`, `virtual:tuvix/assets` | `{ css: string[]; modulepreload: string[] }`. `css` è in ordine di cascata. `modulepreload` è vuoto in dev. |
| `@tuvix.js/vite/client` | entry di tipi | Dichiara il modulo `virtual:tuvix/assets`. Aggiungilo a `compilerOptions.types` o referenzialo con `/// <reference types="@tuvix.js/vite/client" />`. |

## Build di produzione {#production-builds}

- Nella build client il plugin attiva `build.manifest`, a meno che tu non imposti `build.manifest` da solo.
- La build client scrive anche `.vite/tuvix-client.json` accanto al manifest, con la forma `{ modules, sharedCss }`. `modules` associa ogni entry e ogni target di `import()`, relativi alla root di Vite, al chunk in cui Rollup li ha inseriti. `sharedCss` elenca l'unico foglio di stile di una build con `build.cssCodeSplit: false`.
- Nella build SSR legge il manifest del client e `tuvix-client.json`, e incorpora una mappa da ogni chiave del manifest che è una entry (`isEntry`) o una entry dinamica (`isDynamicEntry`) ai relativi URL.
- A volte Rollup unisce due entry dinamiche in un solo chunk, per esempio una pagina e un runtime di framework che un adapter carica con `import()`. Il manifest di Vite usa allora `_Page-<hash>.js` come chiave di quel chunk e non elenca nessuno dei due sorgenti. Il plugin trova il chunk tramite `modules` in `tuvix-client.json`.
- Con `build.cssCodeSplit: false`, Vite scrive tutto il CSS in un unico `style-<hash>.css` che nessun chunk del manifest elenca. `getAssets` restituisce quel file per ogni entry, prima del CSS della entry stessa.
- Senza `tuvix-client.json` (un client compilato senza `tuvix()`), si risolvono solo i moduli che hanno una propria chiave nel manifest. Un asset `style.css` del manifest che nessun chunk elenca conta comunque come l'unico foglio di stile di `cssCodeSplit: false`.
- Per ogni entry raccoglie il chunk della entry e ogni chunk che questo importa staticamente, in modo transitivo, insieme al loro CSS. Il CSS dei chunk importati viene prima del CSS della entry stessa, nell'ordine in cui Vite li carica.
- `modulepreload` elenca il chunk della entry e i suoi import statici. Gli URL sono `base + file`.
- La mappa salta i target di `import()`, perché Vite carica quei chunk e il loro CSS solo quando l'import viene eseguito. Se un modulo lazy viene renderizzato sul server, passa il suo percorso a `getAssets` come entry separata.
- Quando il browser carica in seguito il chunk dell'island, l'helper di preload di Vite trova il `<link>` stampato dal tuo server e non ne aggiunge un secondo.

## Dev server

- `getAssets` percorre il grafo dei moduli client del dev server a partire da ogni entry lungo gli import statici, nell'ordine degli import. Restituisce URL come `/src/islands/footer/footer.module.css?direct`; Vite risponde alle richieste `?direct` con CSS semplice. I blocchi Vue tornano come `/src/App.vue?direct&vue&type=style&index=0&...&lang.css`.
- Viene raccolto anche il CSS che un'island raggiunge tramite un modulo virtuale. Un foglio di stile virtuale come `\0virtual:theme.css` torna come `/@id/__x00__virtual:theme.css?direct`, quindi il plugin che lo fornisce deve caricare id che portano una query.
- Quando il JavaScript dell'island viene eseguito, Vite inietta il proprio `<style>` per ogni modulo CSS. Il plugin `tuvix:dev-css-handoff` imposta quindi `link.sheet.disabled = true` sul `<link>` renderizzato dal server con lo stesso href, così una copia obsoleta delle regole non può sovrascrivere le tue modifiche HMR. L'elemento `<link>` resta nel DOM, quindi un `<head>` React idratato non vede alcuna modifica.
- Quando modifichi un CSS, `tuvix:dev-css-handoff` esclude il foglio di stile `?direct` dall'aggiornamento HMR. Vite aggiorna allora il suo `<style>` senza ricaricare la pagina e senza sostituire il `<link>`. Valgono due limiti:
  - Una modifica a un CSS Module cambia i nomi di classe con hash, quindi l'HMR dell'island stessa (React Fast Refresh, Vue) deve renderizzarla di nuovo.
  - Un'island il cui JavaScript la pagina non ha ancora caricato mantiene il foglio di stile del server finché non ricarichi.
- `modulepreload` è sempre vuoto in dev.
- `getAssets` comunica con il dev server nello stesso processo Node. Funziona con `ssrLoadModule` e con il module runner predefinito di Vite, e continua a funzionare dopo `server.restart()`.

## Casi limite

- Una entry che non è né un input di build né un target `import()` della build client viene rifiutata con `[tuvix] "<key>" is not an entry or a dynamically imported module in <manifest>`. Aggiungi l'island a `build.rollupOptions.input`, oppure caricala con `import()` dal codice client.
- Un manifest del client mancante fa fallire la build SSR con `[tuvix] No client manifest in <dir>`. Esegui prima la build del client, o correggi `clientOutDir`.
- In dev, `getAssets` viene rifiutata con `found no running Vite dev server with the tuvix() plugin in this process` quando il tuo codice SSR gira in un altro processo o in un runtime worker, o dopo la chiusura del dev server.
- Nella build browser di `virtual:tuvix/assets`, `getAssets` viene rifiutata con `runs during server rendering only`. Il bundle client non può conoscere il proprio manifest.
- In dev il walker non scende nei moduli sotto `/node_modules/`. Un foglio di stile che il tuo codice importa da un pacchetto viene raccolto; un foglio di stile che un pacchetto importa dal proprio JavaScript no.
- Una `base` relativa come `'./'` produce URL relativi, che si rompono sulle route annidate. Usa una base assoluta.
- Svelte: mantieni il valore predefinito `emitCss: true` di `vite-plugin-svelte`. Con `compilerOptions.css: 'injected'` gli stili vivono dentro il JavaScript e il plugin non trova alcun foglio di stile da collegare.

## Cosa non fa

- Non scrive tag nel tuo HTML. Decidi tu dove va l'output di `renderAssetTags`.
- Non segue le catene di `import()`. Passa i moduli lazy renderizzati sul server come entry a sé.
- Non supporta un nome personalizzato per il file manifest (`build.manifest: 'name.json'`). Usa `true`.
- Non renderizza le island e non ne esegue la hydration. Abbinalo a un adapter come [`@tuvix.js/react`](/it/packages/react) (`TuvixIsland`), [`@tuvix.js/vue`](/it/packages/vue) o [`@tuvix.js/svelte`](/it/packages/svelte).

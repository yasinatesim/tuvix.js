# @tuvix.js/vite

> Plugin Vite che inserisce il CSS delle island e i link modulepreload nel `<head>` renderizzato sul server

Fa parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentazione completa: [tuvix.js.org/it/packages/vite](https://tuvix.js.org/it/packages/vite).

Quando renderizzi sul server l'island di una micro app, il markup arriva al browser prima del suo JavaScript. Vite include il CSS dell'island (CSS Modules, `<style>` delle SFC Vue, stili Svelte) dentro quel JavaScript, quindi il primo paint mostra markup senza stili. Questo plugin indica al tuo server quali fogli di stile servono a ogni island, così puoi collegarli nel `<head>`.

Usalo quando renderizzi le island sul server con Vite. Non ti serve se le tue island vengono renderizzate solo sul client.

## Installazione

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

Richiede Vite 6 o 7. La suite di test gira su Vite 6.

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

Richiedi gli asset nella tua entry server e stampali nel `<head>`:

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

Esegui prima la build del client, poi quella del server:

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?: TuvixViteOptions): Plugin[]`

Restituisce tre plugin: `tuvix:assets` (fornisce `virtual:tuvix/assets`), `tuvix:client-build-info` (solo nelle build; scrive `.vite/tuvix-client.json` nella build client) e `tuvix:dev-css-handoff` (solo dev server).

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | Directory di output della build client, relativa alla root di Vite o assoluta. La build SSR legge `<clientOutDir>/.vite/manifest.json`, poi `<clientOutDir>/manifest.json`. |
| `base` | `string` | `base` di Vite | Base pubblica da cui il browser carica gli asset client. Impostala quando il client viene servito da una base diversa da quella del bundle server. |

Per TanStack Start o vinxi, punta il plugin all'output e alla base del router client:

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries: string[]): Promise<TuvixAssets>`

Da `virtual:tuvix/assets`. Passa i moduli entry delle island come percorsi relativi alla root di Vite, per esempio `'src/islands/footer/index.ts'`. Un `./` o `/` iniziale viene ignorato. Con più entry, `getAssets` unisce le liste nell'ordine delle entry ed elimina i duplicati. Solo server.

### `renderAssetTags(assets: TuvixAssets): string`

Da `virtual:tuvix/assets`. Restituisce i tag `<link rel="stylesheet">` per `css`, poi i tag `<link rel="modulepreload" crossorigin>` per `modulepreload`. Esegue l'escape dei valori degli attributi e funziona sia sul server sia nel browser.

Se il tuo `<head>` è un componente React, renderizza tu le liste:

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

| Tipo | Significato |
| --- | --- |
| `TuvixViteOptions` | Opzioni di `tuvix()`. |
| `TuvixAssets` | `{ css: string[]; modulepreload: string[] }`. `css` è in ordine di cascata; `modulepreload` è vuoto in dev. |

## Build di produzione

- Il plugin attiva `build.manifest` nella build client, a meno che tu non imposti `build.manifest` da solo.
- Nella build SSR legge il manifest del client e incorpora una mappa da ogni entry ed entry dinamica ai rispettivi URL.
- La build client scrive anche `.vite/tuvix-client.json` accanto al manifest. Il file associa ogni entry e ogni target di `import()` al chunk in cui Rollup l'ha messo. A volte Rollup unisce due entry dinamiche in un solo chunk, per esempio una pagina e un runtime di framework che un adapter carica con `import()`. Il manifest di Vite usa allora `_Page-<hash>.js` come chiave di quel chunk e non elenca nessuno dei due sorgenti, e il plugin usa `tuvix-client.json` per trovarlo. Senza quel file (un client compilato senza `tuvix()`), si risolvono solo i moduli che hanno una propria chiave nel manifest.
- Con `build.cssCodeSplit: false`, Vite scrive tutto il CSS in un unico `style-<hash>.css` che nessun chunk del manifest elenca. `getAssets` restituisce quel file per ogni entry.
- Per ogni entry raccoglie il chunk della entry e ogni chunk che importa staticamente, con il relativo CSS. Il CSS dei chunk importati viene prima del CSS della entry stessa, nell'ordine in cui Vite li carica.
- Salta i target di `import()`, perché Vite carica quei chunk e il loro CSS solo quando l'import viene eseguito. Se un modulo lazy viene renderizzato sul server, passa anche il suo percorso a `getAssets`.
- Gli URL iniziano con `base`. Quando il browser carica in seguito il chunk dell'island, l'helper di preload di Vite trova il `<link>` esistente e non ne aggiunge un secondo.

## Dev server

- `getAssets` percorre il grafo dei moduli client del dev server a partire da ogni entry lungo gli import statici e restituisce URL come `/src/islands/footer/footer.module.css?direct`. Vite risponde alle richieste `?direct` con CSS semplice.
- Anche il CSS che un'island raggiunge tramite un modulo virtuale funziona. Un foglio di stile virtuale come `\0virtual:theme.css` torna come `/@id/__x00__virtual:theme.css?direct`, quindi il plugin che lo fornisce deve caricare gli id che portano una query.
- Quando il JavaScript dell'island viene eseguito, Vite inietta un proprio `<style>` per ogni modulo CSS. Il plugin disattiva allora il `<link>` corrispondente renderizzato sul server tramite `link.sheet.disabled`, così una copia obsoleta delle regole non può sovrascrivere le tue modifiche HMR. L'elemento `<link>` resta nel DOM e un `<head>` React idratato non vede alcuna modifica.
- Quando modifichi un CSS, il plugin esclude il foglio di stile `?direct` dall'aggiornamento HMR. Vite aggiorna così il suo `<style>` senza ricaricare la pagina e senza sostituire il `<link>`. Una modifica a un CSS Module cambia i nomi di classe con hash, quindi deve rieseguire il render l'HMR dell'island stessa (React Fast Refresh, Vue). Un'island il cui JavaScript la pagina non ha ancora caricato mantiene il foglio di stile del server finché non ricarichi.
- `modulepreload` è sempre vuoto in dev.

## Casi limite

- `getAssets` rifiuta un percorso che non è né un input della build né un target di `import()` della build client. Aggiungi l'island a `build.rollupOptions.input`, oppure caricala con `import()` dal codice client.
- La build SSR fallisce con `[tuvix] No client manifest in <dir>` quando il manifest del client manca.
- In dev, `getAssets` richiede il dev server nello stesso processo Node (`ssrLoadModule` o il module runner predefinito di Vite). Rifiuta quando il codice SSR gira in un altro processo o in un runtime worker, oppure dopo la chiusura del dev server. Continua a funzionare dopo `server.restart()`.
- La build per browser di `virtual:tuvix/assets` esporta un `getAssets` che rifiuta, perché il bundle client non può conoscere il proprio manifest.
- In dev il walker non scende nei moduli sotto `/node_modules/`, quindi il CSS che un pacchetto importa dal proprio JavaScript non viene raccolto.
- Una `base` relativa come `'./'` produce URL relativi, che si rompono sulle route annidate. Usa una base assoluta.
- Svelte: mantieni il valore predefinito `emitCss: true` di `vite-plugin-svelte`. Con `compilerOptions.css: 'injected'` gli stili vivono dentro il JavaScript e il plugin non trova alcun foglio di stile da collegare.

## Cosa non fa

- Non scrive i tag nel tuo HTML. Scegli tu dove inserirli.
- Non segue le catene di `import()`.
- Non supporta un nome personalizzato per il file manifest (`build.manifest: 'name.json'`). Usa `true`.
- Non renderizza né idrata le island. Usa un adapter come `@tuvix.js/react` (`TuvixIsland`), `@tuvix.js/vue` o `@tuvix.js/svelte`.

## Licenza

MIT

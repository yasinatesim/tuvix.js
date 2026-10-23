# Risoluzione dei problemi

Ogni voce parte da ciò che vedi, poi spiega la causa e la soluzione.

## Svelte: onMount non viene mai eseguito, o mount() lancia lifecycle_function_unavailable

**Sintomo.** Un'island Svelte viene renderizzata ma le callback di `onMount` non scattano mai, oppure `mount()` di Svelte 5 lancia `lifecycle_function_unavailable`.

**Causa.** `svelte` distribuisce un runtime per il browser e uno per il server sotto lo stesso import. Il bundle client ha preso quello del server. Alcune configurazioni SSR (Vinxi, ambienti Vite personalizzati, Vitest in jsdom) risolvono il client senza la condizione di export `browser`, e l'ottimizzatore delle dipendenze di Vite esegue quindi il pre-bundle del runtime server. Nei devtools del browser vedi `svelte/src/index-server.js` (Svelte 5) o `svelte/src/runtime/ssr.js` (Svelte 4) al posto del file client.

**Soluzione.** Rimetti `browser` tra le condizioni di risoluzione del client, poi riavvia Vite con `--force` perché ricostruisca le dipendenze ottimizzate:

```ts
// vite.config.ts (the client build or client environment)
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  resolve: { conditions: ['browser', ...defaultClientConditions] },
});
```

Per Vitest con jsdom, aggiungi la condizione e metti Svelte inline così che Vite lo risolva:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['browser'] },
  test: { environment: 'jsdom', server: { deps: { inline: [/svelte/] } } },
});
```

Non escludere `svelte` da `optimizeDeps`: esbuild fallirebbe con "The entry point "svelte" cannot be marked as external".

## Vue: l'alias ~ non funziona nei file .vue

**Sintomo.** La build di produzione fallisce con `Rollup failed to resolve import "~/utils/x" from ".../Card.vue?vue&type=script..."`, mentre lo stesso import funziona nei file `.ts` e `import type` da `~/` funziona nei file `.vue`.

**Causa.** `vite-tsconfig-paths` applica gli alias solo ai file inclusi (`include`) nel suo tsconfig. Un tsconfig che include `**/*.ts` e `**/*.tsx` lascia fuori i file `.vue`. Gli import di soli tipi vengono rimossi prima della risoluzione, quindi non falliscono mai.

**Soluzione.** Includi i file `.vue` in quel tsconfig:

```json
{
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

oppure dichiara l'alias direttamente in Vite:

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
});
```

Usa l'estensione per editor Vue - Official (Volar). Vetur non capisce le macro di `<script setup>` né `moduleResolution: "Bundler"`.

## Angular 15-17: i clic non aggiornano la vista

**Sintomo.** Un'island Angular viene renderizzata, ma l'handler di un pulsante modifica un campo e il template non si aggiorna.

**Causa.** L'adapter esegue Angular senza zone.js. Angular 18+ pianifica da solo la change detection in modalità zoneless; su 15-17 l'adapter sostituisce `NgZone` con una zona che non fa nulla, e nessuno esegue la change detection dopo gli eventi DOM.

**Soluzione.** Chiama `detectChanges()` dopo la modifica:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-like',
  standalone: true,
  template: `<button (click)="like()">{{ likes }}</button>`,
})
export class LikeComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  likes = 0;

  like(): void {
    this.likes += 1;
    this.cdr.detectChanges();
  }
}
```

Oppure importa `zone.js` all'inizio della entry client e passa `zone: true` a `createAngularMicroApp`. Tieni zone.js fuori dal server: modifica il `Promise` globale e rompe `fetch` lato server.

## Mismatch di hydration causato dalle date

**Sintomo.** React segnala l'errore #418 (oppure Vue e Svelte registrano un mismatch di hydration) solo per alcuni utenti o solo vicino alla mezzanotte. Il diff mostra date che differiscono di un giorno, come `21 Mart 2026` contro `22 Mart 2026`.

**Causa.** Il server formatta le date nel suo fuso orario (di solito UTC) e il browser nel fuso dell'utente. `new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' })` senza `timeZone` produce un testo diverso sui due lati.

**Soluzione.** Passa un `timeZone` esplicito ovunque formatti date renderizzate dal server:

```ts
const format = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Istanbul',
});

console.log(format.format(new Date('2026-03-21T22:30:00Z'))); // 22 Mart 2026 on server and client
```

Lo stesso vale per `toLocaleString`, i tempi relativi ("3 ore fa") e qualsiasi cosa usi `Date.now()` durante il rendering.

## I dati di una richiesta compaiono in un'altra

**Sintomo.** Un'island renderizzata dal server mostra dati obsoleti, o dati della richiesta di un altro utente, e poi il client la renderizza di nuovo con un contenuto diverso.

**Causa.** Una cache a livello di modulo, per esempio `export const queryClient = new QueryClient()` importata da più micro app, vive quanto il processo server. Ogni richiesta legge e scrive la stessa istanza.

**Soluzione.** Sul server crea la cache per ogni richiesta e passa all'island ciò che le serve come props. Tieni un unico client a livello di modulo solo nel codice del browser.

```ts
import { QueryClient } from '@tanstack/query-core';

export function createRequestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
}
```

Vedi [Stato per richiesta](/it/guide/ssr-islands#per-request-state).

## Un'app con script modulo non si carica dopo l'unload

**Sintomo.** Dopo `orchestrator.unregister(name)` o `loader.unload(name)`, registrare e montare di nuovo la stessa app fallisce con `Module "<name>" loaded but no exports found`.

**Causa.** I browser eseguono uno script modulo una sola volta per URL. Il secondo `<script type="module" src="...">` con lo stesso URL non fa nulla, quindi l'app non chiama più `registerModule`.

**Soluzione.** Usa una entry con funzione loader, che mantiene il modulo nella cache dei moduli del bundler, oppure cambia l'URL (per esempio con una query string di versione):

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

## "loaded but no exports found"

**Sintomo.** `[Tuvix Loader] Module "dashboard" loaded but no exports found.`

**Causa e soluzione**, nell'ordine in cui controllarle:

1. Il nome con cui si registra il bundle è diverso dal nome registrato. `createReactMicroApp({ name: 'Dashboard' })` e `register({ name: 'dashboard' })` non corrispondono. Usa un'unica stringa.
2. Un bundle ES module è stato caricato come script classico. L'output ES di Vite termina in `.js`; aggiungi `type: 'module'` alla entry.
3. Il bundle esporta il modulo ma non lo registra mai. Usa un adapter o `defineMicroApp`, oppure chiama tu `registerModule(name, module)`.

## Container non trovato

**Sintomo.** `[Tuvix] Container "#app" not found in DOM.`

**Causa.** L'orchestratore cerca il container quando monta l'app. Il componente di route di un router esterno potrebbe non averlo ancora renderizzato.

**Soluzione.** Tieni i container in un layout che esiste prima della navigazione, oppure ospita quell'app con `TuvixIsland` dentro il componente di route. Vedi [Router esterno](/it/guide/external-router#containers-rendered-by-routes).

## Primo paint senza stili

**Sintomo.** Con JavaScript disattivato, o per un istante su connessioni lente, le island renderizzate dal server compaiono senza il loro CSS.

**Causa.** Vite inietta da JavaScript i CSS Modules, i `<style>` di Vue e gli stili di Svelte. L'HTML del server non collega nessuno di questi.

**Soluzione.** Aggiungi `tuvix()` da `@tuvix.js/vite` alla configurazione di Vite e stampa `renderAssetTags(await getAssets([...]))` dentro `<head>`. Vedi [Island SSR](/it/guide/ssr-islands).

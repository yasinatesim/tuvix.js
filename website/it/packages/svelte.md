---
title: '@tuvix.js/svelte'
---

<PackageHeader
  name="@tuvix.js/svelte"
  title="Binding per Svelte"
  description="Trasforma un componente Svelte 3, 4 o 5 in una micro app Tuvix.js: un'istanza per container, aggiornamento delle props sul posto, hydration del markup del server e rendering lato server con CSS."
  icon="🔥"
  npm="true"
/>

## Installazione

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

Il range della peer dependency copre Svelte 3, 4 e 5. Il pacchetto ha due entry: `@tuvix.js/svelte` per il browser e `@tuvix.js/svelte/server` per il rendering lato server.

## Quando usarlo

Usa questo pacchetto quando un componente Svelte deve girare come micro app Tuvix.js: l'orchestratore lo monta in un container su una route, gli passa le props, le aggiorna e lo smonta quando la route cambia. Copre anche le island: esegui il rendering del componente sul server, inserisci l'HTML nella pagina e il client lo idrata.

Non ti serve per una pagina che Svelte gestisce interamente (SvelteKit). In quel caso Svelte si monta da solo e non c'è nessun orchestratore con cui comunicare.

## Avvio rapido

Un componente Svelte 5 con props:

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { name, theme = 'light' }: { name: string; theme?: string } = $props();
</script>

<p class={theme}>Hello {name}</p>
```

L'entry della micro app lo avvolge. Se passi `SvelteMap`, gli aggiornamenti delle props rieseguono il rendering del componente sul posto:

```ts
// profile-app.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

La shell registra l'app e avvia l'orchestratore:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
  props: { name: 'Ada' },
});

await orchestrator.start();

// Later: the component re-renders in place, no remount.
await orchestrator.updateAppProps('profile', { name: 'Grace', theme: 'dark' });
```

Il bundle client deve risolvere `svelte` nella sua build per browser. `@sveltejs/vite-plugin-svelte` lo fa per te. Se la tua configurazione scarta la export condition `browser`, `mount()` di Svelte 5 lancia `lifecycle_function_unavailable` e `onMount` non viene mai eseguito.

## API

### `createSvelteMicroApp`

```ts no-check
function createSvelteMicroApp(config: SvelteMicroAppConfig): MicroAppModule;
```

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Nome dell'app. L'adapter registra il modulo con questo nome tramite `registerModule` di `@tuvix.js/loader`. |
| `App` | `unknown` | obbligatorio | Componente radice: un componente Svelte 5 compilato (una funzione) o una classe di componente Svelte 3/4. |
| `bootstrap` | `() => void \| Promise<void>` | nessuno | Setup eseguito una sola volta. Il `bootstrap()` del modulo lo attende. |
| `ssr` | `boolean` | `false` | Idrata il markup del server quando il container contiene elementi o testo non composto solo da spazi. Altrimenti esegue un nuovo rendering. |
| `SvelteMap` | classe `SvelteMap` da `svelte/reactivity` | nessuno | Solo Svelte 5. Con questa opzione, `update()` riesegue il rendering sul posto; senza, un `update()` su Svelte 5 rimonta il componente. Svelte 3/4 la ignorano. |

Al primo mount l'adapter importa `svelte` e controlla se esiste un export `mount`. Mette in cache il risultato per la pagina.

- **Svelte 5** (`mount` esiste): esegue il rendering con `mount()`, idrata con `hydrate()`, smonta con `unmount()`. Il funzionamento di `update()` dipende da `SvelteMap`:
  - Con `SvelteMap`, il componente riceve un oggetto props basato su una `SvelteMap`. `update()` scrive i nuovi valori in quella map, quindi le parti del template che leggono una prop modificata rieseguono il rendering e il componente mantiene i suoi nodi DOM e il suo stato. Funziona per i componenti con `$props()` e per i componenti legacy con `export let` compilati da Svelte 5.
  - Senza, `update()` smonta l'istanza, svuota il container, monta una nuova istanza con le nuove props e invia di nuovo `tuvix:mounted` con `hydrated: false`. Nodi DOM, focus e stato del componente vanno persi.
- **Svelte 3/4** (nessun `mount`): `new App({ target, props, hydrate })`, `$set()` e `$destroy()`.

Il modulo restituito lavora per container. Ogni container riceve la propria istanza, quindi un modulo può eseguire il rendering in tre container contemporaneamente.

- `mount({ container, props })` svuota il container (a meno che non esegua la hydration), esegue il rendering, lancia le callback `onMount` e gli effect, poi invia `tuvix:mounted` sul container con `hydrated: true | false`. In caso di errore invia `tuvix:error` e rifiuta con l'errore originale.
- `update({ props, container? })` aggiorna l'istanza in `container`, oppure tutte le istanze se ometti `container`. Ogni aggiornamento sostituisce l'intero set di props: una chiave assente nelle nuove props torna al default del componente su Svelte 5 e diventa `undefined` su Svelte 3/4.
- `unmount({ container })` distrugge l'istanza, svuota il container e invia `tuvix:unmounted`.

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import { onLifecycle } from '@tuvix.js/loader';
import Cart from './Cart.svelte';

const cart = createSvelteMicroApp({ name: 'cart', App: Cart, SvelteMap });

onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} mounted`, { hydrated });
});

const header = document.querySelector<HTMLElement>('#cart-header')!;
const sidebar = document.querySelector<HTMLElement>('#cart-sidebar')!;

await cart.mount({ container: header, props: { compact: true } });
await cart.mount({ container: sidebar, props: { compact: false } });

// Updates the sidebar instance only.
await cart.update?.({ props: { compact: true }, container: sidebar });
```

### `createSsrSvelteMicroApp`

```ts no-check
function createSsrSvelteMicroApp(config: Omit<SvelteMicroAppConfig, 'ssr'>): MicroAppModule;
```

Equivale a `createSvelteMicroApp({ ...config, ssr: true })`. Usalo sul client per le island di cui il server ha eseguito il rendering con `renderSvelteToString` o `renderSvelte`.

- **Svelte 5**: `hydrate(App, { target, props })`. Il markup deve provenire da `svelte/server`, perché la hydration legge i commenti marcatori (`<!--[-->`) che scrive.
- **Svelte 3/4**: `new App({ target, props, hydrate: true })`. Compila il componente con `hydratable: true`.

La hydration mantiene i nodi DOM del server e vi collega gli event handler. Un container che contiene solo spazi o commenti riceve un nuovo rendering.

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelteToString(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<string>;
```

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | nessuno | `render` da `svelte/server`. Senza questa opzione l'adapter importa `svelte/server` a runtime. |

Esegue il rendering del componente sul server e restituisce i suoi tag `<style>` seguiti dal suo markup. Inserisci la stringa nel container dell'island e montala con `createSsrSvelteMicroApp`. La stringa esclude il contenuto di `<svelte:head>`; usa `renderSvelte` quando ti serve.

La funzione sceglie la versione di Svelte a runtime. Se passi `render`, segue sempre il percorso Svelte 5 e chiama `render(App, { props })`. Senza, l'adapter importa `svelte`: se quel modulo esporta `mount`, carica `svelte/server` ed esegue il rendering con Svelte 5. Altrimenti chiama `App.render(props)` (Svelte 3/4, compilato con `generate: 'ssr'`) e avvolge `css.code` in un tag `<style>`. L'adapter non decide mai controllando `App.render`, perché i componenti Svelte 5 compilati con `dev: true` (vite-plugin-svelte in modalità serve) contengono uno stub `App.render` che lancia un errore.

Chiamala da una funzione server, non da codice che gira anche nel browser. Nel browser restituisce `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooterIsland(): Promise<string> {
  const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
  return `<footer id="footer" data-tuvix-app="footer">${html}</footer>`;
}
```

### `renderSvelte`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelte(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<SvelteRenderResult>;
```

Accetta gli stessi argomenti e le stesse opzioni di `renderSvelteToString` e restituisce le parti separate:

| Campo | Significato |
| --- | --- |
| `html` | Markup del componente. L'output di Svelte 5 contiene i commenti per la hydration. |
| `head` | Contenuto di `<svelte:head>` senza i tag `<style>` del componente. Inseriscilo nell'`<head>` del documento. |
| `css` | CSS del componente come tag `<style>`, oppure `''` quando il compilatore non ne ha emesso. |

Nel browser tutti e tre i campi valgono `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Article from './Article.svelte';

export async function renderArticlePage(slug: string): Promise<string> {
  const { html, head, css } = await renderSvelte(Article, { slug }, { render });
  return `<!doctype html>
<html>
  <head>${head}${css}</head>
  <body>
    <main id="article" data-tuvix-app="article">${html}</main>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
}
```

### Tipi

| Tipo | Entry | Significato |
| --- | --- | --- |
| `SvelteMicroAppConfig` | `@tuvix.js/svelte` | Opzioni di `createSvelteMicroApp`. |
| `SvelteProps` | `@tuvix.js/svelte` | `Record<string, unknown>`: le props che l'orchestratore passa al componente. |
| `RenderSvelteOptions` | `@tuvix.js/svelte/server` | `{ render?: SvelteServerRender }`. |
| `SvelteServerRender` | `@tuvix.js/svelte/server` | Forma di `render` di Svelte 5 da `svelte/server`. |
| `SvelteRenderResult` | `@tuvix.js/svelte/server` | `{ html, head, css }`, restituito da `renderSvelte`. |

## Rendering lato server

Un'island passa per tre fasi: rendering sul server, invio dell'HTML dentro il container, hydration sul client.

1. Chiama `renderSvelteToString` (o `renderSvelte`) in una funzione server e inserisci il risultato nell'elemento container.
2. Carica l'entry client, che esporta `createSsrSvelteMicroApp({ name, App })`.
3. L'orchestratore monta l'app nello stesso container. L'adapter trova il markup e lo idrata.

**CSS.** Svelte 5 inserisce il CSS del componente nell'output del rendering solo se compili con `css: 'injected'`. Con il default `css: 'external'`, il bundler scrive il CSS in un file e la stringa non contiene tag `<style>`. In Vite:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { css: 'injected' } })],
});
```

Se mantieni `css: 'external'`, collega il foglio di stile generato dall'head della pagina. [`@tuvix.js/vite`](/it/packages/vite) indica al tuo server quali fogli di stile servono all'entry di un'island.

**Una sola copia di Svelte.** Passa `render` da `svelte/server` quando il bundle server include Svelte (Nitro, Vinxi, una build SSR di Vite con `noExternal`). Così il componente e il renderer condividono una sola copia di Svelte. Senza questa opzione, l'adapter importa `svelte/server` a runtime, e questo può caricare una seconda copia da `node_modules`. Il renderer server di Svelte usa controlli `instanceof` e fallisce quando il componente e il renderer provengono da copie diverse.

## Casi limite

- `mount` su un container che contiene già un'istanza dello stesso modulo smonta prima la vecchia istanza.
- `unmount` chiamato mentre `mount` sta ancora caricando `svelte` attende la fine del mount, poi distrugge l'istanza. Non resta nessun componente orfano.
- `unmount` su un container che questo modulo non ha mai montato, o il cui mount è fallito, non fa nulla: il container mantiene i suoi figli e non viene inviato nessun evento.
- `update` chiamato mentre un mount è in corso lo attende, poi applica le props. Un update per un mount fallito non fa nulla.
- Su Svelte 3/4, una prop assente nelle nuove props diventa `undefined`. Il default di `export let name = 'x'` non viene ripristinato. Su Svelte 5 si applica il default, con o senza `SvelteMap`.
- L'adapter non importa `svelte/reactivity` da solo. Svelte 3/4 non hanno questo modulo e un bundler non riuscirebbe a fare la build di un'app Svelte 3/4 che lo referenzia, quindi l'import sta nella tua entry Svelte 5.
- Un remount di Svelte 5 (senza `SvelteMap`) invia di nuovo `tuvix:mounted` ma nessun `tuvix:unmounted` nel mezzo. Se il nuovo rendering lancia un errore, `update()` rifiuta con quell'errore e la vecchia istanza è già stata rimossa.
- Senza `ssr`, `mount` svuota il container prima del rendering, quindi i placeholder di caricamento scompaiono.
- Con `ssr`, l'adapter esegue la hydration quando il container ha un elemento o testo non composto solo da spazi. Commenti e spazi da soli causano un nuovo rendering.
- L'adapter rileva la versione di Svelte una volta per pagina. Se `import('svelte')` fallisce, il mount successivo riprova.
- Un errore di import o di rendering di Svelte 5 sul server ti arriva come promise rifiutata. L'adapter non ricade su `App.render`.
- `render` di Svelte 5 può restituire una promise (rendering lato server asincrono). Entrambe le funzioni server la attendono.

## Cosa non fa

- Non compila i file `.svelte`. Lo fa il tuo bundler con `@sveltejs/vite-plugin-svelte` o `svelte/compiler`.
- Non controlla quale build di Svelte ha scelto il tuo bundler. Un bundle client che risolve `svelte` nella build server fallisce al mount.
- Passa solo props. Slot, snippet ed eventi dei componenti non hanno un canale dall'host. Usa [`@tuvix.js/event-bus`](/it/packages/event-bus) per comunicare tra app.
- Non scrive il contenuto di `<svelte:head>` nel documento. `renderSvelte` lo restituisce; il tuo server lo inserisce in `<head>`.
- Non collega il CSS compilato con `css: 'external'`. Vedi [`@tuvix.js/vite`](/it/packages/vite).
- Non attende i dati sul server. Caricali prima e passali come props.

## Migrazione dalla 0.4

- **Svelte 5 funziona.** Nella 0.4 l'adapter chiamava `new App()` su ogni componente, quindi i componenti Svelte 5 fallivano e `createSsrSvelteMicroApp` eseguiva il rendering di una seconda copia invece di idratare. Il mount non richiede modifiche al codice. Per aggiornare le props sul posto, passa `SvelteMap` da `svelte/reactivity` nella configurazione; senza, ogni update su Svelte 5 rimonta il componente.
- **Il container viene svuotato al mount.** Senza `ssr`, Svelte 3/4 aggiungeva il componente dopo l'eventuale markup già presente nel container. Ora l'adapter svuota prima il container. Se ti affidavi al markup che restava accanto al componente, spostalo fuori dal container.
- **Nessun fallback silenzioso sul server.** `renderSvelteToString` ricadeva su `App.render` quando `svelte/server` non si caricava. Ora segue il percorso Svelte 5 se passi `render` o se `svelte` esporta `mount`, chiama `App.render` solo su Svelte 3/4 e rifiuta in caso di errore di import o di rendering di Svelte 5. Le build di sviluppo di Svelte 5 nell'SSR di sviluppo di Vite seguono il percorso Svelte 5 anche se contengono uno stub `App.render`.
- **`unmount` su un container sconosciuto non fa nulla.** `unmount({ container })` su un container che il modulo non ha mai montato lo svuotava. Ora lascia il container intatto, come gli adapter per React, Vue e Angular.
- **Passa `render`.** Aggiungi `{ render }` da `svelte/server` come terzo argomento quando il bundle server include Svelte:

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

// 0.4: await renderSvelteToString(Footer, { year: 2026 });
const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
```

Vedi la [guida a Svelte](/it/guide/svelte) per un'app completa.

# Island SSR

Un'island è una micro app che il server renderizza in HTML dentro una pagina React e che il browser idrata con il proprio framework. Con `TuvixIsland` di `@tuvix.js/react`, un solo host React può contenere island Vue, Svelte, Angular e React. L'utente vede contenuto già con gli stili prima che venga eseguito qualsiasi JavaScript, e ogni island diventa interattiva quando il suo framework si carica.

## Cosa ti serve

| Elemento | Pacchetto | Dove viene eseguito |
| --- | --- | --- |
| Pagina host React con rendering lato server | la tua app (`react-dom/server`, TanStack Start, ...) | server + client |
| `TuvixIsland`, `TuvixReactApp` | `@tuvix.js/react` | server + client |
| Moduli delle island: `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`, `createSsrReactMicroApp` | adapter | client |
| `renderVueToString`, `renderSvelteToString`, `renderAngularToString` | `@tuvix.js/<adapter>/server` | solo server |
| `getAssets`, `renderAssetTags` | `@tuvix.js/vite` | solo server |

Non è coinvolto alcun orchestratore. `TuvixIsland` chiama da solo `mount`, `update` e `unmount` del modulo dell'island.

## Il percorso di una richiesta

```text
server                                         browser
──────                                         ───────
renderVueToString(Card, props) ─┐
                                ▼
<TuvixIsland ssrHtml={html}> renders           HTML arrives, CSS links in <head>
<div data-tuvix-app="card">…html…</div>   ──►  apply → styled first paint
getAssets([...]) → <link rel=stylesheet>
                                               hydrateRoot(host)
                                               TuvixIsland reads its innerHTML from the DOM
                                               React leaves the island's children alone
                                               useEffect → card.mount({ container, props })
                                               Vue adapter: createSSRApp → hydrates in place
                                               tuvix:mounted { hydrated: true }
```

## 1. Configura Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [react(), vue(), svelte(), tuvix()],
});
```

Aggiungi `"@tuvix.js/vite/client"` a `compilerOptions.types` così TypeScript conosce `virtual:tuvix/assets`.

## 2. Crea i moduli delle island

Ogni island esporta un modulo creato con la variante `Ssr` del suo adapter. Questi file vengono eseguiti nel browser e non devono importare renderer server.

```ts
// src/islands/vue-card/index.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import VueCard from './VueCard.vue';

export const vueCard = createSsrVueMicroApp({ name: 'vue-card', App: VueCard });
```

```ts
// src/islands/svelte-counter/index.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Counter from './Counter.svelte';

// SvelteMap makes TuvixIsland prop changes update in place instead of remounting.
export const svelteCounter = createSsrSvelteMicroApp({ name: 'svelte-counter', App: Counter, SvelteMap });
```

```ts
// src/islands/angular-contact/index.ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { ContactComponent } from './contact.component';

export const angularContact = createSsrAngularMicroApp({ name: 'angular-contact', component: ContactComponent });
```

## 3. Renderizza l'HTML delle island sul server

Tieni i renderer server in un modulo importato solo da codice server:

```ts
// src/server/render-islands.ts (server only)
import { renderVueToString } from '@tuvix.js/vue/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import { renderAngularToString } from '@tuvix.js/angular/server';
import { render } from 'svelte/server';
import VueCard from '../islands/vue-card/VueCard.vue';
import Counter from '../islands/svelte-counter/Counter.svelte';
import { ContactComponent } from '../islands/angular-contact/contact.component';

export async function renderIslands(): Promise<Record<string, string>> {
  const [card, counter, contact] = await Promise.all([
    renderVueToString(VueCard, { title: 'Hello' }),
    renderSvelteToString(Counter, { start: 3 }, { render }),
    renderAngularToString(ContactComponent, { appId: 'contact', props: { heading: 'Write to us' } }),
  ]);
  return { 'vue-card': card, 'svelte-counter': counter, 'angular-contact': contact };
}
```

Le funzioni `render*ToString` sono solo server. Nel browser restituiscono `''`. Chiamale da codice che non viene mai eseguito nel browser: la tua entry del server, una route API o una server function del framework come `createServerFn` di TanStack Start. Non chiamarle da un route loader isomorfo. Quel loader viene eseguito anche nel browser durante la navigazione lato client, dove riceve `''`, e il tuo bundler invia al client il renderer server di Vue, Svelte o Angular perché il loader lo importa.

## 4. Inserisci le island nella pagina

```tsx
// src/pages/Home.tsx
import { createContext, useContext } from 'react';
import { TuvixIsland } from '@tuvix.js/react';
import { vueCard } from '../islands/vue-card';
import { svelteCounter } from '../islands/svelte-counter';

// Filled by the server entry; empty on the client.
export const IslandHtml = createContext<Record<string, string>>({});

export function Home() {
  const html = useContext(IslandHtml);
  return (
    <main>
      <TuvixIsland
        name="vue-card"
        app={vueCard}
        props={{ title: 'Hello' }}
        ssrHtml={html['vue-card']}
        fallback={<p>The card failed to load.</p>}
      />
      <TuvixIsland name="svelte-counter" app={svelteCounter} props={{ start: 3 }} ssrHtml={html['svelte-counter']} />
    </main>
  );
}
```

Passa le stesse props sul server e sul client. Se il server ha renderizzato `{ start: 3 }` e il client monta con `{ start: 4 }`, il framework rileva un mismatch di hydration.

## 5. Collega il CSS delle island nell'head

Vite inietta i CSS Modules, i blocchi `<style>` di Vue e gli stili di Svelte da JavaScript. Senza aiuto, l'HTML del server raggiunge il browser prima di quel JavaScript, e il primo paint è privo di stili (FOUC). `getAssets` restituisce gli URL dei fogli di stile di cui una entry ha bisogno, così il server può collegarli in `<head>`:

```tsx
// src/entry-server.tsx
import { renderToString } from 'react-dom/server';
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { Home, IslandHtml } from './pages/Home';
import { renderIslands } from './server/render-islands';

export async function render(): Promise<string> {
  const [islandHtml, assets] = await Promise.all([
    renderIslands(),
    getAssets(['src/entry-client.tsx', 'src/pages/Home.tsx']),
  ]);

  const body = renderToString(
    <IslandHtml.Provider value={islandHtml}>
      <Home />
    </IslandHtml.Provider>,
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <title>Home</title>
    ${renderAssetTags(assets)}
  </head>
  <body>
    <div id="app">${body}</div>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>`;
}
```

- Passa percorsi di moduli relativi alla root di Vite. In una build di produzione ogni percorso deve essere un input della build o il target di un `import()` nella build client; qualsiasi altro percorso viene rifiutato.
- Se Rollup unisce due target di `import()` in un solo chunk, il manifest elenca quel chunk con il suo nome con hash invece del percorso del tuo modulo, e `getAssets` rifiuta quel percorso. L'esempio incontra questo caso quando `@angular/core` finisce in un chunk di pagina, e lo risolve con `manualChunks` che danno a `@angular/core` un chunk proprio.
- `getAssets` segue gli import statici e salta i target di `import()`. Una pagina o un'island importata in modo lazy che viene renderizzata sul server ha bisogno di una propria voce nella lista.
- In dev restituisce URL CSS con `?direct`, e quando Vite inietta il proprio `<style>` disabilita il `<link>` corrispondente, così le modifiche HMR vengono applicate.
- Le island Angular portano gli stili inline: `renderAngularToString` mette i tag `<style>` del componente davanti al markup.
- Svelte: compila con `css: 'injected'` (stili inline nell'HTML dell'island) oppure mantieni `emitCss` e collegali con `getAssets`. Non entrambi.

## 6. Esegui la hydration sul client

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Home } from './pages/Home';

hydrateRoot(document.getElementById('app')!, <Home />);
```

Il client renderizza senza l'HTML delle island. Durante la hydration ogni `TuvixIsland` legge il proprio markup dalla pagina, React conserva quei nodi e il modulo dell'island li idrata.

## Perché l'HTML non viene inviato due volte

Un'island ingenua passa l'HTML del server come prop su entrambi i lati. React ha quindi bisogno della stringa sul client per idratare `dangerouslySetInnerHTML`, e l'HTML viaggia una volta nel documento e una seconda volta nei dati di hydration. Inoltre ogni re-render del genitore con un nuovo oggetto `{ __html }` fa riassegnare `innerHTML` a React, il che cancella il DOM e i listener collegati dal framework dell'island.

`TuvixIsland` evita entrambi i problemi:

- Sul server scrive `ssrHtml` dentro `<div data-tuvix-app={name} data-tuvix-island={id}>`.
- Durante la hydration trova quell'elemento tramite l'attributo `data-tuvix-island` basato su `useId` e legge `innerHTML` una sola volta. Il client non ha mai bisogno di `ssrHtml`.
- Conserva l'oggetto `{ __html }` nello stato, quindi i render successivi passano a React lo stesso oggetto e React non riscrive mai i figli dell'island.

Cosa fa il tuo framework con i dati dei loader è una questione separata. Se restituisci l'HTML delle island da un loader di TanStack Start o Remix, il framework serializza anche il risultato di quel loader nella pagina. Passa l'HTML all'island tramite qualcosa che il framework non serializza, come un context React riempito dalla tua entry del server, come nel passo 4.

## Stato per richiesta {#per-request-state}

Il codice server gestisce molte richieste in un solo processo. Tutto ciò che crei a livello di modulo persiste tra tutte le richieste.

- Crea una cache di dati come il `QueryClient` di TanStack Query per ogni richiesta, non a livello di modulo. Un client a livello di modulo sul server mescola i dati tra richieste e utenti, e le sue voci obsolete causano mismatch di hydration.
- Passa i dati di cui un'island ha bisogno come props, dalla cache della richiesta stessa. Il modulo dell'island crea il proprio stato lato client al mount.
- Formatta date e numeri con un `timeZone` e una locale espliciti. Il server di solito gira in UTC e il browser nel fuso orario dell'utente; `Intl.DateTimeFormat` senza `timeZone` renderizza un giorno diverso vicino alla mezzanotte e rompe la hydration.

```tsx
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';

declare function createRequestCache(): { dehydrate(): unknown };
declare function Page(props: { data: unknown }): ReactElement;

export function renderRequest(): string {
  const cache = createRequestCache(); // one per request
  return renderToString(<Page data={cache.dehydrate()} />);
}
```

## Head e meta tag sono compito dell'host

Le island renderizzano dentro un `<div>` nel body. Non devono emettere `<title>`, `<meta>` o `<link rel=canonical>`. Impostali nell'host (l'API head del tuo framework o il template HTML). Per i componenti Svelte che usano `<svelte:head>`, chiama `renderSvelte` invece di `renderSvelteToString` e inserisci tu il suo output `head` nell'head del documento.

## Errori

- Se `mount` o `update` dell'island rifiuta, `TuvixIsland` renderizza invece `fallback`. L'adapter ha già inviato `tuvix:error`.
- Se un renderer server lancia un'eccezione, decide il tuo codice server: catturala e non passare `ssrHtml`, così l'island parte vuota e viene renderizzata sul client.
- `TuvixReactApp` avvolge il proprio componente in `<Suspense>`, quindi un errore di render sul server sostituisce solo quell'app con il suo `fallback`, e React la riprova sul client.

Osserva le island dal codice della pagina con `onLifecycle('mounted', ...)` e `onLifecycle('error', ...)`; vedi [Eventi del ciclo di vita](/it/guide/lifecycle-events).

## Progetto di esempio

`examples/with-ssr-islands` nel repository mette insieme tutto questo: un server Express + Vite con un host React 19, una card Vue 3, un contatore Svelte 5, un modulo di contatto Angular 20 senza zone (JIT; il compilatore si carica come chunk lazy), una newsletter `TuvixReactApp` e un'island che fallisce di proposito per mostrare il suo fallback. `src/server/render-islands.ts` contiene i renderer server, `src/entry-server.tsx` collega gli asset con `getAssets` e `src/runtime/islands.ts` reagisce agli eventi del ciclo di vita. L'island Angular riceve l'input `heading` dall'opzione `props` sul server e lo stesso oggetto sul client. Dalla root del repository, esegui `pnpm --filter with-ssr-islands dev` (porta 5186), oppure `build` e poi `start` (porta 5185; `PORT` la sovrascrive). Il README dell'esempio spiega ogni parte e le verifiche eseguite dalla sua spec Playwright.

## Cosa non fanno le island

- `TuvixIsland` non carica moduli tramite URL. Importa il modulo dell'island nel bundle dell'host.
- Non condivide lo stato tra le island. Usa le props, l'event bus o il tuo store.
- Le island Angular renderizzano di nuovo sopra il DOM del server invece di idratarlo in modo non distruttivo; vedi [Angular](/it/guide/angular).
- Niente di tutto questo funziona senza un passo di rendering sul server. Per island solo client, ometti `ssrHtml` e usa gli adapter non `Ssr`.

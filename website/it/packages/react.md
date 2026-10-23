---
title: '@tuvix.js/react'
---

<PackageHeader
  name="@tuvix.js/react"
  title="Binding per React"
  description="Trasforma un componente React in una micro app Tuvix.js e ospita qualsiasi micro app (Vue, Svelte, Angular, React, vanilla) dentro un albero React con rendering lato server e hydration."
  icon="⚛️"
  npm="true"
/>

## Installazione

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

Il pacchetto richiede React 18 o successivo (peer range `>=18.0.0` per `react` e `react-dom`). Dipende da `@tuvix.js/loader` e `@tuvix.js/event-bus`.

## Quando usarlo

Il pacchetto copre due direzioni:

- **React come micro app.** `createReactMicroApp` e `createSsrReactMicroApp` avvolgono un componente React nel modulo `{ bootstrap, mount, unmount, update }` che l'orchestratore e il loader si aspettano. Usali quando un'app React è una delle micro app caricate da una shell Tuvix.
- **React come host.** `TuvixIsland` monta qualsiasi modulo di micro app dentro una pagina React e mantiene intatto il suo DOM tra un re-render e l'altro. `TuvixReactApp` esegue il rendering di una micro app React inline nell'albero dell'host. Usali quando la tua shell è un framework SSR React come TanStack Start, Next.js o Remix.

Se la tua shell è HTML semplice senza React, ti serve solo la prima coppia più [`@tuvix.js/core`](/it/packages/core). Per una micro app Vue, Svelte o Angular, usa [`@tuvix.js/vue`](/it/packages/vue), [`@tuvix.js/svelte`](/it/packages/svelte) o [`@tuvix.js/angular`](/it/packages/angular) per creare il modulo; `TuvixIsland` può ospitarle tutte.

## Avvio rapido

Crea il modulo della micro app:

```tsx
// src/dashboard.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Registralo nella shell. L'orchestratore chiama `mount` quando la route corrisponde e `update` quando cambi le props:

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { userId: 'u_42' },
});

await orchestrator.start();

// Re-renders <Dashboard userId="u_43" />; component state survives.
await orchestrator.updateAppProps('dashboard', { userId: 'u_43' });
```

## API

### `createReactMicroApp`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| Opzione | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Nome con cui il modulo si registra tramite `registerModule` di `@tuvix.js/loader`. Gli eventi del ciclo di vita lo riportano. |
| `App` | `ComponentType<P>` | obbligatorio | Componente radice. Riceve le props di mount come proprie props, quindi un componente con props obbligatorie come `{ page: 'privacy' \| 'terms' }` supera il controllo dei tipi. |
| `bootstrap` | `() => void \| Promise<void>` | nessuno | Setup eseguito una sola volta. Il `bootstrap()` del modulo lo attende. |
| `ssr` | `boolean` | `false` | Idrata il markup del server con `hydrateRoot` quando il container contiene elementi o testo non composto da spazi. Un container con soli spazi o commenti riceve un nuovo render con `createRoot`. |

Il modulo restituito ha quattro metodi:

- `mount({ container, props })` crea una root React per quel container. Si risolve dopo che React ha eseguito il commit del primo render, poi invia `tuvix:mounted` sul container con `hydrated: true` o `false`. Se `App` va in suspend al primo render, `mount` attende che il contenuto venga applicato.
- `update({ props, container })` esegue di nuovo il render di `App` con `props` in quel container. Senza `container` esegue di nuovo il render in ogni container in cui il modulo è montato. React conserva lo stato dei componenti perché l'albero mantiene la sua forma.
- `unmount({ container })` smonta la root, svuota il container con `replaceChildren()` e invia `tuvix:unmounted`.
- `bootstrap()` esegue `config.bootstrap`.

Ogni container riceve la propria root, quindi un modulo può montarsi in più punti contemporaneamente:

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

const badge = createReactMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

Il modulo importa `react-dom/client` in modo lazy dentro `mount`. Un bundle server può importare il modulo (per esempio per condividere `App` con `TuvixReactApp`) senza includere il renderer client.

### `createSsrReactMicroApp`

```ts no-check
function createSsrReactMicroApp<P extends object = Record<string, unknown>>(
  config: Omit<ReactMicroAppConfig<P>, 'ssr'>
): MicroAppModule;
```

Equivale a `createReactMicroApp({ ...config, ssr: true })`. Opzioni: `name`, `App`, `bootstrap`, come nella tabella sopra.

Usalo sul client quando il container contiene già l'HTML che il server ha generato per lo stesso componente. L'albero che renderizza corrisponde a quello di `TuvixReactApp` (error boundary più `<Suspense>`), quindi idrata il markup di `TuvixReactApp` senza mismatch:

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export default createSsrReactMicroApp({ name: 'legal-app', App: LegalPage });
```

### `TuvixIsland`

```ts no-check
function TuvixIsland(props: TuvixIslandProps): ReactElement;
```

| Prop | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Nome della micro app. L'island lo scrive in `data-tuvix-app` e lo passa ad `app.mount`. |
| `app` | `MicroAppModule` | obbligatorio | Il modulo da montare: il risultato di `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp`, `createReactMicroApp`, delle loro varianti `createSsr*`, oppure un oggetto `{ mount, unmount, update? }` scritto a mano. |
| `props` | `Record<string, unknown>` | `{}` | Props per il modulo. L'island le confronta in modo shallow a ogni render. |
| `ssrHtml` | `string` | nessuno | L'HTML dell'island generato dal server, per esempio da `renderVueToString`. Passalo solo sul server. |
| `fallback` | `ReactNode` | `null` | Renderizzato al posto dell'island quando `mount` o `update` vengono rifiutati. |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Tag dell'elemento wrapper. |
| `className` | `string` | nessuno | Nome della classe dell'elemento wrapper. |

`TuvixIsland` ospita una micro app non React (o una React distribuita in un bundle separato) dentro una pagina React. Un bridge scritto a mano che renderizza <span v-pre>`<div dangerouslySetInnerHTML={{ __html: html }} />`</span> si rompe al primo re-render del genitore: React vede un nuovo oggetto `{ __html }`, assegna di nuovo `innerHTML` e distrugge il DOM e i listener che la micro app aveva collegato. `TuvixIsland` evita questo problema:

- **Render sul server.** Renderizza `<div data-tuvix-app={name} data-tuvix-island={id}>` con `ssrHtml` come HTML interno. `id` viene da `useId` di React, quindi server e client calcolano lo stesso valore.
- **Hydration.** Al primo render sul client trova il proprio elemento nella pagina tramite `data-tuvix-island` e rilegge l'HTML interno dal DOM. Non invii `ssrHtml` al client una seconda volta e il render del client corrisponde a quello del server.
- **DOM stabile.** L'island crea il suo oggetto `{ __html }` una sola volta, in `useState`. I render successivi riusano quell'oggetto, quindi React non riscrive mai i figli dell'island. I re-render del genitore conservano i nodi e i listener della micro app.
- **Mount.** Dopo il primo commit l'island chiama `app.mount({ container, props, name })`. Un modulo creato con `ssr: true` (`createSsrVueMicroApp` e simili) adotta lì il DOM del server. Un modulo senza SSR esegue un nuovo render nel container.
- **Props.** Quando `props` cambia in modo shallow (chiavi diverse, o un valore che non supera `Object.is`), l'island chiama `app.update({ props, container })`. Un modulo senza `update` riceve `unmount`, un container svuotato e un nuovo `mount`. Un oggetto letterale inline con gli stessi valori non attiva un aggiornamento.
- **Identità.** Un nuovo `name` o `app` smonta il vecchio modulo e monta quello nuovo.
- **Rimozione.** Quando l'island esce dall'albero chiama `app.unmount({ container })` e svuota il container.
- **Ordine.** Le chiamate a mount, update e unmount vengono eseguite una dopo l'altra. Un unmount che arriva mentre `mount` è in sospeso lo attende.
- **Errori.** Se `mount` o `update` vengono rifiutati, l'island renderizza `fallback` al posto del wrapper. Gli adapter inviano `tuvix:error` da soli; l'island non aggiunge alcun evento. Una successiva modifica di `name` o `app` riprova.

Una configurazione completa server e client con un footer Vue dentro un layout React:

```tsx
// src/Layout.tsx (shared by server and client)
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <main>
      <h1>Home</h1>
      <TuvixIsland
        name="footer"
        app={footer}
        props={{ year }}
        ssrHtml={footerHtml}
        fallback={<footer>© {year}</footer>}
        as="section"
        className="site-footer"
      />
    </main>
  );
}
```

```tsx
// src/entry-server.tsx (runs on the server only)
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const year = 2026;
  const footerHtml = await renderVueToString(Footer, { year });
  const body = renderToString(<Layout year={year} footerHtml={footerHtml} />);
  return `<!doctype html><html><body><div id="root">${body}</div><script type="module" src="/src/entry-client.tsx"></script></body></html>`;
}
```

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

// No footerHtml here: the island reads the footer HTML from the page.
hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

L'HTML del server arriva al browser prima di qualsiasi JavaScript, quindi il footer è visibile e già stilizzato al primo paint, a patto che tu stampi i suoi fogli di stile in `<head>`. [`@tuvix.js/vite`](/it/packages/vite) ti fornisce quei tag `<link>`.

### `TuvixReactApp`

```ts no-check
function TuvixReactApp<P extends object>(props: TuvixReactAppProps<P>): ReactElement;
```

| Prop | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Nome della micro app, scritto in `data-tuvix-app`. Deve coincidere con il `name` che passi a `createSsrReactMicroApp`. |
| `App` | `ComponentType<P>` | obbligatorio | Componente da renderizzare. |
| `fallback` | `ReactNode` | `null` | Mostrato mentre `App` è in suspend e dopo che ha lanciato un errore. |
| altre props | `P` | richieste da `P` | Passate ad `App`. |

`TuvixReactApp` renderizza una micro app React inline, come parte dell'albero React dell'host, così il tuo framework SSR ne genera l'HTML. Produce `<div data-tuvix-app={name}>` e avvolge `App` in un error boundary e in un `<Suspense fallback>`:

- **Gli errori sul server restano locali.** Un'eccezione dentro `App` durante il rendering lato server fa sì che React renderizzi `fallback` solo per questa app. Il resto della pagina viene renderizzato e React riprova `App` sul client.
- **Gli errori sul client restano locali.** L'error boundary intercetta gli errori di render sul client, mostra `fallback` e invia `tuvix:error` sul wrapper.
- **Eventi del ciclo di vita.** Dopo il primo commit invia `tuvix:mounted`. `hydrated` vale `true` quando il wrapper proviene dall'HTML del server. Quando il componente esce dall'albero invia `tuvix:unmounted` prima che React stacchi il wrapper, così un listener su `document` lo riceve. Se un boundary `<Suspense>` già visibile va di nuovo in suspend, l'app segnala `unmounted`, poi `mounted` quando il contenuto torna.

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal-app"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

Per ospitare una micro app Vue, Svelte, Angular o vanilla, usa `TuvixIsland`.

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): void;
```

Iscrive `handler` a `event` su `bus` in un effect e annulla l'iscrizione allo smontaggio. L'hook conserva l'ultimo `handler` in un ref, quindi un handler che legge lo stato aggiornato non si iscrive di nuovo a ogni render. Un nuovo `bus` o `event` rinnova l'iscrizione. L'iscrizione esiste solo sul client; gli effect non vengono eseguiti durante il rendering lato server.

Gli adapter non passano il bus dell'orchestratore ad `App`. L'orchestratore usa `getGlobalBus()` a meno che tu non gli abbia passato le opzioni `eventBus`, quindi leggi il bus da lì:

```tsx
import { useState } from 'react';
import { useTuvixBus } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function CartIcon() {
  const [count, setCount] = useState(0);

  useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
    setCount(items.length);
  });

  return <span>{count}</span>;
}
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): T;
```

| Argomento | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `initialProps` | `T` | obbligatorio | Valore iniziale. L'hook lo legge al primo render e ignora le modifiche successive. |
| `bus` | `IEventBus` | nessuno | Bus su cui restare in ascolto. Senza di esso l'hook restituisce `initialProps` invariato. |
| `updateEvent` | `string` | `'tuvix:props:update'` | Evento il cui payload l'hook unisce alle props correnti (`{ ...prev, ...payload }`). |

Né l'orchestratore né gli adapter emettono `tuvix:props:update`. Lo emetti tu. Un modulo creato con `createReactMicroApp` non ha bisogno di questo hook per le props dell'orchestratore: `update({ props })` esegue di nuovo il render di `App` con le nuove props.

```tsx
import { useTuvixProps } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function ThemeLabel() {
  const props = useTuvixProps({ theme: 'light' }, getGlobalBus());
  return <p>Theme: {props.theme}</p>;
}

// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
```

### Tipi

| Tipo | Significato |
| --- | --- |
| `ReactMicroAppConfig<P>` | Configurazione di `createReactMicroApp`: `name`, `App`, `bootstrap?`, `ssr?`. |
| `TuvixIslandProps` | Props di `TuvixIsland`: `name`, `app`, `props?`, `ssrHtml?`, `fallback?`, `as?`, `className?`. |
| `TuvixReactAppProps<P>` | Props di `TuvixReactApp`: `name`, `App`, `fallback?`, più le props di `App`. |

## Casi limite

- **Il primo render lancia un errore.** `mount` viene rifiutato con l'errore, smonta la root, svuota il container e invia `tuvix:error`. Nella 0.4 `mount` si risolveva e l'errore arrivava al gestore degli errori della root di React.
- **Un render successivo lancia un errore.** L'error boundary svuota l'app e invia `tuvix:error`. La pagina host continua a funzionare. L'app resta vuota finché non la smonti e la monti di nuovo; `update` non la ripristina.
- **Unmount durante il mount.** Un `unmount` che arriva mentre `mount` sta ancora caricando `react-dom/client` o attende il primo commit lo aspetta, lascia il container vuoto e non invia alcun evento `mounted`.
- **Due mount nello stesso container.** Un secondo `mount` su un container che il modulo occupa già smonta la vecchia root, invia `tuvix:unmounted`, poi esegue un nuovo render con le nuove props e invia `tuvix:mounted`. Lo stato dei componenti si azzera. Gli adapter Vue, Svelte e Angular fanno lo stesso. Chiama `update` per conservare lo stato.
- **Container sconosciuto.** `unmount` e `update` su un container in cui il modulo non è mai stato montato non fanno nulla.
- **Le props vengono sostituite.** L'`update` del modulo renderizza `App` con le props che passi e nient'altro. `orchestrator.updateAppProps` unisce le nuove props a quelle registrate prima di chiamare `update`.
- **Container con soli spazi e `ssr: true`.** Il modulo esegue un nuovo render, perché `hasServerMarkup` ignora il testo composto da spazi e i commenti.
- **Island rimossa da React.** React stacca l'elemento dell'island prima che il modulo segnali `tuvix:unmounted`. `emitLifecycle` invia quindi l'evento su `document` invece che sull'elemento staccato, così un listener su `document` (o `onLifecycle` di `@tuvix.js/loader`) lo riceve comunque, con `detail.container` che indica l'elemento rimosso. Un listener sul container stesso o su un antenato non lo riceve. `isMounted(name)` resta `true` finché l'app è montata in un altro container e diventa `false` dopo lo smontaggio dell'ultimo.
- **Island dentro `<StrictMode>` in sviluppo.** React esegue l'effect di mount, il suo cleanup e di nuovo l'effect. L'island mette in coda le chiamate al modulo e salta la prima esecuzione perché il suo cleanup è già stato eseguito, quindi il modulo si monta una sola volta e adotta il DOM del server.
- **Nuova app dopo un mount fallito.** Quando `mount` viene rifiutato, l'island scarta il suo HTML del server. Se poi passi un `app` o un `name` diverso, il nuovo modulo si monta in un elemento vuoto invece di adottare il markup dell'app fallita.
- **Modifica di `ssrHtml` sull'island.** L'island legge `ssrHtml` solo al primo render. Passa i nuovi contenuti tramite `props`.
- **Stesso nome due volte.** `registerModule` conserva l'ultimo modulo creato con un dato nome.

## Cosa non fa

- Non carica moduli da URL. Importa il modulo, oppure lascia che [`@tuvix.js/core`](/it/packages/core) lo carichi tramite una `entry`.
- Non renderizza una micro app in una stringa. Sul server usa `renderToString` di `react-dom/server` con `TuvixReactApp`, oppure il renderer del framework (`renderVueToString` di [`@tuvix.js/vue/server`](/it/packages/vue), gli equivalenti per Svelte e Angular) e passa il risultato a `TuvixIsland` come `ssrHtml`.
- Non passa `MountContext.bus` né `MountContext.name` ad `App`. Usa `getGlobalBus()` di `@tuvix.js/event-bus`.
- Non carica il CSS dell'island. Usa [`@tuvix.js/vite`](/it/packages/vite) per stampare i link ai fogli di stile delle island renderizzate sul server.
- Non supporta React 17 o versioni precedenti.

## Migrazione dalla 0.4

**L'HTML del server di `TuvixReactApp` contiene marcatori di Suspense.** Ora il wrapper contiene `<!--$-->…<!--/$-->` attorno all'app. Aggiorna `@tuvix.js/react` sul server e sul client insieme, altrimenti la hydration fallisce con un mismatch.

**`mount` viene rifiutato quando il primo render lancia un errore.** Se attendevi `mount` aspettandoti che si risolvesse, intercetta l'errore:

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Broken(): never {
  throw new Error('boom');
}

const app = createReactMicroApp({ name: 'broken', App: Broken });
const container = document.createElement('div');

try {
  await app.mount({ container });
} catch (error) {
  // 0.4: never reached. 0.5: the render error; the container is empty.
  container.textContent = 'This section failed to load.';
}
```

**`unmount` su un container sconosciuto non fa nulla.** Nella 0.4 svuotava il container. Se facevi affidamento su questo comportamento, chiama tu `container.replaceChildren()`.

**Oggetto di configurazione.** Le versioni precedenti di questa pagina mostravano `createReactMicroApp(App)`. La funzione accetta un oggetto di configurazione: `createReactMicroApp({ name: 'dashboard', App })`.

Consulta la [guida a React](/it/guide/react) per altre procedure guidate.

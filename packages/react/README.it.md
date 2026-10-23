# @tuvix.js/react

> Trasforma i componenti React in micro app Tuvix.js e ospita qualsiasi micro app dentro un albero React con hydration SSR.

Fa parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Installazione

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

Richiede React 18 o successivo.

## Avvio rapido

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Il modulo si registra con il nome `'dashboard'` tramite `registerModule` di `@tuvix.js/loader`, quindi l'orchestratore lo trova dopo il caricamento dello script. Passa all'orchestratore una `entry` come `() => import('./dashboard')`, un `container` e le `props`.

## API

### `createReactMicroApp(config)`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Nome nel registro; gli eventi del ciclo di vita lo riportano. |
| `App` | `ComponentType<P>` | obbligatorio | Componente radice. Riceve le props del mount; le props obbligatorie vengono controllate dai tipi. |
| `bootstrap` | `() => void \| Promise<void>` | nessuno | Setup eseguito una sola volta. |
| `ssr` | `boolean` | `false` | Esegue la hydration con `hydrateRoot` quando il container contiene markup del server (elementi o testo che non sia solo spazi). |

- Ogni container riceve una propria root React, così un modulo può essere montato in più punti.
- `mount({ container, props })` si risolve dopo il primo commit e invia `tuvix:mounted` con `hydrated`.
- `update({ props, container })` renderizza di nuovo un container, oppure tutti se manca `container`. Lo stato del componente viene mantenuto.
- `unmount({ container })` smonta la root, svuota il container e invia `tuvix:unmounted`.
- `react-dom/client` viene caricato in modo lazy dentro `mount`, così i bundle server possono importare il modulo.

### `createSsrReactMicroApp(config)`

`createReactMicroApp({ ...config, ssr: true })`. Opzioni: `name`, `App`, `bootstrap`. Renderizza lo stesso albero di `TuvixReactApp`, quindi idrata il markup di `TuvixReactApp` senza mismatch.

### `TuvixIsland`

Ospita qualsiasi modulo di micro app (Vue, Svelte, Angular, React o un `{ mount, unmount, update? }` scritto a mano) dentro un albero React.

| Prop | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Scritto in `data-tuvix-app`, passato a `mount`. |
| `app` | `MicroAppModule` | obbligatorio | Il modulo da montare. |
| `props` | `Record<string, unknown>` | `{}` | Confrontate in modo shallow; una modifica chiama `app.update({ props, container })`, oppure rimonta quando il modulo non ha `update`. |
| `ssrHtml` | `string` | nessuno | HTML dell'island renderizzato sul server. Passalo solo sul server. |
| `fallback` | `ReactNode` | `null` | Renderizzato quando `mount` o `update` rifiuta. |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Tag del wrapper. |
| `className` | `string` | nessuno | Classe del wrapper. |

Un bridge scritto a mano come `<div dangerouslySetInnerHTML={{ __html }} />` perde il DOM e i listener della micro app al successivo re-render del genitore, perché React assegna di nuovo `innerHTML` per ogni nuovo oggetto `{ __html }`. `TuvixIsland` crea quell'oggetto una sola volta. Durante la hydration trova il proprio elemento tramite un attributo `data-tuvix-island` (da `useId`) e rilegge l'HTML dalla pagina, quindi il client non ha bisogno di `ssrHtml`. Un nuovo `name` o `app` provoca un nuovo mount; la rimozione chiama `app.unmount`. Le chiamate vengono eseguite in ordine, quindi un unmount attende un mount in corso.

```tsx
// Layout.tsx, rendered on the server with footerHtml and on the client without it
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <TuvixIsland name="footer" app={footer} props={{ year }} ssrHtml={footerHtml} fallback={<footer>© {year}</footer>} />
  );
}
```

```tsx
// entry-server.tsx
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const footerHtml = await renderVueToString(Footer, { year: 2026 });
  return renderToString(<Layout year={2026} footerHtml={footerHtml} />);
}
```

```tsx
// entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

### `TuvixReactApp`

Renderizza una micro app React inline nell'albero host dentro `<div data-tuvix-app={name}>`.

| Prop | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Deve corrispondere al `name` del modulo. |
| `App` | `ComponentType<P>` | obbligatorio | Componente da renderizzare. |
| `fallback` | `ReactNode` | `null` | Mostrato mentre `App` è sospeso o dopo che ha lanciato un errore. |
| altre props | `P` | richieste da `P` | Passate ad `App`. |

`App` si trova dentro un error boundary e un `<Suspense fallback>`. Un errore di render sul server sostituisce solo questa app con `fallback` e React riprova sul client. Un errore di render sul client mostra `fallback` e invia `tuvix:error`. Invia `tuvix:mounted` (con `hydrated`) e `tuvix:unmounted`.

### `useTuvixBus(bus, event, handler)`

Si iscrive in un effect e annulla l'iscrizione all'unmount. L'`handler` più recente viene tenuto in un ref, quindi non si iscrive di nuovo a ogni render. Passa `getGlobalBus()` da `@tuvix.js/event-bus`; l'adapter non passa il bus dell'orchestratore ad `App`.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Restituisce props che uniscono ogni payload di `updateEvent` (default `'tuvix:props:update'`) su `bus`. Nulla in Tuvix emette quell'evento; lo emetti tu. I moduli creati con `createReactMicroApp` ricevono le nuove props tramite `update` senza questo hook.

### Tipi

`ReactMicroAppConfig<P>`, `TuvixIslandProps`, `TuvixReactAppProps<P>`.

## Casi limite

- Un errore lanciato nel primo render fa rifiutare `mount`, svuota il container e invia `tuvix:error`. Un errore successivo lascia l'app vuota finché non la rimonti.
- `unmount` durante un `mount` in corso lo attende e lascia il container vuoto.
- `mount` su un container che il modulo gestisce già smonta la vecchia root (inviando `tuvix:unmounted`) e renderizza da zero con le nuove props, come gli adapter Vue, Svelte e Angular.
- `unmount` e `update` su un container sconosciuto non fanno nulla.
- Quando React rimuove un `TuvixIsland`, il modulo segnala `tuvix:unmounted` dopo che l'elemento è stato staccato. L'evento va a `document` (con `detail.container` impostato), quindi lo ricevono i listener su `document` e `onLifecycle`; i listener sul container o sui suoi antenati no. `isMounted(name)` diventa `false` quando nessun container dell'app è più montato.
- Con `<StrictMode>` in sviluppo React esegue due volte l'effect di mount dell'island, ma l'island salta la prima esecuzione scartata: il modulo viene montato una sola volta e adotta il markup del server.
- Dopo un mount fallito, un nuovo `app` o `name` viene montato in un elemento vuoto. Non riceve mai l'HTML server dell'app fallita.

## Cosa non fa

- Caricare moduli da URL. Usa `@tuvix.js/core` o `@tuvix.js/loader`.
- Renderizzare in una stringa. Usa `react-dom/server`, oppure `renderVueToString` e funzioni analoghe per `ssrHtml`.
- Caricare il CSS delle island. Usa `@tuvix.js/vite`.

## Breaking change nella 0.5

- L'HTML server di `TuvixReactApp` ora contiene marcatori di commento di Suspense; aggiorna server e client insieme.
- `mount` rifiuta quando il primo render lancia un errore.
- `unmount` su un container che il modulo non ha mai montato non fa nulla.

Documentazione completa: [tuvix.js.org/it/packages/react](https://tuvix.js.org/it/packages/react)

## Licenza

MIT

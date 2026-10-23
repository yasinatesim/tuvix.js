# Con React

`@tuvix.js/react` svolge tre compiti. `createReactMicroApp` trasforma un componente React in una micro app che qualsiasi shell può montare. `TuvixReactApp` renderizza una micro app React dentro una pagina host React, con rendering lato server. `TuvixIsland` ospita una micro app Vue, Svelte, Angular, React o scritta a mano dentro una pagina React.

Richiede React 18 o 19.

## Installazione

```bash
pnpm add @tuvix.js/react react react-dom
```

## Trasformare un componente in una micro app

```tsx
// src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

interface ProfileProps {
  userId: string;
  theme: 'light' | 'dark';
}

function Profile({ userId, theme }: ProfileProps) {
  return <div className={`profile ${theme}`}>User {userId}</div>;
}

export default createReactMicroApp({ name: 'profile', App: Profile });
```

Il modulo:

- si registra con il nome `name`, così una entry URL lo trova;
- crea una root React per ogni container, quindi un solo modulo può montarsi in più punti;
- risolve `mount` dopo che React ha completato il primo render, poi invia `tuvix:mounted` sul container;
- passa le props della shell ad `App` come sue props. `App` può dichiarare props obbligatorie; l'adapter non le verifica a runtime.

| Opzione | Tipo | Descrizione |
| --- | --- | --- |
| `name` | `string` | Obbligatoria. Deve corrispondere al nome dell'app registrata. |
| `App` | `ComponentType<P>` | Obbligatoria. Componente radice. |
| `bootstrap` | `() => void \| Promise<void>` | Viene eseguita una volta prima del primo mount. |
| `ssr` | `boolean` | Esegue la hydration quando il container contiene markup del server. `createSsrReactMicroApp` la imposta. |

## Props e aggiornamenti

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'light' });
```

`update({ props, container })` renderizza di nuovo la root di quel container con le props unite. Lo stato del componente si conserva. Senza `container`, renderizza di nuovo ogni root del modulo. Se chiami `mount` su un container in cui questo modulo ha già renderizzato, il modulo lo renderizza di nuovo invece di creare una seconda root.

## Errori

L'adapter avvolge `App` in un error boundary:

- Un'eccezione durante il primo render rifiuta `mount`, svuota il container e invia `tuvix:error`. L'orchestratore mostra poi l'HTML di `fallback` dell'app.
- Un'eccezione successiva svuota l'app e invia `tuvix:error`. Il resto della pagina continua a funzionare.

## App React renderizzate lato server

Quando la pagina host è React e viene renderizzata sul server (TanStack Start, Next.js, Remix o il tuo `renderToString`), renderizza la micro app inline con `TuvixReactApp`:

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

- Renderizza `<div data-tuvix-app="legal">` attorno ad `App`, quindi l'HTML arriva dal render lato server dell'host stesso.
- Ogni prop tranne `name`, `App` e `fallback` va ad `App`.
- `App` sta nel proprio `<Suspense fallback>`. Se lancia un'eccezione sul server, React invia il fallback solo per questa app e riprova l'app sul client.
- Sul client un error boundary mostra `fallback` e invia `tuvix:error`.
- Dopo il primo commit invia `tuvix:mounted` con `hydrated: true` quando ha idratato HTML del server, e `tuvix:unmounted` quando esce dall'albero.

Quando un bundle separato deve idratare quel markup (per esempio una pagina composta da `@tuvix.js/server`), esporta lo stesso componente con `createSsrReactMicroApp`. Renderizza lo stesso albero Suspense, quindi la hydration corrisponde:

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export default createSsrReactMicroApp({ name: 'legal', App: LegalPage });
```

Con `ssr: true`, un container che contiene solo spazi bianchi o commenti riceve un render nuovo invece della hydration.

## Ospitare altre micro app con TuvixIsland

`TuvixIsland` monta qualsiasi modulo di micro app dentro un albero React:

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });

export function Footer({ newsletterHtml }: { newsletterHtml?: string }) {
  return (
    <TuvixIsland
      name="newsletter"
      app={newsletter}
      props={{ list: 'weekly' }}
      ssrHtml={newsletterHtml}
      fallback={<p>Subscribe at example.com/newsletter</p>}
    />
  );
}
```

| Prop | Descrizione |
| --- | --- |
| `name` | Scritto in `data-tuvix-app` e passato a `mount`. |
| `app` | Il modulo da montare. |
| `props` | Confrontate in modo superficiale a ogni render. Una modifica chiama `app.update`, oppure unmount + mount quando il modulo non ha `update`. |
| `ssrHtml` | HTML del server per l'island. Serve solo sul server. |
| `fallback` | Renderizzato al posto dell'island quando `mount` o `update` rifiuta. |
| `as`, `className` | Tag del wrapper (predefinito `div`) e classe. |

React non riscrive mai l'HTML interno dell'island dopo il primo render, quindi i re-render del genitore conservano il DOM e i listener che il modulo ha collegato. Un nuovo `name` o `app` rimonta l'island; rimuovere l'island chiama `app.unmount`. Mount, update e unmount vengono eseguiti uno dopo l'altro, quindi un unmount che arriva durante `mount` lo attende.

`TuvixIsland` non carica moduli tramite URL. Importa il modulo, oppure lascia che l'orchestratore gestisca le entry URL. La configurazione completa del server è in [Island SSR](/it/guide/ssr-islands).

## Hook

### useTuvixBus

Si iscrive al mount e annulla l'iscrizione all'unmount. Legge l'`handler` più recente tramite un ref, quindi un handler inline non ripete l'iscrizione a ogni render:

```tsx
import { useState } from 'react';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/react';

const bus = getGlobalBus();

export function CartBadge() {
  const [count, setCount] = useState(0);
  useTuvixBus<{ itemCount: number }>(bus, 'cart:updated', ({ itemCount }) => setCount(itemCount));
  return <span className="badge">{count}</span>;
}
```

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` restituisce uno stato che unisce ogni payload emesso su `updateEvent`. Nessuna parte di Tuvix.js emette quell'evento; emettilo tu quando vuoi inviare le props tramite il bus invece di `updateAppProps`.

```tsx
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixProps } from '@tuvix.js/react';

const bus = getGlobalBus();

export function Theme() {
  const props = useTuvixProps({ theme: 'light' }, bus);
  return <p>Theme: {props.theme}</p>;
}

bus.emit('tuvix:props:update', { theme: 'dark' });
```

## Cosa non fa l'adapter

- Non condivide una root React tra le micro app. Ogni app, e ogni container, ha la propria.
- Non deduplica React. Due micro app React impacchettate separatamente includono due copie di React.
- Non renderizza l'`<head>` della pagina host. Titoli e meta tag sono compito dell'host.

## API

| Export | Scopo |
| --- | --- |
| `createReactMicroApp({ name, App, bootstrap?, ssr? })` | Modulo di micro app React |
| `createSsrReactMicroApp({ name, App, bootstrap? })` | Lo stesso con `ssr: true` |
| `TuvixReactApp` | Micro app React inline in un host React, con SSR |
| `TuvixIsland` | Ospita qualsiasi modulo di micro app in un albero React, con SSR |
| `useTuvixBus(bus, event, handler)` | Iscrizione all'event bus legata al componente |
| `useTuvixProps(initial, bus?, event?)` | Props unite dagli eventi del bus |

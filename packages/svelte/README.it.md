# @tuvix.js/svelte

> Binding Svelte 3/4/5 per il framework per microfrontend Tuvix.js

Parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Installazione

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

## Avvio rapido

```ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App });
```

L'adapter registra il modulo con `registerModule` di `@tuvix.js/loader`, così l'orchestratore lo trova per nome. Al primo mount importa `svelte` e controlla se esiste un export `mount`:

- **Svelte 5**: `mount()` / `hydrate()` / `unmount()` da `svelte`.
- **Svelte 3/4**: `new App({ target, props })`, `$set()` e `$destroy()`.

Il tuo bundler deve risolvere `svelte` nella sua build client (la condizione di export `browser`; `@sveltejs/vite-plugin-svelte` la imposta). Se sceglie la build server, `mount()` di Svelte 5 lancia `lifecycle_function_unavailable`.

## API

### `createSvelteMicroApp(config)`

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Nome dell'app, registrato con `registerModule` |
| `App` | `unknown` | obbligatorio | Componente Svelte 5 o classe componente Svelte 3/4 |
| `bootstrap` | `() => void \| Promise<void>` | nessuno | Setup eseguito una sola volta |
| `ssr` | `boolean` | `false` | Esegue la hydration del markup del server quando il container ne contiene |
| `SvelteMap` | classe `SvelteMap` | nessuno | Solo Svelte 5: `SvelteMap` da `svelte/reactivity`, così `update()` renderizza di nuovo sul posto invece di rimontare |

- Ogni container riceve la propria istanza, quindi un modulo può essere montato in più container.
- `mount` svuota il container (a meno che non esegua la hydration), renderizza ed emette `tuvix:mounted` dopo l'esecuzione delle callback `onMount` e degli effect. Un mount fallito emette `tuvix:error` e rifiuta la promise.
- `unmount` distrugge l'istanza, svuota il container ed emette `tuvix:unmounted`. Se viene chiamato mentre `mount` sta ancora caricando, attende il mount e poi lo smonta.
- `update({ props, container? })` aggiorna un container, o tutte le istanze se manca `container`. Svelte 3/4 usa `$set()`. Svelte 5 per default rimonta: smonta l'istanza, ne monta una nuova con le nuove props ed emette di nuovo `tuvix:mounted`, quindi i nodi DOM e lo stato del componente vanno persi. Passa `SvelteMap` per aggiornare sul posto (funziona con `$props()` ed `export let`):

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App, SvelteMap });
```

L'adapter non importa `svelte/reactivity` da solo: Svelte 3/4 non ha questo modulo, e quell'import romperebbe la build delle app Svelte 3/4.

L'host invia le nuove props tramite l'orchestratore:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
});
await orchestrator.start();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

### `createSsrSvelteMicroApp(config)`

Equivale a `createSvelteMicroApp({ ...config, ssr: true })`. Esegue la hydration quando il container contiene elementi o testo non vuoto, altrimenti renderizza da zero. La hydration di Svelte 5 richiede i commenti marcatori scritti da `svelte/server`. Compila i componenti Svelte 3/4 con `hydratable: true`.

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString(App, props?, options?)` da `@tuvix.js/svelte/server`

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | nessuno | `render` da `svelte/server`; senza di esso l'adapter importa `svelte/server` a runtime |

Restituisce i tag `<style>` del componente seguiti dal suo markup. Se passi `render`, usa sempre `render` di Svelte 5. Altrimenti l'adapter importa `svelte`: se quel modulo esporta `mount` carica `svelte/server` (Svelte 5), altrimenti chiama `App.render(props)` (Svelte 3/4) e racchiude `css.code` in `<style>`. I componenti Svelte 5 compilati con `dev: true` (vite-plugin-svelte in modalità serve) hanno un `App.render` che lancia un errore, quindi l'adapter non decide mai in base ad `App.render`. Chiamala da una funzione server; in un browser restituisce `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const footerHtml = await renderSvelteToString(
  Footer,
  { year: 2026 },
  { render }
);
```

### `renderSvelte(App, props?, options?)` da `@tuvix.js/svelte/server`

Stesse opzioni. Restituisce `{ html, head, css }`, così puoi inserire il contenuto di `<svelte:head>` nell'head del documento.

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const { html, head, css } = await renderSvelte(
  Footer,
  { year: 2026 },
  { render }
);
```

### Tipi

`SvelteMicroAppConfig`, `SvelteProps` (da `@tuvix.js/svelte`); `RenderSvelteOptions`, `SvelteServerRender`, `SvelteRenderResult` (da `@tuvix.js/svelte/server`).

## Casi limite

- Svelte 5 include il CSS nell'output del server solo se compili con `css: 'injected'` (Vite: `svelte({ compilerOptions: { css: 'injected' } })`). Con il default `css: 'external'`, il tuo bundler scrive il CSS in un file.
- Passa `render` da `svelte/server` quando il tuo bundle server include Svelte (Nitro, Vinxi, una build SSR di Vite con `noExternal`). Il renderer server di Svelte fallisce quando il componente e il renderer provengono da due copie di Svelte.
- Ogni aggiornamento sostituisce l'intero set di props. Una chiave assente dalle nuove props viene eliminata su Svelte 5 (si applica il default) e impostata a `undefined` su Svelte 3/4.
- `mount` su un container già montato smonta prima la vecchia istanza. `unmount` su un container che il modulo non ha mai montato non fa nulla: lascia al loro posto i figli del container e non emette eventi.
- Un errore di import o di render di Svelte 5 sul server rifiuta la promise; non c'è fallback su `App.render`.

## Cosa non fa

- Non compila i file `.svelte` e non controlla quale build di Svelte ha scelto il tuo bundler.
- Passa solo props: niente slot, snippet o eventi di componente dall'host.
- Non scrive il contenuto di `<svelte:head>` nel documento e non collega i fogli di stile `css: 'external'`.

Documentazione completa: [tuvix.js.org/it/packages/svelte](https://tuvix.js.org/it/packages/svelte)

## Licenza

MIT

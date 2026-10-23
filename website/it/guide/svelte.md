# Con Svelte

`@tuvix.js/svelte` trasforma un componente Svelte in una micro app. Supporta Svelte 5 e Svelte 3/4, esegue la hydration del markup del server e renderizza i componenti in HTML sul server.

## Installazione

```bash
pnpm add @tuvix.js/svelte svelte
```

## Trasformare un componente in una micro app

```ts
// src/main.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

// SvelteMap (Svelte 5 only) lets update() re-render in place; drop it for Svelte 3/4.
export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

Al primo mount l'adapter importa `svelte` e verifica quale API offre:

| Svelte | Mount | Hydration | Update | Unmount |
| --- | --- | --- | --- | --- |
| 5 | `mount(App, { target, props })` | `hydrate(...)` | sul posto con `SvelteMap`, altrimenti rimonta | `unmount(instance)` |
| 3 / 4 | `new App({ target, props })` | `new App({ hydrate: true })` | `instance.$set(props)` | `instance.$destroy()` |

Il tuo bundler deve risolvere `svelte` alla sua build per il browser. Se sceglie la build per il server, `mount()` di Svelte 5 lancia `lifecycle_function_unavailable`, oppure le callback di `onMount` non vengono mai eseguite. Vedi [Risoluzione dei problemi](/it/guide/troubleshooting).

Ogni container ha la propria istanza del componente. `mount` invia `tuvix:mounted` dopo l'esecuzione delle callback di `onMount` e degli effect. Senza `ssr`, `mount` svuota il container prima di renderizzare. `unmount` su un container che questo modulo non ha mai montato, o il cui mount è fallito, non fa nulla.

## Props

Svelte 5 con le rune:

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { userId, theme = 'light' }: { userId: string; theme?: string } = $props();
</script>

<div class="theme-{theme}">User {userId}</div>
```

Svelte 3/4, oppure Svelte 5 in modalità legacy:

```svelte
<script lang="ts">
  export let userId: string;
  export let theme = 'light';
</script>

<div class="theme-{theme}">User {userId}</div>
```

Su Svelte 5, passa `SvelteMap` da `svelte/reactivity` nella configurazione. L'adapter fornisce allora al componente un oggetto props basato su una `SvelteMap`, e `update({ props })` vi scrive i nuovi valori: si renderizzano di nuovo solo le parti che leggono una prop modificata, e i nodi DOM e lo stato del componente si conservano. Questo funziona per `$props()` e per `export let`. Senza `SvelteMap`, un `update()` su Svelte 5 smonta l'istanza, ne monta una nuova con le nuove props e invia di nuovo `tuvix:mounted`, quindi lo stato locale si azzera. L'adapter non importa `svelte/reactivity` da solo, perché quel modulo non esiste in Svelte 3/4 e le loro build fallirebbero.

Su Svelte 3/4, `update` chiama `$set` e ignora `SvelteMap`.

Ogni aggiornamento sostituisce l'intero insieme di props. Una chiave assente dalle nuove props torna al valore predefinito della prop su Svelte 5 e diventa `undefined` su Svelte 3/4. L'orchestratore invia sempre le props unite, quindi questo conta solo quando chiami `update` tu stesso.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

## Rendering lato server e hydration

```ts
// server-only module
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooter(): Promise<string> {
  return renderSvelteToString(Footer, { year: 2026 }, { render });
}
```

```ts
// client
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

- `renderSvelteToString(App, props?, { render? })` restituisce i tag `<style>` del componente seguiti dal suo markup. Chiamala da codice server; nel browser restituisce `''`.
- Passa `render` da `svelte/server` quando il tuo bundle server include Svelte (Nitro, Vinxi, una build SSR di Vite con `noExternal`). Senza di esso, l'adapter importa `svelte/server` a runtime, il che può caricare una seconda copia di Svelte, e il renderer server di Svelte fallisce tra copie diverse.
- `renderSvelte(App, props?, { render? })` restituisce `{ html, head, css }` quando ti serve l'output di `<svelte:head>`. Inserisci tu `head` nell'`<head>` del documento; l'island non deve contenere `<title>` o `<meta>`.
- `createSsrSvelteMicroApp` esegue la hydration quando il container contiene elementi o testo non composto da spazi bianchi, altrimenti renderizza da zero. I componenti Svelte 3/4 devono essere compilati con `hydratable: true`.

### CSS al primo paint

Scegline una:

- **CSS nell'HTML.** Compila con `compilerOptions: { css: 'injected' }`. Svelte 5 inserisce allora il CSS del componente nell'output del server, e `renderSvelteToString` lo include come tag `<style>` dentro l'island.
- **CSS come file.** Mantieni il valore predefinito `emitCss: true` e collega i fogli di stile dell'island in `<head>` con `@tuvix.js/vite`. Vedi [Island SSR](/it/guide/ssr-islands).

Con `css: 'injected'` non esiste alcun file di stile, quindi `@tuvix.js/vite` non trova nulla da collegare. Non combinare le due.

## Event bus

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getGlobalBus } from '@tuvix.js/event-bus';

  let count = $state(0);
  const off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
    count = itemCount;
  });
  onDestroy(off);
</script>

<span class="badge">{count}</span>
```

## Cosa non fa l'adapter

- Non compila i file `.svelte`; lo fa `@sveltejs/vite-plugin-svelte`.
- Passa solo le props. Slot, snippet ed eventi dei componenti non arrivano dall'host.
- Non verifica quale build di Svelte ha scelto il tuo bundler.

## API

| Export | Scopo |
| --- | --- |
| `createSvelteMicroApp({ name, App, bootstrap?, ssr?, SvelteMap? })` | Modulo di micro app Svelte |
| `createSsrSvelteMicroApp({ name, App, bootstrap?, SvelteMap? })` | Lo stesso con `ssr: true` |
| `renderSvelteToString(App, props?, options?)` da `@tuvix.js/svelte/server` | Stili + markup |
| `renderSvelte(App, props?, options?)` da `@tuvix.js/svelte/server` | `{ html, head, css }` |

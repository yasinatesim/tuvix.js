# Con Vue

`@tuvix.js/vue` trasforma un componente radice Vue 3 in una micro app, esegue la hydration del markup renderizzato lato server e renderizza i componenti in HTML sul server.

## Installazione

```bash
pnpm add @tuvix.js/vue vue
# for renderVueToString on the server
pnpm add @vue/server-renderer
```

## Trasformare un componente in una micro app

```ts
// src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import { createPinia } from 'pinia';
import { analytics } from './analytics-plugin';
import App from './App.vue';

export default createVueMicroApp({
  name: 'settings',
  App,
  plugins: [createPinia(), [analytics, { id: 'G-123' }]],
});
```

| Opzione | Tipo | Descrizione |
| --- | --- | --- |
| `name` | `string` | Obbligatoria. Deve corrispondere al nome dell'app registrata. |
| `App` | `Component` | Obbligatoria. Componente radice. |
| `plugins` | `Array<Plugin \| [Plugin, ...options]>` | Installati con `app.use(plugin, ...options)` a ogni mount. |
| `bootstrap` | `() => void \| Promise<void>` | Viene eseguita una volta prima del primo mount. |
| `ssr` | `boolean` | Esegue la hydration del markup del server. `createSsrVueMicroApp` la imposta. |

Ogni container ha la propria app Vue, quindi ogni mount esegue di nuovo l'`install` di ciascun plugin. Un'istanza di plugin come `createPinia()` è condivisa da tutti i mount del modulo. Creala dentro una funzione plugin quando ogni mount ha bisogno del proprio store.

Se monti in un container che contiene già questa app, l'adapter smonta prima la vecchia istanza. `unmount` distrugge l'app, svuota il container e invia `tuvix:unmounted`.

## Props

L'adapter passa le props al componente radice e le fornisce anche con la chiave `'tuvixProps'` (`TUVIX_PROPS_KEY`) a qualsiasi discendente:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

defineProps<{ userId: string; theme?: 'light' | 'dark' }>();

const all = inject<Record<string, unknown>>(TUVIX_PROPS_KEY);
</script>

<template>
  <div :class="theme">User {{ userId }} ({{ Object.keys(all ?? {}).length }} props)</div>
</template>
```

`update({ props })` sostituisce le props in un oggetto `shallowReactive` e attende il tick successivo di Vue. Il componente radice si renderizza di nuovo con i nuovi valori e conserva il proprio stato locale. Le chiavi assenti dalle nuove props vengono rimosse. Senza `container`, `update` aggiorna ogni mount del modulo.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## Rendering lato server e hydration

Renderizza sul server con `renderVueToString` ed esegui la hydration sul client con `createSsrVueMicroApp`:

```ts
// server-only module
import { renderVueToString } from '@tuvix.js/vue/server';
import Newsletter from './Newsletter.vue';

export async function renderNewsletter(list: string): Promise<string> {
  const ssrContext: { teleports?: Record<string, string> } = {};
  const html = await renderVueToString(Newsletter, { list }, [], ssrContext);
  return html; // ssrContext.teleports holds <Teleport> output
}
```

```ts
// client
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

export const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });
```

- `renderVueToString(App, props?, plugins?, ssrContext?)` avvolge `App` nella stessa radice che usa il client, quindi `inject('tuvixProps')` funziona sul server e la hydration corrisponde.
- Chiamala solo da codice server: una server function, una route API o la tua entry del server. Nel browser restituisce `''`. Un route loader isomorfo viene eseguito anche nel browser, e in quel caso il bundler invia al client il renderer server di Vue.
- Con `ssr: true` e markup del server nel container, l'adapter chiama `createSSRApp` e conserva i nodi DOM del server. Un container vuoto riceve un nuovo render con `createApp`.
- L'HTML non contiene CSS. Vite inietta i blocchi `<style>` dei SFC da JavaScript, dopo l'inizio della hydration. Collega i fogli di stile in `<head>` con `@tuvix.js/vite`; vedi [Island SSR](/it/guide/ssr-islands).

Dentro un host React, monta il modulo con `TuvixIsland`.

## Composable

### useTuvixBus

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/vue';

const count = ref(0);
useTuvixBus<{ itemCount: number }>(getGlobalBus(), 'cart:updated', ({ itemCount }) => {
  count.value = itemCount;
});
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>
```

Si iscrive in `onMounted`, annulla l'iscrizione in `onUnmounted` e restituisce una funzione per una pulizia anticipata.

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` restituisce uno `ShallowRef` che unisce ogni payload emesso su `updateEvent`. Nessuna parte di Tuvix.js emette quell'evento. Con l'adapter, le props passate tramite `updateAppProps` renderizzano già di nuovo il componente, quindi raramente ti serve.

## Casi limite

- Gli alias di percorso come `~/utils` devono risolversi anche nei file `.vue`. Se il tuo alias arriva da `vite-tsconfig-paths`, aggiungi `**/*.vue` all'`include` di quel tsconfig, oppure imposta `resolve.alias` nella configurazione di Vite. Vedi [Risoluzione dei problemi](/it/guide/troubleshooting).
- Un errore di setup, di render o di un hook del ciclo di vita durante il mount rifiuta `mount` e invia `tuvix:error`, anche nelle build di produzione. L'`app.config.errorHandler` di un plugin viene comunque eseguito.
- `unmount` su un container che questo modulo non ha mai montato non fa nulla.

## API

| Export | Scopo |
| --- | --- |
| `createVueMicroApp({ name, App, plugins?, bootstrap?, ssr? })` | Modulo di micro app Vue |
| `createSsrVueMicroApp({ name, App, plugins?, bootstrap? })` | Lo stesso con `ssr: true` |
| `TUVIX_PROPS_KEY` | Chiave di injection (`'tuvixProps'`) per le props reattive |
| `useTuvixBus(bus, event, handler)` | Iscrizione all'event bus legata al componente |
| `useTuvixProps(initial, bus?, event?)` | `ShallowRef` unito dagli eventi del bus |
| `renderVueToString(App, props?, plugins?, ssrContext?)` da `@tuvix.js/vue/server` | HTML del server |

---
title: '@tuvix.js/vue'
---

<PackageHeader
  name="@tuvix.js/vue"
  title="Binding per Vue"
  description="Trasforma un componente Vue 3 in una micro app Tuvix.js con props reattive, un'app Vue per ogni container e hydration SSR. Renderizzalo sul server con renderVueToString."
  icon="💚"
  npm="true"
/>

## Installazione

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

Per il rendering lato server installa anche il renderer server di Vue, una peer dependency opzionale:

```bash
npm install @vue/server-renderer
# or pnpm add @vue/server-renderer
```

Il pacchetto richiede Vue 3 (peer range `>=3.0.0`). Dipende da `@tuvix.js/loader` e `@tuvix.js/event-bus`.

## Quando usarlo

Usa `@tuvix.js/vue` quando una delle micro app della tua shell Tuvix è un'app Vue 3. `createVueMicroApp` avvolge il componente radice nel modulo `{ bootstrap, mount, unmount, update }` che l'orchestratore e il loader chiamano. L'orchestratore poi lo monta in un container, invia nuove props con `updateAppProps` e lo smonta al cambio di route.

Aggiungi il rendering lato server quando l'app Vue deve comparire nella prima risposta HTML, per la SEO o per evitare un'area vuota prima che JavaScript venga eseguito. Genera l'HTML con `renderVueToString` di `@tuvix.js/vue/server` in una funzione server, inseriscilo nel container ed esegui la hydration con `createSsrVueMicroApp`. In una pagina host React, passa quell'HTML a [`TuvixIsland`](/it/packages/react#tuvixisland).

Se l'intera pagina è un'unica app Vue, non ti serve questo pacchetto; usa `createApp` di Vue o Nuxt.

## Avvio rapido

Il componente radice dichiara le props che la shell passa:

```vue
<!-- src/micro-apps/settings/App.vue -->
<script setup lang="ts">
defineProps<{ userId: string; theme: 'light' | 'dark' }>();
</script>

<template>
  <section :class="`settings theme-${theme}`">Settings for {{ userId }}</section>
</template>
```

Avvolgilo in un modulo:

```ts
// src/micro-apps/settings/index.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

Registralo nella shell:

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'settings',
  entry: () => import('./micro-apps/settings'),
  container: '#app',
  activeWhen: '/settings/*',
  props: { userId: 'u_42', theme: 'light' },
});

await orchestrator.start();

// Re-renders App with theme="dark"; local component state survives.
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## API

### `createVueMicroApp`

```ts no-check
function createVueMicroApp(config: VueMicroAppConfig): MicroAppModule;
```

| Opzione | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Nome con cui il modulo si registra tramite `registerModule` di `@tuvix.js/loader`. Gli eventi del ciclo di vita lo riportano. |
| `App` | `Component` | obbligatorio | Componente Vue radice. |
| `plugins` | `VuePluginEntry[]` | nessuno | Plugin da installare su ogni app Vue. Una voce è un plugin oppure una tupla `[plugin, ...options]` passata ad `app.use(plugin, ...options)`. |
| `bootstrap` | `() => void \| Promise<void>` | nessuno | Setup eseguito una sola volta. Il `bootstrap()` del modulo lo attende. |
| `ssr` | `boolean` | `false` | Idrata il markup del server con `createSSRApp` quando il container contiene elementi o testo non composto da spazi. Un container vuoto riceve un render con `createApp`. |

Il modulo restituito:

- `mount({ container, props })` crea un'app Vue per quel container, installa i plugin e la monta. Invia `tuvix:mounted` sul container con `hydrated: true` quando Vue ha adottato il markup del server.
- `update({ props, container })` scrive `props` nell'oggetto di props reattivo di quel container e si risolve dopo che Vue ha applicato il re-render (`nextTick`). Le chiavi assenti dalle nuove props vengono rimosse. Senza `container` aggiorna ogni container in cui il modulo è montato.
- `unmount({ container })` smonta l'app Vue, svuota il container con `replaceChildren()` e invia `tuvix:unmounted`.
- `bootstrap()` esegue `config.bootstrap`.

Ogni container riceve la propria app Vue e le proprie props, quindi un modulo può montarsi in più punti contemporaneamente:

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Badge from './Badge.vue';

const badge = createVueMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

#### Leggere le props nei componenti

L'adapter conserva le props in un oggetto `shallowReactive` e renderizza `App` tramite un wrapper radice che le passa come props del componente. Il wrapper non renderizza DOM proprio. Puoi leggere le props in due modi:

- **`defineProps`** nel componente radice. `update` lo renderizza di nuovo con i nuovi valori.
- **`inject('tuvixProps')`** (o `inject(TUVIX_PROPS_KEY)`) in qualsiasi componente dell'albero. Ottieni lo stesso oggetto reattivo, quindi un `computed` che lo legge si aggiorna dopo `update`. Usalo nei figli profondi invece di passare le props verso il basso.

```vue
<!-- src/micro-apps/settings/ThemeLabel.vue -->
<script setup lang="ts">
import { computed, inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

const tuvixProps = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
const theme = computed(() => String(tuvixProps.theme ?? 'light'));
</script>

<template>
  <span>Theme: {{ theme }}</span>
</template>
```

#### Plugin con opzioni

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import type { VuePluginEntry } from '@tuvix.js/vue';
import type { App as VueApp } from 'vue';
import App from './App.vue';

const analytics = {
  install(app: VueApp, options: { siteId: string }) {
    app.provide('analyticsSiteId', options.siteId);
  },
};

const plugins: VuePluginEntry[] = [[analytics, { siteId: 'site-42' }]];

export default createVueMicroApp({ name: 'checkout', App, plugins });
```

Ogni container riceve la propria app Vue, quindi ogni mount chiama di nuovo `app.use` per ogni plugin. Un oggetto plugin con stato, come un singolo risultato di `createPinia()`, è condiviso da tutti i container del modulo.

### `createSsrVueMicroApp`

```ts no-check
function createSsrVueMicroApp(config: VueSsrMicroAppConfig): MicroAppModule;
```

Equivale a `createVueMicroApp({ ...config, ssr: true })`. Opzioni: `name`, `App`, `plugins`, `bootstrap`, come nella tabella sopra.

Quando il container contiene markup generato da `renderVueToString`, Vue adotta quei nodi DOM tramite `createSSRApp` e vi collega i listener. Server e client usano lo stesso wrapper radice, quindi gli alberi dei componenti corrispondono. Monta con le stesse props usate dal server per il render:

```ts
// src/micro-apps/contact/client.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString`

Importalo dal subpath `@tuvix.js/vue/server`.

```ts no-check
function renderVueToString(
  App: Component,
  props?: Record<string, unknown>,
  plugins?: VuePluginEntry[],
  ssrContext?: VueSsrContext
): Promise<string>;
```

| Argomento | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `App` | `Component` | obbligatorio | Componente radice, lo stesso che passi a `createSsrVueMicroApp`. |
| `props` | `Record<string, unknown>` | `{}` | Props per `App`. `inject('tuvixProps')` le vede anche durante l'SSR. |
| `plugins` | `VuePluginEntry[]` | nessuno | Plugin da installare, con la stessa forma a tupla di `createVueMicroApp`. |
| `ssrContext` | `VueSsrContext` | `{}` | Oggetto in cui Vue scrive durante il render. Leggi `teleports` e `modules` dopo che la promise si è risolta. |

Crea un'app SSR con il wrapper radice condiviso, installa i plugin e restituisce l'HTML prodotto da `renderToString` di `@vue/server-renderer`. Installa quel pacchetto; `renderVueToString` lo importa alla prima chiamata.

`renderVueToString` è solo server. Chiamalo da una funzione server (un handler `createServerFn` di TanStack Start, una route API, il tuo handler Express), non da un loader di route isomorfo. Un loader viene eseguito anche nel browser durante la navigazione client, dove la funzione restituisce `''`, e il tuo bundler invia il renderer server di Vue al client perché il loader lo importa.

```ts
// src/server/contact.ts
import { createServerFn } from '@tanstack/react-start';
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from '../micro-apps/contact/App.vue';

export const renderContact = createServerFn().handler(async () => {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return { html, teleports: ssrContext.teleports ?? {} };
});
```

Inserisci `html` dentro l'elemento container (`<div id="contact">…</div>`) nella tua pagina, poi monta `createSsrVueMicroApp` sul client come mostrato sopra. L'HTML di una destinazione `<Teleport>` si trova in `ssrContext.teleports['#target']`, non nella stringa restituita; stampalo dove si trova la destinazione.

### `TUVIX_PROPS_KEY`

```ts no-check
const TUVIX_PROPS_KEY = 'tuvixProps';
```

Chiave di injection dell'oggetto di props reattivo. `inject(TUVIX_PROPS_KEY)` e `inject('tuvixProps')` restituiscono lo stesso oggetto, sul client e durante `renderVueToString`.

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): Unsubscribe;
```

Iscrive `handler` a `event` in `onMounted` e annulla l'iscrizione in `onUnmounted`. La funzione restituita annulla l'iscrizione in anticipo. Chiamalo durante `setup`. `onMounted` non viene eseguito durante il rendering lato server, quindi l'iscrizione esiste solo sul client.

L'adapter non passa il bus dell'orchestratore ad `App`. L'orchestratore usa `getGlobalBus()` a meno che tu non gli abbia passato le opzioni `eventBus`:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const count = ref(0);

useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
  count.value = items.length;
});
</script>

<template>
  <span>{{ count }}</span>
</template>
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): ShallowRef<T>;
```

| Argomento | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `initialProps` | `T` | obbligatorio | Valore iniziale, copiato una sola volta. |
| `bus` | `IEventBus` | nessuno | Bus su cui restare in ascolto. Senza di esso il ref mantiene `initialProps`. |
| `updateEvent` | `string` | `'tuvix:props:update'` | Evento il cui payload il composable unisce al ref (`{ ...prev, ...payload }`). |

Né l'orchestratore né l'adapter emettono `tuvix:props:update`; lo emetti tu. Per le props dell'orchestratore usa `defineProps` o `inject(TUVIX_PROPS_KEY)`, che seguono `update` senza bus.

```vue
<script setup lang="ts">
import { useTuvixProps } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const settings = useTuvixProps({ theme: 'light' }, getGlobalBus());
// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
</script>

<template>
  <p>Theme: {{ settings.theme }}</p>
</template>
```

### Tipi

| Tipo | Esportato da | Significato |
| --- | --- | --- |
| `VueMicroAppConfig` | `@tuvix.js/vue` | Configurazione di `createVueMicroApp`: `name`, `App`, `plugins?`, `bootstrap?`, `ssr?`. |
| `VueSsrMicroAppConfig` | `@tuvix.js/vue` | `VueMicroAppConfig` senza `ssr`; configurazione di `createSsrVueMicroApp`. |
| `VuePluginEntry` | `@tuvix.js/vue` | `Plugin \| [Plugin, ...any[]]`: un plugin, oppure un plugin più le sue opzioni per `app.use`. |
| `VueSsrContext` | `@tuvix.js/vue/server` | `{ teleports?: Record<string, string>; modules?: Set<string>; [key: string]: unknown }`, popolato da Vue e dai suoi plugin durante `renderVueToString`. `@vitejs/plugin-vue` registra in `modules` i moduli dei componenti renderizzati. |

## Casi limite

- **Errori di mount.** Gli errori di setup, di render e degli hook del ciclo di vita durante `mount` rifiutano la promise sia nelle build di sviluppo sia in quelle di produzione. L'adapter smonta l'app fallita e invia `tuvix:error`. L'`app.config.errorHandler` di un plugin riceve comunque l'errore.
- **Due mount nello stesso container.** Un secondo `mount` su un container che il modulo occupa già smonta prima la vecchia app (inviando `tuvix:unmounted` e svuotando il container), poi ne monta una nuova. Con `ssr: true` quel secondo mount esegue un nuovo render, perché il container è vuoto.
- **Container sconosciuto.** `unmount` su un container in cui il modulo non è mai stato montato non fa nulla. `update` con un `container` del genere non cambia nulla.
- **Le props vengono sostituite.** L'`update` del modulo imposta le props all'oggetto che passi ed elimina le chiavi mancanti. `orchestrator.updateAppProps` unisce le nuove props a quelle registrate prima di chiamare `update`.
- **Props non dichiarate.** Le props che il componente radice non dichiara con `defineProps` gli arrivano come attributi e passano al suo elemento radice, come Vue fa per qualsiasi componente. `{ lang: 'en' }` renderizza `lang="en"` sull'elemento radice, a meno che tu non dichiari `lang` o imposti `inheritAttrs: false`.
- **Container con soli spazi e `ssr: true`.** L'adapter esegue il render con `createApp`, perché `hasServerMarkup` ignora il testo composto da spazi e i commenti. Vue non segnala la hydration di un container vuoto.
- **`renderVueToString` nel browser.** Restituisce `''` quando `window` esiste.
- **Errore di unmount.** Se `app.unmount()` lancia un errore, l'adapter svuota il container, invia `tuvix:error` e rilancia l'errore.
- **Stesso nome due volte.** `registerModule` conserva l'ultimo modulo creato con un dato nome.

## Cosa non fa

- Non supporta Vue 2.
- Non carica moduli da URL. Importa il modulo, oppure lascia che [`@tuvix.js/core`](/it/packages/core) lo carichi tramite una `entry`.
- Non passa `MountContext.bus` né `MountContext.name` ai tuoi componenti. Usa `getGlobalBus()` di `@tuvix.js/event-bus`.
- `renderVueToString` non esegue lo streaming e non raccoglie il CSS. Usa [`@tuvix.js/vite`](/it/packages/vite) per stampare i link ai fogli di stile delle island renderizzate sul server.
- Non posiziona l'HTML teletrasportato al posto tuo. Leggi `ssrContext.teleports` e stampalo.

## Migrazione dalla 0.4

**`$tuvixProps` non esiste più.** `update()` non scrive più `app.config.globalProperties.$tuvixProps`. Leggi le props con `defineProps` o `inject`:

```vue
<!-- Before (0.4) -->
<template>
  <span>{{ $tuvixProps.theme }}</span>
</template>
```

```vue
<!-- After (0.5) -->
<script setup lang="ts">
defineProps<{ theme: string }>();
</script>

<template>
  <span>{{ theme }}</span>
</template>
```

**`unmount` su un container sconosciuto non fa nulla.** Nella 0.4 svuotava il container. Se facevi affidamento su questo comportamento, chiama tu `container.replaceChildren()`.

**`VueSsrMicroAppConfig` non ha il campo `ssr`.** Rimuovi `ssr` dalla configurazione che passi a `createSsrVueMicroApp`.

**Oggetto di configurazione.** Le versioni precedenti di questa pagina mostravano `createVueMicroApp(App)`. La funzione accetta un oggetto di configurazione: `createVueMicroApp({ name: 'settings', App })`.

Consulta la [guida a Vue](/it/guide/vue) per altre procedure guidate.

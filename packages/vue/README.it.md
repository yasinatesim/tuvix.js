# @tuvix.js/vue

> Trasforma componenti Vue 3 in micro app Tuvix.js con props reattive, una app Vue per container e hydration SSR.

Parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Installazione

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

Per il rendering lato server installa anche il peer opzionale `@vue/server-renderer`.

## Avvio rapido

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

Il modulo si registra con il nome `'settings'` tramite `registerModule` di `@tuvix.js/loader`, così l'orchestratore lo trova dopo il caricamento dello script. `App` riceve le props dell'orchestratore come props del componente; dichiarale con `defineProps`.

## API

### `createVueMicroApp(config)`

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Nome nel registro; gli eventi del ciclo di vita lo riportano. |
| `App` | `Component` | obbligatorio | Componente Vue radice. |
| `plugins` | `VuePluginEntry[]` | nessuno | Plugin, o tuple `[plugin, ...options]` passate a `app.use(plugin, ...options)`. |
| `bootstrap` | `() => void \| Promise<void>` | nessuno | Setup eseguito una sola volta. |
| `ssr` | `boolean` | `false` | Esegue la hydration del markup del server con `createSSRApp` quando il container ha elementi o testo non vuoto. |

- Ogni container riceve la propria app Vue e le proprie props, quindi un modulo può essere montato in più punti. Ogni mount installa di nuovo i plugin.
- `mount({ container, props })` emette `tuvix:mounted` con `hydrated`.
- `update({ props, container })` sostituisce le chiavi di un oggetto props `shallowReactive` (le chiavi mancanti vengono rimosse) e si risolve dopo `nextTick`. Senza `container` aggiorna tutti i mount. Lo stato del componente si conserva.
- `unmount({ container })` smonta l'app, svuota il container ed emette `tuvix:unmounted`.

### `createSsrVueMicroApp(config)`

`createVueMicroApp({ ...config, ssr: true })`. Opzioni: `name`, `App`, `plugins`, `bootstrap`. Vue adotta il markup di `renderVueToString`; un container vuoto riceve un render normale.

```ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString(App, props?, plugins?, ssrContext?)`

Da `@tuvix.js/vue/server`. Restituisce l'HTML di `App` renderizzato con lo stesso wrapper radice usato dal client, così la hydration corrisponde e `inject('tuvixProps')` funziona sul server. Vue scrive `teleports` e `modules` in `ssrContext`.

Solo server: chiamala da una funzione server, non da un loader di route isomorfo. Nel browser restituisce `''`, e un loader che la importa porta il renderer server di Vue nel client.

```ts
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from './App.vue';

export async function renderContact(): Promise<string> {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return `<div id="contact">${html}</div>`;
}
```

### `TUVIX_PROPS_KEY`

`'tuvixProps'`. `inject(TUVIX_PROPS_KEY)` restituisce l'oggetto props reattivo in cui scrive `update`, in qualsiasi componente dell'albero.

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus(bus, event, handler)`

Si iscrive in `onMounted`, annulla l'iscrizione in `onUnmounted` e restituisce una funzione per annullarla prima. Passa `getGlobalBus()` da `@tuvix.js/event-bus`; l'adapter non passa il bus dell'orchestratore ad `App`.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Restituisce uno `ShallowRef<T>` che unisce ogni payload di `updateEvent` (default `'tuvix:props:update'`) su `bus`. Nulla in Tuvix emette questo evento; lo emetti tu. Per le props dell'orchestratore usa `defineProps` o `inject(TUVIX_PROPS_KEY)`.

### Tipi

`VueMicroAppConfig`, `VueSsrMicroAppConfig`, `VuePluginEntry` da `@tuvix.js/vue`; `VueSsrContext` da `@tuvix.js/vue/server`.

## Casi limite

- Gli errori di setup, render e hook durante `mount` rifiutano la promise sia nelle build di sviluppo sia in quelle di produzione; l'adapter smonta l'app fallita ed emette `tuvix:error`. L'`app.config.errorHandler` di un plugin viene comunque eseguito.
- `mount` su un container già occupato dal modulo smonta prima la vecchia app.
- `unmount` su un container che il modulo non ha mai montato non fa nulla.
- Le props che il componente radice non dichiara passano come attributi sul suo elemento radice.
- Con `ssr: true`, un container che contiene solo spazi o commenti riceve un render nuovo.

## Cosa non fa

- Supportare Vue 2.
- Caricare moduli da URL. Usa `@tuvix.js/core` o `@tuvix.js/loader`.
- Raccogliere CSS o fare lo streaming dell'HTML sul server. Usa `@tuvix.js/vite` per i link ai fogli di stile.

## Breaking change nella 0.5

- `update()` non scrive più `app.config.globalProperties.$tuvixProps`. Usa `defineProps` o `inject('tuvixProps')`.
- `unmount()` su un container che il modulo non ha mai montato non fa nulla; prima svuotava il container.
- `VueSsrMicroAppConfig` non accetta più `ssr`.

Documentazione completa: [tuvix.js.org/it/packages/vue](https://tuvix.js.org/it/packages/vue)

## Licenza

MIT

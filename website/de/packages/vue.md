---
title: '@tuvix.js/vue'
---

<PackageHeader
  name="@tuvix.js/vue"
  title="Vue Bindings"
  description="Macht aus einer Vue-3-Komponente eine Tuvix.js Micro App mit reaktiven Props, einer Vue-App pro Container und SSR-Hydration. Mit renderVueToString renderst du sie auf dem Server."
  icon="💚"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

Für Server-Rendering installierst du zusätzlich den Vue Server Renderer, eine optionale Peer Dependency:

```bash
npm install @vue/server-renderer
# or pnpm add @vue/server-renderer
```

Das Paket braucht Vue 3 (Peer-Bereich `>=3.0.0`). Es hängt von `@tuvix.js/loader` und `@tuvix.js/event-bus` ab.

## Wann du es verwendest

Verwende `@tuvix.js/vue`, wenn eine der Micro Apps in deiner Tuvix-Shell eine Vue-3-App ist. `createVueMicroApp` verpackt die Root-Komponente in das Modul `{ bootstrap, mount, unmount, update }`, das Orchestrator und Loader aufrufen. Der Orchestrator mountet es dann in einen Container, übergibt neue Props mit `updateAppProps` und unmountet es beim Routenwechsel.

Nimm Server-Rendering dazu, wenn die Vue-App schon in der ersten HTML-Antwort erscheinen muss, für SEO oder damit vor dem Ausführen von JavaScript keine leere Fläche zu sehen ist. Rendere das HTML mit `renderVueToString` aus `@tuvix.js/vue/server` in einer Server-Funktion, lege es in den Container und hydriere es mit `createSsrVueMicroApp`. In einer React-Host-Seite übergibst du dieses HTML an [`TuvixIsland`](/de/packages/react#tuvixisland).

Besteht die ganze Seite aus einer Vue-App, brauchst du dieses Paket nicht; verwende Vues eigenes `createApp` oder Nuxt.

## Schnellstart

Die Root-Komponente deklariert die Props, die die Shell übergibt:

```vue
<!-- src/micro-apps/settings/App.vue -->
<script setup lang="ts">
defineProps<{ userId: string; theme: 'light' | 'dark' }>();
</script>

<template>
  <section :class="`settings theme-${theme}`">Settings for {{ userId }}</section>
</template>
```

Verpacke sie in ein Modul:

```ts
// src/micro-apps/settings/index.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

Registriere es in der Shell:

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

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Name, unter dem sich das Modul über `registerModule` aus `@tuvix.js/loader` registriert. Lifecycle-Events tragen ihn. |
| `App` | `Component` | erforderlich | Root-Komponente von Vue. |
| `plugins` | `VuePluginEntry[]` | keiner | Plugins, die auf jeder Vue-App installiert werden. Ein Eintrag ist ein Plugin oder ein Tupel `[plugin, ...options]`, das an `app.use(plugin, ...options)` geht. |
| `bootstrap` | `() => void \| Promise<void>` | keiner | Einmalige Einrichtung. `bootstrap()` des Moduls wartet darauf. |
| `ssr` | `boolean` | `false` | Hydriert Server-Markup mit `createSSRApp`, wenn der Container Elemente oder Text enthält, der nicht nur aus Leerraum besteht. Ein leerer Container wird mit `createApp` gerendert. |

Das zurückgegebene Modul:

- `mount({ container, props })` erstellt eine Vue-App für diesen Container, installiert die Plugins und mountet sie. Es löst `tuvix:mounted` auf dem Container aus, mit `hydrated: true`, wenn Vue Server-Markup übernommen hat.
- `update({ props, container })` schreibt `props` in das reaktive Props-Objekt dieses Containers und löst auf, nachdem Vue das erneute Rendern ausgeführt hat (`nextTick`). Schlüssel, die in den neuen Props fehlen, werden entfernt. Ohne `container` aktualisiert es jeden Container, in den das Modul gemountet hat.
- `unmount({ container })` unmountet die Vue-App, leert den Container mit `replaceChildren()` und löst `tuvix:unmounted` aus.
- `bootstrap()` führt `config.bootstrap` aus.

Jeder Container bekommt seine eigene Vue-App und seine eigenen Props, sodass ein Modul gleichzeitig an mehreren Stellen mounten kann:

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

#### Props in Komponenten lesen {#reading-props-in-components}

Der Adapter hält die Props in einem `shallowReactive`-Objekt und rendert `App` über einen Root-Wrapper, der sie als Komponenten-Props übergibt. Der Wrapper rendert kein eigenes DOM. Du liest die Props auf eine von zwei Arten:

- **`defineProps`** in der Root-Komponente. `update` rendert sie mit den neuen Werten neu.
- **`inject('tuvixProps')`** (oder `inject(TUVIX_PROPS_KEY)`) in jeder Komponente des Baums. Du bekommst dasselbe reaktive Objekt, sodass sich ein `computed`, das es liest, nach `update` aktualisiert. Verwende es in tief verschachtelten Kindkomponenten, statt Props nach unten durchzureichen.

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

#### Plugins mit Optionen {#plugins-with-options}

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

Jeder Container bekommt seine eigene Vue-App, daher ruft jeder Mount `app.use` für jedes Plugin erneut auf. Ein zustandsbehaftetes Plugin-Objekt, etwa ein einzelnes Ergebnis von `createPinia()`, teilen sich alle Container des Moduls.

### `createSsrVueMicroApp`

```ts no-check
function createSsrVueMicroApp(config: VueSsrMicroAppConfig): MicroAppModule;
```

Entspricht `createVueMicroApp({ ...config, ssr: true })`. Optionen: `name`, `App`, `plugins`, `bootstrap`, wie in der Tabelle oben.

Enthält der Container Markup aus `renderVueToString`, übernimmt Vue diese DOM-Knoten über `createSSRApp` und hängt Listener an sie. Server und Client verwenden denselben Root-Wrapper, daher stimmen die Komponentenbäume überein. Mounte mit denselben Props, mit denen der Server gerendert hat:

```ts
// src/micro-apps/contact/client.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString`

Importiere es aus dem Subpfad `@tuvix.js/vue/server`.

```ts no-check
function renderVueToString(
  App: Component,
  props?: Record<string, unknown>,
  plugins?: VuePluginEntry[],
  ssrContext?: VueSsrContext
): Promise<string>;
```

| Argument | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `App` | `Component` | erforderlich | Root-Komponente, dieselbe, die du an `createSsrVueMicroApp` übergibst. |
| `props` | `Record<string, unknown>` | `{}` | Props für `App`. `inject('tuvixProps')` sieht sie auch während SSR. |
| `plugins` | `VuePluginEntry[]` | keiner | Zu installierende Plugins, in derselben Tupelform wie bei `createVueMicroApp`. |
| `ssrContext` | `VueSsrContext` | `{}` | Objekt, in das Vue während des Renderns schreibt. Lies `teleports` und `modules`, nachdem das Promise aufgelöst ist. |

Es erstellt eine SSR-App mit dem gemeinsamen Root-Wrapper, installiert die Plugins und gibt das HTML aus `renderToString` von `@vue/server-renderer` zurück. Installiere dieses Paket; `renderVueToString` importiert es beim ersten Aufruf.

`renderVueToString` läuft nur auf dem Server. Rufe es aus einer Server-Funktion auf (einem `createServerFn`-Handler von TanStack Start, einer API-Route, deinem Express-Handler), nicht aus einem isomorphen Route Loader. Ein Loader läuft bei der Client-Navigation auch im Browser, wo die Funktion `''` zurückgibt, und dein Bundler liefert den Vue Server Renderer an den Client aus, weil der Loader ihn importiert.

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

Lege `html` in deiner Seite in das Container-Element (`<div id="contact">…</div>`) und mounte dann `createSsrVueMicroApp` auf dem Client wie oben gezeigt. Das HTML eines `<Teleport>`-Ziels steht in `ssrContext.teleports['#target']`, nicht im zurückgegebenen String; gib es dort aus, wo das Ziel liegt.

### `TUVIX_PROPS_KEY`

```ts no-check
const TUVIX_PROPS_KEY = 'tuvixProps';
```

Injection Key des reaktiven Props-Objekts. `inject(TUVIX_PROPS_KEY)` und `inject('tuvixProps')` geben dasselbe Objekt zurück, auf dem Client und während `renderVueToString`.

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

Abonniert `event` mit `handler` in `onMounted` und beendet das Abonnement in `onUnmounted`. Die zurückgegebene Funktion beendet es vorzeitig. Rufe es während `setup` auf. `onMounted` läuft beim Server-Rendering nicht, daher existiert das Abonnement nur auf dem Client.

Der Adapter übergibt den Bus des Orchestrators nicht an `App`. Der Orchestrator verwendet `getGlobalBus()`, sofern du ihm keine `eventBus`-Optionen gegeben hast:

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

| Argument | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `initialProps` | `T` | erforderlich | Startwert, einmal kopiert. |
| `bus` | `IEventBus` | keiner | Bus, auf dem gelauscht wird. Ohne ihn behält die Ref `initialProps`. |
| `updateEvent` | `string` | `'tuvix:props:update'` | Event, dessen Payload das Composable in die Ref zusammenführt (`{ ...prev, ...payload }`). |

Weder der Orchestrator noch der Adapter senden `tuvix:props:update`; du sendest es selbst. Für Props vom Orchestrator verwendest du `defineProps` oder `inject(TUVIX_PROPS_KEY)`, die `update` ohne Bus folgen.

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

### Typen

| Typ | Exportiert aus | Bedeutung |
| --- | --- | --- |
| `VueMicroAppConfig` | `@tuvix.js/vue` | Konfiguration von `createVueMicroApp`: `name`, `App`, `plugins?`, `bootstrap?`, `ssr?`. |
| `VueSsrMicroAppConfig` | `@tuvix.js/vue` | `VueMicroAppConfig` ohne `ssr`; Konfiguration von `createSsrVueMicroApp`. |
| `VuePluginEntry` | `@tuvix.js/vue` | `Plugin \| [Plugin, ...any[]]`: ein Plugin oder ein Plugin samt seinen `app.use`-Optionen. |
| `VueSsrContext` | `@tuvix.js/vue/server` | `{ teleports?: Record<string, string>; modules?: Set<string>; [key: string]: unknown }`, von Vue und seinen Plugins während `renderVueToString` befüllt. `@vitejs/plugin-vue` hält gerenderte Komponentenmodule in `modules` fest. |

## Sonderfälle

- **Fehler beim Mount.** Fehler in Setup, Render und Lifecycle Hooks während `mount` lassen das Promise in Entwicklungs- und Produktions-Builds ablehnen. Der Adapter unmountet die fehlgeschlagene App und löst `tuvix:error` aus. Ein eigener `app.config.errorHandler` eines Plugins erhält den Fehler weiterhin.
- **Zweimal in einen Container mounten.** Ein zweites `mount` auf einem Container, den das Modul bereits belegt, unmountet zuerst die alte App (löst `tuvix:unmounted` aus und leert den Container) und mountet dann eine neue. Mit `ssr: true` rendert dieser zweite Mount neu, weil der Container leer ist.
- **Unbekannter Container.** `unmount` auf einem Container, in den das Modul nie gemountet hat, tut nichts. `update` mit einem solchen `container` ändert nichts.
- **Props werden ersetzt.** `update` des Moduls setzt die Props auf das übergebene Objekt und löscht fehlende Schlüssel. `orchestrator.updateAppProps` führt neue Props mit den registrierten zusammen, bevor es `update` aufruft.
- **Nicht deklarierte Props.** Props, die die Root-Komponente nicht mit `defineProps` deklariert, kommen bei ihr als Attribute an und landen auf ihrem Root-Element, wie Vue es bei jeder Komponente macht. `{ lang: 'en' }` rendert `lang="en"` auf dem Root-Element, sofern du `lang` nicht deklarierst oder `inheritAttrs: false` setzt.
- **Container nur mit Leerraum bei `ssr: true`.** Der Adapter rendert mit `createApp`, weil `hasServerMarkup` Leerraum-Text und Kommentare ignoriert. Vue warnt nicht, dass ein leerer Container hydriert wird.
- **`renderVueToString` im Browser.** Es gibt `''` zurück, wenn `window` existiert.
- **Fehler beim Unmount.** Wirft `app.unmount()`, leert der Adapter den Container, löst `tuvix:error` aus und wirft den Fehler erneut.
- **Derselbe Name zweimal.** `registerModule` behält das zuletzt unter einem Namen erstellte Modul.

## Was es nicht tut

- Es unterstützt Vue 2 nicht.
- Es lädt keine Module per URL. Importiere das Modul oder lass [`@tuvix.js/core`](/de/packages/core) es über einen `entry` laden.
- Es übergibt `MountContext.bus` und `MountContext.name` nicht an deine Komponenten. Verwende `getGlobalBus()` aus `@tuvix.js/event-bus`.
- `renderVueToString` streamt nicht und sammelt kein CSS. Verwende [`@tuvix.js/vite`](/de/packages/vite), um Stylesheet-Links für serverseitig gerenderte Islands auszugeben.
- Es platziert teleportiertes HTML nicht für dich. Lies `ssrContext.teleports` und gib es aus.

## Migration von 0.4 {#migrating-from-0-4}

**`$tuvixProps` gibt es nicht mehr.** `update()` schreibt `app.config.globalProperties.$tuvixProps` nicht mehr. Lies Props mit `defineProps` oder `inject`:

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

**`unmount` auf einem unbekannten Container tut nichts.** In 0.4 hat es den Container geleert. Rufe selbst `container.replaceChildren()` auf, falls du dich darauf verlassen hast.

**`VueSsrMicroAppConfig` hat kein Feld `ssr`.** Entferne `ssr` aus der Konfiguration, die du an `createSsrVueMicroApp` übergibst.

**Konfigurationsobjekt.** Frühere Versionen dieser Seite zeigten `createVueMicroApp(App)`. Die Funktion nimmt ein Konfigurationsobjekt: `createVueMicroApp({ name: 'settings', App })`.

Weitere Schritt-für-Schritt-Anleitungen findest du in der [Vue-Anleitung](/de/guide/vue).

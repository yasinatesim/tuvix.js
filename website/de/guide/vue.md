# Mit Vue

`@tuvix.js/vue` macht aus einer Vue-3-Root-Komponente eine Micro App, hydriert serverseitig gerendertes Markup und rendert Komponenten auf dem Server zu HTML.

## Installation

```bash
pnpm add @tuvix.js/vue vue
# for renderVueToString on the server
pnpm add @vue/server-renderer
```

## Eine Komponente in eine Micro App verwandeln

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

| Option | Typ | Beschreibung |
| --- | --- | --- |
| `name` | `string` | Pflicht. Muss mit dem registrierten App-Namen übereinstimmen. |
| `App` | `Component` | Pflicht. Root-Komponente. |
| `plugins` | `Array<Plugin \| [Plugin, ...options]>` | Wird bei jedem Mount mit `app.use(plugin, ...options)` installiert. |
| `bootstrap` | `() => void \| Promise<void>` | Läuft einmal vor dem ersten Mount. |
| `ssr` | `boolean` | Hydriert Server-Markup. `createSsrVueMicroApp` setzt es. |

Jeder Container bekommt eine eigene Vue-App, daher führt jeder Mount das `install` jedes Plugins erneut aus. Eine Plugin-Instanz wie `createPinia()` teilen sich alle Mounts des Moduls. Erzeuge sie innerhalb einer Plugin-Funktion, wenn jeder Mount einen eigenen Store braucht.

Ein Mount in einen Container, der diese App bereits enthält, unmountet zuerst die alte Instanz. `unmount` zerstört die App, leert den Container und löst `tuvix:unmounted` aus.

## Props

Der Adapter übergibt Props an die Root-Komponente und stellt sie zusätzlich unter `'tuvixProps'` (`TUVIX_PROPS_KEY`) für jeden Nachfahren bereit:

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

`update({ props })` ersetzt die Props in einem `shallowReactive`-Objekt und wartet auf den nächsten Tick von Vue. Die Root-Komponente rendert mit den neuen Werten neu und behält ihren lokalen Zustand. Schlüssel, die in den neuen Props fehlen, werden entfernt. Ohne `container` aktualisiert `update` jeden Mount des Moduls.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## Server-Rendering und Hydration

Rendere auf dem Server mit `renderVueToString` und hydriere auf dem Client mit `createSsrVueMicroApp`:

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

- `renderVueToString(App, props?, plugins?, ssrContext?)` umschließt `App` mit demselben Root, den der Client verwendet, sodass `inject('tuvixProps')` auf dem Server funktioniert und die Hydration übereinstimmt.
- Rufe es nur aus Server-Code auf: einer Server-Funktion, einer API-Route oder deinem Server-Entry. Im Browser gibt es `''` zurück. Ein isomorpher Route-Loader läuft auch im Browser, und der Bundler liefert dann den Vue-Server-Renderer an den Client aus.
- Mit `ssr: true` und Server-Markup im Container ruft der Adapter `createSSRApp` auf und behält die DOM-Knoten des Servers. Ein leerer Container bekommt einen frischen Render mit `createApp`.
- Das HTML enthält kein CSS. Vite fügt die `<style>`-Blöcke von SFCs per JavaScript ein, nachdem die Hydration begonnen hat. Verlinke die Stylesheets im `<head>` mit `@tuvix.js/vite`; siehe [SSR-Islands](/de/guide/ssr-islands).

In einem React-Host mountest du das Modul mit `TuvixIsland`.

## Composables

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

Es abonniert in `onMounted`, beendet das Abonnement in `onUnmounted` und gibt eine Funktion für vorzeitiges Aufräumen zurück.

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` gibt eine `ShallowRef` zurück, die jede auf `updateEvent` gesendete Payload einfließen lässt. Nichts in Tuvix.js sendet dieses Event. Mit dem Adapter rendern Props, die über `updateAppProps` kommen, die Komponente bereits neu, daher brauchst du es selten.

## Sonderfälle

- Pfad-Aliase wie `~/utils` müssen auch in `.vue`-Dateien aufgelöst werden. Stammt dein Alias aus `vite-tsconfig-paths`, nimm `**/*.vue` in das `include` dieser tsconfig auf oder setze `resolve.alias` in der Vite-Konfiguration. Siehe [Fehlerbehebung](/de/guide/troubleshooting).
- Ein Fehler in Setup, Render oder einem Lifecycle Hook während des Mounts lehnt `mount` ab und löst `tuvix:error` aus, auch in Production-Builds. Der eigene `app.config.errorHandler` eines Plugins läuft trotzdem.
- `unmount` auf einem Container, den dieses Modul nie gemountet hat, tut nichts.

## API

| Export | Zweck |
| --- | --- |
| `createVueMicroApp({ name, App, plugins?, bootstrap?, ssr? })` | Vue-Micro-App-Modul |
| `createSsrVueMicroApp({ name, App, plugins?, bootstrap? })` | Dasselbe mit `ssr: true` |
| `TUVIX_PROPS_KEY` | Injection Key (`'tuvixProps'`) für die reaktiven Props |
| `useTuvixBus(bus, event, handler)` | An die Komponente gebundenes Event-Bus-Abonnement |
| `useTuvixProps(initial, bus?, event?)` | Aus Bus-Events zusammengeführte `ShallowRef` |
| `renderVueToString(App, props?, plugins?, ssrContext?)` aus `@tuvix.js/vue/server` | Server-HTML |

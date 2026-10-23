# @tuvix.js/vue

> Mach aus Vue-3-Komponenten Tuvix.js Micro Apps mit reaktiven Props, einer Vue-App pro Container und SSR-Hydration.

Teil des [Tuvix.js](https://github.com/yasinatesim/tuvix.js) Microfrontend-Frameworks.

## Installation

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

Für Server-Rendering installierst du zusätzlich die optionale Peer-Dependency `@vue/server-renderer`.

## Schnellstart

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

Das Modul registriert sich über `registerModule` aus `@tuvix.js/loader` unter `'settings'`, sodass der Orchestrator es findet, sobald das Skript geladen ist. `App` erhält die Props des Orchestrators als Komponenten-Props; deklariere sie mit `defineProps`.

## API

### `createVueMicroApp(config)`

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Name in der Registry; Lifecycle-Events tragen ihn mit. |
| `App` | `Component` | erforderlich | Root-Komponente von Vue. |
| `plugins` | `VuePluginEntry[]` | keiner | Plugins oder Tupel `[plugin, ...options]`, die an `app.use(plugin, ...options)` übergeben werden. |
| `bootstrap` | `() => void \| Promise<void>` | keiner | Einmaliges Setup. |
| `ssr` | `boolean` | `false` | Hydriert Server-Markup mit `createSSRApp`, wenn der Container Elemente oder Text enthält, der nicht nur aus Leerzeichen besteht. |

- Jeder Container bekommt eine eigene Vue-App und eigene Props, sodass ein Modul an mehreren Stellen mounten kann. Jeder Mount installiert die Plugins erneut.
- `mount({ container, props })` sendet `tuvix:mounted` mit `hydrated`.
- `update({ props, container })` ersetzt die Schlüssel eines `shallowReactive`-Props-Objekts (fehlende Schlüssel werden entfernt) und löst nach `nextTick` auf. Ohne `container` aktualisiert es jeden Mount. Der Komponentenzustand bleibt erhalten.
- `unmount({ container })` unmountet die App, leert den Container und sendet `tuvix:unmounted`.

### `createSsrVueMicroApp(config)`

`createVueMicroApp({ ...config, ssr: true })`. Optionen: `name`, `App`, `plugins`, `bootstrap`. Vue übernimmt das Markup aus `renderVueToString`; ein leerer Container wird normal gerendert.

```ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString(App, props?, plugins?, ssrContext?)`

Aus `@tuvix.js/vue/server`. Gibt das HTML von `App` zurück, gerendert mit demselben Root-Wrapper, den der Client verwendet, sodass die Hydration passt und `inject('tuvixProps')` auf dem Server funktioniert. Vue schreibt `teleports` und `modules` in `ssrContext`.

Nur für den Server: Ruf es aus einer Server-Funktion auf, nicht aus einem isomorphen Route Loader. Im Browser gibt es `''` zurück, und ein Loader, der es importiert, liefert den Server-Renderer von Vue an den Client aus.

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

`'tuvixProps'`. `inject(TUVIX_PROPS_KEY)` gibt in jeder Komponente des Baums das reaktive Props-Objekt zurück, in das `update` schreibt.

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus(bus, event, handler)`

Abonniert in `onMounted`, kündigt das Abo in `onUnmounted` und gibt eine Funktion zurück, mit der du das Abo vorzeitig beendest. Übergib `getGlobalBus()` aus `@tuvix.js/event-bus`; der Adapter reicht den Bus des Orchestrators nicht an `App` weiter.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Gibt eine `ShallowRef<T>` zurück, in die jede Payload von `updateEvent` (Standard `'tuvix:props:update'`) auf `bus` eingemischt wird. Nichts in Tuvix sendet dieses Event; du sendest es selbst. Für Props des Orchestrators verwende `defineProps` oder `inject(TUVIX_PROPS_KEY)`.

### Typen

`VueMicroAppConfig`, `VueSsrMicroAppConfig`, `VuePluginEntry` aus `@tuvix.js/vue`; `VueSsrContext` aus `@tuvix.js/vue/server`.

## Sonderfälle

- Fehler in Setup, Render und Hooks während `mount` führen in Entwicklungs- und Produktions-Builds zur Ablehnung; der Adapter unmountet die fehlgeschlagene App und sendet `tuvix:error`. Ein `app.config.errorHandler` eines Plugins läuft trotzdem.
- `mount` auf einem Container, den das Modul bereits hält, unmountet zuerst die alte App.
- `unmount` auf einem Container, den das Modul nie gemountet hat, tut nichts.
- Props, die die Root-Komponente nicht deklariert, landen als Attribute auf ihrem Root-Element.
- Mit `ssr: true` wird ein Container, der nur Leerzeichen oder Kommentare enthält, frisch gerendert.

## Was es nicht tut

- Vue 2 unterstützen.
- Module per URL laden. Verwende `@tuvix.js/core` oder `@tuvix.js/loader`.
- CSS sammeln oder HTML auf dem Server streamen. Verwende `@tuvix.js/vite` für Stylesheet-Links.

## Breaking Changes in 0.5

- `update()` schreibt nicht mehr in `app.config.globalProperties.$tuvixProps`. Verwende `defineProps` oder `inject('tuvixProps')`.
- `unmount()` auf einem Container, den das Modul nie gemountet hat, tut nichts; vorher hat es den Container geleert.
- `VueSsrMicroAppConfig` akzeptiert `ssr` nicht mehr.

Vollständige Dokumentation: [tuvix.js.org/de/packages/vue](https://tuvix.js.org/de/packages/vue)

## Lizenz

MIT

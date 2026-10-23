# @tuvix.js/svelte

> Svelte-3/4/5-Bindungen für das Tuvix.js Microfrontend-Framework

Teil des [Tuvix.js](https://github.com/yasinatesim/tuvix.js) Microfrontend-Frameworks.

## Installation

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

## Schnellstart

```ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App });
```

Der Adapter registriert das Modul mit `registerModule` aus `@tuvix.js/loader`, sodass der Orchestrator es über den Namen findet. Beim ersten Mount importiert er `svelte` und prüft, ob es einen Export `mount` gibt:

- **Svelte 5**: `mount()` / `hydrate()` / `unmount()` aus `svelte`.
- **Svelte 3/4**: `new App({ target, props })`, `$set()` und `$destroy()`.

Dein Bundler muss `svelte` auf den Client-Build auflösen (die Export-Bedingung `browser`; `@sveltejs/vite-plugin-svelte` setzt sie). Wählt er den Server-Build, wirft `mount()` in Svelte 5 den Fehler `lifecycle_function_unavailable`.

## API

### `createSvelteMicroApp(config)`

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Name der App, registriert mit `registerModule` |
| `App` | `unknown` | erforderlich | Svelte-5-Komponente oder Svelte-3/4-Komponentenklasse |
| `bootstrap` | `() => void \| Promise<void>` | keiner | Einmaliges Setup |
| `ssr` | `boolean` | `false` | Hydriert Server-Markup, wenn der Container welches enthält |
| `SvelteMap` | Klasse `SvelteMap` | keiner | Nur Svelte 5: `SvelteMap` aus `svelte/reactivity`, damit `update()` an Ort und Stelle neu rendert, statt neu zu mounten |

- Jeder Container bekommt eine eigene Instanz, sodass ein Modul in mehrere Container mounten kann.
- `mount` leert den Container (außer beim Hydrieren), rendert und sendet `tuvix:mounted`, nachdem `onMount`-Callbacks und Effects gelaufen sind. Ein fehlgeschlagener Mount sendet `tuvix:error` und lehnt ab.
- `unmount` zerstört die Instanz, leert den Container und sendet `tuvix:unmounted`. Wird es aufgerufen, während `mount` noch lädt, wartet es auf den Mount und baut ihn danach ab.
- `update({ props, container? })` aktualisiert einen Container, ohne `container` jede Instanz. Svelte 3/4 verwendet `$set()`. Svelte 5 mountet standardmäßig neu: Es unmountet die Instanz, mountet eine neue mit den neuen Props und sendet erneut `tuvix:mounted`, sodass DOM-Knoten und Komponentenzustand verloren gehen. Übergib `SvelteMap`, um stattdessen an Ort und Stelle zu aktualisieren (funktioniert für `$props()` und `export let`):

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App, SvelteMap });
```

Der Adapter importiert `svelte/reactivity` nicht selbst: Svelte 3/4 hat kein solches Modul, und dieser Import würde Builds von Svelte-3/4-Apps brechen.

Der Host sendet neue Props über den Orchestrator:

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

Entspricht `createSvelteMicroApp({ ...config, ssr: true })`. Es hydriert, wenn der Container Elemente oder Text enthält, der nicht nur aus Leerzeichen besteht, und rendert sonst frisch. Die Hydration in Svelte 5 braucht die Kommentarmarker, die `svelte/server` schreibt. Kompiliere Svelte-3/4-Komponenten mit `hydratable: true`.

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString(App, props?, options?)` aus `@tuvix.js/svelte/server`

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | keiner | `render` aus `svelte/server`; ohne diese Option importiert der Adapter `svelte/server` zur Laufzeit |

Gibt die `<style>`-Tags der Komponente gefolgt von ihrem Markup zurück. Wenn du `render` übergibst, verwendet es immer `render` aus Svelte 5. Ohne `render` importiert der Adapter `svelte`: Exportiert dieses Modul `mount`, lädt er `svelte/server` (Svelte 5), sonst ruft er `App.render(props)` auf (Svelte 3/4) und hüllt `css.code` in `<style>`. Svelte-5-Komponenten, die mit `dev: true` kompiliert sind (vite-plugin-svelte im Serve-Modus), tragen ein `App.render`, das einen Fehler wirft, deshalb entscheidet der Adapter nie anhand von `App.render`. Ruf es aus einer Server-Funktion auf; im Browser gibt es `''` zurück.

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

### `renderSvelte(App, props?, options?)` aus `@tuvix.js/svelte/server`

Gleiche Optionen. Gibt `{ html, head, css }` zurück, sodass du Inhalte aus `<svelte:head>` in den Head des Dokuments setzen kannst.

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

### Typen

`SvelteMicroAppConfig`, `SvelteProps` (aus `@tuvix.js/svelte`); `RenderSvelteOptions`, `SvelteServerRender`, `SvelteRenderResult` (aus `@tuvix.js/svelte/server`).

## Sonderfälle

- Svelte 5 gibt CSS nur dann in der Server-Ausgabe aus, wenn du mit `css: 'injected'` kompilierst (Vite: `svelte({ compilerOptions: { css: 'injected' } })`). Mit dem Standard `css: 'external'` schreibt dein Bundler das CSS in eine Datei.
- Übergib `render` aus `svelte/server`, wenn dein Server-Bundle Svelte enthält (Nitro, Vinxi, ein Vite-SSR-Build mit `noExternal`). Der Server-Renderer von Svelte schlägt fehl, wenn Komponente und Renderer aus zwei Svelte-Kopien stammen.
- Jedes Update ersetzt den gesamten Satz an Props. Ein Schlüssel, der in den neuen Props fehlt, wird in Svelte 5 gelöscht (der Standardwert greift) und in Svelte 3/4 auf `undefined` gesetzt.
- `mount` auf einem gemounteten Container unmountet zuerst die alte Instanz. `unmount` auf einem Container, den das Modul nie gemountet hat, tut nichts: Es lässt die Kindelemente des Containers stehen und sendet kein Event.
- Ein Import- oder Renderfehler von Svelte 5 auf dem Server lehnt ab; es gibt keinen Fallback auf `App.render`.

## Was es nicht tut

- Es kompiliert keine `.svelte`-Dateien und prüft nicht, welchen Svelte-Build dein Bundler gewählt hat.
- Es übergibt nur Props: keine Slots, Snippets oder Komponenten-Events vom Host.
- Es schreibt keine Inhalte aus `<svelte:head>` in das Dokument und verlinkt keine Stylesheets aus `css: 'external'`.

Vollständige Dokumentation: [tuvix.js.org/de/packages/svelte](https://tuvix.js.org/de/packages/svelte)

## Lizenz

MIT

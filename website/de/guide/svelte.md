# Mit Svelte

`@tuvix.js/svelte` macht aus einer Svelte-Komponente eine Micro App. Es unterstützt Svelte 5 und Svelte 3/4, hydriert Server-Markup und rendert Komponenten auf dem Server zu HTML.

## Installation

```bash
pnpm add @tuvix.js/svelte svelte
```

## Eine Komponente in eine Micro App verwandeln

```ts
// src/main.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

// SvelteMap (Svelte 5 only) lets update() re-render in place; drop it for Svelte 3/4.
export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

Beim ersten Mount importiert der Adapter `svelte` und prüft, welche API es bietet:

| Svelte | Mount | Hydration | Update | Unmount |
| --- | --- | --- | --- | --- |
| 5 | `mount(App, { target, props })` | `hydrate(...)` | an Ort und Stelle mit `SvelteMap`, sonst erneuter Mount | `unmount(instance)` |
| 3 / 4 | `new App({ target, props })` | `new App({ hydrate: true })` | `instance.$set(props)` | `instance.$destroy()` |

Dein Bundler muss `svelte` zu seinem Browser-Build auflösen. Wählt er den Server-Build, wirft `mount()` in Svelte 5 `lifecycle_function_unavailable`, oder `onMount`-Callbacks laufen nie. Siehe [Fehlerbehebung](/de/guide/troubleshooting).

Jeder Container bekommt eine eigene Komponenteninstanz. `mount` löst `tuvix:mounted` aus, nachdem `onMount`-Callbacks und Effects gelaufen sind. Ohne `ssr` leert `mount` den Container, bevor es rendert. `unmount` auf einem Container, den dieses Modul nie gemountet hat oder dessen Mount fehlgeschlagen ist, tut nichts.

## Props

Svelte 5 mit Runes:

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { userId, theme = 'light' }: { userId: string; theme?: string } = $props();
</script>

<div class="theme-{theme}">User {userId}</div>
```

Svelte 3/4 oder Svelte 5 im Legacy-Modus:

```svelte
<script lang="ts">
  export let userId: string;
  export let theme = 'light';
</script>

<div class="theme-{theme}">User {userId}</div>
```

Übergib unter Svelte 5 `SvelteMap` aus `svelte/reactivity` in der Konfiguration. Der Adapter gibt der Komponente dann ein Props-Objekt, das auf einer `SvelteMap` basiert, und `update({ props })` schreibt die neuen Werte hinein: Nur die Teile, die eine geänderte Prop lesen, rendern neu, und DOM-Knoten sowie Komponentenzustand bleiben erhalten. Das funktioniert für `$props()` und für `export let`. Ohne `SvelteMap` unmountet ein `update()` unter Svelte 5 die Instanz, mountet eine neue mit den neuen Props und löst erneut `tuvix:mounted` aus, sodass der lokale Zustand zurückgesetzt wird. Der Adapter importiert `svelte/reactivity` nicht selbst, weil dieses Modul in Svelte 3/4 nicht existiert und deren Builds sonst fehlschlagen würden.

Unter Svelte 3/4 ruft `update` `$set` auf und ignoriert `SvelteMap`.

Jedes Update ersetzt den gesamten Satz an Props. Ein Schlüssel, der in den neuen Props fehlt, fällt unter Svelte 5 auf den Standardwert der Prop zurück und wird unter Svelte 3/4 zu `undefined`. Der Orchestrator sendet immer die zusammengeführten Props, daher spielt das nur eine Rolle, wenn du `update` selbst aufrufst.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

## Server-Rendering und Hydration

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

- `renderSvelteToString(App, props?, { render? })` gibt die `<style>`-Tags der Komponente gefolgt von ihrem Markup zurück. Rufe es aus Server-Code auf; im Browser gibt es `''` zurück.
- Übergib `render` aus `svelte/server`, wenn dein Server-Bundle Svelte enthält (Nitro, Vinxi, ein Vite-SSR-Build mit `noExternal`). Ohne das importiert der Adapter `svelte/server` zur Laufzeit, was eine zweite Svelte-Kopie laden kann, und der Server-Renderer von Svelte scheitert über Kopien hinweg.
- `renderSvelte(App, props?, { render? })` gibt `{ html, head, css }` zurück, wenn du die Ausgabe von `<svelte:head>` brauchst. Setze `head` selbst in den `<head>` des Dokuments; die Island darf kein `<title>` oder `<meta>` enthalten.
- `createSsrSvelteMicroApp` hydriert, wenn der Container Elemente oder Text enthält, der nicht nur aus Leerraum besteht, und rendert sonst frisch. Svelte-3/4-Komponenten müssen mit `hydratable: true` kompiliert sein.

### CSS beim ersten Paint

Wähle eine Variante:

- **CSS im HTML.** Kompiliere mit `compilerOptions: { css: 'injected' }`. Svelte 5 legt das Komponenten-CSS dann in die Server-Ausgabe, und `renderSvelteToString` nimmt es als `<style>`-Tags in die Island auf.
- **CSS als Dateien.** Behalte den Standard `emitCss: true` und verlinke die Stylesheets der Island im `<head>` mit `@tuvix.js/vite`. Siehe [SSR-Islands](/de/guide/ssr-islands).

Mit `css: 'injected'` gibt es keine Stylesheet-Datei, daher findet `@tuvix.js/vite` nichts zum Verlinken. Kombiniere die beiden nicht.

## Event Bus

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

## Was der Adapter nicht tut

- Er kompiliert keine `.svelte`-Dateien; das übernimmt `@sveltejs/vite-plugin-svelte`.
- Er übergibt nur Props. Slots, Snippets oder Komponenten-Events gelangen nicht vom Host herüber.
- Er prüft nicht, welchen Svelte-Build dein Bundler gewählt hat.

## API

| Export | Zweck |
| --- | --- |
| `createSvelteMicroApp({ name, App, bootstrap?, ssr?, SvelteMap? })` | Svelte-Micro-App-Modul |
| `createSsrSvelteMicroApp({ name, App, bootstrap?, SvelteMap? })` | Dasselbe mit `ssr: true` |
| `renderSvelteToString(App, props?, options?)` aus `@tuvix.js/svelte/server` | Styles + Markup |
| `renderSvelte(App, props?, options?)` aus `@tuvix.js/svelte/server` | `{ html, head, css }` |

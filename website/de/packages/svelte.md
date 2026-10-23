---
title: '@tuvix.js/svelte'
---

<PackageHeader
  name="@tuvix.js/svelte"
  title="Svelte Bindings"
  description="Macht aus einer Svelte-3-, 4- oder 5-Komponente eine Tuvix.js Micro App: eine Instanz pro Container, Prop-Updates an Ort und Stelle, Hydration von Server-Markup und Server-Rendering mit CSS."
  icon="🔥"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

Der Peer-Bereich umfasst Svelte 3, 4 und 5. Das Paket hat zwei Entry Points: `@tuvix.js/svelte` für den Browser und `@tuvix.js/svelte/server` für das Server-Rendering.

## Wann du es verwendest {#when-to-use-it}

Verwende dieses Paket, wenn eine Svelte-Komponente als Tuvix.js Micro App laufen soll: Der Orchestrator mountet sie auf einer Route in einen Container, übergibt Props, aktualisiert sie und unmountet die Komponente, wenn sich die Route ändert. Es deckt auch Islands ab: Du renderst die Komponente auf dem Server, legst das HTML in die Seite, und der Client hydriert es.

Für eine Seite, die Svelte von oben bis unten besitzt (SvelteKit), brauchst du es nicht. In dem Fall mountet sich Svelte selbst, und es gibt keinen Orchestrator, mit dem es reden müsste.

## Schnellstart {#quick-start}

Eine Svelte-5-Komponente mit Props:

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { name, theme = 'light' }: { name: string; theme?: string } = $props();
</script>

<p class={theme}>Hello {name}</p>
```

Der Micro-App-Entry umschließt sie. Übergibst du `SvelteMap`, rendern Prop-Updates die Komponente an Ort und Stelle neu:

```ts
// profile-app.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

Die Shell registriert die App und startet den Orchestrator:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
  props: { name: 'Ada' },
});

await orchestrator.start();

// Later: the component re-renders in place, no remount.
await orchestrator.updateAppProps('profile', { name: 'Grace', theme: 'dark' });
```

Das Client-Bundle muss `svelte` auf seinen Browser-Build auflösen. `@sveltejs/vite-plugin-svelte` erledigt das für dich. Verwirft dein Setup die Export-Condition `browser`, wirft `mount()` in Svelte 5 den Fehler `lifecycle_function_unavailable`, und `onMount` läuft nie.

## API

### `createSvelteMicroApp`

```ts no-check
function createSvelteMicroApp(config: SvelteMicroAppConfig): MicroAppModule;
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | App-Name. Der Adapter registriert das Modul unter diesem Namen mit `registerModule` aus `@tuvix.js/loader`. |
| `App` | `unknown` | erforderlich | Root-Komponente: eine kompilierte Svelte-5-Komponente (eine Funktion) oder eine Komponentenklasse aus Svelte 3/4. |
| `bootstrap` | `() => void \| Promise<void>` | keiner | Einmaliges Setup. `bootstrap()` des Moduls wartet darauf. |
| `ssr` | `boolean` | `false` | Server-Markup hydrieren, wenn der Container Elemente oder Text enthält, der nicht nur aus Whitespace besteht. Sonst neu rendern. |
| `SvelteMap` | Klasse `SvelteMap` aus `svelte/reactivity` | keiner | Nur Svelte 5. Damit rendert `update()` an Ort und Stelle neu; ohne sie mountet ein `update()` unter Svelte 5 die Komponente neu. Svelte 3/4 ignorieren die Option. |

Beim ersten Mount importiert der Adapter `svelte` und prüft, ob es einen Export `mount` gibt. Das Ergebnis cacht er für die Seite.

- **Svelte 5** (`mount` existiert): rendert mit `mount()`, hydriert mit `hydrate()` und räumt mit `unmount()` ab. Wie `update()` arbeitet, hängt von `SvelteMap` ab:
  - Mit `SvelteMap` bekommt die Komponente ein Props-Objekt, hinter dem eine `SvelteMap` steht. `update()` schreibt die neuen Werte in diese Map, daher rendern die Teile des Templates neu, die eine geänderte Prop lesen, und die Komponente behält ihre DOM-Knoten und ihren State. Das funktioniert für Komponenten mit `$props()` und für Legacy-Komponenten mit `export let`, die Svelte 5 kompiliert hat.
  - Ohne sie unmountet `update()` die Instanz, leert den Container, mountet eine neue Instanz mit den neuen Props und löst `tuvix:mounted` erneut mit `hydrated: false` aus. DOM-Knoten, Fokus und Komponenten-State gehen verloren.
- **Svelte 3/4** (kein `mount`): `new App({ target, props, hydrate })`, `$set()` und `$destroy()`.

Das zurückgegebene Modul arbeitet pro Container. Jeder Container bekommt seine eigene Instanz, daher kann ein Modul gleichzeitig in drei Container rendern.

- `mount({ container, props })` leert den Container (außer beim Hydrieren), rendert, führt `onMount`-Callbacks und Effects aus und löst dann `tuvix:mounted` mit `hydrated: true | false` auf dem Container aus. Ein Fehler löst `tuvix:error` aus und lehnt mit dem ursprünglichen Fehler ab.
- `update({ props, container? })` aktualisiert die Instanz in `container` oder jede Instanz, wenn du `container` weglässt. Jedes Update ersetzt den kompletten Prop-Satz: Ein Schlüssel, der in den neuen Props fehlt, fällt unter Svelte 5 auf den Standardwert der Komponente zurück und wird unter Svelte 3/4 zu `undefined`.
- `unmount({ container })` zerstört die Instanz, leert den Container und löst `tuvix:unmounted` aus.

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import { onLifecycle } from '@tuvix.js/loader';
import Cart from './Cart.svelte';

const cart = createSvelteMicroApp({ name: 'cart', App: Cart, SvelteMap });

onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} mounted`, { hydrated });
});

const header = document.querySelector<HTMLElement>('#cart-header')!;
const sidebar = document.querySelector<HTMLElement>('#cart-sidebar')!;

await cart.mount({ container: header, props: { compact: true } });
await cart.mount({ container: sidebar, props: { compact: false } });

// Updates the sidebar instance only.
await cart.update?.({ props: { compact: true }, container: sidebar });
```

### `createSsrSvelteMicroApp`

```ts no-check
function createSsrSvelteMicroApp(config: Omit<SvelteMicroAppConfig, 'ssr'>): MicroAppModule;
```

Entspricht `createSvelteMicroApp({ ...config, ssr: true })`. Verwende es auf dem Client für Islands, die der Server mit `renderSvelteToString` oder `renderSvelte` gerendert hat.

- **Svelte 5**: `hydrate(App, { target, props })`. Das Markup muss aus `svelte/server` stammen, weil die Hydration die Kommentarmarkierungen (`<!--[-->`) liest, die es schreibt.
- **Svelte 3/4**: `new App({ target, props, hydrate: true })`. Kompiliere die Komponente mit `hydratable: true`.

Die Hydration behält die DOM-Knoten vom Server und hängt Event-Handler an sie. Ein Container, der nur Whitespace oder Kommentare enthält, wird neu gerendert.

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelteToString(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<string>;
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | keiner | `render` aus `svelte/server`. Ohne die Option importiert der Adapter `svelte/server` zur Laufzeit. |

Rendert die Komponente auf dem Server und gibt ihre `<style>`-Tags gefolgt von ihrem Markup zurück. Leg den String in den Island-Container und mounte ihn mit `createSsrSvelteMicroApp`. Der String enthält keinen Inhalt aus `<svelte:head>`; nimm `renderSvelte`, wenn du ihn brauchst.

Die Funktion wählt die Svelte-Version zur Laufzeit. Mit übergebenem `render` nimmt sie immer den Svelte-5-Pfad und ruft `render(App, { props })` auf. Ohne die Option importiert der Adapter `svelte`: Exportiert dieses Modul `mount`, lädt er `svelte/server` und rendert mit Svelte 5. Sonst ruft er `App.render(props)` auf (Svelte 3/4, kompiliert mit `generate: 'ssr'`) und packt `css.code` in ein `<style>`-Tag. Der Adapter entscheidet nie anhand von `App.render`, weil Svelte-5-Komponenten, die mit `dev: true` kompiliert wurden (vite-plugin-svelte im Serve-Modus), einen `App.render`-Stub mitbringen, der wirft.

Ruf die Funktion aus einer Serverfunktion auf, nicht aus Code, der auch im Browser läuft. Im Browser gibt sie `''` zurück.

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooterIsland(): Promise<string> {
  const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
  return `<footer id="footer" data-tuvix-app="footer">${html}</footer>`;
}
```

### `renderSvelte`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelte(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<SvelteRenderResult>;
```

Nimmt dieselben Argumente und Optionen wie `renderSvelteToString` und gibt die Teile getrennt zurück:

| Feld | Bedeutung |
| --- | --- |
| `html` | Markup der Komponente. Die Ausgabe von Svelte 5 enthält die Hydration-Kommentare. |
| `head` | Inhalt aus `<svelte:head>` ohne die `<style>`-Tags der Komponente. Leg ihn in den `<head>` des Dokuments. |
| `css` | CSS der Komponente als `<style>`-Tags oder `''`, wenn der Compiler keines erzeugt hat. |

Im Browser sind alle drei Felder `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Article from './Article.svelte';

export async function renderArticlePage(slug: string): Promise<string> {
  const { html, head, css } = await renderSvelte(Article, { slug }, { render });
  return `<!doctype html>
<html>
  <head>${head}${css}</head>
  <body>
    <main id="article" data-tuvix-app="article">${html}</main>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
}
```

### Typen {#types}

| Typ | Entry | Bedeutung |
| --- | --- | --- |
| `SvelteMicroAppConfig` | `@tuvix.js/svelte` | Optionen von `createSvelteMicroApp`. |
| `SvelteProps` | `@tuvix.js/svelte` | `Record<string, unknown>`: die Props, die der Orchestrator an die Komponente übergibt. |
| `RenderSvelteOptions` | `@tuvix.js/svelte/server` | `{ render?: SvelteServerRender }`. |
| `SvelteServerRender` | `@tuvix.js/svelte/server` | Form von `render` aus `svelte/server` in Svelte 5. |
| `SvelteRenderResult` | `@tuvix.js/svelte/server` | `{ html, head, css }`, Rückgabe von `renderSvelte`. |

## Server-Rendering {#server-rendering}

Ein Island durchläuft drei Schritte: auf dem Server rendern, das HTML im Container ausliefern, auf dem Client hydrieren.

1. Ruf `renderSvelteToString` (oder `renderSvelte`) in einer Serverfunktion auf und leg das Ergebnis in das Container-Element.
2. Lade den Client-Entry, der `createSsrSvelteMicroApp({ name, App })` exportiert.
3. Der Orchestrator mountet die App in denselben Container. Der Adapter erkennt das Markup und hydriert es.

**CSS.** Svelte 5 legt Komponenten-CSS nur dann in die Render-Ausgabe, wenn du mit `css: 'injected'` kompilierst. Mit dem Standardwert `css: 'external'` schreibt dein Bundler das CSS in eine Datei, und der String enthält keine `<style>`-Tags. In Vite:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { css: 'injected' } })],
});
```

Behältst du `css: 'external'`, verlinke das erzeugte Stylesheet im Head der Seite. [`@tuvix.js/vite`](/de/packages/vite) sagt deinem Server, welche Stylesheets ein Island-Entry braucht.

**Eine Kopie von Svelte.** Übergib `render` aus `svelte/server`, wenn dein Server-Bundle Svelte enthält (Nitro, Vinxi, ein Vite-SSR-Build mit `noExternal`). Komponente und Renderer teilen sich dann eine Svelte-Kopie. Ohne die Option importiert der Adapter `svelte/server` zur Laufzeit, was eine zweite Kopie aus `node_modules` laden kann. Der Server-Renderer von Svelte nutzt `instanceof`-Prüfungen und schlägt fehl, wenn Komponente und Renderer aus verschiedenen Kopien stammen.

## Sonderfälle {#edge-cases}

- `mount` auf einen Container, der schon eine Instanz desselben Moduls enthält, unmountet zuerst die alte Instanz.
- `unmount`, während `mount` noch `svelte` lädt, wartet, bis der Mount fertig ist, und zerstört dann die Instanz. Keine verwaiste Komponente bleibt zurück.
- `unmount` auf einem Container, den dieses Modul nie gemountet hat oder dessen Mount fehlgeschlagen ist, bewirkt nichts: Der Container behält seine Kinder, und es wird kein Event ausgelöst.
- `update`, während ein Mount aussteht, wartet auf ihn und wendet dann die Props an. Ein Update für einen fehlgeschlagenen Mount bewirkt nichts.
- Unter Svelte 3/4 wird eine Prop, die in den neuen Props fehlt, zu `undefined`. Der Standardwert aus `export let name = 'x'` kommt nicht zurück. Unter Svelte 5 greift der Standardwert, mit oder ohne `SvelteMap`.
- Der Adapter importiert `svelte/reactivity` nicht selbst. Svelte 3/4 haben kein solches Modul, und ein Bundler könnte eine Svelte-3/4-App, die darauf verweist, nicht bauen. Deshalb steht der Import in deinem Svelte-5-Entry.
- Ein Remount unter Svelte 5 (ohne `SvelteMap`) löst `tuvix:mounted` erneut aus, aber kein `tuvix:unmounted` dazwischen. Wirft das neue Rendering, lehnt `update()` mit dem Fehler ab, und die alte Instanz ist schon weg.
- Ohne `ssr` leert `mount` den Container vor dem Rendern, daher verschwinden Lade-Platzhalter.
- Mit `ssr` hydriert der Adapter, wenn der Container ein Element oder Text enthält, der nicht nur aus Whitespace besteht. Kommentare und Whitespace allein lösen ein neues Rendering aus.
- Der Adapter erkennt die Svelte-Version einmal pro Seite. Schlägt `import('svelte')` fehl, versucht es der nächste Mount erneut.
- Ein Import- oder Render-Fehler von Svelte 5 auf dem Server erreicht dich als abgelehntes Promise. Der Adapter fällt nicht auf `App.render` zurück.
- `render` in Svelte 5 kann ein Promise zurückgeben (asynchrones Server-Rendering). Beide Serverfunktionen warten darauf.

## Was es nicht tut {#what-it-does-not-do}

- Es kompiliert keine `.svelte`-Dateien. Das übernimmt dein Bundler mit `@sveltejs/vite-plugin-svelte` oder `svelte/compiler`.
- Es prüft nicht, welchen Svelte-Build dein Bundler gewählt hat. Ein Client-Bundle, das `svelte` auf den Server-Build auflöst, schlägt beim Mount fehl.
- Es übergibt nur Props. Slots, Snippets und Komponenten-Events haben keinen Kanal vom Host. Nutze [`@tuvix.js/event-bus`](/de/packages/event-bus), um zwischen Apps zu kommunizieren.
- Es schreibt keinen Inhalt aus `<svelte:head>` in das Dokument. `renderSvelte` gibt ihn zurück; dein Server legt ihn in den `<head>`.
- Es verlinkt kein CSS, das mit `css: 'external'` kompiliert wurde. Siehe [`@tuvix.js/vite`](/de/packages/vite).
- Es wartet auf dem Server nicht auf Daten. Lade sie vorher und übergib sie als Props.

## Migration von 0.4 {#migrating-from-0-4}

- **Svelte 5 funktioniert.** In 0.4 rief der Adapter für jede Komponente `new App()` auf, daher schlugen Svelte-5-Komponenten fehl, und `createSsrSvelteMicroApp` renderte eine zweite Kopie, statt zu hydrieren. Für das Mounten brauchst du keine Codeänderung. Für Prop-Updates an Ort und Stelle übergib `SvelteMap` aus `svelte/reactivity` in der Config; ohne sie mountet jedes Update unter Svelte 5 die Komponente neu.
- **Der Container wird beim Mount geleert.** Ohne `ssr` hängte Svelte 3/4 die Komponente bisher hinter vorhandenes Markup im Container an. Jetzt leert der Adapter den Container zuerst. Hast du dich darauf verlassen, dass Markup neben der Komponente bleibt, verschieb es aus dem Container heraus.
- **Kein stiller Fallback auf dem Server.** `renderSvelteToString` fiel bisher auf `App.render` zurück, wenn `svelte/server` nicht geladen werden konnte. Jetzt nimmt es den Svelte-5-Pfad, wenn du `render` übergibst oder `svelte` `mount` exportiert, ruft `App.render` nur unter Svelte 3/4 auf und lehnt bei einem Import- oder Render-Fehler von Svelte 5 ab. Dev-Builds von Svelte 5 im Vite-Dev-SSR nehmen den Svelte-5-Pfad, obwohl sie einen `App.render`-Stub mitbringen.
- **`unmount` auf einem unbekannten Container bewirkt nichts.** `unmount({ container })` auf einem Container, den das Modul nie gemountet hat, leerte ihn bisher. Jetzt lässt es den Container unangetastet, wie die Adapter für React, Vue und Angular.
- **Übergib `render`.** Füge `{ render }` aus `svelte/server` als drittes Argument hinzu, wenn dein Server-Bundle Svelte enthält:

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

// 0.4: await renderSvelteToString(Footer, { year: 2026 });
const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
```

Eine vollständige App findest du in der [Svelte-Anleitung](/de/guide/svelte).

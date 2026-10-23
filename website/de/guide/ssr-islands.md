# SSR-Islands

Eine Island ist eine Micro App, die der Server innerhalb einer React-Seite zu HTML rendert und die der Browser mit ihrem eigenen Framework hydriert. Mit `TuvixIsland` aus `@tuvix.js/react` kann ein React-Host Vue-, Svelte-, Angular- und React-Islands enthalten. Der Nutzer sieht gestylte Inhalte, bevor JavaScript läuft, und jede Island wird interaktiv, sobald ihr Framework geladen ist.

## Was du brauchst

| Baustein | Paket | Läuft auf |
| --- | --- | --- |
| React-Host-Seite mit Server-Rendering | deine App (`react-dom/server`, TanStack Start, ...) | Server + Client |
| `TuvixIsland`, `TuvixReactApp` | `@tuvix.js/react` | Server + Client |
| Island-Module: `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`, `createSsrReactMicroApp` | Adapter | Client |
| `renderVueToString`, `renderSvelteToString`, `renderAngularToString` | `@tuvix.js/<adapter>/server` | nur Server |
| `getAssets`, `renderAssetTags` | `@tuvix.js/vite` | nur Server |

Es ist kein Orchestrator beteiligt. `TuvixIsland` ruft `mount`, `update` und `unmount` des Island-Moduls selbst auf.

## Ablauf einer Anfrage

```text
server                                         browser
──────                                         ───────
renderVueToString(Card, props) ─┐
                                ▼
<TuvixIsland ssrHtml={html}> renders           HTML arrives, CSS links in <head>
<div data-tuvix-app="card">…html…</div>   ──►  apply → styled first paint
getAssets([...]) → <link rel=stylesheet>
                                               hydrateRoot(host)
                                               TuvixIsland reads its innerHTML from the DOM
                                               React leaves the island's children alone
                                               useEffect → card.mount({ container, props })
                                               Vue adapter: createSSRApp → hydrates in place
                                               tuvix:mounted { hydrated: true }
```

## 1. Vite konfigurieren

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [react(), vue(), svelte(), tuvix()],
});
```

Füge `"@tuvix.js/vite/client"` zu `compilerOptions.types` hinzu, damit TypeScript `virtual:tuvix/assets` kennt.

## 2. Island-Module erstellen

Jede Island exportiert ein Modul, das mit der `Ssr`-Variante ihres Adapters gebaut ist. Diese Dateien laufen im Browser und dürfen keine Server-Renderer importieren.

```ts
// src/islands/vue-card/index.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import VueCard from './VueCard.vue';

export const vueCard = createSsrVueMicroApp({ name: 'vue-card', App: VueCard });
```

```ts
// src/islands/svelte-counter/index.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Counter from './Counter.svelte';

// SvelteMap makes TuvixIsland prop changes update in place instead of remounting.
export const svelteCounter = createSsrSvelteMicroApp({ name: 'svelte-counter', App: Counter, SvelteMap });
```

```ts
// src/islands/angular-contact/index.ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { ContactComponent } from './contact.component';

export const angularContact = createSsrAngularMicroApp({ name: 'angular-contact', component: ContactComponent });
```

## 3. Island-HTML auf dem Server rendern

Lege die Server-Renderer in ein Modul, das nur Server-Code importiert:

```ts
// src/server/render-islands.ts (server only)
import { renderVueToString } from '@tuvix.js/vue/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import { renderAngularToString } from '@tuvix.js/angular/server';
import { render } from 'svelte/server';
import VueCard from '../islands/vue-card/VueCard.vue';
import Counter from '../islands/svelte-counter/Counter.svelte';
import { ContactComponent } from '../islands/angular-contact/contact.component';

export async function renderIslands(): Promise<Record<string, string>> {
  const [card, counter, contact] = await Promise.all([
    renderVueToString(VueCard, { title: 'Hello' }),
    renderSvelteToString(Counter, { start: 3 }, { render }),
    renderAngularToString(ContactComponent, { appId: 'contact', props: { heading: 'Write to us' } }),
  ]);
  return { 'vue-card': card, 'svelte-counter': counter, 'angular-contact': contact };
}
```

Die `render*ToString`-Funktionen laufen nur auf dem Server. Im Browser geben sie `''` zurück. Rufe sie aus Code auf, der nie im Browser läuft: aus deinem Server-Entry, einer API-Route oder einer Server-Funktion deines Frameworks wie `createServerFn` von TanStack Start. Rufe sie nicht aus einem isomorphen Route-Loader auf. Dieser Loader läuft bei clientseitiger Navigation auch im Browser, wo er `''` erhält, und dein Bundler liefert den Server-Renderer von Vue, Svelte oder Angular an den Client aus, weil der Loader ihn importiert.

## 4. Die Islands in die Seite einsetzen

```tsx
// src/pages/Home.tsx
import { createContext, useContext } from 'react';
import { TuvixIsland } from '@tuvix.js/react';
import { vueCard } from '../islands/vue-card';
import { svelteCounter } from '../islands/svelte-counter';

// Filled by the server entry; empty on the client.
export const IslandHtml = createContext<Record<string, string>>({});

export function Home() {
  const html = useContext(IslandHtml);
  return (
    <main>
      <TuvixIsland
        name="vue-card"
        app={vueCard}
        props={{ title: 'Hello' }}
        ssrHtml={html['vue-card']}
        fallback={<p>The card failed to load.</p>}
      />
      <TuvixIsland name="svelte-counter" app={svelteCounter} props={{ start: 3 }} ssrHtml={html['svelte-counter']} />
    </main>
  );
}
```

Übergib auf Server und Client dieselben Props. Hat der Server `{ start: 3 }` gerendert und der Client mountet mit `{ start: 4 }`, erkennt das Framework einen Hydration-Mismatch.

## 5. Island-CSS im Head verlinken

Vite injiziert CSS Modules, `<style>`-Blöcke von Vue und Svelte-Styles per JavaScript. Ohne Hilfe erreicht das Server-HTML den Browser vor diesem JavaScript, und der erste Paint ist ungestylt (FOUC). `getAssets` gibt die Stylesheet-URLs zurück, die ein Entry braucht, damit der Server sie im `<head>` verlinken kann:

```tsx
// src/entry-server.tsx
import { renderToString } from 'react-dom/server';
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { Home, IslandHtml } from './pages/Home';
import { renderIslands } from './server/render-islands';

export async function render(): Promise<string> {
  const [islandHtml, assets] = await Promise.all([
    renderIslands(),
    getAssets(['src/entry-client.tsx', 'src/pages/Home.tsx']),
  ]);

  const body = renderToString(
    <IslandHtml.Provider value={islandHtml}>
      <Home />
    </IslandHtml.Provider>,
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <title>Home</title>
    ${renderAssetTags(assets)}
  </head>
  <body>
    <div id="app">${body}</div>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>`;
}
```

- Übergib Modulpfade relativ zum Vite-Root. In einem Production-Build muss jeder Pfad ein Build-Input oder das Ziel eines `import()` im Client-Build sein; alles andere führt zu einer Ablehnung.
- Fasst Rollup zwei `import()`-Ziele zu einem Chunk zusammen, führt das Manifest diesen Chunk unter seinem gehashten Namen statt unter deinem Modulpfad, und `getAssets` lehnt diesen Pfad ab. Das Beispiel stößt darauf, wenn `@angular/core` in einem Seiten-Chunk landet, und behebt es mit `manualChunks`, die `@angular/core` einen eigenen Chunk geben.
- `getAssets` folgt statischen Imports und überspringt `import()`-Ziele. Eine per Lazy Import geladene Seite oder Island, die auf dem Server rendert, braucht einen eigenen Eintrag in der Liste.
- Im Dev-Modus gibt es `?direct`-CSS-URLs zurück, und sobald Vite sein eigenes `<style>` injiziert, deaktiviert es den passenden `<link>`, damit HMR-Änderungen greifen.
- Angular-Islands bringen ihre Styles inline mit: `renderAngularToString` setzt die `<style>`-Tags der Komponente vor das Markup.
- Svelte: Kompiliere entweder mit `css: 'injected'` (Styles inline im Island-HTML) oder behalte `emitCss` und verlinke sie mit `getAssets`. Nicht beides.

## 6. Auf dem Client hydrieren

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Home } from './pages/Home';

hydrateRoot(document.getElementById('app')!, <Home />);
```

Der Client rendert ohne Island-HTML. Jede `TuvixIsland` liest ihr Markup während der Hydration aus der Seite, React behält diese Knoten, und das Island-Modul hydriert sie.

## Warum das HTML nicht doppelt gesendet wird

Eine naive Island übergibt das Server-HTML auf beiden Seiten als Prop. React braucht den String dann auf dem Client, um `dangerouslySetInnerHTML` zu hydrieren, also reist das HTML einmal im Dokument und ein zweites Mal in den Hydration-Daten. Jedes erneute Rendern des Elternteils mit einem neuen `{ __html }`-Objekt lässt React außerdem `innerHTML` neu zuweisen. Das löscht das DOM und die Listener, die das Framework der Island angehängt hat.

`TuvixIsland` vermeidet beides:

- Auf dem Server schreibt es `ssrHtml` in `<div data-tuvix-app={name} data-tuvix-island={id}>`.
- Während der Hydration findet es dieses Element über sein auf `useId` basierendes Attribut `data-tuvix-island` und liest `innerHTML` einmal. Der Client braucht `ssrHtml` nie.
- Es hält das `{ __html }`-Objekt im State, sodass spätere Renderings React dasselbe Objekt übergeben und React die Kinder der Island nie neu schreibt.

Was dein Framework mit Loader-Daten macht, ist eine andere Frage. Gibst du Island-HTML aus einem Loader von TanStack Start oder Remix zurück, serialisiert das Framework dieses Loader-Ergebnis ebenfalls in die Seite. Übergib das HTML an die Island über etwas, das das Framework nicht serialisiert, etwa einen React-Context, den dein Server-Entry befüllt, wie in Schritt 4.

## State pro Anfrage {#per-request-state}

Server-Code verarbeitet viele Anfragen in einem Prozess. Alles, was du auf Modulebene erzeugst, lebt über alle Anfragen hinweg.

- Erzeuge einen Daten-Cache wie den `QueryClient` von TanStack Query pro Anfrage, nicht auf Modulebene. Ein Client auf Modulebene vermischt auf dem Server Daten zwischen Anfragen und Nutzern, und seine veralteten Einträge verursachen Hydration-Mismatches.
- Übergib die Daten, die eine Island braucht, als Props aus dem eigenen Cache der Anfrage. Das Island-Modul erzeugt beim Mount seinen eigenen clientseitigen State.
- Formatiere Datumsangaben und Zahlen mit expliziter `timeZone` und Locale. Der Server läuft meist in UTC und der Browser in der Zeitzone des Nutzers; `Intl.DateTimeFormat` ohne `timeZone` rendert kurz vor Mitternacht einen anderen Tag und bricht die Hydration.

```tsx
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';

declare function createRequestCache(): { dehydrate(): unknown };
declare function Page(props: { data: unknown }): ReactElement;

export function renderRequest(): string {
  const cache = createRequestCache(); // one per request
  return renderToString(<Page data={cache.dehydrate()} />);
}
```

## Head- und Meta-Tags gehören dem Host

Islands rendern in ein `<div>` im Body. Sie dürfen kein `<title>`, `<meta>` oder `<link rel=canonical>` ausgeben. Setze diese im Host (über die Head-API deines Frameworks oder das HTML-Template). Für Svelte-Komponenten mit `<svelte:head>` rufst du `renderSvelte` statt `renderSvelteToString` auf und setzt dessen `head`-Ausgabe selbst in den Head des Dokuments.

## Fehler

- Lehnt `mount` oder `update` der Island ab, rendert `TuvixIsland` stattdessen `fallback`. Der Adapter hat `tuvix:error` dann bereits ausgelöst.
- Wirft ein Server-Renderer, entscheidet dein Server-Code: Fang den Fehler ab und übergib kein `ssrHtml`, dann startet die Island leer und rendert auf dem Client.
- `TuvixReactApp` umschließt seine Komponente mit `<Suspense>`. Ein Fehler beim Server-Rendering ersetzt deshalb nur diese App durch ihren `fallback`, und React versucht es auf dem Client erneut.

Beobachte Islands aus dem Seiten-Code mit `onLifecycle('mounted', ...)` und `onLifecycle('error', ...)`; siehe [Lifecycle-Events](/de/guide/lifecycle-events).

## Beispielprojekt

`examples/with-ssr-islands` im Repository fügt all das zusammen: einen Express- + Vite-Server mit einem React-19-Host, einer Vue-3-Karte, einem Svelte-5-Zähler, einem zonenlosen Angular-20-Kontaktformular (JIT; der Compiler lädt als Lazy Chunk), einem `TuvixReactApp`-Newsletter und einer Island, die absichtlich fehlschlägt, um ihren Fallback zu zeigen. `src/server/render-islands.ts` enthält die Server-Renderer, `src/entry-server.tsx` verlinkt Assets mit `getAssets`, und `src/runtime/islands.ts` reagiert auf Lifecycle-Events. Die Angular-Island erhält ihren `heading`-Input auf dem Server aus der Option `props` und auf dem Client aus demselben Objekt. Führe im Repository-Root `pnpm --filter with-ssr-islands dev` aus (Port 5186), oder `build` und danach `start` (Port 5185; `PORT` überschreibt ihn). Die README des Beispiels erklärt jeden Baustein und die Prüfungen, die seine Playwright-Spec ausführt.

## Was Islands nicht tun

- `TuvixIsland` lädt keine Module per URL. Importiere das Island-Modul in das Host-Bundle.
- Es teilt keinen State zwischen Islands. Nutze Props, den Event Bus oder deinen eigenen Store.
- Angular-Islands rendern über dem Server-DOM neu, statt es zerstörungsfrei zu hydrieren; siehe [Angular](/de/guide/angular).
- Nichts hiervon läuft ohne einen Server-Rendering-Schritt. Für reine Client-Islands lässt du `ssrHtml` weg und nutzt die Adapter ohne `Ssr`.

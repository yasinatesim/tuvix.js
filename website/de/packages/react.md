---
title: '@tuvix.js/react'
---

<PackageHeader
  name="@tuvix.js/react"
  title="React Bindings"
  description="Mach aus einer React-Komponente eine Tuvix.js Micro App und hoste jede Micro App (Vue, Svelte, Angular, React, Vanilla) in einem React-Baum, mit Server-Rendering und Hydration."
  icon="⚛️"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

Das Paket braucht React 18 oder neuer (Peer-Range `>=18.0.0` für `react` und `react-dom`). Es hängt von `@tuvix.js/loader` und `@tuvix.js/event-bus` ab.

## Wann du es verwendest {#when-to-use-it}

Das Paket deckt zwei Richtungen ab:

- **React als Micro App.** `createReactMicroApp` und `createSsrReactMicroApp` verpacken eine React-Komponente in das Modul `{ bootstrap, mount, unmount, update }`, das Orchestrator und Loader erwarten. Verwende sie, wenn eine React-App eine der Micro Apps ist, die eine Tuvix-Shell lädt.
- **React als Host.** `TuvixIsland` mountet ein beliebiges Micro-App-Modul in einer React-Seite und hält sein DOM über Re-Renders hinweg intakt. `TuvixReactApp` rendert eine React Micro App inline im Baum des Hosts. Verwende sie, wenn deine Shell ein React-SSR-Framework wie TanStack Start, Next.js oder Remix ist.

Ist deine Shell reines HTML ohne React, brauchst du nur das erste Paar plus [`@tuvix.js/core`](/de/packages/core). Für eine Micro App mit Vue, Svelte oder Angular erstellst du das Modul mit [`@tuvix.js/vue`](/de/packages/vue), [`@tuvix.js/svelte`](/de/packages/svelte) oder [`@tuvix.js/angular`](/de/packages/angular). `TuvixIsland` kann jedes davon hosten.

## Schnellstart {#quick-start}

Erstelle das Micro-App-Modul:

```tsx
// src/dashboard.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Registriere es in der Shell. Der Orchestrator ruft `mount` auf, wenn die Route passt, und `update`, wenn du Props änderst:

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { userId: 'u_42' },
});

await orchestrator.start();

// Re-renders <Dashboard userId="u_43" />; component state survives.
await orchestrator.updateAppProps('dashboard', { userId: 'u_43' });
```

## API

### `createReactMicroApp`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Name, unter dem sich das Modul über `registerModule` aus `@tuvix.js/loader` registriert. Lifecycle-Events tragen ihn. |
| `App` | `ComponentType<P>` | erforderlich | Wurzelkomponente. Sie erhält die Mount-Props als eigene Props, daher besteht auch eine Komponente mit Pflicht-Props wie `{ page: 'privacy' \| 'terms' }` die Typprüfung. |
| `bootstrap` | `() => void \| Promise<void>` | keiner | Einmaliges Setup. `bootstrap()` des Moduls wartet darauf. |
| `ssr` | `boolean` | `false` | Hydriert Server-Markup mit `hydrateRoot`, wenn der Container Elemente oder Text enthält, der nicht nur aus Leerraum besteht. Ein Container mit nur Leerraum oder Kommentaren bekommt ein frisches Rendering mit `createRoot`. |

Das zurückgegebene Modul hat vier Methoden:

- `mount({ container, props })` erstellt eine React-Root für diesen Container. Es löst auf, nachdem React das erste Rendering committet hat, und dispatcht dann `tuvix:mounted` auf dem Container mit `hydrated: true` oder `false`. Suspendiert `App` beim ersten Rendering, wartet `mount`, bis der Inhalt committet ist.
- `update({ props, container })` rendert `App` in diesem Container mit `props` neu. Ohne `container` rendert es jeden Container neu, in den das Modul gemountet ist. React behält den Komponentenzustand, weil der Baum seine Form behält.
- `unmount({ container })` unmountet die Root, leert den Container mit `replaceChildren()` und dispatcht `tuvix:unmounted`.
- `bootstrap()` führt `config.bootstrap` aus.

Jeder Container bekommt eine eigene Root. Ein Modul kann also gleichzeitig an mehreren Stellen mounten:

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

const badge = createReactMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

Das Modul importiert `react-dom/client` erst innerhalb von `mount` (lazy). Ein Server-Bundle kann das Modul importieren (zum Beispiel, um `App` mit `TuvixReactApp` zu teilen), ohne den Client-Renderer einzubinden.

### `createSsrReactMicroApp`

```ts no-check
function createSsrReactMicroApp<P extends object = Record<string, unknown>>(
  config: Omit<ReactMicroAppConfig<P>, 'ssr'>
): MicroAppModule;
```

Dasselbe wie `createReactMicroApp({ ...config, ssr: true })`. Optionen: `name`, `App`, `bootstrap`, wie in der Tabelle oben.

Verwende es auf dem Client, wenn der Container schon HTML enthält, das der Server für dieselbe Komponente gerendert hat. Der Baum, den es rendert, entspricht dem von `TuvixReactApp` (Error Boundary plus `<Suspense>`). Es hydriert Markup von `TuvixReactApp` deshalb ohne Mismatch:

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export default createSsrReactMicroApp({ name: 'legal-app', App: LegalPage });
```

### `TuvixIsland`

```ts no-check
function TuvixIsland(props: TuvixIslandProps): ReactElement;
```

| Prop | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Name der Micro App. Die Island schreibt ihn in `data-tuvix-app` und übergibt ihn an `app.mount`. |
| `app` | `MicroAppModule` | erforderlich | Das Modul, das gemountet wird: das Ergebnis von `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp`, `createReactMicroApp`, ihren `createSsr*`-Varianten oder ein selbst geschriebenes Objekt `{ mount, unmount, update? }`. |
| `props` | `Record<string, unknown>` | `{}` | Props für das Modul. Die Island vergleicht sie bei jedem Rendering flach. |
| `ssrHtml` | `string` | keiner | Das serverseitig gerenderte HTML der Island, zum Beispiel aus `renderVueToString`. Übergib es nur auf dem Server. |
| `fallback` | `ReactNode` | `null` | Wird anstelle der Island gerendert, wenn `mount` oder `update` rejected. |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Tag des Wrapper-Elements. |
| `className` | `string` | keiner | Klassenname des Wrapper-Elements. |

`TuvixIsland` hostet eine Micro App ohne React (oder eine separat gebündelte React-App) in einer React-Seite. Eine selbst geschriebene Brücke, die <span v-pre>`<div dangerouslySetInnerHTML={{ __html: html }} />`</span> rendert, bricht beim ersten Re-Render des Elternteils: React sieht ein neues `{ __html }`-Objekt, setzt `innerHTML` erneut und zerstört das DOM und die Listener, die die Micro App angehängt hat. `TuvixIsland` vermeidet das:

- **Server-Rendering.** Sie rendert `<div data-tuvix-app={name} data-tuvix-island={id}>` mit `ssrHtml` als inneres HTML. `id` stammt aus Reacts `useId`, daher berechnen Server und Client denselben Wert.
- **Hydration.** Beim ersten Rendering auf dem Client findet sie ihr eigenes Element über `data-tuvix-island` in der Seite und liest das innere HTML aus dem DOM zurück. Du schickst `ssrHtml` nicht ein zweites Mal an den Client, und das Client-Rendering entspricht dem Server-Rendering.
- **Stabiles DOM.** Die Island erstellt ihr `{ __html }`-Objekt einmal, in `useState`. Spätere Renderings verwenden dasselbe Objekt, deshalb schreibt React die Kinder der Island nie neu. Re-Renders des Elternteils lassen die Knoten und Listener der Micro App bestehen.
- **Mount.** Nach dem ersten Commit ruft die Island `app.mount({ container, props, name })` auf. Ein Modul, das mit `ssr: true` erstellt wurde (`createSsrVueMicroApp` und Verwandte), übernimmt dort das Server-DOM. Ein Modul ohne SSR rendert frisch in den Container.
- **Props.** Ändert sich `props` flach (andere Schlüssel oder ein Wert, der `Object.is` nicht besteht), ruft die Island `app.update({ props, container })` auf. Ein Modul ohne `update` bekommt `unmount`, einen geleerten Container und ein neues `mount`. Ein Inline-Objektliteral mit denselben Werten löst kein Update aus.
- **Identität.** Ein neuer `name` oder eine neue `app` unmountet das alte Modul und mountet das neue.
- **Entfernen.** Verlässt die Island den Baum, ruft sie `app.unmount({ container })` auf und leert den Container.
- **Reihenfolge.** Aufrufe von Mount, Update und Unmount laufen nacheinander. Ein Unmount, der eintrifft, während `mount` noch läuft, wartet darauf.
- **Fehler.** Rejected `mount` oder `update`, rendert die Island `fallback` anstelle des Wrappers. Die Adapter dispatchen `tuvix:error` selbst, die Island fügt kein Event hinzu. Eine spätere Änderung von `name` oder `app` versucht es erneut.

Ein vollständiges Server- und Client-Setup mit einem Vue-Footer in einem React-Layout:

```tsx
// src/Layout.tsx (shared by server and client)
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <main>
      <h1>Home</h1>
      <TuvixIsland
        name="footer"
        app={footer}
        props={{ year }}
        ssrHtml={footerHtml}
        fallback={<footer>© {year}</footer>}
        as="section"
        className="site-footer"
      />
    </main>
  );
}
```

```tsx
// src/entry-server.tsx (runs on the server only)
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const year = 2026;
  const footerHtml = await renderVueToString(Footer, { year });
  const body = renderToString(<Layout year={year} footerHtml={footerHtml} />);
  return `<!doctype html><html><body><div id="root">${body}</div><script type="module" src="/src/entry-client.tsx"></script></body></html>`;
}
```

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

// No footerHtml here: the island reads the footer HTML from the page.
hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

Das Server-HTML erreicht den Browser vor jedem JavaScript. Der Footer ist deshalb beim ersten Paint sichtbar und gestylt, sobald du seine Stylesheets in `<head>` ausgibst. [`@tuvix.js/vite`](/de/packages/vite) liefert dir diese `<link>`-Tags.

### `TuvixReactApp`

```ts no-check
function TuvixReactApp<P extends object>(props: TuvixReactAppProps<P>): ReactElement;
```

| Prop | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Name der Micro App, wird in `data-tuvix-app` geschrieben. Verwende denselben `name` wie bei `createSsrReactMicroApp`. |
| `App` | `ComponentType<P>` | erforderlich | Komponente, die gerendert wird. |
| `fallback` | `ReactNode` | `null` | Wird angezeigt, während `App` suspendiert und nachdem es geworfen hat. |
| weitere Props | `P` | wie von `P` verlangt | Werden an `App` übergeben. |

`TuvixReactApp` rendert eine React Micro App inline als Teil des React-Baums des Hosts, sodass dein SSR-Framework ihr HTML rendert. Es gibt `<div data-tuvix-app={name}>` aus und verpackt `App` in eine Error Boundary und ein `<Suspense fallback>`:

- **Serverfehler bleiben lokal.** Wirft `App` beim Server-Rendering, rendert React nur für diese App `fallback`. Der Rest der Seite wird gerendert, und React versucht `App` auf dem Client erneut.
- **Clientfehler bleiben lokal.** Die Error Boundary fängt Renderfehler auf dem Client ab, zeigt `fallback` an und dispatcht `tuvix:error` auf dem Wrapper.
- **Lifecycle-Events.** Nach dem ersten Commit dispatcht es `tuvix:mounted`. `hydrated` ist `true`, wenn der Wrapper aus Server-HTML stammt. Verlässt die Komponente den Baum, dispatcht es `tuvix:unmounted`, bevor React den Wrapper abhängt. Ein Listener auf `document` empfängt das Event also. Suspendiert eine bereits angezeigte `<Suspense>`-Boundary erneut, meldet die App `unmounted` und danach `mounted`, sobald der Inhalt wieder da ist.

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal-app"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

Um eine Micro App mit Vue, Svelte, Angular oder Vanilla zu hosten, verwende `TuvixIsland`.

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): void;
```

Meldet `handler` in einem Effect für `event` auf `bus` an und beim Unmount wieder ab. Der Hook hält den neuesten `handler` in einer Ref. Ein Handler, der frischen State liest, meldet sich also nicht bei jedem Rendering neu an. Ein neuer `bus` oder ein neues `event` erneuert die Anmeldung. Die Anmeldung existiert nur auf dem Client, Effects laufen beim Server-Rendering nicht.

Die Adapter übergeben den Bus des Orchestrators nicht an `App`. Der Orchestrator verwendet `getGlobalBus()`, sofern du ihm keine `eventBus`-Optionen gegeben hast. Hol dir den Bus also von dort:

```tsx
import { useState } from 'react';
import { useTuvixBus } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function CartIcon() {
  const [count, setCount] = useState(0);

  useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
    setCount(items.length);
  });

  return <span>{count}</span>;
}
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): T;
```

| Argument | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `initialProps` | `T` | erforderlich | Startwert. Der Hook liest ihn beim ersten Rendering und ignoriert spätere Änderungen. |
| `bus` | `IEventBus` | keiner | Bus, auf dem der Hook lauscht. Ohne ihn gibt der Hook `initialProps` unverändert zurück. |
| `updateEvent` | `string` | `'tuvix:props:update'` | Event, dessen Payload der Hook in die aktuellen Props merged (`{ ...prev, ...payload }`). |

Weder der Orchestrator noch die Adapter emitten `tuvix:props:update`. Das Event emittest du selbst. Ein Modul aus `createReactMicroApp` braucht diesen Hook für Props des Orchestrators nicht: `update({ props })` rendert `App` mit den neuen Props neu.

```tsx
import { useTuvixProps } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function ThemeLabel() {
  const props = useTuvixProps({ theme: 'light' }, getGlobalBus());
  return <p>Theme: {props.theme}</p>;
}

// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
```

### Typen {#types}

| Typ | Bedeutung |
| --- | --- |
| `ReactMicroAppConfig<P>` | Konfiguration von `createReactMicroApp`: `name`, `App`, `bootstrap?`, `ssr?`. |
| `TuvixIslandProps` | Props von `TuvixIsland`: `name`, `app`, `props?`, `ssrHtml?`, `fallback?`, `as?`, `className?`. |
| `TuvixReactAppProps<P>` | Props von `TuvixReactApp`: `name`, `App`, `fallback?` plus die Props von `App`. |

## Sonderfälle {#edge-cases}

- **Das erste Rendering wirft.** `mount` rejected mit dem Fehler, unmountet die Root, leert den Container und dispatcht `tuvix:error`. In 0.4 löste `mount` auf, und der Fehler landete im Root-Error-Handler von React.
- **Ein späteres Rendering wirft.** Die Error Boundary leert die App und dispatcht `tuvix:error`. Die Host-Seite läuft weiter. Die App bleibt leer, bis du sie unmountest und erneut mountest. `update` bringt sie nicht zurück.
- **Unmount während des Mounts.** Ein `unmount`, das eintrifft, während `mount` noch `react-dom/client` lädt oder auf den ersten Commit wartet, wartet darauf, lässt den Container leer und dispatcht kein `mounted`-Event.
- **Zweimal in denselben Container mounten.** Ein zweites `mount` auf einen Container, den das Modul schon hält, unmountet die alte Root, dispatcht `tuvix:unmounted`, rendert dann frisch mit den neuen Props und dispatcht `tuvix:mounted`. Der Komponentenzustand wird zurückgesetzt. Die Adapter für Vue, Svelte und Angular verhalten sich genauso. Ruf `update` auf, um den Zustand zu behalten.
- **Unbekannter Container.** `unmount` und `update` auf einen Container, in den das Modul nie gemountet hat, tun nichts.
- **Props werden ersetzt.** `update` des Moduls rendert `App` mit genau den Props, die du übergibst, und sonst nichts. `orchestrator.updateAppProps` merged neue Props über die registrierten, bevor es `update` aufruft.
- **Container nur mit Leerraum bei `ssr: true`.** Das Modul rendert frisch, weil `hasServerMarkup` Leerraum-Text und Kommentare ignoriert.
- **React entfernt die Island.** React hängt das Element der Island ab, bevor das Modul `tuvix:unmounted` meldet. `emitLifecycle` dispatcht das Event dann auf `document` statt auf dem abgehängten Element. Ein Listener auf `document` (oder `onLifecycle` aus `@tuvix.js/loader`) empfängt es also weiterhin, und `detail.container` nennt das entfernte Element. Ein Listener auf dem Container selbst oder auf einem Vorfahren empfängt es nicht. `isMounted(name)` bleibt `true`, solange die App in einem anderen Container gemountet ist, und wird `false`, nachdem der letzte unmountet wurde.
- **Island unter `<StrictMode>` in der Entwicklung.** React führt den Mount-Effect aus, dann sein Cleanup und dann den Effect erneut. Die Island reiht Modulaufrufe in eine Warteschlange ein und überspringt den ersten Durchlauf, weil sein Cleanup schon gelaufen ist. Das Modul mountet also einmal und übernimmt das Server-DOM.
- **Neue App nach einem fehlgeschlagenen Mount.** Rejected `mount`, verwirft die Island ihr Server-HTML. Übergibst du danach eine andere `app` oder einen anderen `name`, mountet das neue Modul in ein leeres Element, statt das Markup der fehlgeschlagenen App zu übernehmen.
- **`ssrHtml` an der Island ändern.** Die Island liest `ssrHtml` nur beim ersten Rendering. Übergib neuen Inhalt über `props`.
- **Derselbe Name zweimal.** `registerModule` behält das letzte Modul, das unter einem Namen erstellt wurde.

## Was es nicht tut {#what-it-does-not-do}

- Es lädt keine Module per URL. Importiere das Modul, oder lass [`@tuvix.js/core`](/de/packages/core) es über einen `entry` laden.
- Es rendert keine Micro App zu einem String. Verwende auf dem Server `renderToString` aus `react-dom/server` mit `TuvixReactApp` oder den eigenen Renderer des Frameworks (`renderVueToString` aus [`@tuvix.js/vue/server`](/de/packages/vue), die Entsprechungen für Svelte und Angular) und übergib das Ergebnis als `ssrHtml` an `TuvixIsland`.
- Es übergibt weder `MountContext.bus` noch `MountContext.name` an `App`. Verwende `getGlobalBus()` aus `@tuvix.js/event-bus`.
- Es lädt kein CSS der Island. Verwende [`@tuvix.js/vite`](/de/packages/vite), um Stylesheet-Links für serverseitig gerenderte Islands auszugeben.
- Es unterstützt weder React 17 noch ältere Versionen.

## Migration von 0.4 {#migrating-from-0-4}

**Das Server-HTML von `TuvixReactApp` enthält Suspense-Marker.** Der Wrapper enthält jetzt `<!--$-->…<!--/$-->` um die App. Aktualisiere `@tuvix.js/react` auf Server und Client gemeinsam, sonst schlägt die Hydration mit einem Mismatch fehl.

**`mount` rejected, wenn das erste Rendering wirft.** Wenn du auf `mount` gewartet und erwartet hast, dass es auflöst, fang den Fehler ab:

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Broken(): never {
  throw new Error('boom');
}

const app = createReactMicroApp({ name: 'broken', App: Broken });
const container = document.createElement('div');

try {
  await app.mount({ container });
} catch (error) {
  // 0.4: never reached. 0.5: the render error; the container is empty.
  container.textContent = 'This section failed to load.';
}
```

**`unmount` auf einem unbekannten Container tut nichts.** In 0.4 leerte es den Container. Ruf `container.replaceChildren()` selbst auf, wenn du dich darauf verlassen hast.

**Konfigurationsobjekt.** Frühere Versionen dieser Seite zeigten `createReactMicroApp(App)`. Die Funktion nimmt ein Konfigurationsobjekt: `createReactMicroApp({ name: 'dashboard', App })`.

Weitere Schritt-für-Schritt-Anleitungen findest du in der [React-Anleitung](/de/guide/react).

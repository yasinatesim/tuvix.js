# @tuvix.js/react

> Mach aus React-Komponenten Tuvix.js Micro Apps und hoste jede Micro App in einem React-Baum mit SSR-Hydration.

Teil des [Tuvix.js](https://github.com/yasinatesim/tuvix.js) Microfrontend-Frameworks.

## Installation

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

Benötigt React 18 oder neuer.

## Schnellstart

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Das Modul registriert sich über `registerModule` aus `@tuvix.js/loader` unter `'dashboard'`, sodass der Orchestrator es findet, sobald das Skript geladen ist. Gib dem Orchestrator einen `entry` wie `() => import('./dashboard')`, einen `container` und `props`.

## API

### `createReactMicroApp(config)`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Name in der Registry; Lifecycle-Events tragen ihn mit. |
| `App` | `ComponentType<P>` | erforderlich | Root-Komponente. Erhält die Mount-Props; erforderliche Props werden typgeprüft. |
| `bootstrap` | `() => void \| Promise<void>` | keiner | Einmaliges Setup. |
| `ssr` | `boolean` | `false` | Hydriert mit `hydrateRoot`, wenn der Container Server-Markup enthält (Elemente oder Text, der nicht nur aus Leerzeichen besteht). |

- Jeder Container bekommt eine eigene React-Root, sodass ein Modul an mehreren Stellen mounten kann.
- `mount({ container, props })` löst nach dem ersten Commit auf und sendet `tuvix:mounted` mit `hydrated`.
- `update({ props, container })` rendert einen Container neu, ohne `container` alle. Der Komponentenzustand bleibt erhalten.
- `unmount({ container })` unmountet die Root, leert den Container und sendet `tuvix:unmounted`.
- `react-dom/client` wird erst in `mount` geladen, sodass Server-Bundles das Modul importieren können.

### `createSsrReactMicroApp(config)`

`createReactMicroApp({ ...config, ssr: true })`. Optionen: `name`, `App`, `bootstrap`. Es rendert denselben Baum wie `TuvixReactApp` und hydriert deshalb `TuvixReactApp`-Markup ohne Mismatch.

### `TuvixIsland`

Hostet jedes Micro-App-Modul (Vue, Svelte, Angular, React oder ein handgeschriebenes `{ mount, unmount, update? }`) in einem React-Baum.

| Prop | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Wird in `data-tuvix-app` geschrieben und an `mount` übergeben. |
| `app` | `MicroAppModule` | erforderlich | Das Modul, das gemountet wird. |
| `props` | `Record<string, unknown>` | `{}` | Wird flach verglichen; eine Änderung ruft `app.update({ props, container })` auf oder mountet neu, wenn das Modul kein `update` hat. |
| `ssrHtml` | `string` | keiner | Serverseitig gerendertes HTML der Island. Übergib es nur auf dem Server. |
| `fallback` | `ReactNode` | `null` | Wird gerendert, wenn `mount` oder `update` ablehnt. |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Tag des Wrappers. |
| `className` | `string` | keiner | Klasse des Wrappers. |

Eine handgeschriebene Brücke `<div dangerouslySetInnerHTML={{ __html }} />` verliert beim nächsten Re-Render des Elternelements das DOM und die Listener der Micro App, weil React `innerHTML` für jedes neue `{ __html }`-Objekt erneut setzt. `TuvixIsland` erzeugt dieses Objekt einmal. Bei der Hydration findet es sein Element über ein `data-tuvix-island`-Attribut (aus `useId`) und liest das HTML aus der Seite zurück, sodass der Client kein `ssrHtml` braucht. Ein neuer `name` oder eine neue `app` mountet neu; das Entfernen ruft `app.unmount` auf. Aufrufe laufen der Reihe nach, sodass ein Unmount auf einen laufenden Mount wartet.

```tsx
// Layout.tsx, rendered on the server with footerHtml and on the client without it
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <TuvixIsland name="footer" app={footer} props={{ year }} ssrHtml={footerHtml} fallback={<footer>© {year}</footer>} />
  );
}
```

```tsx
// entry-server.tsx
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const footerHtml = await renderVueToString(Footer, { year: 2026 });
  return renderToString(<Layout year={2026} footerHtml={footerHtml} />);
}
```

```tsx
// entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

### `TuvixReactApp`

Rendert eine React Micro App inline im Host-Baum innerhalb von `<div data-tuvix-app={name}>`.

| Prop | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Muss dem `name` des Moduls entsprechen. |
| `App` | `ComponentType<P>` | erforderlich | Komponente, die gerendert wird. |
| `fallback` | `ReactNode` | `null` | Wird angezeigt, solange `App` suspendiert oder nachdem sie einen Fehler wirft. |
| weitere Props | `P` | von `P` gefordert | Werden an `App` übergeben. |

`App` sitzt in einer Error Boundary und einem `<Suspense fallback>`. Ein Renderfehler auf dem Server ersetzt nur diese App durch `fallback`, und React versucht sie auf dem Client erneut. Ein Renderfehler auf dem Client zeigt `fallback` und sendet `tuvix:error`. Es sendet `tuvix:mounted` (mit `hydrated`) und `tuvix:unmounted`.

### `useTuvixBus(bus, event, handler)`

Abonniert in einem Effect und kündigt das Abo beim Unmount. Der neueste `handler` liegt in einer Ref, sodass nicht bei jedem Render neu abonniert wird. Übergib `getGlobalBus()` aus `@tuvix.js/event-bus`; der Adapter reicht den Bus des Orchestrators nicht an `App` weiter.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Gibt Props zurück, in die jede Payload von `updateEvent` (Standard `'tuvix:props:update'`) auf `bus` eingemischt wird. Nichts in Tuvix sendet dieses Event; du sendest es selbst. Module aus `createReactMicroApp` erhalten neue Props über `update`, ohne diesen Hook.

### Typen

`ReactMicroAppConfig<P>`, `TuvixIslandProps`, `TuvixReactAppProps<P>`.

## Sonderfälle

- Ein Fehler im ersten Render lehnt `mount` ab, leert den Container und sendet `tuvix:error`. Ein späterer Fehler lässt die App leer, bis du sie neu mountest.
- `unmount` während eines laufenden `mount` wartet auf ihn und hinterlässt den Container leer.
- `mount` auf einem Container, den das Modul bereits hält, unmountet die alte Root (und sendet dabei `tuvix:unmounted`) und rendert frisch mit den neuen Props, wie die Adapter für Vue, Svelte und Angular.
- `unmount` und `update` auf einem unbekannten Container tun nichts.
- Wenn React eine `TuvixIsland` entfernt, meldet das Modul `tuvix:unmounted`, nachdem das Element abgehängt ist. Das Event geht an `document` (mit gesetztem `detail.container`), sodass Listener auf `document` und `onLifecycle` es erhalten; Listener auf dem Container oder seinen Vorfahren nicht. `isMounted(name)` wird `false`, sobald kein Container der App mehr gemountet ist.
- Unter `<StrictMode>` führt React den Mount-Effect der Island in der Entwicklung zweimal aus, aber die Island überspringt den verworfenen ersten Durchlauf: Das Modul mountet einmal und übernimmt das Server-Markup.
- Nach einem fehlgeschlagenen Mount mountet eine neue `app` oder ein neuer `name` in ein leeres Element. Es erhält nie das Server-HTML der fehlgeschlagenen App.

## Was es nicht tut

- Module per URL laden. Verwende `@tuvix.js/core` oder `@tuvix.js/loader`.
- In einen String rendern. Verwende `react-dom/server` oder `renderVueToString` und verwandte Funktionen für `ssrHtml`.
- Island-CSS laden. Verwende `@tuvix.js/vite`.

## Breaking Changes in 0.5

- Das Server-HTML von `TuvixReactApp` enthält jetzt Suspense-Kommentarmarker; aktualisiere Server und Client gemeinsam.
- `mount` lehnt ab, wenn der erste Render einen Fehler wirft.
- `unmount` auf einem Container, den das Modul nie gemountet hat, tut nichts.

Vollständige Dokumentation: [tuvix.js.org/de/packages/react](https://tuvix.js.org/de/packages/react)

## Lizenz

MIT

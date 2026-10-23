# Mit React

`@tuvix.js/react` erledigt drei Aufgaben. `createReactMicroApp` macht aus einer React-Komponente eine Micro App, die jede Shell mounten kann. `TuvixReactApp` rendert eine React-Micro-App innerhalb einer React-Host-Seite, mit Server-Rendering. `TuvixIsland` bindet eine Vue-, Svelte-, Angular-, React- oder handgeschriebene Micro App in eine React-Seite ein.

Benötigt React 18 oder 19.

## Installation

```bash
pnpm add @tuvix.js/react react react-dom
```

## Eine Komponente in eine Micro App verwandeln

```tsx
// src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

interface ProfileProps {
  userId: string;
  theme: 'light' | 'dark';
}

function Profile({ userId, theme }: ProfileProps) {
  return <div className={`profile ${theme}`}>User {userId}</div>;
}

export default createReactMicroApp({ name: 'profile', App: Profile });
```

Das Modul:

- registriert sich unter `name`, damit ein URL-Entry es findet;
- erzeugt einen React-Root pro Container, sodass ein Modul an mehreren Stellen mounten kann;
- löst `mount` auf, nachdem React den ersten Render committet hat, und löst dann `tuvix:mounted` auf dem Container aus;
- übergibt die Props der Shell als Props an `App`. `App` darf Pflicht-Props deklarieren; der Adapter prüft sie zur Laufzeit nicht.

| Option | Typ | Beschreibung |
| --- | --- | --- |
| `name` | `string` | Pflicht. Muss mit dem registrierten App-Namen übereinstimmen. |
| `App` | `ComponentType<P>` | Pflicht. Root-Komponente. |
| `bootstrap` | `() => void \| Promise<void>` | Läuft einmal vor dem ersten Mount. |
| `ssr` | `boolean` | Hydriert, wenn der Container Server-Markup enthält. `createSsrReactMicroApp` setzt es. |

## Props und Updates

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'light' });
```

`update({ props, container })` rendert den Root für diesen Container mit den zusammengeführten Props neu. Der Komponentenzustand bleibt erhalten. Ohne `container` rendert es jeden Root des Moduls neu. Ein Aufruf von `mount` auf einem Container, in den dieses Modul bereits gerendert hat, rendert ihn neu, statt einen zweiten Root zu erzeugen.

## Fehler

Der Adapter umschließt `App` mit einer Error Boundary:

- Ein Fehler während des ersten Renders lehnt `mount` ab, leert den Container und löst `tuvix:error` aus. Der Orchestrator zeigt dann das `fallback`-HTML der App.
- Ein späterer Fehler leert die App und löst `tuvix:error` aus. Der Rest der Seite läuft weiter.

## Serverseitig gerenderte React-Apps

Wenn die Host-Seite React ist und auf dem Server rendert (TanStack Start, Next.js, Remix oder dein eigenes `renderToString`), rendere die Micro App inline mit `TuvixReactApp`:

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

- Es rendert `<div data-tuvix-app="legal">` um `App` herum, sodass das HTML aus dem eigenen Server-Render des Hosts stammt.
- Jede Prop außer `name`, `App` und `fallback` geht an `App`.
- `App` sitzt in einem eigenen `<Suspense fallback>`. Wirft es auf dem Server einen Fehler, sendet React den Fallback nur für diese App und versucht die App auf dem Client erneut.
- Auf dem Client zeigt eine Error Boundary `fallback` an und löst `tuvix:error` aus.
- Nach dem ersten Commit löst es `tuvix:mounted` mit `hydrated: true` aus, wenn es Server-HTML hydriert hat, und `tuvix:unmounted`, wenn es den Baum verlässt.

Wenn ein separates Bundle dieses Markup hydrieren muss (zum Beispiel eine Seite, die `@tuvix.js/server` zusammengesetzt hat), exportiere dieselbe Komponente mit `createSsrReactMicroApp`. Es rendert denselben Suspense-Baum, sodass die Hydration übereinstimmt:

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export default createSsrReactMicroApp({ name: 'legal', App: LegalPage });
```

Mit `ssr: true` bekommt ein Container, der nur Leerraum oder Kommentare enthält, einen frischen Render statt einer Hydration.

## Andere Micro Apps mit TuvixIsland einbinden

`TuvixIsland` mountet ein beliebiges Micro-App-Modul innerhalb eines React-Baums:

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });

export function Footer({ newsletterHtml }: { newsletterHtml?: string }) {
  return (
    <TuvixIsland
      name="newsletter"
      app={newsletter}
      props={{ list: 'weekly' }}
      ssrHtml={newsletterHtml}
      fallback={<p>Subscribe at example.com/newsletter</p>}
    />
  );
}
```

| Prop | Beschreibung |
| --- | --- |
| `name` | Wird in `data-tuvix-app` geschrieben und an `mount` übergeben. |
| `app` | Das zu mountende Modul. |
| `props` | Wird bei jedem Render flach verglichen. Eine Änderung ruft `app.update` auf, oder Unmount + Mount, wenn das Modul kein `update` hat. |
| `ssrHtml` | Server-HTML für die Island. Nur auf dem Server nötig. |
| `fallback` | Wird statt der Island gerendert, wenn `mount` oder `update` abgelehnt wird. |
| `as`, `className` | Wrapper-Tag (Standard `div`) und Klasse. |

React schreibt das innere HTML der Island nach dem ersten Render nie neu, daher behalten Re-Renders des Elternelements das DOM und die Listener, die das Modul angehängt hat. Ein neuer `name` oder eine neue `app` mountet neu; das Entfernen der Island ruft `app.unmount` auf. Mount, Update und Unmount laufen nacheinander, daher wartet ein Unmount, der während `mount` eintrifft, darauf.

`TuvixIsland` lädt keine Module per URL. Importiere das Modul oder überlasse URL-Entries dem Orchestrator. Das vollständige Server-Setup findest du unter [SSR-Islands](/de/guide/ssr-islands).

## Hooks

### useTuvixBus

Abonniert beim Mount und beendet das Abonnement beim Unmount. Es liest den aktuellen `handler` über eine Ref, sodass ein Inline-Handler nicht bei jedem Render neu abonniert:

```tsx
import { useState } from 'react';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/react';

const bus = getGlobalBus();

export function CartBadge() {
  const [count, setCount] = useState(0);
  useTuvixBus<{ itemCount: number }>(bus, 'cart:updated', ({ itemCount }) => setCount(itemCount));
  return <span className="badge">{count}</span>;
}
```

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` gibt einen State zurück, der jede auf `updateEvent` gesendete Payload einfließen lässt. Nichts in Tuvix.js sendet dieses Event; sende es selbst, wenn du Props über den Bus statt über `updateAppProps` weitergeben willst.

```tsx
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixProps } from '@tuvix.js/react';

const bus = getGlobalBus();

export function Theme() {
  const props = useTuvixProps({ theme: 'light' }, bus);
  return <p>Theme: {props.theme}</p>;
}

bus.emit('tuvix:props:update', { theme: 'dark' });
```

## Was der Adapter nicht tut

- Er teilt keinen React-Root zwischen Micro Apps. Jede App und jeder Container bekommt einen eigenen.
- Er dedupliziert React nicht. Zwei separat gebündelte React-Micro-Apps liefern zwei Kopien von React aus.
- Er rendert nicht den `<head>` der Host-Seite. Titel und Meta-Tags gehören dem Host.

## API

| Export | Zweck |
| --- | --- |
| `createReactMicroApp({ name, App, bootstrap?, ssr? })` | React-Micro-App-Modul |
| `createSsrReactMicroApp({ name, App, bootstrap? })` | Dasselbe mit `ssr: true` |
| `TuvixReactApp` | Inline-React-Micro-App in einem React-Host, mit SSR |
| `TuvixIsland` | Bindet ein beliebiges Micro-App-Modul in einen React-Baum ein, mit SSR |
| `useTuvixBus(bus, event, handler)` | An die Komponente gebundenes Event-Bus-Abonnement |
| `useTuvixProps(initial, bus?, event?)` | Aus Bus-Events zusammengeführte Props |

---
title: '@tuvix.js/devtools'
---

<PackageHeader
  name="@tuvix.js/devtools"
  title="DevTools"
  description="Debug-Overlay im Browser für einen Orchestrator. Listet registrierte und gemountete Micro Apps, die aktuelle Route und den jüngsten Verkehr auf dem Event Bus."
  icon="🛠️"
  npm="true"
/>

## Installation

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## Wann du es verwendest

Installiere es in der Entwicklung, wenn du sehen willst, welche Micro Apps der Orchestrator kennt, welche davon gerade gemountet sind und welche Events über den Bus laufen. Das Overlay sitzt in der unteren rechten Ecke der Seite und aktualisiert sich einmal pro Sekunde.

Greif stattdessen zu den DevTools deines Browsers oder zu einer Devtools-Erweiterung deines Frameworks, wenn du Komponentenbäume, Netzwerk-Timings oder Event-Payloads in einer Oberfläche brauchst. Dieses Paket zeigt App-Namen, einen Routen-String und Event-Namen mit Zeitstempel. Payloads bleiben im Logger, den du über die Konsole auslesen kannst.

## Schnellstart

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
orchestrator.register({ name: 'settings', entry: '/apps/settings.js', container: '#main' });

await orchestrator.start();
```

Öffne `/dashboard`, und das Overlay listet `dashboard` mit einem grünen Punkt und `settings` mit einem weißen. Die Zeile Route zeigt `/dashboard`, und die Liste Events zeigt die Events `tuvix:app:status-change` und `tuvix:app:mount` des Dashboard-Mounts.

## Was das Panel zeigt

`installDevTools` hängt ein `<div id="tuvix-devtools">` an `document.body` an. Es enthält einen runden Umschalt-Button (fixiert 12px von der unteren rechten Ecke, `z-index: 99999`) und darüber ein 280px breites Panel mit drei Abschnitten:

| Abschnitt | Quelle | Inhalt |
| --- | --- | --- |
| Apps | `orchestrator.getRegisteredApps()` und `getMountedApps()` | Eine Zeile pro registrierter App. Ein grüner Punkt bedeutet, dass ihr Status `mounted` ist. Ein weißer Punkt steht für jeden anderen Status, auch `loading` und `error`. |
| Route | `orchestrator.getRouter()?.currentPath` | Der aktuelle Pfad des Routers: ohne `base`-Präfix, mit Query-String. Zeigt `/`, wenn der Orchestrator keinen Router hat. |
| Events | `EventLogger`, angehängt an `orchestrator.getEventBus()` | Die 10 neuesten Events, das neueste zuerst. Jede Zeile zeigt die lokale Uhrzeit, einen Strich und den Event-Namen. |

Standardmäßig verwendet der Orchestrator `getGlobalBus()`. Die Liste Events zeigt daher neben den eigenen Events des Orchestrators auch Events, die deine Micro Apps auf dem gemeinsamen Bus senden:

| Event | Gesendet, wenn |
| --- | --- |
| `tuvix:app:registered` | `register()` eine App hinzufügt |
| `tuvix:app:bootstrap`, `tuvix:app:mount`, `tuvix:app:unmount` | Eine App diesen Lifecycle-Schritt durchläuft |
| `tuvix:app:error` | Laden, Bootstrapping oder Mounten einer App fehlschlägt |
| `tuvix:app:status-change` | Sich der Status einer App ändert. Rechne mit mehreren pro Mount. |
| `tuvix:route:change` | Der Router navigiert |
| `tuvix:started`, `tuvix:destroyed` | `start()` und `destroy()` abgeschlossen sind |

Das Panel stellt außerdem `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }` bereit. Führe `__TUVIX_DEVTOOLS__.logger.getEntries()` in der Browser-Konsole aus, um die Payloads zu lesen, die das Panel nicht ausgibt.

## API

### `installDevTools`

```ts
import type { DevToolsOptions } from '@tuvix.js/devtools';
import type { IEventBus } from '@tuvix.js/core';

declare function installDevTools(
  orchestrator: {
    getRegisteredApps(): string[];
    getMountedApps(): string[];
    getEventBus(): IEventBus;
    getRouter(): { currentPath: string } | null;
  },
  options?: DevToolsOptions
): () => void;
```

Das erste Argument akzeptiert jedes Objekt mit diesen vier Methoden. Ein `Orchestrator` aus `@tuvix.js/core` oder `tuvix.js` passt.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | Maximale Anzahl an Events, die der Logger behält. Das Panel gibt 10 davon aus; der Rest bleibt über `__TUVIX_DEVTOOLS__.logger` lesbar. |
| `autoOpen` | `boolean` | `true` | `false` mountet das Panel verborgen. Der Umschalt-Button bleibt sichtbar und öffnet es. |
| `updateInterval` | `number` | `1000` | Millisekunden zwischen zwei Aktualisierungen des Panels. |

Bei jedem Aufruf:

1. erzeugt es ein `DevToolsPanel` und einen `EventLogger(maxLogEntries)`,
2. hängt es den Logger mit `onAny` an `orchestrator.getEventBus()` an,
3. mountet es das Panel und verbirgt es, wenn `autoOpen` `false` ist,
4. startet es ein `setInterval`, das den Orchestrator ausliest und `panel.update()` aufruft,
5. setzt es `window.__TUVIX_DEVTOOLS__`.

Es gibt eine Cleanup-Funktion zurück, die das Intervall beendet, den Logger abhängt, das Panel entfernt und `window.__TUVIX_DEVTOOLS__` löscht.

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { installDevTools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator();
const removeDevTools = installDevTools(orchestrator, {
  autoOpen: false,
  updateInterval: 250,
  maxLogEntries: 500,
});

// Later, for example in a hot-module-replacement dispose hook:
removeDevTools();
await orchestrator.destroy();
```

### `EventLogger`

```ts no-check
class EventLogger {
  constructor(maxEntries?: number); // default 200
  attach(bus: IEventBus): void;
  detach(): void;
  getEntries(): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>;
  getRecent(count?: number): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>; // default 20
  clear(): void;
}
```

`EventLogger` zeichnet über `bus.onAny` jedes Event auf einem Bus auf. Jeder Eintrag enthält `timestamp` (`Date.now()` zum Zeitpunkt des Sendens), `event` (den Namen) und `data` (den Payload so, wie er gesendet wurde, nicht geklont). Wächst das Log über `maxEntries` hinaus, verwirft der Logger die ältesten Einträge.

| Methode | Verhalten |
| --- | --- |
| `attach(bus)` | Abonniert alle Events von `bus`. Wirft einen Fehler, wenn der Bus zerstört ist. |
| `detach()` | Beendet das Abonnement. Aufgezeichnete Einträge bleiben erhalten. |
| `getEntries()` | Gibt das gesamte Log zurück, den ältesten Eintrag zuerst. |
| `getRecent(count)` | Gibt die letzten `count` Einträge zurück, den ältesten zuerst. |
| `clear()` | Leert das Log und behält das Abonnement. |

Verwende ihn ohne das Panel, um in einem Test Assertions auf den Bus-Verkehr zu machen oder Events einer Seite auszugeben:

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);

bus.emit('cart:add', { sku: 'A-1' });

console.log(logger.getRecent(1)); // [{ timestamp: 1761..., event: 'cart:add', data: { sku: 'A-1' } }]
logger.detach();
```

### `DevToolsPanel`

```ts no-check
class DevToolsPanel {
  constructor();
  mount(): void;
  unmount(): void;
  toggle(): void;
  update(state: {
    registeredApps: string[];
    mountedApps: string[];
    currentRoute: string;
    events: Array<{ timestamp: number; event: string }>;
  }): void;
}
```

`DevToolsPanel` ist der DOM-Teil des Overlays ohne jedes Polling. Du rufst `update()` mit dem Zustand auf, den du anzeigen willst.

| Methode | Verhalten |
| --- | --- |
| `mount()` | Hängt `#tuvix-devtools` geöffnet an `document.body` an. Ein zweiter Aufruf auf derselben Instanz bewirkt nichts. |
| `unmount()` | Entfernt das Element. |
| `toggle()` | Blendet den Inhalt des Panels ein oder aus. Der Umschalt-Button bleibt. Bewirkt vor `mount()` nichts. |
| `update(state)` | Baut die Abschnitte Apps, Route und Events neu auf. Gibt die letzten 10 Einträge von `events` aus, den neuesten zuerst. Bewirkt vor `mount()` nichts. |

```ts
import { DevToolsPanel } from '@tuvix.js/devtools';

const panel = new DevToolsPanel();
panel.mount();
panel.update({
  registeredApps: ['header', 'cart'],
  mountedApps: ['header'],
  currentRoute: '/checkout',
  events: [{ timestamp: Date.now(), event: 'cart:open' }],
});
```

### Typen

| Name | Bedeutung |
| --- | --- |
| `DevToolsOptions` | Optionen von `installDevTools`: `maxLogEntries`, `autoOpen`, `updateInterval`. |

Die Form des Orchestrators und die Form eines Log-Eintrags werden nicht exportiert. Verwende `Parameters<typeof installDevTools>[0]` und `ReturnType<EventLogger['getEntries']>[number]`, wenn du sie als Typen brauchst.

## Production-Builds

Das Paket deklariert `"sideEffects": false`, aber ein statisches `import { installDevTools } from '@tuvix.js/devtools'`, das dein Code aufruft, landet trotzdem im Bundle. Lade es wie im Schnellstart hinter einem Build-Zeit-Flag mit einem dynamischen `import()`. Bundler ersetzen `process.env.NODE_ENV` durch einen String und entfernen den toten Zweig samt seinem Chunk. In einer Vite-App kannst du stattdessen `import.meta.env.DEV` prüfen.

Lässt du das Overlay in Production aktiv, kostet dich das ein `setInterval`, das jede Sekunde drei DOM-Abschnitte neu aufbaut, ein Abonnement auf jedes Bus-Event und eine globale Variable, die den Orchestrator jedem Skript auf der Seite übergibt.

## Sonderfälle

- Installiere es vor `register()` und `start()`. Der Logger sieht nur Events, die nach `attach` gesendet werden, und das Panel bleibt bis zur ersten Aktualisierung leer, also `updateInterval` Millisekunden nach dem Aufruf.
- `installDevTools` braucht `document` und `window`. Ein Aufruf während des Server-Renderings wirft einen `ReferenceError`. Rufe es aus reinem Client-Code auf.
- Mit `connectRouter()` und ohne `router`-Option gibt `getRouter()` `null` zurück, und die Zeile Route zeigt `/`.
- `getMountedApps()` zählt nur den Status `mounted`. Eine App im Status `mounting` oder `error` bekommt einen weißen Punkt, und das Panel gibt den Namen des Status nie aus.
- Ein privater Bus (`createOrchestrator({ eventBus: {...} })`) wird von `orchestrator.destroy()` zerstört. Eine Installation danach wirft einen Fehler aus `onAny`. Mit dem globalen Standard-Bus zeichnet der Logger nach `destroy()` weiter auf, bis du die Cleanup-Funktion aufrufst.
- Jeder Aufruf erzeugt ein neues Panel. Zwei Aufrufe setzen zwei Overlays mit denselben Element-IDs auf die Seite, und der zweite Aufruf überschreibt `window.__TUVIX_DEVTOOLS__`. Die erste Cleanup-Funktion löscht dann die globale Variable, die der zweite Aufruf gesetzt hat.
- Ruft man `EventLogger.attach()` zweimal auf derselben Instanz auf, ersetzt das die gespeicherte Unsubscribe-Funktion. `detach()` entfernt dann nur das zweite Abonnement.
- Sobald das Log `maxLogEntries` erreicht, kopiert der Logger bei jedem neuen Event das Array. Halte `maxLogEntries` auf Seiten mit gesprächigen Bussen im Bereich von einigen Hundert.
- Das Panel schreibt App-Namen, Routen und Event-Namen mit `textContent`, daher erscheint Markup in einem Event-Namen als Text.

## Was es nicht tut

- Kein Tastenkürzel und keine Optionen für Position, Größe oder Theme. Das Overlay sitzt immer unten rechts mit Inline-Styles.
- Keine Event-Payloads, Entry-URLs, Cache-Zustände des Loaders oder Mount-Timings in der Oberfläche. Lies Payloads aus `__TUVIX_DEVTOOLS__.logger.getEntries()`.
- Keine Browser-Erweiterung und keine Anbindung an die Devtools von React, Vue, Svelte oder Angular.
- Kein Time Travel und kein Event-Replay. Der Logger zeichnet auf und sendet nie erneut.
- Keine automatische Entfernung in Production-Builds. Den Import sicherst du selbst ab.

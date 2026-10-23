# @tuvix.js/devtools

> Debug-Overlay in der Seite, das die registrierten und gemounteten Apps eines Orchestrators, seine aktuelle Route und den jüngsten Verkehr auf dem Event Bus auflistet

Teil des Microfrontend-Frameworks [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Installation

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## Schnellstart

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/dashboard/*', app: 'dashboard' }] },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
await orchestrator.start();
```

In der unteren rechten Ecke erscheint ein runder Button. Das Panel darüber aktualisiert sich jede Sekunde und zeigt:

- **Apps**: jede registrierte App, mit einem grünen Punkt, wenn ihr Status `mounted` ist, sonst mit einem weißen Punkt.
- **Route**: `orchestrator.getRouter()?.currentPath`, oder `/` ohne Router.
- **Events**: die 10 neuesten Bus-Events (Zeit und Name), das neueste zuerst.

Das Overlay setzt außerdem `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`. Führe `__TUVIX_DEVTOOLS__.logger.getEntries()` in der Konsole aus, um die Payloads der Events zu lesen.

## API

### `installDevTools(orchestrator, options?): () => void`

Akzeptiert jedes Objekt mit `getRegisteredApps()`, `getMountedApps()`, `getEventBus()` und `getRouter()`, zum Beispiel einen `Orchestrator`. Gibt eine Aufräumfunktion zurück, die das Polling stoppt, den Logger abhängt, das Panel entfernt und die globale Variable löscht.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | Maximale Anzahl an Events, die der Logger behält |
| `autoOpen` | `boolean` | `true` | `false` mountet das Panel verborgen; der Toggle-Button öffnet es |
| `updateInterval` | `number` | `1000` | Millisekunden zwischen zwei Aktualisierungen des Panels |

### `EventLogger`

`new EventLogger(maxEntries = 200)` zeichnet über `onAny` jedes Event eines Busses auf. Einträge haben die Form `{ timestamp, event, data }`.

| Methode | Verhalten |
| --- | --- |
| `attach(bus)` | Abonniert alle Events. Wirft bei einem zerstörten Bus. |
| `detach()` | Beendet das Abonnement und behält die Einträge |
| `getEntries()` | Das gesamte Log, das älteste zuerst |
| `getRecent(count = 20)` | Die letzten `count` Einträge, der älteste zuerst |
| `clear()` | Leert das Log |

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);
bus.emit('cart:add', { sku: 'A-1' });
console.log(logger.getRecent(1)); // [{ timestamp, event: 'cart:add', data: { sku: 'A-1' } }]
```

### `DevToolsPanel`

Das Overlay-DOM ohne Polling. Den Zustand lieferst du selbst.

| Methode | Verhalten |
| --- | --- |
| `mount()` | Hängt `#tuvix-devtools` geöffnet an `document.body` an. Ein zweiter Aufruf tut nichts. |
| `unmount()` | Entfernt es |
| `toggle()` | Zeigt oder verbirgt den Inhalt des Panels; der Button bleibt |
| `update({ registeredApps, mountedApps, currentRoute, events })` | Rendert die drei Bereiche neu |

### `DevToolsOptions`

Typ der oben beschriebenen Optionen von `installDevTools`.

## Sonderfälle

- Der Logger sieht nur Events, die nach `installDevTools` gesendet werden, und das Panel füllt sich bei der ersten Aktualisierung, `updateInterval` ms später.
- Nur im Browser: `installDevTools` wirft beim Server-Rendering einen `ReferenceError`.
- Eine App im Status `mounting` oder `error` zeigt einen weißen Punkt; das Panel gibt keine Statusnamen aus.
- Mit dem standardmäßigen globalen Bus zeichnet der Logger auch nach `orchestrator.destroy()` weiter auf, bis du die Aufräumfunktion aufrufst.
- Zwei Aufrufe von `installDevTools` erzeugen zwei Overlays mit denselben Element-IDs, und der zweite überschreibt `window.__TUVIX_DEVTOOLS__`.

## Was es nicht tut

- Kein Tastenkürzel und keine Optionen für Position, Größe oder Theme.
- Keine Payloads, Entry-URLs, kein Loader-Zustand und keine Zeitmessungen in der UI.
- Keine Browser-Erweiterung und keine Anbindung an Framework-Devtools.
- Keine automatische Entfernung in Production: Schütze den Import hinter einem Build-Zeit-Flag, wie im Schnellstart.

Vollständige Dokumentation: [tuvix.js.org/de/packages/devtools](https://tuvix.js.org/de/packages/devtools)

## Lizenz

MIT

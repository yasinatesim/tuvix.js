# Lifecycle Hooks

Der Orchestrator führt jede registrierte App durch eine feste Abfolge von Hooks und Status. Diese Seite beschreibt die Hooks, die dein Modul implementiert, die Status, die die Shell auslesen kann, und was bei Fehlern und schneller Navigation passiert. Wenn du von außen erfahren willst, wann eine App auf der Seite ist, nutze [Lifecycle-Events](/de/guide/lifecycle-events).

## Reihenfolge der Hooks

```text
register()
  └─ first activation: load entry → bootstrap() → mount()
       ├─ updateAppProps() while mounted → update()
       └─ deactivation → unmount()
  └─ next activation: mount()   (module cached, no bootstrap)
```

Der Orchestrator wartet auf jeden Hook. Er ruft `mount` nie für eine App auf, die gerade noch mountet, und er ruft `unmount` nie auf, solange `mount` noch läuft: Der Unmount wartet, bis der Mount abgeschlossen ist.

## bootstrap

Läuft einmal pro geladenem Modul, nachdem der Entry geladen ist und vor dem ersten `mount`. Nutze ihn für Arbeit, die Remounts überdauern soll, etwa das Lesen von Konfiguration.

```ts
import { defineMicroApp } from '@tuvix.js/core';

let config: { apiUrl: string } | undefined;

export default defineMicroApp({
  name: 'reports',
  async bootstrap() {
    const response = await fetch('/reports/config.json');
    config = (await response.json()) as { apiUrl: string };
  },
  mount({ container }) {
    container.textContent = `API: ${config?.apiUrl ?? 'unknown'}`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Wirft `bootstrap` einen Fehler, wechselt die App in den Status `error` und der Mount schlägt fehl. Der nächste Mount-Versuch ruft `bootstrap` erneut auf. Nach einem erfolgreichen Durchlauf überspringen Remounts ihn.

## mount

Läuft jedes Mal, wenn die App aktiv wird oder wenn du `mountApp(name)` aufrufst. Der Kontext enthält:

| Feld | Wert |
| --- | --- |
| `container` | Das Element, in das gerendert wird. Bei Apps mit `sandbox: true` ein Element innerhalb des Shadow Root. |
| `props` | Die registrierten Props, zusammengeführt mit jedem `updateAppProps`-Aufruf. |
| `name` | Der registrierte App-Name. |
| `bus` | Der Event Bus des Orchestrators. |

`mountApp(name)` wird aufgelöst, sobald `mount` abgeschlossen ist, und wird mit dem Lade- oder Mount-Fehler abgelehnt.

## update

Läuft, wenn die Shell `updateAppProps(name, props)` aufruft, während die App gemountet ist:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('reports', { range: '7d' });
```

Der Kontext enthält die zusammengeführten `props` und den `container`. Fehlt `update` oder ist die App nicht gemountet, speichert der Orchestrator die Props und übergibt sie an den nächsten `mount`. Er mountet eine App nie neu, nur weil sich Props geändert haben.

`updateAppProps` wartet zuerst auf einen ausstehenden Mount, damit das Update die neue Instanz erreicht. Ein `unmount`, der während eines Updates eintrifft, wartet auf das Update.

## unmount

Läuft, wenn die App inaktiv wird, sowie bei `unmountApp(name)`, `unregister(name)` und `destroy()`. Entferne alles, was `mount` erzeugt hat: Framework-Roots, Listener, Timer, Bus-Abonnements.

Nach `unmount` entfernt der Orchestrator die Entry-Stylesheets der App aus `document.head`. Der nächste Mount fügt sie wieder hinzu und wartet, bis sie geladen sind.

## App-Status

```ts
import { createOrchestrator, type AppStatus } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
const status: AppStatus | null = orchestrator.getAppStatus('reports');
// 'registered' | 'bootstrapping' | 'bootstrapped' | 'mounting' | 'mounted'
// | 'updating' | 'unmounting' | 'unmounted' | 'error' | null (not registered)
```

| Methode | Rückgabe |
| --- | --- |
| `getAppStatus(name)` | Den Status, oder `null` für einen unbekannten Namen. |
| `getMountedApps()` | Namen mit Status `mounted`. |
| `getRegisteredApps()` | Jeden registrierten Namen. |

## Fehler und Fallback

Schlägt das Laden, `bootstrap` oder `mount` fehl, dann:

1. schreibt der Orchestrator das `fallback`-HTML der App in ihren Container, sofern du eines gesetzt hast;
2. setzt er den Status `error`;
3. sendet er `OrchestratorEvent.APP_ERROR` (`tuvix:app:error`) mit `{ name, error, phase }` auf dem Bus;
4. ruft er `onError(error, name)` auf;
5. lehnt er `mountApp` ab. Ein fehlgeschlagener Mount während eines Routenwechsels wird stattdessen mit `console.error` protokolliert, und die anderen Apps mounten trotzdem.

Ein fehlgeschlagenes `update` oder `unmount` durchläuft die Schritte 2 bis 4 und lehnt `updateAppProps` bzw. `unmountApp` ab; es schreibt kein Fallback-HTML. `phase` ist `'load'` (einschließlich der Auflösung des Containers), `'bootstrap'`, `'mount'`, `'update'` oder `'unmount'`.

```ts
import { createOrchestrator, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.getEventBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, phase, error }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

Der nächste Routenwechsel, der eine App im Status `error` aktiviert, versucht erneut, sie zu mounten.

## Schnelle Navigation

Routenwechsel werden nacheinander abgeglichen. Inaktive Apps unmounten, bevor aktive Apps mounten. Kommen Pfade schneller an, als Apps mounten:

- läuft als Nächstes nur der neueste wartende Pfad;
- überspringt eine App, die inaktiv wird, während ihr Entry lädt, ihren Mount;
- wird eine App, die inaktiv wird, während `mount` läuft, unmountet, sobald `mount` abgeschlossen ist.

A → B → A in schneller Folge endet also damit, dass nur A gemountet ist, und keine App rendert in einen Container, den eine andere App noch belegt.

## Hooks auf Shell-Ebene

```ts
import { createOrchestrator, OrchestratorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  onError: (error, name) => console.error(`[${name}]`, error),
  onStatusChange: (name, status) => console.debug(`[${name}] ${status}`),
});

const bus = orchestrator.getEventBus();
bus.on<{ name: string }>(OrchestratorEvent.APP_MOUNT, ({ name }) => {
  console.log('mounted', name);
});
bus.on<{ name: string }>(OrchestratorEvent.APP_UNMOUNT, ({ name }) => {
  console.log('unmounted', name);
});
bus.on<{ to: string }>(OrchestratorEvent.ROUTE_CHANGE, ({ to }) => {
  console.log('route', to);
});
```

| Event | Payload | Gesendet |
| --- | --- | --- |
| `tuvix:app:registered` | `{ name }` | `register()` |
| `tuvix:app:bootstrap` | `{ name }` | nach `bootstrap` |
| `tuvix:app:mount` | `{ name }` | nach `mount` |
| `tuvix:app:unmount` | `{ name }` | nach `unmount` |
| `tuvix:app:error` | `{ name, error, phase }` | Laden, Bootstrap, Mount, Update oder Unmount fehlgeschlagen |
| `tuvix:app:status-change` | `{ name, status }` | bei jeder Statusänderung |
| `tuvix:route:change` | `{ from, to, fromRoute, toRoute }` | nur bei Navigation über den eingebauten Router |
| `tuvix:started` | `{}` | am Ende von `start()` |
| `tuvix:destroyed` | `{}` | am Ende von `destroy()` |

Diese Bus-Events stammen vom Orchestrator. Die DOM-Events `tuvix:mounted` aus [Lifecycle-Events](/de/guide/lifecycle-events) stammen von den Adaptern und `defineMicroApp` und werden auch für Islands ausgelöst, die ohne Orchestrator gemountet sind.

## Abbau

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.destroy();
```

`destroy()` wartet auf einen laufenden Abgleich, unmountet jede App, stoppt den Router, die `connectRouter`-Abonnements, das Prefetching und den Viewport-Observer und leert den Loader-Cache. Es zerstört einen privaten Event Bus und lässt den globalen Bus bestehen. Ein zweiter Aufruf ist sicher. Danach werfen `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` und `connectRouter` einen Fehler; erstelle stattdessen einen neuen Orchestrator.

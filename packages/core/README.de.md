# @tuvix.js/core

> Orchestrator, der Micro Apps lädt und sie bei URL-Änderungen mountet oder unmountet.

Teil des Microfrontend-Frameworks [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

Vollständige Dokumentation: [tuvix.js.org/de/packages/core](https://tuvix.js.org/de/packages/core)

## Installation

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

Das Paket hängt von `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` und `@tuvix.js/sandbox` ab.

## Schnellstart

Shell:

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/settings/*', app: 'settings' }] },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

orchestrator.register({
  name: 'settings',
  entry: { scripts: ['/settings/main.js'], styles: ['/settings/main.css'] },
  container: '#main',
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Remote-App (`dashboard/main.js`):

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## Wie Apps aktiv werden

- `activeWhen: '/path'`: wird mit `matchPath` aus `@tuvix.js/router` abgeglichen. Query und Hash werden ignoriert, `'/dashboard'` und `'/dashboard/*'` passen auf `/dashboard` und jeden Unterpfad (nicht auf `/dashboards`), `:id` passt auf ein Segment, `'/'` passt auf jeden Pfad.
- `activeWhen: (path) => boolean`: deine Funktion entscheidet.
- Kein `activeWhen`, aber in `router.routes` genannt: aktiv, solange eine Route mit `app: name` vollständig passt. Eine `'/'`-Route bedeutet nur die Startseite; `'/*'` bedeutet jeden Pfad.
- Keins von beidem: du rufst `mountApp` / `unmountApp` auf; Reconciles lassen die App in Ruhe.
- `mountWhenVisible: true`: mountet, sobald der Container zu 10 % sichtbar ist; `activeWhen` wird ignoriert.

Der aktuelle Pfad kommt aus `getPath()` von `connectRouter`, sonst aus dem eingebauten Router, sonst aus `window.location.pathname`. Reconciles laufen nacheinander: Zuerst werden inaktive Apps unmountet, dann aktive Apps gemountet. Wartende Navigationen werden zum neuesten Pfad zusammengefasst. Eine App, die während des Ladens inaktiv wird, überspringt ihren Mount; eine App, die mitten im Mount inaktiv wird, wird unmountet, sobald der Mount abgeschlossen ist.

## API

### `createOrchestrator(config?)` / `new Orchestrator(config?)`

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | keiner | Eingebauter Router: `mode` (Standard `'history'` oder `'hash'`), `base`, `routes` (erforderlich). |
| `eventBus` | `EventBusOptions` | keiner | Optionen für einen privaten Bus. Weggelassen: Der Orchestrator verwendet `getGlobalBus()`. |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | Wird an den Modul-Loader übergeben, dazu `globals`. |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | `immediate` bei `start()`, `idle` in der ersten Leerlaufphase, `hover`, wenn ein Same-Origin-Link, der eine App aktiviert, Zeiger oder Fokus erhält. |
| `onError` | `(error: Error, appName: string) => void` | keiner | Fehler bei Laden, Bootstrap, Mount, Update und Unmount. |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | keiner | Jede Statusänderung. |

### `Orchestrator`-Methoden

| Methode | Verhalten |
| --- | --- |
| `register(appConfig: MicroAppConfig): void` | Speichert die Konfiguration. Lädt nicht, mountet nicht und führt keinen Reconcile aus. |
| `unregister(name): Promise<void>` | Unmountet, entfernt die Tags des Entrys und das gecachte Modul und vergisst die App. |
| `start(): Promise<void>` | Folgt dem Router, führt einen Reconcile aus, startet Prefetch und Viewport-Beobachtung. Sendet `STARTED`. |
| `mountApp(name): Promise<void>` | Wartet auf einen laufenden Unmount und mountet. Rejected mit dem Fehler, nachdem `fallback` gerendert wurde. |
| `unmountApp(name): Promise<void>` | Wartet auf einen laufenden Ladevorgang oder Mount und unmountet. |
| `updateAppProps(name, props): Promise<void>` | Merged die Props flach. Ruft bei einer gemounteten App `update({ props, container })` auf, sonst werden sie für den nächsten Mount gespeichert. |
| `reconcile(path?): Promise<void>` | Reiht einen Reconcile gegen `path` oder den aktuellen Pfad ein. |
| `connectRouter({ subscribe, getPath }): () => void` | Folgt einem externen Router. Gibt `disconnect` zurück. |
| `navigateTo(path): Promise<void>` | `push(path)` auf dem eingebauten Router. Wirft ohne Router `[Tuvix] No router configured.`. |
| `getAppStatus(name): AppStatus \| null` | Status, oder `null` für unbekannte Namen. |
| `getRegisteredApps(): string[]` | Registrierte Namen. |
| `getMountedApps(): string[]` | Namen mit Status `'mounted'`. |
| `getEventBus(): IEventBus` | `getGlobalBus()` oder der private Bus. |
| `getRouter(): IRouter \| null` | Eingebauter Router oder `null`. |
| `destroy(): Promise<void>` | Wartet auf einen laufenden Reconcile, unmountet jede App, hört auf zu lauschen und sendet `DESTROYED`. Lässt den globalen Bus bestehen. |

Optionen von `register`:

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Eindeutig; die Remote-App registriert sich unter demselben Namen. |
| `entry` | `Entry` | erforderlich | URL, `{ scripts, styles?, type?, integrity? }` oder `() => import('./app')`. |
| `container` | `string \| HTMLElement` | erforderlich | Selektor (bei jedem Mount aufgelöst) oder Element. |
| `activeWhen` | `string \| ((path: string) => boolean)` | keiner | Aktivierungsregel. |
| `props` | `Record<string, unknown>` | keiner | Werden an `mount()` übergeben. |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | In einem Shadow Root rendern, in den die `styles` des Entrys geladen werden. |
| `fallback` | `string` | keiner | HTML, das bei einem Fehler in Laden, Bootstrap oder Mount per `innerHTML` gesetzt wird. |
| `mountWhenVisible` | `boolean` | `false` | Mount bei 10 % Sichtbarkeit im Viewport. |

`connectRouter` mit TanStack Router:

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
// later: disconnect();
```

### `defineMicroApp(definition): MicroAppModule`

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Muss dem registrierten Namen entsprechen. |
| `bootstrap` | `() => void \| Promise<void>` | keiner | Läuft vor dem ersten Mount. Ein fehlgeschlagener Bootstrap läuft beim nächsten Mount erneut; ein erfolgreicher läuft einmal. |
| `mount` | `(context: MountContext) => void \| Promise<void>` | erforderlich | Erhält `container`, `props`, `name` und `bus`. |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | erforderlich | Erhält `container`. |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | keiner | Erhält `props` und `container`. |
| `ssr` | `boolean` | `false` | `mount` übernimmt Server-Markup; das `mounted`-Event meldet `hydrated: true`, wenn der Container Markup enthielt. |

Veröffentlicht das Modul mit `registerModule` aus `@tuvix.js/loader` und gibt es zurück. Das Modul löst die DOM-Events `tuvix:mounted`, `tuvix:unmounted` und `tuvix:error` aus (sie bubbeln bis `document`), daher funktionieren `whenMounted`, `isMounted` und `onLifecycle` dafür. Ein `unmount` während eines laufenden `mount` auf demselben Container wartet auf diesen. Wirft, wenn `name`, `mount` oder `unmount` fehlt.

### `OrchestratorEvent`

Events auf dem Bus des Orchestrators: `APP_REGISTERED` (`tuvix:app:registered`), `APP_BOOTSTRAP`, `APP_MOUNT`, `APP_UNMOUNT`, `APP_ERROR` (`AppErrorEvent`: `{ name, error, phase }` für Fehler in `'load'`, `'bootstrap'`, `'mount'`, `'update'` oder `'unmount'`), `APP_STATUS_CHANGE` (`{ name, status }`), `ROUTE_CHANGE` (nur eingebauter Router), `STARTED`, `DESTROYED`.

```ts
import { getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

### CSS-Isolation

`sandbox: true` oder `{ css: true }` hängt einen offenen Shadow Root an den Container (bei einem erneuten Mount wiederverwendet), mountet die App in ein `<div data-tuvix-sandbox-root>` darin und lädt dort die `styles` des Entrys. Der Mount wartet bis zu `loader.timeout` auf die Stylesheets. JavaScript wird nicht in eine Sandbox gesetzt; `JsSandbox` aus `@tuvix.js/sandbox` ist ein eigenständiges Hilfsmittel.

### Typen

`OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition`, `AppSandboxOption`, `RouterSource`, `AppErrorEvent`, `AppErrorPhase`, `AppStatus` (`registered`, `bootstrapping`, `bootstrapped`, `mounting`, `mounted`, `updating`, `unmounting`, `unmounted`, `error`), `RegisteredApp` (Form des Datensatzes; keine Methode gibt ihn zurück).

### Re-Exporte

- Aus `@tuvix.js/event-bus`: `createEventBus`, `getGlobalBus`, die Typen `IEventBus`, `EventHandler`, `Unsubscribe`.
- Aus `@tuvix.js/router`: `createRouter`, `matchPath`, `interceptLinks`, die Typen `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions`.
- Aus `@tuvix.js/loader`: `createLoader`, die Typen `Entry`, `MicroAppModule`.

## Sonderfälle

- `register()` nach `start()` führt für eine routengesteuerte App einen Reconcile gegen den aktuellen Pfad aus, sodass sie sofort mountet, wenn sie aktiv ist. Eine `mountWhenVisible`-App, die nach `start()` registriert wird, wird sofort beobachtet; ein Container, der zu diesem Zeitpunkt nicht im DOM ist, wird nie beobachtet.
- Fehler beim Reconcile lassen `start()` und `reconcile()` nicht rejecten; sie gehen an `onError` und die Konsole. `mountApp` rejected.
- Eine App im Status `error` versucht es beim nächsten Reconcile erneut, der sie aktiv haben will. `fallback` wird nur bei Fehlern in Laden, Bootstrap und Mount gerendert.
- Der Unmount entfernt die Stylesheets des Entrys aus `document.head`; der nächste Mount fügt sie wieder hinzu.
- Zwei Orchestratoren teilen sich `getGlobalBus()`. Übergib `eventBus: {}` für einen privaten Bus.
- Nach `destroy()` werfen verändernde Methoden `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`.

## Was es nicht tut

- JavaScript in eine Sandbox setzen.
- Linkklicks abfangen (verwende `interceptLinks`).
- Auf dem Server rendern (verwende `@tuvix.js/server`).
- Abhängigkeiten zwischen Apps teilen (verwende `@tuvix.js/module-federation` oder Import Maps).
- `tuvix:mounted`-DOM-Events für handgeschriebene Module senden; das übernehmen `defineMicroApp` und die Framework-Adapter.

## Migration von 0.4

- Der Orchestrator verwendet `getGlobalBus()`, außer du übergibst `eventBus`; `destroy()` lässt den globalen Bus bestehen.
- Reconciles unmounten manuell gemountete Apps und `mountWhenVisible`-Apps nicht mehr.
- `sandbox: true` rendert in einem Shadow Root.
- `prefetch: 'hover'` lädt nur Apps vorab, die ein Link mit Hover oder Fokus aktiviert.
- `activeWhen` verwendet `matchPath`: Query und Hash werden ignoriert, `:param` funktioniert, `.` und `(` passen wörtlich.
- `OrchestratorConfig.shared` ist entfernt (es wurde nie gelesen). Verwende `@tuvix.js/module-federation` oder Import Maps.
- `routes` des Routers passen nur vollständig: Eine `'/'`-Route ist nur die Startseite; verwende `'/*'` für jeden Pfad. `RouteConfig.exact` ist entfernt.
- `APP_ERROR` enthält `phase` und wird auch bei Fehlern in Update und Unmount ausgelöst.
- `connectRouter({ subscribe, getPath })` ersetzt die Brücke aus `setTimeout` + `reconcile()` für externe Router.

## Lizenz

MIT

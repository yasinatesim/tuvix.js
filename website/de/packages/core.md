---
title: '@tuvix.js/core'
---

<PackageHeader
  name="@tuvix.js/core"
  title="Core Orchestrator"
  description="Registriert Micro Apps, lädt ihre Entries und mountet oder unmountet sie, wenn sich die URL ändert. Folgt dem eingebauten oder einem externen Router, isoliert das CSS einer App auf Wunsch in einem Shadow Root und meldet Lifecycle-Events auf einem gemeinsamen Event Bus."
  icon="⚙️"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

`@tuvix.js/core` hängt von `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` und `@tuvix.js/sandbox` ab. Dein Paketmanager installiert sie mit.

## Wann du es verwendest

Verwende den Orchestrator in der Host-Seite (der Shell), wenn sich mehrere unabhängig gebaute Apps eine Seite teilen und die URL entscheidet, welche davon sichtbar ist. Du registrierst jede App einmal mit ihrer Entry-URL, ihrem Container und den Pfaden, die ihr gehören. Der Orchestrator lädt den Entry bei der ersten Verwendung, ruft `bootstrap`, `mount` und `unmount` der App auf und hält die Seite bei jeder Navigation auf dem aktuellen Stand.

In diesen Fällen wählst du etwas anderes:

- Du renderst eine Framework-Island pro Seite, und der Server entscheidet bereits, was angezeigt wird. Die Adapter (`@tuvix.js/react`, `@tuvix.js/vue`, `@tuvix.js/svelte`, `@tuvix.js/angular`) und [`@tuvix.js/vite`](/de/packages/vite) mounten Islands ohne Orchestrator.
- Du musst nur ein Remote-Skript laden und seinen Lifecycle selbst aufrufen. Verwende [`@tuvix.js/loader`](/de/packages/loader).
- Du willst alles aus einem Import. Installiere das Gesamtpaket [`tuvix.js`](/de/packages/tuvix), das dieses Paket re-exportiert.

## Schnellstart

Die Shell registriert zwei Apps, die sich `#main` teilen, folgt der Browser-URL mit dem eingebauten Router und macht aus Klicks auf Links derselben Origin Router-Navigationen:

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/settings/*', app: 'settings' }],
  },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

// Active on /dashboard and every path below it.
orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

// No activeWhen: the router route above activates it on /settings/*.
orchestrator.register({
  name: 'settings',
  entry: {
    scripts: ['https://cdn.example.com/settings/main.js'],
    styles: ['https://cdn.example.com/settings/main.css'],
  },
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Jedes Remote veröffentlicht seinen Lifecycle unter dem Namen, den die Shell registriert hat. Für reinen DOM-Code übernimmt das `defineMicroApp`, für React-, Vue-, Svelte- und Angular-Komponenten übernehmen es die Framework-Adapter.

```ts
// dashboard/main.ts, built to https://cdn.example.com/dashboard/main.js
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props, bus }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
    bus?.emit('dashboard:ready', { at: Date.now() });
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## Wie Apps aktiv werden {#how-apps-become-active}

Jede registrierte App folgt einer von fünf Aktivierungsregeln. Der Orchestrator wählt die Regel anhand der Config der App.

| Config | Die App ist aktiv, wenn | Wer sie unmountet |
| --- | --- | --- |
| `activeWhen: '/path'` | `matchPath('/path', currentPath).matched` `true` ist | der nächste Abgleich, bei dem der Pfad nicht mehr passt |
| `activeWhen: (path) => boolean` | deine Funktion `true` zurückgibt | der nächste Abgleich, bei dem sie `false` zurückgibt |
| kein `activeWhen`, in `router.routes` genannt | eine Route mit `app: name` vollständig zum Pfad passt | der nächste Abgleich, bei dem keine solche Route passt |
| kein `activeWhen`, keine Route | nie von selbst | du, mit `mountApp` / `unmountApp` |
| `mountWhenVisible: true` | ihr Container zu mindestens 10 % im Viewport liegt | du; Abgleiche überspringen sie und `activeWhen` wird ignoriert |

`activeWhen`-Strings laufen durch [`matchPath`](/de/packages/router) aus `@tuvix.js/router`, denselben Matcher, den auch der Router und `@tuvix.js/server` verwenden:

- `?query` und `#hash` werden ignoriert, daher bleibt das Dashboard bei `/dashboard?tab=2` gemountet.
- Ein einfaches Muster passt auf seine Unterpfade an Segmentgrenzen: `'/dashboard'` passt auf `/dashboard` und `/dashboard/stats`, aber nicht auf `/dashboards`.
- `'/dashboard/*'` passt auf dieselben Pfade wie `'/dashboard'`.
- `:name` passt auf ein Segment: `'/users/:id'` passt auf `/users/42`.
- `'/'` passt auf jeden Pfad.
- Andere Zeichen wie `.` und `(` passen wörtlich.

Router-`routes` verwenden stattdessen einen vollständigen Abgleich. `{ path: '/settings' }` passt nur auf `/settings`; schreibe `'/settings/*'`, um Unterpfade einzuschließen. Eine `'/'`-Route wird nur auf der Startseite aktiv, `'/*'` auf jedem Pfad. Query-Strings und Hashes werden auch hier ignoriert.

### Woher der aktuelle Pfad kommt

Der Orchestrator liest den Pfad aus der ersten vorhandenen Quelle:

1. Dem Router, den du an `connectRouter` übergeben hast (sein `getPath()`).
2. Dem eingebauten Router aus `config.router` (sein `currentPath`).
3. `window.location.pathname`.

Mit `config.router` oder `connectRouter` löst jede Navigation einen Abgleich aus. Ohne beides gleicht `start()` einmal gegen `window.location.pathname` ab, und auf spätere Navigationen reagiert nichts, bis du `reconcile()` aufrufst.

### Abgleiche laufen nacheinander {#reconciles-run-one-at-a-time}

Ein Abgleich (Reconcile) vergleicht jede routengesteuerte App mit dem Pfad und bringt das DOM in Übereinstimmung:

1. Apps, die inaktiv sein sollen, unmounten zuerst, alle parallel. So überlappen sich zwei Apps mit demselben Container nie.
2. Apps, die aktiv sein sollen, laden danach (nur beim ersten Mal), bootstrappen (bis ein `bootstrap`-Aufruf erfolgreich ist) und mounten, parallel.

Trifft während eines Abgleichs eine Navigation ein, stellt der Orchestrator sie in eine Warteschlange. Stauen sich drei Navigationen, läuft als Nächstes nur der neueste Pfad, und das Promise jedes Aufrufers wird aufgelöst, sobald die Warteschlange leer ist. Eine App, die inaktiv wird, während ihr Entry lädt, überspringt ihren Mount. Eine App, die mitten in `mount()` inaktiv wird, unmountet, sobald dieser Mount abgeschlossen ist. Navigierst du schnell `/a` → `/b` → `/a`, bleibt nur `a` gemountet.

## API

### `createOrchestrator`

```ts no-check
function createOrchestrator(config?: OrchestratorConfig): Orchestrator;
```

Erstellt einen `Orchestrator`. Entspricht `new Orchestrator(config)`.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | keiner | Erstellt den eingebauten Router aus `@tuvix.js/router` mit `mode` (`'history'` oder `'hash'`, Standard `'history'`), `base` und `routes` (erforderlich, darf `[]` sein). Nötig für `navigateTo` und `ROUTE_CHANGE`-Events. |
| `eventBus` | `EventBusOptions` | keiner | Optionen (`maxListeners`, `debug`, `logger`) für einen privaten Bus. Lässt du sie weg, verwendet der Orchestrator `getGlobalBus()`, den Bus, den sich alle Apps auf der Seite teilen. |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | Wird an den internen `ModuleLoader` übergeben. `timeout` gilt pro Versuch in ms (`0` deaktiviert es); `globals` werden auf `window` geschrieben, bevor die Skripte eines Entrys laufen. |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | Wann Entries heruntergeladen werden, bevor sie gebraucht werden. Siehe unten. |
| `onError` | `(error: Error, appName: string) => void` | keiner | Wird aufgerufen, wenn das Laden, Bootstrappen, Mounten, Aktualisieren oder Unmounten einer App fehlschlägt. `OrchestratorEvent.APP_ERROR` meldet dieselben Fehler mit der Phase. |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | keiner | Wird bei jeder Statusänderung jeder App aufgerufen. |

Prefetch-Strategien laden Skript- und Style-URLs mit `<link rel="prefetch">` oder `<link rel="modulepreload">` herunter, ohne sie auszuführen. Entries als Loader-Funktion werden übersprungen, weil der Aufruf der Funktion das Modul ausführen würde.

- `'immediate'`: jede registrierte App, während `start()`.
- `'idle'`: jede registrierte App, im ersten `requestIdleCallback` nach `start()` (200 ms `setTimeout`, wo diese API fehlt).
- `'hover'`: Wenn der Zeiger einen Link derselben Origin betritt oder der Fokus darauf landet, lädt der Orchestrator die Apps vorab, die der Pfad dieses Links aktivieren würde. Jede App wird einmal vorab geladen. Hash-Modus und `router.base` werden berücksichtigt.

`destroy()` bricht ausstehendes Idle- und Hover-Prefetching ab.

### `Orchestrator`

```ts no-check
class Orchestrator {
  constructor(config?: OrchestratorConfig);
  register(appConfig: MicroAppConfig): void;
  unregister(name: string): Promise<void>;
  start(): Promise<void>;
  mountApp(name: string): Promise<void>;
  unmountApp(name: string): Promise<void>;
  updateAppProps(name: string, props: Record<string, unknown>): Promise<void>;
  reconcile(path?: string): Promise<void>;
  connectRouter(source: RouterSource): () => void;
  navigateTo(path: string): Promise<void>;
  getAppStatus(name: string): AppStatus | null;
  getRegisteredApps(): string[];
  getMountedApps(): string[];
  getEventBus(): IEventBus;
  getRouter(): IRouter | null;
  destroy(): Promise<void>;
}
```

#### `register(appConfig)`

Speichert die Config einer App. Es lädt, mountet und gleicht nichts ab; das übernehmen `start()` und spätere Navigationen.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Eindeutiger App-Name. Das Remote-Modul muss sich unter demselben Namen registrieren (`defineMicroApp({ name })` oder das `name` eines Adapters) oder genau ein neues `window`-Global mit einer `mount`-Funktion bereitstellen. |
| `entry` | `Entry` | erforderlich | Eine Skript-URL, eine `EntryConfig` (`{ scripts, styles?, type?, integrity? }`) oder eine Loader-Funktion wie `() => import('./dashboard')`. Siehe [`@tuvix.js/loader`](/de/packages/loader). |
| `container` | `string \| HTMLElement` | erforderlich | CSS-Selektor oder Element. Ein Selektor wird bei jedem Mount mit `document.querySelector` aufgelöst. |
| `activeWhen` | `string \| ((path: string) => boolean)` | keiner | Aktivierungsregel. Siehe [Wie Apps aktiv werden](#how-apps-become-active). |
| `props` | `Record<string, unknown>` | keiner | Werden an `mount()` übergeben. `updateAppProps` führt neue Werte in sie zusammen. |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | `true` oder `{ css: true }` rendert die App in einem Shadow Root auf ihrem Container. Siehe [CSS-Isolation](#css-isolation). |
| `fallback` | `string` | keiner | HTML, das per `innerHTML` in den Container geschrieben wird, wenn Laden, Bootstrappen oder Mounten fehlschlägt. Fehler beim Aktualisieren und Unmounten lassen den Container unverändert. |
| `mountWhenVisible` | `boolean` | `false` | Mountet, sobald der Container zu 10 % sichtbar ist, über `IntersectionObserver`. Abgleiche ignorieren die App und ihr `activeWhen`. |

Wirft `[Tuvix] App name is required.`, `[Tuvix] App "<name>" is already registered.`, `[Tuvix] App "<name>" requires an entry.` oder `[Tuvix] App "<name>" requires a container.`.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile'),
  container: '#main',
  activeWhen: '/users/:id',
  fallback: '<p>The profile is unavailable.</p>',
});

orchestrator.register({
  name: 'comments',
  entry: 'https://cdn.example.com/comments/main.js',
  container: '#comments',
  mountWhenVisible: true,
});

await orchestrator.start();
```

#### `start()`

Abonniert den eingebauten Router (falls vorhanden), gleicht gegen den aktuellen Pfad ab, richtet das Prefetching ein und beginnt, `mountWhenVisible`-Container zu beobachten. Emittiert `OrchestratorEvent.STARTED`. Wird nach dem ersten Abgleich aufgelöst, auch wenn dabei eine App fehlgeschlagen ist; Fehler gehen an `onError`, `APP_ERROR` und die Konsole. Ein zweiter Aufruf loggt `[Tuvix] Orchestrator is already started.` und kehrt zurück.

#### `mountApp(name)` / `unmountApp(name)`

Mounten oder unmounten eine App von Hand. Verwende sie für Apps ohne `activeWhen` oder Route; bei routengesteuerten Apps überschreibt der nächste Abgleich deine Wahl.

`mountApp` wartet auf einen laufenden Unmount, dann lädt und mountet es. Nach dem Rendern von `fallback` lehnt es mit dem Lade- oder Mount-Fehler ab. `unmountApp` wartet auf einen laufenden Ladevorgang oder Mount, dann unmountet es; während des Ladens aufgerufen, überspringt es den Mount komplett.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'chat', entry: '/chat/main.js', container: '#chat' });
await orchestrator.start();

document.querySelector('#open-chat')?.addEventListener('click', () => {
  orchestrator.mountApp('chat').catch(() => {
    // fallback HTML is already in #chat
  });
});
```

#### `updateAppProps(name, props)`

Führt `props` flach mit den aktuellen Props der App zusammen. Eine gemountete App mit einer `update`-Funktion erhält das zusammengeführte Objekt als `update({ props, container })`. Andernfalls speichert der Orchestrator die zusammengeführten Props und übergibt sie beim nächsten `mount()`. Es wartet zuerst auf einen ausstehenden Mount, damit das Update die neue Instanz erreicht. Wirft `update`, wechselt der Status zu `error`, `onError` läuft, das Promise lehnt ab, und die gespeicherten Props bleiben unverändert.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'cart', entry: '/cart/main.js', container: '#cart', activeWhen: '/' });
await orchestrator.start();

await orchestrator.updateAppProps('cart', { currency: 'EUR' });
```

#### `reconcile(path?)`

Stellt einen Abgleich gegen `path` in die Warteschlange, oder gegen den aktuellen Pfad, wenn du ihn weglässt. Verwende es, wenn kein Router den Orchestrator über Navigationen informiert. Es gelten die Warteschlangenregeln aus [Abgleiche laufen nacheinander](#reconciles-run-one-at-a-time).

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.reconcile('/dashboard?tab=stats');
```

#### `connectRouter(source)`

Folgt einem externen Router (TanStack Router, React Router, deinem eigenen) statt dem eingebauten. `source.subscribe(callback)` muss `callback` nach jeder Navigation aufrufen und eine Funktion zum Abmelden zurückgeben; `source.getPath()` gibt den aktuellen Pfad zurück. Nach `start()` gleicht jeder Callback gegen `getPath()` ab. Auch `start()` liest `getPath()`. Verbindest du einen bereits gestarteten Orchestrator, gleicht er sofort ab. Gibt `disconnect()` zurück.

```ts
import { createOrchestrator } from '@tuvix.js/core';

// TanStack Router instance created elsewhere in your shell.
declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'billing', entry: '/billing/main.js', container: '#main', activeWhen: '/billing' });

const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();

// Later, when the shell tears down:
disconnect();
```

Ein React-Router-Data-Router (`createBrowserRouter`) passt in dieselbe Form: `subscribe: (callback) => router.subscribe(() => callback())` und `getPath: () => router.state.location.pathname`.

#### `navigateTo(path)`

Ruft `push(path)` auf dem eingebauten Router auf. Das Promise wird aufgelöst, nachdem sich die URL geändert hat; der dadurch ausgelöste Abgleich läuft im Hintergrund. Wirft ohne `config.router` den Fehler `[Tuvix] No router configured.`.

#### `getAppStatus(name)`, `getRegisteredApps()`, `getMountedApps()`

`getAppStatus` gibt den `AppStatus` der App zurück, bei einem unbekannten Namen `null`. `getRegisteredApps` gibt jeden registrierten Namen zurück. `getMountedApps` gibt die Namen zurück, deren Status `'mounted'` ist (eine App im Status `'updating'` fehlt darin).

#### `getEventBus()`, `getRouter()`

`getEventBus` gibt den Bus zurück, auf dem der Orchestrator `OrchestratorEvent`s emittiert und den er an `mount()` übergibt: `getGlobalBus()` oder den privaten Bus, wenn du `eventBus` setzt. `getRouter` gibt den eingebauten Router zurück oder `null`.

#### `unregister(name)`

Unmountet die App (und wartet dabei auf einen laufenden Mount), beendet die Beobachtung ihres Containers, entfernt die Script- und Style-Tags des Entrys, verwirft das gecachte Modul und vergisst die App. Lehnt bei unbekannten Namen ab. Browser führen ein Modul-Skript einmal pro URL aus. Willst du einen URL-Entry mit `type: 'module'` erneut registrieren, brauchst du daher eine neue URL oder eine Loader-Funktion.

#### `destroy()`

Stoppt das Prefetching, meldet sich vom eingebauten Router und jedem verbundenen Router ab, wartet auf einen laufenden Abgleich, unmountet jede App, leert den Loader-Cache und emittiert `OrchestratorEvent.DESTROYED`. Einen privaten Bus zerstört es, den globalen Bus lässt es bestehen. Wiederholte Aufrufe geben dasselbe Promise zurück. Danach werfen `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` und `connectRouter` den Fehler `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`.

### `defineMicroApp`

```ts no-check
function defineMicroApp(definition: MicroAppDefinition): MicroAppModule;
```

Validiert ein Lifecycle-Objekt, veröffentlicht es mit `registerModule(definition.name, module)` aus `@tuvix.js/loader` und gibt es zurück. Rufe es im Entry der Remote-App auf. Der Orchestrator findet das Modul über den Namen, nachdem die Skripte des Entrys gelaufen sind, egal ob der Entry eine URL oder eine Loader-Funktion ist.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `name` | `string` | erforderlich | Muss dem `name` entsprechen, den die Shell registriert hat. |
| `bootstrap` | `() => void \| Promise<void>` | keiner | Läuft nach dem ersten Laden, vor dem ersten Mount. Wirft es, schlägt der Mount fehl, und der nächste Mount ruft es erneut auf; nach einem Erfolg läuft es für diesen Orchestrator nie wieder. |
| `mount` | `(context: MountContext) => void \| Promise<void>` | erforderlich | Rendert in `context.container`. |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | erforderlich | Räumt auf und leert `context.container`. |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | keiner | Wendet `context.props` ohne erneuten Mount an. Ohne diese Funktion warten neue Props auf den nächsten Mount. |
| `ssr` | `boolean` | `false` | Setze es, wenn `mount` serverseitig gerendertes Markup übernimmt. Das Event `tuvix:mounted` meldet dann `hydrated: true`, wenn der Container vor dem Lauf von `mount` Markup enthielt. |

`MountContext` enthält:

| Feld | Typ | Bedeutung |
| --- | --- | --- |
| `container` | `HTMLElement` | Element, in das gerendert wird. Bei CSS-isolierten Apps ist es ein `<div data-tuvix-sandbox-root>` im Shadow Root. |
| `props` | `Record<string, unknown> \| undefined` | Aktuelle Props. |
| `name` | `string \| undefined` | Der registrierte App-Name. |
| `bus` | `MicroAppBus \| undefined` | Der Event Bus des Orchestrators (`on`, `once`, `emit`, `off`). |

Das zurückgegebene Modul umhüllt dein `mount` und `unmount` und löst dieselben DOM-Lifecycle-Events aus wie die Framework-Adapter. Deshalb funktionieren `whenMounted(name)`, `isMounted(name)` und `onLifecycle` aus `@tuvix.js/loader` für diese Apps:

- `tuvix:mounted`, nachdem `mount` aufgelöst wurde, mit `{ name, container, hydrated }`.
- `tuvix:unmounted`, nachdem `unmount` aufgelöst wurde.
- `tuvix:error`, wenn eine der beiden Funktionen wirft. Der Wrapper wirft den Fehler dann erneut.

Die Events steigen vom Container bis zu `document` auf. Bei einem Container, der nicht im Dokument hängt, löst die Runtime sie direkt auf `document` aus. Ein `unmount`, das eintrifft, während `mount` für denselben Container noch läuft, wartet zuerst auf diesen Mount.

Wirft `[Tuvix] defineMicroApp requires a "name" property.`, `[Tuvix] defineMicroApp "<name>" requires a "mount" function.` oder `[Tuvix] defineMicroApp "<name>" requires an "unmount" function.`.

```ts
import { defineMicroApp } from '@tuvix.js/core';

let offCart: (() => void) | undefined;

export default defineMicroApp({
  name: 'header',
  bootstrap() {
    console.log('header loaded');
  },
  mount({ container, props, bus }) {
    container.innerHTML = `<header>Hello, ${String(props?.user ?? 'guest')} <span id="count">0</span></header>`;
    offCart = bus?.on<{ count: number }>('cart:changed', ({ count }) => {
      const badge = container.querySelector('#count');
      if (badge) badge.textContent = String(count);
    });
  },
  update({ props, container }) {
    const header = container?.querySelector('header');
    if (header?.firstChild) header.firstChild.textContent = `Hello, ${String(props.user ?? 'guest')} `;
  },
  unmount({ container }) {
    offCart?.();
    container.replaceChildren();
  },
});
```

### `OrchestratorEvent`

String-Enum der Events, die der Orchestrator auf seinem Bus emittiert. Da der Standard-Bus `getGlobalBus()` ist, kann jede App auf der Seite zuhören.

| Member | Event-Name | Payload |
| --- | --- | --- |
| `APP_REGISTERED` | `'tuvix:app:registered'` | `{ name }` |
| `APP_BOOTSTRAP` | `'tuvix:app:bootstrap'` | `{ name }` |
| `APP_MOUNT` | `'tuvix:app:mount'` | `{ name }` |
| `APP_UNMOUNT` | `'tuvix:app:unmount'` | `{ name }` |
| `APP_ERROR` | `'tuvix:app:error'` | `AppErrorEvent`: `{ name, error, phase }`, wobei `phase` `'load'`, `'bootstrap'`, `'mount'`, `'update'` oder `'unmount'` ist |
| `APP_STATUS_CHANGE` | `'tuvix:app:status-change'` | `{ name, status }` |
| `ROUTE_CHANGE` | `'tuvix:route:change'` | das `NavigationEvent` des eingebauten Routers (`from`, `to`, `fromRoute`, `toRoute`) |
| `STARTED` | `'tuvix:started'` | `{}` |
| `DESTROYED` | `'tuvix:destroyed'` | `{}` |

`phase: 'load'` umfasst neben dem Laden des Entrys auch das Auflösen des Containers.

```ts
import { createOrchestrator, getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
```

### CSS-Isolation {#css-isolation}

`sandbox: true` oder `sandbox: { css: true }` isoliert das CSS einer App:

1. Beim ersten Mount hängt der Orchestrator mit `CssSandbox` aus [`@tuvix.js/sandbox`](/de/packages/sandbox) einen offenen Shadow Root an den Container und verschiebt vorhandene Kindelemente (serverseitig gerendertes Markup) in ein `<div data-tuvix-sandbox-root="<name>">` darin. Die App mountet in dieses Div.
2. Die `styles` des Entrys laden als `<link>`-Elemente im Shadow Root statt in `document.head`. Der Mount wartet, bis sie geladen oder fehlgeschlagen sind, höchstens `loader.timeout` ms (standardmäßig 10000; bei `0` wartet er ohne Limit).
3. Der Unmount behält den Shadow Root. Der nächste Mount verwendet ihn wieder.

Stylesheets der Seite treffen keine Elemente in der App mehr, und die Stylesheets der App erreichen die Seite nicht mehr. Vererbte Eigenschaften wie `color` und `font-family` überqueren die Shadow-Grenze weiterhin. `{ css: false }` und `false` rendern ins Light DOM.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'checkout',
  entry: { scripts: ['/checkout/main.js'], styles: ['/checkout/main.css'] },
  container: '#checkout',
  activeWhen: '/checkout',
  sandbox: { css: true },
});

await orchestrator.start();
```

Der Orchestrator sandboxt kein JavaScript. `JsSandbox` in [`@tuvix.js/sandbox`](/de/packages/sandbox) ist ein eigenständiges Werkzeug, das du selbst aufrufst.

### Typen

| Typ | Bedeutung |
| --- | --- |
| `OrchestratorConfig` | Argument von `createOrchestrator` und `new Orchestrator`. Siehe die Tabelle unter `createOrchestrator`. |
| `MicroAppConfig` | Argument von `register`. Siehe die Tabelle unter `register`. |
| `MicroAppDefinition` | Argument von `defineMicroApp`: `name`, `bootstrap?`, `mount`, `unmount`, `update?`. |
| `AppSandboxOption` | `boolean \| { css?: boolean }`, das Feld `sandbox`. |
| `RouterSource` | `{ subscribe(callback: () => void): () => void; getPath(): string }`, das Argument von `connectRouter`. |
| `AppErrorEvent` | `{ name: string; error: Error; phase: AppErrorPhase }`, die Payload von `APP_ERROR`. |
| `AppErrorPhase` | `'load' \| 'bootstrap' \| 'mount' \| 'update' \| 'unmount'`. |
| `AppStatus` | `'registered' \| 'bootstrapping' \| 'bootstrapped' \| 'mounting' \| 'mounted' \| 'updating' \| 'unmounting' \| 'unmounted' \| 'error'`. Der erste Mount durchläuft `registered → bootstrapping → bootstrapped → mounting → mounted`; ein erneuter Mount läuft `unmounted → mounting → mounted`. |
| `RegisteredApp` | Form des Orchestrator-Eintrags für eine App: `config`, `status`, `module`, `container`, `error`, `lastUpdated`. In 0.5.0 gibt keine `Orchestrator`-Methode ihn zurück. |

### Re-Exports

`@tuvix.js/core` re-exportiert diese Exporte aus seinen Abhängigkeiten, damit eine Shell alles aus einem Paket importieren kann. Jeder Link dokumentiert die vollständige API.

| Export | Art | Quelle |
| --- | --- | --- |
| `createEventBus`, `getGlobalBus` | Funktion | [`@tuvix.js/event-bus`](/de/packages/event-bus) |
| `IEventBus`, `EventHandler`, `Unsubscribe` | Typ | [`@tuvix.js/event-bus`](/de/packages/event-bus) |
| `createRouter`, `matchPath`, `interceptLinks` | Funktion | [`@tuvix.js/router`](/de/packages/router) |
| `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions` | Typ | [`@tuvix.js/router`](/de/packages/router) |
| `createLoader` | Funktion | [`@tuvix.js/loader`](/de/packages/loader) |
| `Entry`, `MicroAppModule` | Typ | [`@tuvix.js/loader`](/de/packages/loader) |

`getGlobalBus()` legt seine Instanz auf `window.__TUVIX_GLOBAL_BUS__` ab. Eine Micro App, die ihre eigene Kopie von `@tuvix.js/event-bus` bündelt, erhält so denselben Bus wie die Shell.

## Sonderfälle

- `register()` vor `start()` speichert nur die Config. Nach `start()` gleicht das Registrieren einer routengesteuerten App (sie hat `activeWhen`, oder eine Router-Route nennt sie) gegen den aktuellen Pfad ab. Die App mountet also sofort, wenn der Pfad sie aktiviert.
- Eine `mountWhenVisible`-App, die nach `start()` registriert wird, wird sofort beobachtet. Fehlt ihr Container in diesem Moment (oder bei `start()`) im DOM, wird sie übersprungen und nie beobachtet. Ohne `IntersectionObserver` (Server, alte Browser) mounten Viewport-Apps nie.
- Eine Viewport-App, deren Mount fehlgeschlagen ist, bleibt in `error`; der Observer versucht es nicht erneut.
- Eine routengesteuerte App in `error` versucht es beim nächsten Abgleich erneut, der sie aktiv haben will. Ein fehlgeschlagener Ladevorgang lädt erneut. Ein fehlgeschlagenes `bootstrap` führt beim erneuten Versuch `bootstrap` erneut aus; ein erfolgreiches wiederholt sich nicht, daher versucht ein fehlgeschlagener `mount` nur `mount` erneut.
- Ein fehlender Container lässt den Mount mit `[Tuvix] Container "#main" not found in DOM.` fehlschlagen. Bei einem ersten Mount kann `fallback` nirgends gerendert werden.
- Fehler beim Abgleich lehnen `start()`, `reconcile()` und Navigationen nicht ab. Der Orchestrator loggt `[Tuvix] Failed to mount "<name>":` (oder `unmount`) in die Konsole und ruft `onError` auf. `mountApp` und `unmountApp` lehnen ab.
- `APP_ERROR` feuert bei Fehlern in jeder Phase, wobei `phase` sie benennt. `fallback` wird nur bei Fehlern in `load`, `bootstrap` und `mount` gerendert.
- Eine App, deren Unmount wirft, endet in `error` und gilt als unmountet.
- `fallback` läuft über `innerHTML`. Übergib nur vertrauenswürdiges Markup.
- Der Unmount entfernt die Entry-Stylesheets der App aus `document.head`, es sei denn, eine andere geladene App verwendet dieselbe URL. Der nächste Mount fügt sie wieder hinzu und wartet auf sie.
- Zwei Orchestratoren auf einer Seite teilen sich `getGlobalBus()` und sehen gegenseitig ihre `OrchestratorEvent`s. Übergib `eventBus: {}`, um einem davon einen privaten Bus zu geben.
- `resetGlobalBus()` aus `@tuvix.js/event-bus` zerstört den Bus, den ein laufender Orchestrator hält. Der Orchestrator behält den zerstörten Bus; rufe `resetGlobalBus()` erst nach `destroy()` auf, zum Beispiel zwischen Tests.
- `connectRouter`-Callbacks, die vor `start()` feuern, werden ignoriert. Rufst du `connectRouter` zweimal auf, bleiben beide Abonnements bestehen; die neueste Quelle liefert den Pfad für `start()` und `reconcile()`.
- Mit `config.router` und `connectRouter` zugleich gleicht jede Quelle gegen ihren eigenen Pfad ab. Verwende nur eines von beiden.
- `activeWhen`-Funktionen erhalten den rohen Pfad aus der Quelle. Mit dem eingebauten Router oder `connectRouter` kann dieser Pfad einen Query-String enthalten; `matchPath` entfernt ihn bei String-Mustern.
- `updateAppProps` ersetzt verschachtelte Objekte: `{ user: { id: 2 } }` überschreibt die gesamte Prop `user`.

## Was es nicht tut

- Es sandboxt kein JavaScript. Globals, Timer und Listener, die eine App anlegt, bleiben auf `window`. Verwende `JsSandbox` aus [`@tuvix.js/sandbox`](/de/packages/sandbox).
- Es fängt keine Link-Klicks ab. Rufe `interceptLinks` auf (hier re-exportiert) oder lass deinen Framework-Router navigieren.
- Es rendert nicht auf dem Server. Verwende [`@tuvix.js/server`](/de/packages/server) und die `./server`-Entries der Adapter.
- Es teilt keine Abhängigkeiten zwischen Apps. Verwende [`@tuvix.js/module-federation`](/de/packages/module-federation) oder Import Maps.
- Es löst die DOM-Lifecycle-Events (`tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`) nicht selbst aus. Module aus `defineMicroApp` und die Framework-Adapter lösen sie aus; ein handgeschriebenes `MicroAppModule` löst keine aus, außer es ruft `emitLifecycle` aus `@tuvix.js/loader` auf.
- Es hält eine App beim Unmount nicht am Leben. Zustand innerhalb der App geht verloren, außer die App speichert ihn woanders.

## Migration von 0.4 {#migrating-from-0-4}

Breaking Changes in 0.5.0:

- **Gemeinsamer Event Bus.** Der Bus des Orchestrators ist `getGlobalBus()`, außer du übergibst `eventBus`. In 0.4 hat jeder Orchestrator seinen eigenen Bus erstellt. `destroy()` lässt den globalen Bus jetzt bestehen.

  ```ts
  import { createOrchestrator } from '@tuvix.js/core';

  // 0.5: keep a private bus as in 0.4
  const orchestrator = createOrchestrator({ eventBus: {} });
  ```

- **Manuelle Apps bleiben gemountet.** Abgleiche unmounten keine Apps mehr, die weder `activeWhen` noch eine Router-Route haben, und auch keine `mountWhenVisible`-Apps. In 0.4 hat die nächste Routenänderung eine manuell gemountete App unmountet. Rufe `unmountApp(name)` dort auf, wo du dich darauf verlassen hast.
- **`sandbox: true` verwendet einen Shadow Root.** Das CSS der Seite erreicht die App nicht mehr, und die `styles` des Entrys erreichen die Seite nicht mehr. Entferne `sandbox` oder setze `{ css: false }`, um das Rendering von 0.4 beizubehalten.
- **`prefetch: { strategy: 'hover' }`** lädt nur die Apps vorab, die ein Link unter dem Zeiger oder mit Fokus aktiviert. In 0.4 hat die erste Mausbewegung irgendwo auf der Seite jede App vorab geladen.
- **`activeWhen` verwendet `matchPath`.** Ein Query-String oder Hash unmountet eine App nicht mehr, `:param`-Segmente funktionieren, und Zeichen wie `.` und `(` passen wörtlich.
- **`shared` entfällt.** `OrchestratorConfig.shared` wurde nie gelesen und ist aus dem Typ entfernt. Lösche es; teile Abhängigkeiten mit [`@tuvix.js/module-federation`](/de/packages/module-federation) oder Import Maps.
- **Router-`routes` passen vollständig.** Eine Route `{ path: '/', app: 'home' }` wird nur auf `/` aktiv. Verwende `'/*'` für eine App, die auf jedem Pfad erscheint, oder `activeWhen: '/'`, das den Präfix-Abgleich beibehält. `RouteConfig.exact` ist entfernt; lass es weg.
- **Payload von `APP_ERROR`.** Sie enthält jetzt `phase` und feuert auch bei Fehlern in Update und Unmount. Handler, die von einem Mount-Fehler ausgegangen sind, sollten `phase` prüfen.

Der Workaround aus 0.4 für externe Router kann entfallen:

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();

// 0.4:
// router.subscribe('onResolved', () => setTimeout(() => orchestrator.reconcile(location.pathname)));

// 0.5:
orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
```

Frühere Versionen dieser Seite beschrieben Methoden und Optionen, die `Orchestrator` nicht hat. Verwende die echten Namen:

| Alte Seite | Echte API |
| --- | --- |
| `createOrchestrator({ container })` | `container` gehört zu jeder App in `register()` |
| `register(name, options)` | `register({ name, entry, container, ... })` |
| `mount(name, props)` | `updateAppProps(name, props)`, dann `mountApp(name)` |
| `unmount(name)` | `unmountApp(name)` |
| `update(name, props)` | `updateAppProps(name, props)` |
| `stop()` | `destroy()` |
| `onBeforeMount`, `onAfterMount` | `onStatusChange(name, status)` oder `OrchestratorEvent.APP_MOUNT` |
| `sandbox: { js: true }` | `JsSandbox` aus `@tuvix.js/sandbox` |

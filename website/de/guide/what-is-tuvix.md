# Was ist Tuvix.js?

Tuvix.js ist ein Microfrontend-Toolkit für den Browser. Eine Host-Seite (die Shell) registriert Micro Apps, und Tuvix.js lädt den Code jeder App, mountet sie in einen Container, übergibt ihr Props und unmountet sie, sobald die URL oder dein Code es verlangt. Jede Micro App kann React, Vue, Svelte, Angular oder kein Framework verwenden, und jedes Team kann seine App nach eigenem Zeitplan bauen und deployen.

## Was es tut

- **Orchestriert Micro Apps.** `createOrchestrator()` führt ein Register der Apps. Für jede App entscheidet es anhand des aktuellen Pfads, ob sie gemountet sein soll, und es führt immer nur einen Reconcile gleichzeitig aus, sodass sich zwei Apps mit demselben Container nie überschneiden.
- **Lädt Code bei Bedarf.** Der `entry` einer App kann eine Skript-URL sein, eine Liste von Skripten und Stylesheets oder eine Funktion wie `() => import('./dashboard')`. Der Loader wiederholt fehlgeschlagene Ladevorgänge und bricht langsame ab.
- **Routet anhand der URL.** `activeWhen: '/dashboard/*'` mountet eine App auf `/dashboard` und jedem Pfad darunter. Du kannst den eingebauten Router verwenden oder mit `connectRouter()` TanStack Router oder React Router folgen.
- **Bindet Frameworks an.** `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp` und `createAngularMicroApp` machen aus einer Root-Komponente ein Modul mit `mount`, `update` und `unmount`.
- **Hostet Islands in einer React-Seite.** `TuvixIsland` mountet eine Vue-, Svelte-, Angular- oder React-Micro-App innerhalb eines serverseitig gerenderten React-Baums und hydriert das Server-HTML, ohne es doppelt zu senden. Siehe [SSR-Islands](/de/guide/ssr-islands).
- **Meldet den Lifecycle.** Adapter und `defineMicroApp` lösen die DOM-Events `tuvix:mounted`, `tuvix:unmounted` und `tuvix:error` aus, und `whenMounted(name)` wird aufgelöst, sobald eine App auf der Seite ist. Siehe [Lifecycle-Events](/de/guide/lifecycle-events).
- **Verbindet Apps.** Alle Apps auf einer Seite teilen sich über `getGlobalBus()` einen Event Bus, auch wenn jede App ihre eigene Kopie von `@tuvix.js/event-bus` bündelt.
- **Isoliert CSS auf Wunsch.** `sandbox: true` rendert eine App in einem Shadow Root, sodass das CSS der Seite und das CSS der App getrennt bleiben.

## Wann du es verwendest

Greif zu Tuvix.js, wenn mehrere Teams Teile einer Seite ausliefern und sie getrennt deployen müssen, oder wenn du eine Legacy-App neben einer Neuentwicklung in einem anderen Framework weiterlaufen lassen willst. Es passt auch für ein einzelnes Team, das Vue- oder Svelte-Widgets in einer React-Site mit Server-Rendering einsetzen will.

## Wann du es nicht verwendest

- Ein Team, ein Framework, ein Deploy: Eine normale Single-Page-App ist einfacher.
- Du brauchst harte Sicherheitsisolation zwischen Apps. Tuvix.js führt jede App im selben JavaScript-Realm aus. `JsSandbox` aus `@tuvix.js/sandbox` verbirgt globale Schreibzugriffe, die über seinen Proxy laufen, hindert eine App aber nicht daran, auf `window` zuzugreifen. Verwende für nicht vertrauenswürdigen Code ein `<iframe>`.
- Du willst ein einziges Bundle mit gemeinsamem State über alle Apps. Micro Apps kommunizieren bewusst über Events und Props.

## Pakete

| Paket | Wofür du es verwendest |
| --- | --- |
| `tuvix.js` | Eine Installation mit Core, Router, Event Bus, Loader und Sandbox |
| `@tuvix.js/core` | `createOrchestrator`, `defineMicroApp` |
| `@tuvix.js/router` | `createRouter`, `matchPath`, `interceptLinks` |
| `@tuvix.js/loader` | Laden von Entries und die Lifecycle-Runtime (`whenMounted`, `onLifecycle`) |
| `@tuvix.js/event-bus` | `createEventBus`, `getGlobalBus` |
| `@tuvix.js/sandbox` | `CssSandbox`, `JsSandbox` |
| `@tuvix.js/react`, `vue`, `svelte`, `angular` | Framework-Adapter, `TuvixIsland` (React) |
| `@tuvix.js/vite` | Island-Stylesheet-Links für den serverseitig gerenderten `<head>` |
| `@tuvix.js/server` | Serverseitige Komposition von HTML-Fragmenten |
| `@tuvix.js/module-federation` | Entries, die aus webpack-Module-Federation-Remotes laden |
| `@tuvix.js/devtools` | Debug-Panel in der Seite |
| `create-tuvix-app` | Projekt-Scaffolding |

## Schlüsselkonzepte

| Begriff | Bedeutung |
| --- | --- |
| Shell | Die Host-Seite, die den Orchestrator erstellt und das Layout verantwortet |
| Micro App | Ein Modul mit `mount` und `unmount` (und optional `bootstrap`, `update`) |
| Entry | Woher der Loader eine Micro App bezieht: URL, `{ scripts, styles }` oder eine Loader-Funktion |
| Container | Das Element, in das eine Micro App rendert |
| Island | Eine Micro App, die der Host serverseitig rendert und der Client an Ort und Stelle hydriert |
| Event Bus | Ein Pub/Sub-Kanal, den sich alle Apps auf der Seite teilen |

## Nächste Schritte

- [Erste Schritte](/de/guide/getting-started) baut eine Shell und zwei Micro Apps.
- [Architektur](/de/guide/architecture) zeigt, wie aus einer Navigation ein Mount wird.
- Du kommst von 0.4? Lies [Migration auf 0.5](/de/guide/migration-0-5).

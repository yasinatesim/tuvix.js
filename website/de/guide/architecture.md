# Architektur

Tuvix.js besteht aus kleinen Paketen. Der Orchestrator in `@tuvix.js/core` verbindet sie; jedes andere Paket funktioniert auch für sich allein.

## Pakete und ihre Aufgaben

```text
@tuvix.js/core          createOrchestrator, defineMicroApp: registry, reconcile, props
@tuvix.js/router        createRouter, matchPath, interceptLinks
@tuvix.js/loader        ModuleLoader, registerModule, lifecycle runtime
@tuvix.js/event-bus     createEventBus, getGlobalBus
@tuvix.js/sandbox       CssSandbox (shadow DOM), JsSandbox (proxy window)
@tuvix.js/react         createReactMicroApp, TuvixReactApp, TuvixIsland
@tuvix.js/vue           createVueMicroApp, renderVueToString (/server)
@tuvix.js/svelte        createSvelteMicroApp, renderSvelteToString (/server)
@tuvix.js/angular       createAngularMicroApp, renderAngularToString (/server)
@tuvix.js/vite          Vite plugin: island CSS links for the server-rendered <head>
@tuvix.js/server        Server-side composition of HTML fragments
@tuvix.js/module-federation  Entries backed by webpack remotes
@tuvix.js/devtools      In-page debug panel
tuvix.js                Umbrella: core, router, loader, event bus, sandbox
create-tuvix-app        Project scaffolding
```

## Von der Navigation zum Mount

```text
URL changes (router.push, popstate, connectRouter callback, or reconcile(path))
  │
  ▼
orchestrator queues a reconcile for the path
  │  (only the newest queued path runs next)
  ▼
for each app: should it be mounted?  activeWhen string → matchPath
  │                                   activeWhen function → your code
  │                                   no activeWhen → router routes naming it
  ▼
phase 1: unmount every app that turned inactive
phase 2: mount every app that turned active
  │
  ▼
loader.load(name, entry)   function entry → await it
  │                        URL entry → <script>/<link> tags, then registry lookup
  ▼
module.bootstrap()  (first load only)
module.mount({ container, props, name, bus })
```

Phase 1 ist abgeschlossen, bevor Phase 2 beginnt. Zwei Apps, die sich `#app` teilen, sitzen also nie gleichzeitig darin. Kommt ein neuer Pfad, während ein Reconcile läuft, beendet der Orchestrator den aktuellen Schritt und gleicht dann den neuesten Pfad ab. Navigierst du schnell hintereinander A → B → A, bleibt nur A gemountet.

## Der Modulvertrag

Jede Micro App, ob von Hand geschrieben oder von einem Adapter erzeugt, hat diese Form (`MicroAppModule` aus `@tuvix.js/loader`):

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  async bootstrap() {
    // once, before the first mount
  },
  async mount({ container, props, name, bus }) {
    container.textContent = `${name ?? ''}: ${JSON.stringify(props ?? {})}`;
    bus?.emit('app:ready', { name });
  },
  async update({ props, container }) {
    if (container) container.textContent = JSON.stringify(props);
  },
  async unmount({ container }) {
    container.replaceChildren();
  },
};
```

- `bootstrap` läuft einmal pro geladenem Modul.
- `mount` erhält den Container, die aktuellen Props, den App-Namen und den Event Bus des Orchestrators.
- `update` erhält die zusammengeführten Props, wenn die Shell `updateAppProps` aufruft. `container` sagt einem Modul, das an mehreren Stellen gemountet ist, welchen Mount es aktualisieren soll.
- `unmount` muss alles entfernen, was `mount` erzeugt hat.

## Wie der Loader ein Modul findet

1. **Entry als Loader-Funktion** (`() => import('./app')`): Der Loader verwendet das aufgelöste Modul, sonst dessen `default`-Export, sonst das unter dem App-Namen registrierte Modul.
2. **URL-Entry**: Der Loader hängt `<script>`- und `<link>`-Tags an, wartet auf sie und liest das Modul aus dem Register, das `registerModule(name, module)` befüllt. Adapter und `defineMicroApp` rufen `registerModule` für dich auf.
3. **UMD-Fallback**: Hat sich nichts registriert, wählt der Loader ein neues globales Objekt auf `window`, das eine `mount`-Funktion hat. Sind mehrere aufgetaucht, wählt er das, dessen Name dem App-Namen entspricht, und schlägt sonst fehl.

Register und Lifecycle-Zustand liegen auf `window.__TUVIX_RUNTIME__`. So sehen auch getrennt gebündelte Micro Apps, jede mit ihrer eigenen Kopie von `@tuvix.js/loader`, ein gemeinsames Register.

Skripte laden als `type="module"`, wenn der Entry `type: 'module'` setzt oder die URL auf `.mjs`, `.mts`, `.ts`, `.tsx` oder `.jsx` endet. Andere URLs laden als klassische Skripte.

## Gemeinsamer Laufzeitzustand

| Zustand | Wo er liegt | Warum |
| --- | --- | --- |
| Modul-Register | `window.__TUVIX_RUNTIME__` (auch `window.__TUVIX_MODULES__`) | Der Loader findet Apps aus jedem Bundle |
| Gemountete Apps und Wartende | `window.__TUVIX_RUNTIME__` | `whenMounted` funktioniert über Bundles hinweg |
| Globaler Event Bus | `window.__TUVIX_GLOBAL_BUS__` | `getGlobalBus()` liefert einen Bus pro Seite |

Auf dem Server, ohne `window`, ist jeder dieser Zustände modulweit gültig.

## Isolationsmodell

- **CSS**: `sandbox: true` bei `register` rendert die App in einem Shadow Root und lädt dort die `styles` ihres Entry. Siehe [Sandboxing](/de/guide/sandbox).
- **JavaScript**: standardmäßig keine. Alle Apps teilen sich `window`, `document` und globale Variablen. `JsSandbox` isoliert nur Code, den du über seinen Proxy ausführst.

## Wie es weitergeht

- [Lifecycle Hooks](/de/guide/lifecycle): der Vertrag im Detail.
- [Lifecycle-Events](/de/guide/lifecycle-events): herausfinden, wann eine App auf der Seite ist.
- [Routing](/de/guide/routing): Regeln für Muster.

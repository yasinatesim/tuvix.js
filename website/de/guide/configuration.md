# Konfiguration

Die gesamte Konfiguration passiert im Code. Tuvix.js liest keine Umgebungsvariablen und keine Konfigurationsdateien.

## Orchestrator-Optionen

```ts
import { createOrchestrator } from 'tuvix.js';

declare function reportError(error: Error, app: string): void;

const orchestrator = createOrchestrator({
  // Built-in router. Omit it when you follow an external router with connectRouter().
  router: {
    mode: 'history', // or 'hash'
    base: '/',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },

  // Passing eventBus options gives this orchestrator a private bus.
  // Omit it to share getGlobalBus() with every app on the page.
  eventBus: { maxListeners: 50, debug: false },

  // Forwarded to the module loader.
  loader: { timeout: 10000, retries: 2, retryDelay: 1000, globals: {} },

  // 'immediate' | 'idle' | 'hover' | 'none' (default)
  prefetch: { strategy: 'hover' },

  onError: (error, appName) => reportError(error, appName),
  onStatusChange: (appName, status) => console.debug(appName, status),
});
```

| Option | Standard | Wirkung |
| --- | --- | --- |
| `router` | keiner | Erstellt den eingebauten Router. Siehe [Routing](/de/guide/routing). |
| `eventBus` | keiner (globaler Bus) | Privater Bus mit diesen Optionen. `destroy()` zerstört einen privaten Bus und lässt den globalen bestehen. |
| `loader.timeout` | `10000` | Millisekunden, nach denen ein Ladeversuch abbricht. Begrenzt auch die Wartezeit auf Stylesheets in der Sandbox. |
| `loader.retries` | `2` | Zusätzliche Versuche nach dem ersten Fehlschlag. |
| `loader.retryDelay` | `1000` | Millisekunden zwischen den Versuchen. |
| `loader.globals` | `{}` | Eigenschaften, die auf `window` geschrieben werden, bevor die Skripte eines Entry laufen. |
| `prefetch.strategy` | `'none'` | Wann Entries vor ihrem Mount geladen werden. Siehe die Tabelle unten. |
| `onError` | keiner | Wird mit `(error, appName)` aufgerufen, wenn Laden, Bootstrap, Mount, Update oder Unmount fehlschlägt. |
| `onStatusChange` | keiner | Wird bei jeder Statusänderung mit `(appName, status)` aufgerufen. |

Um Abhängigkeiten wie React zwischen Apps zu teilen, verwende `@tuvix.js/module-federation` oder Import Maps. Der Orchestrator hat dafür keine Option.

### Prefetch-Strategien

| Strategie | Wann Entries geladen werden |
| --- | --- |
| `none` | Erst, wenn eine App mountet. |
| `immediate` | Jeder registrierte Entry, direkt nach `start()`. |
| `idle` | Jeder registrierte Entry, im ersten `requestIdleCallback` nach `start()` (200 ms Timeout, wo die API fehlt). |
| `hover` | Wenn der Zeiger auf einen Same-Origin-Link kommt oder der Fokus darauf landet, dessen Pfad eine App aktivieren würde. Jede App wird einmal geladen. |

Prefetching fügt `<link rel="modulepreload">` für Modul-Skripte und `<link rel="prefetch">` für klassische Skripte und Styles hinzu. Entries mit Loader-Funktion überspringt es, weil ein Aufruf der Funktion das Modul ausführen würde.

## Eine Micro App registrieren

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main',
  activeWhen: '/dashboard/*',
  props: { theme: 'dark' },
  fallback: '<p>Dashboard is unavailable.</p>',
  sandbox: false,
  mountWhenVisible: false,
});
```

| Feld | Typ | Wirkung |
| --- | --- | --- |
| `name` | `string` | Eindeutig. Muss dem Namen entsprechen, unter dem sich das Modul registriert. |
| `entry` | `string \| EntryConfig \| EntryLoader` | Woher der Code kommt. Siehe unten. |
| `container` | `string \| HTMLElement` | Selektor oder Element. Wird beim Mount aufgelöst, das Element muss also erst dann existieren. |
| `activeWhen` | `string \| (path) => boolean` | Routenmuster oder Prädikat. Ohne es folgt die App den `routes` des Routers, die sie nennen, oder du mountest sie selbst. |
| `props` | `Record<string, unknown>` | Anfängliche Props. `updateAppProps` führt neue Props mit ihnen zusammen. |
| `fallback` | `string` | HTML, das in den Container geschrieben wird, wenn Laden, Bootstrap oder Mount fehlschlägt. |
| `sandbox` | `boolean \| { css?: boolean }` | `true` rendert die App in einem Shadow Root. Siehe [Sandboxing](/de/guide/sandbox). |
| `mountWhenVisible` | `boolean` | Mountet, sobald der Container zu 10 % sichtbar ist. Routenwechsel lassen die App dann in Ruhe. |

### Entry-Formen

```ts
import type { Entry } from 'tuvix.js';

// One classic script (UMD or IIFE bundle).
const classic: Entry = 'https://cdn.example.com/legacy/app.js';

// Scripts and styles. `type: 'module'` for ES module bundles such as Vite's `.js` output.
const esm: Entry = {
  scripts: ['https://cdn.example.com/cart/main.js'],
  styles: ['https://cdn.example.com/cart/main.css'],
  type: 'module',
  integrity: { 'https://cdn.example.com/cart/main.js': 'sha384-...' },
};

// A loader function. Your bundler code-splits it; the loader passes an AbortSignal.
const lazy: Entry = () => import('./apps/profile');
```

Ohne `type` laden URLs, die auf `.mjs`, `.mts`, `.ts`, `.tsx` oder `.jsx` enden, als Module, alles andere als klassisches Skript. Ein Browser führt ein Modul-Skript pro URL nur einmal aus. Eine App mit `type: 'module'`, die du entlädst, kann also nicht erneut von derselben URL laden. Verwende eine Loader-Funktion, wenn du entladen und neu laden musst.

### Wissenswertes zur Registrierung

- `register` wirft bei einem doppelten Namen, einem fehlenden `entry` oder einem fehlenden `container`.
- `register` nach `start()` wirkt sofort: Eine routengesteuerte App mountet, wenn der aktuelle Pfad sie aktiviert, und eine App mit `mountWhenVisible` wird beobachtet. Vor `start()` speichert `register` nur die Konfiguration.
- Eine Viewport-App bleibt gemountet, nachdem sie aus dem Sichtbereich gescrollt ist. Unmounte sie mit `unmountApp(name)`.
- Eine App ohne `activeWhen` und ohne Router-Route bleibt so, wie du sie hinterlässt. Ruf `mountApp(name)` und `unmountApp(name)` selbst auf.
- `fallback` ist rohes HTML. Baue es nicht aus Benutzereingaben.

## Router-Optionen

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // 'hash' reads the path from location.hash
  base: '/app', // stripped before matching, added by push() and replace()
  routes: [
    { path: '/users/:id', app: 'users', meta: { title: 'User' } },
    { path: '/settings/*', app: 'settings' },
  ],
});

router.beforeEach(async ({ to }) => !to.startsWith('/admin'));
```

Routenpfade passen auf den gesamten Pfad: `/settings` passt nur auf `/settings` und `/settings/`, und `'/'` passt nur auf `/`. Beende einen Pfad mit `/*`, damit er auf Unterpfade passt; `'/*'` passt auf jeden Pfad.

## Sandbox-Optionen

```ts
import { createSandbox } from 'tuvix.js';

const sandbox = createSandbox({
  css: true, // shadow root on activate()
  js: true, // proxy window for execScript()
  allowedGlobals: ['gtag'], // extra globals strict mode lets you write
  strict: false, // true: writing any other global throws a TypeError
});
```

Der Orchestrator wendet CSS-Isolation für Apps an, die mit `sandbox: true` registriert sind. `JsSandbox` wendet er nie an. Siehe [Sandboxing](/de/guide/sandbox).

## Event-Bus-Optionen

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus({
  maxListeners: 0, // 0 = unlimited; past the limit, `on` still adds the listener and warns once per event
  debug: false, // log every emit and subscription
  logger: console.log,
});
```

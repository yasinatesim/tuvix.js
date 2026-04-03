# Architektur

## Überblick

Tuvix.js ist als Monorepo aus kleinen, kombinierbaren Paketen strukturiert. Sie importieren nur, was Sie verwenden.

```
@tuvix.js/core          ← Orchestrator, Lifecycle, Registrierung
@tuvix.js/router        ← URL-basiertes Routing
@tuvix.js/event-bus     ← Inter-App Pub/Sub
@tuvix.js/loader        ← Dynamisches Bundle-Laden
@tuvix.js/sandbox       ← CSS + JS Isolation
@tuvix.js/react         ← React-Bindings
@tuvix.js/vue           ← Vue-Bindings
@tuvix.js/svelte        ← Svelte-Bindings
@tuvix.js/angular       ← Angular-Bindings
@tuvix.js/devtools      ← Debug-Panel
@tuvix.js/server        ← SSR-Komposition
@tuvix.js/module-federation  ← Webpack 5 Integration
create-tuvix-app        ← CLI-Scaffolding
tuvix.js                ← Sammelpaket (alles in einem)
```

## Ablauf einer Anfrage

```
URL-Änderung
    │
    ▼
@tuvix.js/router         ← Ordnet Pfad dem Micro-App-Namen zu
    │
    ▼
@tuvix.js/core           ← Orchestrator entscheidet über Mount/Unmount
    │
    ▼
@tuvix.js/loader         ← Lädt und führt das Micro-App-Bundle aus
    │
    ▼
@tuvix.js/sandbox        ← Umhüllt die App in einem isolierten Bereich (optional)
    │
    ▼
Micro App .mount()       ← App rendert in ihr Container-Element
```

## Lifecycle

Jede Micro App muss das `MicroApp`-Interface implementieren:

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

Der Orchestrator ruft diese Hooks zum richtigen Zeitpunkt auf:

1. **`mount`** - wird aufgerufen, wenn die Route der App aktiv wird
2. **`unmount`** - wird aufgerufen, wenn von der Route der App weg navigiert wird
3. **`update`** - wird aufgerufen, wenn sich Props ohne vollständiges Remount ändern

## Isolationsmodell

### CSS-Isolation (Shadow DOM)

Wenn `sandbox.css = true`, wird der Container der Micro App zu einem Shadow-DOM-Host. Styles innerhalb können nicht nach außen durchsickern, und globale Styles können nicht hinein.

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### JS-Isolation (Proxy Scope)

Wenn `sandbox.js = true`, wird der globale Scope der Micro App in einen `Proxy` eingehüllt. Zugriff auf `window.localStorage`, `window.addEventListener` usw. wird abgefangen und beim Unmount bereinigt.

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true, js: true },
});
```

## Event Bus

Der Event Bus ist ein entkoppelter Pub/Sub-Kanal, der von allen Micro Apps geteilt wird:

```ts
// Publisher (beliebige Micro App)
import { eventBus } from '@tuvix.js/event-bus';
eventBus.emit('user:login', { userId: '42' });

// Subscriber (eine andere Micro App)
eventBus.on('user:login', ({ userId }) => {
  console.log('User logged in:', userId);
});
```

Events sind typisiert - TypeScript erzwingt die Form des Event-Payloads.

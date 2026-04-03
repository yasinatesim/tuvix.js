# Architettura

## Panoramica

Tuvix.js è strutturato come un monorepo di pacchetti piccoli e componibili. Importi solo ciò che usi.

```
@tuvix.js/core          ← Orchestrator, lifecycle, registrazione
@tuvix.js/router        ← Routing basato su URL
@tuvix.js/event-bus     ← Pub/sub tra applicazioni
@tuvix.js/loader        ← Caricamento dinamico di bundle
@tuvix.js/sandbox       ← Isolamento CSS + JS
@tuvix.js/react         ← Binding React
@tuvix.js/vue           ← Binding Vue
@tuvix.js/svelte        ← Binding Svelte
@tuvix.js/angular       ← Binding Angular
@tuvix.js/devtools      ← Pannello di debug
@tuvix.js/server        ← Composizione SSR
@tuvix.js/module-federation  ← Integrazione Webpack 5
create-tuvix-app        ← Scaffolding CLI
tuvix.js                ← Pacchetto ombrello (tutto in uno)
```

## Flusso della Richiesta

```
Cambio URL
    │
    ▼
@tuvix.js/router         ← Associa il percorso al nome della micro app
    │
    ▼
@tuvix.js/core           ← L'Orchestrator decide di montare/smontare
    │
    ▼
@tuvix.js/loader         ← Recupera ed esegue il bundle della micro app
    │
    ▼
@tuvix.js/sandbox        ← Avvolge l'app in uno scope isolato (opzionale)
    │
    ▼
Micro App .mount()       ← L'app fa il rendering nel suo elemento contenitore
```

## Ciclo di Vita

Ogni micro app deve implementare l'interfaccia `MicroApp`:

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

L'orchestrator chiama questi hook al momento giusto:

1. **`mount`** - chiamato quando la route dell'app diventa attiva
2. **`unmount`** - chiamato quando si naviga via dalla route dell'app
3. **`update`** - chiamato quando le props cambiano senza un rimontaggio completo

## Modello di Isolamento

### Isolamento CSS (Shadow DOM)

Quando `sandbox.css = true`, il contenitore della micro app diventa un host Shadow DOM. Gli stili definiti all'interno non possono fuoriuscire, e gli stili globali non possono entrare.

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### Isolamento JS (Proxy Scope)

Quando `sandbox.js = true`, lo scope globale della micro app viene avvolto in un `Proxy`. L'accesso a `window.localStorage`, `window.addEventListener`, ecc. viene intercettato e ripulito allo smontaggio.

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true, js: true },
});
```

## Event Bus

L'event bus è un canale pub/sub disaccoppiato condiviso tra tutte le micro app:

```ts
// Editore (qualsiasi micro app)
import { eventBus } from '@tuvix.js/event-bus';
eventBus.emit('user:login', { userId: '42' });

// Sottoscrittore (un'altra micro app)
eventBus.on('user:login', ({ userId }) => {
  console.log('User logged in:', userId);
});
```

Gli eventi sono tipizzati - TypeScript applica la forma del payload dell'evento.

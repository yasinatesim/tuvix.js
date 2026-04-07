# Sandboxing

`@tuvix.js/sandbox` fornisce isolamento CSS e JavaScript per impedire alle micro app di interferire tra loro o con la shell.

## Isolamento CSS (Shadow DOM)

Quando il sandboxing CSS è abilitato, il contenitore della micro app viene promosso a host Shadow DOM. Gli stili definiti all'interno sono limitati a quella shadow root - non possono fuoriuscire verso la shell o altre micro app.

### Abilitare per app

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### Come funziona

```
Shell DOM
├── #app (contenitore orchestrator)
│   ├── Shadow Root (my-app)  ← stili limitati qui
│   │   ├── <style>.button { color: red }</style>
│   │   └── <div class="button">Click me</div>
│   └── Shadow Root (other-app)
│       └── <div class="button">Not affected!</div>
```

::: tip
L'isolamento CSS Shadow DOM è completamente supportato in tutti i browser moderni. Per il supporto dei browser legacy, considera solo la modalità di isolamento `js`.
:::

## Isolamento JS (Proxy Scope)

Quando il sandboxing JS è abilitato, lo scope globale della micro app viene avvolto in un `Proxy`. L'accesso a `window.*`, event listener, intervalli e timeout viene intercettato e ripulito automaticamente all'`unmount`.

### Abilitare per app

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { js: true },
});
```

### Cosa viene intercettato

| Accesso | Intercettato? | Pulito allo smontaggio? |
|---------|-------------|------------------------|
| `window.someGlobal = x` | ✅ | ✅ |
| `addEventListener(...)` | ✅ | ✅ |
| `setTimeout(...)` | ✅ | ✅ |
| `setInterval(...)` | ✅ | ✅ |
| `localStorage` | ✅ | Opzionale |
| `sessionStorage` | ✅ | Opzionale |

## Usare Entrambi Insieme

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: {
    css: true,   // Isolamento Shadow DOM
    js: true,    // Isolamento Proxy scope
  },
});
```

## Sandbox Personalizzata

Puoi anche usare `@tuvix.js/sandbox` direttamente:

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({ css: true, js: true });

// Attivare l'isolamento
const shadowRoot = sandbox.activate(rootElement);

// ... l'app viene eseguita in isolamento ...

// Disattivare quando si è finito
sandbox.deactivate(rootElement);
```

# Sandboxing

`@tuvix.js/sandbox` bietet CSS- und JavaScript-Isolation, um zu verhindern, dass Micro Apps sich gegenseitig oder die Shell beeinflussen.

## CSS-Isolation (Shadow DOM)

Wenn CSS-Sandboxing aktiviert ist, wird der Container der Micro App zu einem Shadow-DOM-Host. Styles innerhalb sind auf diese Shadow Root beschränkt - sie können nicht zum Shell oder anderen Micro Apps durchsickern.

### Pro App aktivieren

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### Wie es funktioniert

```
Shell DOM
├── #app (Orchestrator-Container)
│   ├── Shadow Root (my-app)  ← Styles hier begrenzt
│   │   ├── <style>.button { color: red }</style>
│   │   └── <div class="button">Click me</div>
│   └── Shadow Root (other-app)
│       └── <div class="button">Not affected!</div>
```

::: tip
Shadow DOM CSS-Isolation wird von allen modernen Browsern vollständig unterstützt. Für Legacy-Browser-Unterstützung erwägen Sie nur den `js` Isolationsmodus.
:::

## JS-Isolation (Proxy Scope)

Wenn JS-Sandboxing aktiviert ist, wird der globale Scope der Micro App in einen `Proxy` eingehüllt. Zugriff auf `window.*`, Event Listener, Intervalle und Timeouts werden abgefangen und automatisch beim `unmount` bereinigt.

### Pro App aktivieren

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { js: true },
});
```

### Was wird abgefangen

| Zugriff | Abgefangen? | Beim Unmount bereinigt? |
|---------|------------|------------------------|
| `window.someGlobal = x` | ✅ | ✅ |
| `addEventListener(...)` | ✅ | ✅ |
| `setTimeout(...)` | ✅ | ✅ |
| `setInterval(...)` | ✅ | ✅ |
| `localStorage` | ✅ | Optional |
| `sessionStorage` | ✅ | Optional |

## Beide zusammen verwenden

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: {
    css: true,   // Shadow DOM Isolation
    js: true,    // Proxy Scope Isolation
  },
});
```

## Benutzerdefinierte Sandbox

Sie können `@tuvix.js/sandbox` auch direkt verwenden:

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({ css: true, js: true });

// Einen isolierten Container für ein Element erstellen
const { container, cleanup } = sandbox.mount(rootElement);

// Später abbauen
cleanup();
```

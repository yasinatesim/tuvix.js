# Sandboxing

`@tuvix.js/sandbox` fournit l'isolation CSS et JavaScript pour empêcher les micro apps d'interférer entre elles ou avec le shell.

## Isolation CSS (Shadow DOM)

Quand le sandboxing CSS est activé, le conteneur de la micro app est promu en hôte Shadow DOM. Les styles définis à l'intérieur sont limités à cette shadow root - ils ne peuvent pas fuir vers le shell ou d'autres micro apps.

### Activer par app

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### Comment ça fonctionne

```
Shell DOM
├── #app (conteneur orchestrator)
│   ├── Shadow Root (my-app)  ← styles limités ici
│   │   ├── <style>.button { color: red }</style>
│   │   └── <div class="button">Click me</div>
│   └── Shadow Root (other-app)
│       └── <div class="button">Not affected!</div>
```

::: tip
L'isolation CSS par Shadow DOM est entièrement supportée par tous les navigateurs modernes. Pour le support des navigateurs anciens, envisagez uniquement le mode d'isolation `js`.
:::

## Isolation JS (Proxy Scope)

Quand le sandboxing JS est activé, le scope global de la micro app est enveloppé dans un `Proxy`. L'accès à `window.*`, les écouteurs d'événements, les intervalles et les timeouts sont interceptés et nettoyés automatiquement au `unmount`.

### Activer par app

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { js: true },
});
```

### Ce qui est intercepté

| Accès | Intercepté ? | Nettoyé au démontage ? |
|-------|-------------|------------------------|
| `window.someGlobal = x` | ✅ | ✅ |
| `addEventListener(...)` | ✅ | ✅ |
| `setTimeout(...)` | ✅ | ✅ |
| `setInterval(...)` | ✅ | ✅ |
| `localStorage` | ✅ | Optionnel |
| `sessionStorage` | ✅ | Optionnel |

## Utiliser les Deux Ensemble

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: {
    css: true,   // Isolation Shadow DOM
    js: true,    // Isolation Proxy scope
  },
});
```

## Sandbox Personnalisé

Vous pouvez aussi utiliser `@tuvix.js/sandbox` directement :

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({ css: true, js: true });

// Créer un conteneur isolé pour un élément
const { container, cleanup } = sandbox.mount(rootElement);

// Plus tard, le démonter
cleanup();
```

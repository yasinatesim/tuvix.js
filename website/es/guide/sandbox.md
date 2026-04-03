# Sandboxing

`@tuvix.js/sandbox` proporciona aislamiento CSS y JavaScript para evitar que las micro apps interfieran entre sí o con el shell.

## Aislamiento CSS (Shadow DOM)

Cuando el sandboxing CSS está habilitado, el contenedor de la micro app se convierte en un host de Shadow DOM. Los estilos definidos dentro están limitados a ese shadow root - no pueden filtrarse hacia el shell u otras micro apps.

### Habilitar por app

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### Cómo funciona

```
Shell DOM
├── #app (contenedor del orchestrator)
│   ├── Shadow Root (my-app)  ← estilos limitados aquí
│   │   ├── <style>.button { color: red }</style>
│   │   └── <div class="button">Click me</div>
│   └── Shadow Root (other-app)
│       └── <div class="button">Not affected!</div>
```

::: tip
El aislamiento CSS con Shadow DOM es totalmente compatible con todos los navegadores modernos. Para soporte de navegadores legacy, considera solo el modo de aislamiento `js`.
:::

## Aislamiento JS (Proxy Scope)

Cuando el sandboxing JS está habilitado, el ámbito global de la micro app se envuelve en un `Proxy`. El acceso a `window.*`, event listeners, intervalos y timeouts se intercepta y limpia automáticamente en `unmount`.

### Habilitar por app

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { js: true },
});
```

### Qué se intercepta

| Acceso | ¿Interceptado? | ¿Limpiado al desmontar? |
|--------|----------------|------------------------|
| `window.someGlobal = x` | ✅ | ✅ |
| `addEventListener(...)` | ✅ | ✅ |
| `setTimeout(...)` | ✅ | ✅ |
| `setInterval(...)` | ✅ | ✅ |
| `localStorage` | ✅ | Opcional |
| `sessionStorage` | ✅ | Opcional |

## Usando Ambos Juntos

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: {
    css: true,   // Aislamiento Shadow DOM
    js: true,    // Aislamiento Proxy scope
  },
});
```

## Sandbox Personalizado

También puedes usar `@tuvix.js/sandbox` directamente:

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({ css: true, js: true });

// Crear un contenedor aislado para un elemento
const { container, cleanup } = sandbox.mount(rootElement);

// Más tarde, desmontarlo
cleanup();
```

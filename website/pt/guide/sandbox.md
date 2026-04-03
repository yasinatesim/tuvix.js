# Sandboxing

`@tuvix.js/sandbox` fornece isolamento CSS e JavaScript para evitar que micro apps interfiram entre si ou com o shell.

## Isolamento CSS (Shadow DOM)

Quando o sandboxing CSS está habilitado, o contêiner da micro app é promovido a host Shadow DOM. Estilos definidos dentro ficam limitados àquela shadow root - não podem vazar para o shell ou outras micro apps.

### Habilitar por app

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### Como funciona

```
Shell DOM
├── #app (contêiner do orchestrator)
│   ├── Shadow Root (my-app)  ← estilos limitados aqui
│   │   ├── <style>.button { color: red }</style>
│   │   └── <div class="button">Click me</div>
│   └── Shadow Root (other-app)
│       └── <div class="button">Not affected!</div>
```

::: tip
O isolamento CSS com Shadow DOM é totalmente suportado em todos os navegadores modernos. Para suporte a navegadores legados, considere apenas o modo de isolamento `js`.
:::

## Isolamento JS (Proxy Scope)

Quando o sandboxing JS está habilitado, o escopo global da micro app é envolvido em um `Proxy`. Acesso a `window.*`, event listeners, intervalos e timeouts são interceptados e limpos automaticamente no `unmount`.

### Habilitar por app

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { js: true },
});
```

### O que é interceptado

| Acesso | Interceptado? | Limpo na desmontagem? |
|--------|-------------|----------------------|
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
    css: true,   // Isolamento Shadow DOM
    js: true,    // Isolamento Proxy scope
  },
});
```

## Sandbox Personalizado

Você também pode usar `@tuvix.js/sandbox` diretamente:

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({ css: true, js: true });

// Criar um contêiner isolado para um elemento
const { container, cleanup } = sandbox.mount(rootElement);

// Depois, desmontar
cleanup();
```

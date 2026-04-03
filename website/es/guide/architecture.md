# Arquitectura

## Descripción General

Tuvix.js está estructurado como un monorepo de paquetes pequeños y componibles. Solo importas lo que usas.

```
@tuvix.js/core          ← Orchestrator, lifecycle, registro
@tuvix.js/router        ← Enrutamiento basado en URL
@tuvix.js/event-bus     ← Pub/sub entre aplicaciones
@tuvix.js/loader        ← Carga dinámica de bundles
@tuvix.js/sandbox       ← Aislamiento CSS + JS
@tuvix.js/react         ← Bindings de React
@tuvix.js/vue           ← Bindings de Vue
@tuvix.js/svelte        ← Bindings de Svelte
@tuvix.js/angular       ← Bindings de Angular
@tuvix.js/devtools      ← Panel de depuración
@tuvix.js/server        ← Composición SSR
@tuvix.js/module-federation  ← Integración con Webpack 5
create-tuvix-app        ← CLI para scaffolding
tuvix.js                ← Paquete paraguas (todo en uno)
```

## Flujo de Solicitud

```
Cambio de URL
    │
    ▼
@tuvix.js/router         ← Asocia la ruta al nombre de la micro app
    │
    ▼
@tuvix.js/core           ← El Orchestrator decide montar/desmontar
    │
    ▼
@tuvix.js/loader         ← Obtiene y ejecuta el bundle de la micro app
    │
    ▼
@tuvix.js/sandbox        ← Envuelve la app en un ámbito aislado (opcional)
    │
    ▼
Micro App .mount()       ← La app se renderiza en su elemento contenedor
```

## Ciclo de Vida

Cada micro app debe implementar la interfaz `MicroApp`:

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

El orchestrator llama a estos hooks en el momento adecuado:

1. **`mount`** - se llama cuando la ruta de la app se activa
2. **`unmount`** - se llama al navegar fuera de la ruta de la app
3. **`update`** - se llama cuando las props cambian sin un remontaje completo

## Modelo de Aislamiento

### Aislamiento CSS (Shadow DOM)

Cuando `sandbox.css = true`, el contenedor de la micro app se convierte en un host de Shadow DOM. Los estilos definidos dentro no pueden filtrarse hacia afuera, y los estilos globales no pueden filtrarse hacia adentro.

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### Aislamiento JS (Proxy Scope)

Cuando `sandbox.js = true`, el ámbito global de la micro app se envuelve en un `Proxy`. El acceso a `window.localStorage`, `window.addEventListener`, etc. se intercepta y limpia al desmontar.

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true, js: true },
});
```

## Event Bus

El event bus es un canal pub/sub desacoplado compartido entre todas las micro apps:

```ts
// Publicador (cualquier micro app)
import { eventBus } from '@tuvix.js/event-bus';
eventBus.emit('user:login', { userId: '42' });

// Suscriptor (otra micro app)
eventBus.on('user:login', ({ userId }) => {
  console.log('User logged in:', userId);
});
```

Los eventos son tipados - TypeScript aplicará la forma del payload del evento.

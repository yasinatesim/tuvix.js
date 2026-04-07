# Hooks de Ciclo de Vida

## Descripción General

Cada micro app en Tuvix.js sigue un ciclo de vida predecible. El orchestrator llama a los hooks de ciclo de vida en los momentos apropiados.

```
register()  →  mount()  →  update()  →  unmount()
```

## mount

Se llama cuando la ruta de la micro app se activa (o cuando se activa manualmente).

```ts
async mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

**Argumentos:**

- `container` - El elemento DOM raíz donde renderizar
- `props` - Props opcionales clave-valor del shell

**Ejemplo:**

```ts
async mount(container, props) {
  // Configurar tu app
  const root = document.createElement('div');
  container.appendChild(root);

  // Renderizar tu framework en root
  this._root = createRoot(root);
  this._root.render(<App {...props} />);
}
```

## unmount

Se llama al navegar fuera de la ruta de la micro app (o cuando se desactiva manualmente).

```ts
async unmount(container: HTMLElement): Promise<void>
```

Aquí es donde debes **limpiar** - cancelar suscripciones a eventos, destruir instancias del framework, eliminar nodos DOM.

**Ejemplo:**

```ts
async unmount(container) {
  this._root?.unmount();
  container.innerHTML = '';
}
```

::: warning
Siempre limpia en `unmount`. Las fugas de memoria por no destruir instancias del framework son el error más común en aplicaciones de microfrontend.
:::

## update

Se llama cuando el shell pasa nuevos props a una micro app ya montada. **Opcional.**

```ts
async update(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

Si no está implementado, el orchestrator llamará a `unmount` → `mount` para las actualizaciones de props.

**Ejemplo:**

```ts
async update(container, props) {
  // Actualizar eficientemente sin remontaje completo
  this._root?.render(<App {...props} />);
}
```

## Hooks a Nivel de Orchestrator

El shell también puede escuchar eventos de ciclo de vida globalmente:

```ts
const orchestrator = createOrchestrator({
  container: '#app',

  onBeforeMount(app) {
    console.log(`Mounting: ${app.name}`);
  },

  onAfterMount(app) {
    console.log(`Mounted: ${app.name}`);
    analytics.track('micro_app_mounted', { app: app.name });
  },

  onError(error, app) {
    console.error(`Error in ${app.name}:`, error);
    // Mostrar UI de respaldo
    app.container.innerHTML = '<p>Failed to load. Please refresh.</p>';
  },
});
```

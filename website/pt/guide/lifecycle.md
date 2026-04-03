# Hooks de Ciclo de Vida

## Visão Geral

Toda micro app no Tuvix.js segue um ciclo de vida previsível. O orchestrator chama os hooks de ciclo de vida nos momentos apropriados.

```
register()  →  mount()  →  update()  →  unmount()
```

## mount

Chamado quando a rota da micro app se torna ativa (ou quando é ativada manualmente).

```ts
async mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

**Argumentos:**
- `container` - O elemento DOM raiz para renderizar
- `props` - Props chave-valor opcionais do shell

**Exemplo:**
```ts
async mount(container, props) {
  // Configure sua app
  const root = document.createElement('div');
  container.appendChild(root);

  // Renderize seu framework em root
  this._root = createRoot(root);
  this._root.render(<App {...props} />);
}
```

## unmount

Chamado ao navegar para longe da rota da micro app (ou quando é desativada manualmente).

```ts
async unmount(container: HTMLElement): Promise<void>
```

Aqui é onde você deve **limpar** - cancelar inscrições em eventos, destruir instâncias do framework, remover nós DOM.

**Exemplo:**
```ts
async unmount(container) {
  this._root?.unmount();
  container.innerHTML = '';
}
```

::: warning
Sempre limpe em `unmount`. Vazamentos de memória por não destruir instâncias do framework são o bug mais comum em aplicações de microfrontend.
:::

## update

Chamado quando o shell passa novas props para uma micro app já montada. **Opcional.**

```ts
async update(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

Se não implementado, o orchestrator chamará `unmount` → `mount` para atualizações de props.

**Exemplo:**
```ts
async update(container, props) {
  // Atualizar eficientemente sem remontagem completa
  this._root?.render(<App {...props} />);
}
```

## Hooks no Nível do Orchestrator

O shell também pode ouvir eventos de ciclo de vida globalmente:

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
    // Mostrar UI de fallback
    app.container.innerHTML = '<p>Failed to load. Please refresh.</p>';
  },
});
```

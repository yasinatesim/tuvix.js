# Hook del Ciclo di Vita

## Panoramica

Ogni micro app in Tuvix.js segue un ciclo di vita prevedibile. L'orchestrator chiama gli hook del ciclo di vita nei momenti appropriati.

```
register()  →  mount()  →  update()  →  unmount()
```

## mount

Chiamato quando la route della micro app diventa attiva (o quando viene attivata manualmente).

```ts
async mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

**Argomenti:**

- `container` - L'elemento DOM radice per il rendering
- `props` - Props chiave-valore opzionali dalla shell

**Esempio:**

```ts
async mount(container, props) {
  // Configura la tua app
  const root = document.createElement('div');
  container.appendChild(root);

  // Renderizza il tuo framework in root
  this._root = createRoot(root);
  this._root.render(<App {...props} />);
}
```

## unmount

Chiamato quando si naviga via dalla route della micro app (o quando viene disattivata manualmente).

```ts
async unmount(container: HTMLElement): Promise<void>
```

Qui è dove devi **pulire** - annullare le iscrizioni agli eventi, distruggere le istanze del framework, rimuovere i nodi DOM.

**Esempio:**

```ts
async unmount(container) {
  this._root?.unmount();
  container.innerHTML = '';
}
```

::: warning
Pulisci sempre in `unmount`. Le perdite di memoria causate dalla mancata distruzione delle istanze del framework sono il bug più comune nelle applicazioni microfrontend.
:::

## update

Chiamato quando la shell passa nuove props a una micro app già montata. **Opzionale.**

```ts
async update(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

Se non implementato, l'orchestrator chiamerà `unmount` → `mount` per gli aggiornamenti delle props.

**Esempio:**

```ts
async update(container, props) {
  // Aggiorna efficientemente senza rimontaggio completo
  this._root?.render(<App {...props} />);
}
```

## Hook a Livello di Orchestrator

La shell può anche ascoltare gli eventi del ciclo di vita globalmente:

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
    // Mostra UI di fallback
    app.container.innerHTML = '<p>Failed to load. Please refresh.</p>';
  },
});
```

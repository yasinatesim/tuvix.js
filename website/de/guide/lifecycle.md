# Lifecycle Hooks

## Überblick

Jede Micro App in Tuvix.js folgt einem vorhersagbaren Lifecycle. Der Orchestrator ruft Lifecycle-Hooks zu den entsprechenden Zeitpunkten auf.

```
register()  →  mount()  →  update()  →  unmount()
```

## mount

Wird aufgerufen, wenn die Route der Micro App aktiv wird (oder wenn sie manuell aktiviert wird).

```ts
async mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

**Argumente:**
- `container` - Das Root-DOM-Element zum Rendern
- `props` - Optionale Key-Value-Props von der Shell

**Beispiel:**
```ts
async mount(container, props) {
  // App einrichten
  const root = document.createElement('div');
  container.appendChild(root);

  // Framework in root rendern
  this._root = createRoot(root);
  this._root.render(<App {...props} />);
}
```

## unmount

Wird aufgerufen, wenn von der Route der Micro App weg navigiert wird (oder wenn sie manuell deaktiviert wird).

```ts
async unmount(container: HTMLElement): Promise<void>
```

Hier sollten Sie **aufräumen** - Event-Abonnements beenden, Framework-Instanzen zerstören, DOM-Knoten entfernen.

**Beispiel:**
```ts
async unmount(container) {
  this._root?.unmount();
  container.innerHTML = '';
}
```

::: warning
Räumen Sie immer in `unmount` auf. Speicherlecks durch nicht zerstörte Framework-Instanzen sind der häufigste Fehler in Microfrontend-Anwendungen.
:::

## update

Wird aufgerufen, wenn die Shell neue Props an eine bereits gemountete Micro App übergibt. **Optional.**

```ts
async update(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

Wenn nicht implementiert, ruft der Orchestrator `unmount` → `mount` für Prop-Updates auf.

**Beispiel:**
```ts
async update(container, props) {
  // Effizient aktualisieren ohne vollständiges Remount
  this._root?.render(<App {...props} />);
}
```

## Hooks auf Orchestrator-Ebene

Die Shell kann auch global auf Lifecycle-Events hören:

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
    // Fallback-UI anzeigen
    app.container.innerHTML = '<p>Failed to load. Please refresh.</p>';
  },
});
```

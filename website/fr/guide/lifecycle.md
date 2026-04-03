# Hooks de Cycle de Vie

## Vue d'ensemble

Chaque micro app dans Tuvix.js suit un cycle de vie prévisible. L'orchestrator appelle les hooks de cycle de vie aux moments appropriés.

```
register()  →  mount()  →  update()  →  unmount()
```

## mount

Appelé quand la route de la micro app devient active (ou quand elle est activée manuellement).

```ts
async mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

**Arguments :**
- `container` - L'élément DOM racine pour le rendu
- `props` - Props clé-valeur optionnels du shell

**Exemple :**
```ts
async mount(container, props) {
  // Configurer votre app
  const root = document.createElement('div');
  container.appendChild(root);

  // Rendre votre framework dans root
  this._root = createRoot(root);
  this._root.render(<App {...props} />);
}
```

## unmount

Appelé lors de la navigation hors de la route de la micro app (ou quand elle est désactivée manuellement).

```ts
async unmount(container: HTMLElement): Promise<void>
```

C'est ici que vous devez **nettoyer** - désabonner des événements, détruire les instances de framework, supprimer les nœuds DOM.

**Exemple :**
```ts
async unmount(container) {
  this._root?.unmount();
  container.innerHTML = '';
}
```

::: warning
Nettoyez toujours dans `unmount`. Les fuites de mémoire dues à la non-destruction des instances de framework sont le bug le plus courant dans les applications microfrontend.
:::

## update

Appelé quand le shell passe de nouvelles props à une micro app déjà montée. **Optionnel.**

```ts
async update(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

Si non implémenté, l'orchestrator appellera `unmount` → `mount` pour les mises à jour de props.

**Exemple :**
```ts
async update(container, props) {
  // Mettre à jour efficacement sans remontage complet
  this._root?.render(<App {...props} />);
}
```

## Hooks au Niveau de l'Orchestrator

Le shell peut aussi écouter les événements de cycle de vie globalement :

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
    // Afficher l'UI de secours
    app.container.innerHTML = '<p>Failed to load. Please refresh.</p>';
  },
});
```

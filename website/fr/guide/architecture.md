# Architecture

## Vue d'ensemble

Tuvix.js est structuré comme un monorepo de petits paquets composables. Vous n'importez que ce que vous utilisez.

```
@tuvix.js/core          ← Orchestrator, lifecycle, enregistrement
@tuvix.js/router        ← Routage basé sur les URL
@tuvix.js/event-bus     ← Pub/sub inter-applications
@tuvix.js/loader        ← Chargement dynamique de bundles
@tuvix.js/sandbox       ← Isolation CSS + JS
@tuvix.js/react         ← Bindings React
@tuvix.js/vue           ← Bindings Vue
@tuvix.js/svelte        ← Bindings Svelte
@tuvix.js/angular       ← Bindings Angular
@tuvix.js/devtools      ← Panneau de débogage
@tuvix.js/server        ← Composition SSR
@tuvix.js/module-federation  ← Intégration Webpack 5
create-tuvix-app        ← Scaffolding CLI
tuvix.js                ← Paquet parapluie (tout-en-un)
```

## Flux de Requête

```
Changement d'URL
    │
    ▼
@tuvix.js/router         ← Associe le chemin au nom de la micro app
    │
    ▼
@tuvix.js/core           ← L'Orchestrator décide de monter/démonter
    │
    ▼
@tuvix.js/loader         ← Récupère et exécute le bundle de la micro app
    │
    ▼
@tuvix.js/sandbox        ← Enveloppe l'app dans un scope isolé (optionnel)
    │
    ▼
Micro App .mount()       ← L'app se rend dans son élément conteneur
```

## Cycle de Vie

Chaque micro app doit implémenter l'interface `MicroApp` :

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

L'orchestrator appelle ces hooks au bon moment :

1. **`mount`** - appelé quand la route de l'app devient active
2. **`unmount`** - appelé lors de la navigation hors de la route de l'app
3. **`update`** - appelé quand les props changent sans remontage complet

## Modèle d'Isolation

### Isolation CSS (Shadow DOM)

Quand `sandbox.css = true`, le conteneur de la micro app devient un hôte Shadow DOM. Les styles définis à l'intérieur ne peuvent pas fuir vers l'extérieur, et les styles globaux ne peuvent pas fuir vers l'intérieur.

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### Isolation JS (Proxy Scope)

Quand `sandbox.js = true`, le scope global de la micro app est enveloppé dans un `Proxy`. L'accès à `window.localStorage`, `window.addEventListener`, etc. est intercepté et nettoyé au démontage.

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true, js: true },
});
```

## Event Bus

L'event bus est un canal pub/sub découplé partagé entre toutes les micro apps :

```ts
// Éditeur (n'importe quelle micro app)
import { getGlobalBus } from '@tuvix.js/event-bus';
eventBus.emit('user:login', { userId: '42' });

// Abonné (une autre micro app)
eventBus.on('user:login', ({ userId }) => {
  console.log('User logged in:', userId);
});
```

Les événements sont typés - TypeScript applique la forme du payload de l'événement.

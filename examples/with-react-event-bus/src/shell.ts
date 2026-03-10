import { createEventBus } from '@tuvix.js/event-bus';
import { createOrchestrator } from '@tuvix.js/core';

// Create a shared event bus — in a real multi-repo setup,
// this would be a singleton shared via an npm package or CDN global.
export const bus = createEventBus();

// Expose on window so micro apps can import it in dev mode
(window as unknown as Record<string, unknown>).__TUVIX_BUS__ = bus;

const orchestrator = createOrchestrator({
  onError(error: Error, appName: string) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

// All three apps are always mounted (no route-based activation in this example)
orchestrator.register({
  name: 'header',
  entry: '/src/apps/header/main.tsx',
  container: '#header',
  activeWhen: () => true,
  props: { bus },
});

orchestrator.register({
  name: 'sidebar',
  entry: '/src/apps/sidebar/main.tsx',
  container: '#sidebar',
  activeWhen: () => true,
  props: { bus },
});

orchestrator.register({
  name: 'content',
  entry: '/src/apps/content/main.tsx',
  container: '#content',
  activeWhen: () => true,
  props: { bus },
});

orchestrator.start();
console.log('🚀 Tuvix.js shell started (with-react-event-bus)');

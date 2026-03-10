import { createOrchestrator, createEventBus } from 'tuvix.js';
import { initDevtools } from '@tuvix.js/devtools';

const bus = createEventBus();
const orchestrator = createOrchestrator({
  onError(error, appName) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

// Initialize the DevTools panel!
// This reads the orchestrator state and mounts a floating debugger.
initDevtools(orchestrator);

orchestrator.register({
  name: 'app1',
  entry: { type: 'module', url: '/src/apps/app1/main.tsx' },
  container: '#app1',
  activeWhen: () => true,
  props: { bus, title: 'Left App' },
});

orchestrator.register({
  name: 'app2',
  entry: { type: 'module', url: '/src/apps/app2/main.tsx' },
  container: '#app2',
  activeWhen: () => true,
  props: { bus, title: 'Right App' },
});

// Expose to window for manual testing in browser console
(window as any).orchestrator = orchestrator;
(window as any).bus = bus;

orchestrator.start();
console.log('🚀 Tuvix.js shell started (with-react-devtools)');

import { createOrchestrator } from '@tuvix.js/core';
import { installDevTools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator({
  onError(error: Error, appName: string) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

// The panel polls the orchestrator once per second for registered and mounted
// apps and logs every event on the orchestrator's bus.
installDevTools(orchestrator);

orchestrator.register({
  name: 'app1',
  entry: () => import('./apps/app1/main'),
  container: '#app1',
  activeWhen: '/',
  props: { title: 'Left App' },
});

orchestrator.register({
  name: 'app2',
  entry: () => import('./apps/app2/main'),
  container: '#app2',
  activeWhen: '/',
  props: { title: 'Right App' },
});

orchestrator.start();

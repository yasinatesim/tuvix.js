import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  onError(error: Error, appName: string) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'react-app',
  entry: () => import('./apps/react-app/main'),
  container: '#react-app',
  activeWhen: '/',
});

orchestrator.register({
  name: 'vue-app',
  entry: () => import('./apps/vue-app/main'),
  container: '#vue-app',
  activeWhen: '/',
});

orchestrator.start();

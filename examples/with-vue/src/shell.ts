import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  onError(error: Error, appName: string) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home/main'),
  container: '#home',
  activeWhen: '/',
  props: { name: 'Alice' },
});

orchestrator.register({
  name: 'profile',
  entry: () => import('./apps/profile/main'),
  container: '#profile',
  activeWhen: '/',
  props: { theme: 'dark' },
});

orchestrator.start();

import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  onError(error: Error, appName: string) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

// Each entry is a loader function, so the Angular CLI splits every app into
// its own lazy chunk and the shell loads it on first mount.
orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#home',
  activeWhen: '/',
  props: { name: 'Alice' },
});

orchestrator.register({
  name: 'profile',
  entry: () => import('./apps/profile'),
  container: '#profile',
  activeWhen: '/',
  props: { theme: 'dark' },
});

orchestrator.start();

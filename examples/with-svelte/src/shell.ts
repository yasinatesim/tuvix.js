import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  onError(error, appName) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'home',
  entry: { type: 'module', url: '/src/apps/home/main.ts' },
  container: '#home',
  activeWhen: () => true,
  props: { name: 'Alice' },
});

orchestrator.register({
  name: 'profile',
  entry: { type: 'module', url: '/src/apps/profile/main.ts' },
  container: '#profile',
  activeWhen: () => true,
  props: { theme: 'dark' },
});

orchestrator.start();
console.log('🚀 Tuvix.js shell started (with-svelte)');

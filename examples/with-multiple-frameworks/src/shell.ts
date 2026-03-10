import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  onError(error, appName) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'react-app',
  entry: { type: 'module', url: '/src/apps/react-app/main.tsx' },
  container: '#react-app',
  activeWhen: () => true,
});

orchestrator.register({
  name: 'vue-app',
  entry: { type: 'module', url: '/src/apps/vue-app/main.ts' },
  container: '#vue-app',
  activeWhen: () => true,
});

orchestrator.start();
console.log('🚀 Tuvix.js shell started (with-multiple-frameworks)');

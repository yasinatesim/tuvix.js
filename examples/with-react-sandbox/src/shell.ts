import { createOrchestrator } from '@tuvix.js/core';


const orchestrator = createOrchestrator({
  onError(error: Error, appName: string) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

// App 1: Uses the sandbox to isolate its CSS from the global scope
orchestrator.register({
  name: 'app1',
  entry: '/src/apps/app1/main.tsx',
  container: '#app1',
  activeWhen: () => true,
  sandbox: true,
});

// App 2: Does NOT use a sandbox, so its CSS bleeds out
orchestrator.register({
  name: 'app2',
  entry: '/src/apps/app2/main.tsx',
  container: '#app2',
  activeWhen: () => true,
});

orchestrator.start();
console.log('🚀 Tuvix.js shell started (with-react-sandbox)');

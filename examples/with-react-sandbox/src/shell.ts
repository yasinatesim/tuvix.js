import { createOrchestrator } from 'tuvix.js';
import { createSandbox } from '@tuvix.js/sandbox';

const orchestrator = createOrchestrator({
  onError(error, appName) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

// App 1: Uses the sandbox to isolate its CSS from the global scope
orchestrator.register({
  name: 'app1',
  entry: { type: 'module', url: '/src/apps/app1/main.tsx' },
  container: '#app1',
  activeWhen: () => true,
  sandbox: createSandbox({
    cssIsolation: true,
    jsIsolation: false, // Vite Dev mode requires JS isolation off usually
  }),
});

// App 2: Does NOT use a sandbox, so its CSS bleeds out
orchestrator.register({
  name: 'app2',
  entry: { type: 'module', url: '/src/apps/app2/main.tsx' },
  container: '#app2',
  activeWhen: () => true,
});

orchestrator.start();
console.log('🚀 Tuvix.js shell started (with-react-sandbox)');

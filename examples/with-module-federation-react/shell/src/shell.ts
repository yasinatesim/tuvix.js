import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader } from '@tuvix.js/module-federation';

async function main() {
  const mfLoader = createFederatedLoader({
    remotes: [
      { name: 'remote1', url: 'http://localhost:3001/remoteEntry.js' },
      { name: 'remote2', url: 'http://localhost:3002/remoteEntry.js' },
    ],
  });

  // Pre-initialize MF apps: loads remoteEntry.js, inits shared scope,
  // executes the App factory, and registers each app in window.__TUVIX_MODULES__.
  // allSettled so one failing remote doesn't prevent the other from loading.
  const results = await Promise.allSettled([
    mfLoader.createFederatedApp('remote1', './App'),
    mfLoader.createFederatedApp('remote2', './App'),
  ]);
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`[Shell] Failed to pre-initialize remote${i + 1}:`, result.reason);
    }
  });

  const orchestrator = createOrchestrator({
    onError(error: Error, appName: string) {
      console.error(`[Shell] App "${appName}" failed:`, error);
    },
  });

  // Modules are already in window.__TUVIX_MODULES__ — use empty scripts so
  // the Tuvix loader skips script injection and resolves from the registry.
  orchestrator.register({
    name: 'remote1',
    container: '#remote1-container',
    activeWhen: () => true,
    entry: { scripts: [] },
  });

  orchestrator.register({
    name: 'remote2',
    container: '#remote2-container',
    activeWhen: () => true,
    entry: { scripts: [] },
  });

  orchestrator.start();
  console.log('🚀 Tuvix.js shell started (Module Federation Example)');
}

main().catch(console.error);

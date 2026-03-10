import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader } from '@tuvix.js/module-federation';

// 1. Initialize the Module Federation loader with remote configurations
const mfLoader = createFederatedLoader({
  remotes: [
    { name: 'remote1', url: 'http://localhost:3001/remoteEntry.js' },
    { name: 'remote2', url: 'http://localhost:3002/remoteEntry.js' }
  ]
});

const orchestrator = createOrchestrator({
  onError(error: Error, appName: string) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

// 2. Register the apps. 
// We provide a custom `load` hook that fetches the remote via the MF loader.
orchestrator.register({
  name: 'remote1',
  container: '#remote1-container',
  activeWhen: () => true,
  // The 'entry' field is technically ignored when a custom 'load' hook is provided, 
  // but it's good practice to provide it for metadata.
  entry: { type: 'module', url: 'remote1/App' },
  load: async () => {
    console.log('[Shell] Loading remote1...');
    // Fetches http://localhost:3001/remoteEntry.js, initializes shared scope,
    // and returns the Tuvix module exported from './App'
    return mfLoader.createFederatedApp('remote1', './App');
  }
});

orchestrator.register({
  name: 'remote2',
  container: '#remote2-container',
  activeWhen: () => true,
  entry: { type: 'module', url: 'remote2/App' },
  load: async () => {
    console.log('[Shell] Loading remote2...');
    return mfLoader.createFederatedApp('remote2', './App');
  }
});

orchestrator.start();
console.log('🚀 Tuvix.js shell started (Module Federation Example)');

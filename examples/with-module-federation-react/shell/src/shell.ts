import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader } from '@tuvix.js/module-federation';

const mfLoader = createFederatedLoader({
  remotes: [
    { name: 'remote1', url: 'http://localhost:3001/remoteEntry.js' },
    { name: 'remote2', url: 'http://localhost:3002/remoteEntry.js' },
  ],
});

const orchestrator = createOrchestrator({
  onError(error: Error, appName: string) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

// createFederatedEntry returns a loader function. On first mount it loads the
// remote's remoteEntry.js, initialises the container once and calls
// get('./App'). A remote that fails to load only takes down its own app.
orchestrator.register({
  name: 'remote1',
  container: '#remote1-container',
  activeWhen: '/',
  entry: mfLoader.createFederatedEntry('remote1', './App'),
  fallback: '<p>Remote 1 is unavailable.</p>',
});

orchestrator.register({
  name: 'remote2',
  container: '#remote2-container',
  activeWhen: '/',
  entry: mfLoader.createFederatedEntry('remote2', './App'),
  fallback: '<p>Remote 2 is unavailable.</p>',
});

orchestrator.start();

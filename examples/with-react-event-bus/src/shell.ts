import { createOrchestrator } from '@tuvix.js/core';

// The orchestrator's bus is getGlobalBus() from @tuvix.js/event-bus. It lives
// on window, so every app that calls getGlobalBus() talks to the same bus,
// even when each app ships its own copy of the package.
const orchestrator = createOrchestrator({
  onError(error: Error, appName: string) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

// All three apps stay mounted on every path.
orchestrator.register({
  name: 'header',
  entry: () => import('./apps/header/main'),
  container: '#header',
  activeWhen: '/',
});

orchestrator.register({
  name: 'sidebar',
  entry: () => import('./apps/sidebar/main'),
  container: '#sidebar',
  activeWhen: '/',
});

orchestrator.register({
  name: 'content',
  entry: () => import('./apps/content/main'),
  container: '#content',
  activeWhen: '/',
});

orchestrator.start();

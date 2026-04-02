import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/home/*', app: 'home' },
      { path: '/about/*', app: 'about' },
    ],
  },
  onError(error, appName) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

// In production, `entry` should point to a built JS bundle URL,
// e.g. 'https://cdn.example.com/home/main.js'
orchestrator.register({
  name: 'home',
  entry: '/src/apps/home/main.js',
  container: '#app',
  activeWhen: '/home',
  props: { theme: 'dark', user: 'Alice' },
});

orchestrator.register({
  name: 'about',
  entry: '/src/apps/about/main.js',
  container: '#app',
  activeWhen: '/about',
});

orchestrator.start();

// Redirect root to /home
if (window.location.pathname === '/') {
  window.history.pushState({}, '', '/home');
  window.dispatchEvent(new PopStateEvent('popstate'));
}

console.log('🚀 Tuvix.js shell started (with-vanilla)');

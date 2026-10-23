import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

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

// Loader functions let Vite split each app into its own chunk in production.
// An app on another origin would use a URL instead:
//   entry: 'https://cdn.example.com/home/main.js'
orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home/main.js'),
  container: '#app',
  props: { theme: 'dark', user: 'Alice' },
});

orchestrator.register({
  name: 'about',
  entry: () => import('./apps/about/main.js'),
  container: '#app',
});

const router = orchestrator.getRouter();

// Nav links switch apps without a page load.
interceptLinks({ navigate: (path) => router.push(path) });

async function boot() {
  if (window.location.pathname === '/') {
    await router.replace('/home');
  }
  await orchestrator.start();
}

boot().catch((error) => console.error('[Shell] start failed:', error));

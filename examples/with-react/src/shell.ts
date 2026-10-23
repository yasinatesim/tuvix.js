import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/home/*', app: 'home' },
      { path: '/about/*', app: 'about' },
    ],
  },
  onError(error: Error, appName: string) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

// Loader functions let Vite split each app into its own chunk in production.
// An app deployed on its own would use a URL instead:
//   entry: 'https://cdn.example.com/home/main.js'
orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home/main'),
  container: '#app',
  props: { theme: 'dark', user: 'Alice' },
});

orchestrator.register({
  name: 'about',
  entry: () => import('./apps/about/main'),
  container: '#app',
});

const maybeRouter = orchestrator.getRouter();
if (!maybeRouter) throw new Error('[Shell] router config missing');
const router = maybeRouter;

// Nav links switch apps without a page load.
interceptLinks({ navigate: (path) => router.push(path) });

async function boot(): Promise<void> {
  if (window.location.pathname === '/') {
    await router.replace('/home');
  }
  await orchestrator.start();
}

boot().catch((error) => console.error('[Shell] start failed:', error));

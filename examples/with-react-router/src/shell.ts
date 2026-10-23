import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

// createOrchestrator builds a @tuvix.js/router instance from this config.
// Each route names the app it mounts, so the apps need no activeWhen.
const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/profile/*', app: 'profile' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
  onError(error: Error, appName: string) {
    console.error(`[Shell] "${appName}" failed:`, error);
  },
});

// All three apps share one container: the orchestrator unmounts the old app
// before it mounts the new one.
orchestrator.register({
  name: 'dashboard',
  entry: () => import('./apps/dashboard/main'),
  container: '#app',
});

orchestrator.register({
  name: 'profile',
  entry: () => import('./apps/profile/main'),
  container: '#app',
});

orchestrator.register({
  name: 'settings',
  entry: () => import('./apps/settings/main'),
  container: '#app',
});

const maybeRouter = orchestrator.getRouter();
if (!maybeRouter) throw new Error('[Shell] router config missing');
const router = maybeRouter;

// Same-origin link clicks become router.push() calls instead of page loads.
interceptLinks({ navigate: (path) => router.push(path) });

function syncNav(): void {
  document.querySelectorAll<HTMLAnchorElement>('nav a').forEach((a) => {
    const href = a.getAttribute('href') ?? '';
    const active = window.location.pathname.startsWith(href);
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}
router.onChange(syncNav);

async function boot(): Promise<void> {
  if (window.location.pathname === '/') {
    await router.replace('/dashboard');
  }
  syncNav();
  await orchestrator.start();
}

boot().catch((error) => console.error('[Shell] start failed:', error));

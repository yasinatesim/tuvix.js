import { createOrchestrator } from '@tuvix.js/core';

// createOrchestrator accepts a router config directly —
// @tuvix.js/router powers the routing engine under the hood.
const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/profile/*', app: 'profile' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
  onError(error, appName) {
    console.error(`[Shell] "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: { type: 'module', url: '/src/apps/dashboard/main.tsx' },
  container: '#app',
  activeWhen: '/dashboard',
});

orchestrator.register({
  name: 'profile',
  entry: { type: 'module', url: '/src/apps/profile/main.tsx' },
  container: '#app',
  activeWhen: '/profile',
});

orchestrator.register({
  name: 'settings',
  entry: { type: 'module', url: '/src/apps/settings/main.tsx' },
  container: '#app',
  activeWhen: '/settings',
});

orchestrator.start();

// Highlight active nav link
function syncNav() {
  document.querySelectorAll<HTMLAnchorElement>('nav a').forEach((a) => {
    a.classList.toggle('active', window.location.pathname.startsWith(a.getAttribute('href') ?? ''));
  });
}
window.addEventListener('popstate', syncNav);
syncNav();

// Default redirect
if (window.location.pathname === '/') {
  window.history.pushState({}, '', '/dashboard');
  window.dispatchEvent(new PopStateEvent('popstate'));
}

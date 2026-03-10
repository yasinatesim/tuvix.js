import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/home/*', app: 'home' },
      { path: '/profile/*', app: 'profile' },
    ],
  },
});

orchestrator.register({
  name: 'home',
  // In production, `entry` should point to a built JS bundle URL,
  // e.g. 'https://cdn.example.com/home/main.js'
  entry: './apps/home/main.tsx',
  container: '#app',
  activeWhen: '/home/*',
});

orchestrator.register({
  name: 'profile',
  entry: './apps/profile/main.tsx',
  container: '#app',
  activeWhen: '/profile/*',
});

orchestrator.start();

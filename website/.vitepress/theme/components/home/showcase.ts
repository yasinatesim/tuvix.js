/**
 * Language-neutral content for the hero showcase: the host snippet (taken from
 * the README quick start) and the micro apps drawn in the host shell diagram.
 */

export const HOST_SNIPPET = `import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main-content',
  activeWhen: '/dashboard/*',
});

orchestrator.start();
`;

export interface ShellApp {
  /** CSS custom property suffix: `--orbit-<framework>`. */
  framework: 'react' | 'vue' | 'svelte' | 'angular';
  /** Framework name plus the peer range the adapter package accepts. */
  label: string;
  name: string;
  activeWhen: string;
  /** Example URL the diagram shows while this app is mounted. */
  path: string;
}

export const SHELL_APPS: ShellApp[] = [
  {
    framework: 'react',
    label: 'React 18+',
    name: 'dashboard',
    activeWhen: '/dashboard/*',
    path: '/dashboard/overview',
  },
  {
    framework: 'vue',
    label: 'Vue 3',
    name: 'catalog',
    activeWhen: '/shop/*',
    path: '/shop/shoes',
  },
  {
    framework: 'svelte',
    label: 'Svelte 3–5',
    name: 'checkout',
    activeWhen: '/checkout/*',
    path: '/checkout/payment',
  },
  {
    framework: 'angular',
    label: 'Angular 15+',
    name: 'settings',
    activeWhen: '/settings/*',
    path: '/settings/profile',
  },
];

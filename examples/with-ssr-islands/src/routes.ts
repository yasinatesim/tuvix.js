import type { ComponentType } from 'react';
import { matchPath } from '@tuvix.js/router';

export interface PageProps {
  /** How many times the host header forced a re-render. */
  hostRenders: number;
}

export type PageComponent = ComponentType<PageProps>;

export interface Route {
  /** Key the server uses to pick the island renderers for this page. */
  id: 'home' | 'lab' | 'about' | 'not-found';
  path: string;
  /**
   * Module path relative to the Vite root. The server passes it to
   * `getAssets`, which returns the page's CSS (islands included) and chunks.
   */
  entry: string;
  load: () => Promise<{ default: PageComponent }>;
}

export const routes: Route[] = [
  {
    id: 'home',
    path: '/',
    entry: 'src/pages/Home.tsx',
    load: () => import('./pages/Home'),
  },
  {
    id: 'lab',
    path: '/lab',
    entry: 'src/pages/Lab.tsx',
    load: () => import('./pages/Lab'),
  },
  {
    id: 'about',
    path: '/about',
    entry: 'src/pages/About.tsx',
    load: () => import('./pages/About'),
  },
];

export const notFound: Route = {
  id: 'not-found',
  path: '*',
  entry: 'src/pages/NotFound.tsx',
  load: () => import('./pages/NotFound'),
};

/** Route for a path such as `/lab?x=1#top`. `end: true` stops `/` from matching every path. */
export function findRoute(path: string): Route {
  return (
    routes.find(
      (route) => matchPath(route.path, path, { end: true }).matched
    ) ?? notFound
  );
}

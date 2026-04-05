import type { Component, Plugin } from 'vue';

// ─── renderVueToString ───────────────────────────────

/**
 * Render a Vue component to an HTML string on the server.
 *
 * Import from `@tuvix.js/vue/server` to keep this out of the browser bundle.
 * Returns an empty string when called in a browser environment so it is safe
 * to import in isomorphic route loaders.
 *
 * Requires `@vue/server-renderer` to be installed as a peer dependency.
 *
 * @example
 * ```ts
 * // routes/iletisim.tsx
 * import { renderVueToString } from '@tuvix.js/vue/server';
 * import { default: ContactApp } from '~/micro-apps/contact/App.vue';
 *
 * export const Route = createFileRoute('/contact')({
 *   loader: async () => ({
 *     ssrHtml: await renderVueToString(ContactApp),
 *   }),
 * });
 * ```
 */
export async function renderVueToString(
  App: Component,
  props?: Record<string, unknown>,
  plugins?: Plugin[]
): Promise<string> {
  // Guard: only runs on the server
  if (typeof window !== 'undefined') return '';

  const { createSSRApp } = await import('vue');
  const { renderToString } = await import('@vue/server-renderer');

  const app = createSSRApp(App, props ?? {});

  if (plugins) {
    for (const plugin of plugins) {
      app.use(plugin);
    }
  }

  return await renderToString(app);
}

import { createSSRApp } from 'vue';
import type { Component } from 'vue';
import { createRootComponent, installPlugins } from './root';
import type { VuePluginEntry } from './root';

/**
 * Context object passed to Vue's `renderToString`. Vue and its plugins write
 * into it during the render: teleported HTML lands in `teleports` (keyed by
 * target selector), and `@vitejs/plugin-vue` records the rendered component
 * modules in `modules`. Read both after `renderVueToString` resolves.
 *
 * @example
 * ```ts
 * import type { VueSsrContext } from '@tuvix.js/vue/server';
 *
 * const ssrContext: VueSsrContext = {};
 * ```
 */
export interface VueSsrContext {
  teleports?: Record<string, string>;
  modules?: Set<string>;
  [key: string]: unknown;
}

// ─── renderVueToString ───────────────────────────────

/**
 * Render a Vue component to an HTML string on the server.
 *
 * Server-only. Call it from code that never runs in the browser, such as a
 * TanStack Start `createServerFn` handler or an API route. Do not call it from
 * an isomorphic route loader: the loader also runs during client navigation,
 * where the browser guard returns `''`, and your bundler still ships the Vue
 * server renderer to the client because the loader imports it.
 *
 * The output uses the same root wrapper as `createSsrVueMicroApp`, so
 * `inject('tuvixProps')` sees `props` on the server too and hydration matches.
 * Pass an `ssrContext` object to read `teleports` and `modules` afterwards.
 *
 * Requires the `@vue/server-renderer` peer dependency.
 *
 * @example
 * ```ts
 * // src/server/contact.ts
 * import { createServerFn } from '@tanstack/react-start';
 * import { renderVueToString, type VueSsrContext } from '@tuvix.js/vue/server';
 * import ContactApp from '../micro-apps/contact/App.vue';
 *
 * export const renderContact = createServerFn().handler(async () => {
 *   const ssrContext: VueSsrContext = {};
 *   const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
 *   return { html, teleports: ssrContext.teleports ?? {} };
 * });
 * ```
 */
export async function renderVueToString(
  App: Component,
  props?: Record<string, unknown>,
  plugins?: VuePluginEntry[],
  ssrContext: VueSsrContext = {}
): Promise<string> {
  // Guard: only runs on the server
  if (typeof window !== 'undefined') return '';

  // `@vue/server-renderer` is an optional peer dependency; a static import
  // would fail for apps that install `@tuvix.js/vue` without it.
  const { renderToString } = await import('@vue/server-renderer');

  const app = createSSRApp(createRootComponent(App, { ...props }));

  installPlugins(app, plugins);

  return await renderToString(app, ssrContext);
}

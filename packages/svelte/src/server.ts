// ─── renderSvelteToString ────────────────────────────

/**
 * Server-side render a Svelte component to an HTML string.
 *
 * Import from `@tuvix.js/svelte/server` to keep this out of the browser bundle.
 * Only runs on the server — returns an empty string in browser environments.
 * Supports both Svelte 5 (`svelte/server` render API) and Svelte 3/4
 * (`App.render(props)` static method).
 *
 * @example
 * ```ts
 * // TanStack Start route loader
 * import { renderSvelteToString } from '@tuvix.js/svelte/server';
 * import { default: FooterApp } from '~/micro-apps/footer/App.svelte';
 *
 * loader: async () => ({
 *   ssrHtml: await renderSvelteToString(FooterApp),
 * })
 * ```
 */
export async function renderSvelteToString(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  App: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: Record<string, any>,
): Promise<string> {
  // Guard: only run on the server
  if (typeof window !== 'undefined') {
    return '';
  }

  // Svelte 5: uses `svelte/server` render()
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svelteServer = await import('svelte/server' as any);
    if (typeof svelteServer.render === 'function') {
      const result: { html: string } = svelteServer.render(App, { props: props ?? {} });
      return result.html;
    }
  } catch {
    // svelte/server not available — fall through to Svelte 3/4 path
  }

  // Svelte 3/4: static App.render(props)
  if (typeof App.render === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: { html: string } = (App as any).render(props ?? {});
    return result.html;
  }

  return '';
}

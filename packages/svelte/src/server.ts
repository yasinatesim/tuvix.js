// ─── Types ──────────────────────────────────────────

/** Output of {@link renderSvelte}. */
export interface SvelteRenderResult {
  /** Component markup. Svelte 5 output carries the hydration comments `hydrate()` needs. */
  html: string;
  /** `<svelte:head>` markup, without the component `<style>` tags. */
  head: string;
  /** Component CSS as `<style>` tags, or `''` when the compiler emitted no CSS. */
  css: string;
}

/**
 * Svelte 5 `render` from `svelte/server`. Its real signature is generic over
 * the component's props, so this type only fixes the return shape; any
 * function returning `{ head, body }` (or a promise of it) fits.
 */
export type SvelteServerRender = (
  ...args: never[]
) => SvelteRenderOutput | PromiseLike<SvelteRenderOutput>;

/** How the adapter calls {@link SvelteServerRender}. */
type CallableServerRender = (
  component: unknown,
  options: { props: Record<string, unknown> }
) => SvelteRenderOutput | PromiseLike<SvelteRenderOutput>;

interface SvelteRenderOutput {
  head: string;
  body: string;
}

export interface RenderSvelteOptions {
  /**
   * `render` from `svelte/server`. Pass it when your server bundle includes
   * Svelte (Nitro, Vinxi, a noExternal Vite SSR build): the adapter then uses
   * the same Svelte copy as your compiled component, and the bundler sees the
   * import. Without it, the adapter imports `svelte/server` at runtime.
   */
  render?: SvelteServerRender;
}

/** Svelte 3/4 server component: `App.render(props)`. */
interface Svelte4ServerComponent {
  render(props: Record<string, unknown>): {
    html: string;
    head?: string;
    css?: { code?: string | null } | null;
  };
}

// ─── renderSvelte ────────────────────────────────────

const STYLE_TAG = /<style\b[^>]*>[\s\S]*?<\/style>/g;

async function hasSvelte5Runtime(): Promise<boolean> {
  // Every major has 'svelte'; only Svelte 5 exports `mount` (its server build
  // exports a stub). `App.render` is no signal: Svelte 5 dev builds attach a
  // `render` that throws.
  const svelte: object = await import('svelte');
  return 'mount' in svelte;
}

async function loadServerRender(): Promise<SvelteServerRender> {
  // Svelte 3/4 have no 'svelte/server'. A literal specifier would make
  // bundlers try to resolve it and fail the build for Svelte 4 users.
  // `@vite-ignore` keeps Vite quiet while Vite SSR still resolves the import
  // through its module graph, so the component and `render` share one Svelte.
  const specifier = 'svelte/server';
  const server = (await import(/* @vite-ignore */ specifier)) as {
    render: SvelteServerRender;
  };
  return server.render;
}

/**
 * Server-render a Svelte component and return its markup, `<svelte:head>`
 * content and CSS separately.
 *
 * Use it when the component has `<svelte:head>` content: put `head` in the
 * document `<head>`. For a plain island, {@link renderSvelteToString} is
 * shorter.
 *
 * Call it from a server function, not an isomorphic loader: in a browser it
 * returns empty strings.
 *
 * - **Svelte 5**: compile with `generate: 'server'` and use `render` from
 *   `svelte/server`. CSS appears only when the component is compiled with
 *   `css: 'injected'` (in Vite: `svelte({ compilerOptions: { css: 'injected' } })`).
 *   With the default `css: 'external'` your bundler emits the CSS as a file.
 * - **Svelte 3/4**: calls `App.render(props)` on a component compiled with
 *   `generate: 'ssr'`, and wraps `css.code` in a `<style>` tag.
 *
 * When you pass `render`, the Svelte 5 path runs. Otherwise the adapter
 * imports `svelte` and takes the Svelte 5 path if it exports `mount`.
 *
 * @example
 * ```ts
 * import { render } from 'svelte/server';
 * import { renderSvelte } from '@tuvix.js/svelte/server';
 * import Footer from './Footer.svelte';
 *
 * const { html, head, css } = await renderSvelte(Footer, { year: 2026 }, { render });
 * ```
 */
export async function renderSvelte(
  App: unknown,
  props: Record<string, unknown> = {},
  options: RenderSvelteOptions = {}
): Promise<SvelteRenderResult> {
  if (typeof window !== 'undefined') {
    return { html: '', head: '', css: '' };
  }

  if (!options.render && !(await hasSvelte5Runtime())) {
    // Svelte 3/4 SSR components are objects with a static render().
    const result = (App as Svelte4ServerComponent).render(props);
    const code = result.css?.code ?? '';
    return {
      html: result.html,
      head: result.head ?? '',
      css: code ? `<style>${code}</style>` : '',
    };
  }

  // Unchecked: `svelte/server` render accepts (component, { props }), which
  // SvelteServerRender can't express without Svelte's generic types.
  const render = (options.render ??
    (await loadServerRender())) as CallableServerRender;
  const result = await render(App, { props });
  const styles = result.head.match(STYLE_TAG) ?? [];
  return {
    html: result.body,
    head: result.head.replace(STYLE_TAG, ''),
    css: styles.join(''),
  };
}

// ─── renderSvelteToString ────────────────────────────

/**
 * Server-render a Svelte component to one HTML string: the component's
 * `<style>` tags followed by its markup.
 *
 * Put the string inside the island container (`data-tuvix-app`) and mount
 * with `createSsrSvelteMicroApp` on the client, which hydrates it. The
 * string leaves out `<svelte:head>` content; use {@link renderSvelte} if you
 * need it.
 *
 * Import from `@tuvix.js/svelte/server` and call it from a server function,
 * not an isomorphic loader: in a browser it returns `''`. Works with Svelte 5
 * (`render` from `svelte/server`) and Svelte 3/4 (`App.render(props)`). To get
 * the CSS, compile with `css: 'injected'`; see {@link renderSvelte}.
 *
 * @example
 * ```ts
 * import { render } from 'svelte/server';
 * import { renderSvelteToString } from '@tuvix.js/svelte/server';
 * import Footer from './Footer.svelte';
 *
 * const footerHtml = await renderSvelteToString(Footer, { year: 2026 }, { render });
 * ```
 */
export async function renderSvelteToString(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<string> {
  const { html, css } = await renderSvelte(App, props, options);
  return css + html;
}

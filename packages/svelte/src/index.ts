import { createElement, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import type { MicroAppModule, MountContext, UnmountContext, UpdateContext } from '@tuvix.js/loader';

// ─── Types ──────────────────────────────────────────

export interface SvelteMicroAppConfig {
  /** Unique name for the micro app */
  name: string;

  /**
   * Svelte component class.
   * Accepts `new Component({ target, props })` constructor.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  App: any;

  /** Optional one-time setup */
  bootstrap?: () => void | Promise<void>;
}

// ─── createSvelteMicroApp ───────────────────────────

/**
 * Create a Tuvix.js micro app module from a Svelte component.
 *
 * Handles `new App({ target })` and `app.$destroy()` lifecycle
 * automatically. Props from orchestrator are passed as component props.
 *
 * @example
 * ```ts
 * import { createSvelteMicroApp } from '@tuvix.js/svelte';
 * import App from './App.svelte';
 *
 * export default createSvelteMicroApp({
 *   name: 'profile',
 *   App,
 * });
 * ```
 */
export function createSvelteMicroApp(config: SvelteMicroAppConfig): MicroAppModule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let instance: any = null;

  const module: MicroAppModule = {
    async bootstrap() {
      if (config.bootstrap) {
        await config.bootstrap();
      }
    },

    async mount({ container, props }: MountContext) {
      instance = new config.App({
        target: container,
        props: props ?? {},
      });
    },

    async unmount({ container }: UnmountContext) {
      if (instance) {
        // Svelte 3/4: $destroy()
        // Svelte 5: unmount()
        if (typeof instance.$destroy === 'function') {
          instance.$destroy();
        } else if (typeof instance.unmount === 'function') {
          instance.unmount();
        }
        instance = null;
      }
      container.innerHTML = '';
    },

    async update({ props }: UpdateContext) {
      if (instance) {
        // Svelte 3/4: $set()
        if (typeof instance.$set === 'function') {
          instance.$set(props);
        }
      }
    },
  };

  // Register in global module registry
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    win.__TUVIX_MODULES__ = win.__TUVIX_MODULES__ ?? {};
    win.__TUVIX_MODULES__[config.name] = module;
  }

  return module;
}

// ─── renderSvelteToString ────────────────────────────

/**
 * Server-side render a Svelte component to an HTML string.
 *
 * Only runs on the server — returns an empty string in browser environments.
 * Supports both Svelte 5 (`svelte/server` render API) and Svelte 3/4
 * (`App.render(props)` static method).
 *
 * @example
 * ```ts
 * // TanStack Start route loader
 * loader: async () => {
 *   const { renderSvelteToString } = await import('@tuvix.js/svelte');
 *   const { default: FooterApp } = await import('~/micro-apps/footer/App.svelte');
 *   return { ssrHtml: await renderSvelteToString(FooterApp) };
 * }
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

// ─── createSsrSvelteMicroApp ─────────────────────────

/**
 * Create a Tuvix.js micro app module from a Svelte component with SSR hydration support.
 *
 * Like `createSvelteMicroApp` but intelligently hydrates existing server-rendered
 * HTML rather than replacing it. On mount, if the container already has child nodes
 * the component is initialised with `hydrate: true` to avoid a flash of unstyled content.
 *
 * - **Svelte 5**: uses `import { mount } from 'svelte'` with `{ hydrate: true }`
 * - **Svelte 3/4**: uses `new App({ target, props, hydrate: true })`
 *
 * @example
 * ```ts
 * import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
 * import App from './App.svelte';
 *
 * export default createSsrSvelteMicroApp({
 *   name: 'footer',
 *   App,
 * });
 * ```
 */
export function createSsrSvelteMicroApp(config: SvelteMicroAppConfig): MicroAppModule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let instance: any = null;

  const module: MicroAppModule = {
    async bootstrap() {
      if (config.bootstrap) {
        await config.bootstrap();
      }
    },

    async mount({ container, props }: MountContext) {
      const shouldHydrate = container.hasChildNodes();

      // Svelte 5: try dynamic import of `mount` from 'svelte'
      let usedSvelte5 = false;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const svelte = await import('svelte' as any);
        if (typeof svelte.mount === 'function') {
          instance = svelte.mount(config.App, {
            target: container,
            props: props ?? {},
            hydrate: shouldHydrate,
          });
          usedSvelte5 = true;
        }
      } catch {
        // svelte.mount not available — fall through to Svelte 3/4
      }

      if (!usedSvelte5) {
        // Svelte 3/4: constructor approach
        instance = new config.App({
          target: container,
          props: props ?? {},
          hydrate: shouldHydrate,
        });
      }
    },

    async unmount({ container }: UnmountContext) {
      if (instance) {
        // Svelte 3/4: $destroy()
        // Svelte 5: unmount()
        if (typeof instance.$destroy === 'function') {
          instance.$destroy();
        } else if (typeof instance.unmount === 'function') {
          instance.unmount();
        }
        instance = null;
      }
      container.innerHTML = '';
    },

    async update({ props }: UpdateContext) {
      if (instance) {
        // Svelte 3/4: $set()
        if (typeof instance.$set === 'function') {
          instance.$set(props);
        }
      }
    },
  };

  // Register in global module registry
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    win.__TUVIX_MODULES__ = win.__TUVIX_MODULES__ ?? {};
    win.__TUVIX_MODULES__[config.name] = module;
  }

  return module;
}

// ─── TuvixSvelteApp ──────────────────────────────────

/**
 * React wrapper component that renders a Svelte micro app inline.
 *
 * **Use this in SSR frameworks** (TanStack Start, Next.js, Remix) so that
 * Svelte micro app content is server-rendered and SEO-indexed. Pass the
 * pre-rendered HTML string via `ssrHtml` from the route loader so React
 * sees the same markup on both server and client, preventing hydration mismatches.
 *
 * After React hydration completes, a `useEffect` mounts the Svelte component
 * with `hydrate: true` when SSR content is present, or a fresh mount otherwise.
 *
 * - **Svelte 5**: uses `import { mount } from 'svelte'`
 * - **Svelte 3/4 fallback**: uses `new App({ target, props, hydrate })`
 *
 * @example
 * ```tsx
 * // routes/footer.tsx
 * export const Route = createFileRoute('/footer')({
 *   loader: async () => {
 *     const { renderSvelteToString } = await import('@tuvix.js/svelte');
 *     const { default: FooterApp } = await import('~/micro-apps/footer/App.svelte');
 *     return { ssrHtml: await renderSvelteToString(FooterApp) };
 *   },
 *   component: function() {
 *     const { ssrHtml } = Route.useLoaderData();
 *     return <TuvixSvelteApp name="footer-app" App={FooterApp} ssrHtml={ssrHtml} />;
 *   }
 * });
 * ```
 */
export function TuvixSvelteApp({
  name,
  App,
  ssrHtml = '',
  ...props
}: {
  /** Micro app name — used as the `data-tuvix-app` attribute value */
  name: string;
  /** Svelte component class or module */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  App: any;
  /** Pre-rendered HTML from the route loader. When provided, Svelte hydrates rather than mounts fresh. */
  ssrHtml?: string;
  [key: string]: unknown;
}): ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const shouldHydrate = container.hasChildNodes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let instance: any = null;

    void (async () => {
      let usedSvelte5 = false;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const svelte = await import('svelte' as any);
        if (typeof svelte.mount === 'function') {
          instance = svelte.mount(App, {
            target: container,
            props,
            hydrate: shouldHydrate,
          });
          usedSvelte5 = true;
        }
      } catch {
        // svelte.mount not available — fall through to Svelte 3/4
      }

      if (!usedSvelte5) {
        instance = new App({
          target: container,
          props,
          hydrate: shouldHydrate,
        });
      }
    })();

    return () => {
      if (instance) {
        if (typeof instance.$destroy === 'function') {
          instance.$destroy();
        } else if (typeof instance.unmount === 'function') {
          instance.unmount();
        }
      }
    };
    // Props are intentionally spread; deep comparison not needed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createElement('div', {
    'data-tuvix-app': name,
    ref,
    suppressHydrationWarning: true,
    ...(ssrHtml ? { dangerouslySetInnerHTML: { __html: ssrHtml } } : {}),
  });
}

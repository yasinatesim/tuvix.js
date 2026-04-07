import type {
  MicroAppModule,
  MountContext,
  UnmountContext,
  UpdateContext,
} from '@tuvix.js/loader';

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
export function createSvelteMicroApp(
  config: SvelteMicroAppConfig
): MicroAppModule {
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
        } else {
          // Svelte 5 removed $set — props must be passed via reactive state inside the component
          console.warn(
            `[Tuvix] updateAppProps("${config.name}"): Svelte 5 does not support $set(). ` +
            `Pass props via a shared store or rune-based state inside the component.`
          );
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
export function createSsrSvelteMicroApp(
  config: SvelteMicroAppConfig
): MicroAppModule {
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
        } else {
          // Svelte 5 removed $set — props must be passed via reactive state inside the component
          console.warn(
            `[Tuvix] updateAppProps("${config.name}"): Svelte 5 does not support $set(). ` +
            `Pass props via a shared store or rune-based state inside the component.`
          );
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

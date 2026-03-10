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

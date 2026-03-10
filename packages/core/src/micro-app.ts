import type {
  MicroAppModule,
  MountContext,
  UnmountContext,
  UpdateContext,
} from '@tuvix.js/loader';

/**
 * Helper to define a micro app with proper typing and validation.
 * Used by micro app developers to expose lifecycle methods.
 *
 * @example
 * ```ts
 * import { defineMicroApp } from '@tuvix.js/core';
 *
 * export default defineMicroApp({
 *   name: 'dashboard',
 *
 *   async bootstrap() {
 *     // One-time initialization
 *   },
 *
 *   async mount({ container, props }) {
 *     container.innerHTML = '<h1>Dashboard</h1>';
 *   },
 *
 *   async unmount({ container }) {
 *     container.innerHTML = '';
 *   },
 * });
 * ```
 */
export interface MicroAppDefinition {
  /** App name (should match the registered name) */
  name: string;

  /** Called once when the app is first loaded */
  bootstrap?: () => void | Promise<void>;

  /** Called every time the app needs to render */
  mount: (context: MountContext) => void | Promise<void>;

  /** Called when the app should clean up */
  unmount: (context: UnmountContext) => void | Promise<void>;

  /** Called when props are updated while mounted */
  update?: (context: UpdateContext) => void | Promise<void>;
}

export function defineMicroApp(definition: MicroAppDefinition): MicroAppModule {
  if (!definition.name) {
    throw new Error('[Tuvix] defineMicroApp requires a "name" property.');
  }

  if (typeof definition.mount !== 'function') {
    throw new Error(
      `[Tuvix] defineMicroApp "${definition.name}" requires a "mount" function.`
    );
  }

  if (typeof definition.unmount !== 'function') {
    throw new Error(
      `[Tuvix] defineMicroApp "${definition.name}" requires an "unmount" function.`
    );
  }

  const module: MicroAppModule = {
    bootstrap: definition.bootstrap,
    mount: definition.mount,
    unmount: definition.unmount,
    update: definition.update,
  };

  // Register in global module registry for the loader to find
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(window as any).__TUVIX_MODULES__) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__TUVIX_MODULES__ = {};
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__TUVIX_MODULES__[definition.name] = module;
  }

  return module;
}

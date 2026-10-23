import {
  emitLifecycle,
  hasServerMarkup,
  registerModule,
  type MicroAppModule,
  type MountContext,
  type UnmountContext,
  type UpdateContext,
} from '@tuvix.js/loader';

/**
 * Helper to define a micro app with proper typing and validation.
 * Used by micro app developers to expose lifecycle methods.
 *
 * The returned module dispatches the same lifecycle events as the framework
 * adapters, so `whenMounted(name)`, `isMounted(name)` and `onLifecycle` work
 * for vanilla apps:
 * - `tuvix:mounted` after `mount` resolves
 * - `tuvix:unmounted` after `unmount` resolves
 * - `tuvix:error` when either throws; the error is rethrown
 *
 * An `unmount` that arrives while `mount` is still running for the same
 * container waits for it first.
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

  /**
   * Set when `mount` adopts server-rendered markup. The `mounted` event then
   * reports `hydrated: true` if the container held markup before `mount` ran.
   * Defaults to false.
   */
  ssr?: boolean;
}

interface ContainerState {
  /** Settles when the latest mount for this container finishes, either way. */
  mounting: Promise<void>;
  hydrated: boolean;
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

  const { name } = definition;
  const containers = new WeakMap<HTMLElement, ContainerState>();

  const mount = async (context: MountContext): Promise<void> => {
    const { container } = context;
    const hydrated = definition.ssr === true && hasServerMarkup(container);
    const run = (async () => {
      try {
        await definition.mount(context);
      } catch (error) {
        emitLifecycle('error', { name, container, hydrated, error });
        throw error;
      }
      emitLifecycle('mounted', { name, container, hydrated });
    })();
    containers.set(container, {
      mounting: run.then(
        () => undefined,
        () => undefined
      ),
      hydrated,
    });
    await run;
  };

  const unmount = async (context: UnmountContext): Promise<void> => {
    const { container } = context;
    const state = containers.get(container);
    if (state) await state.mounting;
    containers.delete(container);
    const hydrated = state?.hydrated ?? false;
    try {
      await definition.unmount(context);
    } catch (error) {
      emitLifecycle('error', { name, container, hydrated, error });
      throw error;
    }
    emitLifecycle('unmounted', { name, container, hydrated });
  };

  const module: MicroAppModule = {
    bootstrap: definition.bootstrap,
    mount,
    unmount,
    update: definition.update,
  };

  // Publish in the shared module registry for the loader to find.
  registerModule(definition.name, module);

  return module;
}

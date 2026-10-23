import {
  emitLifecycle,
  hasServerMarkup,
  registerModule,
} from '@tuvix.js/loader';
import type {
  MicroAppModule,
  MountContext,
  UnmountContext,
  UpdateContext,
} from '@tuvix.js/loader';

// ─── Types ──────────────────────────────────────────

/** Props passed from the orchestrator to the Svelte component. */
export type SvelteProps = Record<string, unknown>;

export interface SvelteMicroAppConfig {
  /** Unique name for the micro app */
  name: string;

  /**
   * Root component: a Svelte 5 component (compiled to a function) or a
   * Svelte 3/4 component class (`new App({ target, props })`).
   */
  App: unknown;

  /** Optional one-time setup */
  bootstrap?: () => void | Promise<void>;

  /**
   * Hydrate server-rendered markup.
   *
   * When `true` and the container already holds markup (whitespace and
   * comments do not count), `mount()` adopts it with Svelte 5 `hydrate()` or
   * Svelte 3/4 `new App({ hydrate: true })`. Otherwise it renders fresh.
   * Svelte 3/4 components must be compiled with `hydratable: true`.
   *
   * @default false
   */
  ssr?: boolean;

  /**
   * Svelte 5 only: pass `SvelteMap` from `svelte/reactivity` to update props
   * in place. The adapter then hands the component a props object backed by a
   * `SvelteMap`, so `update()` re-renders only what reads a changed prop and
   * keeps DOM nodes and component state.
   *
   * Without it, a Svelte 5 `update()` remounts the component: it unmounts the
   * instance, mounts a new one with the new props, and dispatches
   * `tuvix:mounted` again. The adapter does not import `svelte/reactivity`
   * itself because Svelte 3/4 have no such module and bundlers would fail to
   * build Svelte 3/4 apps. Svelte 3/4 ignore this option and use `$set`.
   *
   * @example
   * ```ts
   * import { SvelteMap } from 'svelte/reactivity';
   * import { createSvelteMicroApp } from '@tuvix.js/svelte';
   * import App from './App.svelte';
   *
   * export default createSvelteMicroApp({ name: 'profile', App, SvelteMap });
   * ```
   */
  SvelteMap?: ReactiveMapConstructor;
}

/** The parts of the `svelte` module the adapter reads. Svelte 5 has `mount`. */
interface SvelteModule {
  mount?(component: unknown, options: Svelte5Options): object;
  hydrate?(component: unknown, options: Svelte5Options): object;
  unmount?(instance: object): unknown;
  flushSync?(): void;
  tick?(): Promise<void>;
}

type Svelte5Module = SvelteModule &
  Required<Pick<SvelteModule, 'mount' | 'unmount'>>;

interface Svelte5Options {
  target: HTMLElement;
  props: SvelteProps;
}

/** The `SvelteMap` methods the adapter calls. */
interface ReactiveMap {
  get(key: string): unknown;
  set(key: string, value: unknown): unknown;
  has(key: string): boolean;
  delete(key: string): boolean;
  keys(): IterableIterator<string>;
}

/** `SvelteMap` from `svelte/reactivity` (Svelte 5). */
type ReactiveMapConstructor = new (
  entries: Iterable<readonly [string, unknown]>
) => ReactiveMap;

/** Svelte 3/4 component instance. */
interface Svelte4Instance {
  $set(props: SvelteProps): void;
  $destroy(): void;
}

type Svelte4Component = new (options: {
  target: HTMLElement;
  props: SvelteProps;
  hydrate: boolean;
}) => Svelte4Instance;

/** A mounted component, whichever Svelte version rendered it. */
interface Handle {
  /** Resolves `true` when the update replaced the DOM (remount). */
  update(props: SvelteProps): Promise<boolean>;
  destroy(): Promise<void>;
}

/** One mount of the module into one container. */
interface Slot {
  container: HTMLElement;
  hydrated: boolean;
  /** Settles when the component has mounted (or failed to). */
  ready: Promise<Handle>;
  /** Set once unmount starts; a new mount on the container waits for it. */
  teardown?: Promise<void>;
}

// ─── Svelte runtime detection ───────────────────────

let runtime: Promise<SvelteModule> | undefined;

function loadSvelte(): Promise<SvelteModule> {
  // Dynamic import: Svelte 3/4 and Svelte 5 export different APIs from
  // 'svelte', and the adapter picks one at runtime by checking for `mount`.
  runtime ??= import('svelte').then(
    (svelte): SvelteModule => svelte,
    (error: unknown) => {
      runtime = undefined;
      throw error;
    }
  );
  return runtime;
}

/**
 * Svelte 5 props object that stays reactive when written from plain
 * TypeScript. Values live in a `SvelteMap`; the component reads them through
 * the proxy, so `update()` re-renders exactly the parts that read a changed
 * prop, without remounting.
 */
function createReactiveProps(
  SvelteMap: ReactiveMapConstructor,
  initial: SvelteProps
): { props: SvelteProps; set(next: SvelteProps): void } {
  const values = new SvelteMap(Object.entries(initial));

  const props = new Proxy<SvelteProps>(
    {},
    {
      get: (_target, key) =>
        typeof key === 'string' ? values.get(key) : undefined,
      has: (_target, key) => typeof key === 'string' && values.has(key),
      ownKeys: () => Array.from(values.keys()),
      getOwnPropertyDescriptor: (_target, key) =>
        typeof key === 'string' && values.has(key)
          ? {
              value: values.get(key),
              enumerable: true,
              configurable: true,
              writable: true,
            }
          : undefined,
    }
  );

  return {
    props,
    set(next) {
      for (const key of Array.from(values.keys())) {
        if (!(key in next)) values.delete(key);
      }
      for (const [key, value] of Object.entries(next)) values.set(key, value);
    },
  };
}

function isSvelte5(svelte: SvelteModule): svelte is Svelte5Module {
  return 'mount' in svelte && typeof svelte.mount === 'function';
}

function mountSvelte5(
  svelte: Svelte5Module,
  App: unknown,
  container: HTMLElement,
  props: SvelteProps,
  hydrate: boolean,
  SvelteMap: ReactiveMapConstructor | undefined
): Handle {
  const reactive = SvelteMap ? createReactiveProps(SvelteMap, props) : null;
  const render = (current: SvelteProps, adopt: boolean): object => {
    const options = { target: container, props: current };
    const instance =
      adopt && svelte.hydrate
        ? svelte.hydrate(App, options)
        : svelte.mount(App, options);
    // Run onMount callbacks and effects now, so `tuvix:mounted` fires after them.
    svelte.flushSync?.();
    return instance;
  };
  let instance = render(reactive ? reactive.props : { ...props }, hydrate);

  return {
    async update(next) {
      if (reactive) {
        reactive.set(next);
        svelte.flushSync?.();
        return false;
      }
      await svelte.unmount(instance);
      container.replaceChildren();
      instance = render({ ...next }, false);
      return true;
    },
    async destroy() {
      await svelte.unmount(instance);
    },
  };
}

async function mountSvelte4(
  svelte: SvelteModule,
  App: unknown,
  container: HTMLElement,
  props: SvelteProps,
  hydrate: boolean
): Promise<Handle> {
  const Component = App as Svelte4Component;
  const instance = new Component({
    target: container,
    props: { ...props },
    hydrate,
  });
  let keys = Object.keys(props);

  return {
    async update(next) {
      // `$set` merges. Clear props the new set no longer has.
      const patch: SvelteProps = {};
      for (const key of keys) if (!(key in next)) patch[key] = undefined;
      Object.assign(patch, next);
      keys = Object.keys(next);
      instance.$set(patch);
      await svelte.tick?.();
      return false;
    },
    async destroy() {
      instance.$destroy();
    },
  };
}

// ─── createSvelteMicroApp ───────────────────────────

/**
 * Create a Tuvix.js micro app module from a Svelte 3, 4 or 5 component.
 *
 * The adapter imports `svelte` when it first mounts. If that module exports
 * `mount`, it uses the Svelte 5 API (`mount`/`hydrate`/`unmount`); otherwise it
 * uses the Svelte 3/4 class API (`new App()`/`$set`/`$destroy`).
 *
 * - Each container gets its own component instance, so one module can mount
 *   into several containers at once.
 * - `update({ props, container })` updates that container's instance, or
 *   every mounted instance when `container` is omitted. Svelte 5 updates in
 *   place when you pass `SvelteMap` in the config; otherwise it remounts the
 *   component and dispatches `tuvix:mounted` again. Svelte 3/4 uses `$set`;
 *   props missing from the new object are set to `undefined`.
 * - `unmount()` called while `mount()` is still loading waits for the mount,
 *   then destroys it.
 * - Dispatches `tuvix:mounted`, `tuvix:unmounted` and `tuvix:error` on the
 *   container. `tuvix:mounted` fires after `onMount` callbacks have run.
 *
 * The bundler must resolve `svelte` to its client build (the `browser`
 * export condition). If it picks the server build, Svelte 5 `mount()` throws
 * `lifecycle_function_unavailable` and `onMount` never runs.
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
  const slots = new WeakMap<HTMLElement, Slot>();
  // WeakMap can't be iterated; update() needs every live slot.
  const live = new Set<Slot>();

  async function start(
    container: HTMLElement,
    hydrated: boolean,
    props: SvelteProps
  ): Promise<Handle> {
    try {
      const svelte = await loadSvelte();
      if (!hydrated) container.replaceChildren();
      const handle = isSvelte5(svelte)
        ? mountSvelte5(
            svelte,
            config.App,
            container,
            props,
            hydrated,
            config.SvelteMap
          )
        : await mountSvelte4(svelte, config.App, container, props, hydrated);
      emitLifecycle('mounted', { name: config.name, container, hydrated });
      return handle;
    } catch (error) {
      emitLifecycle('error', { name: config.name, container, hydrated, error });
      throw error;
    }
  }

  function forget(slot: Slot): void {
    live.delete(slot);
    if (slots.get(slot.container) === slot) slots.delete(slot.container);
  }

  async function stop(slot: Slot): Promise<void> {
    const { container } = slot;
    live.delete(slot);
    let handle: Handle;
    try {
      handle = await slot.ready;
    } catch {
      // The mount failed and already emitted `tuvix:error`.
      forget(slot);
      return;
    }
    try {
      await handle.destroy();
    } finally {
      container.replaceChildren();
      forget(slot);
      emitLifecycle('unmounted', {
        name: config.name,
        container,
        hydrated: slot.hydrated,
      });
    }
  }

  const module: MicroAppModule = {
    async bootstrap() {
      if (config.bootstrap) {
        await config.bootstrap();
      }
    },

    async mount({ container, props }: MountContext) {
      const previous = slots.get(container);
      if (previous) await (previous.teardown ?? module.unmount({ container }));

      const hydrated = config.ssr === true && hasServerMarkup(container);
      const slot: Slot = {
        container,
        hydrated,
        ready: start(container, hydrated, props ?? {}),
      };
      slots.set(container, slot);
      live.add(slot);
      try {
        await slot.ready;
      } catch (error) {
        forget(slot);
        throw error;
      }
    },

    async unmount({ container }: UnmountContext) {
      const slot = slots.get(container);
      // A container this module never mounted is left untouched.
      if (!slot) return;
      slot.teardown ??= stop(slot);
      await slot.teardown;
    },

    async update({ props, container }: UpdateContext) {
      const targets = container
        ? Array.from(live).filter((slot) => slot.container === container)
        : Array.from(live);
      await Promise.all(
        targets.map(async (slot) => {
          let handle: Handle;
          try {
            handle = await slot.ready;
          } catch {
            return;
          }
          if (!live.has(slot)) return;
          if (await handle.update(props)) {
            slot.hydrated = false;
            emitLifecycle('mounted', {
              name: config.name,
              container: slot.container,
              hydrated: false,
            });
          }
        })
      );
    },
  };

  registerModule(config.name, module);

  return module;
}

// ─── createSsrSvelteMicroApp ─────────────────────────

/**
 * Same as {@link createSvelteMicroApp} with `ssr: true`: when the container
 * already holds server-rendered markup, the component hydrates it instead of
 * rendering a second copy.
 *
 * - **Svelte 5**: `hydrate(App, { target, props })` from `svelte`. Render the
 *   server HTML with `renderSvelteToString` from `@tuvix.js/svelte/server`
 *   (Svelte 5 needs its hydration comments in the markup).
 * - **Svelte 3/4**: `new App({ target, props, hydrate: true })`. Compile the
 *   component with `hydratable: true`.
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
  config: Omit<SvelteMicroAppConfig, 'ssr'>
): MicroAppModule {
  return createSvelteMicroApp({ ...config, ssr: true });
}

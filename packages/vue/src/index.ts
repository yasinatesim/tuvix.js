import type { Component, App, ShallowRef } from 'vue';
import {
  createApp,
  createSSRApp,
  nextTick,
  onMounted,
  onUnmounted,
  shallowReactive,
  shallowRef,
} from 'vue';
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
import type { IEventBus, EventHandler, Unsubscribe } from '@tuvix.js/event-bus';
import { TUVIX_PROPS_KEY, createRootComponent, installPlugins } from './root';
import type { VuePluginEntry } from './root';

export { TUVIX_PROPS_KEY };
export type { VuePluginEntry };

// ─── Types ──────────────────────────────────────────

export interface VueMicroAppConfig {
  /** Unique name for the micro app */
  name: string;

  /** Root Vue component */
  App: Component;

  /**
   * Vue plugins to install. Each container gets its own Vue app, so every
   * mount runs each plugin's `install` again.
   */
  plugins?: VuePluginEntry[];

  /** Optional one-time setup */
  bootstrap?: () => void | Promise<void>;

  /**
   * Hydrate server-rendered markup with `createSSRApp` when the container has
   * any. An empty container always gets a fresh `createApp` render.
   * Defaults to `false`; `createSsrVueMicroApp` sets it to `true`.
   */
  ssr?: boolean;
}

/** Config for {@link createSsrVueMicroApp}. `ssr` is always on. */
export type VueSsrMicroAppConfig = Omit<VueMicroAppConfig, 'ssr'>;

interface VueInstance {
  app: App;
  props: Record<string, unknown>;
  hydrated: boolean;
}

/**
 * Mount `app` and throw the first error raised during the mount. Production
 * builds of Vue only log setup, render and hook errors; this makes them reach
 * the caller in every build. A user `errorHandler` still runs. A failed app is
 * unmounted again.
 */
function mountStrict(app: App, container: HTMLElement): void {
  const userHandler = app.config.errorHandler;
  let failed = false;
  let firstError: unknown;
  app.config.errorHandler = (error, instance, info) => {
    if (!failed) {
      failed = true;
      firstError = error;
    }
    userHandler?.(error, instance, info);
  };
  try {
    app.mount(container);
  } finally {
    app.config.errorHandler = userHandler;
  }
  if (failed) {
    app.unmount();
    throw firstError;
  }
}

function replaceProps(
  target: Record<string, unknown>,
  next: Record<string, unknown>
): void {
  for (const key of Object.keys(target)) {
    if (!(key in next)) delete target[key];
  }
  Object.assign(target, next);
}

// ─── createVueMicroApp ──────────────────────────────

/**
 * Create a Tuvix.js micro app module from a Vue 3 component.
 *
 * Every container gets its own Vue app, so one module can mount in several
 * places at once. Props live in a `shallowReactive` object: `update({ props })`
 * re-renders `App` with the new values, and `inject('tuvixProps')` returns the
 * same reactive object. With `ssr: true`, Vue hydrates server markup found in
 * the container. Mount, unmount and failures dispatch `tuvix:mounted`,
 * `tuvix:unmounted` and `tuvix:error` on the container.
 *
 * @example
 * ```ts
 * import { createVueMicroApp } from '@tuvix.js/vue';
 * import { createPinia } from 'pinia';
 * import App from './App.vue';
 *
 * export default createVueMicroApp({
 *   name: 'settings',
 *   App,
 *   plugins: [createPinia()],
 * });
 * ```
 */
export function createVueMicroApp(config: VueMicroAppConfig): MicroAppModule {
  const { name } = config;
  const instances = new WeakMap<HTMLElement, VueInstance>();
  // A WeakMap cannot be iterated; `update` without a container reaches every live instance.
  const live = new Set<VueInstance>();

  function teardown(container: HTMLElement, instance: VueInstance): void {
    instances.delete(container);
    live.delete(instance);
    try {
      instance.app.unmount();
    } catch (error) {
      emitLifecycle('error', {
        name,
        container,
        hydrated: instance.hydrated,
        error,
      });
      throw error;
    } finally {
      // The instance is gone either way, so the app must not stay counted as mounted.
      container.replaceChildren();
      emitLifecycle('unmounted', {
        name,
        container,
        hydrated: instance.hydrated,
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
      // Mounting runs synchronously after this point, so no unmount can
      // interleave and leave an orphan app behind.
      const previous = instances.get(container);
      if (previous) teardown(container, previous);

      const hydrated = config.ssr === true && hasServerMarkup(container);

      try {
        const reactiveProps = shallowReactive<Record<string, unknown>>({
          ...props,
        });
        const root = createRootComponent(config.App, reactiveProps);
        const app = hydrated ? createSSRApp(root) : createApp(root);
        installPlugins(app, config.plugins);
        mountStrict(app, container);

        const instance: VueInstance = {
          app,
          props: reactiveProps,
          hydrated,
        };
        instances.set(container, instance);
        live.add(instance);
      } catch (error) {
        emitLifecycle('error', { name, container, hydrated, error });
        throw error;
      }

      emitLifecycle('mounted', { name, container, hydrated });
    },

    async unmount({ container }: UnmountContext) {
      const instance = instances.get(container);
      if (instance) teardown(container, instance);
    },

    async update({ props, container }: UpdateContext) {
      // Update only that container when the caller names one, else every mount.
      let targets: VueInstance[];
      if (container) {
        const instance = instances.get(container);
        targets = instance ? [instance] : [];
      } else {
        targets = Array.from(live);
      }
      for (const instance of targets) {
        replaceProps(instance.props, props);
      }
      // Resolve after Vue has flushed the re-render.
      await nextTick();
    },
  };

  registerModule(name, module);

  return module;
}

// ─── createSsrVueMicroApp ────────────────────────────

/**
 * Create a Tuvix.js micro app module that hydrates server-rendered HTML.
 *
 * Same as `createVueMicroApp({ ...config, ssr: true })`. When the container
 * holds markup from `renderVueToString`, Vue adopts those DOM nodes through
 * `createSSRApp`. An empty container gets a normal client render.
 *
 * @example
 * ```ts
 * import { createSsrVueMicroApp } from '@tuvix.js/vue';
 * import App from './App.vue';
 *
 * export default createSsrVueMicroApp({
 *   name: 'contact',
 *   App,
 * });
 * ```
 */
export function createSsrVueMicroApp(
  config: VueSsrMicroAppConfig
): MicroAppModule {
  return createVueMicroApp({ ...config, ssr: true });
}

// ─── Composables ────────────────────────────────────

/**
 * Vue composable for listening to Tuvix.js event bus events.
 * Automatically unsubscribes on component unmount.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useTuvixBus } from '@tuvix.js/vue';
 *
 * useTuvixBus(bus, 'cart:updated', (data) => {
 *   console.log('Cart updated:', data);
 * });
 * </script>
 * ```
 */
export function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): Unsubscribe {
  let unsub: Unsubscribe | null = null;

  onMounted(() => {
    unsub = bus.on<T>(event, handler);
  });

  onUnmounted(() => {
    unsub?.();
  });

  return () => unsub?.();
}

/**
 * Vue composable for reactive Tuvix.js orchestrator props.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useTuvixProps } from '@tuvix.js/vue';
 *
 * const props = useTuvixProps({ theme: 'dark' });
 * </script>
 * ```
 */
export function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent = 'tuvix:props:update'
): ShallowRef<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = shallowRef({ ...initialProps }) as any as ShallowRef<T>;
  let unsub: Unsubscribe | null = null;

  onMounted(() => {
    if (!bus) return;
    unsub = bus.on<T>(updateEvent, (newProps: T) => {
      props.value = { ...props.value, ...newProps };
    });
  });

  onUnmounted(() => {
    unsub?.();
  });

  return props;
}

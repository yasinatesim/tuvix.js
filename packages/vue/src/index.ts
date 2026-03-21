import type { Component, App, Plugin, ShallowRef } from 'vue';
import { onMounted, onUnmounted, shallowRef } from 'vue';
import type { MicroAppModule, MountContext, UnmountContext, UpdateContext } from '@tuvix.js/loader';
import type { IEventBus, EventHandler, Unsubscribe } from '@tuvix.js/event-bus';

// ─── Types ──────────────────────────────────────────

export interface VueMicroAppConfig {
  /** Unique name for the micro app */
  name: string;

  /** Root Vue component */
  App: Component;

  /** Vue plugins to install */
  plugins?: Plugin[];

  /** Optional one-time setup */
  bootstrap?: () => void | Promise<void>;
}

/** Extended config for SSR-enabled Vue micro apps (same shape, alias for clarity) */
export type VueSsrMicroAppConfig = VueMicroAppConfig;

// ─── createVueMicroApp ──────────────────────────────

/**
 * Create a Tuvix.js micro app module from a Vue 3 component.
 *
 * Handles `createApp` / `app.mount` / `app.unmount` lifecycle automatically.
 *
 * @example
 * ```ts
 * import { createVueMicroApp } from '@tuvix.js/vue';
 * import App from './App.vue';
 * import { createPinia } from 'pinia';
 *
 * export default createVueMicroApp({
 *   name: 'settings',
 *   App,
 *   plugins: [createPinia()],
 * });
 * ```
 */
export function createVueMicroApp(config: VueMicroAppConfig): MicroAppModule {
  let app: App | null = null;

  const module: MicroAppModule = {
    async bootstrap() {
      if (config.bootstrap) {
        await config.bootstrap();
      }
    },

    async mount({ container, props }: MountContext) {
      const { createApp } = await import('vue');

      app = createApp(config.App, { ...props });

      if (config.plugins) {
        for (const plugin of config.plugins) {
          app.use(plugin);
        }
      }

      // Provide orchestrator props globally
      if (props) {
        app.provide('tuvixProps', props);
      }

      app.mount(container);
    },

    async unmount({ container }: UnmountContext) {
      app?.unmount();
      app = null;
      container.innerHTML = '';
    },

    async update({ props }: UpdateContext) {
      if (app) {
        // Update global properties for reactive access
        app.config.globalProperties.$tuvixProps = props;
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

// ─── createSsrVueMicroApp ────────────────────────────

/**
 * Create a Tuvix.js micro app module from a Vue 3 component with SSR hydration support.
 *
 * Uses `createSSRApp` instead of `createApp` so Vue hydrates existing server-rendered
 * HTML rather than re-rendering from scratch. Drop-in replacement for `createVueMicroApp`
 * when the container already contains SSR markup.
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
export function createSsrVueMicroApp(config: VueMicroAppConfig): MicroAppModule {
  let app: App | null = null;

  const module: MicroAppModule = {
    async bootstrap() {
      if (config.bootstrap) {
        await config.bootstrap();
      }
    },

    async mount({ container, props }: MountContext) {
      const { createSSRApp } = await import('vue');

      app = createSSRApp(config.App, { ...props });

      if (config.plugins) {
        for (const plugin of config.plugins) {
          app.use(plugin);
        }
      }

      // Provide orchestrator props globally
      if (props) {
        app.provide('tuvixProps', props);
      }

      // Vue SSR mode: automatically hydrates if SSR content already exists in container
      app.mount(container);
    },

    async unmount({ container }: UnmountContext) {
      app?.unmount();
      app = null;
      container.innerHTML = '';
    },

    async update({ props }: UpdateContext) {
      if (app) {
        // Update global properties for reactive access
        app.config.globalProperties.$tuvixProps = props;
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

// ─── renderVueToString ───────────────────────────────

/**
 * Render a Vue component to an HTML string on the server.
 *
 * Returns an empty string when called in a browser environment so it is safe
 * to import in isomorphic route loaders.
 *
 * Requires `@vue/server-renderer` to be installed as an optional peer dependency.
 *
 * @example
 * ```ts
 * // routes/iletisim.tsx
 * export const Route = createFileRoute('/iletisim')({
 *   loader: async () => {
 *     const { renderVueToString } = await import('@tuvix.js/vue');
 *     const { default: ContactApp } = await import('~/micro-apps/contact/App.vue');
 *     return { ssrHtml: await renderVueToString(ContactApp) };
 *   },
 * });
 * ```
 */
export async function renderVueToString(
  App: Component,
  props?: Record<string, unknown>,
  plugins?: Plugin[]
): Promise<string> {
  // Guard: only runs on the server
  if (typeof window !== 'undefined') return '';

  const { createSSRApp } = await import('vue');
  const { renderToString } = await import('@vue/server-renderer');

  const app = createSSRApp(App, props ?? {});

  if (plugins) {
    for (const plugin of plugins) {
      app.use(plugin);
    }
  }

  return await renderToString(app);
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

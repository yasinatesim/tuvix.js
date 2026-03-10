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

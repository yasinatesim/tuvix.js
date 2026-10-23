import { defineComponent, h, provide } from 'vue';
import type { App, Component, Plugin } from 'vue';

/**
 * Injection key for the orchestrator props. `inject(TUVIX_PROPS_KEY)` returns
 * the reactive props object that `update({ props })` writes to.
 *
 * @example
 * ```ts
 * import { inject } from 'vue';
 * import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';
 *
 * const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY);
 * ```
 */
export const TUVIX_PROPS_KEY = 'tuvixProps';

/**
 * Wrap `App` in a root component that provides `props` and passes them to `App`.
 *
 * The client and the server renderer both use this wrapper, so the component
 * tree matches during hydration. The wrapper renders no DOM of its own.
 * Pass a `shallowReactive` object on the client: the render function reads it,
 * so replacing a key re-renders `App`.
 */
export function createRootComponent(
  App: Component,
  props: Record<string, unknown>
): Component {
  return defineComponent({
    name: 'TuvixRoot',
    setup() {
      provide(TUVIX_PROPS_KEY, props);
      return () => h(App, { ...props });
    },
  });
}

/**
 * A Vue plugin, or a plugin plus the options for `app.use(plugin, ...options)`.
 *
 * @example
 * ```ts
 * import type { VuePluginEntry } from '@tuvix.js/vue';
 * import { createPinia } from 'pinia';
 *
 * const plugins: VuePluginEntry[] = [createPinia()];
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VuePluginEntry = Plugin | [Plugin, ...any[]];

/** Install `plugins` on `app`, spreading tuple options into `app.use`. */
export function installPlugins(
  app: App,
  plugins: VuePluginEntry[] | undefined
): void {
  if (!plugins) return;
  for (const entry of plugins) {
    if (Array.isArray(entry)) {
      const [plugin, ...options] = entry;
      app.use(plugin, ...options);
    } else {
      app.use(entry);
    }
  }
}

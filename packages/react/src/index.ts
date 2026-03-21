import type { ComponentType, ReactElement } from 'react';
import { createElement, useEffect, useRef, useState } from 'react';
import type { MicroAppModule, MountContext, UnmountContext, UpdateContext } from '@tuvix.js/loader';
import type { IEventBus, EventHandler, Unsubscribe } from '@tuvix.js/event-bus';

// ─── Types ──────────────────────────────────────────

export interface ReactMicroAppConfig {
  /** Unique name for the micro app */
  name: string;

  /** Root React component to render */
  App: ComponentType<Record<string, unknown>>;

  /** Optional one-time setup */
  bootstrap?: () => void | Promise<void>;

  /**
   * Enable SSR hydration mode.
   *
   * When `true`, the `mount()` lifecycle uses `hydrateRoot()` instead of
   * `createRoot()` if the container already contains server-rendered HTML.
   * Use this when the micro app is pre-rendered by a framework like
   * TanStack Start, Next.js, or Remix.
   *
   * @default false
   */
  ssr?: boolean;
}

// ─── createReactMicroApp ────────────────────────────

/**
 * Create a Tuvix.js micro app module from a React component.
 *
 * Handles `createRoot` / `hydrateRoot` / `root.render` / `root.unmount`
 * lifecycle automatically. Props from the orchestrator are passed as
 * component props.
 *
 * @example
 * ```tsx
 * // Client-side only (default)
 * export default createReactMicroApp({ name: 'dashboard', App });
 *
 * // With SSR hydration support
 * export default createReactMicroApp({ name: 'dashboard', App, ssr: true });
 * ```
 */
export function createReactMicroApp(config: ReactMicroAppConfig): MicroAppModule {
  let root: ReturnType<typeof import('react-dom/client').createRoot> | null = null;

  const module: MicroAppModule = {
    async bootstrap() {
      if (config.bootstrap) {
        await config.bootstrap();
      }
    },

    async mount({ container, props }: MountContext) {
      const { createRoot, hydrateRoot } = await import('react-dom/client');

      const element = createElement(config.App, { ...props });
      const hasSSRContent = config.ssr === true && container.hasChildNodes();

      if (hasSSRContent) {
        // Hydrate server-rendered HTML — preserves SEO content
        root = hydrateRoot(container, element);
      } else {
        root = createRoot(container);
        root.render(element);
      }
    },

    async unmount({ container }: UnmountContext) {
      root?.unmount();
      root = null;
      container.innerHTML = '';
    },

    async update({ props }: UpdateContext) {
      if (root) {
        root.render(createElement(config.App, { ...props }));
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

/**
 * Convenience wrapper for `createReactMicroApp` with `ssr: true`.
 *
 * Use this when the micro app's container will have server-rendered HTML
 * that React should hydrate instead of replacing.
 *
 * @example
 * ```tsx
 * // src/micro-apps/github/index.ts
 * export default createSsrReactMicroApp({ name: 'github-app', App });
 * ```
 */
export function createSsrReactMicroApp(config: Omit<ReactMicroAppConfig, 'ssr'>): MicroAppModule {
  return createReactMicroApp({ ...config, ssr: true });
}

// ─── TuvixReactApp ───────────────────────────────────

/**
 * A React component wrapper that renders a React micro app inline.
 *
 * **Use this in SSR frameworks** (TanStack Start, Next.js, Remix) so that
 * micro app content is server-rendered and SEO-indexed. The orchestrator
 * can later take over via `hydrateRoot` when the IIFE bundle is loaded.
 *
 * The rendered `<div>` carries a `data-tuvix-app` attribute so the
 * orchestrator knows which container belongs to which micro app.
 *
 * For Svelte, Vue, and Angular micro apps, render to a string on the server
 * using `renderSvelteToString`, `renderVueToString`, or `renderAngularToString`
 * and inject the HTML into a `data-tuvix-app` container div.
 *
 * @example
 * ```tsx
 * // TanStack Start route file
 * import { TuvixReactApp } from '@tuvix.js/react';
 * import { GithubPage } from '~/micro-apps/github/App';
 *
 * export const Route = createFileRoute('/github')({
 *   head: () => ({ meta: [...seo({ title: 'GitHub' })] }),
 *   component: () => <TuvixReactApp name="github-app" App={GithubPage} />,
 * });
 * ```
 */
export function TuvixReactApp<P extends Record<string, unknown>>({
  name,
  App,
  ...props
}: {
  /** Micro app name — must match the name in createReactMicroApp */
  name: string;
  /** React component to render */
  App: ComponentType<P>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} & P): ReactElement<any> {
  return createElement(
    'div',
    { 'data-tuvix-app': name },
    createElement(App, props as unknown as P),
  );
}

// ─── Hooks ──────────────────────────────────────────

/**
 * React hook to subscribe to Tuvix.js event bus events.
 * Automatically unsubscribes on component unmount.
 *
 * @example
 * ```tsx
 * import { useTuvixBus } from '@tuvix.js/react';
 *
 * function MyComponent({ bus }) {
 *   useTuvixBus(bus, 'user:login', (data) => {
 *     console.log('User logged in:', data);
 *   });
 * }
 * ```
 */
export function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): void {
  const savedHandler = useRef<EventHandler<T>>(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventHandler: EventHandler<T> = (data: T) => {
      savedHandler.current(data);
    };

    const unsub: Unsubscribe = bus.on<T>(event, eventHandler);
    return () => unsub();
  }, [bus, event]);
}

/**
 * React hook to get the current props from the orchestrator.
 * Returns a reactive ref that updates when props change.
 *
 * @example
 * ```tsx
 * import { useTuvixProps } from '@tuvix.js/react';
 *
 * function MyComponent({ initialProps, bus }) {
 *   const props = useTuvixProps(initialProps, bus);
 *   return <div>{props.theme}</div>;
 * }
 * ```
 */
export function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent = 'tuvix:props:update'
): T {
  const [props, setProps] = useState<T>(initialProps);

  useEffect(() => {
    if (!bus) return;

    const unsub: Unsubscribe = bus.on<T>(updateEvent, (newProps: T) => {
      setProps((prev: T) => ({ ...prev, ...newProps }));
    });

    return () => unsub();
  }, [bus, updateEvent]);

  return props;
}

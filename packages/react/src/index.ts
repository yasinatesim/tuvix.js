import type { ComponentType } from 'react';
import { useEffect, useRef, useState } from 'react';
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
}

// ─── createReactMicroApp ────────────────────────────

/**
 * Create a Tuvix.js micro app module from a React component.
 *
 * Handles `createRoot` / `root.render` / `root.unmount` lifecycle
 * automatically. Props from the orchestrator are passed as component props.
 *
 * @example
 * ```tsx
 * import { createReactMicroApp } from '@tuvix.js/react';
 * import App from './App';
 *
 * export default createReactMicroApp({
 *   name: 'dashboard',
 *   App,
 * });
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
      const { createRoot } = await import('react-dom/client');
      const { createElement } = await import('react');

      root = createRoot(container);
      root.render(createElement(config.App, { ...props }));
    },

    async unmount({ container }: UnmountContext) {
      root?.unmount();
      root = null;
      container.innerHTML = '';
    },

    async update({ props }: UpdateContext) {
      if (root) {
        const { createElement } = await import('react');
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


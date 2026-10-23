import { useEffect, useRef, useState } from 'react';
import type { IEventBus, EventHandler, Unsubscribe } from '@tuvix.js/event-bus';

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

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * Wildcard event handler that receives event name and data
 */
export type WildcardHandler<T = unknown> = (
  eventName: string,
  data: T
) => void;

/**
 * Unsubscribe function returned by on/once methods
 */
export type Unsubscribe = () => void;

/**
 * Event bus configuration options
 */
export interface EventBusOptions {
  /** Maximum number of listeners per event (0 = unlimited) */
  maxListeners?: number;

  /** Enable debug logging */
  debug?: boolean;

  /** Custom logger function */
  logger?: (message: string, ...args: unknown[]) => void;
}

/**
 * Event bus interface
 */
export interface IEventBus {
  /** Subscribe to an event */
  on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;

  /** Subscribe to an event, auto-unsubscribe after first call */
  once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe;

  /** Emit an event with data */
  emit<T = unknown>(event: string, data?: T): void;

  /** Unsubscribe a specific handler from an event */
  off<T = unknown>(event: string, handler: EventHandler<T>): void;

  /** Unsubscribe all handlers for an event, or all events */
  offAll(event?: string): void;

  /** Listen to ALL events (wildcard) */
  onAny<T = unknown>(handler: WildcardHandler<T>): Unsubscribe;

  /** Remove a wildcard listener */
  offAny<T = unknown>(handler: WildcardHandler<T>): void;

  /** Check if an event has listeners */
  hasListeners(event: string): boolean;

  /** Get the number of listeners for an event */
  listenerCount(event: string): number;

  /** Get all registered event names */
  eventNames(): string[];

  /** Destroy the event bus, remove all listeners */
  destroy(): void;
}

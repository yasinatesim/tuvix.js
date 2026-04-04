import type {
  EventHandler,
  WildcardHandler,
  Unsubscribe,
  EventBusOptions,
  IEventBus,
} from './types';

/**
 * A lightweight, type-safe event bus for inter-app communication.
 *
 * @example
 * ```ts
 * const bus = new EventBus();
 *
 * const unsub = bus.on('user:login', (data) => {
 *   console.log(data.name);
 * });
 *
 * bus.emit('user:login', { name: 'Ahmet', id: 42 });
 * unsub();
 * ```
 */
export class EventBus implements IEventBus {
  private handlers: Map<string, Set<EventHandler>>;
  private wildcardHandlers: Set<WildcardHandler>;
  private options: Required<EventBusOptions>;
  private destroyed: boolean;

  constructor(options: EventBusOptions = {}) {
    this.handlers = new Map();
    this.wildcardHandlers = new Set();
    this.destroyed = false;

    this.options = {
      maxListeners: options.maxListeners ?? 0,
      debug: options.debug ?? false,
      logger: options.logger ?? console.log.bind(console),
    };
  }

  /**
   * Subscribe to an event.
   * Returns an unsubscribe function.
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe {
    this.ensureAlive();
    this.validateEvent(event);
    this.validateHandler(handler);

    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    const handlers = this.handlers.get(event)!;

    if (
      this.options.maxListeners > 0 &&
      handlers.size >= this.options.maxListeners
    ) {
      this.log(
        `Warning: Max listeners (${this.options.maxListeners}) reached for event "${event}"`
      );
    }

    handlers.add(handler as EventHandler);
    this.log(`Listener added for "${event}" (total: ${handlers.size})`);

    return () => {
      this.off(event, handler);
    };
  }

  /**
   * Subscribe to an event, but only fire once.
   * Automatically unsubscribes after the first emission.
   */
  once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe {
    this.ensureAlive();

    const wrappedHandler: EventHandler<T> = (data: T) => {
      this.off(event, wrappedHandler);
      handler(data);
    };

    return this.on<T>(event, wrappedHandler);
  }

  /**
   * Emit an event with optional data.
   * All registered handlers for this event will be called synchronously.
   */
  emit<T = unknown>(event: string, data?: T): void {
    this.ensureAlive();
    this.validateEvent(event);

    this.log(`Emitting "${event}"`, data);

    const handlers = this.handlers.get(event);
    if (handlers) {
      const handlersCopy = new Set(handlers);
      for (const handler of handlersCopy) {
        try {
          handler(data);
        } catch (error) {
          console.error(
            `[Tuvix EventBus] Error in handler for "${event}":`,
            error
          );
        }
      }
    }

    if (this.wildcardHandlers.size > 0) {
      const wildcardCopy = new Set(this.wildcardHandlers);
      for (const handler of wildcardCopy) {
        try {
          handler(event, data);
        } catch (error) {
          console.error(
            `[Tuvix EventBus] Error in wildcard handler for "${event}":`,
            error
          );
        }
      }
    }
  }

  /**
   * Remove a specific handler from an event.
   */
  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      this.log(`Listener removed for "${event}" (remaining: ${handlers.size})`);

      if (handlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  /**
   * Remove all handlers for a specific event, or all events if no event specified.
   */
  offAll(event?: string): void {
    if (event) {
      this.handlers.delete(event);
      this.log(`All listeners removed for "${event}"`);
    } else {
      this.handlers.clear();
      this.wildcardHandlers.clear();
      this.log('All listeners removed');
    }
  }

  /**
   * Listen to ALL events (wildcard listener).
   * Handler receives both event name and data.
   */
  onAny<T = unknown>(handler: WildcardHandler<T>): Unsubscribe {
    this.ensureAlive();
    this.validateHandler(handler);

    this.wildcardHandlers.add(handler as WildcardHandler);
    this.log(`Wildcard listener added (total: ${this.wildcardHandlers.size})`);

    return () => {
      this.offAny(handler);
    };
  }

  /**
   * Remove a wildcard listener.
   */
  offAny<T = unknown>(handler: WildcardHandler<T>): void {
    this.wildcardHandlers.delete(handler as WildcardHandler);
    this.log(
      `Wildcard listener removed (remaining: ${this.wildcardHandlers.size})`
    );
  }

  /**
   * Check if an event has any registered listeners.
   */
  hasListeners(event: string): boolean {
    const handlers = this.handlers.get(event);
    return handlers !== undefined && handlers.size > 0;
  }

  /**
   * Get the count of listeners for a specific event.
   */
  listenerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0;
  }

  /**
   * Get all event names that have registered listeners.
   */
  eventNames(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Destroy the event bus. Removes all listeners and prevents further usage.
   */
  destroy(): void {
    this.offAll();
    this.destroyed = true;
    this.log('EventBus destroyed');
  }

  private ensureAlive(): void {
    if (this.destroyed) {
      throw new Error(
        '[Tuvix EventBus] Cannot use a destroyed EventBus instance. Create a new one.'
      );
    }
  }

  private validateEvent(event: string): void {
    if (typeof event !== 'string' || event.trim().length === 0) {
      throw new Error(
        '[Tuvix EventBus] Event name must be a non-empty string.'
      );
    }
  }

  private validateHandler(handler: unknown): void {
    if (typeof handler !== 'function') {
      throw new Error('[Tuvix EventBus] Handler must be a function.');
    }
  }

  private log(message: string, ...args: unknown[]): void {
    if (this.options.debug) {
      this.options.logger(`[Tuvix EventBus] ${message}`, ...args);
    }
  }
}

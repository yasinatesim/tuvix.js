import { EventBus } from './event-bus';
import type { EventBusOptions, IEventBus } from './types';

/**
 * Create a new EventBus instance.
 *
 * @example
 * ```ts
 * import { createEventBus } from '@tuvix.js/event-bus';
 *
 * const bus = createEventBus();
 * bus.on('hello', (name) => console.log(`Hello, ${name}!`));
 * bus.emit('hello', 'World');
 * ```
 */
export function createEventBus(options?: EventBusOptions): IEventBus {
  return new EventBus(options);
}

let globalBus: IEventBus | null = null;

/**
 * Get or create the global shared event bus singleton.
 * Useful for cross-app communication where all micro apps
 * need to share the same bus instance.
 */
export function getGlobalBus(options?: EventBusOptions): IEventBus {
  if (!globalBus) {
    globalBus = new EventBus(options);
  }
  return globalBus;
}

/**
 * Reset the global event bus singleton.
 * Primarily useful for testing.
 */
export function resetGlobalBus(): void {
  if (globalBus) {
    globalBus.destroy();
    globalBus = null;
  }
}

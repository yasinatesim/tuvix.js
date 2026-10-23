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

// Separately bundled micro apps each get their own copy of this module.
// Keeping the singleton on `window` gives every copy the same bus.
const GLOBAL_KEY = '__TUVIX_GLOBAL_BUS__';

type GlobalBusHolder = { [GLOBAL_KEY]?: IEventBus | null };

const serverHolder: GlobalBusHolder = {};

function holder(): GlobalBusHolder {
  return typeof window === 'undefined'
    ? serverHolder
    : (window as unknown as GlobalBusHolder);
}

/**
 * Get or create the global shared event bus singleton.
 * Every copy of `@tuvix.js/event-bus` on the page returns the same instance,
 * and the orchestrator uses it unless you pass `eventBus` options.
 * `options` only apply when this call creates the bus.
 */
export function getGlobalBus(options?: EventBusOptions): IEventBus {
  const h = holder();
  let bus = h[GLOBAL_KEY];
  if (!bus) {
    bus = new EventBus(options);
    h[GLOBAL_KEY] = bus;
  }
  return bus;
}

/**
 * Reset the global event bus singleton.
 * Primarily useful for testing.
 */
export function resetGlobalBus(): void {
  const h = holder();
  const bus = h[GLOBAL_KEY];
  if (bus) {
    bus.destroy();
    h[GLOBAL_KEY] = null;
  }
}

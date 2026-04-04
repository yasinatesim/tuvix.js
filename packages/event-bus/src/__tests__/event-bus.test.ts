import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  EventBus,
  createEventBus,
  getGlobalBus,
  resetGlobalBus,
} from '../index';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  // ─── on / emit ──────────────────────────────────

  describe('on & emit', () => {
    it('should call handler when event is emitted', () => {
      const handler = vi.fn();
      bus.on('test', handler);
      bus.emit('test', { value: 42 });

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith({ value: 42 });
    });

    it('should support multiple handlers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      bus.on('test', handler1);
      bus.on('test', handler2);
      bus.on('test', handler3);

      bus.emit('test', 'hello');

      expect(handler1).toHaveBeenCalledWith('hello');
      expect(handler2).toHaveBeenCalledWith('hello');
      expect(handler3).toHaveBeenCalledWith('hello');
    });

    it('should not call handler for different events', () => {
      const handler = vi.fn();
      bus.on('event-a', handler);
      bus.emit('event-b', 'data');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should emit without data', () => {
      const handler = vi.fn();
      bus.on('ping', handler);
      bus.emit('ping');

      expect(handler).toHaveBeenCalledWith(undefined);
    });

    it('should handle multiple emissions', () => {
      const handler = vi.fn();
      bus.on('tick', handler);

      bus.emit('tick', 1);
      bus.emit('tick', 2);
      bus.emit('tick', 3);

      expect(handler).toHaveBeenCalledTimes(3);
      expect(handler).toHaveBeenNthCalledWith(1, 1);
      expect(handler).toHaveBeenNthCalledWith(2, 2);
      expect(handler).toHaveBeenNthCalledWith(3, 3);
    });

    it('should not throw when emitting event with no listeners', () => {
      expect(() => bus.emit('nonexistent', 'data')).not.toThrow();
    });

    it('should catch and log errors in handlers without stopping other handlers', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const handler1 = vi.fn();
      const handler2 = vi.fn(() => {
        throw new Error('boom');
      });
      const handler3 = vi.fn();

      bus.on('test', handler1);
      bus.on('test', handler2);
      bus.on('test', handler3);

      bus.emit('test', 'data');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });

  // ─── Unsubscribe ────────────────────────────────

  describe('unsubscribe', () => {
    it('should return unsubscribe function from on()', () => {
      const handler = vi.fn();
      const unsub = bus.on('test', handler);

      bus.emit('test', 'before');
      expect(handler).toHaveBeenCalledTimes(1);

      unsub();

      bus.emit('test', 'after');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should only unsubscribe the specific handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on('test', handler1);
      const unsub2 = bus.on('test', handler2);

      unsub2();
      bus.emit('test', 'data');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should be safe to call unsubscribe multiple times', () => {
      const handler = vi.fn();
      const unsub = bus.on('test', handler);

      unsub();
      expect(() => unsub()).not.toThrow();
    });
  });

  // ─── off ────────────────────────────────────────

  describe('off', () => {
    it('should remove specific handler', () => {
      const handler = vi.fn();
      bus.on('test', handler);
      bus.off('test', handler);

      bus.emit('test', 'data');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should not throw when removing non-existent handler', () => {
      const handler = vi.fn();
      expect(() => bus.off('test', handler)).not.toThrow();
    });

    it('should clean up empty handler sets', () => {
      const handler = vi.fn();
      bus.on('test', handler);
      bus.off('test', handler);

      expect(bus.eventNames()).not.toContain('test');
    });
  });

  // ─── offAll ─────────────────────────────────────

  describe('offAll', () => {
    it('should remove all handlers for a specific event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      bus.on('test', handler1);
      bus.on('test', handler2);
      bus.on('other', handler3);

      bus.offAll('test');

      bus.emit('test', 'data');
      bus.emit('other', 'data');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });

    it('should remove ALL handlers when called without args', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on('event-a', handler1);
      bus.on('event-b', handler2);

      bus.offAll();

      bus.emit('event-a', 'data');
      bus.emit('event-b', 'data');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(bus.eventNames()).toEqual([]);
    });
  });

  // ─── once ───────────────────────────────────────

  describe('once', () => {
    it('should fire handler only once', () => {
      const handler = vi.fn();
      bus.once('test', handler);

      bus.emit('test', 'first');
      bus.emit('test', 'second');
      bus.emit('test', 'third');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('first');
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      const unsub = bus.once('test', handler);

      unsub();
      bus.emit('test', 'data');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should clean up after firing', () => {
      const handler = vi.fn();
      bus.once('test', handler);
      bus.emit('test', 'data');

      expect(bus.hasListeners('test')).toBe(false);
    });
  });

  // ─── onAny / offAny ────────────────────────────

  describe('onAny & offAny', () => {
    it('should receive all events with onAny', () => {
      const wildcardHandler = vi.fn();
      bus.onAny(wildcardHandler);

      bus.emit('event-a', 'data-a');
      bus.emit('event-b', 'data-b');

      expect(wildcardHandler).toHaveBeenCalledTimes(2);
      expect(wildcardHandler).toHaveBeenNthCalledWith(1, 'event-a', 'data-a');
      expect(wildcardHandler).toHaveBeenNthCalledWith(2, 'event-b', 'data-b');
    });

    it('should unsubscribe wildcard handler via returned function', () => {
      const wildcardHandler = vi.fn();
      const unsub = bus.onAny(wildcardHandler);

      bus.emit('test', 'before');
      unsub();
      bus.emit('test', 'after');

      expect(wildcardHandler).toHaveBeenCalledTimes(1);
    });

    it('should remove wildcard handler with offAny', () => {
      const wildcardHandler = vi.fn();
      bus.onAny(wildcardHandler);
      bus.offAny(wildcardHandler);

      bus.emit('test', 'data');
      expect(wildcardHandler).not.toHaveBeenCalled();
    });

    it('should call both specific and wildcard handlers', () => {
      const specificHandler = vi.fn();
      const wildcardHandler = vi.fn();

      bus.on('test', specificHandler);
      bus.onAny(wildcardHandler);

      bus.emit('test', 'data');

      expect(specificHandler).toHaveBeenCalledWith('data');
      expect(wildcardHandler).toHaveBeenCalledWith('test', 'data');
    });
  });

  // ─── Introspection ─────────────────────────────

  describe('introspection', () => {
    it('hasListeners should return correct value', () => {
      expect(bus.hasListeners('test')).toBe(false);

      const unsub = bus.on('test', () => {});
      expect(bus.hasListeners('test')).toBe(true);

      unsub();
      expect(bus.hasListeners('test')).toBe(false);
    });

    it('listenerCount should return correct count', () => {
      expect(bus.listenerCount('test')).toBe(0);

      bus.on('test', () => {});
      bus.on('test', () => {});
      bus.on('test', () => {});

      expect(bus.listenerCount('test')).toBe(3);
    });

    it('eventNames should return all event names', () => {
      bus.on('alpha', () => {});
      bus.on('beta', () => {});
      bus.on('gamma', () => {});

      const names = bus.eventNames();
      expect(names).toContain('alpha');
      expect(names).toContain('beta');
      expect(names).toContain('gamma');
      expect(names).toHaveLength(3);
    });
  });

  // ─── Validation ─────────────────────────────────

  describe('validation', () => {
    it('should throw on empty event name', () => {
      expect(() => bus.on('', () => {})).toThrow();
      expect(() => bus.on('   ', () => {})).toThrow();
    });

    it('should throw on non-function handler', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => bus.on('test', 'not-a-function' as any)).toThrow();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => bus.on('test', null as any)).toThrow();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => bus.on('test', 42 as any)).toThrow();
    });

    it('should throw on emit with empty event name', () => {
      expect(() => bus.emit('')).toThrow();
    });
  });

  // ─── Destroy ────────────────────────────────────

  describe('destroy', () => {
    it('should remove all listeners on destroy', () => {
      bus.on('test', () => {});
      bus.destroy();

      expect(bus.eventNames()).toEqual([]);
    });

    it('should throw when using destroyed bus', () => {
      bus.destroy();
      expect(() => bus.on('test', () => {})).toThrow(/destroyed/);
      expect(() => bus.emit('test')).toThrow(/destroyed/);
      expect(() => bus.once('test', () => {})).toThrow(/destroyed/);
      expect(() => bus.onAny(() => {})).toThrow(/destroyed/);
    });
  });

  // ─── Options ────────────────────────────────────

  describe('options', () => {
    it('should warn when maxListeners is exceeded', () => {
      const logger = vi.fn();
      const limitedBus = new EventBus({
        maxListeners: 2,
        debug: true,
        logger,
      });

      limitedBus.on('test', () => {});
      limitedBus.on('test', () => {});
      limitedBus.on('test', () => {}); // Should warn

      const warningCall = logger.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('Warning')
      );
      expect(warningCall).toBeDefined();
    });

    it('should log events when debug is enabled', () => {
      const logger = vi.fn();
      const debugBus = new EventBus({ debug: true, logger });

      debugBus.on('test', () => {});
      debugBus.emit('test', 'data');

      expect(logger).toHaveBeenCalled();
    });

    it('should not log when debug is disabled', () => {
      const logger = vi.fn();
      const silentBus = new EventBus({ debug: false, logger });

      silentBus.on('test', () => {});
      silentBus.emit('test', 'data');

      expect(logger).not.toHaveBeenCalled();
    });
  });
});

// ─── Factory & Singleton ──────────────────────────

describe('createEventBus', () => {
  it('should create a new EventBus instance', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.on('test', handler);
    bus.emit('test', 'hello');

    expect(handler).toHaveBeenCalledWith('hello');
  });

  it('should pass options', () => {
    const logger = vi.fn();
    const bus = createEventBus({ debug: true, logger });

    bus.on('test', () => {});
    expect(logger).toHaveBeenCalled();
  });
});

describe('globalBus', () => {
  beforeEach(() => {
    resetGlobalBus();
  });

  it('should return the same instance', () => {
    const bus1 = getGlobalBus();
    const bus2 = getGlobalBus();

    expect(bus1).toBe(bus2);
  });

  it('should allow cross-module communication', () => {
    const handler = vi.fn();

    getGlobalBus().on('shared-event', handler);
    getGlobalBus().emit('shared-event', { from: 'app-b' });

    expect(handler).toHaveBeenCalledWith({ from: 'app-b' });
  });

  it('should reset properly', () => {
    const handler = vi.fn();
    getGlobalBus().on('test', handler);

    resetGlobalBus();

    getGlobalBus().emit('test', 'data');
    expect(handler).not.toHaveBeenCalled();
  });
});

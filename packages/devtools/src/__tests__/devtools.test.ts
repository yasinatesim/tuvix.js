import { describe, it, expect } from 'vitest';
import { EventLogger } from '../logger';
import { DevToolsPanel } from '../panel';

describe('EventLogger', () => {
  it('should record events from bus', () => {
    const logger = new EventLogger();

    // Simulate bus.onAny by calling attach with mock bus
    const mockBus = {
      onAny: (handler: (event: string, data: unknown) => void) => {
        handler('test:event', { value: 1 });
        handler('test:event2', { value: 2 });
        return () => {};
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger.attach(mockBus as any);
    expect(logger.getEntries().length).toBe(2);
  });

  it('should return recent entries', () => {
    const logger = new EventLogger(100);
    const mockBus = {
      onAny: (handler: (event: string, data: unknown) => void) => {
        for (let i = 0; i < 10; i++) {
          handler(`event:${i}`, {});
        }
        return () => {};
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger.attach(mockBus as any);
    expect(logger.getRecent(3).length).toBe(3);
  });

  it('should clear entries', () => {
    const logger = new EventLogger();
    const mockBus = {
      onAny: (handler: (event: string, data: unknown) => void) => {
        handler('test:event', {});
        return () => {};
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger.attach(mockBus as any);
    expect(logger.getEntries().length).toBe(1);
    logger.clear();
    expect(logger.getEntries().length).toBe(0);
  });
});

describe('DevToolsPanel', () => {
  it('should mount and unmount', () => {
    const panel = new DevToolsPanel();
    panel.mount();
    expect(document.getElementById('tuvix-devtools')).not.toBeNull();
    panel.unmount();
    expect(document.getElementById('tuvix-devtools')).toBeNull();
  });

  it('should not duplicate on double mount', () => {
    const panel = new DevToolsPanel();
    panel.mount();
    panel.mount();
    expect(document.querySelectorAll('#tuvix-devtools').length).toBe(1);
    panel.unmount();
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(async () => {
  const { resetGlobalBus } = await import('../create-event-bus');
  resetGlobalBus();
  vi.resetModules();
});

describe('getGlobalBus across bundles', () => {
  it('returns the same bus from two separately loaded copies of the module', async () => {
    const first = await import('../create-event-bus');
    vi.resetModules();
    const second = await import('../create-event-bus');
    // Two module instances, as with two separately bundled micro apps.
    expect(second).not.toBe(first);

    const handler = vi.fn();
    first.getGlobalBus().on('cart:add', handler);
    second.getGlobalBus().emit('cart:add', { id: 1 });

    expect(second.getGlobalBus()).toBe(first.getGlobalBus());
    expect(handler).toHaveBeenCalledWith({ id: 1 });
  });

  it('resetGlobalBus from one copy gives every copy a fresh bus', async () => {
    const first = await import('../create-event-bus');
    vi.resetModules();
    const second = await import('../create-event-bus');

    const before = first.getGlobalBus();
    second.resetGlobalBus();

    expect(() => before.emit('x')).toThrow(/destroyed/);
    expect(first.getGlobalBus()).not.toBe(before);
    expect(first.getGlobalBus()).toBe(second.getGlobalBus());
  });
});

describe('global bus storage', () => {
  it('lives on window.__TUVIX_GLOBAL_BUS__ so any bundle can find it', async () => {
    const { getGlobalBus } = await import('../create-event-bus');
    const bus = getGlobalBus();
    expect(
      (window as unknown as { __TUVIX_GLOBAL_BUS__?: unknown })
        .__TUVIX_GLOBAL_BUS__
    ).toBe(bus);
  });
});

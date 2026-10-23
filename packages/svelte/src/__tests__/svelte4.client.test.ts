import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LifecycleDetail } from '@tuvix.js/loader';
import { createSsrSvelteMicroApp, createSvelteMicroApp } from '../index';

// Svelte 3/4 'svelte' exports no `mount`; the adapter must pick the class API.
const { tick } = vi.hoisted(() => ({ tick: vi.fn(async () => {}) }));
vi.mock('svelte', () => ({ tick }));

interface Options {
  target: HTMLElement;
  props: Record<string, unknown>;
  hydrate: boolean;
}

const created: FakeComponent[] = [];

/** Behaves like a compiled Svelte 4 component: renders `<p>Hello {name}</p>`. */
class FakeComponent {
  readonly options: Options;
  readonly sets: Record<string, unknown>[] = [];
  props: Record<string, unknown>;
  destroyed = false;
  private readonly p: HTMLParagraphElement;

  constructor(options: Options) {
    this.options = options;
    this.props = { ...options.props };
    const existing = options.target.querySelector('p');
    if (options.hydrate && existing) {
      this.p = existing;
    } else {
      this.p = document.createElement('p');
      options.target.appendChild(this.p);
    }
    this.render();
    created.push(this);
  }

  $set(patch: Record<string, unknown>): void {
    this.sets.push(patch);
    this.props = { ...this.props, ...patch };
    this.render();
  }

  $destroy(): void {
    this.destroyed = true;
    this.p.remove();
  }

  private render(): void {
    this.p.textContent = `Hello ${String(this.props.name ?? 'world')}`;
  }
}

const containers: HTMLElement[] = [];

function makeContainer(html = ''): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.appendChild(el);
  containers.push(el);
  return el;
}

afterEach(() => {
  for (const el of containers.splice(0)) el.remove();
  created.length = 0;
});

describe('createSvelteMicroApp with Svelte 3/4', () => {
  it('constructs the class into the container', async () => {
    const container = makeContainer();
    const app = createSvelteMicroApp({ name: 'sv4-mount', App: FakeComponent });

    await app.mount({ container, props: { name: 'Ada' } });

    expect(created).toHaveLength(1);
    expect(created[0]?.options).toEqual({
      target: container,
      props: { name: 'Ada' },
      hydrate: false,
    });
    expect(container.querySelector('p')?.textContent).toBe('Hello Ada');
  });

  it('updates through $set, clears dropped props, and waits for tick', async () => {
    const container = makeContainer();
    const app = createSvelteMicroApp({
      name: 'sv4-update',
      App: FakeComponent,
    });
    await app.mount({ container, props: { name: 'Ada', theme: 'dark' } });
    tick.mockClear();

    await app.update?.({ props: { name: 'Grace' } });

    expect(created[0]?.sets).toStrictEqual([
      { theme: undefined, name: 'Grace' },
    ]);
    expect(tick).toHaveBeenCalledTimes(1);
    expect(container.querySelector('p')?.textContent).toBe('Hello Grace');
  });

  it('unmount calls $destroy, empties the container and emits tuvix:unmounted', async () => {
    const container = makeContainer();
    const app = createSvelteMicroApp({
      name: 'sv4-unmount',
      App: FakeComponent,
    });
    const unmounted: LifecycleDetail[] = [];
    container.addEventListener('tuvix:unmounted', (event) => {
      unmounted.push((event as CustomEvent<LifecycleDetail>).detail);
    });
    await app.mount({ container, props: { name: 'Ada' } });

    await app.unmount({ container });

    expect(created[0]?.destroyed).toBe(true);
    expect(container.childNodes).toHaveLength(0);
    expect(unmounted).toEqual([
      { name: 'sv4-unmount', container, hydrated: false },
    ]);
  });
});

describe('createSsrSvelteMicroApp with Svelte 3/4', () => {
  it('passes hydrate: true and adopts the server markup', async () => {
    const container = makeContainer('<p>Hello Ada</p>');
    const paragraph = container.querySelector('p');
    const app = createSsrSvelteMicroApp({
      name: 'sv4-hydrate',
      App: FakeComponent,
    });
    const mounted: LifecycleDetail[] = [];
    container.addEventListener('tuvix:mounted', (event) => {
      mounted.push((event as CustomEvent<LifecycleDetail>).detail);
    });

    await app.mount({ container, props: { name: 'Ada' } });

    expect(created[0]?.options.hydrate).toBe(true);
    expect(container.querySelector('p')).toBe(paragraph);
    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(mounted).toEqual([
      { name: 'sv4-hydrate', container, hydrated: true },
    ]);
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getRegisteredModule,
  isMounted,
  onLifecycle,
  unregisterModule,
  whenMounted,
  type LifecycleDetail,
} from '@tuvix.js/loader';
import { defineMicroApp } from '../micro-app';
import { Orchestrator } from '../orchestrator';

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
}

function deferred(): Deferred {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

let container: HTMLElement;
let events: Array<{ type: string; detail: LifecycleDetail }>;
let stopListening: Array<() => void>;

beforeEach(() => {
  document.body.innerHTML = '<div id="main"></div>';
  container = document.getElementById('main') as HTMLElement;
  events = [];
  stopListening = (['mounted', 'unmounted', 'error'] as const).map((type) =>
    onLifecycle(type, (detail) => events.push({ type, detail }))
  );
});

afterEach(() => {
  for (const stop of stopListening) stop();
});

describe('defineMicroApp lifecycle events', () => {
  it('emits mounted after mount resolves, so whenMounted and isMounted work', async () => {
    const name = 'life-mount';
    const gate = deferred();
    const app = defineMicroApp({
      name,
      async mount({ container: el }) {
        await gate.promise;
        el.innerHTML = '<p>ready</p>';
      },
      unmount({ container: el }) {
        el.innerHTML = '';
      },
    });

    const waiting = whenMounted(name);
    const mounting = app.mount({ container });
    await Promise.resolve();
    expect(isMounted(name)).toBe(false);
    expect(events).toEqual([]);

    gate.resolve();
    await mounting;

    await expect(waiting).resolves.toMatchObject({
      name,
      container,
      hydrated: false,
    });
    expect(isMounted(name)).toBe(true);
    expect(events.map((e) => e.type)).toEqual(['mounted']);

    await app.unmount({ container });
    expect(isMounted(name)).toBe(false);
    expect(container.innerHTML).toBe('');
    expect(events.map((e) => e.type)).toEqual(['mounted', 'unmounted']);
    expect(events[1]?.detail).toMatchObject({ name, container });
  });

  it('reports hydrated only when ssr is set and the container had server markup', async () => {
    container.innerHTML = '<p>from server</p>';
    const ssrApp = defineMicroApp({
      name: 'life-ssr',
      ssr: true,
      mount: () => {},
      unmount: () => {},
    });
    await ssrApp.mount({ container });

    const plain = document.createElement('div');
    plain.innerHTML = '<p>from server</p>';
    document.body.appendChild(plain);
    const csrApp = defineMicroApp({
      name: 'life-csr',
      mount: () => {},
      unmount: () => {},
    });
    await csrApp.mount({ container: plain });

    const empty = document.createElement('div');
    empty.innerHTML = '  <!-- comment -->  ';
    document.body.appendChild(empty);
    const ssrEmpty = defineMicroApp({
      name: 'life-ssr-empty',
      ssr: true,
      mount: () => {},
      unmount: () => {},
    });
    await ssrEmpty.mount({ container: empty });

    const hydrated = Object.fromEntries(
      events.map((e) => [e.detail.name, e.detail.hydrated])
    );
    expect(hydrated).toEqual({
      'life-ssr': true,
      'life-csr': false,
      'life-ssr-empty': false,
    });
  });

  it('emits error and rethrows when mount throws', async () => {
    const name = 'life-mount-error';
    const app = defineMicroApp({
      name,
      mount: () => {
        throw new Error('render failed');
      },
      unmount: () => {},
    });

    await expect(app.mount({ container })).rejects.toThrow('render failed');

    expect(isMounted(name)).toBe(false);
    expect(events.map((e) => e.type)).toEqual(['error']);
    expect((events[0]?.detail.error as Error).message).toBe('render failed');
  });

  it('emits error and rethrows when unmount throws', async () => {
    const name = 'life-unmount-error';
    const app = defineMicroApp({
      name,
      mount: () => {},
      unmount: () => {
        throw new Error('cleanup failed');
      },
    });

    await app.mount({ container });
    await expect(app.unmount({ container })).rejects.toThrow('cleanup failed');

    expect(events.map((e) => e.type)).toEqual(['mounted', 'error']);
  });

  it('unmount during a pending mount waits for it, then tears down', async () => {
    const name = 'life-overlap';
    const gate = deferred();
    const calls: string[] = [];
    const app = defineMicroApp({
      name,
      async mount({ container: el }) {
        calls.push('mount:start');
        await gate.promise;
        el.innerHTML = '<p>late</p>';
        calls.push('mount:end');
      },
      unmount({ container: el }) {
        calls.push('unmount');
        el.innerHTML = '';
      },
    });

    const mounting = app.mount({ container });
    const unmounting = app.unmount({ container });
    await Promise.resolve();
    expect(calls).toEqual(['mount:start']);

    gate.resolve();
    await Promise.all([mounting, unmounting]);

    expect(calls).toEqual(['mount:start', 'mount:end', 'unmount']);
    expect(container.innerHTML).toBe('');
    expect(isMounted(name)).toBe(false);
    expect(events.map((e) => e.type)).toEqual(['mounted', 'unmounted']);
  });

  it('tracks each container separately', async () => {
    const second = document.createElement('div');
    document.body.appendChild(second);
    const gate = deferred();
    const app = defineMicroApp({
      name: 'life-multi',
      async mount({ container: el }) {
        if (el === container) await gate.promise;
        el.textContent = 'on';
      },
      unmount({ container: el }) {
        el.textContent = '';
      },
    });

    const slow = app.mount({ container });
    await app.mount({ container: second });
    // Unmounting the second container does not wait for the first one's mount.
    await app.unmount({ container: second });
    expect(second.textContent).toBe('');
    expect(container.textContent).toBe('');

    gate.resolve();
    await slow;
    expect(container.textContent).toBe('on');
  });
});

describe('defineMicroApp under the orchestrator', () => {
  it('emits exactly one mounted and one unmounted per cycle', async () => {
    const name = 'life-orchestrated';
    unregisterModule(name);
    defineMicroApp({
      name,
      mount: ({ container: el }) => {
        el.innerHTML = '<p>hi</p>';
      },
      unmount: ({ container: el }) => {
        el.innerHTML = '';
      },
    });
    expect(typeof getRegisteredModule(name)?.mount).toBe('function');

    const orchestrator = new Orchestrator({ loader: { retries: 0 } });
    orchestrator.register({ name, entry: { scripts: [] }, container: '#main' });
    const waiting = whenMounted(name);

    await orchestrator.mountApp(name);
    await expect(waiting).resolves.toMatchObject({ name, container });
    expect(container.innerHTML).toBe('<p>hi</p>');
    await orchestrator.unmountApp(name);
    await orchestrator.destroy();

    expect(events.map((e) => e.type)).toEqual(['mounted', 'unmounted']);
  });
});

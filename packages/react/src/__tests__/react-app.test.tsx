import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { useState } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { TuvixReactApp } from '../index';
import { attachHtml, recordLifecycle } from './helpers';
import type { LifecycleRecorder } from './helpers';

let lifecycle: LifecycleRecorder;
let consoleError: MockInstance;
let roots: Root[] = [];

beforeEach(() => {
  lifecycle = recordLifecycle();
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  for (const root of roots) root.unmount();
  roots = [];
  lifecycle.stop();
  consoleError.mockRestore();
  document.body.replaceChildren();
});

const Hero = ({ title }: { title: string }) => <h1>{title}</h1>;

describe('TuvixReactApp', () => {
  // Catches: no mounted signal (apps sniffing React fibers instead), or
  // `hydrated` reported wrong.
  it('emits mounted with hydrated: false for a client render and unmounted on removal', async () => {
    const host = attachHtml('');
    const root = createRoot(host);
    roots.push(root);
    root.render(<TuvixReactApp name="hero" App={Hero} title="Hi" />);

    await vi.waitFor(() => expect(lifecycle.events).toHaveLength(1));
    const container = host.querySelector('[data-tuvix-app="hero"]');
    expect(lifecycle.events[0]).toEqual({
      type: 'mounted',
      name: 'hero',
      container,
      hydrated: false,
    });
    expect(container!.textContent).toBe('Hi');

    root.render(null);
    await vi.waitFor(() => expect(lifecycle.events).toHaveLength(2));
    expect(lifecycle.events[1]).toMatchObject({
      type: 'unmounted',
      name: 'hero',
      container,
    });
  });

  it('emits mounted with hydrated: true after hydrating server markup', async () => {
    const tree = <TuvixReactApp name="hero" App={Hero} title="Hi" />;
    const host = attachHtml(renderToString(tree));
    const heading = host.querySelector('h1');

    roots.push(hydrateRoot(host, tree));

    await vi.waitFor(() => expect(lifecycle.events).toHaveLength(1));
    expect(lifecycle.events[0]).toMatchObject({
      type: 'mounted',
      hydrated: true,
    });
    expect(host.querySelector('h1')).toBe(heading);
    expect(consoleError).not.toHaveBeenCalled();
  });

  // Catches: a client render error taking down the host tree.
  it('shows the fallback and emits error when App throws on the client', async () => {
    const boom = new Error('client crash');
    let crash: () => void = () => {};
    function Flaky() {
      const [broken, setBroken] = useState(false);
      crash = () => setBroken(true);
      if (broken) throw boom;
      return <p>working</p>;
    }
    const host = attachHtml('');
    const root = createRoot(host);
    roots.push(root);
    root.render(
      <>
        <TuvixReactApp name="flaky" App={Flaky} fallback={<p>broken</p>} />
        <TuvixReactApp name="stable" App={Hero} title="still here" />
      </>
    );
    await vi.waitFor(() => expect(host.textContent).toBe('workingstill here'));

    crash();
    await vi.waitFor(() => expect(host.textContent).toBe('brokenstill here'));
    const container = host.querySelector('[data-tuvix-app="flaky"]');
    expect(lifecycle.events).toContainEqual({
      type: 'error',
      name: 'flaky',
      container,
      hydrated: false,
      error: boom,
    });
  });

  // Catches: onError reading the wrapper ref before React attached it, so a
  // throw on the first client render dispatched no event.
  it('emits error with the container when App throws on its first client render', async () => {
    const boom = new Error('first render');
    const Boom = (): never => {
      throw boom;
    };
    const host = attachHtml('');
    const root = createRoot(host);
    roots.push(root);
    root.render(
      <TuvixReactApp name="first-throw" App={Boom} fallback={<p>fb</p>} />
    );

    await vi.waitFor(() => expect(lifecycle.events).toHaveLength(1));
    const container = host.querySelector('[data-tuvix-app="first-throw"]');
    expect(container!.innerHTML).toBe('<p>fb</p>');
    expect(lifecycle.events[0]).toEqual({
      type: 'error',
      name: 'first-throw',
      container,
      hydrated: false,
      error: boom,
    });
  });

  // Catches: a server-side failure in one app breaking hydration of the page.
  it('renders an app that failed on the server on the client and keeps its sibling nodes', async () => {
    let onServer = true;
    function Repos() {
      if (onServer) throw new Error('GitHub 403');
      return (
        <ul>
          <li>repo</li>
        </ul>
      );
    }
    const page = (
      <main>
        <TuvixReactApp name="repos" App={Repos} fallback={<p>loading</p>} />
        <TuvixReactApp name="hero" App={Hero} title="Hello" />
      </main>
    );
    const host = attachHtml(renderToString(page));
    const heading = host.querySelector('h1');
    expect(host.querySelector('[data-tuvix-app="repos"]')!.textContent).toBe(
      'loading'
    );

    onServer = false;
    roots.push(hydrateRoot(host, page, { onRecoverableError: () => {} }));

    await vi.waitFor(() =>
      expect(
        host.querySelector('[data-tuvix-app="repos"] li')!.textContent
      ).toBe('repo')
    );
    expect(host.querySelector('h1')).toBe(heading);
  });
});

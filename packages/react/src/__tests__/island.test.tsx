import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { StrictMode, useState } from 'react';
import type { ReactNode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import type { MicroAppModule, MountContext } from '@tuvix.js/loader';
import { TuvixIsland } from '../index';
import { attachHtml, tick } from './helpers';

/**
 * A vanilla micro app: renders a button from props when the container is
 * empty, adopts the existing button when it holds server markup, and counts
 * clicks through a listener attached on mount.
 */
function vanillaModule() {
  const module = {
    calls: [] as string[],
    clicks: 0,
    mountedButton: null as Element | null,
    mount: vi.fn(async ({ container, props }: MountContext) => {
      module.calls.push(`mount:${String(props?.label)}`);
      if (!container.firstElementChild) {
        container.innerHTML = `<button id="island-button">${String(props?.label)}</button>`;
      }
      module.mountedButton = container.firstElementChild;
      module.mountedButton?.addEventListener('click', () => {
        module.clicks += 1;
      });
    }),
    unmount: vi.fn(async ({ container }: { container: HTMLElement }) => {
      module.calls.push('unmount');
      container.replaceChildren();
    }),
    update: vi.fn(async ({ props }: { props: Record<string, unknown> }) => {
      module.calls.push(`update:${String(props.label)}`);
    }),
  };
  return module;
}

let consoleError: MockInstance;
let roots: Root[] = [];

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error');
});

afterEach(async () => {
  for (const root of roots) root.unmount();
  roots = [];
  await tick();
  consoleError.mockRestore();
  document.body.replaceChildren();
});

function render(element: ReactNode): HTMLElement {
  const host = attachHtml('');
  const root = createRoot(host);
  roots.push(root);
  root.render(element);
  return host;
}

describe('TuvixIsland hydration', () => {
  let setTick: (n: number) => void = () => {};

  function Page({
    footerHtml,
    app,
  }: {
    footerHtml?: string;
    app: MicroAppModule;
  }) {
    const [n, set] = useState(0);
    setTick = set;
    return (
      <main>
        <p className="tick">{n}</p>
        <TuvixIsland
          name="footer"
          app={app}
          props={{ label: 'srv' }}
          ssrHtml={footerHtml}
        />
      </main>
    );
  }

  // Catches: React rewriting innerHTML on hydration or on a parent re-render
  // (a fresh `{ __html }` object per render), which destroys the module's DOM
  // and the listeners it attached. This is the yasinates footer bug.
  it('mounts the module on the server nodes and keeps them across parent re-renders', async () => {
    const app = vanillaModule();
    const html = renderToString(
      <Page app={app} footerHtml='<button id="island-button">srv</button>' />
    );
    const host = attachHtml(html);
    const serverButton = host.querySelector('#island-button')!;
    const recoverable = vi.fn();

    // The client does not receive the HTML again; the island reads it from the page.
    const root = hydrateRoot(host, <Page app={app} />, {
      onRecoverableError: recoverable,
    });
    roots.push(root);

    await vi.waitFor(() => expect(app.mount).toHaveBeenCalledTimes(1));
    const island = host.querySelector<HTMLElement>(
      '[data-tuvix-app="footer"]'
    )!;
    expect(app.mount.mock.calls[0]![0].container).toBe(island);
    expect(app.mountedButton).toBe(serverButton);
    expect(host.querySelector('#island-button')).toBe(serverButton);

    setTick(1);
    await vi.waitFor(() =>
      expect(host.querySelector('.tick')!.textContent).toBe('1')
    );
    setTick(2);
    await vi.waitFor(() =>
      expect(host.querySelector('.tick')!.textContent).toBe('2')
    );

    expect(host.querySelector('#island-button')).toBe(serverButton);
    (serverButton as HTMLButtonElement).click();
    expect(app.clicks).toBe(1);
    expect(app.mount).toHaveBeenCalledTimes(1);
    expect(app.update).not.toHaveBeenCalled();
    expect(recoverable).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  // Catches: a parent re-render that passes `ssrHtml` again (as a new string
  // object each time) re-applying innerHTML.
  it('keeps the DOM when the parent passes ssrHtml on every client render', async () => {
    const app = vanillaModule();
    let bump: (n: number) => void = () => {};
    function Host() {
      const [n, set] = useState(0);
      bump = set;
      return (
        <>
          <p className="tick">{n}</p>
          <TuvixIsland
            name="hero"
            app={app}
            ssrHtml={`<button id="island-button">${'x'}</button>`}
          />
        </>
      );
    }
    const host = render(<Host />);
    await vi.waitFor(() => expect(app.mount).toHaveBeenCalledTimes(1));
    const button = host.querySelector('#island-button')!;

    bump(1);
    await vi.waitFor(() =>
      expect(host.querySelector('.tick')!.textContent).toBe('1')
    );
    expect(host.querySelector('#island-button')).toBe(button);
  });
});

describe('TuvixIsland lifecycle', () => {
  // Catches: props ignored after the first mount (`useEffect(..., [])`).
  it('calls update with the container when props change shallowly', async () => {
    const app = vanillaModule();
    let setLabel: (label: string) => void = () => {};
    function Host() {
      const [label, set] = useState('a');
      setLabel = set;
      return <TuvixIsland name="widget" app={app} props={{ label }} />;
    }
    const host = render(<Host />);
    await vi.waitFor(() => expect(app.calls).toEqual(['mount:a']));
    const island = host.querySelector('[data-tuvix-app="widget"]');

    setLabel('a'); // same value, new object: no update
    await tick();
    setLabel('b');
    await vi.waitFor(() => expect(app.calls).toEqual(['mount:a', 'update:b']));
    expect(app.update.mock.calls[0]![0]).toEqual({
      props: { label: 'b' },
      container: island,
    });
  });

  // Catches: modules without `update` silently keeping stale props.
  it('remounts a module that has no update', async () => {
    const app = vanillaModule();
    const { update: _ignored, ...withoutUpdate } = app;
    let setLabel: (label: string) => void = () => {};
    function Host() {
      const [label, set] = useState('a');
      setLabel = set;
      return <TuvixIsland name="plain" app={withoutUpdate} props={{ label }} />;
    }
    const host = render(<Host />);
    await vi.waitFor(() => expect(app.calls).toEqual(['mount:a']));

    setLabel('b');
    await vi.waitFor(() =>
      expect(app.calls).toEqual(['mount:a', 'unmount', 'mount:b'])
    );
    expect(host.querySelector('#island-button')!.textContent).toBe('b');
  });

  // Catches: a key change reusing the old instance (the `key={postId}` workaround).
  it('remounts on key change and unmounts when removed', async () => {
    const app = vanillaModule();
    let setPost: (id: string | null) => void = () => {};
    function Host() {
      const [post, set] = useState<string | null>('1');
      setPost = set;
      return post ? (
        <TuvixIsland key={post} name="post" app={app} props={{ label: post }} />
      ) : null;
    }
    const host = render(<Host />);
    await vi.waitFor(() => expect(app.calls).toEqual(['mount:1']));

    setPost('2');
    await vi.waitFor(() =>
      expect(app.calls).toEqual(['mount:1', 'unmount', 'mount:2'])
    );
    expect(host.querySelector('#island-button')!.textContent).toBe('2');

    setPost(null);
    await vi.waitFor(() =>
      expect(app.calls).toEqual(['mount:1', 'unmount', 'mount:2', 'unmount'])
    );
    expect(host.querySelector('[data-tuvix-app]')).toBeNull();
  });

  // Catches: unmount racing a slow mount and leaving the module mounted.
  it('waits for a pending mount before unmounting', async () => {
    let finishMount: () => void = () => {};
    const calls: string[] = [];
    const app: MicroAppModule = {
      mount: () =>
        new Promise<void>((resolve) => {
          calls.push('mount:start');
          finishMount = () => {
            calls.push('mount:end');
            resolve();
          };
        }),
      unmount: () => {
        calls.push('unmount');
      },
    };
    let show: (visible: boolean) => void = () => {};
    function Host() {
      const [visible, set] = useState(true);
      show = set;
      return visible ? <TuvixIsland name="slow" app={app} /> : null;
    }
    render(<Host />);
    await vi.waitFor(() => expect(calls).toEqual(['mount:start']));

    show(false);
    await tick();
    expect(calls).toEqual(['mount:start']);

    finishMount();
    await vi.waitFor(() =>
      expect(calls).toEqual(['mount:start', 'mount:end', 'unmount'])
    );
  });

  // Catches: a rejected mount leaving an empty box or crashing the host tree.
  it('renders the fallback when mount rejects', async () => {
    const app: MicroAppModule = {
      mount: () => Promise.reject(new Error('chunk failed')),
      unmount: vi.fn(),
    };
    const host = render(
      <section>
        <TuvixIsland
          name="broken"
          app={app}
          fallback={<p className="fb">offline</p>}
        />
        <span className="sibling">ok</span>
      </section>
    );

    await vi.waitFor(() =>
      expect(host.querySelector('.fb')!.textContent).toBe('offline')
    );
    expect(host.querySelector('[data-tuvix-app="broken"]')).toBeNull();
    expect(host.querySelector('.sibling')!.textContent).toBe('ok');
    expect(app.unmount).not.toHaveBeenCalled();
  });

  // Catches: StrictMode's double effect mounting twice, or remounting fresh
  // and dropping the server DOM (what the docs promise against).
  it('mounts once and adopts server markup under StrictMode', async () => {
    const app = vanillaModule();
    const tree = (
      <StrictMode>
        <TuvixIsland
          name="strict"
          app={app}
          props={{ label: 'srv' }}
          ssrHtml='<button id="island-button">srv</button>'
        />
      </StrictMode>
    );
    const host = attachHtml(renderToString(tree));
    const serverButton = host.querySelector('#island-button');
    roots.push(hydrateRoot(host, tree));

    await vi.waitFor(() => expect(app.calls).toEqual(['mount:srv']));
    await tick();
    expect(app.calls).toEqual(['mount:srv']);
    expect(app.mountedButton).toBe(serverButton);
  });

  // Catches: the element recreated after a failure reusing the failed app's
  // server HTML, so the next module adopts markup that is not its own.
  it('mounts a new app into an empty element after the previous one failed', async () => {
    const broken: MicroAppModule = {
      mount: () => Promise.reject(new Error('chunk failed')),
      unmount: vi.fn(),
    };
    const next = vanillaModule();
    const seen: string[] = [];
    next.mount.mockImplementationOnce(async ({ container }: MountContext) => {
      seen.push(container.innerHTML);
    });
    let swap: (app: MicroAppModule) => void = () => {};
    function Host() {
      const [app, set] = useState<MicroAppModule>(broken);
      swap = set;
      return (
        <TuvixIsland
          name="swap"
          app={app}
          ssrHtml='<b id="old">old app</b>'
          fallback={<p className="fb">offline</p>}
        />
      );
    }
    const host = render(<Host />);
    await vi.waitFor(() => expect(host.querySelector('.fb')).not.toBeNull());

    swap(next);
    await vi.waitFor(() => expect(next.mount).toHaveBeenCalledTimes(1));
    expect(seen).toEqual(['']);
    expect(host.querySelector('#old')).toBeNull();
  });

  it('renders the requested tag and class name', async () => {
    const app = vanillaModule();
    const host = render(
      <TuvixIsland name="tagged" app={app} as="section" className="box" />
    );
    await vi.waitFor(() => expect(app.mount).toHaveBeenCalled());
    const island = host.querySelector('[data-tuvix-app="tagged"]')!;
    expect(island.tagName).toBe('SECTION');
    expect(island.className).toBe('box');
  });
});

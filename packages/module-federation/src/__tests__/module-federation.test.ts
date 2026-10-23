import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';
import { ModuleLoader, type MicroAppModule } from '@tuvix.js/loader';
import {
  createFederatedLoader,
  federatedEntry,
  type FederatedContainer,
  type ShareScope,
} from '../index';

// jsdom never fetches scripts. Each remoteEntry URL gets a route that plays the
// script body (defining the container global), then fires `load` or `error`.
type Route = () => void | 'error';
const routes = new Map<string, Route>();
const requests: string[] = [];
const observer = new MutationObserver((records) => {
  for (const record of records) {
    for (const node of Array.from(record.addedNodes)) {
      if (!(node instanceof HTMLScriptElement)) continue;
      const url = node.getAttribute('src') ?? '';
      requests.push(url);
      const result = routes.get(url)?.();
      setTimeout(
        () =>
          node.dispatchEvent(new Event(result === 'error' ? 'error' : 'load')),
        0
      );
    }
  }
});

const win = window as unknown as Record<string, unknown>;
const globals = new Set<string>();
let urlCounter = 0;

function fakeApp(label: string): MicroAppModule {
  return {
    mount: ({ container }) => {
      container.textContent = label;
    },
    unmount: ({ container }) => {
      container.textContent = '';
    },
  };
}

interface FakeRemote {
  url: string;
  container: FederatedContainer & { init: Mock; get: Mock };
}

/** Serve a remoteEntry.js that defines `window[scope]` as a container exposing `exposes`. */
function serveRemote(
  scope: string,
  exposes: Record<string, () => unknown>
): FakeRemote {
  const url = `https://cdn.test/${scope}/${++urlCounter}/remoteEntry.js`;
  const container = {
    init: vi.fn(async (_scope: ShareScope) => undefined),
    get: vi.fn(async (path: string) => {
      const factory = exposes[path];
      if (!factory)
        throw new Error(`Module ${path} does not exist in container.`);
      return factory;
    }),
  };
  routes.set(url, () => {
    globals.add(scope);
    win[scope] = container;
  });
  return { url, container };
}

beforeEach(() => {
  observer.observe(document.head, { childList: true });
});

afterEach(() => {
  observer.disconnect();
  routes.clear();
  requests.length = 0;
  for (const key of globals) delete win[key];
  globals.clear();
  delete win.__webpack_init_sharing__;
  delete win.__webpack_share_scopes__;
  document.head.innerHTML = '';
});

describe('federatedEntry', () => {
  it('loads the remote, inits the container and mounts the exposed app', async () => {
    const app = fakeApp('dashboard');
    const { url, container } = serveRemote('dashboard', {
      './App': () => ({ default: app }),
    });

    const loader = new ModuleLoader();
    const result = await loader.load(
      'dashboard',
      federatedEntry({ name: 'dashboard', url })
    );

    expect(result.status).toBe('loaded');
    expect(result.module).toBe(app);
    expect(container.init).toHaveBeenCalledTimes(1);
    expect(container.get).toHaveBeenCalledWith('./App');

    const el = document.createElement('div');
    await result.module!.mount({ container: el });
    expect(el.textContent).toBe('dashboard');
  });

  it('resolves a non-default exposed module and a custom scope', async () => {
    const app = fakeApp('settings');
    const { url } = serveRemote('settings_remote', { './Settings': () => app });

    const loader = new ModuleLoader();
    const result = await loader.load(
      'settings',
      federatedEntry(
        { name: 'settings', url, scope: 'settings_remote' },
        './Settings'
      )
    );
    expect(result.module).toBe(app);
  });

  it('reports a missing exposed module as a load error', async () => {
    const { url } = serveRemote('missing', {});
    const loader = new ModuleLoader({ retries: 0 });
    const result = await loader.load(
      'missing',
      federatedEntry({ name: 'missing', url }, './Nope')
    );
    expect(result.status).toBe('error');
    expect(result.error?.message).toContain('Module "./Nope" not found');
  });

  it('retries a failed remoteEntry.js with a fresh script tag', async () => {
    const app = fakeApp('flaky');
    const { url } = serveRemote('flaky', { './App': () => app });
    const define = routes.get(url)!;
    let attempt = 0;
    routes.set(url, () => (++attempt === 1 ? 'error' : define()));

    const loader = new ModuleLoader({ retries: 1, retryDelay: 0 });
    const result = await loader.load(
      'flaky',
      federatedEntry({ name: 'flaky', url })
    );

    expect(result.module).toBe(app);
    expect(requests).toEqual([url, url]);
    expect(document.head.querySelectorAll('script')).toHaveLength(1);
  });
});

describe('share scope', () => {
  it('uses the webpack default scope after __webpack_init_sharing__', async () => {
    const webpackScope: ShareScope = { react: {} };
    const initSharing = vi.fn(async () => undefined);
    win.__webpack_init_sharing__ = initSharing;
    win.__webpack_share_scopes__ = { default: webpackScope };

    const { url, container } = serveRemote('wp', {
      './App': () => fakeApp('wp'),
    });
    await createFederatedLoader({
      remotes: [{ name: 'wp', url }],
    }).createFederatedApp('wp');

    expect(initSharing).toHaveBeenCalledWith('default');
    expect(container.init).toHaveBeenCalledWith(webpackScope);
  });

  it('gives every remote the same scope object outside webpack', async () => {
    const a = serveRemote('remote_a', { './App': () => fakeApp('a') });
    const b = serveRemote('remote_b', { './App': () => fakeApp('b') });
    const loader = createFederatedLoader({
      remotes: [
        { name: 'remote_a', url: a.url },
        { name: 'remote_b', url: b.url },
      ],
    });
    await loader.createFederatedApp('remote_a');
    await loader.createFederatedApp('remote_b');

    const scopeA = a.container.init.mock.calls[0]?.[0];
    const scopeB = b.container.init.mock.calls[0]?.[0];
    expect(scopeA).toBeTypeOf('object');
    expect(scopeA).toBe(scopeB);
  });

  it('passes an explicit shareScope to init', async () => {
    const shareScope: ShareScope = { vue: {} };
    const { url, container } = serveRemote('explicit', {
      './App': () => fakeApp('x'),
    });
    await new ModuleLoader().load(
      'explicit',
      federatedEntry({ name: 'explicit', url }, './App', { shareScope })
    );
    expect(container.init).toHaveBeenCalledWith(shareScope);
  });

  it('inits a container once across loaders', async () => {
    const { url, container } = serveRemote('shared', {
      './A': () => fakeApp('a'),
      './B': () => fakeApp('b'),
    });
    const remote = { name: 'shared', url };
    const loader = new ModuleLoader();
    await Promise.all([
      loader.load('a', federatedEntry(remote, './A')),
      loader.load('b', federatedEntry(remote, './B')),
    ]);
    expect(container.init).toHaveBeenCalledTimes(1);
    expect(requests).toEqual([url]);
  });
});

describe('createFederatedLoader', () => {
  it('loadModule returns the default export', async () => {
    const value = { hello: 'world' };
    const { url } = serveRemote('lib', {
      './utils': () => ({ default: value }),
    });
    const loader = createFederatedLoader({ remotes: [{ name: 'lib', url }] });
    await expect(loader.loadModule('lib', './utils')).resolves.toBe(value);
  });

  it('throws when the remote entry defines no container', async () => {
    const url = `https://cdn.test/empty/${++urlCounter}/remoteEntry.js`;
    const loader = createFederatedLoader({ remotes: [{ name: 'ghost', url }] });
    await expect(loader.createFederatedApp('ghost')).rejects.toThrow(
      'Remote container "ghost" not found'
    );
  });

  it('rejects exposed modules without mount', async () => {
    const { url } = serveRemote('nomount', {
      './App': () => ({ default: {} }),
    });
    const loader = createFederatedLoader({
      remotes: [{ name: 'nomount', url }],
    });
    await expect(loader.createFederatedApp('nomount')).rejects.toThrow(
      'does not export mount/unmount'
    );
  });

  it('throws when loading an unconfigured remote', async () => {
    const loader = createFederatedLoader({ remotes: [] });
    await expect(loader.loadModule('unknown', './App')).rejects.toThrow(
      'not configured'
    );
    expect(() => loader.createFederatedEntry('unknown')).toThrow(
      'not configured'
    );
  });
});

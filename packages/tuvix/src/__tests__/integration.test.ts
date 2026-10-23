import { describe, it, expect, afterEach } from 'vitest';
import { emitLifecycle } from '@tuvix.js/loader';
import {
  createOrchestrator,
  defineMicroApp,
  interceptLinks,
  matchPath,
  whenMounted,
  isMounted,
  onLifecycle,
  type Orchestrator,
} from '../index';

let orchestrator: Orchestrator | null = null;
let stopLinks: () => void = () => {};

afterEach(async () => {
  stopLinks();
  await orchestrator?.destroy();
  orchestrator = null;
});

describe('tuvix.js end to end', () => {
  it('a link click navigates through the router and mounts the matching app', async () => {
    window.history.replaceState(null, '', '/');
    document.body.innerHTML =
      '<nav><a id="go" href="/about?ref=nav">About</a></nav><main id="main"></main>';

    defineMicroApp({
      name: 'about',
      mount: ({ container, props }) => {
        container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
      },
      unmount: ({ container }) => {
        container.innerHTML = '';
      },
    });

    orchestrator = createOrchestrator({ router: { routes: [] } });
    orchestrator.register({
      name: 'about',
      entry: { scripts: [] },
      container: '#main',
      activeWhen: '/about',
      props: { who: 'us' },
    });
    await orchestrator.start();
    const app = orchestrator;
    stopLinks = interceptLinks({ navigate: (path) => app.navigateTo(path) });

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    document.getElementById('go')!.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    await expect
      .poll(() => document.querySelector('#main h1')?.textContent)
      .toBe('About us');
    expect(window.location.pathname).toBe('/about');
    expect(window.location.search).toBe('?ref=nav');
    expect(orchestrator.getMountedApps()).toEqual(['about']);
  });

  it('activeWhen follows matchPath: query changes keep the app, :param mounts it', async () => {
    window.history.replaceState(null, '', '/');
    document.body.innerHTML = '<main id="main"></main>';
    let mounts = 0;
    let unmounts = 0;
    defineMicroApp({
      name: 'post',
      mount: ({ container }) => {
        mounts += 1;
        container.innerHTML = '<article>post</article>';
      },
      unmount: ({ container }) => {
        unmounts += 1;
        container.innerHTML = '';
      },
    });

    orchestrator = createOrchestrator({ router: { routes: [] } });
    orchestrator.register({
      name: 'post',
      entry: { scripts: [] },
      container: '#main',
      activeWhen: '/posts/:slug',
    });
    await orchestrator.start();

    // The same patterns, checked through the exported matcher.
    expect(matchPath('/posts/:slug', '/posts/hi?tab=2').matched).toBe(true);
    expect(matchPath('/posts/:slug', '/posts').matched).toBe(false);

    await orchestrator.navigateTo('/posts');
    expect(orchestrator.getMountedApps()).toEqual([]);

    await orchestrator.navigateTo('/posts/hi');
    await expect.poll(() => orchestrator!.getMountedApps()).toEqual(['post']);

    await orchestrator.navigateTo('/posts/hi?tab=comments');
    await orchestrator.reconcile();
    expect(window.location.search).toBe('?tab=comments');
    expect(orchestrator.getMountedApps()).toEqual(['post']);
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);
    expect(document.querySelector('#main article')?.textContent).toBe('post');
  });

  it('lifecycle helpers share state with the loader runtime adapters use', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const seen: string[] = [];
    const off = onLifecycle('mounted', (detail) => seen.push(detail.name));

    const waiting = whenMounted('island');
    expect(isMounted('island')).toBe(false);

    emitLifecycle('mounted', { name: 'island', container, hydrated: true });

    await expect(waiting).resolves.toMatchObject({
      name: 'island',
      hydrated: true,
    });
    expect(isMounted('island')).toBe(true);
    expect(seen).toEqual(['island']);

    emitLifecycle('unmounted', { name: 'island', container, hydrated: false });
    expect(isMounted('island')).toBe(false);
    off();
  });
});

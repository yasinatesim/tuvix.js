import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { interceptLinks } from '../intercept-links';

let root: HTMLElement;
let stop: () => void = () => {};
/** `defaultPrevented` as seen above `root`, recorded per click. */
let prevented: boolean[];

function swallowNavigation(event: Event): void {
  prevented.push(event.defaultPrevented);
  // jsdom cannot navigate; stop the default action after recording it.
  event.preventDefault();
}

function link(
  href: string,
  attrs: Record<string, string> = {}
): HTMLAnchorElement {
  const a = document.createElement('a');
  a.setAttribute('href', href);
  for (const [name, value] of Object.entries(attrs))
    a.setAttribute(name, value);
  a.textContent = 'go';
  root.appendChild(a);
  return a;
}

function click(target: Element, init: MouseEventInit = {}): void {
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      ...init,
    })
  );
}

beforeEach(() => {
  window.history.replaceState(null, '', '/current?x=1');
  document.body.innerHTML = '<div id="root"></div>';
  root = document.getElementById('root') as HTMLElement;
  prevented = [];
  document.addEventListener('click', swallowNavigation);
});

afterEach(() => {
  stop();
  document.removeEventListener('click', swallowNavigation);
});

describe('interceptLinks click handling', () => {
  it('turns a same-origin click into navigate(path) and prevents the reload', () => {
    const navigate = vi.fn();
    stop = interceptLinks({ navigate, root });

    click(link('/about?tab=team#people'));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0]?.[0]).toBe('/about?tab=team#people');
    expect(prevented).toEqual([true]);
  });

  it('handles clicks on elements nested inside the link', () => {
    const navigate = vi.fn();
    stop = interceptLinks({ navigate, root });
    const a = link('/nested');
    const span = document.createElement('span');
    a.appendChild(span);

    click(span);

    expect(navigate).toHaveBeenCalledWith('/nested', expect.any(MouseEvent));
  });

  it.each([
    ['ctrlKey', { ctrlKey: true }],
    ['metaKey', { metaKey: true }],
    ['shiftKey', { shiftKey: true }],
    ['altKey', { altKey: true }],
    ['middle button', { button: 1 }],
  ])('leaves %s clicks to the browser', (_label, init) => {
    const navigate = vi.fn();
    stop = interceptLinks({ navigate, root });

    click(link('/about'), init);

    expect(navigate).not.toHaveBeenCalled();
    expect(prevented).toEqual([false]);
  });

  it.each([
    ['target=_blank', { target: '_blank' }],
    ['target=_parent', { target: '_parent' }],
    ['download', { download: '' }],
    ['rel=external', { rel: 'noopener external' }],
    ['data-tuvix-reload', { 'data-tuvix-reload': '' }],
  ])('leaves links with %s to the browser', (_label, attrs) => {
    const navigate = vi.fn();
    stop = interceptLinks({ navigate, root });

    click(link('/about', attrs));

    expect(navigate).not.toHaveBeenCalled();
    expect(prevented).toEqual([false]);
  });

  it('intercepts target=_self', () => {
    const navigate = vi.fn();
    stop = interceptLinks({ navigate, root });
    click(link('/about', { target: '_self' }));
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('leaves links to another origin to the browser', () => {
    const navigate = vi.fn();
    stop = interceptLinks({ navigate, root });

    click(link('https://example.org/about'));
    click(link('mailto:someone@example.org'));

    expect(navigate).not.toHaveBeenCalled();
    expect(prevented).toEqual([false, false]);
  });

  it('leaves hash-only changes on the current path to the browser', () => {
    const navigate = vi.fn();
    stop = interceptLinks({ navigate, root });

    click(link('#section'));
    click(link('/current?x=1#other'));
    expect(navigate).not.toHaveBeenCalled();

    click(link('/current?x=2#other'));
    expect(navigate).toHaveBeenCalledWith(
      '/current?x=2#other',
      expect.any(MouseEvent)
    );
  });

  it('ignores clicks another handler already prevented', () => {
    const navigate = vi.fn();
    stop = interceptLinks({ navigate, root });
    const a = link('/about');
    a.addEventListener('click', (e) => e.preventDefault());

    click(a);

    expect(navigate).not.toHaveBeenCalled();
  });

  it('respects shouldIntercept returning false', () => {
    const navigate = vi.fn();
    const shouldIntercept = vi.fn(
      (_a: HTMLAnchorElement, url: URL) => !url.pathname.startsWith('/legacy')
    );
    stop = interceptLinks({ navigate, root, shouldIntercept });

    click(link('/legacy/page'));
    click(link('/modern'));

    expect(navigate.mock.calls.map((c) => c[0])).toEqual(['/modern']);
    expect(prevented).toEqual([false, true]);
  });

  it('strips base and ignores links outside it', () => {
    const navigate = vi.fn();
    stop = interceptLinks({ navigate, root, base: '/app/' });

    click(link('/app/settings'));
    click(link('/app'));
    click(link('/application'));
    click(link('/other'));

    expect(navigate.mock.calls.map((c) => c[0])).toEqual(['/settings', '/']);
  });

  it('logs a rejected navigate instead of throwing', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    stop = interceptLinks({
      navigate: () => Promise.reject(new Error('guard failed')),
      root,
    });

    click(link('/about'));
    await vi.waitFor(() => expect(error).toHaveBeenCalled());
    error.mockRestore();
  });

  it('stops intercepting after the returned cleanup runs', () => {
    const navigate = vi.fn();
    const prefetch = vi.fn();
    stop = interceptLinks({ navigate, prefetch, root });
    stop();

    const a = link('/about');
    click(a);
    a.dispatchEvent(new Event('pointerenter'));

    expect(navigate).not.toHaveBeenCalled();
    expect(prefetch).not.toHaveBeenCalled();
    expect(prevented).toEqual([false]);
  });
});

describe('interceptLinks prefetch on intent', () => {
  it('prefetches once per path on pointerenter and focus', () => {
    const prefetch = vi.fn();
    stop = interceptLinks({ navigate: vi.fn(), prefetch, root });
    const a = link('/pricing?plan=pro#faq');
    const same = link('/pricing?plan=pro#top');

    // pointerenter does not bubble; interceptLinks must catch it in capture.
    a.dispatchEvent(new Event('pointerenter'));
    a.dispatchEvent(new Event('pointerenter'));
    a.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    same.dispatchEvent(new Event('pointerenter'));

    expect(prefetch).toHaveBeenCalledTimes(1);
    expect(prefetch).toHaveBeenCalledWith('/pricing?plan=pro', a);

    link('/docs').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(prefetch).toHaveBeenCalledTimes(2);
    expect(prefetch.mock.calls[1]?.[0]).toBe('/docs');
  });

  it('does not prefetch links the click handler would skip', () => {
    const prefetch = vi.fn();
    stop = interceptLinks({ navigate: vi.fn(), prefetch, root });

    link('https://example.org/x').dispatchEvent(new Event('pointerenter'));
    link('/file.zip', { download: '' }).dispatchEvent(
      new Event('pointerenter')
    );
    link('/hard', { 'data-tuvix-reload': '' }).dispatchEvent(
      new Event('pointerenter')
    );
    root.dispatchEvent(new Event('pointerenter'));

    expect(prefetch).not.toHaveBeenCalled();
  });
});

describe('interceptLinks edge cases from review', () => {
  it('leaves SVG <a> links to the browser', () => {
    const navigate = vi.fn();
    const prefetch = vi.fn();
    stop = interceptLinks({ navigate, prefetch, root });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const a = document.createElementNS('http://www.w3.org/2000/svg', 'a');
    a.setAttribute('href', '/chart');
    const shape = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'rect'
    );
    a.appendChild(shape);
    svg.appendChild(a);
    root.appendChild(svg);

    click(shape);
    shape.dispatchEvent(new Event('pointerenter'));

    expect(navigate).not.toHaveBeenCalled();
    expect(prefetch).not.toHaveBeenCalled();
    expect(prevented).toEqual([false]);
  });

  it('finds links inside an open shadow root from a document listener', () => {
    const navigate = vi.fn();
    const prefetch = vi.fn();
    // Listen on document itself; re-add the navigation stub after it so
    // interceptLinks sees the click first.
    document.removeEventListener('click', swallowNavigation);
    stop = interceptLinks({ navigate, prefetch });
    document.addEventListener('click', swallowNavigation);
    const host = document.createElement('div');
    root.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const a = document.createElement('a');
    a.setAttribute('href', '/in-shadow');
    const label = document.createElement('span');
    a.appendChild(label);
    shadow.appendChild(a);

    label.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
        button: 0,
      })
    );
    label.dispatchEvent(new Event('pointerenter', { composed: true }));

    expect(navigate).toHaveBeenCalledWith('/in-shadow', expect.any(MouseEvent));
    expect(prevented).toEqual([true]);
    expect(prefetch).toHaveBeenCalledWith('/in-shadow', a);
  });

  it('prefetches base-relative paths and skips links outside base', () => {
    const prefetch = vi.fn();
    stop = interceptLinks({ navigate: vi.fn(), prefetch, root, base: '/app' });

    link('/app/pricing?plan=pro').dispatchEvent(new Event('pointerenter'));
    link('/pricing').dispatchEvent(new Event('pointerenter'));

    expect(prefetch.mock.calls.map((c) => c[0])).toEqual(['/pricing?plan=pro']);
  });

  it('intercepts a click on a link to the current path without a hash', () => {
    const navigate = vi.fn();
    stop = interceptLinks({ navigate, root });

    click(link('/current?x=1'));

    expect(navigate).toHaveBeenCalledWith(
      '/current?x=1',
      expect.any(MouseEvent)
    );
    expect(prevented).toEqual([true]);
  });

  it('treats only the exact rel token "external" as external', () => {
    const navigate = vi.fn();
    stop = interceptLinks({ navigate, root });

    click(link('/help', { rel: 'external-help' }));
    click(link('/out', { rel: 'nofollow external' }));

    expect(navigate.mock.calls.map((c) => c[0])).toEqual(['/help']);
  });
});

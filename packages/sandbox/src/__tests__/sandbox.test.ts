import { describe, it, expect, beforeEach } from 'vitest';
import { JsSandbox } from '../js-sandbox';
import { CssSandbox } from '../css-sandbox';
import { Sandbox, createSandbox } from '../sandbox';

/** View a window or proxy window as a plain property bag. */
const bag = (target: object): Record<string, unknown> =>
  target as Record<string, unknown>;

// ─── JsSandbox ──────────────────────────────────────

describe('JsSandbox', () => {
  let sandbox: JsSandbox;

  beforeEach(() => {
    sandbox = new JsSandbox();
  });

  it('should start inactive', () => {
    expect(sandbox.active).toBe(false);
  });

  it('should activate and deactivate', () => {
    sandbox.activate();
    expect(sandbox.active).toBe(true);
    sandbox.deactivate();
    expect(sandbox.active).toBe(false);
  });

  it('should expose a proxyWindow', () => {
    expect(sandbox.proxyWindow).toBeDefined();
  });

  it('should store globals in fakeWindow when active', () => {
    sandbox.activate();

    const proxy = sandbox.proxyWindow;
    bag(proxy)['__test_sandbox_var'] = 42;

    // Should be readable through proxy
    expect(bag(proxy)['__test_sandbox_var']).toBe(42);

    // Should NOT be on real window
    expect(bag(window)['__test_sandbox_var']).toBeUndefined();

    sandbox.deactivate();
  });

  it('should pass through allowed globals', () => {
    sandbox.activate();
    const proxy = sandbox.proxyWindow;

    // console should pass through
    expect(bag(proxy)['console']).toBe(console);
    sandbox.deactivate();
  });

  it('should execute scripts in sandbox context', () => {
    sandbox.activate();
    sandbox.execScript('window.__sandbox_exec_test = "hello"');

    expect(bag(sandbox.proxyWindow)['__sandbox_exec_test']).toBe('hello');

    expect(bag(window)['__sandbox_exec_test']).toBeUndefined();

    sandbox.deactivate();
  });

  it('should reset all faked properties', () => {
    sandbox.activate();
    bag(sandbox.proxyWindow)['__reset_test'] = 1;
    expect(bag(sandbox.proxyWindow)['__reset_test']).toBe(1);

    sandbox.reset();
    expect(sandbox.active).toBe(false);
    expect('__reset_test' in sandbox.proxyWindow).toBe(false);
  });

  // Catches: strict mode that only logs and still stores the value.
  it('throws in strict mode on writes to non-allowed globals and stores nothing', () => {
    const strictSandbox = new JsSandbox(['allowedThing'], true);
    strictSandbox.activate();
    const proxy = bag(strictSandbox.proxyWindow);

    expect(() => {
      proxy['__strict_test'] = 1;
    }).toThrow(TypeError);
    expect('__strict_test' in proxy).toBe(false);

    expect(() => strictSandbox.execScript('window.__strict_exec = 1')).toThrow(
      /Strict mode blocked write to global "__strict_exec"/
    );

    proxy['allowedThing'] = 'ok';
    expect(proxy['allowedThing']).toBe('ok');
    expect(bag(window)['allowedThing']).toBeUndefined();
  });

  // Catches: a proxy without a defineProperty trap, which defines on the real window.
  it('keeps Object.defineProperty writes off the real window', () => {
    const proxy = bag(sandbox.proxyWindow);
    Object.defineProperty(proxy, '__defined_test', {
      value: 7,
      configurable: true,
      writable: true,
    });

    expect(proxy['__defined_test']).toBe(7);
    expect(Object.prototype.hasOwnProperty.call(window, '__defined_test')).toBe(
      false
    );

    const strictSandbox = new JsSandbox([], true);
    expect(() =>
      Object.defineProperty(strictSandbox.proxyWindow, '__strict_define', {
        value: 1,
        configurable: true,
      })
    ).toThrow(TypeError);
    expect(
      Object.prototype.hasOwnProperty.call(window, '__strict_define')
    ).toBe(false);
  });

  // Catches: a partial redefine erasing the value, and non-configurable
  // descriptors tripping a Proxy invariant error from the engine.
  it('keeps the value on partial redefine and rejects non-configurable globals', () => {
    const proxy = bag(sandbox.proxyWindow);
    proxy['__partial'] = 'kept';
    Object.defineProperty(proxy, '__partial', { enumerable: false });
    expect(proxy['__partial']).toBe('kept');

    expect(() =>
      Object.defineProperty(proxy, '__frozen', {
        value: 1,
        configurable: false,
      })
    ).toThrow(/non-configurable global "__frozen"/);
    expect(() =>
      Object.defineProperty(proxy, '__accessor', { get: () => 1 })
    ).toThrow(/accessor global "__accessor"/);
    expect('__frozen' in proxy).toBe(false);
  });

  // Catches: binding a fresh function on every read.
  it('returns the same bound function on repeated reads', () => {
    const proxy = bag(sandbox.proxyWindow);
    const first = proxy['setTimeout'];
    const second = proxy['setTimeout'];
    expect(first).toBe(second);

    const handle = (first as typeof setTimeout)(() => {}, 0);
    clearTimeout(handle);
  });

  // Catches: execScript without a `with` scope, where sloppy-mode `x = 1`
  // and `var x` create properties on the real window.
  it('keeps bare global assignments in execScript off the real window', () => {
    sandbox.execScript(`
      __bare_assign = 1;
      var __bare_var = 2;
      window.window.__nested = 3;
      self.__via_self = 4;
      let __local_let = 5;
    `);

    for (const name of [
      '__bare_assign',
      '__bare_var',
      '__nested',
      '__via_self',
      '__local_let',
    ]) {
      expect(Object.prototype.hasOwnProperty.call(window, name)).toBe(false);
    }
    const proxy = bag(sandbox.proxyWindow);
    expect(proxy['__bare_assign']).toBe(1);
    expect(proxy['__bare_var']).toBe(2);
    expect(proxy['__nested']).toBe(3);
    expect(proxy['__via_self']).toBe(4);
    expect('__local_let' in proxy).toBe(false);

    // Later scripts read earlier sandbox globals; host globals still work.
    expect(
      sandbox.execScript(
        'return [__bare_assign + __bare_var, typeof __never_declared, Array.isArray([]), typeof setTimeout, this === window]'
      )
    ).toEqual([3, 'undefined', true, 'function', true]);
  });

  it('throws on bare global assignments in strict mode', () => {
    const strictSandbox = new JsSandbox(['okGlobal'], true);
    expect(() => strictSandbox.execScript('__strict_bare = 1')).toThrow(
      TypeError
    );
    expect(() => strictSandbox.execScript('var __strict_var = 1')).toThrow(
      TypeError
    );
    strictSandbox.execScript('okGlobal = 1');
    expect(bag(strictSandbox.proxyWindow)['okGlobal']).toBe(1);
    expect(Object.prototype.hasOwnProperty.call(window, '__strict_bare')).toBe(
      false
    );
    expect(Object.prototype.hasOwnProperty.call(window, 'okGlobal')).toBe(
      false
    );
  });

  // Catches: the with-scope claiming `eval`, so `eval(...)` becomes a bound
  // (indirect, global) eval that writes to the real window.
  it('keeps writes inside eval() off the real window', () => {
    sandbox.execScript(
      'eval("window.__leak_eval = 1; var __leak_var = 2; __leak_bare = 3")'
    );

    for (const name of ['__leak_eval', '__leak_var', '__leak_bare']) {
      expect(Object.prototype.hasOwnProperty.call(window, name)).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(globalThis, name)).toBe(
        false
      );
    }
    const proxy = bag(sandbox.proxyWindow);
    expect(proxy['__leak_eval']).toBe(1);
    expect(proxy['__leak_var']).toBe(2);
    expect(proxy['__leak_bare']).toBe(3);

    const strictSandbox = new JsSandbox([], true);
    expect(() =>
      strictSandbox.execScript('eval("window.__strict_eval = 1")')
    ).toThrow(TypeError);
    expect(() =>
      strictSandbox.execScript('eval("var __strict_eval_var = 1")')
    ).toThrow(TypeError);
    expect(Object.prototype.hasOwnProperty.call(window, '__strict_eval')).toBe(
      false
    );
    expect(
      Object.prototype.hasOwnProperty.call(globalThis, '__strict_eval_var')
    ).toBe(false);
  });

  // Catches: `top`/`parent`/`frames` returning the real window.
  it('returns the proxy for window self-references', () => {
    const proxy = sandbox.proxyWindow;
    expect(proxy.top).toBe(proxy);
    expect(proxy.parent).toBe(proxy);
    expect(proxy.self).toBe(proxy);
    sandbox.execScript('top.__via_top = 1; parent.__via_parent = 2');
    expect(Object.prototype.hasOwnProperty.call(window, '__via_top')).toBe(
      false
    );
    expect(bag(proxy)['__via_parent']).toBe(2);
  });

  it('should support delete operation on faked properties', () => {
    sandbox.activate();
    const proxy = bag(sandbox.proxyWindow);
    proxy['__delete_test'] = 'val';
    expect(proxy['__delete_test']).toBe('val');

    delete proxy['__delete_test'];
    expect(proxy['__delete_test']).toBeUndefined();

    sandbox.deactivate();
  });

  it('should support "in" operator', () => {
    sandbox.activate();
    const proxy = bag(sandbox.proxyWindow);
    proxy['__in_test'] = true;
    expect('__in_test' in proxy).toBe(true);
    expect('console' in proxy).toBe(true);

    sandbox.deactivate();
  });
});

// ─── CssSandbox ──────────────────────────────────────

describe('CssSandbox', () => {
  let cssSandbox: CssSandbox;
  let container: HTMLElement;

  beforeEach(() => {
    cssSandbox = new CssSandbox();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should wrap container in Shadow DOM', () => {
    const shadowRoot = cssSandbox.wrap(container);
    expect(container.shadowRoot).toBe(shadowRoot);
  });

  it('should return existing shadow root on second wrap', () => {
    const first = cssSandbox.wrap(container);
    const second = cssSandbox.wrap(container);
    expect(first).toBe(second);
  });

  it('should move existing children into shadow root', () => {
    const child = document.createElement('span');
    child.textContent = 'Hello';
    container.appendChild(child);

    const shadowRoot = cssSandbox.wrap(container);
    expect(shadowRoot.querySelector('span')?.textContent).toBe('Hello');
  });

  it('should add style to shadow root', () => {
    const shadowRoot = cssSandbox.wrap(container);
    const style = cssSandbox.addStyle(shadowRoot, '.test { color: red; }');

    expect(style.textContent).toBe('.test { color: red; }');
    expect(shadowRoot.querySelector('style')).toBe(style);
  });

  it('should remove style from shadow root', () => {
    const shadowRoot = cssSandbox.wrap(container);
    const style = cssSandbox.addStyle(shadowRoot, '.test { color: red; }');
    cssSandbox.removeStyle(shadowRoot, style);
    expect(shadowRoot.querySelector('style')).toBeNull();
  });

  // Catches: unwrap that forgets its bookkeeping but leaves the shadow root,
  // so the next wrap calls attachShadow again and throws.
  it('survives wrap → unwrap → wrap twice on the same host', () => {
    const content = document.createElement('p');
    content.textContent = 'app';
    container.appendChild(content);

    const first = cssSandbox.wrap(container);
    expect(content.parentNode).toBe(first);
    cssSandbox.unwrap(container);
    expect(content.parentNode).toBe(container);

    const second = cssSandbox.wrap(container);
    expect(second).toBe(first);
    expect(content.parentNode).toBe(second);
    expect(second.querySelectorAll('slot')).toHaveLength(0);
    cssSandbox.unwrap(container);

    const third = cssSandbox.wrap(container);
    expect(third).toBe(first);
    expect(Array.from(third.childNodes)).toEqual([content]);
  });

  // Catches: content moved back to the light DOM but hidden by a slotless shadow root.
  it('renders restored light DOM through a slot after unwrap', () => {
    const content = document.createElement('p');
    container.appendChild(content);
    const shadowRoot = cssSandbox.wrap(container);
    cssSandbox.addStyle(shadowRoot, 'p { color: red; }');

    cssSandbox.unwrap(container);

    expect(Array.from(container.childNodes)).toEqual([content]);
    const slot = shadowRoot.querySelector('slot');
    expect(slot).not.toBeNull();
    expect(slot!.assignedNodes()).toEqual([content]);
    expect(shadowRoot.querySelector('style')).toBeNull();
  });

  // Catches: unwrap discarding styles, so a remounted app renders unstyled.
  it('restores addStyle/adoptStyles stylesheets on the next wrap', () => {
    const shadowRoot = cssSandbox.wrap(container);
    const adopted = cssSandbox.adoptStyles(shadowRoot, {
      urls: ['/app.css'],
      cssText: '.a{}',
    });
    const added = cssSandbox.addStyle(shadowRoot, '.b{}');
    const removedLater = cssSandbox.addStyle(shadowRoot, '.c{}');
    shadowRoot.appendChild(document.createElement('main'));

    cssSandbox.unwrap(container);
    expect(shadowRoot.querySelectorAll('style, link')).toHaveLength(0);
    expect(container.querySelectorAll('style, link')).toHaveLength(0);

    // Removing while unwrapped means it does not come back.
    cssSandbox.removeStyle(shadowRoot, removedLater);
    // Adopting an already adopted URL while unwrapped does not duplicate it.
    expect(
      cssSandbox.adoptStyles(shadowRoot, { urls: ['/app.css'] }).elements
    ).toHaveLength(0);

    const again = new CssSandbox().wrap(container);
    expect(again).toBe(shadowRoot);
    expect(Array.from(shadowRoot.children)).toEqual([
      ...adopted.elements,
      added,
      container.shadowRoot!.querySelector('main'),
    ]);
  });

  it('reuses a shadow root attached by another CssSandbox instance', () => {
    const first = cssSandbox.wrap(container);
    const other = new CssSandbox();
    expect(other.wrap(container)).toBe(first);
  });

  it('adoptStyles inserts links and styles before app content, deduped by URL', () => {
    const shadowRoot = cssSandbox.wrap(container);
    const appRoot = document.createElement('div');
    shadowRoot.appendChild(appRoot);

    const a = cssSandbox.adoptStyles(shadowRoot, {
      urls: ['/a.css', '/b.css'],
      cssText: ':host { display: block; }',
    });
    const b = cssSandbox.adoptStyles(shadowRoot, {
      urls: ['/b.css', '/c.css'],
    });

    const order = Array.from(shadowRoot.children).map(
      (el) => el.getAttribute('href') ?? el.localName
    );
    expect(order).toEqual(['/a.css', '/b.css', 'style', '/c.css', 'div']);
    expect(b.elements).toHaveLength(1);

    a.remove();
    expect(
      Array.from(shadowRoot.children).map(
        (el) => el.getAttribute('href') ?? el.localName
      )
    ).toEqual(['/c.css', 'div']);
  });

  // Catches: a ready promise that resolves before the stylesheet loads, or never.
  it('adoptStyles.ready resolves after every link fires load or error', async () => {
    const shadowRoot = cssSandbox.wrap(container);
    const adopted = cssSandbox.adoptStyles(shadowRoot, {
      urls: ['/x.css', '/y.css'],
    });
    let settled = false;
    void adopted.ready.then(() => {
      settled = true;
    });

    adopted.elements[0]!.dispatchEvent(new Event('load'));
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);

    adopted.elements[1]!.dispatchEvent(new Event('error'));
    await adopted.ready;
    expect(settled).toBe(true);
  });
});

// ─── Sandbox (combined) ─────────────────────────────

describe('Sandbox', () => {
  it('should create with default options', () => {
    const sandbox = new Sandbox();
    expect(sandbox.css).toBeDefined();
    expect(sandbox.js).toBeDefined();
  });

  it('should activate both CSS and JS', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const sandbox = new Sandbox();

    const shadowRoot = sandbox.activate(container);
    expect(shadowRoot).toBeDefined();
    expect(sandbox.js.active).toBe(true);

    sandbox.deactivate(container);
    expect(sandbox.js.active).toBe(false);
  });

  // Catches: css:false still attaching a shadow root, which hides the container's children.
  it('should not attach a shadow root when CSS is disabled', () => {
    const container = document.createElement('div');
    container.appendChild(document.createElement('span'));
    document.body.appendChild(container);
    const sandbox = new Sandbox({ css: false });

    expect(sandbox.activate(container)).toBeNull();
    expect(container.shadowRoot).toBeNull();
    expect(container.children).toHaveLength(1);
    expect(sandbox.js.active).toBe(true);

    sandbox.deactivate(container);
  });

  it('reuses the shadow root across activate/deactivate cycles', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const sandbox = new Sandbox();

    const first = sandbox.activate(container);
    sandbox.deactivate(container);
    const second = sandbox.activate(container);
    sandbox.deactivate(container);
    const third = sandbox.activate(container);

    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('should skip JS when disabled', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const sandbox = new Sandbox({ js: false });

    sandbox.activate(container);
    expect(sandbox.js.active).toBe(false);

    sandbox.deactivate(container);
  });
});

// ─── Factory ─────────────────────────────────────────

describe('createSandbox', () => {
  it('should return an ISandbox instance', () => {
    const sandbox = createSandbox();
    expect(sandbox.css).toBeDefined();
    expect(sandbox.js).toBeDefined();
    expect(typeof sandbox.activate).toBe('function');
    expect(typeof sandbox.deactivate).toBe('function');
    expect(typeof sandbox.destroy).toBe('function');
  });
});

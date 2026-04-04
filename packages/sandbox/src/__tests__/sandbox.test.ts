import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JsSandbox } from '../js-sandbox';
import { CssSandbox } from '../css-sandbox';
import { Sandbox, createSandbox } from '../sandbox';

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
    (proxy as Record<string, unknown>)['__test_sandbox_var'] = 42;

    // Should be readable through proxy
    expect((proxy as Record<string, unknown>)['__test_sandbox_var']).toBe(42);

    // Should NOT be on real window
    expect(
      (window as Record<string, unknown>)['__test_sandbox_var']
    ).toBeUndefined();

    sandbox.deactivate();
  });

  it('should pass through allowed globals', () => {
    sandbox.activate();
    const proxy = sandbox.proxyWindow;

    // console should pass through
    expect((proxy as Record<string, unknown>)['console']).toBe(console);
    sandbox.deactivate();
  });

  it('should execute scripts in sandbox context', () => {
    sandbox.activate();
    sandbox.execScript('window.__sandbox_exec_test = "hello"');

    expect(
      (sandbox.proxyWindow as Record<string, unknown>)['__sandbox_exec_test']
    ).toBe('hello');

    expect(
      (window as Record<string, unknown>)['__sandbox_exec_test']
    ).toBeUndefined();

    sandbox.deactivate();
  });

  it('should reset all faked properties', () => {
    sandbox.activate();
    (sandbox.proxyWindow as Record<string, unknown>)['__reset_test'] = 1;
    expect(
      (sandbox.proxyWindow as Record<string, unknown>)['__reset_test']
    ).toBe(1);

    sandbox.reset();
    expect(sandbox.active).toBe(false);
  });

  it('should warn in strict mode when writing non-allowed globals', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const strictSandbox = new JsSandbox([], true);

    strictSandbox.activate();
    (strictSandbox.proxyWindow as Record<string, unknown>)['__strict_test'] = 1;

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Blocked write')
    );

    warnSpy.mockRestore();
    strictSandbox.deactivate();
  });

  it('should support delete operation on faked properties', () => {
    sandbox.activate();
    const proxy = sandbox.proxyWindow as Record<string, unknown>;
    proxy['__delete_test'] = 'val';
    expect(proxy['__delete_test']).toBe('val');

    delete proxy['__delete_test'];
    expect(proxy['__delete_test']).toBeUndefined();

    sandbox.deactivate();
  });

  it('should support "in" operator', () => {
    sandbox.activate();
    const proxy = sandbox.proxyWindow as Record<string, unknown>;
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
    expect(shadowRoot).toBeDefined();
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

  it('should skip CSS when disabled', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const sandbox = new Sandbox({ css: false });

    sandbox.activate(container);
    expect(sandbox.js.active).toBe(true);

    sandbox.deactivate(container);
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

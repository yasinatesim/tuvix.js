import { describe, it, expect, beforeEach } from 'vitest';
import homeApp from '../apps/home/main.js';
import aboutApp from '../apps/about/main.js';

describe('home micro-app', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('mounts and shows "Guest" when no user prop given', async () => {
    await homeApp.mount({ container, props: {} });
    expect(container.innerHTML).toContain('Guest');
  });

  it('mounts and shows provided user prop', async () => {
    await homeApp.mount({ container, props: { user: 'Alice' } });
    expect(container.innerHTML).toContain('Alice');
  });

  it('mounts and renders home heading', async () => {
    await homeApp.mount({ container, props: {} });
    expect(container.innerHTML).toContain('🏠 Home');
  });

  it('update re-renders with new props', async () => {
    await homeApp.mount({ container, props: { user: 'Alice' } });
    await homeApp.update({ container, props: { user: 'Bob' } });
    expect(container.innerHTML).toContain('Bob');
    expect(container.innerHTML).not.toContain('Alice');
  });

  it('escapes HTML in props', async () => {
    await homeApp.mount({
      container,
      props: { user: '<img src=x onerror=alert(1)>' },
    });
    expect(container.querySelector('img')).toBeNull();
  });

  it('unmount clears container', async () => {
    await homeApp.mount({ container, props: {} });
    expect(container.innerHTML).not.toBe('');
    await homeApp.unmount({ container });
    expect(container.innerHTML).toBe('');
  });
});

describe('about micro-app', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('mounts and renders about heading', async () => {
    await aboutApp.mount({ container });
    expect(container.innerHTML).toContain('ℹ️ About');
  });

  it('mounts and renders framework-free description', async () => {
    await aboutApp.mount({ container });
    expect(container.innerHTML).toContain('Zero framework dependencies');
  });

  it('unmount clears container', async () => {
    await aboutApp.mount({ container });
    expect(container.innerHTML).not.toBe('');
    await aboutApp.unmount({ container });
    expect(container.innerHTML).toBe('');
  });
});

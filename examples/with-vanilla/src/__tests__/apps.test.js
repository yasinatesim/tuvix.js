import { describe, it, expect, beforeEach } from 'vitest';
import homeApp from '../apps/home/main.js';
import aboutApp from '../apps/about/main.js';

describe('home micro-app', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('mounts and shows "Guest" when no user prop given', () => {
    homeApp.mount({ container, props: {} });
    expect(container.innerHTML).toContain('Guest');
  });

  it('mounts and shows provided user prop', () => {
    homeApp.mount({ container, props: { user: 'Alice' } });
    expect(container.innerHTML).toContain('Alice');
  });

  it('mounts and renders home heading', () => {
    homeApp.mount({ container, props: {} });
    expect(container.innerHTML).toContain('🏠 Home');
  });

  it('unmount clears container', () => {
    homeApp.mount({ container, props: {} });
    expect(container.innerHTML).not.toBe('');
    homeApp.unmount({ container });
    expect(container.innerHTML).toBe('');
  });
});

describe('about micro-app', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('mounts and renders about heading', () => {
    aboutApp.mount({ container });
    expect(container.innerHTML).toContain('ℹ️ About');
  });

  it('mounts and renders framework-free description', () => {
    aboutApp.mount({ container });
    expect(container.innerHTML).toContain('Zero framework dependencies');
  });

  it('unmount clears container', () => {
    aboutApp.mount({ container });
    expect(container.innerHTML).not.toBe('');
    aboutApp.unmount({ container });
    expect(container.innerHTML).toBe('');
  });
});

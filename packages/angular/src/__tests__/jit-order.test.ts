import { describe, expect, it } from 'vitest';
import { Component } from '@angular/core';
import { createAngularMicroApp } from '../index';

// This file must not import `@angular/common`, `@angular/platform-browser` or
// `@angular/compiler`. Each test file runs in its own module graph, so the
// adapter is the first code that can load them here.

const JitComponent = Component({
  selector: 'app-jit',
  standalone: true,
  template: '<p>{{ message }}</p>',
})(
  class JitComponent {
    message = 'compiled at runtime';
  }
);

function compilerFacadeLoaded(): boolean {
  const ng: unknown = Reflect.get(globalThis, 'ng');
  return typeof ng === 'object' && ng !== null && 'ɵcompilerFacade' in ng;
}

describe('JIT compiler ordering', () => {
  it('loads @angular/compiler before @angular/platform-browser for a JIT component', async () => {
    expect(compilerFacadeLoaded()).toBe(false);
    const app = createAngularMicroApp({
      name: 'jit-order',
      component: JitComponent,
    });
    const container = document.createElement('div');
    document.body.appendChild(container);

    await app.mount({ container });

    expect(compilerFacadeLoaded()).toBe(true);
    expect(container.textContent).toBe('compiled at runtime');
    await app.unmount({ container });
    container.remove();
  });
});

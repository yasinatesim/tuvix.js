import { describe, expect, it } from 'vitest';
import { Component, type OnDestroy } from '@angular/core';
import { isMounted } from '@tuvix.js/loader';
import { createAngularMicroApp } from '../index';

// Own file: a destroy that throws leaves Angular's browser platform half torn
// down, which would break later tests that need a fresh platform.

const ThrowOnDestroyComponent = Component({
  selector: 'app-throw-on-destroy',
  standalone: true,
  template: '<p>alive</p>',
})(
  class ThrowOnDestroyComponent implements OnDestroy {
    ngOnDestroy(): void {
      throw new Error('destroy failed');
    }
  }
);

describe('unmount when Angular destroy throws', () => {
  it('rejects, emits error then unmounted, and clears the mounted state', async () => {
    const name = 'destroy-throws';
    const app = createAngularMicroApp({
      name,
      component: ThrowOnDestroyComponent,
    });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const events: string[] = [];
    for (const type of ['mounted', 'unmounted', 'error']) {
      container.addEventListener(`tuvix:${type}`, () => events.push(type));
    }

    await app.mount({ container });
    expect(isMounted(name)).toBe(true);

    await expect(app.unmount({ container })).rejects.toThrow('destroy failed');

    expect(events).toEqual(['mounted', 'error', 'unmounted']);
    expect(isMounted(name)).toBe(false);
    expect(container.childNodes).toHaveLength(0);
    container.remove();
  });
});

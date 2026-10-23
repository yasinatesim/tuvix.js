// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { Component, type ApplicationRef } from '@angular/core';
import type * as PlatformBrowser from '@angular/platform-browser';
import type * as PlatformServer from '@angular/platform-server';
import { renderAngularToString } from '../server';

// Angular 18.2.21+, 19.2.15+ and 20.3+ (CVE-2025-59052) call the bootstrap
// callback with a BootstrapContext, and server-side `bootstrapApplication`
// throws NG0401 unless it receives that context as its third argument. The
// installed Angular 16 predates the change, so these mocks add it on top of
// the real Angular 16 render.

const context = { platformRef: { marker: 'platform' } };
const bootstrapCalls: unknown[][] = [];

vi.mock('@angular/platform-browser', async (importOriginal) => {
  const actual = await importOriginal<typeof PlatformBrowser>();
  const realBootstrap = actual.bootstrapApplication as (
    ...args: unknown[]
  ) => Promise<ApplicationRef>;
  return {
    ...actual,
    bootstrapApplication: (...args: unknown[]) => {
      bootstrapCalls.push(args);
      if (args[2] !== context) {
        return Promise.reject(new Error('NG0401: Missing Platform'));
      }
      return realBootstrap(args[0], args[1]);
    },
  };
});

vi.mock('@angular/platform-server', async (importOriginal) => {
  const actual = await importOriginal<typeof PlatformServer>();
  return {
    ...actual,
    renderApplication: (
      bootstrap: (ctx: unknown) => Promise<ApplicationRef>,
      options: { document: string }
    ) => actual.renderApplication(() => bootstrap(context), options),
  };
});

const CtxComponent = Component({
  selector: 'app-ctx',
  standalone: true,
  inputs: ['label'],
  template: '<b>{{ label }}</b>',
})(
  class CtxComponent {
    label = 'default';
  }
);

describe('renderAngularToString with a BootstrapContext', () => {
  it('forwards the context from renderApplication to bootstrapApplication', async () => {
    const html = await renderAngularToString(CtxComponent, {
      props: { label: 'with context' },
    });

    expect(bootstrapCalls).toHaveLength(1);
    expect(bootstrapCalls[0]?.[2]).toBe(context);
    expect(html).toMatch(/<app-ctx[^>]*><b>with context<\/b><\/app-ctx>$/);
  });
});

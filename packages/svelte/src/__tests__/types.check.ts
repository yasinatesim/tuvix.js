// Type-level checks, compiled by `check-types` (not run by vitest).
// They fail the type check if the documented usage stops compiling.
import { render } from 'svelte/server';
import { SvelteMap } from 'svelte/reactivity';
import { createSsrSvelteMicroApp, createSvelteMicroApp } from '../index';
import { renderSvelte, renderSvelteToString } from '../server';
import type { RenderSvelteOptions } from '../server';

declare const Footer: unknown;

export const options = { render } satisfies RenderSvelteOptions;

export const html: Promise<string> = renderSvelteToString(
  Footer,
  { year: 2026 },
  { render }
);

export const parts = renderSvelte(Footer, { year: 2026 }, { render });

// A function that doesn't return `{ head, body }` must be rejected.
// @ts-expect-error -- render must return { head, body }
export const wrong = { render: () => 42 } satisfies RenderSvelteOptions;

// Svelte's own `SvelteMap` class fits the `SvelteMap` option.
export const reactiveApp = createSvelteMicroApp({
  name: 'footer',
  App: Footer,
  SvelteMap,
});
export const reactiveSsrApp = createSsrSvelteMicroApp({
  name: 'footer-ssr',
  App: Footer,
  SvelteMap,
});

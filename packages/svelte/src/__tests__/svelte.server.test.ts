// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { renderSvelte, renderSvelteToString } from '../server';
import { compileSvelte } from './compile-svelte';

const CARD = `
<script>
  let { title = 'Untitled' } = $props();
</script>
<svelte:head><title>{title} | site</title></svelte:head>
<h2 class="card">{title}</h2>
<style>
  .card { color: teal; }
</style>
`;

let CardInjected: unknown;
let CardExternal: unknown;

beforeAll(async () => {
  CardInjected = await compileSvelte(CARD, {
    generate: 'server',
    css: 'injected',
  });
  CardExternal = await compileSvelte(CARD, {
    generate: 'server',
    css: 'external',
  });
});

describe('renderSvelteToString with Svelte 5', () => {
  it('returns the component CSS followed by its hydratable markup', async () => {
    const html = await renderSvelteToString(CardInjected, { title: 'Hi' });

    expect(html).toMatch(
      /^<style id="svelte-[a-z0-9]+">\.card\.svelte-[a-z0-9]+ ?\{color:teal;?\}<\/style><!--\[--><h2 class="card svelte-[a-z0-9]+">Hi<\/h2><!--\]-->$/
    );
  });

  it('leaves CSS out when the component was compiled with css: external', async () => {
    const html = await renderSvelteToString(CardExternal, { title: 'Hi' });

    expect(html).not.toContain('<style');
    expect(html).toMatch(/<h2 class="card svelte-[a-z0-9]+">Hi<\/h2>/);
  });

  it('uses the render function you pass', async () => {
    const spy = vi.fn(render);

    const html = await renderSvelteToString(
      CardInjected,
      { title: 'Passed' },
      { render: spy }
    );

    expect(spy).toHaveBeenCalledWith(CardInjected, {
      props: { title: 'Passed' },
    });
    expect(html).toContain('>Passed</h2>');
  });
});

describe('renderSvelte with Svelte 5', () => {
  it('splits markup, <svelte:head> content and CSS', async () => {
    const result = await renderSvelte(CardInjected, { title: 'Hi' });

    expect(result.html).toMatch(/^<!--\[--><h2 [^>]*>Hi<\/h2><!--\]-->$/);
    expect(result.head).toContain('<title>Hi | site</title>');
    expect(result.head).not.toContain('<style');
    expect(result.css).toMatch(/^<style id="svelte-[a-z0-9]+">[^<]+<\/style>$/);
  });
});

describe('Svelte 5 components compiled with dev: true', () => {
  // vite-plugin-svelte compiles with dev: true in serve mode. Those
  // components carry a legacy `render` stub that throws.
  let CardDev: { render?: unknown };

  beforeAll(async () => {
    CardDev = (await compileSvelte(CARD, {
      generate: 'server',
      css: 'injected',
      dev: true,
    })) as { render?: unknown };
  });

  it('carries a render stub (precondition)', () => {
    expect(typeof CardDev.render).toBe('function');
  });

  it('renders with the render function you pass', async () => {
    const html = await renderSvelteToString(
      CardDev,
      { title: 'Dev' },
      { render }
    );

    expect(html).toMatch(/^<style id="svelte-[a-z0-9]+">/);
    expect(html).toContain('>Dev</h2>');
  });

  it('renders without a render function', async () => {
    const result = await renderSvelte(CardDev, { title: 'Dev' });

    expect(result.html).toMatch(/<h2 [^>]*>Dev<\/h2>/);
    expect(result.head).toContain('<title>Dev | site</title>');
  });
});

// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { renderSvelte, renderSvelteToString } from '../server';

// Svelte 3/4 'svelte' exports no `mount`; the renderer must call App.render.
vi.mock('svelte', () => ({ tick: async () => {} }));

describe('renderSvelte with Svelte 3/4', () => {
  // Svelte 3/4 SSR components are objects with a static render().
  const LegacyCard = {
    render: vi.fn((props: Record<string, unknown>) => ({
      html: `<h2>${String(props.title)}</h2>`,
      head: '<title>legacy</title>',
      css: { code: 'h2{color:red}', map: null },
    })),
  };

  it('calls App.render and wraps css.code in a style tag', async () => {
    const html = await renderSvelteToString(LegacyCard, { title: 'Old' });

    expect(LegacyCard.render).toHaveBeenCalledWith({ title: 'Old' });
    expect(html).toBe('<style>h2{color:red}</style><h2>Old</h2>');
  });

  it('returns head separately and omits empty CSS', async () => {
    const result = await renderSvelte({
      render: () => ({ html: '<p>x</p>', head: '<meta x>', css: { code: '' } }),
    });

    expect(result).toEqual({ html: '<p>x</p>', head: '<meta x>', css: '' });
  });
});

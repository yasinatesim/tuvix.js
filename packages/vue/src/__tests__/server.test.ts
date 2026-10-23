// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Teleport, defineComponent, h, inject } from 'vue';
import { TUVIX_PROPS_KEY } from '../root';
import { renderVueToString } from '../server';
import type { VueSsrContext } from '../server';

describe('renderVueToString on the server', () => {
  it('renders the component with props', async () => {
    const App = defineComponent({
      props: { title: String },
      setup: (props) => () => h('h1', props.title),
    });

    expect(await renderVueToString(App, { title: 'Hello' })).toBe(
      '<h1>Hello</h1>'
    );
  });

  it("provides props under 'tuvixProps' like the client adapter", async () => {
    const App = defineComponent({
      setup() {
        const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY);
        return () => h('p', String(props?.theme));
      },
    });

    // `theme` also falls through as an attribute, as with any Vue root prop.
    expect(await renderVueToString(App, { theme: 'dark' })).toMatch(
      /^<p[^>]*>dark<\/p>$/
    );
  });

  it('installs plugins, including tuple options', async () => {
    const App = defineComponent({
      setup: () => {
        const greeting = inject<string>('greeting');
        return () => h('p', greeting);
      },
    });
    const plugin = {
      install(
        app: { provide: (k: string, v: unknown) => void },
        opts: { greeting: string }
      ) {
        app.provide('greeting', opts.greeting);
      },
    };

    expect(
      await renderVueToString(App, {}, [[plugin, { greeting: 'hi' }]])
    ).toBe('<p>hi</p>');
  });

  it('writes teleported HTML into the ssrContext you pass', async () => {
    const App = defineComponent({
      setup: () => () =>
        h('div', [h(Teleport, { to: '#modals' }, [h('dialog', 'open')])]),
    });
    const ssrContext: VueSsrContext = {};

    const html = await renderVueToString(App, {}, [], ssrContext);

    expect(html).not.toContain('<dialog>');
    expect(ssrContext.teleports?.['#modals']).toContain(
      '<dialog>open</dialog>'
    );
  });
});

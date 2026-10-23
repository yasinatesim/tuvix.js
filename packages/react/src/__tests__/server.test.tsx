// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { MicroAppModule } from '@tuvix.js/loader';
import { TuvixIsland, TuvixReactApp } from '../index';

const app: MicroAppModule = {
  mount: () => {
    throw new Error('mount must not run on the server');
  },
  unmount: () => {},
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('server rendering', () => {
  // Catches: the island dropping or escaping ssrHtml, or calling mount on the server.
  it('TuvixIsland puts ssrHtml inside its data-tuvix-app element', () => {
    const html = renderToString(
      <main>
        <TuvixIsland
          name="footer"
          app={app}
          ssrHtml='<footer class="site">© 2026 <a href="/blog">Blog</a></footer>'
        />
      </main>
    );

    expect(html).toMatch(
      /^<main><div data-tuvix-app="footer" data-tuvix-island="[^"]+"><footer class="site">© 2026 <a href="\/blog">Blog<\/a><\/footer><\/div><\/main>$/
    );
  });

  it('TuvixIsland renders an empty element without ssrHtml', () => {
    const html = renderToString(
      <TuvixIsland name="client-only" app={app} as="aside" />
    );
    expect(html).toMatch(
      /^<aside data-tuvix-app="client-only" data-tuvix-island="[^"]+"><\/aside>$/
    );
  });

  // Catches: a throw inside one TuvixReactApp aborting the whole page render.
  it('a server error inside one TuvixReactApp only replaces that app', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const Broken = (): never => {
      throw new Error('GitHub 403');
    };
    const Hero = ({ title }: { title: string }) => <h1>{title}</h1>;

    const html = renderToString(
      <main>
        <TuvixReactApp
          name="github-app"
          App={Broken}
          fallback={<p>Repos unavailable</p>}
        />
        <TuvixReactApp name="home-app" App={Hero} title="Hello" />
      </main>
    );

    expect(html).toContain('<div data-tuvix-app="github-app"><!--$!-->');
    expect(html).toContain('<p>Repos unavailable</p>');
    expect(html).toContain(
      '<div data-tuvix-app="home-app"><!--$--><h1>Hello</h1><!--/$--></div>'
    );
  });
});

// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createMarkdownRenderer } from 'vitepress';
import {
  resolveHome,
  isExternal,
  DEFAULT_INSTALL_COMMAND,
} from '../home/model';
import { tokenize, tokenizeLine } from '../home/highlight';
import { HOST_SNIPPET } from '../home/showcase';

const WEBSITE = resolve(__dirname, '../../../..');
const LOCALES = ['', 'tr', 'de', 'es', 'fr', 'it', 'ja', 'pt', 'zh', 'hi'];

let parseFrontmatter: (file: string) => Record<string, unknown>;

beforeAll(async () => {
  // Parse frontmatter with VitePress's own markdown pipeline, as the site does.
  const md = await createMarkdownRenderer(WEBSITE);
  parseFrontmatter = (file) => {
    const env: { frontmatter?: Record<string, unknown> } = {};
    md.render(readFileSync(resolve(WEBSITE, file), 'utf-8'), env);
    return env.frontmatter ?? {};
  };
});

describe('resolveHome with the English home frontmatter', () => {
  it('reads every Orbit section from website/index.md', () => {
    const home = resolveHome(parseFrontmatter('index.md'), {
      logo: '/logo.svg',
    });

    expect(home.hero.title).toBe('Many apps.');
    expect(home.hero.accent).toBe('One experience.');
    expect(home.hero.logo.src).toBe('/logo.svg');
    expect(home.hero.actions.map((a) => [a.theme, a.link])).toEqual([
      ['brand', '/guide/getting-started'],
      ['alt', '/playground'],
    ]);
    expect(home.hero.install.command).toBe('npx create-tuvix-app');
    expect(home.features.items).toHaveLength(8);
    expect(home.frameworks?.items.map((f) => f.name)).toEqual([
      'React',
      'Vue',
      'Svelte',
      'Angular',
      'Vanilla JS',
    ]);
    expect(home.footer.columns.length).toBeGreaterThan(0);
    expect(home.showMarkdown).toBe(false);
  });

  it('lists every workspace package, including @tuvix.js/vite', () => {
    const home = resolveHome(parseFrontmatter('index.md'));
    const names = home.packages?.items.map((p) => p.name) ?? [];

    expect(names).toContain('@tuvix.js/vite');
    expect(names).toContain('create-tuvix-app');
    expect(names).toContain('tuvix.js');
    expect(new Set(names).size).toBe(names.length);
    expect(home.packages?.title).toContain(String(names.length));
  });

  it('uses install commands that name the package the card describes', () => {
    const home = resolveHome(parseFrontmatter('index.md'));
    for (const fw of home.frameworks?.items ?? []) {
      expect(fw.install).toMatch(/^npm i @tuvix\.js\/[a-z-]+$/);
    }
  });
});

describe('resolveHome locale fallback', () => {
  it.each(LOCALES)(
    'renders a headline, actions and features for the "%s" home page',
    (locale) => {
      const fm = parseFrontmatter(locale ? `${locale}/index.md` : 'index.md');
      const home = resolveHome(fm);

      expect(home.hero.title.length).toBeGreaterThan(0);
      expect(home.hero.actions.length).toBeGreaterThan(0);
      expect(home.features.items.length).toBeGreaterThan(0);
      expect(home.features.items).toHaveLength(
        (fm.features as unknown[]).length
      );
    }
  );

  it('maps legacy VitePress hero fields onto the Orbit hero', () => {
    const home = resolveHome(
      {
        hero: {
          name: 'Tuvix.js',
          text: 'Mikro Frontend Framework',
          tagline: 'Açıklama',
          image: { src: '/logo.svg', alt: 'Tuvix.js' },
          actions: [
            {
              theme: 'brand',
              text: 'Başlarken',
              link: '/tr/guide/getting-started',
            },
            {
              theme: 'alt',
              text: 'GitHub',
              link: 'https://github.com/yasinatesim/tuvix.js',
            },
          ],
        },
        features: [
          { icon: '🔧', title: 'Framework Bağımsız', details: 'Detay' },
        ],
      },
      { logo: '/theme-logo.svg' }
    );

    expect(home.hero.title).toBe('Tuvix.js');
    expect(home.hero.accent).toBe('Mikro Frontend Framework');
    expect(home.hero.logo).toEqual({ src: '/logo.svg', alt: 'Tuvix.js' });
    expect(home.hero.install.command).toBe(DEFAULT_INSTALL_COMMAND);
    expect(home.features.items[0].icon).toBe('🔧');
    expect(home.frameworks).toBeUndefined();
    expect(home.packages).toBeUndefined();
    expect(home.showMarkdown).toBe(true);
  });

  it('falls back to the theme logo and site title when the hero has no image', () => {
    const home = resolveHome(
      {},
      { logo: '/theme-logo.svg', siteTitle: 'Site' }
    );

    expect(home.hero.logo).toEqual({ src: '/theme-logo.svg', alt: 'Site' });
    expect(home.hero.title).toBe('Site');
    expect(home.hero.actions).toEqual([]);
    expect(home.features.items).toEqual([]);
  });

  it('drops incomplete entries instead of rendering empty cards', () => {
    const home = resolveHome({
      hero: { actions: [{ text: 'No link' }, { link: '/x' }, 'junk'] },
      features: [{ title: 'Only title' }, { title: 'Ok', details: 'Yes' }],
      frameworks: { items: [{ name: 'React', details: 'x' }] },
      packages: { items: [{ name: 'a', details: 'b' }, { details: 'c' }] },
      footer: { columns: [{ title: 'Empty', links: [] }] },
    });

    expect(home.hero.actions).toEqual([]);
    expect(home.features.items.map((f) => f.title)).toEqual(['Ok']);
    expect(home.frameworks).toBeUndefined();
    expect(home.packages?.items).toEqual([
      { name: 'a', details: 'b', link: undefined },
    ]);
    expect(home.footer.columns).toEqual([]);
  });

  it('uses the frontmatter icon, infers it from a framework name, and drops unknown values', () => {
    const home = resolveHome({
      frameworks: {
        items: [
          { name: 'Svelte', details: 'd', install: 'npm i @tuvix.js/svelte' },
          {
            name: 'Vanilla JS',
            icon: 'javascript',
            details: 'd',
            install: 'npm i @tuvix.js/core',
          },
          {
            name: 'Solid',
            icon: 'solid',
            details: 'd',
            install: 'npm i solid-js',
          },
        ],
      },
    });

    expect(home.frameworks?.items.map((f) => f.icon)).toEqual([
      'svelte',
      'javascript',
      undefined,
    ]);
  });
});

describe('isExternal', () => {
  it('separates off-site links from docs routes', () => {
    expect(isExternal('https://github.com/yasinatesim/tuvix.js')).toBe(true);
    expect(isExternal('//cdn.example.com/x.js')).toBe(true);
    expect(isExternal('mailto:hi@example.com')).toBe(true);
    expect(isExternal('/guide/getting-started')).toBe(false);
    expect(isExternal('guide/routing')).toBe(false);
  });
});

describe('tokenize', () => {
  it('keeps the snippet text intact', () => {
    const lines = tokenize(HOST_SNIPPET);
    expect(lines.map((tokens) => tokens.map((t) => t.text).join(''))).toEqual(
      HOST_SNIPPET.replace(/\n$/, '').split('\n')
    );
  });

  it('classifies keywords, calls, strings and object keys', () => {
    const tokens = tokenizeLine(
      "const app = createOrchestrator({ mode: 'history' }); // go"
    );
    const kinds = (kind: string) =>
      tokens.filter((t) => t.kind === kind).map((t) => t.text);

    expect(kinds('keyword')).toEqual(['const']);
    expect(kinds('fn')).toEqual(['createOrchestrator']);
    expect(kinds('prop')).toEqual(['mode']);
    expect(kinds('string')).toEqual(["'history'"]);
    expect(kinds('comment')).toEqual(['// go']);
  });

  it('does not treat object prototype names as keywords', () => {
    expect(tokenizeLine('constructor').map((t) => t.kind)).toEqual(['plain']);
  });
});

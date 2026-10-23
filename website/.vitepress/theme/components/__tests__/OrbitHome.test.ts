// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import OrbitHome from '../home/OrbitHome.vue';

// Plain `{ value }` holders stand in for VitePress's refs; each render mounts a fresh app.
const data = vi.hoisted(() => ({
  frontmatter: { value: {} as Record<string, unknown> },
  theme: { value: {} as Record<string, unknown> },
  site: { value: { title: 'Tuvix.js' } },
}));

vi.mock('vitepress', () => ({
  useData: () => data,
  withBase: (path: string) => `/docs${path}`,
}));

async function render(frontmatter: Record<string, unknown>): Promise<string> {
  data.frontmatter.value = frontmatter;
  const app = createSSRApp({ render: () => h(OrbitHome) });
  const markdownBody = defineComponent({
    render: () => h('div', { 'data-testid': 'markdown-body' }, 'body'),
  });
  // VitePress registers the markdown body as the global `Content` component; stub it under that name.
  // eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
  app.component('Content', markdownBody);
  return renderToString(app);
}

const ORBIT_FRONTMATTER = {
  layout: 'home',
  markdownContent: false,
  hero: {
    badge: 'TypeScript microfrontends',
    title: 'Many apps.',
    accent: 'One experience.',
    tagline: 'Tagline',
    actions: [
      { theme: 'brand', text: 'Get Started', link: '/guide/getting-started' },
      {
        theme: 'alt',
        text: 'GitHub',
        link: 'https://github.com/yasinatesim/tuvix.js',
      },
    ],
  },
  features: [
    {
      icon: 'route',
      title: 'Routing',
      details: 'Routes apps.',
      link: '/guide/routing',
      linkText: '@tuvix.js/router',
    },
  ],
  frameworks: {
    title: 'Pick your framework',
    items: [
      {
        name: 'React',
        details: 'Adapter',
        install: 'npm i @tuvix.js/react',
        link: '/guide/react',
      },
    ],
  },
  packages: {
    title: '1 package',
    items: [
      {
        name: '@tuvix.js/vite',
        details: 'Vite plugin',
        link: 'https://github.com/yasinatesim/tuvix.js',
      },
    ],
  },
  footer: {
    copyright: 'MIT License',
    columns: [{ title: 'Docs', links: [{ text: 'Guide', link: '/guide/' }] }],
  },
};

describe('OrbitHome', () => {
  beforeEach(() => {
    data.theme.value = { logo: '/logo.svg', siteTitle: 'Tuvix.js' };
  });

  it('renders the headline with the accent span inside one h1', async () => {
    const html = await render(ORBIT_FRONTMATTER);
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(h1?.[1]).toContain('Many apps.');
    expect(h1?.[1]).toMatch(/<span[^>]*>One experience\.<\/span>/);
  });

  it('prefixes internal links with the site base and opens external links in a new tab', async () => {
    const html = await render(ORBIT_FRONTMATTER);

    expect(html).toContain('href="/docs/guide/getting-started"');
    expect(html).toMatch(
      /<a href="https:\/\/github\.com\/yasinatesim\/tuvix\.js"[^>]*target="_blank"[^>]*rel="noreferrer"/
    );
    expect(html).toContain('href="/docs/guide/routing"');
  });

  it('renders the logo from the hero image path so swapping /logo.svg updates it', async () => {
    const html = await render(ORBIT_FRONTMATTER);
    expect(html).toMatch(/<img src="\/docs\/logo\.svg" alt="Tuvix\.js"/);
  });

  it('renders frameworks, packages and footer sections from frontmatter', async () => {
    const html = await render(ORBIT_FRONTMATTER);

    expect(html).toContain('id="orbit-frameworks-title"');
    expect(html).toContain('npm i');
    expect(html).toContain('@tuvix.js/react');
    expect(html).toContain('@tuvix.js/vite');
    expect(html).toContain('MIT License');
    expect(html).toContain(
      'aria-label="Copy install command: npm i @tuvix.js/react"'
    );
  });

  it('hides the markdown body when markdownContent is false', async () => {
    expect(await render(ORBIT_FRONTMATTER)).not.toContain(
      'data-testid="markdown-body"'
    );
    expect(
      await render({ ...ORBIT_FRONTMATTER, markdownContent: true })
    ).toContain('data-testid="markdown-body"');
  });

  it('renders a legacy locale home without the Orbit-only sections', async () => {
    const html = await render({
      layout: 'home',
      hero: {
        name: 'Tuvix.js',
        text: 'Mikro Frontend Framework',
        actions: [
          {
            theme: 'brand',
            text: 'Başlarken',
            link: '/tr/guide/getting-started',
          },
        ],
      },
      features: [{ icon: '🔧', title: 'Framework Bağımsız', details: 'Detay' }],
    });

    expect(html).toContain('Mikro Frontend Framework');
    expect(html).toContain('href="/docs/tr/guide/getting-started"');
    expect(html).toContain('🔧');
    expect(html).not.toContain('id="orbit-frameworks-title"');
    expect(html).not.toContain('id="orbit-packages-title"');
    expect(html).toContain('data-testid="markdown-body"');
  });

  it('shows the first shell app as mounted on the server render', async () => {
    const html = await render(ORBIT_FRONTMATTER);
    expect(html.match(/data-active="true"/g)).toHaveLength(1);
    expect(html).toContain('/dashboard/overview');
  });
});

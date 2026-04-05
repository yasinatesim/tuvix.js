import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  composeHTML,
  compileShellTemplate,
  createServerRenderer,
  createStreamingRenderer,
  createMetricsCollector,
} from '../index';

// ─── composeHTML ─────────────────────────────────────

describe('composeHTML', () => {
  it('should replace tuvix-slot tags with content', () => {
    const template =
      '<div><tuvix-slot name="header"></tuvix-slot><tuvix-slot name="main"></tuvix-slot></div>';
    const result = composeHTML(template, {
      header: '<h1>Hello</h1>',
      main: '<p>World</p>',
    });

    expect(result).toBe('<div><h1>Hello</h1><p>World</p></div>');
  });

  it('should replace self-closing tuvix-slot tags', () => {
    const template = '<div><tuvix-slot name="footer" /></div>';
    const result = composeHTML(template, {
      footer: '<footer>Footer</footer>',
    });

    expect(result).toBe('<div><footer>Footer</footer></div>');
  });

  it('should leave unmatched slots unchanged', () => {
    const template = '<div><tuvix-slot name="missing"></tuvix-slot></div>';
    const result = composeHTML(template, {});

    expect(result).toBe('<div><tuvix-slot name="missing"></tuvix-slot></div>');
  });
});

// ─── compileShellTemplate ────────────────────────────

describe('compileShellTemplate', () => {
  it('returns the same output as composeHTML', () => {
    const template =
      '<html><body><tuvix-slot name="header"></tuvix-slot><tuvix-slot name="main"></tuvix-slot></body></html>';
    const slots = {
      header: '<nav>Nav</nav>',
      main: '<article>Content</article>',
    };

    const compiled = compileShellTemplate(template);
    expect(compiled.render(slots)).toBe(composeHTML(template, slots));
  });

  it('exposes discovered slot names', () => {
    const template =
      '<tuvix-slot name="a"></tuvix-slot><tuvix-slot name="b" />';
    const compiled = compileShellTemplate(template);
    expect(compiled.slotNames).toContain('a');
    expect(compiled.slotNames).toContain('b');
    expect(compiled.slotNames).toHaveLength(2);
  });

  it('handles self-closing slots', () => {
    const template = '<div><tuvix-slot name="x" /></div>';
    const compiled = compileShellTemplate(template);
    expect(compiled.render({ x: '<span>hi</span>' })).toBe(
      '<div><span>hi</span></div>'
    );
  });

  it('reuses the same compiled instance across multiple renders', () => {
    const template =
      '<tuvix-slot name="hero"></tuvix-slot><tuvix-slot name="footer"></tuvix-slot>';
    const compiled = compileShellTemplate(template);

    expect(compiled.render({ hero: 'A', footer: 'B' })).toBe('AB');
    expect(compiled.render({ hero: 'C', footer: 'D' })).toBe('CD');
    expect(compiled.render({ hero: 'E', footer: 'F' })).toBe('EF');
  });
});

// ─── createServerRenderer (pre-compiled + metrics) ───

describe('createServerRenderer', () => {
  const shell =
    '<!DOCTYPE html><html><body><tuvix-slot name="header"></tuvix-slot><tuvix-slot name="main"></tuvix-slot></body></html>';

  it('composes fragments into the shell', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      const html = String(url).includes('header')
        ? '<nav>Nav</nav>'
        : '<article>Content</article>';
      return { ok: true, text: async () => html };
    }) as unknown as typeof fetch;

    const renderer = createServerRenderer({
      shellTemplate: shell,
      apps: [
        { name: 'header', ssrUrl: 'http://header/render', routes: ['/*'] },
        { name: 'main', ssrUrl: 'http://main/render', routes: ['/*'] },
      ],
    });

    const result = await renderer.render('/');
    expect(result.statusCode).toBe(200);
    expect(result.html).toContain('<nav>Nav</nav>');
    expect(result.html).toContain('<article>Content</article>');
    expect(result.headers['Content-Type']).toContain('text/html');

    vi.restoreAllMocks();
  });

  it('records metrics when a metrics collector is provided', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<nav>Nav</nav>',
    }) as unknown as typeof fetch;

    const metrics = createMetricsCollector();
    const renderer = createServerRenderer({
      shellTemplate: shell,
      apps: [
        { name: 'header', ssrUrl: 'http://header/render', routes: ['/*'] },
      ],
      metrics,
    });

    await renderer.render('/');

    const text = metrics.toPrometheusText();
    expect(text).toContain('tuvix_renders_total 1');
    expect(text).toContain('app="header"');

    vi.restoreAllMocks();
  });

  it('matches apps by route pattern', () => {
    const renderer = createServerRenderer({
      shellTemplate: shell,
      apps: [
        {
          name: 'dashboard',
          ssrUrl: 'http://dash/render',
          routes: ['/dashboard/*'],
        },
        { name: 'home', ssrUrl: 'http://home/render', routes: ['/home/*'] },
      ],
    });

    const dashApps = renderer.matchApps('/dashboard/overview');
    expect(dashApps.map((a) => a.name)).toContain('dashboard');
    expect(dashApps.map((a) => a.name)).not.toContain('home');
  });
});

// ─── createStreamingRenderer ─────────────────────────

describe('createStreamingRenderer', () => {
  const shell =
    '<html><body><tuvix-slot name="left">fallback-left</tuvix-slot><tuvix-slot name="right">fallback-right</tuvix-slot></body></html>';

  function makeRes() {
    const chunks: string[] = [];
    let ended = false;
    const headers: Record<string, string> = {};
    return {
      write: vi.fn((chunk: string) => {
        chunks.push(chunk);
      }),
      end: vi.fn(() => {
        ended = true;
      }),
      setHeader: vi.fn((name: string, value: string) => {
        headers[name] = value;
      }),
      get chunks() {
        return chunks;
      },
      get ended() {
        return ended;
      },
      get headers() {
        return headers;
      },
    };
  }

  it('sends the shell immediately before fragment scripts', async () => {
    const renderer = createStreamingRenderer({
      shellTemplate: shell,
      apps: [],
    });
    const res = makeRes();

    await renderer.stream('/', res);

    const written = res.chunks.join('');
    expect(written).toContain('tvx-slot-left');
    expect(written).toContain('tvx-slot-right');
    expect(res.ended).toBe(true);
  });

  it('sets chunked transfer encoding header', async () => {
    const renderer = createStreamingRenderer({
      shellTemplate: shell,
      apps: [],
    });
    const res = makeRes();

    await renderer.stream('/', res);

    expect(res.headers['Transfer-Encoding']).toBe('chunked');
  });

  it('injects fragment HTML via inline scripts', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      const html = String(url).includes('left')
        ? '<div>Left Content</div>'
        : '<div>Right Content</div>';
      return { ok: true, text: async () => html };
    }) as unknown as typeof fetch;

    const renderer = createStreamingRenderer({
      shellTemplate: shell,
      apps: [
        { name: 'left', ssrUrl: 'http://left/render', routes: ['/*'] },
        { name: 'right', ssrUrl: 'http://right/render', routes: ['/*'] },
      ],
    });

    const res = makeRes();
    await renderer.stream('/', res);

    const written = res.chunks.join('');
    // Inline scripts reference placeholder IDs
    expect(written).toContain('tvx-slot-left');
    expect(written).toContain('tvx-slot-right');
    // Fragment content is JSON-encoded in inline scripts
    expect(written).toContain('Left Content');
    expect(written).toContain('Right Content');
    // Shell body is closed after scripts
    expect(written).toContain('</body>');

    vi.restoreAllMocks();
  });

  it('includes fallback content in placeholder divs', async () => {
    const renderer = createStreamingRenderer({
      shellTemplate: shell,
      apps: [],
    });
    const res = makeRes();

    await renderer.stream('/', res);

    const written = res.chunks.join('');
    expect(written).toContain('fallback-left');
    expect(written).toContain('fallback-right');
  });

  it('records metrics when a metrics collector is provided', async () => {
    const metrics = createMetricsCollector();
    const renderer = createStreamingRenderer({
      shellTemplate: shell,
      apps: [],
      metrics,
    });

    const res = makeRes();
    await renderer.stream('/', res);

    const text = metrics.toPrometheusText();
    expect(text).toContain('tuvix_renders_total 1');
  });
});

// ─── createMetricsCollector ──────────────────────────

describe('createMetricsCollector', () => {
  let metrics: ReturnType<typeof createMetricsCollector>;

  beforeEach(() => {
    metrics = createMetricsCollector();
  });

  it('starts with zero renders', () => {
    expect(metrics.toPrometheusText()).toContain('tuvix_renders_total 0');
  });

  it('increments render count', () => {
    metrics.recordRender(42);
    metrics.recordRender(58);
    expect(metrics.toPrometheusText()).toContain('tuvix_renders_total 2');
  });

  it('records fragment fetch counts', () => {
    metrics.recordFragment('header', 10, false);
    metrics.recordFragment('header', 15, false);
    metrics.recordFragment('header', 20, true);

    const text = metrics.toPrometheusText();
    expect(text).toContain('tuvix_fragment_fetches_total{app="header"} 3');
    expect(text).toContain('tuvix_fragment_errors_total{app="header"} 1');
  });

  it('calculates average render duration', () => {
    metrics.recordRender(100);
    metrics.recordRender(200);

    const text = metrics.toPrometheusText();
    expect(text).toContain('tuvix_render_duration_ms_avg 150.00');
  });

  it('resets all counters', () => {
    metrics.recordRender(100);
    metrics.recordFragment('nav', 50, false);
    metrics.reset();

    const text = metrics.toPrometheusText();
    expect(text).toContain('tuvix_renders_total 0');
    expect(text).not.toContain('app="nav"');
  });

  it('produces valid prometheus text format', () => {
    metrics.recordRender(75);
    metrics.recordFragment('sidebar', 30, false);

    const text = metrics.toPrometheusText();
    // Must end with newline (Prometheus spec)
    expect(text.endsWith('\n')).toBe(true);
    // Must have HELP and TYPE lines
    expect(text).toContain('# HELP');
    expect(text).toContain('# TYPE');
  });
});

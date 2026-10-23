// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  composeHTML,
  compileShellTemplate,
  createServerRenderer,
  createStreamingRenderer,
  createMetricsCollector,
  createMiddleware,
  createStreamingMiddleware,
} from '../index';

/** Fragment HTML that breaks naive `String.replace` and inline scripts. */
const HOSTILE =
  "<p>$& $1 $` $' $$</p><script>document.body.setAttribute('data-ran','1')</script><!-- c --> --> </script>";

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

  // Catches: String.replace(pattern, content), which expands $& / $` / $' / $1.
  it('keeps $-patterns in fragment HTML literal', () => {
    const template = '<main><tuvix-slot name="m">fb</tuvix-slot></main>';
    expect(compileShellTemplate(template).render({ m: HOSTILE })).toBe(
      `<main>${HOSTILE}</main>`
    );
    expect(composeHTML(template, { m: HOSTILE })).toBe(
      `<main>${HOSTILE}</main>`
    );
  });

  // Catches: sequential per-slot replaces that re-scan inserted fragment HTML.
  it('does not fill slots that appear inside fragment HTML', () => {
    const template = '<tuvix-slot name="a" /><tuvix-slot name="b" />';
    const html = composeHTML(template, {
      a: '<tuvix-slot name="b" />',
      b: 'B',
    });
    expect(html).toBe('<tuvix-slot name="b" />B');
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

  // Catches: the old prefix check, which failed on `?query`.
  it('matches apps when the path has a query string or hash', () => {
    const renderer = createServerRenderer({
      shellTemplate: shell,
      apps: [
        {
          name: 'dashboard',
          ssrUrl: 'http://dash/render',
          routes: ['/dashboard/*'],
        },
        { name: 'user', ssrUrl: 'http://user/render', routes: ['/users/:id'] },
      ],
    });

    expect(renderer.matchApps('/dashboard?tab=1').map((a) => a.name)).toEqual([
      'dashboard',
    ]);
    expect(renderer.matchApps('/users/42#bio').map((a) => a.name)).toEqual([
      'user',
    ]);
    expect(renderer.matchApps('/dashboardx')).toEqual([]);
  });

  it('returns 502 only when every matched fragment failed', async () => {
    const apps = [
      { name: 'header', ssrUrl: 'http://header/render', routes: ['/*'] },
      { name: 'main', ssrUrl: 'http://main/render', routes: ['/shop/*'] },
    ];
    const renderer = createServerRenderer({ shellTemplate: shell, apps });
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;
    expect((await renderer.render('/shop')).statusCode).toBe(502);

    global.fetch = vi
      .fn()
      .mockImplementation(async (url: string) =>
        String(url).includes('header')
          ? { ok: true, text: async () => '<nav/>' }
          : { ok: false, status: 500 }
      ) as unknown as typeof fetch;
    expect((await renderer.render('/shop')).statusCode).toBe(200);

    const none = createServerRenderer({ shellTemplate: shell, apps: [] });
    expect((await none.render('/')).statusCode).toBe(200);

    vi.restoreAllMocks();
  });

  // Catches: error text written raw into <!-- -->, letting `-->` close the comment.
  it('escapes error messages inside the error comment', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = vi
      .fn()
      .mockRejectedValue(
        new Error('boom --> <img src=x onerror=alert(1)> --!> <!--')
      ) as unknown as typeof fetch;

    const renderer = createServerRenderer({
      shellTemplate:
        '<html><body><tuvix-slot name="main"></tuvix-slot></body></html>',
      apps: [{ name: 'main', ssrUrl: 'http://main/render', routes: ['/*'] }],
    });
    const { html } = await renderer.render('/');

    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.body.children).toHaveLength(0);
    expect(doc.body.childNodes).toHaveLength(1);
    expect(doc.body.firstChild!.nodeType).toBe(Node.COMMENT_NODE);
    expect(doc.body.firstChild!.textContent).toContain('boom');

    vi.restoreAllMocks();
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

  // Catches: JSON.stringify(html) inside <script>, where `</script>` ends the
  // script early and `<!--` changes how the script is tokenised.
  it('streams fragments containing </script>, <!-- and $& intact', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => HOSTILE,
    }) as unknown as typeof fetch;

    const renderer = createStreamingRenderer({
      shellTemplate:
        '<html><body><tuvix-slot name="main">fb</tuvix-slot></body></html>',
      apps: [{ name: 'main', ssrUrl: 'http://main/render', routes: ['/*'] }],
    });
    const res = makeRes();
    await renderer.stream('/', res);

    const doc = new DOMParser().parseFromString(
      res.chunks.join(''),
      'text/html'
    );
    const scripts = doc.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    // Nothing from the fragment leaked out of the script as real markup.
    expect(doc.body.querySelectorAll('p')).toHaveLength(0);

    // Run the streamed script against a live placeholder.
    document.body.innerHTML = '<div id="tvx-slot-main">fb</div>';
    new Function(scripts[0]!.textContent ?? '')();
    const expected = document.createElement('div');
    expected.innerHTML = HOSTILE;
    expect(document.body.innerHTML).toBe(expected.innerHTML);
    expect(document.getElementById('tvx-slot-main')).toBeNull();
    // The fragment's own <script> ran, as page scripts do.
    expect(document.body.getAttribute('data-ran')).toBe('1');
    document.body.removeAttribute('data-ran');
    document.body.innerHTML = '';

    vi.restoreAllMocks();
  });

  // Catches: `el.outerHTML = html`, which inserts <script> elements that never run.
  it('runs scripts inside a streamed fragment in order, keeping attributes', async () => {
    const fragment =
      '<p id="frag-p">server</p>' +
      '<script>document.getElementById("frag-p").textContent = "client"; document.getElementById("log").textContent += "1";</script>' +
      '<section><script nonce="n0nce" type="text/javascript" data-x="y">document.getElementById("log").textContent += "2";</script></section>' +
      '<script type="application/json" id="frag-data">{"a":1}</script>';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => fragment,
    }) as unknown as typeof fetch;

    const renderer = createStreamingRenderer({
      shellTemplate: '<html><body><tuvix-slot name="main" /></body></html>',
      apps: [{ name: 'main', ssrUrl: 'http://main/render', routes: ['/*'] }],
    });
    const res = makeRes();
    await renderer.stream('/', res);

    const doc = new DOMParser().parseFromString(
      res.chunks.join(''),
      'text/html'
    );
    document.body.innerHTML =
      '<output id="log"></output><div id="tvx-slot-main"></div>';
    new Function(doc.querySelector('script')!.textContent ?? '')();

    expect(document.getElementById('frag-p')!.textContent).toBe('client');
    expect(document.getElementById('log')!.textContent).toBe('12');
    const nonced = document.querySelector('section > script')!;
    expect(nonced.getAttribute('nonce')).toBe('n0nce');
    expect(nonced.getAttribute('type')).toBe('text/javascript');
    expect(nonced.getAttribute('data-x')).toBe('y');
    const data = document.getElementById('frag-data')!;
    expect(data.getAttribute('type')).toBe('application/json');
    expect(JSON.parse(data.textContent ?? '')).toEqual({ a: 1 });

    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // Catches: a slot parser that only knows `<tuvix-slot ...></tuvix-slot>`.
  it('creates placeholders for self-closing slots', async () => {
    const renderer = createStreamingRenderer({
      shellTemplate:
        '<html><body><tuvix-slot name="a"/><tuvix-slot name="b">fb</tuvix-slot></body></html>',
      apps: [],
    });
    const res = makeRes();
    await renderer.stream('/', res);

    const doc = new DOMParser().parseFromString(
      res.chunks.join(''),
      'text/html'
    );
    expect(doc.querySelector('tuvix-slot')).toBeNull();
    expect(doc.getElementById('tvx-slot-a')!.innerHTML).toBe('');
    expect(doc.getElementById('tvx-slot-b')!.innerHTML).toBe('fb');
  });

  /** Stream one fragment and run its swap script against a live placeholder. */
  async function swapInto(fragment: string): Promise<void> {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => fragment,
    }) as unknown as typeof fetch;
    const renderer = createStreamingRenderer({
      shellTemplate: '<html><body><tuvix-slot name="main" /></body></html>',
      apps: [{ name: 'main', ssrUrl: 'http://main/render', routes: ['/*'] }],
    });
    const res = makeRes();
    await renderer.stream('/', res);
    const doc = new DOMParser().parseFromString(
      res.chunks.join(''),
      'text/html'
    );
    document.body.innerHTML =
      '<output id="log"></output><div id="tvx-slot-main"></div>';
    new Function(doc.querySelector('script')!.textContent ?? '')();
  }

  // Catches: swapping every script in one synchronous loop, so an inline
  // script runs before the external library it depends on has loaded.
  it('waits for a blocking external script before running the next one', async () => {
    await swapInto(
      '<script src="/lib.js"></script>' +
        '<script>document.getElementById("log").textContent += "init;";</script>' +
        '<script src="/plugin.js"></script>' +
        '<script>document.getElementById("log").textContent += "done;";</script>'
    );
    const log = document.getElementById('log')!;
    const external = (src: string) =>
      document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)!;
    const pluginBefore = external('/plugin.js');

    expect(log.textContent).toBe('');

    log.textContent += 'lib;';
    external('/lib.js').dispatchEvent(new Event('load'));
    expect(log.textContent).toBe('lib;init;');
    // Only now was the second external script re-created.
    expect(external('/plugin.js')).not.toBe(pluginBefore);

    // A failed script must not stall the rest of the fragment.
    external('/plugin.js')!.dispatchEvent(new Event('error'));
    expect(log.textContent).toBe('lib;init;done;');

    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('does not wait for async scripts or data blocks', async () => {
    await swapInto(
      '<script src="/a.js" async></script>' +
        '<script type="application/json" src="/data.json"></script>' +
        '<script>document.getElementById("log").textContent += "ran";</script>'
    );
    expect(document.getElementById('log')!.textContent).toBe('ran');
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // Catches: inline scripts without the CSP nonce, which a strict policy blocks.
  it('puts the nonce option on every inline script it writes', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<p>x</p>',
    }) as unknown as typeof fetch;
    const renderer = createStreamingRenderer({
      shellTemplate:
        '<html><body><tuvix-slot name="a" /><tuvix-slot name="b" /></body></html>',
      apps: [
        { name: 'a', ssrUrl: 'http://a/render', routes: ['/*'] },
        { name: 'b', ssrUrl: 'http://b/render', routes: ['/*'] },
      ],
    });
    const res = makeRes();
    await renderer.stream('/', res, { nonce: 'r4nd"om' });

    const doc = new DOMParser().parseFromString(
      res.chunks.join(''),
      'text/html'
    );
    const nonces = Array.from(doc.querySelectorAll('script')).map((s) =>
      s.getAttribute('nonce')
    );
    expect(nonces).toEqual(['r4nd"om', 'r4nd"om']);
    vi.restoreAllMocks();
  });

  // Catches: `//host` paths producing a 200 shell plus one warning and one
  // fragment error per app.
  it('answers 400 once for a path that names another host', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = vi.fn() as unknown as typeof fetch;
    const metrics = createMetricsCollector();
    const renderer = createStreamingRenderer({
      shellTemplate: shell,
      apps: [
        { name: 'left', ssrUrl: 'http://left/render', routes: ['/*'] },
        { name: 'right', ssrUrl: 'http://right/render', routes: ['/*'] },
      ],
      metrics,
    });
    const res = { ...makeRes(), statusCode: 200 };

    await renderer.stream('//evil.test/x', res);

    expect(res.statusCode).toBe(400);
    expect(res.chunks.join('')).toBe('Bad Request');
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(metrics.toPrometheusText()).not.toContain('tuvix_fragment');
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

  // Catches: HELP/TYPE lines with labels, or repeated once per app.
  it('produces Prometheus text with one HELP and TYPE per metric family', () => {
    metrics.recordRender(75);
    metrics.recordFragment('sidebar', 30, false);
    metrics.recordFragment('header', 10, true);
    metrics.recordFragment('we"ird\\app\nname', 5, false);

    const text = metrics.toPrometheusText();
    expect(text.endsWith('\n')).toBe(true);

    const families = parsePrometheus(text);
    expect(families.get('tuvix_fragment_fetches_total')).toEqual({
      type: 'counter',
      samples: [
        { labels: { app: 'sidebar' }, value: 1 },
        { labels: { app: 'header' }, value: 1 },
        { labels: { app: 'we"ird\\app\nname' }, value: 1 },
      ],
    });
    expect(
      families.get('tuvix_fragment_errors_total')?.samples.map((s) => s.value)
    ).toEqual([0, 1, 0]);
    expect(families.get('tuvix_renders_total')).toEqual({
      type: 'counter',
      samples: [{ labels: {}, value: 1 }],
    });
  });
});

interface PromFamily {
  type: string;
  samples: Array<{ labels: Record<string, string>; value: number }>;
}

/**
 * Strict parser for the Prometheus text exposition format (0.0.4) subset we
 * emit. Throws on: HELP/TYPE with labels, duplicate HELP/TYPE, samples before
 * their TYPE, or samples of a family split across the output.
 */
function parsePrometheus(text: string): Map<string, PromFamily> {
  const families = new Map<string, PromFamily>();
  const helped = new Set<string>();
  let current: string | undefined;
  const metricName = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;

  for (const line of text.split('\n')) {
    if (line === '') continue;
    const meta = /^# (HELP|TYPE) (\S+) (.+)$/.exec(line);
    if (meta) {
      const [, kind, name, rest] = meta as unknown as [
        string,
        string,
        string,
        string,
      ];
      if (!metricName.test(name))
        throw new Error(`bad metric name in: ${line}`);
      if (kind === 'HELP') {
        if (helped.has(name)) throw new Error(`duplicate HELP for ${name}`);
        helped.add(name);
      } else {
        if (families.has(name)) throw new Error(`duplicate TYPE for ${name}`);
        if (
          !['counter', 'gauge', 'histogram', 'summary', 'untyped'].includes(
            rest
          )
        ) {
          throw new Error(`bad TYPE: ${line}`);
        }
        families.set(name, { type: rest, samples: [] });
        current = name;
      }
      continue;
    }
    const sample = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{(.*)\})? (\S+)$/.exec(line);
    if (!sample) throw new Error(`unparseable line: ${line}`);
    const name = sample[1]!;
    if (name !== current) throw new Error(`sample outside its family: ${line}`);
    const labels: Record<string, string> = {};
    const labelPattern = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:[^"\\]|\\.)*)"(,|$)/g;
    const body = sample[3] ?? '';
    let consumed = 0;
    let m: RegExpExecArray | null;
    while ((m = labelPattern.exec(body)) !== null) {
      labels[m[1]!] = m[2]!.replace(/\\(.)/g, (_, ch: string) =>
        ch === 'n' ? '\n' : ch
      );
      consumed = labelPattern.lastIndex;
    }
    if (consumed !== body.length) throw new Error(`bad labels: ${line}`);
    const value = Number(sample[4]);
    if (Number.isNaN(value)) throw new Error(`bad value: ${line}`);
    families.get(name)!.samples.push({ labels, value });
  }
  return families;
}

// ─── Middleware ──────────────────────────────────────

describe('createStreamingMiddleware', () => {
  function makeRes() {
    return {
      write: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
      status: vi.fn(() => ({ send: vi.fn() })),
    };
  }

  type StreamingRenderer = Parameters<typeof createStreamingMiddleware>[0];

  // Catches: next() called after the shell was flushed (Express then tries to
  // send headers twice).
  it('ends the response and skips next() when streaming fails mid-response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const renderer = {
      matchApps: () => [],
      stream: async (_path: string, res: { write(chunk: string): void }) => {
        res.write('<html>');
        throw new Error('boom');
      },
    } as unknown as StreamingRenderer;
    const res = makeRes();
    const next = vi.fn();

    await createStreamingMiddleware(renderer)({ url: '/' }, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.write).toHaveBeenCalledWith('<html>');
    expect(res.end).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });

  it('passes the error to next() when nothing was written yet', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('early');
    const renderer = {
      matchApps: () => [],
      stream: async () => {
        throw error;
      },
    } as unknown as StreamingRenderer;
    const res = makeRes();
    const next = vi.fn();

    await createStreamingMiddleware(renderer)({ url: '/' }, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.end).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  // Catches: `res.status?.(500)` on a Node ServerResponse (no `status`),
  // which leaves the request hanging.
  it('ends a plain Node response with 500 when there is no next()', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const renderer = {
      matchApps: () => [],
      stream: async () => {
        throw new Error('early');
      },
    } as unknown as StreamingRenderer;
    const res = {
      write: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
      statusCode: 200,
    };

    await createStreamingMiddleware(renderer)({ url: '/' }, res);

    expect(res.statusCode).toBe(500);
    expect(res.write).toHaveBeenCalledWith('Internal Server Error');
    expect(res.end).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });

  it('passes the nonce option through and forwards a 400 status', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const renderer = createStreamingRenderer({
      shellTemplate: '<html><body><tuvix-slot name="m" /></body></html>',
      apps: [],
    });
    const res = {
      write: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
      statusCode: 200,
    };
    const nonce = vi.fn(() => 'abc');

    await createStreamingMiddleware(renderer, { nonce })(
      { url: '//evil.test' },
      res
    );
    expect(nonce).toHaveBeenCalledWith({ url: '//evil.test' }, res);
    expect(res.statusCode).toBe(400);
    vi.restoreAllMocks();
  });
});

describe('fragment URLs', () => {
  function fetchedUrls(): URL[] {
    return vi
      .mocked(global.fetch)
      .mock.calls.map(([url]) => new URL(String(url)));
  }

  // Catches: `${ssrUrl}?path=...`, which yields `...?v=2?path=...`.
  it('keeps query parameters already in ssrUrl and adds path with its query', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<p/>',
    }) as unknown as typeof fetch;
    const renderer = createServerRenderer({
      shellTemplate: '<tuvix-slot name="main" />',
      apps: [
        {
          name: 'main',
          ssrUrl: 'http://main/render?v=2&lang=tr',
          routes: ['/shop/*'],
        },
      ],
    });

    const result = await renderer.render(
      '/shop/../items?sort=asc&next=http://x.test#top'
    );

    expect(result.statusCode).toBe(200);
    const [url] = fetchedUrls();
    expect(url!.origin + url!.pathname).toBe('http://main/render');
    expect(url!.searchParams.get('v')).toBe('2');
    expect(url!.searchParams.get('lang')).toBe('tr');
    expect(url!.searchParams.get('path')).toBe(
      '/shop/items?sort=asc&next=http://x.test'
    );
    vi.restoreAllMocks();
  });

  // Catches: middleware rendering `req.path`, which drops the query string.
  it('middleware sends originalUrl (with query) to fragment services', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<p/>',
    }) as unknown as typeof fetch;
    const renderer = createServerRenderer({
      shellTemplate: '<tuvix-slot name="main" />',
      apps: [{ name: 'main', ssrUrl: 'http://main/render', routes: ['/*'] }],
    });
    const req = {
      url: '/list?page=2',
      path: '/list',
      originalUrl: '/shop/list?page=2',
    };

    await createMiddleware(renderer)(req, {
      status: () => ({ send: vi.fn() }),
    });

    expect(fetchedUrls()[0]!.searchParams.get('path')).toBe(
      '/shop/list?page=2'
    );
    vi.restoreAllMocks();
  });
});

describe('createMiddleware', () => {
  it('sends the renderer status code (502 when all fragments failed)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }) as unknown as typeof fetch;
    const renderer = createServerRenderer({
      shellTemplate: '<tuvix-slot name="main" />',
      apps: [{ name: 'main', ssrUrl: 'http://main/render', routes: ['/*'] }],
    });
    const send = vi.fn();
    const status = vi.fn(() => ({ send }));

    await createMiddleware(renderer)(
      { url: '/' },
      { status, setHeader: vi.fn() }
    );

    expect(status).toHaveBeenCalledWith(502);
    expect(send).toHaveBeenCalledWith('<!-- SSR error: main (503) -->');
    vi.restoreAllMocks();
  });
});

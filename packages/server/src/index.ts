import { matchPath } from '@tuvix.js/router';

// ─── Types ──────────────────────────────────────────

export interface ServerAppConfig {
  /** Unique app name */
  name: string;

  /**
   * Absolute URL that returns the app's HTML fragment. The renderer sets a
   * `path` search parameter (request pathname plus query) and keeps any
   * parameters already in the URL.
   */
  ssrUrl: string;

  /** Route patterns this app handles */
  routes: string[];

  /** Optional timeout for SSR fetch (ms) */
  timeout?: number;
}

export interface ServerRendererConfig {
  /** Shell HTML template with <tuvix-slot> placeholders */
  shellTemplate: string;

  /** Registered micro apps for SSR */
  apps: ServerAppConfig[];

  /** Default fetch timeout (ms) */
  timeout?: number;

  /**
   * Optional metrics collector.
   * Use `createMetricsCollector()` to create one and pass it here.
   */
  metrics?: TuvixMetrics;
}

export interface RenderResult {
  html: string;
  statusCode: number;
  headers: Record<string, string>;
}

/**
 * Generic writable interface for BigPipe streaming.
 * Compatible with Node.js `ServerResponse` and any writable stream.
 */
export interface StreamingResponse {
  write(chunk: string): void;
  end(): void;
  setHeader(name: string, value: string): void;
  /** Set before the first write when the renderer answers 400 or 500 (Node's `ServerResponse.statusCode`). */
  statusCode?: number;
}

/**
 * Per-request options for `stream()`.
 */
export interface StreamOptions {
  /**
   * CSP nonce added to every inline `<script>` the renderer writes, so a
   * policy without `'unsafe-inline'` lets the fragment swaps run. Generate a
   * fresh one per response.
   */
  nonce?: string;
}

/**
 * Shell template whose slot names were scanned once, for repeated rendering.
 */
export interface CompiledTemplate {
  /** Slot names discovered in the template, in order of appearance. */
  slotNames: string[];
  /** Render the template with the given slot content (same output as `composeHTML`). */
  render(slots: Record<string, string>): string;
}

// ─── Metrics ────────────────────────────────────────

/**
 * Lightweight metrics collector for SSR observability.
 * Produces Prometheus-compatible text format — no external dependency needed.
 *
 * @example
 * ```ts
 * const metrics = createMetricsCollector();
 * const renderer = createServerRenderer({ ..., metrics });
 *
 * // Expose on /metrics endpoint
 * app.get('/metrics', (req, res) => {
 *   res.setHeader('Content-Type', 'text/plain; version=0.0.4');
 *   res.send(metrics.toPrometheusText());
 * });
 * ```
 */
export interface TuvixMetrics {
  /** Record a completed render cycle. */
  recordRender(durationMs: number): void;
  /** Record a fragment fetch result (success or error). */
  recordFragment(name: string, durationMs: number, isError: boolean): void;
  /** Emit Prometheus text format (text/plain; version=0.0.4). */
  toPrometheusText(): string;
  /** Reset all counters and histograms. */
  reset(): void;
}

export function createMetricsCollector(): TuvixMetrics {
  let renderCount = 0;
  let renderTotalMs = 0;
  let renderMaxMs = 0;

  const fragments: Record<
    string,
    { count: number; errors: number; totalMs: number; maxMs: number }
  > = {};

  function recordRender(durationMs: number): void {
    renderCount++;
    renderTotalMs += durationMs;
    if (durationMs > renderMaxMs) renderMaxMs = durationMs;
  }

  function recordFragment(
    name: string,
    durationMs: number,
    isError: boolean
  ): void {
    if (!fragments[name]) {
      fragments[name] = { count: 0, errors: 0, totalMs: 0, maxMs: 0 };
    }
    const s = fragments[name]!;
    s.count++;
    if (isError) s.errors++;
    s.totalMs += durationMs;
    if (durationMs > s.maxMs) s.maxMs = durationMs;
  }

  function toPrometheusText(): string {
    const lines: string[] = [];

    // Prometheus text format: one HELP and one TYPE line per metric family,
    // then every sample of that family. Labels go on samples only.
    function family(
      name: string,
      type: 'counter' | 'gauge',
      help: string,
      samples: Array<[labels: string, value: number | string]>
    ): void {
      if (samples.length === 0) return;
      lines.push(`# HELP ${name} ${help}`, `# TYPE ${name} ${type}`);
      for (const [labels, value] of samples) {
        lines.push(`${name}${labels} ${value}`);
      }
    }

    family('tuvix_renders_total', 'counter', 'Total number of SSR renders', [
      ['', renderCount],
    ]);
    family(
      'tuvix_render_duration_ms_total',
      'counter',
      'Cumulative render duration (ms)',
      [['', renderTotalMs]]
    );
    if (renderCount > 0) {
      family(
        'tuvix_render_duration_ms_avg',
        'gauge',
        'Average render duration (ms)',
        [['', (renderTotalMs / renderCount).toFixed(2)]]
      );
      family(
        'tuvix_render_duration_ms_max',
        'gauge',
        'Peak render duration (ms)',
        [['', renderMaxMs]]
      );
    }

    const entries = Object.entries(fragments).map(
      ([name, s]) => [`{app="${escapeLabelValue(name)}"}`, s] as const
    );
    family(
      'tuvix_fragment_fetches_total',
      'counter',
      'Total fetches per fragment',
      entries.map(([lbl, s]) => [lbl, s.count])
    );
    family(
      'tuvix_fragment_errors_total',
      'counter',
      'Total fetch errors per fragment',
      entries.map(([lbl, s]) => [lbl, s.errors])
    );
    family(
      'tuvix_fragment_avg_duration_ms',
      'gauge',
      'Average fetch duration per fragment (ms)',
      entries.map(([lbl, s]) => [lbl, (s.totalMs / s.count).toFixed(2)])
    );
    family(
      'tuvix_fragment_max_duration_ms',
      'gauge',
      'Peak fetch duration per fragment (ms)',
      entries.map(([lbl, s]) => [lbl, s.maxMs])
    );

    return lines.join('\n') + '\n';
  }

  function reset(): void {
    renderCount = 0;
    renderTotalMs = 0;
    renderMaxMs = 0;
    for (const key of Object.keys(fragments)) {
      delete fragments[key];
    }
  }

  return { recordRender, recordFragment, toPrometheusText, reset };
}

// ─── Internal Helpers ────────────────────────────────

/** Escape a Prometheus label value: backslash, double quote, newline. */
function escapeLabelValue(value: string): string {
  return value.replace(/[\\"\n]/g, (ch) => (ch === '\n' ? '\\n' : `\\${ch}`));
}

/** Escape a value for a double-quoted HTML attribute. */
function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/**
 * Make text safe inside `<!-- ... -->`: no `--` runs (which could close the
 * comment) and no `<` or `>`.
 */
function escapeComment(text: string): string {
  return text
    .replace(/-{2,}/g, '-')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * JSON-encode a string for an inline `<script>`. `<` and `>` become `\u003c`
 * and `\u003e`, so `</script>` and `<!--` in the value cannot end or
 * re-mode the script element. U+2028/U+2029 are escaped for older parsers.
 */
function toScriptString(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

type TemplateSegment =
  | { type: 'html'; content: string }
  | { type: 'slot'; name: string; fallback: string };

/**
 * Matches `<tuvix-slot name="x">fallback</tuvix-slot>` and
 * `<tuvix-slot name="x" />`. Group 1 is the slot name, group 2 the fallback
 * (undefined for the self-closing form).
 */
const SLOT_PATTERN =
  /<tuvix-slot\s+name=["']([^"']+)["']\s*(?:\/>|>([\s\S]*?)<\/tuvix-slot>)/g;

/**
 * Parse a shell template into alternating HTML and slot segments.
 * Used internally by the streaming renderer.
 */
function parseTemplateSegments(template: string): TemplateSegment[] {
  const segments: TemplateSegment[] = [];
  let lastIndex = 0;

  for (const match of template.matchAll(SLOT_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({
        type: 'html',
        content: template.slice(lastIndex, index),
      });
    }
    segments.push({
      type: 'slot',
      name: match[1]!,
      fallback: match[2] ?? '',
    });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < template.length) {
    segments.push({ type: 'html', content: template.slice(lastIndex) });
  }

  return segments;
}

/**
 * Split a request path into pathname and `?query` (the `#hash` is dropped),
 * with `..` runs and repeated slashes removed from the pathname. Returns
 * `null` for a pathname that names another host (`//evil.test`, `http://...`).
 */
function splitRequestPath(
  path: string
): { pathname: string; search: string } | null {
  const hashStart = path.indexOf('#');
  const withoutHash = hashStart >= 0 ? path.slice(0, hashStart) : path;
  const queryStart = withoutHash.indexOf('?');
  const pathname =
    queryStart >= 0 ? withoutHash.slice(0, queryStart) : withoutHash;
  if (pathname.includes('://') || pathname.startsWith('//')) return null;
  return {
    pathname: pathname.replace(/\.{2,}/g, '').replace(/\/+/g, '/'),
    search: queryStart >= 0 ? withoutHash.slice(queryStart) : '',
  };
}

/**
 * Fetch one app's fragment from `app.ssrUrl`, adding `path` as the `path`
 * search parameter (pathname plus `?query`; the `#hash` is dropped). Query
 * parameters already in `ssrUrl` are kept.
 */
async function fetchFragment(
  app: ServerAppConfig,
  path: string,
  defaultTimeout: number
): Promise<{ html: string; isError: boolean }> {
  const parts = splitRequestPath(path);
  if (!parts) {
    console.warn(`[Tuvix Server] Rejected suspicious path: ${path}`);
    return { html: `<!-- SSR error: invalid path -->`, isError: true };
  }

  const safePath = parts.pathname + parts.search;
  const timeoutMs = app.timeout ?? defaultTimeout;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = new URL(app.ssrUrl);
    url.searchParams.set('path', safePath);
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'text/html' },
    });

    if (!response.ok) {
      console.warn(
        `[Tuvix Server] SSR failed for "${app.name}" (${response.status})`
      );
      return {
        html: `<!-- SSR error: ${escapeComment(app.name)} (${response.status}) -->`,
        isError: true,
      };
    }

    return { html: await response.text(), isError: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown';
    console.warn(`[Tuvix Server] SSR failed for "${app.name}": ${message}`);
    return {
      html: `<!-- SSR error: ${escapeComment(app.name)} (${escapeComment(message)}) -->`,
      isError: true,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Apps whose `routes` match `path`, using the router's `matchPath` rules. */
function matchAppsByPath(
  apps: ServerAppConfig[],
  path: string
): ServerAppConfig[] {
  return apps.filter((app) =>
    app.routes.some((pattern) => matchPath(pattern, path).matched)
  );
}

/**
 * Browser-side function the streaming renderer inlines once per fragment.
 * Replaces placeholder `i` with HTML `h`, then swaps each inserted `<script>`
 * for a fresh copy (same attributes, `nonce` and text) so it executes.
 *
 * Scripts are swapped one at a time in document order. After an external
 * JavaScript `<script src>` without `async`, the next swap waits for its
 * `load` or `error` event, so `<script src=lib.js>` then `<script>Lib.init()`
 * works. `async` scripts, data blocks (`type="application/json"`) and
 * `nomodule` scripts in module-capable browsers never block. Kept ES5.
 */
const SWAP_FRAGMENT =
  'function(i,h){' +
  'var e=document.getElementById(i);if(!e)return;' +
  "var t=document.createElement('template');t.innerHTML=h;" +
  "var f=t.content,s=f.querySelectorAll('script'),k=0;" +
  'e.parentNode.replaceChild(f,e);' +
  'function next(){' +
  'while(k<s.length){' +
  "var o=s[k++];if(!o.parentNode)continue;var n=document.createElement('script'),a=o.attributes;" +
  'for(var j=0;j<a.length;j++)n.setAttribute(a[j].name,a[j].value);' +
  'if(o.nonce)n.nonce=o.nonce;' +
  "var y=o.hasAttribute('async'),w=!y&&o.hasAttribute('src')" +
  "&&!(o.hasAttribute('nomodule')&&'noModule' in n)" +
  "&&/^(module|.*(java|ecma)script.*)?$/i.test(o.getAttribute('type')||'');" +
  'if(!y)n.async=false;' +
  'n.text=o.text;' +
  'if(w)n.onload=n.onerror=function(){n.onload=n.onerror=null;next()};' +
  'o.parentNode.replaceChild(n,o);' +
  'if(w)return}' +
  '}' +
  'next()}';

// ─── Composer ───────────────────────────────────────

/**
 * Compose shell HTML template by replacing `<tuvix-slot>` placeholders
 * with micro app content. Slots without an entry in `slots` stay as they are.
 *
 * Runs one pass with a function replacer, so `$&`, `$1`, `` $` `` and `$'`
 * in fragment HTML stay literal, and a `<tuvix-slot>` inside fragment HTML
 * is never filled.
 *
 * @example
 * ```ts
 * const html = composeHTML('<main><tuvix-slot name="main" /></main>', {
 *   main: '<p>Hello</p>',
 * });
 * // '<main><p>Hello</p></main>'
 * ```
 */
export function composeHTML(
  template: string,
  slots: Record<string, string>
): string {
  return template.replace(SLOT_PATTERN, (whole, name: string) => {
    const content = Object.prototype.hasOwnProperty.call(slots, name)
      ? slots[name]
      : undefined;
    return content === undefined ? whole : content;
  });
}

/**
 * Scan a shell template's slot names once at server startup.
 * `render()` fills the slots in a single pass per request.
 *
 * @example
 * ```ts
 * const tmpl = compileShellTemplate(fs.readFileSync('./shell.html', 'utf8'));
 * // Per request:
 * const html = tmpl.render({ header: '...', main: '...' });
 * ```
 */
export function compileShellTemplate(template: string): CompiledTemplate {
  const namePattern = /<tuvix-slot\s+name=["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();

  while ((match = namePattern.exec(template)) !== null) {
    seen.add(match[1]!);
  }

  return {
    slotNames: [...seen],
    render(slots: Record<string, string>): string {
      return composeHTML(template, slots);
    },
  };
}

// ─── Server Renderer ────────────────────────────────

/**
 * Server-side renderer that fetches micro app HTML fragments
 * and composes them into a complete page.
 * Slot names are scanned once at creation; each render fills slots in one pass.
 *
 * @example
 * ```ts
 * const renderer = createServerRenderer({
 *   shellTemplate: '<html><body><tuvix-slot name="header" /><tuvix-slot name="main" /></body></html>',
 *   apps: [
 *     { name: 'header',    ssrUrl: 'http://header-service/render',  routes: ['/*'] },
 *     { name: 'dashboard', ssrUrl: 'http://dashboard-service/render', routes: ['/dashboard/*'] },
 *   ],
 * });
 *
 * const { html } = await renderer.render('/dashboard');
 * ```
 */
export function createServerRenderer(config: ServerRendererConfig) {
  const {
    shellTemplate,
    apps,
    timeout: defaultTimeout = 5000,
    metrics,
  } = config;

  const compiled = compileShellTemplate(shellTemplate);

  function matchApps(path: string): ServerAppConfig[] {
    return matchAppsByPath(apps, path);
  }

  async function fetchAppHTML(
    app: ServerAppConfig,
    path: string
  ): Promise<string> {
    const { html } = await fetchFragment(app, path, defaultTimeout);
    return html;
  }

  /**
   * Fetch every fragment matching `path` and compose the page.
   * `statusCode` is 502 when at least one app matched and every fragment
   * fetch failed; otherwise 200. Failed fragments render as an HTML comment.
   * A path whose pathname names another host (`//evil.test/x`) gets a 400
   * `Bad Request` text response, and no fragment is fetched.
   */
  async function render(path: string): Promise<RenderResult> {
    if (!splitRequestPath(path)) {
      console.warn(`[Tuvix Server] Rejected suspicious path: ${path}`);
      return {
        html: 'Bad Request',
        statusCode: 400,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Powered-By': 'Tuvix.js',
        },
      };
    }

    const startTime = Date.now();
    const activeApps = matchApps(path);

    const fragments = await Promise.all(
      activeApps.map(async (app) => {
        const fragStart = Date.now();
        const { html, isError } = await fetchFragment(
          app,
          path,
          defaultTimeout
        );
        metrics?.recordFragment(app.name, Date.now() - fragStart, isError);
        return { name: app.name, html, isError };
      })
    );

    const slots: Record<string, string> = {};
    for (const fragment of fragments) {
      slots[fragment.name] = fragment.html;
    }

    const html = compiled.render(slots);
    metrics?.recordRender(Date.now() - startTime);

    const allFailed =
      fragments.length > 0 && fragments.every((fragment) => fragment.isError);

    return {
      html,
      statusCode: allFailed ? 502 : 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Powered-By': 'Tuvix.js',
      },
    };
  }

  return { render, matchApps, fetchAppHTML };
}

// ─── BigPipe Streaming Renderer ──────────────────────

/**
 * BigPipe-style streaming renderer for minimal Time To First Byte.
 *
 * How it works:
 * 1. The shell HTML is sent to the client **immediately**, with `<div>` placeholders
 *    where `<tuvix-slot>` elements (paired or self-closing) were. Browsers start
 *    parsing CSS/fonts at once.
 * 2. All fragment fetches run **concurrently**.
 * 3. As each fragment resolves, a small inline `<script>` is streamed to the
 *    client that replaces the placeholder div with the real content. The
 *    fragment HTML is JSON-encoded with `<` and `>` escaped, so `</script>`
 *    or `<!--` inside a fragment cannot break out of the script.
 * 4. `<script>` elements inside the fragment are re-created after insertion
 *    so the browser runs them, one at a time in document order. Every
 *    attribute (`type`, `src`, `nonce`, ...) is copied. An external script
 *    without `async` finishes loading (or fails) before the next one runs.
 * 5. The closing `</body></html>` is flushed after all fragments complete.
 *
 * The status code is 200: headers go out with the shell, before any
 * fragment is fetched. Use `createServerRenderer` if you need 502 when every
 * fragment fails. A path whose pathname names another host (`//evil.test`)
 * gets a 400 `Bad Request` text response instead of the shell.
 *
 * Under a Content Security Policy without `'unsafe-inline'`, pass a fresh
 * per-response `nonce` to `stream()`; the renderer puts it on its inline
 * scripts. Fragment scripts need their own `nonce` attribute (or a policy
 * with `'strict-dynamic'`).
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { randomBytes } from 'node:crypto';
 * import { createStreamingRenderer } from '@tuvix.js/server';
 *
 * const renderer = createStreamingRenderer({ shellTemplate, apps });
 *
 * app.get('/*', (req, res) => {
 *   const nonce = randomBytes(16).toString('base64');
 *   res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`);
 *   renderer.stream(req.originalUrl, res, { nonce });
 * });
 * ```
 */
export function createStreamingRenderer(config: ServerRendererConfig) {
  const { apps, timeout: defaultTimeout = 5000, metrics } = config;

  // Pre-parse the shell template once at init time.
  const segments = parseTemplateSegments(config.shellTemplate);

  // Build the static shell with placeholder divs (computed once, reused per request).
  let staticShell = '';
  for (const seg of segments) {
    if (seg.type === 'html') {
      staticShell += seg.content;
    } else {
      // Replace slot with a stable placeholder element.
      // `display:contents` makes the div transparent to CSS layout.
      staticShell += `<div id="tvx-slot-${seg.name}" style="display:contents">${seg.fallback}</div>`;
    }
  }

  // Split the static shell at </body> so inline scripts are injected
  // before the closing body tag (required for valid HTML).
  const bodyCloseIdx = staticShell.lastIndexOf('</body>');
  const shellHead =
    bodyCloseIdx >= 0 ? staticShell.slice(0, bodyCloseIdx) : staticShell;
  const shellTail = bodyCloseIdx >= 0 ? staticShell.slice(bodyCloseIdx) : '';

  function matchApps(path: string): ServerAppConfig[] {
    return matchAppsByPath(apps, path);
  }

  async function stream(
    path: string,
    res: StreamingResponse,
    options: StreamOptions = {}
  ): Promise<void> {
    if (!splitRequestPath(path)) {
      console.warn(`[Tuvix Server] Rejected suspicious path: ${path}`);
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.write('Bad Request');
      res.end();
      return;
    }

    const startTime = Date.now();
    const activeApps = matchApps(path);
    const scriptOpen =
      options.nonce === undefined
        ? '<script>'
        : `<script nonce="${escapeAttribute(options.nonce)}">`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Powered-By', 'Tuvix.js');

    // 1. Flush the entire shell (with placeholders) immediately.
    //    The browser can now start downloading CSS, fonts, and rendering
    //    above-the-fold content while we fetch fragments.
    res.write(shellHead);

    // 2. Fetch all fragments concurrently.
    //    Each fragment is injected via an inline <script> the moment it arrives.
    await Promise.all(
      activeApps.map(async (app) => {
        const fragStart = Date.now();
        const { html, isError } = await fetchFragment(
          app,
          path,
          defaultTimeout
        );
        res.write(
          `${scriptOpen}(${SWAP_FRAGMENT})(` +
            `${toScriptString('tvx-slot-' + app.name)},${toScriptString(html)}` +
            `);</script>`
        );
        metrics?.recordFragment(app.name, Date.now() - fragStart, isError);
      })
    );

    // 3. Close the response with </body></html>.
    res.write(shellTail);
    res.end();

    metrics?.recordRender(Date.now() - startTime);
  }

  return { stream, matchApps };
}

// ─── Express/Fastify Middleware ──────────────────────

/**
 * Create Express/Connect-compatible middleware for synchronous SSR.
 *
 * Renders `req.originalUrl` (Express) or `req.url`, query string included,
 * so fragment services receive it in their `path` parameter. Sends
 * `result.statusCode` (502 when every matched fragment failed). If `render`
 * throws, calls `next(error)`, or sends 500 when no `next` is given.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { createServerRenderer, createMiddleware } from '@tuvix.js/server';
 *
 * const renderer = createServerRenderer({ ... });
 * const app = express();
 * app.use(createMiddleware(renderer));
 * ```
 */
export function createMiddleware(
  renderer: ReturnType<typeof createServerRenderer>
) {
  return async (
    req: MiddlewareRequest,
    res: {
      status: (code: number) => { send: (body: string) => void };
      set?: (headers: Record<string, string>) => void;
      setHeader?: (name: string, value: string) => void;
    },
    next?: (error?: unknown) => void
  ) => {
    const path = req.originalUrl ?? req.url;

    try {
      const result = await renderer.render(path);

      if (res.set) {
        res.set(result.headers);
      } else if (res.setHeader) {
        for (const [key, value] of Object.entries(result.headers)) {
          res.setHeader(key, value);
        }
      }

      res.status(result.statusCode).send(result.html);
    } catch (error) {
      console.error('[Tuvix Server] Render error:', error);
      if (next) {
        next(error);
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
  };
}

/** Request shape the middlewares read. Express and Node `IncomingMessage` fit. */
export interface MiddlewareRequest {
  url: string;
  originalUrl?: string;
}

/** Response shape `createStreamingMiddleware` writes to. Express and Node `ServerResponse` fit. */
export type StreamingMiddlewareResponse = StreamingResponse & {
  status?: (code: number) => { send: (body: string) => void };
};

/**
 * Options for `createStreamingMiddleware`.
 */
export interface StreamingMiddlewareOptions {
  /**
   * Return this response's CSP nonce (for example `res.locals.cspNonce`).
   * The renderer adds it to its inline scripts.
   */
  nonce?: (
    req: MiddlewareRequest,
    res: StreamingMiddlewareResponse
  ) => string | undefined;
}

/**
 * Create Express/Connect-compatible middleware for BigPipe streaming SSR.
 *
 * Streams `req.originalUrl` (Express) or `req.url`, query string included.
 * If streaming fails before the first byte is written, calls `next(error)`.
 * Without `next`, it answers 500 through `res.status(500).send()` when the
 * response has `status` (Express), or sets `res.statusCode = 500` and ends
 * the response (Node `http`). Once the shell has been written, the headers
 * are gone, so it ends the response instead and never calls `next`.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { createStreamingRenderer, createStreamingMiddleware } from '@tuvix.js/server';
 *
 * const renderer = createStreamingRenderer({ ... });
 * const app = express();
 * app.use(
 *   createStreamingMiddleware(renderer, {
 *     nonce: (_req, res) => (res as unknown as { locals: { cspNonce?: string } }).locals.cspNonce,
 *   })
 * );
 * ```
 */
export function createStreamingMiddleware(
  renderer: ReturnType<typeof createStreamingRenderer>,
  options: StreamingMiddlewareOptions = {}
) {
  return async (
    req: MiddlewareRequest,
    res: StreamingMiddlewareResponse,
    next?: (error?: unknown) => void
  ) => {
    const path = req.originalUrl ?? req.url;
    let started = false;
    const tracked: StreamingResponse = {
      setHeader: (name, value) => res.setHeader(name, value),
      write: (chunk) => {
        started = true;
        res.write(chunk);
      },
      end: () => res.end(),
      get statusCode() {
        return res.statusCode;
      },
      set statusCode(code) {
        res.statusCode = code;
      },
    };

    try {
      await renderer.stream(path, tracked, {
        nonce: options.nonce?.(req, res),
      });
    } catch (error) {
      console.error('[Tuvix Server] Streaming render error:', error);
      if (started) {
        try {
          res.end();
        } catch {
          // The connection is already closed; nothing left to clean up.
        }
      } else if (next) {
        next(error);
      } else if (res.status) {
        res.status(500).send('Internal Server Error');
      } else {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.write('Internal Server Error');
        res.end();
      }
    }
  };
}

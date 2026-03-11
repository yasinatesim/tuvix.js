// ─── Types ──────────────────────────────────────────

export interface ServerAppConfig {
  /** Unique app name */
  name: string;

  /** URL to fetch the app's HTML fragment */
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
}

/**
 * Pre-compiled shell template for fast repeated rendering.
 */
export interface CompiledTemplate {
  /** Slot names discovered in the template, in order of appearance. */
  slotNames: string[];
  /** Render the template with the given slot content. Uses pre-compiled patterns. */
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

    lines.push('# HELP tuvix_renders_total Total number of SSR renders');
    lines.push('# TYPE tuvix_renders_total counter');
    lines.push(`tuvix_renders_total ${renderCount}`);

    lines.push(
      '# HELP tuvix_render_duration_ms_total Cumulative render duration (ms)'
    );
    lines.push('# TYPE tuvix_render_duration_ms_total counter');
    lines.push(`tuvix_render_duration_ms_total ${renderTotalMs}`);

    if (renderCount > 0) {
      lines.push(
        '# HELP tuvix_render_duration_ms_avg Average render duration (ms)'
      );
      lines.push('# TYPE tuvix_render_duration_ms_avg gauge');
      lines.push(
        `tuvix_render_duration_ms_avg ${(renderTotalMs / renderCount).toFixed(2)}`
      );

      lines.push(
        '# HELP tuvix_render_duration_ms_max Peak render duration (ms)'
      );
      lines.push('# TYPE tuvix_render_duration_ms_max gauge');
      lines.push(`tuvix_render_duration_ms_max ${renderMaxMs}`);
    }

    for (const [name, s] of Object.entries(fragments)) {
      const lbl = `app="${name}"`;
      lines.push(
        `# HELP tuvix_fragment_fetches_total{${lbl}} Total fetches for fragment`
      );
      lines.push(`tuvix_fragment_fetches_total{${lbl}} ${s.count}`);
      lines.push(
        `# HELP tuvix_fragment_errors_total{${lbl}} Total fetch errors for fragment`
      );
      lines.push(`tuvix_fragment_errors_total{${lbl}} ${s.errors}`);
      if (s.count > 0) {
        lines.push(
          `tuvix_fragment_avg_duration_ms{${lbl}} ${(s.totalMs / s.count).toFixed(2)}`
        );
        lines.push(`tuvix_fragment_max_duration_ms{${lbl}} ${s.maxMs}`);
      }
    }

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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type TemplateSegment =
  | { type: 'html'; content: string }
  | { type: 'slot'; name: string; fallback: string };

/**
 * Parse a shell template into alternating HTML and slot segments.
 * Used internally by the streaming renderer.
 */
function parseTemplateSegments(template: string): TemplateSegment[] {
  const segments: TemplateSegment[] = [];
  const slotPattern =
    /<tuvix-slot\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/tuvix-slot>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = slotPattern.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'html',
        content: template.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: 'slot',
      name: match[1]!,
      fallback: match[2]!,
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < template.length) {
    segments.push({ type: 'html', content: template.slice(lastIndex) });
  }

  return segments;
}

/**
 * Shared fragment fetcher used by both renderers.
 */
async function fetchFragment(
  app: ServerAppConfig,
  path: string,
  defaultTimeout: number
): Promise<string> {
  if (path.includes('://') || path.startsWith('//')) {
    console.warn(`[Tuvix Server] Rejected suspicious path: ${path}`);
    return `<!-- SSR error: invalid path -->`;
  }

  const safePath = path.replace(/\.{2,}/g, '').replace(/\/+/g, '/');
  const timeoutMs = app.timeout ?? defaultTimeout;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${app.ssrUrl}?path=${encodeURIComponent(safePath)}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'text/html' },
    });

    if (!response.ok) {
      console.warn(
        `[Tuvix Server] SSR failed for "${app.name}" (${response.status})`
      );
      return `<!-- SSR error: ${app.name} (${response.status}) -->`;
    }

    return await response.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown';
    console.warn(`[Tuvix Server] SSR failed for "${app.name}": ${message}`);
    return `<!-- SSR error: ${app.name} (${message}) -->`;
  } finally {
    clearTimeout(timer);
  }
}

function matchAppsByPath(
  apps: ServerAppConfig[],
  path: string
): ServerAppConfig[] {
  return apps.filter((app) =>
    app.routes.some((pattern) => {
      if (pattern === '/*' || pattern === '/') return true;
      const normalized = pattern.replace(/\/\*$/, '');
      return path === normalized || path.startsWith(normalized + '/');
    })
  );
}

// ─── Composer ───────────────────────────────────────

/**
 * Compose shell HTML template by replacing `<tuvix-slot>` placeholders
 * with micro app content.
 *
 * For repeated rendering of the same template, prefer `compileShellTemplate()`
 * which pre-compiles the regex patterns once at init time.
 */
export function composeHTML(
  template: string,
  slots: Record<string, string>
): string {
  let result = template;

  for (const [name, content] of Object.entries(slots)) {
    const slotPattern = new RegExp(
      `<tuvix-slot\\s+name=["']${escapeRegex(name)}["']\\s*>[\\s\\S]*?</tuvix-slot>`,
      'g'
    );
    result = result.replace(slotPattern, content);

    const selfClosingPattern = new RegExp(
      `<tuvix-slot\\s+name=["']${escapeRegex(name)}["']\\s*/>`,
      'g'
    );
    result = result.replace(selfClosingPattern, content);
  }

  return result;
}

/**
 * Pre-compile a shell template's slot patterns once at server startup.
 * The returned `CompiledTemplate.render()` reuses the compiled RegExp
 * objects on every request, avoiding redundant regex construction.
 *
 * @example
 * ```ts
 * const tmpl = compileShellTemplate(fs.readFileSync('./shell.html', 'utf8'));
 * // Per request:
 * const html = tmpl.render({ header: '...', main: '...' });
 * ```
 */
export function compileShellTemplate(template: string): CompiledTemplate {
  const slotPatterns: Array<{
    name: string;
    full: RegExp;
    selfClosing: RegExp;
  }> = [];

  const namePattern = /<tuvix-slot\s+name=["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();

  while ((match = namePattern.exec(template)) !== null) {
    const name = match[1]!;
    if (!seen.has(name)) {
      seen.add(name);
      slotPatterns.push({
        name,
        full: new RegExp(
          `<tuvix-slot\\s+name=["']${escapeRegex(name)}["']\\s*>[\\s\\S]*?</tuvix-slot>`,
          'g'
        ),
        selfClosing: new RegExp(
          `<tuvix-slot\\s+name=["']${escapeRegex(name)}["']\\s*/>`,
          'g'
        ),
      });
    }
  }

  return {
    slotNames: [...seen],
    render(slots: Record<string, string>): string {
      let result = template;
      for (const pattern of slotPatterns) {
        const content = slots[pattern.name];
        if (content !== undefined) {
          result = result.replace(pattern.full, content);
          result = result.replace(pattern.selfClosing, content);
        }
      }
      return result;
    },
  };
}

// ─── Server Renderer ────────────────────────────────

/**
 * Server-side renderer that fetches micro app HTML fragments
 * and composes them into a complete page.
 * Uses pre-compiled template patterns for fast repeated rendering.
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
  const { shellTemplate, apps, timeout: defaultTimeout = 5000, metrics } =
    config;

  // Pre-compile slot patterns once at init time (not per request).
  const compiled = compileShellTemplate(shellTemplate);

  function matchApps(path: string): ServerAppConfig[] {
    return matchAppsByPath(apps, path);
  }

  async function fetchAppHTML(
    app: ServerAppConfig,
    path: string
  ): Promise<string> {
    return fetchFragment(app, path, defaultTimeout);
  }

  async function render(path: string): Promise<RenderResult> {
    const startTime = Date.now();
    const activeApps = matchApps(path);

    const fragments = await Promise.all(
      activeApps.map(async (app) => {
        const fragStart = Date.now();
        let isError = false;
        const html = await fetchFragment(app, path, defaultTimeout).catch(
          (err) => {
            isError = true;
            return `<!-- SSR error: ${app.name} (${err instanceof Error ? err.message : err}) -->`;
          }
        );
        metrics?.recordFragment(app.name, Date.now() - fragStart, isError);
        return { name: app.name, html };
      })
    );

    const slots: Record<string, string> = {};
    for (const fragment of fragments) {
      slots[fragment.name] = fragment.html;
    }

    const html = compiled.render(slots);
    metrics?.recordRender(Date.now() - startTime);

    return {
      html,
      statusCode: 200,
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
 *    where `<tuvix-slot>` elements were. Browsers start parsing CSS/fonts at once.
 * 2. All fragment fetches run **concurrently**.
 * 3. As each fragment resolves, a small inline `<script>` is streamed to the
 *    client that replaces the placeholder div with the real content.
 * 4. The closing `</body></html>` is flushed after all fragments complete.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { createStreamingRenderer } from '@tuvix.js/server';
 *
 * const renderer = createStreamingRenderer({ shellTemplate, apps });
 *
 * app.get('/*', (req, res) => {
 *   renderer.stream(req.path, res);
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
  const shellTail =
    bodyCloseIdx >= 0 ? staticShell.slice(bodyCloseIdx) : '';

  function matchApps(path: string): ServerAppConfig[] {
    return matchAppsByPath(apps, path);
  }

  async function stream(
    path: string,
    res: StreamingResponse
  ): Promise<void> {
    const startTime = Date.now();
    const activeApps = matchApps(path);

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
        let isError = false;
        try {
          const html = await fetchFragment(app, path, defaultTimeout);
          // JSON.stringify handles all special characters (quotes, newlines, etc.)
          // safely inside the inline script.
          res.write(
            `<script>(function(){` +
              `var el=document.getElementById(${JSON.stringify('tvx-slot-' + app.name)});` +
              `if(el){el.outerHTML=${JSON.stringify(html)};}` +
              `})();</script>`
          );
        } catch {
          isError = true;
        } finally {
          metrics?.recordFragment(app.name, Date.now() - fragStart, isError);
        }
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
    req: { url: string; path?: string },
    res: {
      status: (code: number) => { send: (body: string) => void };
      set?: (headers: Record<string, string>) => void;
      setHeader?: (name: string, value: string) => void;
    },
    next?: () => void
  ) => {
    const path = req.path ?? req.url;

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
        next();
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
  };
}

/**
 * Create Express/Connect-compatible middleware for BigPipe streaming SSR.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { createStreamingRenderer, createStreamingMiddleware } from '@tuvix.js/server';
 *
 * const renderer = createStreamingRenderer({ ... });
 * const app = express();
 * app.use(createStreamingMiddleware(renderer));
 * ```
 */
export function createStreamingMiddleware(
  renderer: ReturnType<typeof createStreamingRenderer>
) {
  return async (
    req: { url: string; path?: string },
    res: StreamingResponse & {
      status?: (code: number) => { send: (body: string) => void };
    },
    next?: () => void
  ) => {
    const path = (req as { path?: string }).path ?? req.url;

    try {
      await renderer.stream(path, res);
    } catch (error) {
      console.error('[Tuvix Server] Streaming render error:', error);
      if (next) {
        next();
      }
    }
  };
}

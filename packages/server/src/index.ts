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
}

export interface RenderResult {
  html: string;
  statusCode: number;
  headers: Record<string, string>;
}

// ─── Composer ───────────────────────────────────────

/**
 * Compose shell HTML template by replacing `<tuvix-slot>` placeholders
 * with micro app content.
 */
export function composeHTML(
  template: string,
  slots: Record<string, string>
): string {
  let result = template;

  for (const [name, content] of Object.entries(slots)) {
    // Replace <tuvix-slot name="xxx"></tuvix-slot> with content
    const slotPattern = new RegExp(
      `<tuvix-slot\\s+name=["']${escapeRegex(name)}["']\\s*>[\\s\\S]*?</tuvix-slot>`,
      'g'
    );
    result = result.replace(slotPattern, content);

    // Also replace self-closing <tuvix-slot name="xxx" />
    const selfClosingPattern = new RegExp(
      `<tuvix-slot\\s+name=["']${escapeRegex(name)}["']\\s*/>`,
      'g'
    );
    result = result.replace(selfClosingPattern, content);
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Server Renderer ────────────────────────────────

/**
 * Server-side renderer that fetches micro app HTML fragments
 * and composes them into a complete page.
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
  const { shellTemplate, apps, timeout: defaultTimeout = 5000 } = config;

  async function fetchAppHTML(
    app: ServerAppConfig,
    path: string
  ): Promise<string> {
    // Validate path is a relative path, not an absolute URL
    if (path.includes('://') || path.startsWith('//')) {
      console.warn(`[Tuvix Server] Rejected suspicious path: ${path}`);
      return `<!-- SSR error: invalid path -->`;
    }

    // Normalize path to prevent traversal
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
      console.warn(
        `[Tuvix Server] SSR failed for "${app.name}": ${message}`
      );
      return `<!-- SSR error: ${app.name} (${message}) -->`;
    } finally {
      clearTimeout(timer);
    }
  }

  function matchApps(path: string): ServerAppConfig[] {
    return apps.filter((app) =>
      app.routes.some((pattern) => {
        if (pattern === '/*' || pattern === '/') return true;

        const normalized = pattern.replace(/\/\*$/, '');
        return path === normalized || path.startsWith(normalized + '/');
      })
    );
  }

  async function render(path: string): Promise<RenderResult> {
    const activeApps = matchApps(path);

    const fragments = await Promise.all(
      activeApps.map(async (app) => {
        const html = await fetchAppHTML(app, path);
        return { name: app.name, html };
      })
    );

    const slots: Record<string, string> = {};
    for (const fragment of fragments) {
      slots[fragment.name] = fragment.html;
    }

    const html = composeHTML(shellTemplate, slots);

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

// ─── Express/Fastify Middleware ──────────────────────

/**
 * Create Express/Connect-compatible middleware for SSR.
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

      // Set headers (Express or Fastify style)
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

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'svelte/compiler';

// Compiled modules import 'svelte/internal/*', so they must live inside this
// package for the bare specifier to resolve to its Svelte 5 copy.
const OUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../node_modules/.cache/tuvix-svelte-tests'
);

/**
 * Compile Svelte 5 source with the real compiler and import the result.
 * Returns the component's default export.
 */
export async function compileSvelte(
  source: string,
  options: {
    generate: 'client' | 'server';
    css?: 'injected' | 'external';
    /** Compile like vite-plugin-svelte in serve mode. */
    dev?: boolean;
  }
): Promise<unknown> {
  const { js } = compile(source, {
    generate: options.generate,
    css: options.css ?? 'external',
    dev: options.dev ?? false,
    filename: 'Component.svelte',
  });
  const hash = createHash('sha1')
    .update(options.generate)
    .update(js.code)
    .digest('hex')
    .slice(0, 12);
  mkdirSync(OUT_DIR, { recursive: true });
  const file = join(OUT_DIR, `${options.generate}-${hash}.js`);
  writeFileSync(file, js.code);
  const mod = (await import(/* @vite-ignore */ file)) as { default: unknown };
  return mod.default;
}

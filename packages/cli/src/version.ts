import * as fs from 'fs';
import * as path from 'path';

/**
 * Reads the `create-tuvix-app` version from its package.json.
 *
 * Both `src/` (tests) and `dist/` (published CLI) sit one level below the
 * package root, and npm always ships package.json, so `../package.json`
 * resolves in both.
 *
 * @example
 * ```ts
 * console.log(`create-tuvix-app v${getCliVersion()}`);
 * ```
 */
export function getCliVersion(dir: string = __dirname): string {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(dir, '..', 'package.json'), 'utf-8')
  ) as { version: string };
  return pkg.version;
}

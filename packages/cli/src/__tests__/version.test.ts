// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getCliVersion } from '../version';

const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');
const { version } = JSON.parse(
  fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf-8')
) as { version: string };

describe('getCliVersion', () => {
  it('returns the version from packages/cli/package.json', () => {
    expect(getCliVersion()).toBe(version);
  });

  it('reads package.json one level above the given directory', () => {
    expect(getCliVersion(path.join(PACKAGE_ROOT, 'dist'))).toBe(version);
  });
});

describe('create-tuvix-app --version (built CLI)', () => {
  // turbo runs `build` before `test`, so dist/index.js is the shipped binary.
  const bin = path.join(PACKAGE_ROOT, 'dist', 'index.js');

  for (const flag of ['--version', '-v']) {
    it(`${flag} prints the package.json version`, () => {
      const output = execFileSync(process.execPath, [bin, flag], {
        encoding: 'utf-8',
        env: { ...process.env, VITEST: '' },
      });
      expect(output.trim()).toBe(`create-tuvix-app v${version}`);
    });
  }
});

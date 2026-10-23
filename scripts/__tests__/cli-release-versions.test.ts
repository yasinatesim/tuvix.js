// @vitest-environment node
/**
 * create-tuvix-app writes a version range for every tuvix package it
 * scaffolds. This test computes the version each of those packages will have
 * after the pending changesets are released (the same plan `changeset version`
 * applies) and fails when a scaffolded range would not install it.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import { createProject } from '../../packages/cli/src/create-project';

const ROOT = path.resolve(__dirname, '../..');
const TEMPLATES = [
  'shell',
  'react-app',
  'vue-app',
  'vanilla-app',
  'svelte-app',
  'angular-app',
];

// get-release-plan and semver ship with @changesets/cli (a root devDependency);
// load them from its install so the plan matches the CLI that releases.
const changesetsRequire = createRequire(
  fs.realpathSync(path.join(ROOT, 'node_modules/@changesets/cli/package.json'))
);
// createRequire returns `any`; these shapes are the documented public APIs.
const releasePlanModule = changesetsRequire('@changesets/get-release-plan') as {
  default: (cwd: string) => Promise<{
    releases: { name: string; newVersion: string; type: string }[];
  }>;
};
const getReleasePlan = releasePlanModule.default;
const semver = changesetsRequire('semver') as {
  satisfies(version: string, range: string): boolean;
};

function workspaceVersions(): Map<string, string> {
  const versions = new Map<string, string>();
  const packagesDir = path.join(ROOT, 'packages');
  for (const dir of fs.readdirSync(packagesDir)) {
    const manifest = path.join(packagesDir, dir, 'package.json');
    if (!fs.existsSync(manifest)) continue;
    const pkg = JSON.parse(fs.readFileSync(manifest, 'utf-8')) as {
      name: string;
      version: string;
    };
    versions.set(pkg.name, pkg.version);
  }
  return versions;
}

/** `name -> range` for every tuvix package any template writes. */
async function scaffoldedRanges(): Promise<Map<string, Set<string>>> {
  const ranges = new Map<string, Set<string>>();
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    for (const template of TEMPLATES) {
      for (const typescript of [true, false]) {
        const name = `.tmp/release-${template}-${typescript}-${process.pid}`;
        const dir = path.resolve(process.cwd(), name);
        fs.rmSync(dir, { recursive: true, force: true });
        await createProject({ name, template, typescript });
        try {
          const pkg = JSON.parse(
            fs.readFileSync(path.join(dir, 'package.json'), 'utf-8')
          ) as {
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
          };
          const all = { ...pkg.dependencies, ...pkg.devDependencies };
          for (const [dep, range] of Object.entries(all)) {
            if (dep !== 'tuvix.js' && !dep.startsWith('@tuvix.js/')) continue;
            if (!ranges.has(dep)) ranges.set(dep, new Set());
            ranges.get(dep)!.add(range);
          }
        } finally {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      }
    }
  } finally {
    log.mockRestore();
  }
  return ranges;
}

describe('create-tuvix-app ranges match the next release', () => {
  let ranges: Map<string, Set<string>>;
  let nextVersions: Map<string, string>;

  beforeAll(async () => {
    ranges = await scaffoldedRanges();
    const current = workspaceVersions();
    const plan = await getReleasePlan(ROOT);
    // Packages without a pending release keep their current version.
    nextVersions = new Map(current);
    for (const release of plan.releases) {
      if (release.type !== 'none') {
        nextVersions.set(release.name, release.newVersion);
      }
    }
  });

  it('scaffolds tuvix.js and all four framework adapters', () => {
    expect([...ranges.keys()].sort()).toEqual([
      '@tuvix.js/angular',
      '@tuvix.js/react',
      '@tuvix.js/svelte',
      '@tuvix.js/vue',
      'tuvix.js',
    ]);
  });

  it('every scaffolded range accepts the version the release will publish', () => {
    const mismatches: string[] = [];
    for (const [name, set] of ranges) {
      const next = nextVersions.get(name);
      if (!next) {
        mismatches.push(`${name}: not a workspace package`);
        continue;
      }
      for (const range of set) {
        if (!semver.satisfies(next, range)) {
          mismatches.push(`${name}: CLI writes ${range}, release is ${next}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('detectPackageManager', () => {
  it('returns bun when process.versions.bun is set', async () => {
    const original = (process.versions as Record<string, string>).bun;
    (process.versions as Record<string, string>).bun = '1.0.0';
    const { detectPackageManager } = await import('../detect-pm');
    expect(detectPackageManager()).toBe('bun');
    if (original === undefined) {
      delete (process.versions as Record<string, string>).bun;
    } else {
      (process.versions as Record<string, string>).bun = original;
    }
  });

  it('returns pnpm when npm_execpath contains pnpm', async () => {
    vi.stubEnv('npm_execpath', '/usr/local/lib/node_modules/pnpm/bin/pnpm.cjs');
    vi.stubEnv('npm_config_user_agent', '');
    const { detectPackageManager } = await import('../detect-pm');
    expect(detectPackageManager()).toBe('pnpm');
  });

  it('returns yarn when npm_execpath contains yarn', async () => {
    vi.stubEnv('npm_execpath', '/usr/local/lib/node_modules/yarn/bin/yarn.js');
    vi.stubEnv('npm_config_user_agent', '');
    const { detectPackageManager } = await import('../detect-pm');
    expect(detectPackageManager()).toBe('yarn');
  });

  it('returns pnpm when npm_config_user_agent starts with pnpm', async () => {
    vi.stubEnv('npm_execpath', '');
    vi.stubEnv('npm_config_user_agent', 'pnpm/8.15.0 npm/? node/v20.0.0 linux x64');
    const { detectPackageManager } = await import('../detect-pm');
    expect(detectPackageManager()).toBe('pnpm');
  });

  it('returns yarn when npm_config_user_agent starts with yarn', async () => {
    vi.stubEnv('npm_execpath', '');
    vi.stubEnv('npm_config_user_agent', 'yarn/1.22.0 npm/? node/v20.0.0 linux x64');
    const { detectPackageManager } = await import('../detect-pm');
    expect(detectPackageManager()).toBe('yarn');
  });

  it('returns bun when npm_config_user_agent starts with bun/', async () => {
    vi.stubEnv('npm_execpath', '');
    vi.stubEnv('npm_config_user_agent', 'bun/1.0.0');
    const { detectPackageManager } = await import('../detect-pm');
    expect(detectPackageManager()).toBe('bun');
  });

  it('returns npm when no signals present', async () => {
    vi.stubEnv('npm_execpath', '');
    vi.stubEnv('npm_config_user_agent', '');
    const { detectPackageManager } = await import('../detect-pm');
    expect(detectPackageManager()).toBe('npm');
  });
});

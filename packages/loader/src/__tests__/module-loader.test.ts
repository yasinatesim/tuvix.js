import { describe, it, expect } from 'vitest';
import { ModuleLoader, createLoader } from '../index';
import { normalizeEntry, delay, withTimeout, withRetry } from '../utils';

// ─── Utils ────────────────────────────────────────

describe('normalizeEntry', () => {
  it('should convert string entry to EntryConfig', () => {
    const result = normalizeEntry('https://cdn.example.com/app.js');
    expect(result).toEqual({ scripts: ['https://cdn.example.com/app.js'] });
  });

  it('should return EntryConfig as-is', () => {
    const config = {
      scripts: ['https://cdn.example.com/app.js'],
      styles: ['https://cdn.example.com/app.css'],
    };
    const result = normalizeEntry(config);
    expect(result).toEqual(config);
  });
});

describe('delay', () => {
  it('should wait for specified ms', async () => {
    const start = Date.now();
    await delay(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });
});

describe('withTimeout', () => {
  it('should resolve if fn completes in time', async () => {
    const result = await withTimeout(
      () => Promise.resolve('done'),
      1000
    );
    expect(result).toBe('done');
  });

  it('should reject if fn exceeds timeout', async () => {
    await expect(
      withTimeout(
        () => new Promise((resolve) => setTimeout(resolve, 500)),
        10,
        'Timed out!'
      )
    ).rejects.toThrow('Timed out!');
  });

  it('should skip timeout if timeoutMs is 0', async () => {
    const result = await withTimeout(
      () => Promise.resolve('instant'),
      0
    );
    expect(result).toBe('instant');
  });
});

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const result = await withRetry(() => Promise.resolve('ok'), 3, 10);
    expect(result).toBe('ok');
  });

  it('should retry on failure', async () => {
    let attempt = 0;
    const result = await withRetry(
      () => {
        attempt++;
        if (attempt < 3) throw new Error('fail');
        return Promise.resolve('success');
      },
      3,
      10
    );
    expect(result).toBe('success');
    expect(attempt).toBe(3);
  });

  it('should throw after all retries exhausted', async () => {
    await expect(
      withRetry(() => Promise.reject(new Error('always fail')), 2, 10)
    ).rejects.toThrow('always fail');
  });
});

// ─── ModuleLoader ─────────────────────────────────

describe('ModuleLoader', () => {
  it('should be instantiable', () => {
    const loader = new ModuleLoader();
    expect(loader).toBeDefined();
  });

  it('should report idle status for unknown modules', () => {
    const loader = new ModuleLoader();
    expect(loader.getStatus('unknown')).toBe('idle');
  });

  it('should return false for isLoaded on unknown modules', () => {
    const loader = new ModuleLoader();
    expect(loader.isLoaded('unknown')).toBe(false);
  });

  it('should return null for getModule on unknown modules', () => {
    const loader = new ModuleLoader();
    expect(loader.getModule('unknown')).toBeNull();
  });

  it('should return empty list from getCachedNames initially', () => {
    const loader = new ModuleLoader();
    expect(loader.getCachedNames()).toEqual([]);
  });

  it('should not throw on unloading unknown modules', () => {
    const loader = new ModuleLoader();
    expect(() => loader.unload('unknown')).not.toThrow();
  });

  it('should not throw on clearCache when empty', () => {
    const loader = new ModuleLoader();
    expect(() => loader.clearCache()).not.toThrow();
  });
});

describe('createLoader', () => {
  it('should create a ModuleLoader instance', () => {
    const loader = createLoader();
    expect(loader).toBeInstanceOf(ModuleLoader);
  });

  it('should accept options', () => {
    const loader = createLoader({ timeout: 5000, retries: 1 });
    expect(loader).toBeInstanceOf(ModuleLoader);
  });
});

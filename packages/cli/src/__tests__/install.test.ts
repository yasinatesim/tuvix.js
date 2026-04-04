import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChildProcess } from 'node:child_process';
import type { EventEmitter } from 'node:events';

// Mock @clack/prompts spinner before importing install
vi.mock('@clack/prompts', () => ({
  spinner: () => ({
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

// Mock child_process.spawn
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return {
    ...actual,
    spawn: vi.fn(),
  };
});

describe('installDependencies', () => {
  let spawnMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    const cp = await import('node:child_process');
    spawnMock = cp.spawn as ReturnType<typeof vi.fn>;
  });

  it('resolves when spawn exits with code 0', async () => {
    const fakeChild = {
      on: vi.fn().mockImplementation(function (
        this: EventEmitter,
        event: string,
        // eslint-disable-next-line no-unused-vars
        cb: (code: number) => void
      ) {
        if (event === 'close') setTimeout(() => cb(0), 0);
        return this;
      }),
    } as unknown as ChildProcess;
    spawnMock.mockReturnValue(fakeChild);

    const { installDependencies } = await import('../install');
    await expect(installDependencies('/tmp/test', 'npm')).resolves.toBeUndefined();
  });

  it('does not throw when spawn exits with non-zero code (graceful failure)', async () => {
    // close fires with code 1 → inner Promise rejects → catch block runs → function resolves
    const fakeChild = {
      on: vi.fn().mockImplementation(function (
        this: EventEmitter,
        event: string,
        // eslint-disable-next-line no-unused-vars
        cb: (code: number) => void
      ) {
        if (event === 'close') setTimeout(() => cb(1), 0);
        return this;
      }),
    } as unknown as ChildProcess;
    spawnMock.mockReturnValue(fakeChild);

    const { installDependencies } = await import('../install');
    await expect(installDependencies('/tmp/test', 'pnpm')).resolves.toBeUndefined();
  });

  it('does not throw when spawn emits error event (graceful failure)', async () => {
    // error fires → reject() called → inner Promise rejects → catch block runs → function resolves.
    // Note: 'close' is registered but never called in this mock — that is intentional.
    // Once reject() settles the inner Promise, calling resolve/reject again is a no-op.
    const fakeChild = {
      on: vi.fn().mockImplementation(function (
        this: EventEmitter,
        event: string,
        // eslint-disable-next-line no-unused-vars
        cb: (err: Error) => void
      ) {
        if (event === 'error') setTimeout(() => cb(new Error('ENOENT')), 0);
        return this;
      }),
    } as unknown as ChildProcess;
    spawnMock.mockReturnValue(fakeChild);

    const { installDependencies } = await import('../install');
    await expect(installDependencies('/tmp/test', 'yarn')).resolves.toBeUndefined();
  });
});

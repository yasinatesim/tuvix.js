import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test runPrompts with all args pre-filled so no @clack/prompts I/O occurs.
// We also test the angular TypeScript override logic.
import { runPrompts } from '../prompts';

// Mock @clack/prompts so no TTY is needed during tests
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  text: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  cancel: vi.fn(),
  isCancel: vi.fn(() => false),
}));

describe('runPrompts — pre-filled args (no interactive prompts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all provided args unchanged when all three are supplied', async () => {
    const result = await runPrompts({
      projectName: 'my-app',
      template: 'react-app',
      typescript: false,
    });

    expect(result).toEqual({
      projectName: 'my-app',
      template: 'react-app',
      typescript: false,
    });
  });

  it('returns shell template when shell is provided', async () => {
    const result = await runPrompts({
      projectName: 'shell-project',
      template: 'shell',
      typescript: true,
    });

    expect(result.template).toBe('shell');
    expect(result.projectName).toBe('shell-project');
    expect(result.typescript).toBe(true);
  });

  it('returns vue-app template when vue-app is provided', async () => {
    const result = await runPrompts({
      projectName: 'vue-project',
      template: 'vue-app',
      typescript: true,
    });

    expect(result.template).toBe('vue-app');
  });

  it('returns svelte-app template when svelte-app is provided', async () => {
    const result = await runPrompts({
      projectName: 'svelte-project',
      template: 'svelte-app',
      typescript: true,
    });

    expect(result.template).toBe('svelte-app');
  });

  it('returns vanilla-app template when vanilla-app is provided', async () => {
    const result = await runPrompts({
      projectName: 'vanilla-project',
      template: 'vanilla-app',
      typescript: false,
    });

    expect(result.template).toBe('vanilla-app');
    expect(result.typescript).toBe(false);
  });
});

describe('runPrompts — angular TypeScript override', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forces typescript=true when template is angular-app and typescript=false', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await runPrompts({
      projectName: 'ng-project',
      template: 'angular-app',
      typescript: false,
    });

    expect(result.typescript).toBe(true);
    expect(result.template).toBe('angular-app');
    consoleSpy.mockRestore();
  });

  it('prints override message when angular forces typescript', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runPrompts({
      projectName: 'ng-project',
      template: 'angular-app',
      typescript: false,
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Angular requires TypeScript')
    );
    consoleSpy.mockRestore();
  });

  it('does NOT override typescript when angular-app and typescript=true', async () => {
    const result = await runPrompts({
      projectName: 'ng-project',
      template: 'angular-app',
      typescript: true,
    });

    expect(result.typescript).toBe(true);
  });
});

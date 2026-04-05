import { describe, it, expect } from 'vitest';
import { parseArgs } from '../index';

describe('parseArgs — positional project name', () => {
  it('captures positional argument as projectName', () => {
    const result = parseArgs(['node', 'cli', 'my-project']);
    expect(result.projectName).toBe('my-project');
  });

  it('returns undefined projectName when no positional arg', () => {
    const result = parseArgs(['node', 'cli']);
    expect(result.projectName).toBeUndefined();
  });
});

describe('parseArgs — --template flag', () => {
  it('parses --template flag', () => {
    const result = parseArgs(['node', 'cli', '--template', 'react-app']);
    expect(result.template).toBe('react-app');
  });

  it('parses -t shorthand for template', () => {
    const result = parseArgs(['node', 'cli', '-t', 'vue-app']);
    expect(result.template).toBe('vue-app');
  });

  it('returns undefined template when not provided', () => {
    const result = parseArgs(['node', 'cli', 'my-app']);
    expect(result.template).toBeUndefined();
  });
});

describe('parseArgs — --typescript flags', () => {
  it('sets typescript=true with --typescript flag', () => {
    const result = parseArgs(['node', 'cli', '--typescript']);
    expect(result.typescript).toBe(true);
  });

  it('sets typescript=false with --no-typescript flag', () => {
    const result = parseArgs(['node', 'cli', '--no-typescript']);
    expect(result.typescript).toBe(false);
  });

  it('returns undefined typescript when neither flag is provided', () => {
    const result = parseArgs(['node', 'cli', 'my-app']);
    expect(result.typescript).toBeUndefined();
  });
});

describe('parseArgs — --example flag', () => {
  it('parses --example flag', () => {
    const result = parseArgs(['node', 'cli', '--example', 'with-react']);
    expect(result.example).toBe('with-react');
  });

  it('parses -e shorthand for example', () => {
    const result = parseArgs(['node', 'cli', '-e', 'with-vue']);
    expect(result.example).toBe('with-vue');
  });

  it('returns null example when not provided', () => {
    const result = parseArgs(['node', 'cli', 'my-app']);
    expect(result.example).toBeNull();
  });
});

describe('parseArgs — --help flag', () => {
  it('sets help=true with --help flag', () => {
    const result = parseArgs(['node', 'cli', '--help']);
    expect(result.help).toBe(true);
  });

  it('sets help=true with -h shorthand', () => {
    const result = parseArgs(['node', 'cli', '-h']);
    expect(result.help).toBe(true);
  });

  it('defaults help=false when not provided', () => {
    const result = parseArgs(['node', 'cli', 'my-app']);
    expect(result.help).toBe(false);
  });
});

describe('parseArgs — --version flag', () => {
  it('sets version=true with --version flag', () => {
    const result = parseArgs(['node', 'cli', '--version']);
    expect(result.version).toBe(true);
  });

  it('sets version=true with -v shorthand', () => {
    const result = parseArgs(['node', 'cli', '-v']);
    expect(result.version).toBe(true);
  });

  it('defaults version=false when not provided', () => {
    const result = parseArgs(['node', 'cli', 'my-app']);
    expect(result.version).toBe(false);
  });
});

describe('parseArgs — combined flags', () => {
  it('handles project name + template + typescript together', () => {
    const result = parseArgs([
      'node',
      'cli',
      'my-app',
      '--template',
      'svelte-app',
      '--typescript',
    ]);
    expect(result.projectName).toBe('my-app');
    expect(result.template).toBe('svelte-app');
    expect(result.typescript).toBe(true);
  });

  it('handles project name + example together', () => {
    const result = parseArgs([
      'node',
      'cli',
      'my-app',
      '--example',
      'with-react',
    ]);
    expect(result.projectName).toBe('my-app');
    expect(result.example).toBe('with-react');
    expect(result.template).toBeUndefined();
  });

  it('handles angular-app with --no-typescript', () => {
    const result = parseArgs([
      'node',
      'cli',
      'ng-app',
      '--template',
      'angular-app',
      '--no-typescript',
    ]);
    expect(result.template).toBe('angular-app');
    expect(result.typescript).toBe(false);
  });
});

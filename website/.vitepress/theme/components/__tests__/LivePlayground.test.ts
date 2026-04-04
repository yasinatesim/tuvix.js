import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Tests for LivePlayground.vue code examples and transformers.
 *
 * Since all logic lives inside a Vue <script setup> SFC, we test by
 * reading the source and asserting on its string content. This validates
 * that framework-specific imports, demo code variants, and transformer
 * outputs are correct.
 */

const SFC_PATH = resolve(__dirname, '..', 'LivePlayground.vue');
const source = readFileSync(SFC_PATH, 'utf-8');

/**
 * Extract the content between a `const NAME = \`...\`;` block.
 * Handles nested backtick template literals by tracking escape sequences.
 */
function extractCodeBlock(varName: string): string | null {
  const marker = `const ${varName} = \``;
  const start = source.indexOf(marker);
  if (start === -1) return null;
  const codeStart = start + marker.length;

  // Walk through, tracking escaped backticks
  let i = codeStart;
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2; // skip escaped char
      continue;
    }
    if (source[i] === '`') {
      return source.slice(codeStart, i);
    }
    i++;
  }
  return null;
}

/**
 * Extract a function body by name.
 */
function extractFunction(fnSignature: string): string | null {
  const start = source.indexOf(fnSignature);
  if (start === -1) return null;
  const bodyStart = source.indexOf('{', start);
  if (bodyStart === -1) return null;

  let depth = 1;
  let i = bodyStart + 1;
  while (i < source.length && depth > 0) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }
  return source.slice(bodyStart + 1, i - 1);
}

// ── FRAMEWORK_IMPORTS ──────────────────────────────────────────────

describe('FRAMEWORK_IMPORTS', () => {
  it('includes @tuvix.js/react in react imports', () => {
    expect(source).toContain("'@tuvix.js/react':");
    expect(source).toMatch(/@tuvix\.js\/react@\$\{TUVIX\}/);
  });

  it('includes @tuvix.js/vue in vue imports', () => {
    expect(source).toContain("'@tuvix.js/vue':");
    expect(source).toMatch(/@tuvix\.js\/vue@\$\{TUVIX\}/);
  });

  it('includes @tuvix.js/svelte in svelte imports', () => {
    expect(source).toContain("'@tuvix.js/svelte':");
    expect(source).toMatch(/@tuvix\.js\/svelte@\$\{TUVIX\}/);
  });

  it('still includes base tuvix.js package', () => {
    expect(source).toContain("'tuvix.js':");
  });
});

// ── DEMO_CODES structure ───────────────────────────────────────────

describe('DEMO_CODES', () => {
  const frameworks = ['vanilla', 'react', 'vue', 'svelte', 'angular'];

  for (const fw of frameworks) {
    it(`defines counter code for ${fw}`, () => {
      const counterVar = `${fw.toUpperCase()}_COUNTER_CODE`;
      expect(source).toContain(`const ${counterVar}`);
    });

    it(`defines todo code for ${fw}`, () => {
      const todoVar = `${fw.toUpperCase()}_TODO_CODE`;
      expect(source).toContain(`const ${todoVar}`);
    });
  }

  it('maps all frameworks in DEMO_CODES object', () => {
    expect(source).toContain('DEMO_CODES');
    for (const fw of frameworks) {
      // Each framework should appear as a key in the DEMO_CODES map
      const pattern = new RegExp(`${fw}:\\s*\\{\\s*counter:`);
      expect(source).toMatch(pattern);
    }
  });
});

// ── React code uses createReactMicroApp ────────────────────────────

describe('React code examples', () => {
  it('REACT_COUNTER_CODE imports createReactMicroApp from @tuvix.js/react', () => {
    const code = extractCodeBlock('REACT_COUNTER_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain("import { createReactMicroApp } from '@tuvix.js/react'");
    expect(code).not.toContain('defineMicroApp');
  });

  it('REACT_TODO_CODE imports createReactMicroApp from @tuvix.js/react', () => {
    const code = extractCodeBlock('REACT_TODO_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain("import { createReactMicroApp } from '@tuvix.js/react'");
    expect(code).not.toContain('defineMicroApp');
  });

  it('React counter uses createReactMicroApp for app creation', () => {
    const code = extractCodeBlock('REACT_COUNTER_CODE');
    expect(code).toContain('createReactMicroApp({');
    expect(code).toContain("name: 'counter-react'");
  });

  it('React todo uses createReactMicroApp for app creation', () => {
    const code = extractCodeBlock('REACT_TODO_CODE');
    expect(code).toContain('createReactMicroApp({');
    expect(code).toContain("name: 'todo-react'");
  });
});

// ── Vanilla code still uses defineMicroApp ─────────────────────────

describe('Vanilla code examples', () => {
  it('VANILLA_COUNTER_CODE uses defineMicroApp from tuvix.js', () => {
    const code = extractCodeBlock('VANILLA_COUNTER_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain("import { defineMicroApp } from 'tuvix.js'");
    expect(code).toContain('defineMicroApp({');
    expect(code).not.toContain('createReactMicroApp');
    expect(code).not.toContain('createVueMicroApp');
    expect(code).not.toContain('createSvelteMicroApp');
  });

  it('VANILLA_TODO_CODE uses defineMicroApp from tuvix.js', () => {
    const code = extractCodeBlock('VANILLA_TODO_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain("import { defineMicroApp } from 'tuvix.js'");
    expect(code).toContain('defineMicroApp({');
  });
});

// ── Vue transformer uses createVueMicroApp ─────────────────────────

describe('Vue SFC transformer (transformVueSFC)', () => {
  const fnBody = extractFunction('function transformVueSFC(sfc: string): string');

  it('outputs createVueMicroApp instead of defineMicroApp', () => {
    expect(fnBody).not.toBeNull();
    expect(fnBody).toContain('createVueMicroApp');
    // The template string output should use createVueMicroApp, not defineMicroApp
    // Note: the filter line still references 'defineMicroApp' as a string to strip
    // from user imports, so we check the actual output template instead
    expect(fnBody).not.toContain('const __app = defineMicroApp(');
    expect(fnBody).toContain('const __app = createVueMicroApp(');
  });

  it('imports createVueMicroApp from @tuvix.js/vue', () => {
    expect(fnBody).toContain("createVueMicroApp } from '@tuvix.js/vue'");
  });

  it('does not import createApp from vue (handled by createVueMicroApp)', () => {
    // The transformer should NOT have `import { createApp` in its output
    expect(fnBody).not.toContain('import { createApp');
  });

  it('uses App property pattern for component', () => {
    expect(fnBody).toContain('App: __component');
  });
});

// ── Svelte transformer uses createSvelteMicroApp ───────────────────

describe('Svelte transformer (transformSvelte)', () => {
  const fnBody = extractFunction('async function transformSvelte(code: string): Promise<string>');

  it('outputs createSvelteMicroApp instead of direct mount', () => {
    expect(fnBody).not.toBeNull();
    expect(fnBody).toContain('createSvelteMicroApp');
  });

  it('imports createSvelteMicroApp from @tuvix.js/svelte', () => {
    expect(fnBody).toContain("createSvelteMicroApp } from '@tuvix.js/svelte'");
  });

  it('does not use direct Svelte component instantiation', () => {
    expect(fnBody).not.toContain('new __SvelteApp({');
  });

  it('uses App property for the svelte component', () => {
    expect(fnBody).toContain('App: __SvelteApp');
  });
});

// ── Demo selector ──────────────────────────────────────────────────

describe('Demo selector UI', () => {
  it('has demoType ref with counter and todo options', () => {
    expect(source).toContain('demoType');
    expect(source).toMatch(/ref<'counter' \| 'todo'>/);
  });

  it('has switchDemo function', () => {
    expect(source).toContain('function switchDemo');
  });

  it('has demo-bar in the template', () => {
    expect(source).toContain('class="demo-bar"');
    expect(source).toContain('class="demo-btn"');
  });

  it('has demo-bar CSS styles', () => {
    expect(source).toContain('.demo-bar {');
    expect(source).toContain('.demo-btn {');
    expect(source).toContain('.demo-btn.active');
  });
});

// ── Counter demos ──────────────────────────────────────────────────

describe('Counter demo content', () => {
  it('Vanilla counter has count and defineMicroApp name', () => {
    const code = extractCodeBlock('VANILLA_COUNTER_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain('let count = 0');
    expect(code).toContain("name: 'counter-vanilla'");
  });

  it('React counter uses useState for count', () => {
    const code = extractCodeBlock('REACT_COUNTER_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain('useState(0)');
    expect(code).toContain("name: 'counter-react'");
  });

  it('Vue counter has count ref', () => {
    const code = extractCodeBlock('VUE_COUNTER_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain('count');
    expect(code).toContain('Counter');
  });

  it('Svelte counter has count variable', () => {
    const code = extractCodeBlock('SVELTE_COUNTER_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain('let count = 0');
    expect(code).toContain('Counter');
  });

  it('Angular counter has count property', () => {
    const code = extractCodeBlock('ANGULAR_COUNTER_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain('count = 0');
    expect(code).toContain('Counter');
  });
});

// ── Todo demos ─────────────────────────────────────────────────────

describe('Todo demo content', () => {
  const todoVars = [
    'VANILLA_TODO_CODE',
    'REACT_TODO_CODE',
    'VUE_TODO_CODE',
    'SVELTE_TODO_CODE',
    'ANGULAR_TODO_CODE',
  ];

  for (const varName of todoVars) {
    it(`${varName} has sample todos`, () => {
      const code = extractCodeBlock(varName);
      expect(code).not.toBeNull();
      expect(code).toContain('Learn tuvix.js');
      expect(code).toContain('Build micro-apps');
    });
  }
});

// ── TABS no longer have static code property ───────────────────────

describe('TABS definition', () => {
  it('has all 5 framework tabs', () => {
    expect(source).toContain("id: 'vanilla'");
    expect(source).toContain("id: 'react'");
    expect(source).toContain("id: 'vue'");
    expect(source).toContain("id: 'svelte'");
    expect(source).toContain("id: 'angular'");
  });

  it('uses getCode helper instead of static code on tabs', () => {
    expect(source).toContain('function getCode(');
    expect(source).toContain('DEMO_CODES');
  });
});

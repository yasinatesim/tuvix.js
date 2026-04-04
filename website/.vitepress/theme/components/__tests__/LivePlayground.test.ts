// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transform } from 'esbuild';

/**
 * Tests for LivePlayground.vue code examples and transformers.
 *
 * Includes real esbuild compile tests to catch syntax errors that
 * would cause runtime failures in the playground preview.
 */

const SFC_PATH = resolve(__dirname, '..', 'LivePlayground.vue');
const source = readFileSync(SFC_PATH, 'utf-8');

/**
 * Extract code block content. Handles both:
 * - Template literal: `const NAME = \`...\`;`
 * - Array join: `const NAME = [...].join('\n');`
 */
function extractCodeBlock(varName: string): string | null {
  // Try template literal first
  const tplMarker = `const ${varName} = \``;
  let start = source.indexOf(tplMarker);
  if (start !== -1) {
    const codeStart = start + tplMarker.length;
    let i = codeStart;
    while (i < source.length) {
      if (source[i] === '\\') { i += 2; continue; }
      if (source[i] === '`') {
        // Unescape: \` → `, \$ → $, \\ → \
        return source.slice(codeStart, i)
          .replace(/\\`/g, '`')
          .replace(/\\\$/g, '$')
          .replace(/\\\\/g, '\\');
      }
      i++;
    }
  }

  // Try array join pattern
  const arrMarker = `const ${varName} = [`;
  start = source.indexOf(arrMarker);
  if (start !== -1) {
    const arrStart = start + arrMarker.length - 1; // include the [
    let depth = 1;
    let i = arrStart + 1;
    while (i < source.length && depth > 0) {
      if (source[i] === '[') depth++;
      else if (source[i] === ']') depth--;
      i++;
    }
    // Extract the array content, eval it to get the joined string
    const arrContent = source.slice(arrStart, i);
    try {
      // Safe: only string literals in a known file we control
      const arr = new Function(`return ${arrContent}`)();
      return arr.join('\n');
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Compile TypeScript/TSX code with esbuild — same as the playground does.
 * Returns the error message if compilation fails, null if successful.
 */
async function compileCode(code: string, loader: 'ts' | 'tsx' = 'ts'): Promise<string | null> {
  try {
    await transform(code, {
      loader,
      format: 'esm',
      target: 'es2020',
      jsx: loader === 'tsx' ? 'automatic' : undefined,
      jsxImportSource: loader === 'tsx' ? 'react' : undefined,
    });
    return null;
  } catch (err: unknown) {
    const e = err as { errors?: { text: string }[] };
    return e.errors?.[0]?.text ?? String(err);
  }
}

/**
 * Compile Angular code with esbuild using decorator support.
 */
async function compileAngular(code: string): Promise<string | null> {
  try {
    await transform(code, {
      loader: 'ts',
      format: 'esm',
      target: 'es2020',
      tsconfigRaw: JSON.stringify({ compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false } }),
    });
    return null;
  } catch (err: unknown) {
    const e = err as { errors?: { text: string }[] };
    return e.errors?.[0]?.text ?? String(err);
  }
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
    expect(source).toContain("esm.sh/@tuvix.js/react");
  });

  it('includes @tuvix.js/vue in vue imports', () => {
    expect(source).toContain("'@tuvix.js/vue':");
    expect(source).toContain("esm.sh/@tuvix.js/vue");
  });

  it('includes @tuvix.js/svelte in svelte imports', () => {
    expect(source).toContain("'@tuvix.js/svelte':");
    expect(source).toContain("esm.sh/@tuvix.js/svelte");
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

// ── Vue code uses createVueMicroApp directly ───────────────────────

describe('Vue code examples', () => {
  it('VUE_COUNTER_CODE imports createVueMicroApp from @tuvix.js/vue', () => {
    const code = extractCodeBlock('VUE_COUNTER_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain("import { createVueMicroApp } from '@tuvix.js/vue'");
    expect(code).toContain('createVueMicroApp({');
    expect(code).toContain("name: 'counter-vue'");
    expect(code).not.toContain('defineMicroApp');
  });

  it('VUE_TODO_CODE imports createVueMicroApp from @tuvix.js/vue', () => {
    const code = extractCodeBlock('VUE_TODO_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain("import { createVueMicroApp } from '@tuvix.js/vue'");
    expect(code).toContain('createVueMicroApp({');
    expect(code).toContain("name: 'todo-vue'");
    expect(code).not.toContain('defineMicroApp');
  });

  it('Vue tab shows main.ts (TypeScript), not App.vue (SFC)', () => {
    expect(source).toContain("id: 'vue'");
    expect(source).toContain("file: 'main.ts'");
    // Should compile as TypeScript, not SFC
    expect(source).toContain("lang: 'typescript'");
  });
});

// ── Vue SFC transformer still works for fallback ────────────────────

describe('Vue SFC transformer (transformVueSFC)', () => {
  const fnBody = extractFunction('function transformVueSFC(sfc: string): string');

  it('uses createVueMicroApp in transformer output', () => {
    expect(fnBody).not.toBeNull();
    expect(fnBody).toContain('createVueMicroApp');
    expect(fnBody).toContain('const __app = createVueMicroApp(');
  });

  it('imports createVueMicroApp from @tuvix.js/vue', () => {
    expect(fnBody).toContain("createVueMicroApp } from '@tuvix.js/vue'");
  });
});

// ── Svelte code shows createSvelteMicroApp integration ──────────────

describe('Svelte code examples', () => {
  it('SVELTE_COUNTER_CODE shows createSvelteMicroApp integration comment', () => {
    const code = extractCodeBlock('SVELTE_COUNTER_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain("createSvelteMicroApp } from '@tuvix.js/svelte'");
    expect(code).toContain("createSvelteMicroApp({ name: 'counter-svelte'");
  });

  it('SVELTE_TODO_CODE shows createSvelteMicroApp integration comment', () => {
    const code = extractCodeBlock('SVELTE_TODO_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain("createSvelteMicroApp } from '@tuvix.js/svelte'");
    expect(code).toContain("createSvelteMicroApp({ name: 'todo-svelte'");
  });
});

// ── Svelte transformer uses createSvelteMicroApp ───────────────────

describe('Svelte transformer (transformSvelte)', () => {
  const fnBody = extractFunction('async function transformSvelte(code: string): Promise<string>');

  it('outputs createSvelteMicroApp', () => {
    expect(fnBody).not.toBeNull();
    expect(fnBody).toContain('createSvelteMicroApp');
  });

  it('uses App property for the svelte component', () => {
    expect(fnBody).toContain('App: __SvelteApp');
  });
});

// ── Angular code uses defineMicroApp + bootstrapApplication ─────────

describe('Angular code examples', () => {
  it('ANGULAR_COUNTER_CODE uses defineMicroApp with bootstrapApplication', () => {
    const code = extractCodeBlock('ANGULAR_COUNTER_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain("import { defineMicroApp } from 'tuvix.js'");
    expect(code).toContain("import { bootstrapApplication } from '@angular/platform-browser'");
    expect(code).toContain('defineMicroApp({');
    expect(code).toContain("name: 'counter-angular'");
    expect(code).toContain('bootstrapApplication(CounterComponent)');
  });

  it('ANGULAR_TODO_CODE uses defineMicroApp with bootstrapApplication', () => {
    const code = extractCodeBlock('ANGULAR_TODO_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain("import { defineMicroApp } from 'tuvix.js'");
    expect(code).toContain("import { bootstrapApplication } from '@angular/platform-browser'");
    expect(code).toContain('defineMicroApp({');
    expect(code).toContain("name: 'todo-angular'");
    expect(code).toContain('bootstrapApplication(TodoComponent)');
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

// ── REAL COMPILE TESTS ──────────────────────────────────────────────
// These actually run esbuild on the code examples to catch syntax errors
// that would cause runtime failures in the playground preview.

describe('esbuild compile validation', () => {
  it('VANILLA_COUNTER_CODE compiles with esbuild ts loader', async () => {
    const code = extractCodeBlock('VANILLA_COUNTER_CODE');
    expect(code).not.toBeNull();
    const err = await compileCode(code!);
    expect(err, `Vanilla counter failed to compile: ${err}`).toBeNull();
  });

  it('VANILLA_TODO_CODE compiles with esbuild ts loader', async () => {
    const code = extractCodeBlock('VANILLA_TODO_CODE');
    expect(code).not.toBeNull();
    const err = await compileCode(code!);
    expect(err, `Vanilla todo failed to compile: ${err}`).toBeNull();
  });

  it('REACT_COUNTER_CODE compiles with esbuild tsx loader', async () => {
    const code = extractCodeBlock('REACT_COUNTER_CODE');
    expect(code).not.toBeNull();
    const err = await compileCode(code!, 'tsx');
    expect(err, `React counter failed to compile: ${err}`).toBeNull();
  });

  it('REACT_TODO_CODE compiles with esbuild tsx loader', async () => {
    const code = extractCodeBlock('REACT_TODO_CODE');
    expect(code).not.toBeNull();
    const err = await compileCode(code!, 'tsx');
    expect(err, `React todo failed to compile: ${err}`).toBeNull();
  });

  it('VUE_COUNTER_CODE compiles with esbuild ts loader', async () => {
    const code = extractCodeBlock('VUE_COUNTER_CODE');
    expect(code).not.toBeNull();
    const err = await compileCode(code!);
    expect(err, `Vue counter failed to compile: ${err}`).toBeNull();
  });

  it('VUE_TODO_CODE compiles with esbuild ts loader', async () => {
    const code = extractCodeBlock('VUE_TODO_CODE');
    expect(code).not.toBeNull();
    const err = await compileCode(code!);
    expect(err, `Vue todo failed to compile: ${err}`).toBeNull();
  });

  it('ANGULAR_COUNTER_CODE compiles with esbuild angular config', async () => {
    const code = extractCodeBlock('ANGULAR_COUNTER_CODE');
    expect(code).not.toBeNull();
    const err = await compileAngular(code!);
    expect(err, `Angular counter failed to compile: ${err}`).toBeNull();
  });

  it('ANGULAR_TODO_CODE compiles with esbuild angular config', async () => {
    const code = extractCodeBlock('ANGULAR_TODO_CODE');
    expect(code).not.toBeNull();
    const err = await compileAngular(code!);
    expect(err, `Angular todo failed to compile: ${err}`).toBeNull();
  });

  // Note: Svelte code is compiled by Svelte compiler (not esbuild), so we
  // cannot test it with esbuild. Svelte compilation happens at runtime via
  // dynamic import from esm.sh. We verify the Svelte code is valid by
  // checking that it doesn't contain syntax that the Svelte compiler rejects
  // (like nested backtick issues or invalid directives).
  it('SVELTE_COUNTER_CODE has valid Svelte structure', () => {
    const code = extractCodeBlock('SVELTE_COUNTER_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain('<script');
    expect(code).toContain('let count = 0');
    // No broken template literal escaping
    expect(code).not.toContain('\\`');
    expect(code).not.toContain('\\\\`');
  });

  it('SVELTE_TODO_CODE has valid Svelte structure', () => {
    const code = extractCodeBlock('SVELTE_TODO_CODE');
    expect(code).not.toBeNull();
    expect(code).toContain('<script');
    expect(code).toContain('{#each todos');
    // No invalid style interpolation (the old bug)
    expect(code).not.toContain("style=\"flex:1;color:#e2e8f0;font-size:14px;{todo");
    // Should use style: directive instead
    expect(code).toContain('style:text-decoration');
  });
});

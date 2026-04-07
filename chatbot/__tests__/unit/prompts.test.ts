// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, formatExamples } from '../../src/prompts/system';

describe('System Prompts', () => {
  describe('buildSystemPrompt', () => {
    it('React prompt imports @tuvix.js/react and uses createReactMicroApp', () => {
      const prompt = buildSystemPrompt('react', []);
      expect(prompt).toContain('@tuvix.js/react');
      expect(prompt).toContain('createReactMicroApp');
      expect(prompt).toContain('React');
    });

    it('Vue prompt imports @tuvix.js/vue and uses createVueMicroApp', () => {
      const prompt = buildSystemPrompt('vue', []);
      expect(prompt).toContain('@tuvix.js/vue');
      expect(prompt).toContain('createVueMicroApp');
      expect(prompt).toContain('Vue 3');
    });

    it('Svelte prompt uses raw SFC format (createSvelteMicroApp is only in FORBIDDEN rule)', () => {
      const prompt = buildSystemPrompt('svelte', []);
      // Svelte prompt tells the LLM to output raw SFC
      expect(prompt).toContain('Svelte');
      // createSvelteMicroApp appears only in the "NO createSvelteMicroApp" forbidden rule
      expect(prompt).toContain('NO createSvelteMicroApp');
      // Must NOT show createSvelteMicroApp as a usage pattern (in import or call)
      expect(prompt).not.toContain("import { createSvelteMicroApp }");
    });

    it('Angular prompt uses defineMicroApp from tuvix.js', () => {
      const prompt = buildSystemPrompt('angular', []);
      expect(prompt).toContain('tuvix.js');
      expect(prompt).toContain('defineMicroApp');
      expect(prompt).toContain('Angular');
      expect(prompt).toContain('bootstrapApplication');
      // createAngularMicroApp only appears in the FORBIDDEN rule, not as correct usage
      expect(prompt).not.toContain("import { createAngularMicroApp }");
    });

    it('null framework generates vanilla JS prompt with defineMicroApp', () => {
      const prompt = buildSystemPrompt(null, []);
      expect(prompt).toContain('defineMicroApp');
      expect(prompt).toContain('vanilla');
      expect(prompt).not.toContain('@tuvix.js/react');
      expect(prompt).not.toContain('@tuvix.js/vue');
      expect(prompt).not.toContain('@tuvix.js/svelte');
      expect(prompt).not.toContain('@tuvix.js/angular');
    });

    it('includes no-tailwind rule in every prompt', () => {
      for (const fw of ['react', 'vue', 'svelte', 'angular', null]) {
        const prompt = buildSystemPrompt(fw as string | null, []);
        expect(prompt).toContain('Tailwind');
      }
    });

    it('includes examples when provided', () => {
      const examples = [{ code: 'const A = () => <div>A</div>;', description: 'Simple component' }];
      const prompt = buildSystemPrompt('react', examples);
      expect(prompt).toContain('const A = () => <div>A</div>;');
      expect(prompt).toContain('Simple component');
    });

    it('shows fallback message when no examples', () => {
      const prompt = buildSystemPrompt('react', []);
      expect(prompt).toContain('No reference examples available');
    });
  });

  describe('formatExamples', () => {
    it('formats multiple examples with separators', () => {
      const examples = [
        { code: 'code1', description: 'desc1' },
        { code: 'code2', description: 'desc2' },
      ];
      const formatted = formatExamples(examples);
      expect(formatted).toContain('desc1');
      expect(formatted).toContain('code1');
      expect(formatted).toContain('desc2');
      expect(formatted).toContain('code2');
      expect(formatted).toContain('---');
    });

    it('returns fallback message when no examples', () => {
      const formatted = formatExamples([]);
      expect(formatted).toContain('No reference examples');
    });
  });
});

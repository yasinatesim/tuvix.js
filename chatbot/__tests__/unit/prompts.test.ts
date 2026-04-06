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

    it('Svelte prompt imports @tuvix.js/svelte and uses createSvelteMicroApp', () => {
      const prompt = buildSystemPrompt('svelte', []);
      expect(prompt).toContain('@tuvix.js/svelte');
      expect(prompt).toContain('createSvelteMicroApp');
      expect(prompt).toContain('Svelte');
    });

    it('Angular prompt imports @tuvix.js/angular and uses createAngularMicroApp', () => {
      const prompt = buildSystemPrompt('angular', []);
      expect(prompt).toContain('@tuvix.js/angular');
      expect(prompt).toContain('createAngularMicroApp');
      expect(prompt).toContain('Angular');
    });

    it('null framework generates vanilla JS prompt with defineMicroApp', () => {
      const prompt = buildSystemPrompt(null, []);
      expect(prompt).toContain('defineMicroApp');
      expect(prompt).toContain('plain JavaScript/TypeScript');
      expect(prompt).not.toContain('@tuvix.js/react');
      expect(prompt).not.toContain('@tuvix.js/vue');
      expect(prompt).not.toContain('@tuvix.js/svelte');
      expect(prompt).not.toContain('@tuvix.js/angular');
    });

    it('includes no-tailwind rule in every prompt', () => {
      for (const fw of ['react', 'vue', 'svelte', 'angular', null]) {
        const prompt = buildSystemPrompt(fw, []);
        expect(prompt).toContain('Do NOT use Tailwind');
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

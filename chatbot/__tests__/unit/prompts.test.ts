// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, formatExamples } from '../../src/prompts/system';

describe('System Prompts', () => {
  describe('buildSystemPrompt', () => {
    it('includes framework name', () => {
      const prompt = buildSystemPrompt('react', []);
      expect(prompt).toContain('@tuvix.js/react');
      expect(prompt).toContain('React');
    });

    it('includes no-tailwind rule', () => {
      const prompt = buildSystemPrompt('vue', []);
      expect(prompt).toContain('Do NOT use Tailwind');
    });

    it('includes examples when provided', () => {
      const examples = [{ code: 'const A = () => <div>A</div>;', description: 'Simple component' }];
      const prompt = buildSystemPrompt('react', examples);
      expect(prompt).toContain('const A = () => <div>A</div>;');
      expect(prompt).toContain('Simple component');
    });

    it('works for all four frameworks', () => {
      for (const fw of ['react', 'vue', 'svelte', 'angular'] as const) {
        const prompt = buildSystemPrompt(fw, []);
        expect(prompt).toContain(`@tuvix.js/${fw}`);
      }
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

    it('returns empty message when no examples', () => {
      const formatted = formatExamples([]);
      expect(formatted).toContain('No reference examples');
    });
  });
});

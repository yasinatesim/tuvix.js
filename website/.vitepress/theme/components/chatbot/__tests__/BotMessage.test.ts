// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { extractCodeBlocks, parseMarkdownContent } from '../BotMessage.vue';

describe('BotMessage', () => {
  describe('extractCodeBlocks', () => {
    it('extracts fenced code blocks with language', () => {
      const md = 'Hello\n```tsx\nconst x = 1;\n```\nWorld';
      const blocks = extractCodeBlocks(md);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].language).toBe('tsx');
      expect(blocks[0].code).toBe('const x = 1;');
    });

    it('returns empty array for no code blocks', () => {
      expect(extractCodeBlocks('just text')).toEqual([]);
    });
  });

  describe('parseMarkdownContent', () => {
    it('converts markdown to HTML', () => {
      const html = parseMarkdownContent('**bold** text');
      expect(html).toContain('<strong>bold</strong>');
    });
  });
});

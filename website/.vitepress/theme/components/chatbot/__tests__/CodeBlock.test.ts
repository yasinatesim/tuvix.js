// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildPlaygroundUrl } from '../CodeBlock.vue';

describe('CodeBlock', () => {
  describe('buildPlaygroundUrl', () => {
    it('encodes code as base64 in query param', () => {
      const url = buildPlaygroundUrl('const x = 1;', 'react');
      const params = new URLSearchParams(url.split('?')[1]);
      expect(params.get('framework')).toBe('react');
      const decoded = Buffer.from(params.get('code')!, 'base64').toString('utf-8');
      expect(decoded).toBe('const x = 1;');
    });

    it('works for all frameworks', () => {
      for (const fw of ['react', 'vue', 'svelte', 'angular']) {
        const url = buildPlaygroundUrl('code', fw);
        expect(url).toContain(`framework=${fw}`);
      }
    });
  });
});

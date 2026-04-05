import { describe, it, expect } from 'vitest';
import { parseNavLinks, normalizeNavLink, extractBlock } from '../validate-i18n';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// ─── extractBlock ─────────────────────────────────────────────────────────────

describe('extractBlock', () => {
  it('extracts a simple object block after a key', () => {
    const src = "nav: { text: 'hi', link: '/foo' }";
    const result = extractBlock(src, 'nav:');
    expect(result).toBe("{ text: 'hi', link: '/foo' }");
  });

  it('extracts a nested array block', () => {
    const src = "sidebar: [{ items: [1, 2] }]";
    const result = extractBlock(src, 'sidebar:');
    expect(result).toBe("[{ items: [1, 2] }]");
  });

  it('returns null when key is missing', () => {
    expect(extractBlock("no nav here", 'nav:')).toBeNull();
  });

  it('handles deeply nested braces', () => {
    const src = "nav: { a: { b: { c: 1 } } }";
    const result = extractBlock(src, 'nav:');
    expect(result).toBe("{ a: { b: { c: 1 } } }");
  });
});

// ─── normalizeNavLink ─────────────────────────────────────────────────────────

describe('normalizeNavLink', () => {
  it('strips locale prefix from localized links', () => {
    expect(normalizeNavLink('/de/guide/getting-started', 'de')).toBe('/guide/getting-started');
    expect(normalizeNavLink('/tr/guide/getting-started', 'tr')).toBe('/guide/getting-started');
    expect(normalizeNavLink('/zh/packages/', 'zh')).toBe('/packages/');
  });

  it('leaves shared links unchanged (no locale prefix)', () => {
    expect(normalizeNavLink('/playground', 'de')).toBe('/playground');
    expect(normalizeNavLink('/chatbot', 'tr')).toBe('/chatbot');
  });

  it('does not strip wrong locale prefix', () => {
    // /de/ link should not be stripped by 'tr' locale
    expect(normalizeNavLink('/de/guide', 'tr')).toBe('/de/guide');
  });
});

// ─── parseNavLinks (uses temp files) ─────────────────────────────────────────

describe('parseNavLinks', () => {
  function writeTempConfig(content: string): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-test-'));
    const file = path.join(dir, 'locale.ts');
    fs.writeFileSync(file, content);
    return file;
  }

  it('extracts simple nav links', () => {
    const file = writeTempConfig(`
      export const config = {
        themeConfig: {
          nav: [
            { text: 'Guide', link: '/guide/start', activeMatch: '/guide/' },
            { text: 'Playground', link: '/playground', activeMatch: '/playground' },
            { text: 'Chatbot', link: '/chatbot', activeMatch: '/chatbot' },
          ],
        },
      };
    `);
    const links = parseNavLinks(file);
    expect(links).toContain('/guide/start');
    expect(links).toContain('/playground');
    expect(links).toContain('/chatbot');
  });

  it('does not include links from dropdown items arrays', () => {
    const file = writeTempConfig(`
      export const config = {
        themeConfig: {
          nav: [
            { text: 'Guide', link: '/guide/start' },
            {
              text: 'v1.0',
              items: [
                { text: 'Changelog', link: 'https://github.com/foo/releases' },
                { text: 'Contribute', link: 'https://github.com/foo/CONTRIBUTING.md' },
              ],
            },
          ],
        },
      };
    `);
    const links = parseNavLinks(file);
    expect(links).toContain('/guide/start');
    // Dropdown-only links should NOT appear in the nav links list
    expect(links).not.toContain('https://github.com/foo/releases');
  });

  it('returns empty array for missing file', () => {
    expect(parseNavLinks('/does/not/exist/locale.ts')).toEqual([]);
  });

  it('returns empty array when no nav block', () => {
    const file = writeTempConfig(`export const config = { themeConfig: { sidebar: [] } };`);
    expect(parseNavLinks(file)).toEqual([]);
  });

  it('detects missing nav link that exists in English', () => {
    // English has /chatbot, locale does not
    const enFile = writeTempConfig(`
      export const config = {
        themeConfig: {
          nav: [
            { text: 'Guide', link: '/guide/start' },
            { text: 'Playground', link: '/playground' },
            { text: 'AI Generator', link: '/chatbot' },
          ],
        },
      };
    `);
    const localeFile = writeTempConfig(`
      export const config = {
        themeConfig: {
          nav: [
            { text: 'Kılavuz', link: '/tr/guide/start' },
            { text: 'Playground', link: '/playground' },
            // Missing: AI Generator / chatbot link
          ],
        },
      };
    `);

    const enLinks = parseNavLinks(enFile);
    const localeLinks = parseNavLinks(localeFile).map((l) => normalizeNavLink(l, 'tr'));

    expect(enLinks).toContain('/chatbot');
    expect(localeLinks).not.toContain('/chatbot');

    // This is the invariant the validator enforces
    const missing = enLinks.filter((l) => !localeLinks.includes(l));
    expect(missing).toContain('/chatbot');
  });
});

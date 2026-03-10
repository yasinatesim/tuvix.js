import { describe, it, expect } from 'vitest';
import { composeHTML } from '../index';

describe('composeHTML', () => {
  it('should replace tuvix-slot tags with content', () => {
    const template = '<div><tuvix-slot name="header"></tuvix-slot><tuvix-slot name="main"></tuvix-slot></div>';
    const result = composeHTML(template, {
      header: '<h1>Hello</h1>',
      main: '<p>World</p>',
    });

    expect(result).toBe('<div><h1>Hello</h1><p>World</p></div>');
  });

  it('should replace self-closing tuvix-slot tags', () => {
    const template = '<div><tuvix-slot name="footer" /></div>';
    const result = composeHTML(template, {
      footer: '<footer>Footer</footer>',
    });

    expect(result).toBe('<div><footer>Footer</footer></div>');
  });

  it('should leave unmatched slots unchanged', () => {
    const template = '<div><tuvix-slot name="missing"></tuvix-slot></div>';
    const result = composeHTML(template, {});

    expect(result).toBe('<div><tuvix-slot name="missing"></tuvix-slot></div>');
  });
});

import { describe, it, expect } from 'vitest';
import { buildFrame } from '../frame-builder';

describe('buildFrame()', () => {
  it('injects compiled code in place of placeholder', () => {
    const html = buildFrame({ compiledCode: 'console.log("hi")' });
    expect(html).toContain('console.log("hi")');
    expect(html).not.toContain('/* COMPILED_CODE */');
  });

  it('includes built-in tuvix.js importmap entries', () => {
    const html = buildFrame({ compiledCode: '' });
    expect(html).toContain('"tuvix.js"');
    expect(html).toContain('"@tuvix.js/core"');
    expect(html).toContain('"@tuvix.js/sandbox"');
    expect(html).toContain('"@tuvix.js/event-bus"');
  });

  it('merges extra imports into importmap (built-in wins on conflict)', () => {
    const html = buildFrame({
      compiledCode: '',
      extraImports: {
        'my-lib': 'https://esm.sh/my-lib@1.0.0',
        'tuvix.js': 'https://evil.example.com/tuvix',  // conflict — built-in wins
      },
    });
    expect(html).toContain('"my-lib"');
    // built-in entry for tuvix.js must be the esm.sh one
    expect(html).toContain('esm.sh/tuvix.js');
    expect(html).not.toContain('evil.example.com');
  });

  it('escapes </script> in compiled code to prevent injection', () => {
    const html = buildFrame({ compiledCode: 'var x = "</script><script>alert(1)</script>"' });
    expect(html).not.toContain('</script><script>');
    expect(html).toContain('<\\/script>');
  });

  it('includes console capture script', () => {
    const html = buildFrame({ compiledCode: '' });
    expect(html).toContain("parent.postMessage");
    expect(html).toContain("'console'");
  });

  it('includes runtime error capture', () => {
    const html = buildFrame({ compiledCode: '' });
    expect(html).toContain("'runtime-error'");
  });

  it('includes mounted postMessage after module executes', () => {
    const html = buildFrame({ compiledCode: '' });
    expect(html).toContain("'mounted'");
  });
});

import { describe, it, expect } from 'vitest';
import { parseFrameMessage } from '../Console';

describe('parseFrameMessage()', () => {
  it('parses a console log message', () => {
    const msg = parseFrameMessage({ type: 'console', level: 'log', args: ['hello'] });
    expect(msg).toEqual({ kind: 'log', text: 'hello', level: 'log' });
  });

  it('parses a console error message', () => {
    const msg = parseFrameMessage({ type: 'console', level: 'error', args: ['oops'] });
    expect(msg).toEqual({ kind: 'log', text: 'oops', level: 'error' });
  });

  it('joins multiple args with space', () => {
    const msg = parseFrameMessage({ type: 'console', level: 'log', args: ['a', 'b', 'c'] });
    expect(msg?.text).toBe('a b c');
  });

  it('parses a runtime-error message', () => {
    const msg = parseFrameMessage({ type: 'runtime-error', msg: 'ReferenceError: x is not defined', line: 5 });
    expect(msg).toEqual({ kind: 'runtime-error', text: 'ReferenceError: x is not defined', line: 5 });
  });

  it('returns null for unknown message type', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = parseFrameMessage({ type: 'unknown' } as any);
    expect(msg).toBeNull();
  });
});

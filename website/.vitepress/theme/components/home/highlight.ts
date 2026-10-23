/**
 * Minimal TypeScript tokenizer for the static home page code window.
 * It covers the constructs used in the hero snippet (keywords, strings,
 * calls, object keys, comments) so the page needs no runtime highlighter.
 */

export type TokenKind =
  'keyword' | 'string' | 'fn' | 'prop' | 'punct' | 'comment' | 'plain';

export interface Token {
  kind: TokenKind;
  text: string;
}

const KEYWORDS: Record<string, true> = {
  import: true,
  from: true,
  export: true,
  default: true,
  const: true,
  let: true,
  await: true,
  async: true,
  return: true,
  new: true,
};

const PATTERN =
  /(?<comment>\/\/.*$)|(?<string>'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(?<word>[A-Za-z_$][\w$]*)|(?<punct>[{}()[\];,.:=<>*/+-])/g;

/** Splits one line of TypeScript into display tokens; the texts join back to `line`. */
export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  const push = (kind: TokenKind, text: string) => {
    const prev = tokens[tokens.length - 1];
    if (prev && prev.kind === kind) prev.text += text;
    else tokens.push({ kind, text });
  };

  for (const match of line.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) push('plain', line.slice(last, index));
    const text = match[0];
    const groups = match.groups ?? {};
    if (groups.comment) push('comment', text);
    else if (groups.string) push('string', text);
    else if (groups.punct) push('punct', text);
    else if (KEYWORDS[text] === true) push('keyword', text);
    else {
      const rest = line.slice(index + text.length);
      if (/^\s*\(/.test(rest)) push('fn', text);
      else if (/^\s*:/.test(rest)) push('prop', text);
      else push('plain', text);
    }
    last = index + text.length;
  }
  if (last < line.length) push('plain', line.slice(last));
  return tokens;
}

/** Tokenizes a multi-line snippet, one token list per line. */
export function tokenize(code: string): Token[][] {
  return code.replace(/\n$/, '').split('\n').map(tokenizeLine);
}

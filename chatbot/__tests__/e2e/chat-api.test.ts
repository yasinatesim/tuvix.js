// @vitest-environment node
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import type { Server } from 'http';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const { createApp } = await import('../../src/server');

  const componentCode = `import { createReactMicroApp } from '@tuvix.js/react';
function Header() { return <header><nav>Home | About</nav></header>; }
export default createReactMicroApp({ name: 'header', App: Header });`;

  const mockRag = {
    async *generate(_msg: string, _fw: string, onSources: (s: Array<{ id: string; score: number }>) => void) {
      onSources([{ id: 'react-header-001', score: 0.12 }]);
      yield '```tsx\n';
      yield componentCode;
      yield '\n```';
    },
  };

  const { app } = createApp({
    rag: mockRag,
    config: { corsOrigin: '*' },
  });

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') baseUrl = `http://localhost:${addr.port}`;
      resolve();
    });
  });
});

afterAll(() => { server?.close(); });

describe('Chat API - Full Flow', () => {
  it('returns SSE stream with code block content', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'react header', framework: 'react' }),
    });

    expect(res.status).toBe(200);
    const text = await res.text();
    const events = text.split('\n')
      .filter((l) => l.startsWith('data: '))
      .map((l) => JSON.parse(l.slice(6)));

    const tokens = events.filter((e) => e.type === 'token').map((e) => e.content);
    const fullContent = tokens.join('');
    expect(fullContent).toContain('createReactMicroApp');
    expect(fullContent).toContain('@tuvix.js/react');

    const sources = events.find((e) => e.type === 'sources');
    expect(sources.content).toHaveLength(1);
    expect(sources.content[0].id).toBe('react-header-001');

    expect(events.some((e) => e.type === 'done')).toBe(true);
  });

  it('rejects invalid framework', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hello', framework: 'jquery' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('framework must be one of');
  });
});

// @vitest-environment node
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import type { Server } from 'http';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const { createApp } = await import('../../src/server');

  const mockRag = {
    async *generate(_msg: string, _fw: string, onSources: (s: Array<{ id: string; score: number }>) => void) {
      onSources([{ id: 'test-001', score: 0.1 }]);
      yield 'Hello ';
      yield 'world';
    },
  };

  const mockStore = {
    init: async () => {},
    upsert: async () => {},
    query: async () => [],
    count: async () => 5,
  };

  const mockOllama = {
    embed: async () => [0.1],
    chat: async function* () { yield 'x'; },
    isModelAvailable: async () => true,
  };

  const app = createApp({
    rag: mockRag,
    store: mockStore,
    ollama: mockOllama,
    config: { corsOrigin: '*', modelName: 'test-model', embedModel: 'test-embed' },
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

describe('Chat API - SSE Streaming', () => {
  it('streams tokens via SSE', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hello', framework: 'react' }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');

    const text = await res.text();
    const lines = text.split('\n').filter((l) => l.startsWith('data: '));
    const events = lines.map((l) => JSON.parse(l.replace('data: ', '')));

    const tokenEvents = events.filter((e) => e.type === 'token');
    expect(tokenEvents.map((e) => e.content)).toEqual(['Hello ', 'world']);

    const sourceEvent = events.find((e) => e.type === 'sources');
    expect(sourceEvent.content).toEqual([{ id: 'test-001', score: 0.1 }]);

    const doneEvent = events.find((e) => e.type === 'done');
    expect(doneEvent).toBeDefined();
  });

  it('returns 400 for missing message', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ framework: 'react' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing framework', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hello' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('Health API', () => {
  it('returns health status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.chromadb.connected).toBe(true);
  });
});

describe('Rate Limiting', () => {
  let rlServer: import('http').Server;
  let rlBaseUrl: string;

  beforeAll(async () => {
    const { createApp } = await import('../../src/server');
    const mockRag = {
      async *generate(_m: string, _f: string, onSources: (s: Array<{ id: string; score: number }>) => void) {
        onSources([]);
        yield 'ok';
      },
    };
    const app = createApp({
      rag: mockRag,
      store: { init: async () => {}, upsert: async () => {}, query: async () => [], count: async () => 0 },
      ollama: { embed: async () => [0.1], chat: async function* () { yield 'x'; }, isModelAvailable: async () => true },
      config: { corsOrigin: '*', modelName: 'test', embedModel: 'test' },
    });
    await new Promise<void>((resolve) => {
      rlServer = app.listen(0, () => {
        const addr = rlServer.address();
        if (addr && typeof addr === 'object') rlBaseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(() => { rlServer?.close(); });

  it('returns 429 after 10 requests from the same IP within one minute', async () => {
    // Send 10 allowed requests
    for (let i = 0; i < 10; i++) {
      const res = await fetch(`${rlBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello', framework: 'react' }),
      });
      expect(res.status).toBe(200);
    }

    // The 11th request should be rate-limited
    const limited = await fetch(`${rlBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hello', framework: 'react' }),
    });
    expect(limited.status).toBe(429);
    const body = await limited.json();
    expect(body.error).toContain('Rate limit exceeded');
  });
});

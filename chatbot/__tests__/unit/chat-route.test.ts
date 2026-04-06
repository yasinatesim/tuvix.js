// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createChatRoute } from '../../src/routes/chat';
import type { RagPipeline } from '../../src/services/rag';

function mockRag(tokens: string[] = ['Hello']): RagPipeline {
  return {
    generate: vi.fn(async function* (_msg, _fw, onSources) {
      onSources?.([]);
      for (const token of tokens) yield token;
    }),
  };
}

function mockRes() {
  const chunks: string[] = [];
  const listeners: Record<string, () => void> = {};
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    writeHead: vi.fn(),
    write: vi.fn((chunk: string) => { chunks.push(chunk); }),
    end: vi.fn(),
    on: vi.fn((event: string, cb: () => void) => { listeners[event] = cb; }),
    _chunks: chunks,
    _listeners: listeners,
  };
}

function mockReq(body: Record<string, unknown> = {}) {
  return { body, ip: '127.0.0.1' } as never;
}

function makeStreams() {
  return new Map<string, number>();
}

describe('createChatRoute', () => {
  describe('input validation', () => {
    it('returns 400 when message is missing', async () => {
      const route = createChatRoute(mockRag(), makeStreams());
      const res = mockRes();
      await route(mockReq({ framework: 'react' }), res as never);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'message is required' });
    });

    it('returns 400 when message is not a string', async () => {
      const route = createChatRoute(mockRag(), makeStreams());
      const res = mockRes();
      await route(mockReq({ message: 123, framework: 'react' }), res as never);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when message exceeds 2000 characters', async () => {
      const route = createChatRoute(mockRag(), makeStreams());
      const res = mockRes();
      await route(mockReq({ message: 'a'.repeat(2001), framework: 'react' }), res as never);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].error).toMatch(/2000/);
    });

    it('accepts missing framework (generates vanilla JS)', async () => {
      const route = createChatRoute(mockRag(), makeStreams());
      const res = mockRes();
      await route(mockReq({ message: 'make a header' }), res as never);
      expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
        'Content-Type': 'text/event-stream',
      }));
    });

    it('returns 400 for unknown framework', async () => {
      const route = createChatRoute(mockRag(), makeStreams());
      const res = mockRes();
      await route(mockReq({ message: 'make a header', framework: 'unknown' }), res as never);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].error).toMatch(/framework must be one of/);
    });

    it('returns 429 when IP has too many concurrent streams', async () => {
      const streams = makeStreams();
      streams.set('127.0.0.1', 2); // already at max
      const route = createChatRoute(mockRag(), streams);
      const res = mockRes();
      await route(mockReq({ message: 'make a header', framework: 'react' }), res as never);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json.mock.calls[0][0].error).toMatch(/Too many concurrent/);
    });
  });

  describe('valid frameworks', () => {
    const frameworks = ['react', 'vue', 'svelte', 'angular'];

    for (const framework of frameworks) {
      it(`accepts framework: ${framework}`, async () => {
        const route = createChatRoute(mockRag(), makeStreams());
        const res = mockRes();
        await route(mockReq({ message: `make a header`, framework }), res as never);
        expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
          'Content-Type': 'text/event-stream',
        }));
      });
    }
  });

  describe('streaming response', () => {
    it('streams token events from rag pipeline', async () => {
      const rag = mockRag(['Hello', ' world']);
      const route = createChatRoute(rag, makeStreams());
      const res = mockRes();
      await route(mockReq({ message: 'make a header', framework: 'react' }), res as never);

      const tokenChunks = res._chunks.filter((c) => c.includes('"type":"token"'));
      expect(tokenChunks).toHaveLength(2);
      expect(tokenChunks[0]).toContain('"content":"Hello"');
      expect(tokenChunks[1]).toContain('"content":" world"');
    });

    it('sends sources event after tokens', async () => {
      const rag = mockRag(['token']);
      const route = createChatRoute(rag, makeStreams());
      const res = mockRes();
      await route(mockReq({ message: 'make a header', framework: 'react' }), res as never);

      const sourcesChunk = res._chunks.find((c) => c.includes('"type":"sources"'));
      expect(sourcesChunk).toBeDefined();
    });

    it('sends done event at the end', async () => {
      const route = createChatRoute(mockRag(), makeStreams());
      const res = mockRes();
      await route(mockReq({ message: 'make a header', framework: 'react' }), res as never);

      const doneChunk = res._chunks.find((c) => c.includes('"type":"done"'));
      expect(doneChunk).toBeDefined();
      expect(res.end).toHaveBeenCalled();
    });

    it('detects framework from message text, overriding client value', async () => {
      const rag = mockRag();
      const route = createChatRoute(rag, makeStreams());
      const res = mockRes();
      // message mentions "vue" but client sends framework: "react"
      await route(mockReq({ message: 'make a vue header', framework: 'react' }), res as never);

      expect(rag.generate).toHaveBeenCalledWith(
        'make a vue header',
        'vue',
        expect.any(Function),
      );
    });

    it('accepts no framework (null) and uses vanilla JS path', async () => {
      const route = createChatRoute(mockRag(), makeStreams());
      const res = mockRes();
      await route(mockReq({ message: 'make a component' }), res as never);
      expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
        'Content-Type': 'text/event-stream',
      }));
    });

    it('sends generic error event (not raw error) when rag throws', async () => {
      const rag: RagPipeline = {
        generate: vi.fn(async function* () {
          throw new Error('model unavailable internal detail');
        }),
      };
      const route = createChatRoute(rag, makeStreams());
      const res = mockRes();
      await route(mockReq({ message: 'make a header', framework: 'react' }), res as never);

      const errorChunk = res._chunks.find((c) => c.includes('"type":"error"'));
      expect(errorChunk).toBeDefined();
      // Must NOT leak the raw internal error message
      expect(errorChunk).not.toContain('model unavailable internal detail');
      expect(errorChunk).toContain('An error occurred');
    });

    it('decrements active stream count on connection close', async () => {
      const streams = makeStreams();
      const route = createChatRoute(mockRag(), streams);
      const res = mockRes();
      await route(mockReq({ message: 'make a header', framework: 'react' }), res as never);

      // Simulate connection close
      res._listeners['close']?.();
      expect(streams.has('127.0.0.1')).toBe(false);
    });
  });
});

// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createOllamaClient } from '../../src/services/ollama';

describe('OllamaClient', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('embed', () => {
    it('sends correct request to Ollama embedding API', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ embeddings: [[0.1, 0.2, 0.3]] }),
      });

      const client = createOllamaClient('http://localhost:11434', 'nomic-embed-text');
      const result = await client.embed('react header component');

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:11434/api/embed',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'nomic-embed-text', input: 'react header component' }),
        }),
      );
      expect(result).toEqual([0.1, 0.2, 0.3]);
    });

    it('includes an AbortSignal for request timeout', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ embeddings: [[0.1]] }),
      });

      const client = createOllamaClient('http://localhost:11434', 'nomic-embed-text');
      await client.embed('test');

      const [, options] = fetchSpy.mock.calls[0];
      expect(options.signal).toBeInstanceOf(AbortSignal);
      expect(options.signal.aborted).toBe(false);
    });

    it('throws on Ollama error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'model not found',
      });

      const client = createOllamaClient('http://localhost:11434', 'nomic-embed-text');
      await expect(client.embed('test')).rejects.toThrow('Ollama embedding failed (404)');
    });
  });

  describe('chat', () => {
    it('streams chat completion tokens', async () => {
      const lines = [
        '{"message":{"content":"Hello"},"done":false}',
        '{"message":{"content":" world"},"done":false}',
        '{"message":{"content":""},"done":true}',
      ];
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          for (const line of lines) {
            controller.enqueue(encoder.encode(line + '\n'));
          }
          controller.close();
        },
      });

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        body: stream,
      });

      const client = createOllamaClient('http://localhost:11434', 'nomic-embed-text');
      const tokens: string[] = [];

      for await (const token of client.chat('phi3.5:mini', [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hello' },
      ])) {
        tokens.push(token);
      }

      expect(tokens).toEqual(['Hello', ' world']);
    });

    it('sends correct request format', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"message":{"content":""},"done":true}\n'));
          controller.close();
        },
      });

      fetchSpy.mockResolvedValueOnce({ ok: true, body: stream });

      const client = createOllamaClient('http://localhost:11434', 'nomic-embed-text');
      const messages = [{ role: 'user' as const, content: 'test' }];

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of client.chat('model', messages)) { /* consume */ }

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'model', messages, stream: true }),
        }),
      );
    });
  });
});

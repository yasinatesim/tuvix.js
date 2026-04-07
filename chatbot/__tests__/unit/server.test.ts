// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server';
import type { RagPipeline } from '../../src/services/rag';

function mockRag(tokens: string[] = ['Hello']): RagPipeline {
  return {
    generate: vi.fn(async function* (_msg, _fw, onSources) {
      onSources?.([]);
      for (const token of tokens) yield token;
    }),
  };
}

const cleanups: Array<() => void> = [];

function buildApp(corsOrigin = '*', rag = mockRag()) {
  const { app, cleanup } = createApp({ rag, config: { corsOrigin } });
  cleanups.push(cleanup);
  return app;
}

afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
});

describe('createApp', () => {
  describe('POST /api/chat', () => {
    it('returns 400 for missing message', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/chat')
        .send({ framework: 'react' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/message/);
    });

    it('accepts missing framework (generates vanilla JS output)', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'make a header' });
      expect(res.status).toBe(200);
    });

    it('returns 400 for invalid framework', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'make a header', framework: 'tailwind' });
      expect(res.status).toBe(400);
    });

    it('returns 200 SSE stream for valid request', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'make a header', framework: 'react' });
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');
    });

    it('accepts no framework and generates vanilla JS', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'make a component' });
      expect(res.status).toBe(200);
    });

    it('returns 400 for message exceeding 2000 characters', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'a'.repeat(2001), framework: 'react' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/2000/);
    });

    it('applies rate limit after 10 requests from same IP', async () => {
      const app = buildApp();
      const payload = { message: 'make a header', framework: 'react' };

      for (let i = 0; i < 10; i++) {
        await request(app).post('/api/chat').send(payload);
      }

      const res = await request(app).post('/api/chat').send(payload);
      expect(res.status).toBe(429);
      expect(res.body.error).toMatch(/Rate limit/);
    });
  });

  describe('CORS', () => {
    it('sets CORS header for allowed origin', async () => {
      const app = buildApp('http://localhost:5173');
      const res = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:5173')
        .send({ message: 'make a header', framework: 'react' });
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
  });

  describe('no /api/health endpoint', () => {
    it('returns 404 for GET /api/health', async () => {
      const app = buildApp();
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(404);
    });
  });
});

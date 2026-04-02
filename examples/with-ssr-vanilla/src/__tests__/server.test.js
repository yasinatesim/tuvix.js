import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server.js';

describe('SSR Express server (vanilla)', () => {
  it('GET / returns 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });

  it('responds with text/html', async () => {
    const res = await request(app).get('/');
    expect(res.headers['content-type']).toContain('text/html');
  });

  it('contains pre-rendered Left Service HTML', async () => {
    const res = await request(app).get('/');
    expect(res.text).toContain('Left Service (Vanilla JS)');
  });

  it('contains pre-rendered Right Service HTML', async () => {
    const res = await request(app).get('/');
    expect(res.text).toContain('Right Service (Vanilla JS)');
  });

  it('does not contain unfilled tuvix-slot elements', async () => {
    const res = await request(app).get('/');
    expect(res.text).not.toContain('<tuvix-slot name="left-service">');
    expect(res.text).not.toContain('<tuvix-slot name="right-service">');
  });
});

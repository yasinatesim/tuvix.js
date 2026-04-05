import type { Request, Response } from 'express';
import type { RagPipeline, SourceReference } from '../services/rag';

export function createChatRoute(rag: RagPipeline) {
  return async (req: Request, res: Response) => {
    const { message, framework } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    if (!framework || typeof framework !== 'string') {
      res.status(400).json({ error: 'framework is required' });
      return;
    }

    const validFrameworks = ['react', 'vue', 'svelte', 'angular'];
    if (!validFrameworks.includes(framework)) {
      res.status(400).json({ error: `framework must be one of: ${validFrameworks.join(', ')}` });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    try {
      let sources: SourceReference[] = [];
      for await (const token of rag.generate(message, framework, (s) => { sources = s; })) {
        res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ type: 'sources', content: sources })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.write(`data: ${JSON.stringify({ type: 'error', content: errorMessage })}\n\n`);
    }

    res.end();
  };
}

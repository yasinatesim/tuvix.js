import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { createChatRoute } from './routes/chat';
import { createOllamaClient } from './services/ollama';
import { createVectorStore } from './services/vectordb';
import { createRagPipeline, type RagPipeline } from './services/rag';
import { CONFIG } from './config';

interface AppDependencies {
  rag: RagPipeline;
  config: {
    corsOrigin: string;
  };
}

export interface AppInstance {
  app: Express;
  /** Call in tests or shutdown handlers to stop the rate-limit cleanup timer. */
  cleanup(): void;
}

export function createApp(deps: AppDependencies): AppInstance {
  const app = express();

  // Trust first proxy (nginx/load balancer) so req.ip reflects the real client IP
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: deps.config.corsOrigin }));
  app.use(express.json({ limit: '16kb' }));

  // Rate limiting: 10 requests per minute per IP
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  // Evict stale rate-limit entries every minute to prevent unbounded growth.
  // Store the timer so callers can clear it (prevents leaks in tests).
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
  }, 60_000);
  // Allow Node.js to exit even if the timer is still active (non-blocking ref)
  cleanupTimer.unref();

  // Concurrent SSE connection tracking: max 2 open streams per IP
  const activeStreams = new Map<string, number>();

  app.use('/api/chat', (req, res, next) => {
    const ip = req.ip ?? 'unknown';
    const now = Date.now();
    const limit = rateLimitMap.get(ip);
    if (!limit || now > limit.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
      next();
    } else if (limit.count >= 10) {
      res.status(429).json({ error: 'Rate limit exceeded. Please wait before sending more requests.' });
    } else {
      limit.count++;
      next();
    }
  });

  app.post('/api/chat', createChatRoute(deps.rag, activeStreams));

  return {
    app,
    cleanup() {
      clearInterval(cleanupTimer);
    },
  };
}

async function main() {
  const ollama = createOllamaClient(CONFIG.ollamaUrl, CONFIG.embedModel, CONFIG.ollamaTimeoutMs);

  const modelReady = await ollama.isModelAvailable(CONFIG.modelName);
  if (!modelReady) {
    throw new Error(`Model "${CONFIG.modelName}" is not available in Ollama. Run: ollama pull ${CONFIG.modelName}`);
  }

  const store = createVectorStore(CONFIG.chromaUrl, CONFIG.collectionName);

  await store.init();

  const rag = createRagPipeline(ollama, store, CONFIG.modelName);

  const { app } = createApp({
    rag,
    config: {
      corsOrigin: CONFIG.corsOrigin,
    },
  });

  app.listen(CONFIG.port, () => {
    console.log(`Chatbot server running on port ${CONFIG.port}`);
  });
}

// Only start server when run directly (not when imported in tests)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

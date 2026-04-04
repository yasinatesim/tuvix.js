import express, { type Express } from 'express';
import cors from 'cors';
import { createChatRoute } from './routes/chat';
import { createOllamaClient, type OllamaClient } from './services/ollama';
import { createVectorStore, type VectorStore } from './services/vectordb';
import { createRagPipeline, type RagPipeline } from './services/rag';
import { config as defaultConfig } from './config';

interface AppDependencies {
  rag: RagPipeline;
  store: VectorStore;
  ollama: OllamaClient;
  config: {
    corsOrigin: string;
    modelName: string;
    embedModel: string;
  };
}

export function createApp(deps: AppDependencies): Express {
  const app = express();

  app.use(cors({ origin: deps.config.corsOrigin }));
  app.use(express.json());

  app.post('/api/chat', createChatRoute(deps.rag));

  app.get('/api/health', async (_req, res) => {
    try {
      const [llmAvailable, embedAvailable] = await Promise.all([
        deps.ollama.isModelAvailable(deps.config.modelName).catch(() => false),
        deps.ollama.isModelAvailable(deps.config.embedModel).catch(() => false),
      ]);

      const recordCount = await deps.store.count().catch(() => 0);

      res.json({
        status: 'ok',
        ollama: {
          connected: llmAvailable || embedAvailable,
          models: {
            [deps.config.modelName]: llmAvailable,
            [deps.config.embedModel]: embedAvailable,
          },
        },
        chromadb: {
          connected: true,
          records: recordCount,
        },
        version: '0.1.0',
      });
    } catch {
      res.status(503).json({ status: 'error', message: 'Service unavailable' });
    }
  });

  return app;
}

async function main() {
  const ollama = createOllamaClient(defaultConfig.ollamaUrl, defaultConfig.embedModel);
  const store = createVectorStore(defaultConfig.chromaUrl, defaultConfig.collectionName);

  await store.init();

  const rag = createRagPipeline(ollama, store, defaultConfig.modelName);

  const app = createApp({
    rag,
    store,
    ollama,
    config: {
      corsOrigin: defaultConfig.corsOrigin,
      modelName: defaultConfig.modelName,
      embedModel: defaultConfig.embedModel,
    },
  });

  app.listen(defaultConfig.port, () => {
    console.log(`Chatbot server running on port ${defaultConfig.port}`);
  });
}

// Only start server when run directly (not when imported in tests)
if (process.argv[1]?.includes('server')) {
  main().catch(console.error);
}

export const CONFIG = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
  chromaUrl: process.env.CHROMA_URL ?? 'http://localhost:8000',
  modelName: process.env.MODEL_NAME ?? 'minimax/minimax-m2.5:free',
  embedModel: process.env.EMBED_MODEL ?? 'qwen/qwen3-embedding-0.6b',
  port: parseInt(process.env.PORT ?? '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  collectionName: 'tuvix_components',
  timeoutMs: parseInt(process.env.TIMEOUT_MS ?? '60000', 10),
} as const;

export type Config = typeof CONFIG;

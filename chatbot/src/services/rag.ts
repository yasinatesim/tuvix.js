import type { OllamaClient, ChatMessage } from './ollama';
import type { VectorStore } from './vectordb';
import { buildSystemPrompt } from '../prompts/system';

export interface SourceReference {
  id: string;
  score: number;
}

export interface RagPipeline {
  generate(userMessage: string, framework: string): AsyncGenerator<string>;
  lastSources: SourceReference[];
}

export function createRagPipeline(
  ollama: OllamaClient,
  store: VectorStore,
  modelName: string,
): RagPipeline {
  let lastSources: SourceReference[] = [];

  return {
    get lastSources() {
      return lastSources;
    },

    async *generate(userMessage: string, framework: string): AsyncGenerator<string> {
      const embedding = await ollama.embed(userMessage);
      const results = await store.query(embedding, 5, framework);
      lastSources = results.map((r) => ({ id: r.id, score: r.score }));
      const examples = results.map((r) => ({ code: r.code, description: r.description }));
      const systemPrompt = buildSystemPrompt(framework, examples);
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ];
      yield* ollama.chat(modelName, messages);
    },
  };
}

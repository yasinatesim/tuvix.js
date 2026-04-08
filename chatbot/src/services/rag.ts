import type { LLMClient, ChatMessage } from './openrouter';
import type { VectorStore } from './vectordb';
import { buildSystemPrompt } from '../prompts/system';

export interface SourceReference {
  id: string;
  score: number;
}

export interface RagPipeline {
  generate(
    userMessage: string,
    framework: string | null,
    onSources: (sources: SourceReference[]) => void,
  ): AsyncGenerator<string>;
}

export function createRagPipeline(
  llm: LLMClient,
  store: VectorStore,
  modelName: string,
): RagPipeline {
  return {
    async *generate(
      userMessage: string,
      framework: string | null,
      onSources: (sources: SourceReference[]) => void,
    ): AsyncGenerator<string> {
      const embedding = await llm.embed(userMessage);
      let results: Awaited<ReturnType<typeof store.query>> = [];
      try {
        results = await store.query(embedding, 5, framework ?? undefined);
      } catch (err) {
        console.warn('ChromaDB query failed, falling back to LLM-only response:', err instanceof Error ? err.message : err);
      }
      onSources(results.map((r) => ({ id: r.id, score: r.score })));
      const examples = results.map((r) => ({ code: r.code, description: r.description }));
      const systemPrompt = buildSystemPrompt(framework, examples);
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ];
      yield* llm.chat(modelName, messages);
    },
  };
}

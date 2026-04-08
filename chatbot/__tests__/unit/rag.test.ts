// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createRagPipeline } from '../../src/services/rag';
import type { LLMClient } from '../../src/services/openrouter';
import type { VectorStore, QueryResult } from '../../src/services/vectordb';

function createMockLLM(): LLMClient {
  return {
    embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    chat: vi.fn().mockReturnValue((async function* () {
      yield 'Here is ';
      yield 'your component';
    })()),
  };
}

function createMockStore(): VectorStore {
  const queryResults: QueryResult[] = [{
    id: 'react-header-001',
    description: 'React header with nav',
    framework: 'react',
    category: 'header',
    code: 'const Header = () => <nav>Links</nav>;',
    score: 0.12,
  }];

  return {
    init: vi.fn(),
    upsert: vi.fn(),
    query: vi.fn().mockResolvedValue(queryResults),
    count: vi.fn().mockResolvedValue(10),
  };
}

describe('RAG Pipeline', () => {
  it('embeds the user message', async () => {
    const llm = createMockLLM();
    const store = createMockStore();
    const rag = createRagPipeline(llm, store, 'minimax/minimax-m2.5:free');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of rag.generate('react header', 'react', () => {})) { /* consume */ }
    expect(llm.embed).toHaveBeenCalledWith('react header');
  });

  it('queries vector store with embedding and framework', async () => {
    const llm = createMockLLM();
    const store = createMockStore();
    const rag = createRagPipeline(llm, store, 'minimax/minimax-m2.5:free');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of rag.generate('react header', 'react', () => {})) { /* consume */ }
    expect(store.query).toHaveBeenCalledWith([0.1, 0.2, 0.3], 5, 'react');
  });

  it('passes retrieved examples to LLM via system prompt', async () => {
    const llm = createMockLLM();
    const store = createMockStore();
    const rag = createRagPipeline(llm, store, 'minimax/minimax-m2.5:free');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of rag.generate('header', 'react', () => {})) { /* consume */ }

    const chatCall = (llm.chat as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(chatCall[0]).toBe('minimax/minimax-m2.5:free');

    const messages = chatCall[1];
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('React header with nav');
    expect(messages[0].content).toContain('@tuvix.js/react');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toBe('header');
  });

  it('yields tokens from LLM', async () => {
    const llm = createMockLLM();
    const store = createMockStore();
    const rag = createRagPipeline(llm, store, 'minimax/minimax-m2.5:free');

    const tokens: string[] = [];
    for await (const token of rag.generate('header', 'react', () => {})) {
      tokens.push(token);
    }
    expect(tokens).toEqual(['Here is ', 'your component']);
  });

  it('calls onSources callback with retrieved sources', async () => {
    const llm = createMockLLM();
    const store = createMockStore();
    const rag = createRagPipeline(llm, store, 'minimax/minimax-m2.5:free');
    let capturedSources: Array<{ id: string; score: number }> = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of rag.generate('header', 'react', (s) => { capturedSources = s; })) { /* consume */ }
    expect(capturedSources).toEqual([{ id: 'react-header-001', score: 0.12 }]);
  });

  it('invokes onSources before yielding any tokens', async () => {
    const llm = createMockLLM();
    const store = createMockStore();
    const rag = createRagPipeline(llm, store, 'minimax/minimax-m2.5:free');
    let sourcesReceivedBeforeFirstToken = false;
    let onSourcesCalled = false;

    const gen = rag.generate('header', 'react', () => { onSourcesCalled = true; });
    const first = await gen.next();
    sourcesReceivedBeforeFirstToken = onSourcesCalled;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of gen) { /* drain */ }

    expect(sourcesReceivedBeforeFirstToken).toBe(true);
    expect(first.done).toBe(false);
  });
});

// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createVectorStore, type ComponentRecord } from '../../src/services/vectordb';

const mockCollection = {
  upsert: vi.fn(),
  query: vi.fn(),
  count: vi.fn(),
};

const mockChromaClient = {
  getOrCreateCollection: vi.fn().mockResolvedValue(mockCollection),
};

vi.mock('chromadb', () => ({
  ChromaClient: vi.fn().mockImplementation(() => mockChromaClient),
}));

describe('VectorStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('creates or gets collection with correct name', async () => {
      const store = createVectorStore('http://localhost:8000', 'tuvix_components');
      await store.init();
      expect(mockChromaClient.getOrCreateCollection).toHaveBeenCalledWith({ name: 'tuvix_components' });
    });
  });

  describe('upsert', () => {
    it('upserts component records with embeddings', async () => {
      const store = createVectorStore('http://localhost:8000', 'tuvix_components');
      await store.init();

      const records: ComponentRecord[] = [{
        id: 'react-header-001',
        description: 'React header',
        framework: 'react',
        category: 'header',
        tags: ['header'],
        code: 'const Header = () => <h1>Hi</h1>;',
        dependencies: ['@tuvix.js/react'],
      }];
      const embeddings = [[0.1, 0.2, 0.3]];

      await store.upsert(records, embeddings);

      expect(mockCollection.upsert).toHaveBeenCalledWith({
        ids: ['react-header-001'],
        embeddings: [[0.1, 0.2, 0.3]],
        documents: ['React header'],
        metadatas: [{
          framework: 'react',
          category: 'header',
          tags: 'header',
          code: 'const Header = () => <h1>Hi</h1>;',
          dependencies: '@tuvix.js/react',
        }],
      });
    });
  });

  describe('query', () => {
    it('queries with embedding and returns results', async () => {
      mockCollection.count.mockResolvedValueOnce(10);
      mockCollection.query.mockResolvedValueOnce({
        ids: [['react-header-001']],
        distances: [[0.15]],
        metadatas: [[{ framework: 'react', category: 'header', tags: 'header', code: 'const Header = () => <h1>Hi</h1>;', dependencies: '@tuvix.js/react' }]],
        documents: [['React header']],
      });

      const store = createVectorStore('http://localhost:8000', 'tuvix_components');
      await store.init();

      const results = await store.query([0.1, 0.2, 0.3], 3);

      expect(mockCollection.query).toHaveBeenCalledWith({ queryEmbeddings: [[0.1, 0.2, 0.3]], nResults: 3 });
      expect(results).toEqual([{
        id: 'react-header-001',
        description: 'React header',
        framework: 'react',
        category: 'header',
        code: 'const Header = () => <h1>Hi</h1>;',
        score: 0.15,
      }]);
    });

    it('queries with framework filter', async () => {
      mockCollection.count.mockResolvedValueOnce(10);
      mockCollection.query.mockResolvedValueOnce({ ids: [[]], distances: [[]], metadatas: [[]], documents: [[]] });

      const store = createVectorStore('http://localhost:8000', 'tuvix_components');
      await store.init();

      await store.query([0.1, 0.2], 5, 'vue');

      expect(mockCollection.query).toHaveBeenCalledWith({
        queryEmbeddings: [[0.1, 0.2]],
        nResults: 5,
        where: { framework: 'vue' },
      });
    });
  });

  describe('count', () => {
    it('returns record count', async () => {
      mockCollection.count.mockResolvedValueOnce(42);
      const store = createVectorStore('http://localhost:8000', 'tuvix_components');
      await store.init();
      expect(await store.count()).toBe(42);
    });
  });
});

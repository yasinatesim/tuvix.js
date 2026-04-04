import { ChromaClient } from 'chromadb';

export interface ComponentRecord {
  id: string;
  description: string;
  framework: string;
  category: string;
  tags: string[];
  code: string;
  dependencies: string[];
}

export interface QueryResult {
  id: string;
  description: string;
  framework: string;
  category: string;
  code: string;
  score: number;
}

export interface VectorStore {
  init(): Promise<void>;
  upsert(records: ComponentRecord[], embeddings: number[][]): Promise<void>;
  query(embedding: number[], nResults: number, framework?: string): Promise<QueryResult[]>;
  count(): Promise<number>;
}

export function createVectorStore(chromaUrl: string, collectionName: string): VectorStore {
  const client = new ChromaClient({ path: chromaUrl });
  let collection: Awaited<ReturnType<typeof client.getOrCreateCollection>>;

  return {
    async init() {
      collection = await client.getOrCreateCollection({ name: collectionName });
    },

    async upsert(records: ComponentRecord[], embeddings: number[][]) {
      await collection.upsert({
        ids: records.map((r) => r.id),
        embeddings,
        documents: records.map((r) => r.description),
        metadatas: records.map((r) => ({
          framework: r.framework,
          category: r.category,
          tags: r.tags.join(','),
          code: r.code,
          dependencies: r.dependencies.join(','),
        })),
      });
    },

    async query(embedding: number[], nResults: number, framework?: string): Promise<QueryResult[]> {
      const queryParams: Parameters<typeof collection.query>[0] = {
        queryEmbeddings: [embedding],
        nResults,
      };

      if (framework) {
        queryParams.where = { framework };
      }

      const results = await collection.query(queryParams);

      return (results.ids[0] ?? []).map((id, i) => ({
        id,
        description: results.documents[0]?.[i] ?? '',
        framework: (results.metadatas[0]?.[i] as Record<string, string>)?.framework ?? '',
        category: (results.metadatas[0]?.[i] as Record<string, string>)?.category ?? '',
        code: (results.metadatas[0]?.[i] as Record<string, string>)?.code ?? '',
        score: results.distances?.[0]?.[i] ?? 0,
      }));
    },

    async count() {
      return collection.count();
    },
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaClient {
  embed(text: string): Promise<number[]>;
  chat(model: string, messages: ChatMessage[]): AsyncGenerator<string>;
  isModelAvailable(model: string): Promise<boolean>;
}

function fetchWithTimeout(url: string, options: RequestInit, ms = 30_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export function createOllamaClient(baseUrl: string, embedModel: string, timeoutMs = 30_000): OllamaClient {
  return {
    async embed(text: string): Promise<number[]> {
      const res = await fetchWithTimeout(`${baseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: embedModel, input: text }),
      }, timeoutMs);

      if (!res.ok) {
        throw new Error(`Ollama embedding failed (${res.status}): ${await res.text()}`);
      }

      const data = await res.json();
      const embedding = data.embeddings?.[0];
      if (!embedding) throw new Error('Ollama embed: unexpected response shape');
      return embedding;
    },

    async *chat(model: string, messages: ChatMessage[]): AsyncGenerator<string> {
      const res = await fetchWithTimeout(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: true }),
      }, timeoutMs);

      if (!res.ok) {
        throw new Error(`Ollama chat failed (${res.status}): ${await res.text()}`);
      }

      if (!res.body) throw new Error('Ollama chat: response body is null');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const parsed = JSON.parse(line);
          if (parsed.done) return;
          if (parsed.message?.content) {
            yield parsed.message.content;
          }
        }
      }
    },

    async isModelAvailable(model: string): Promise<boolean> {
      const res = await fetchWithTimeout(`${baseUrl}/api/tags`, {
        method: 'GET',
      });

      if (!res.ok) return false;

      const data = await res.json();
      return data.models.some((m: { name: string }) => m.name === model);
    },
  };
}

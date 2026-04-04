export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaClient {
  embed(text: string): Promise<number[]>;
  chat(model: string, messages: ChatMessage[]): AsyncGenerator<string>;
  isModelAvailable(model: string): Promise<boolean>;
}

export function createOllamaClient(baseUrl: string, embedModel: string): OllamaClient {
  return {
    async embed(text: string): Promise<number[]> {
      const res = await fetch(`${baseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: embedModel, input: text }),
      });

      if (!res.ok) {
        throw new Error(`Ollama embedding failed (${res.status}): ${await res.text()}`);
      }

      const data = await res.json();
      return data.embeddings[0];
    },

    async *chat(model: string, messages: ChatMessage[]): AsyncGenerator<string> {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: true }),
      });

      if (!res.ok) {
        throw new Error(`Ollama chat failed (${res.status}): ${await res.text()}`);
      }

      const reader = res.body!.getReader();
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
      const res = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) return false;

      const data = await res.json();
      return data.models.some((m: { name: string }) => m.name === model);
    },
  };
}

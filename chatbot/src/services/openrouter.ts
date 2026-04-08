export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMClient {
  embed(text: string): Promise<number[]>;
  chat(model: string, messages: ChatMessage[]): AsyncGenerator<string>;
}

const BASE_URL = 'https://openrouter.ai/api/v1';

function fetchWithTimeout(url: string, options: RequestInit, ms = 60_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export function createOpenRouterClient(apiKey: string, embedModel: string, timeoutMs = 60_000): LLMClient {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  return {
    async embed(text: string): Promise<number[]> {
      const res = await fetchWithTimeout(`${BASE_URL}/embeddings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: embedModel, input: text }),
      }, timeoutMs);

      if (!res.ok) {
        throw new Error(`OpenRouter embedding failed (${res.status}): ${await res.text()}`);
      }

      const data = await res.json();
      const embedding = data.data?.[0]?.embedding;
      if (!embedding) throw new Error('OpenRouter embed: unexpected response shape');
      return embedding;
    },

    async *chat(model: string, messages: ChatMessage[]): AsyncGenerator<string> {
      const res = await fetchWithTimeout(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages, stream: true }),
      }, timeoutMs);

      if (!res.ok) {
        throw new Error(`OpenRouter chat failed (${res.status}): ${await res.text()}`);
      }

      if (!res.body) throw new Error('OpenRouter chat: response body is null');
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
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') return;
          let parsed: { choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }> };
          try {
            parsed = JSON.parse(payload);
          } catch {
            continue;
          }
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        }
      }
    },
  };
}

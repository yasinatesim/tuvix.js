<script setup lang="ts">
import { ref } from 'vue';
import ChatSidebar from './ChatSidebar.vue';
import ChatMessages from './ChatMessages.vue';
import type { Message } from './ChatMessages.vue';
import ChatInput from './ChatInput.vue';

const props = defineProps<{
  apiUrl?: string;
}>();

const API_BASE_URL = props.apiUrl ?? 'http://localhost:3001';

const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
} as const;

const messages = ref<Message[]>([]);
const activeFramework = ref<string | null>(null);

const EXAMPLE_PROMPTS = [
  'React header with navigation: Home, Gallery, About, Blog, Contact',
  'Vue sidebar with collapsible menu',
  'Svelte login form with validation',
  'Angular dashboard layout',
];

async function handleSend(userMessage: string, framework: string) {
  activeFramework.value = framework;

  messages.value.push({ role: MESSAGE_ROLES.USER, content: userMessage });

  const botIndex = messages.value.length;
  messages.value.push({
    role: MESSAGE_ROLES.ASSISTANT,
    content: '',
    streaming: true,
  });

  try {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, framework }),
    });

    if (!res.ok || !res.body) {
      messages.value[botIndex].content =
        'Error: Could not connect to the chatbot server.';
      messages.value[botIndex].streaming = false;
      return;
    }

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
        const event = JSON.parse(line.slice(6));

        if (event.type === 'token') {
          messages.value[botIndex].content += event.content;
        } else if (event.type === 'sources') {
          messages.value[botIndex].sources = event.content;
        } else if (event.type === 'done') {
          messages.value[botIndex].streaming = false;
          saveConversation();
        }
      }
    }
  } catch {
    messages.value[botIndex].content =
      'Error: Failed to connect to chatbot server. Make sure it is running.';
    messages.value[botIndex].streaming = false;
  }
}

function saveConversation() {
  if (typeof window === 'undefined' || messages.value.length === 0) return;
  try {
    const history = JSON.parse(localStorage.getItem('chatbot-history') ?? '[]');
    const id = Date.now().toString();
    const title = messages.value[0]?.content.slice(0, 60) ?? 'Chat';
    history.unshift({ id, title, messages: messages.value });
    localStorage.setItem('chatbot-history', JSON.stringify(history.slice(0, 20)));
  } catch { /* ignore */ }
}

function loadConversation(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const history = JSON.parse(localStorage.getItem('chatbot-history') ?? '[]');
    const conv = history.find((c: { id: string }) => c.id === id);
    if (conv) messages.value = conv.messages;
  } catch { /* ignore */ }
}

function handleNewChat() {
  saveConversation();
  messages.value = [];
}

function sendExamplePrompt(prompt: string) {
  handleSend(prompt, activeFramework.value);
}
</script>

<template>
  <div :class="$style.chatbot">
    <ChatSidebar
      @new-chat="handleNewChat"
      @select-chat="loadConversation"
    />
    <div :class="$style.main">
      <template v-if="messages.length === 0">
        <div :class="$style.welcome">
          <div :class="$style.welcomeContent">
            <h1 :class="$style.welcomeTitle">
              <span>AI</span> Component Generator
            </h1>
            <p :class="$style.welcomeSubtitle">
              Describe what you want in natural language
            </p>
            <div :class="$style.chips">
              <button
                v-for="prompt in EXAMPLE_PROMPTS"
                :key="prompt"
                :class="$style.chip"
                @click="sendExamplePrompt(prompt)"
              >
                {{ prompt }}
              </button>
            </div>
            <p :class="$style.welcomeFooter">
              Powered by <a
                href="https://ollama.com"
                target="_blank"
                rel="noopener"
              >DeepSeek Coder</a> &middot; <a
                href="https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset"
                target="_blank"
                rel="noopener"
              >600 examples</a>
            </p>
          </div>
        </div>
      </template>
      <template v-else>
        <ChatMessages
          :messages="messages"
          :framework="activeFramework"
        />
      </template>

      <ChatInput @send="handleSend" />
    </div>
  </div>
</template>

<style module lang="scss">
@use './variables' as *;

.chatbot {
  display: flex;
  height: calc(100vh - #{$nav-h});
  background: $chat-bg;
  border-top: 1px solid $chat-border-subtle;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  position: relative;
}

// Welcome screen with subtle dot grid
.welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $sp-8 $sp-4;
  position: relative;
  overflow: hidden;

  // Subtle dot grid
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, var(--vp-c-divider) 1px, transparent 1px);
    background-size: 24px 24px;
    opacity: 0.4;
    pointer-events: none;
  }
}

.welcomeContent {
  position: relative; // above the grid
  text-align: center;
  max-width: 520px;
  width: 100%;
}

// "AI Component Generator" title — "AI" in brand color
.welcomeTitle {
  font-family: $font-mono;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: $chat-text;
  margin: 0 0 $sp-2;
  line-height: 1.2;

  // Style the span.accent inside it
  span { color: $chat-brand; }
}

.welcomeSubtitle {
  font-size: $text-sm;
  color: $chat-text-3;
  margin: 0 0 $sp-6;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  font-family: $font-mono;
}

// Chips in 2-column grid
.chips {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $sp-2;
  margin-bottom: $sp-5;
}

.chip {
  padding: $sp-3 $sp-4;
  border: 1px solid $chat-border;
  border-radius: $r-md;
  background: $chat-surface;
  color: $chat-text-2;
  font-size: $text-sm;
  font-family: $font-body;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s, background 0.12s;
  line-height: 1.4;

  &:hover {
    border-color: $chat-brand;
    color: $chat-text;
    background: $chat-brand-soft;
  }
}

.welcomeFooter {
  font-size: $text-xs;
  color: $chat-text-3;
  font-family: $font-mono;
  margin: 0;

  a {
    color: $chat-brand;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
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

interface ConversationEntry {
  id: string;
  title: string;
  messages: Message[];
}

const messages = ref<Message[]>([]);
const activeFramework = ref<string>('');
const conversationHistory = ref<ConversationEntry[]>([]);
// Track the id of the currently loaded/active conversation to avoid creating duplicates on save
const activeConversationId = ref<string | null>(null);

const EXAMPLE_PROMPTS = [
  'React header with navigation: Home, Gallery, About, Blog, Contact',
  'Vue sidebar with collapsible menu',
  'Svelte login form with validation',
  'Angular dashboard layout',
];

const FRAMEWORKS = ['react', 'vue', 'svelte', 'angular'] as const;

function detectFramework(text: string): string {
  const lower = text.toLowerCase();
  return FRAMEWORKS.find((fw) => lower.includes(fw)) ?? '';
}

onMounted(() => {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('chatbot-history');
    const parsed = JSON.parse(saved ?? '[]');
    if (Array.isArray(parsed)) conversationHistory.value = parsed;
  } catch { /* ignore */ }
});

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
        let event: { type: string; content?: unknown };
        try {
          event = JSON.parse(line.slice(6));
        } catch {
          continue;
        }

        if (event.type === 'token') {
          if (typeof event.content === 'string') {
            messages.value[botIndex].content += event.content;
          }
        } else if (event.type === 'sources') {
          if (Array.isArray(event.content)) {
            messages.value[botIndex].sources = event.content as Array<{ id: string; score: number }>;
          }
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
    const title = messages.value[0]?.content.slice(0, 60) ?? 'Chat';
    if (activeConversationId.value) {
      // Update existing conversation in-place rather than duplicating
      conversationHistory.value = conversationHistory.value.map((c) =>
        c.id === activeConversationId.value ? { ...c, title, messages: messages.value } : c,
      );
    } else {
      const id = Date.now().toString();
      activeConversationId.value = id;
      conversationHistory.value = [{ id, title, messages: messages.value }, ...conversationHistory.value].slice(0, 20);
    }
    localStorage.setItem('chatbot-history', JSON.stringify(conversationHistory.value));
  } catch { /* ignore */ }
}

function loadConversation(id: string) {
  const conv = conversationHistory.value.find((c) => c.id === id);
  if (conv) {
    messages.value = conv.messages;
    activeConversationId.value = id;
  }
}

function handleNewChat() {
  saveConversation();
  messages.value = [];
  activeConversationId.value = null;
}

function sendExamplePrompt(prompt: string) {
  handleSend(prompt, detectFramework(prompt));
}
</script>

<template>
  <div :class="$style.chatbot">
    <ChatSidebar
      :conversations="conversationHistory"
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
              >Phi3.5 Mini</a> &middot; <a
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

// Stagger fade-up animation
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

  // Radial glow behind content
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 50% at 50% 50%, var(--vp-c-brand-soft) 0%, transparent 70%);
    pointer-events: none;
    opacity: 0.6;
  }
}

.welcomeContent {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 540px;
  width: 100%;

  > * {
    animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  > *:nth-child(1) { animation-delay: 0.05s; }
  > *:nth-child(2) { animation-delay: 0.14s; }
  > *:nth-child(3) { animation-delay: 0.23s; }
  > *:nth-child(4) { animation-delay: 0.32s; }
}

// "AI Component Generator" title — "AI" in brand color
.welcomeTitle {
  font-family: $font-mono;
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: $chat-text;
  margin: 0 0 $sp-3;
  line-height: 1.1;

  span {
    background: linear-gradient(
      135deg,
      var(--vp-c-brand-1) 0%,
      var(--vp-c-brand-2, var(--vp-c-brand-1)) 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.welcomeSubtitle {
  font-size: $text-sm;
  color: $chat-text-3;
  margin: 0 0 $sp-6;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-family: $font-mono;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $sp-3;

  &::before,
  &::after {
    content: '';
    display: block;
    width: 28px;
    height: 1px;
    background: $chat-border;
  }
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
  transition:
    border-color 0.15s,
    color 0.15s,
    background 0.15s,
    transform 0.15s,
    box-shadow 0.15s;
  line-height: 1.4;

  &:hover {
    border-color: $chat-brand;
    color: $chat-text;
    background: $chat-brand-soft;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
}

.welcomeFooter {
  font-size: $text-xs;
  color: $chat-text-3;
  font-family: $font-mono;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $sp-2;
  flex-wrap: wrap;

  a {
    color: $chat-text-2;
    text-decoration: none;
    padding: 2px 10px;
    border: 1px solid $chat-border;
    border-radius: $r-pill;
    transition: color 0.12s, border-color 0.12s, background 0.12s;

    &:hover {
      color: $chat-brand;
      border-color: $chat-brand;
      background: $chat-brand-soft;
    }
  }
}
</style>

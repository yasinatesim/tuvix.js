<script setup lang="ts">
import { ref } from 'vue';
import ChatSidebar from './ChatSidebar.vue';
import ChatMessages from './ChatMessages.vue';
import type { Message } from './ChatMessages.vue';
import ChatInput from './ChatInput.vue';

const props = defineProps<{
  apiUrl?: string;
}>();

const baseUrl = props.apiUrl ?? 'http://localhost:3001';
const messages = ref<Message[]>([]);
const activeFramework = ref('react');

async function handleSend(userMessage: string, framework: string) {
  activeFramework.value = framework;

  // Add user message
  messages.value.push({ role: 'user', content: userMessage });

  // Add empty bot message (streaming)
  const botIndex = messages.value.length;
  messages.value.push({
    role: 'assistant',
    content: '',
    streaming: true,
  });

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
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
        }
      }
    }
  } catch {
    messages.value[botIndex].content =
      'Error: Failed to connect to chatbot server. Make sure it is running.';
    messages.value[botIndex].streaming = false;
  }
}

function handleNewChat() {
  messages.value = [];
}
</script>

<template>
  <div :class="$style.chatbot">
    <ChatSidebar
      @new-chat="handleNewChat"
      @select-chat="() => { /* TODO: load selected conversation from localStorage */ }"
    />
    <div :class="$style.main">
      <ChatMessages
        :messages="messages"
        :framework="activeFramework"
      />
      <ChatInput @send="handleSend" />
    </div>
  </div>
</template>

<style module lang="scss">
@use './variables' as *;

.chatbot {
  display: flex;
  height: calc(100vh - 64px); // account for VitePress nav
  overflow: hidden;
  background: $chat-bg;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-width: $chat-max-width;
  margin: 0 auto;
  width: 100%;
}
</style>

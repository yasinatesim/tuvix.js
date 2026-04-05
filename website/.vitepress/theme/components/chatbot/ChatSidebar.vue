<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface ConversationEntry {
  id: string;
  title: string;
  messages: Array<{ role: string; content: string }>;
}

const props = defineProps<{ activeId?: string }>();
const emit = defineEmits<{
  newChat: [];
  selectChat: [id: string];
}>();

const conversations = ref<ConversationEntry[]>([]);

onMounted(() => {
  try {
    const saved = localStorage.getItem('chatbot-history');
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) conversations.value = parsed;
  } catch {
    // ignore
  }
});
</script>

<template>
  <aside :class="$style.sidebar">
    <button
      :class="$style.newChat"
      @click="emit('newChat')"
    >
      + New Chat
    </button>
    <p :class="$style.label">
      HISTORY
    </p>
    <ul :class="$style.list">
      <li
        v-for="conv in conversations"
        :key="conv.id"
        :class="[$style.item, conv.id === props.activeId && $style.active]"
        @click="emit('selectChat', conv.id)"
      >
        {{ conv.title }}
      </li>
    </ul>
  </aside>
</template>

<style module lang="scss">
@use './variables' as *;

.sidebar {
  width: $sidebar-w;
  flex-shrink: 0;
  border-right: 1px solid $chat-border-subtle;
  background: $chat-bg;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.newChat {
  margin: $sp-3 $sp-3 $sp-2;
  padding: $sp-2 $sp-3;
  border: 1px solid $chat-border;
  border-radius: $r-md;
  background: transparent;
  color: $chat-text-2;
  font-size: $text-sm;
  font-family: $font-mono;
  cursor: pointer;
  text-align: left;
  letter-spacing: 0.02em;
  transition: all 0.1s;

  &:hover {
    color: $chat-brand;
    border-color: $chat-brand;
  }
}

.label {
  padding: $sp-2 $sp-3;
  font-size: $text-xs;
  font-family: $font-mono;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $chat-text-3;
  margin: 0;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.item {
  padding: $sp-2 $sp-3;
  font-size: $text-sm;
  color: $chat-text-2;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 0;
  transition: background 0.1s, color 0.1s;

  &:hover { background: $chat-surface; color: $chat-text; }
}

.active {
  background: $chat-brand-soft;
  color: $chat-brand;
}
</style>

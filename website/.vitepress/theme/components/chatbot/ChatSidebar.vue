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
  width: $chat-sidebar-width;
  flex-shrink: 0;
  border-right: 1px solid $chat-border;
  background: $chat-bg-alt;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.newChat {
  margin: $chat-spacing-md;
  padding: $chat-spacing-sm $chat-spacing-md;
  border: 1px solid $chat-border;
  border-radius: $chat-radius-sm;
  background: transparent;
  color: $chat-text;
  font-size: $chat-font-size-sm;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: $chat-bg-soft;
  }
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.item {
  padding: $chat-spacing-sm $chat-spacing-md;
  font-size: $chat-font-size-sm;
  color: $chat-text-secondary;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: $chat-bg-soft;
  }
}

.active {
  background: $chat-brand-soft;
  color: $chat-brand;
}
</style>

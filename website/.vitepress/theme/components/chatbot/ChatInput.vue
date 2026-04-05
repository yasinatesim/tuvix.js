<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  send: [message: string, framework: string];
}>();

const message = ref('');
const framework = ref('react');

const frameworks = ['react', 'vue', 'svelte', 'angular'] as const;

function handleSend() {
  const trimmed = message.value.trim();
  if (!trimmed) return;
  emit('send', trimmed, framework.value);
  message.value = '';
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}
</script>

<template>
  <div :class="$style.container">
    <select
      v-model="framework"
      :class="$style.select"
    >
      <option
        v-for="fw in frameworks"
        :key="fw"
        :value="fw"
      >
        {{ fw.charAt(0).toUpperCase() + fw.slice(1) }}
      </option>
    </select>
    <textarea
      v-model="message"
      :class="$style.textarea"
      placeholder="Describe the component you want..."
      rows="1"
      @keydown="handleKeydown"
    />
    <button
      :class="$style.send"
      :disabled="!message.trim()"
      @click="handleSend"
    >
      Send
    </button>
  </div>
</template>

<style module lang="scss">
@use './variables' as *;

.container {
  display: flex;
  align-items: flex-end;
  gap: $chat-spacing-sm;
  padding: $chat-spacing-md;
  border-top: 1px solid $chat-border;
  background: $chat-bg;
}

.select {
  flex-shrink: 0;
  height: $chat-input-height;
  padding: 0 $chat-spacing-sm;
  border: 1px solid $chat-border;
  border-radius: $chat-radius-sm;
  background: $chat-bg-soft;
  color: $chat-text;
  font-size: $chat-font-size-sm;
  cursor: pointer;
}

.textarea {
  flex: 1;
  resize: none;
  padding: $chat-spacing-sm $chat-spacing-md;
  border: 1px solid $chat-border;
  border-radius: $chat-radius-md;
  background: $chat-bg-soft;
  color: $chat-text;
  font-size: $chat-font-size-md;
  font-family: $chat-font-body;
  line-height: 1.5;
  min-height: $chat-input-height;
  max-height: 120px;
  overflow-y: auto;

  &:focus {
    outline: none;
    border-color: $chat-brand;
  }
}

.send {
  flex-shrink: 0;
  height: $chat-input-height;
  padding: 0 $chat-spacing-md;
  border: none;
  border-radius: $chat-radius-md;
  background: $chat-brand;
  color: white;
  font-size: $chat-font-size-md;
  cursor: pointer;
  transition: opacity 0.15s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>

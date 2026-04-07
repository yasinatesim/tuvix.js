<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  send: [message: string, framework: string];
}>();

const message = ref('');

const FRAMEWORK_KEYWORDS: Record<string, string> = {
  react: 'react',
  vue: 'vue',
  svelte: 'svelte',
  angular: 'angular',
};

function detectFramework(text: string): string {
  const lower = text.toLowerCase();
  for (const [keyword, fw] of Object.entries(FRAMEWORK_KEYWORDS)) {
    if (lower.includes(keyword)) return fw;
  }
  return ''; // no framework keyword found — backend will generate vanilla JS
}

function handleSend() {
  const trimmed = message.value.trim();
  if (!trimmed) return;
  emit('send', trimmed, detectFramework(trimmed));
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
    <div :class="$style.wrap">
      <textarea
        v-model="message"
        :class="$style.textarea"
        placeholder="Describe the component... e.g. 'vue sidebar with icons'"
        rows="1"
        @keydown="handleKeydown"
      />
      <button
        :class="$style.send"
        :disabled="!message.trim()"
        @click="handleSend"
      >
        ↵
      </button>
    </div>
    <p :class="$style.hint">
      mention react · vue · svelte · angular — or omit for plain JS
    </p>
  </div>
</template>

<style module lang="scss">
@use './variables' as *;

.container {
  flex-shrink: 0;
  padding: $sp-3 $sp-4 $sp-2;
  border-top: 1px solid $chat-border-subtle;
}

.wrap {
  display: flex;
  align-items: flex-end;
  gap: $sp-2;
  background: $chat-surface;
  border: 1px solid $chat-border;
  border-radius: $r-lg;
  padding: $sp-2 $sp-2 $sp-2 $sp-4;
  transition: border-color 0.12s;

  &:focus-within {
    border-color: $chat-brand;
  }
}

.textarea {
  flex: 1;
  resize: none;
  border: none;
  background: transparent;
  color: $chat-text;
  font-size: $text-md;
  font-family: $font-body;
  line-height: 1.5;
  min-height: 24px;
  max-height: 120px;
  overflow-y: auto;
  padding: 0;

  &:focus { outline: none; }
  &::placeholder { color: $chat-text-3; }
}

.send {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: $r-md;
  background: $chat-brand;
  color: #000;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled { opacity: 0.3; cursor: not-allowed; }
  &:not(:disabled):hover { opacity: 0.85; }
}

.hint {
  margin: $sp-1 0 0;
  font-size: $text-xs;
  font-family: $font-mono;
  color: $chat-text-3;
  text-align: center;
  letter-spacing: 0.03em;
}
</style>

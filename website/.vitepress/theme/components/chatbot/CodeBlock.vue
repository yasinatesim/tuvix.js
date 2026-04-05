<script lang="ts">
// Named export for testing — must be outside <script setup>
export function buildPlaygroundUrl(code: string, framework: string): string {
  const encoded = btoa(code);
  return `/playground?framework=${framework}&code=${encoded}`;
}
</script>

<script setup lang="ts">
import { ref, computed } from 'vue';
import hljs from 'highlight.js';

const props = defineProps<{
  code: string;
  language: string;
  framework: string;
}>();

const copied = ref(false);

const highlighted = computed(() => {
  if (typeof window === 'undefined') {
    return escapeHtml(props.code);
  }
  const lang =
    props.language === 'tsx' || props.language === 'jsx'
      ? 'javascript'
      : props.language || 'plaintext';
  return hljs.highlight(props.code, { language: lang, ignoreIllegals: true })
    .value;
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function copyCode() {
  if (typeof navigator !== 'undefined') {
    navigator.clipboard.writeText(props.code);
  }
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 1000);
}

function openInPlayground() {
  if (typeof window !== 'undefined') {
    window.location.href = buildPlaygroundUrl(props.code, props.framework);
  }
}
</script>

<template>
  <div :class="$style.codeblock">
    <div :class="$style.header">
      <span :class="$style.lang">{{ language }}</span>
      <div :class="$style.actions">
        <button
          :class="$style.btn"
          @click="copyCode"
        >
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
        <button
          :class="$style.btn"
          @click="openInPlayground"
        >
          Open in Playground
        </button>
      </div>
    </div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <pre :class="$style.pre"><code v-html="highlighted" /></pre>
  </div>
</template>

<style module lang="scss">
@use './variables' as *;

.codeblock {
  border-radius: $chat-radius-md;
  overflow: hidden;
  border: 1px solid $chat-border;
  margin: $chat-spacing-md 0;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $chat-spacing-xs $chat-spacing-md;
  background: $chat-bg-alt;
  border-bottom: 1px solid $chat-border;
}

.lang {
  font-size: $chat-font-size-sm;
  font-family: $chat-font-mono;
  color: $chat-text-muted;
}

.actions {
  display: flex;
  gap: $chat-spacing-sm;
}

.btn {
  font-size: $chat-font-size-sm;
  padding: 2px $chat-spacing-sm;
  border: 1px solid $chat-border;
  border-radius: $chat-radius-sm;
  background: transparent;
  color: $chat-text-secondary;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;

  &:hover {
    color: $chat-brand;
    border-color: $chat-brand;
  }
}

.pre {
  margin: 0;
  padding: $chat-spacing-md;
  overflow-x: auto;
  background: #0d1117;
  font-family: $chat-font-mono;
  font-size: $chat-font-size-sm;
  line-height: 1.6;
}
</style>

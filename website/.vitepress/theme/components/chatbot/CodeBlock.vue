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
      <span :class="$style.lang">{{ language || 'code' }}</span>
      <div :class="$style.actions">
        <button :class="$style.btn" @click="copyCode">
          {{ copied ? '✓ copied' : 'copy' }}
        </button>
        <button :class="[$style.btn, $style.btnAccent]" @click="openInPlayground">
          playground →
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
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: $r-md;
  overflow: hidden;
  margin: $sp-3 0;
  font-family: $font-mono;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $sp-2 $sp-3;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.lang {
  font-size: $text-xs;
  font-family: $font-mono;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: $chat-text-3;
}

.actions {
  display: flex;
  gap: $sp-1;
}

.btn {
  font-size: $text-xs;
  font-family: $font-mono;
  padding: 2px $sp-3;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: $r-sm;
  background: transparent;
  color: $chat-text-3;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: all 0.1s;

  &:hover {
    color: $chat-text;
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.btnAccent {
  color: $chat-brand;
  border-color: rgba(0, 229, 160, 0.2);

  &:hover {
    background: rgba(0, 229, 160, 0.06);
    border-color: $chat-brand;
  }
}

.pre {
  margin: 0;
  padding: $sp-4;
  background: $code-bg;
  overflow-x: auto;
  font-size: $text-sm;
  line-height: 1.6;

  code { font-family: $font-mono; }
}
</style>

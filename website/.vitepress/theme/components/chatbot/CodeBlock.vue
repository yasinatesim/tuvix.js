<script lang="ts">
// Named export for testing — must be outside <script setup>
function utf8ToB64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    ),
  );
}

export function buildPlaygroundUrl(code: string, framework: string, pairedCss?: string): string {
  const fw = framework ? `&framework=${framework}` : '';
  const css = pairedCss ? `&css=${encodeURIComponent(utf8ToB64(pairedCss))}` : '';
  return `/playground?code=${encodeURIComponent(utf8ToB64(code))}${fw}${css}`;
}
</script>

<script setup lang="ts">
import { ref, computed } from 'vue';
import hljs from 'highlight.js';
import { escapeHtml } from './utils';

const JS_LANGS = new Set(['js', 'jsx', 'ts', 'tsx', 'javascript', 'typescript']);

const props = defineProps<{
  code: string;
  language: string;
  framework: string;
  pairedCss?: string;
}>();

const showPlayground = computed(() => JS_LANGS.has(props.language));

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

function copyCode() {
  if (typeof navigator === 'undefined') return;
  navigator.clipboard.writeText(props.code).then(() => {
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 1000);
  }).catch(() => {
    // Clipboard permission denied — silently ignore, no false-positive feedback
  });
}

function openInPlayground() {
  if (typeof window !== 'undefined') {
    window.location.href = buildPlaygroundUrl(props.code, props.framework, props.pairedCss);
  }
}
</script>

<template>
  <div :class="$style.codeblock">
    <div :class="$style.header">
      <span :class="$style.lang">{{ language || 'code' }}</span>
      <div :class="$style.actions">
        <button
          :class="$style.btn"
          @click="copyCode"
        >
          {{ copied ? '✓ copied' : 'copy' }}
        </button>
        <button
          v-if="showPlayground"
          :class="[$style.btn, $style.btnAccent]"
          @click="openInPlayground"
        >
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

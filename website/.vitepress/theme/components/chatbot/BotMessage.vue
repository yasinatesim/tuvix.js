<script lang="ts">
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export interface CodeBlockData {
  language: string;
  code: string;
}

export function extractCodeBlocks(md: string): CodeBlockData[] {
  const blocks: CodeBlockData[] = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(md)) !== null) {
    blocks.push({ language: match[1] ?? 'plaintext', code: match[2].trimEnd() });
  }
  return blocks;
}

export function parseMarkdownContent(md: string): string {
  // Remove code blocks before parsing (they'll be rendered by CodeBlock component)
  const withoutCode = md.replace(/```[\s\S]*?```/g, '');
  const raw = marked.parse(withoutCode, { async: false }) as string;
  // DOMPurify only runs in browser; return raw in SSR context
  if (typeof window === 'undefined') return raw;
  return DOMPurify.sanitize(raw);
}
</script>

<script setup lang="ts">
import { computed } from 'vue';
import CodeBlock from './CodeBlock.vue';
import TypingIndicator from './TypingIndicator.vue';

const props = defineProps<{
  content: string;
  sources?: Array<{ id: string; score: number }>;
  streaming?: boolean;
  framework: string;
}>();

const codeBlocks = computed(() => extractCodeBlocks(props.content));
const htmlContent = computed(() => parseMarkdownContent(props.content));
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.avatar">
      🤖
    </div>
    <div :class="$style.body">
      <TypingIndicator v-if="streaming && !content" />
      <template v-else>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          :class="$style.markdown"
          v-html="htmlContent"
        />
        <CodeBlock
          v-for="(block, i) in codeBlocks"
          :key="i"
          :code="block.code"
          :language="block.language"
          :framework="framework"
        />
        <div
          v-if="sources && sources.length"
          :class="$style.sources"
        >
          <span :class="$style.sourcesLabel">Sources:</span>
          <span
            v-for="src in sources"
            :key="src.id"
            :class="$style.source"
          >{{
            src.id
          }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style module lang="scss">
@use './variables' as *;

.container {
  display: flex;
  align-items: flex-start;
  gap: $chat-spacing-md;
  padding: $chat-spacing-xs $chat-spacing-md;
}

.avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: $chat-bg-soft;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.body {
  flex: 1;
  min-width: 0;
}

.markdown {
  font-size: $chat-font-size-md;
  line-height: 1.6;
  color: $chat-text;

  :deep(p) {
    margin: 0 0 $chat-spacing-sm;
  }

  :deep(strong) {
    font-weight: 600;
  }

  :deep(code) {
    font-family: $chat-font-mono;
    font-size: $chat-font-size-sm;
    background: $chat-bg-soft;
    padding: 1px 4px;
    border-radius: $chat-radius-sm;
  }
}

.sources {
  margin-top: $chat-spacing-sm;
  display: flex;
  align-items: center;
  gap: $chat-spacing-xs;
  flex-wrap: wrap;
}

.sourcesLabel {
  font-size: $chat-font-size-sm;
  color: $chat-text-muted;
}

.source {
  font-size: $chat-font-size-sm;
  color: $chat-brand;
  background: $chat-brand-soft;
  padding: 1px $chat-spacing-xs;
  border-radius: $chat-radius-sm;
}
</style>

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

// Only extract/render code blocks after streaming is done — prevents duplicate display
const codeBlocks = computed(() =>
  props.streaming ? [] : extractCodeBlocks(props.content),
);

// During streaming show raw content; after done show parsed markdown without code blocks
const htmlContent = computed(() => {
  if (props.streaming) {
    // Show raw text with minimal escaping during streaming
    const safe = props.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre style="white-space:pre;overflow-x:auto;word-break:normal;font-family:var(--vp-font-family-mono);font-size:13px;line-height:1.6;background:#0d1117;padding:16px;border-radius:6px;margin:0;color:#e8eaed">${safe}</pre>`;
  }
  return parseMarkdownContent(props.content);
});
</script>

<template>
  <div :class="$style.container">
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
  padding: $sp-2 $sp-4;
}

.body {
  border-left: 2px solid $chat-brand;
  padding-left: $sp-4;
  max-width: 800px;
}

.markdown {
  font-size: $text-md;
  line-height: 1.65;
  color: $chat-text;

  :deep(p) { margin: 0 0 $sp-3; &:last-child { margin-bottom: 0; } }
  :deep(strong) { color: $chat-text; font-weight: 600; }
  :deep(pre) { margin: 0; font-family: $font-mono; }
  :deep(code) {
    font-family: $font-mono;
    font-size: $text-xs;
    background: rgba(0, 229, 160, 0.06);
    color: $chat-brand;
    padding: 1px 5px;
    border-radius: $r-sm;
  }
}

.sources {
  display: flex;
  align-items: center;
  gap: $sp-2;
  flex-wrap: wrap;
  margin-top: $sp-3;
  padding-top: $sp-3;
  border-top: 1px solid $chat-border-subtle;
}

.sourcesLabel {
  font-size: $text-xs;
  font-family: $font-mono;
  color: $chat-text-3;
}

.source {
  font-size: $text-xs;
  font-family: $font-mono;
  color: $chat-text-3;
  background: $chat-surface;
  border: 1px solid $chat-border;
  padding: 1px $sp-2;
  border-radius: $r-sm;
}
</style>

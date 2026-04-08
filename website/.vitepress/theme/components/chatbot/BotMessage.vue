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
import hljs from 'highlight.js';
import CodeBlock from './CodeBlock.vue';
import TypingIndicator from './TypingIndicator.vue';
import { escapeHtml } from './utils';

const props = defineProps<{
  content: string;
  sources?: Array<{ id: string; score: number }>;
  streaming?: boolean;
  framework: string;
}>();

// Only extract/render code blocks after streaming is done — prevents duplicate display
const CODE_PATTERN = /import\s+[\w{*]|function\s+\w+|const\s+\w+\s*=|<\w[\w.]*[\s/>]/;

const codeBlocks = computed(() => {
  if (props.streaming) return [];
  const blocks = extractCodeBlocks(props.content);
  if (blocks.length > 0) return blocks;
  // Fallback: model output has no fences but looks like code
  if (CODE_PATTERN.test(props.content)) {
    return [{ language: props.framework || 'javascript', code: props.content.trim() }];
  }
  return [];
});

const PRE_STYLE =
  'white-space:pre;overflow-x:auto;word-break:normal;font-family:var(--vp-font-family-mono);font-size:13px;line-height:1.6;background:#0d1117;padding:16px;border-radius:6px;margin:0;color:#e8eaed';
const BLOCK_WRAP = 'border:1px solid rgba(255,255,255,0.08);border-radius:6px;overflow:hidden;margin:8px 0';
const BLOCK_HDR  = 'padding:4px 12px;background:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06);font-family:var(--vp-font-family-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--vp-c-text-3)';

function renderHighlighted(rawLang: string, code: string): string {
  const lang = rawLang === 'tsx' || rawLang === 'jsx' ? 'javascript' : rawLang;
  try {
    if (lang) {
      return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    }
    return hljs.highlightAuto(code).value;
  } catch {
    return escapeHtml(code);
  }
}

const FENCE_OPEN_RE = /^```(\w*)\n?/;

const htmlContent = computed(() => {
  if (props.streaming) {
    // If content starts with a code fence (possibly still open/unclosed during streaming),
    // strip the fence line and render the raw code directly — avoids marked.lexer treating
    // an unclosed fence as plain paragraph text.
    const fenceMatch = props.content.match(FENCE_OPEN_RE);
    if (fenceMatch) {
      const lang = fenceMatch[1] || props.framework || '';
      const code = props.content.slice(fenceMatch[0].length).replace(/```\s*$/, '');
      const raw = `<div style="${BLOCK_WRAP}"><div style="${BLOCK_HDR}">${lang || 'code'}</div><pre class="hljs" style="${PRE_STYLE}"><code>${renderHighlighted(lang, code)}</code></pre></div>`;
      return typeof window !== 'undefined' ? DOMPurify.sanitize(raw) : raw;
    }

    // No fence — try lexer for mixed markdown responses
    const tokens = marked.lexer(props.content);
    let html = '';
    for (const token of tokens) {
      if (token.type === 'code') {
        const lang = (token as { lang?: string; text: string }).lang || '';
        const text = (token as { text: string }).text;
        html += `<div style="${BLOCK_WRAP}"><div style="${BLOCK_HDR}">${lang || 'code'}</div><pre class="hljs" style="${PRE_STYLE}"><code>${renderHighlighted(lang, text)}</code></pre></div>`;
      } else if (token.type === 'paragraph' || token.type === 'text') {
        const text = escapeHtml((token as { text: string }).text ?? '');
        if (text.trim()) html += `<p style="margin:4px 0;font-size:13px;line-height:1.6;color:var(--vp-c-text-2)">${text}</p>`;
      }
    }
    // If still nothing rendered, show raw content as code (fence-less model output)
    const raw = html || `<div style="${BLOCK_WRAP}"><pre class="hljs" style="${PRE_STYLE}"><code>${renderHighlighted(props.framework || '', props.content)}</code></pre></div>`;
    return typeof window !== 'undefined' ? DOMPurify.sanitize(raw) : raw;
  }
  return parseMarkdownContent(props.content);
});
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.body">
      <TypingIndicator v-if="streaming && !content" />
      <template v-else>
        <!-- eslint-disable vue/no-v-html, vue/max-attributes-per-line -->
        <div :class="$style.markdown" v-html="htmlContent" />
        <!-- eslint-enable vue/no-v-html, vue/max-attributes-per-line -->
        <CodeBlock
          v-for="(block, i) in codeBlocks"
          :key="i"
          :code="block.code"
          :language="block.language"
          :framework="framework"
          :paired-css="block.language !== 'css' && codeBlocks[i - 1]?.language === 'css' ? codeBlocks[i - 1].code : undefined"
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

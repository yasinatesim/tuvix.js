<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import UserMessage from './UserMessage.vue';
import BotMessage from './BotMessage.vue';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ id: string; score: number }>;
  streaming?: boolean;
}

const props = defineProps<{
  messages: Message[];
  framework: string;
}>();

const bottomRef = ref<HTMLElement | null>(null);

// Track last message content to scroll as tokens stream in
const lastContent = computed(() => {
  const last = props.messages[props.messages.length - 1];
  return last ? `${props.messages.length}:${last.content.length}` : '';
});

watch(lastContent, async () => {
  await nextTick();
  bottomRef.value?.scrollIntoView({ behavior: 'smooth' });
});
</script>

<template>
  <div :class="$style.messages">
    <template
      v-for="(msg, i) in messages"
      :key="i"
    >
      <UserMessage
        v-if="msg.role === 'user'"
        :content="msg.content"
      />
      <BotMessage
        v-else
        :content="msg.content"
        :sources="msg.sources"
        :streaming="msg.streaming"
        :framework="framework"
      />
    </template>
    <div ref="bottomRef" />
  </div>
</template>

<style module lang="scss">
@use './variables' as *;

.messages {
  flex: 1;
  overflow-y: auto;
  padding: $sp-4 0;
  display: flex;
  flex-direction: column;
  gap: $sp-2;
}
</style>

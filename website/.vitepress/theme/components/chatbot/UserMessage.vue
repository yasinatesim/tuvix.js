<script setup lang="ts">
defineProps<{ content: string }>();
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.bubble">
      {{ content }}
    </div>
  </div>
</template>

<style module lang="scss">
@use './variables' as *;

.container {
  display: flex;
  justify-content: flex-end;
  padding: $chat-spacing-xs $chat-spacing-md;
}

.bubble {
  max-width: 70%;
  padding: $chat-spacing-sm $chat-spacing-md;
  border-radius: $chat-radius-lg $chat-radius-lg $chat-radius-sm $chat-radius-lg;
  background: $chat-user-bubble;
  color: $chat-text;
  font-size: $chat-font-size-md;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

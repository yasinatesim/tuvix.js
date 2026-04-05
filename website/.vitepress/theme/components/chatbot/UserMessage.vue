<script setup lang="ts">
defineProps<{ content: string }>();
</script>

<template>
  <div :class="$style.container">
    <p :class="$style.text">{{ content }}</p>
  </div>
</template>

<style module lang="scss">
@use './variables' as *;

.container {
  display: flex;
  justify-content: flex-end;
  padding: $sp-2 $sp-4;
}

.text {
  max-width: 70%;
  font-size: $text-md;
  line-height: 1.5;
  color: $chat-text;
  background: $chat-surface;
  border: 1px solid $chat-border;
  border-radius: $r-lg $r-lg $r-sm $r-lg;
  padding: $sp-3 $sp-4;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

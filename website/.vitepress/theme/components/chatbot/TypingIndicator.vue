<template>
  <div :class="$style.typing">
    <span :class="$style.dot" />
    <span :class="$style.dot" />
    <span :class="$style.dot" />
  </div>
</template>

<style module lang="scss">
@use './variables' as *;

.typing {
  display: flex;
  align-items: center;
  gap: $chat-spacing-xs;
  padding: $chat-spacing-sm $chat-spacing-md;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $chat-text-muted;
  animation: bounce 1.2s infinite;

  &:nth-child(2) {
    animation-delay: 0.2s;
  }

  &:nth-child(3) {
    animation-delay: 0.4s;
  }
}

@keyframes bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }

  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}
</style>

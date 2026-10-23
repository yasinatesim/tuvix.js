<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import OrbitIcon from './OrbitIcon.vue';

const props = withDefaults(
  defineProps<{
    text: string;
    label: string;
    copiedLabel: string;
    /** Show the label next to the icon instead of only in `aria-label`. */
    showLabel?: boolean;
  }>(),
  { showLabel: false }
);

const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

async function copy() {
  try {
    await navigator.clipboard.writeText(props.text);
  } catch {
    // Clipboard access denied or unavailable (insecure context): leave state unchanged.
    return;
  }
  copied.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => {
    copied.value = false;
  }, 2000);
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <button
    type="button"
    :class="[$style.button, showLabel && $style.labelled]"
    :aria-label="showLabel ? undefined : label"
    :data-copied="copied || undefined"
    @click="copy"
  >
    <OrbitIcon :name="copied ? 'check' : 'copy'" :size="15" />
    <span v-if="showLabel">{{ copied ? copiedLabel : label }}</span>
    <span :class="$style.status" role="status">{{
      copied ? copiedLabel : ''
    }}</span>
  </button>
</template>

<style module lang="scss">
@use '../../styles/tokens' as *;

.button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 32px;
  min-height: 32px;
  justify-content: center;
  padding: 0 6px;
  border: 0;
  border-radius: $radius-sm;
  background: transparent;
  color: var(--orbit-text-3);
  cursor: pointer;
  transition:
    color 0.2s,
    background-color 0.2s;
  @include focus-ring(1px);

  &:hover {
    color: var(--orbit-accent-text);
    background: var(--orbit-accent-soft);
  }

  &[data-copied] {
    color: var(--orbit-accent-text);
  }
}

.labelled {
  @include mono-label;
  padding: 0 8px;
}

.status {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>

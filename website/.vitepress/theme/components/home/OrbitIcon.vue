<script setup lang="ts">
import { computed } from 'vue';
import { ICONS } from './icons';

const props = withDefaults(defineProps<{ name: string; size?: number }>(), {
  size: 18,
});

const paths = computed(() => ICONS[props.name]);
</script>

<template>
  <svg
    v-if="paths"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="d in paths" :key="d" :d="d" />
  </svg>
  <span v-else aria-hidden="true">{{ name }}</span>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
  title: string;
  description: string;
  icon?: string;
  npm?: string;
  github?: string;
}>();
</script>

<template>
  <div class="pkg-header">
    <div class="pkg-header-icon">{{ icon ?? '📦' }}</div>
    <div class="pkg-header-info">
      <div class="pkg-header-name">{{ name }}</div>
      <div class="pkg-header-title">{{ title }}</div>
      <div class="pkg-header-desc">{{ description }}</div>
      <div class="pkg-header-links">
        <a
          v-if="npm"
          :href="`https://www.npmjs.com/package/${name}`"
          class="pkg-header-link"
          target="_blank"
          rel="noopener"
        >
          npm ↗
        </a>
        <a
          :href="`https://github.com/yasinatesim/tuvix.js/tree/master/packages/${github ?? name.replace('@tuvix.js/', '')}`"
          class="pkg-header-link"
          target="_blank"
          rel="noopener"
        >
          GitHub ↗
        </a>
        <a
          :href="`https://www.npmjs.com/package/${name}`"
          class="pkg-header-link"
          target="_blank"
          rel="noopener"
        >
          <img
            :src="`https://img.shields.io/npm/v/${name}?style=flat&colorA=080c10&colorB=00e5a0`"
            :alt="`${name} version`"
            style="height: 18px; border-radius: 3px"
          />
        </a>
      </div>
    </div>
  </div>
</template>

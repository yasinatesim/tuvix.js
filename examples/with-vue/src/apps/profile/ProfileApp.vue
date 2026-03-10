<script setup lang="ts">
import { useTuvixProps } from '@tuvix.js/vue';

const props = useTuvixProps<{ theme: string }>();
</script>

<template>
  <div class="profile-card">
    <h2>👤 Profile App</h2>
    <p>Both this and the Home app share the same Vue 3 global dependency provided by Vite.</p>
    <div class="prop-badge">
      Theme prop: {{ props.theme || 'default' }}
    </div>
  </div>
</template>

<style scoped>
.profile-card {
  padding: 24px;
  background: #222831;
  border-radius: 12px;
}
h2 { margin: 0 0 16px; color: #f2a365; }
p { color: #aaa; margin-bottom: 16px; font-size: 14px; }
.prop-badge {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(255,255,255,0.1);
  border-radius: 6px;
  font-size: 14px;
}
</style>

<script setup lang="ts">
import { useTuvixProps } from '@tuvix.js/vue';

// Read props passed from the Tuvix shell
const props = useTuvixProps<{ name: string }>();
</script>

<template>
  <div class="home-card">
    <h2>🏠 Home App</h2>
    <p>This is a Vue 3 Micro App mounted via <code>@tuvix.js/vue</code>.</p>
    <div v-if="props.name" class="prop-badge">
      Hello, {{ props.name }} (prop received from shell)
    </div>
  </div>
</template>

<style scoped>
.home-card {
  padding: 24px;
  background: #30475e;
  border-radius: 12px;
}
h2 { margin: 0 0 16px; color: #f05454; }
p { color: #e0e0e0; margin-bottom: 16px; font-size: 14px; }
.prop-badge {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(0,0,0,0.3);
  border-radius: 6px;
  font-size: 14px;
  color: #a7f3d0;
}
</style>

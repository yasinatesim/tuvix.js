<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  tabs: { label: string; lang: string; code: string }[];
}>();

const active = ref(0);
</script>

<template>
  <div class="code-example">
    <div class="code-example-tabs">
      <button
        v-for="(tab, i) in props.tabs"
        :key="tab.label"
        class="code-example-tab"
        :class="{ active: active === i }"
        @click="active = i"
      >
        {{ tab.label }}
      </button>
    </div>
    <div
      v-for="(tab, i) in props.tabs"
      :key="tab.label"
    >
      <div v-show="active === i">
        <div :class="`language-${tab.lang}`">
          <pre><code>{{ tab.code }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

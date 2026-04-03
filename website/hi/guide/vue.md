# Vue के साथ

`@tuvix.js/vue` Tuvix.js के लिए Vue 3 बाइंडिंग प्रदान करता है।

## इंस्टॉलेशन

```bash
npm install @tuvix.js/vue vue
```

## createMicroApp

```ts
// src/main.ts
import { createMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export const app = createMicroApp(App);
```

`createMicroApp` एक Vue ऐप इंस्टेंस बनाता है, शेल props को कंपोनेंट props के रूप में पास करता है, और अनमाउंट पर इंस्टेंस को नष्ट करता है।

## Props

```vue
<!-- App.vue -->
<script setup lang="ts">
defineProps<{
  userId: string;
  theme: 'light' | 'dark';
}>();
</script>

<template>
  <div :class="`theme-${theme}`">User: {{ userId }}</div>
</template>
```

## useMicroApp कंपोज़ेबल

```vue
<script setup lang="ts">
import { useMicroApp } from '@tuvix.js/vue';

const { props, name } = useMicroApp();
</script>
```

## useTuvixEvent कंपोज़ेबल

कंपोनेंट अनमाउंट पर स्वचालित क्लीनअप के साथ Event Bus इवेंट्स की सदस्यता लें:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixEvent } from '@tuvix.js/vue';

const count = ref(0);

useTuvixEvent('cart:updated', ({ itemCount }) => {
  count.value = itemCount;
});
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>
```

## पूर्ण उदाहरण

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixEvent } from '@tuvix.js/vue';

const props = defineProps<{ apiUrl: string }>();
const theme = ref<'light' | 'dark'>('dark');

useTuvixEvent('theme:changed', ({ theme: t }) => {
  theme.value = t;
});
</script>

<template>
  <div :class="`app theme-${theme}`">
    <h1>My Micro App</h1>
    <p>API: {{ props.apiUrl }}</p>
  </div>
</template>
```

```ts
// src/main.ts
import { createMicroApp } from '@tuvix.js/vue';
import App from './App.vue';
export const app = createMicroApp(App);
```

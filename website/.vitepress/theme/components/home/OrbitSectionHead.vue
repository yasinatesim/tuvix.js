<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string;
    eyebrow?: string;
    title?: string;
    lead?: string;
    align?: 'center' | 'split';
  }>(),
  { eyebrow: undefined, title: undefined, lead: undefined, align: 'center' }
);
</script>

<template>
  <div
    v-if="eyebrow || title || lead"
    :class="[$style.head, align === 'split' ? $style.split : $style.center]"
  >
    <div>
      <p v-if="eyebrow" :class="$style.eyebrow">
        {{ eyebrow }}
      </p>
      <h2 v-if="title" :id="id" :class="$style.title">
        {{ title }}
      </h2>
    </div>
    <p v-if="lead" :class="$style.lead">
      {{ lead }}
    </p>
  </div>
</template>

<style module lang="scss">
@use '../../styles/tokens' as *;

.head {
  margin-bottom: 40px;

  @include up($bp-md) {
    margin-bottom: 48px;
  }
}

.center {
  max-width: 680px;
  margin-inline: auto;
  text-align: center;
}

.split {
  display: flex;
  flex-direction: column;
  gap: 12px;

  @include up($bp-md) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: 48px;

    .lead {
      max-width: 400px;
      margin: 0;
    }
  }
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--orbit-accent-text);
  @include mono-label;
  font-weight: 600;
  text-transform: uppercase;
}

.title {
  @include section-heading;
}

.lead {
  margin: 14px 0 0;
  font-size: 16px;
  line-height: 1.65;
  color: var(--orbit-text-2);
}
</style>

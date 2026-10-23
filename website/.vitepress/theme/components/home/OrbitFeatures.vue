<script setup lang="ts">
import { withBase } from 'vitepress';
import OrbitIcon from './OrbitIcon.vue';
import OrbitSectionHead from './OrbitSectionHead.vue';
import { isExternal, type HomeFeature, type HomeSection } from './model';

defineProps<{ section: HomeSection<HomeFeature> }>();
</script>

<template>
  <section :class="$style.section" aria-labelledby="orbit-features-title">
    <div :class="$style.inner">
      <OrbitSectionHead
        id="orbit-features-title"
        :title="section.title"
        :lead="section.lead"
      />
      <ul :class="$style.grid">
        <li
          v-for="feature in section.items"
          :key="feature.title"
          :class="$style.card"
        >
          <span v-if="feature.icon" :class="$style.icon">
            <OrbitIcon :name="feature.icon" :size="20" />
          </span>
          <h3 :class="$style.title">
            {{ feature.title }}
          </h3>
          <p :class="$style.details">
            {{ feature.details }}
          </p>
          <a
            v-if="feature.link"
            :href="
              isExternal(feature.link) ? feature.link : withBase(feature.link)
            "
            :class="$style.link"
          >
            {{ feature.linkText ?? feature.link }}
            <OrbitIcon name="arrow-right" :size="14" />
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style module lang="scss">
@use '../../styles/tokens' as *;

.section {
  padding: 72px 0;
  border-top: 1px solid var(--orbit-border);

  @include up($bp-md) {
    padding: 96px 0;
  }
}

.inner {
  @include container;
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;

  @include up($bp-sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include up($bp-lg) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
  }
}

.card {
  @include card;
  display: flex;
  flex-direction: column;
  padding: 24px;
  transition:
    border-color 0.2s,
    transform 0.2s $ease;

  &:hover {
    border-color: var(--orbit-accent-line);
    transform: translateY(-3px);
  }

  &:hover .icon {
    box-shadow: 0 0 16px var(--orbit-glow);
  }
}

.icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-bottom: 20px;
  border: 1px solid var(--orbit-accent-line);
  border-radius: $radius-md;
  background: var(--orbit-accent-soft);
  color: var(--orbit-accent-text);
  font-size: 20px;
  transition: box-shadow 0.2s;
}

.title {
  margin: 0 0 8px;
  font-family: $font-heading;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.01em;
  color: var(--orbit-text-1);
}

.details {
  flex: 1;
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--orbit-text-2);
}

.link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  margin-top: 20px;
  padding-top: 12px;
  color: var(--orbit-accent-text);
  text-decoration: none;
  @include mono-label;
  @include focus-ring(2px);

  svg {
    transition: transform 0.2s $ease;
  }

  &:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  &:hover svg {
    transform: translateX(3px);
  }
}
</style>

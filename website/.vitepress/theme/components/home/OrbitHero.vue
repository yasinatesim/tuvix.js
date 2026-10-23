<script setup lang="ts">
import { withBase } from 'vitepress';
import CopyButton from './CopyButton.vue';
import OrbitIcon from './OrbitIcon.vue';
import { isExternal, type HomeHero } from './model';

defineProps<{ hero: HomeHero }>();

const href = (link: string) => (isExternal(link) ? link : withBase(link));
</script>

<template>
  <header :class="$style.hero">
    <div :class="$style.rings" aria-hidden="true">
      <span :class="[$style.ring, $style.ringInner]" />
      <span :class="[$style.ring, $style.ringDashed]" />
      <span :class="[$style.ring, $style.ringOuter]" />
    </div>

    <div :class="$style.inner">
      <!-- Logo slot: swapping /logo.svg updates this image and the nav logo. -->
      <div :class="$style.logo">
        <slot name="logo">
          <img
            :src="withBase(hero.logo.src)"
            :alt="hero.logo.alt"
            width="64"
            height="64"
          />
        </slot>
      </div>

      <p v-if="hero.badge" :class="$style.badge">
        <OrbitIcon name="bolt" :size="13" />
        <span>{{ hero.badge }}</span>
      </p>

      <h1 :class="$style.title">
        {{ hero.title }}
        <span v-if="hero.accent" :class="$style.accent">{{ hero.accent }}</span>
      </h1>

      <p v-if="hero.tagline" :class="$style.tagline">
        {{ hero.tagline }}
      </p>

      <div v-if="hero.actions.length" :class="$style.actions">
        <a
          v-for="action in hero.actions"
          :key="action.link"
          :href="href(action.link)"
          :class="[
            $style.action,
            action.theme === 'brand' ? $style.brand : $style.alt,
          ]"
          :target="isExternal(action.link) ? '_blank' : undefined"
          :rel="isExternal(action.link) ? 'noreferrer' : undefined"
        >
          <span>{{ action.text }}</span>
          <OrbitIcon
            :name="isExternal(action.link) ? 'external' : 'arrow-right'"
            :size="17"
          />
        </a>
      </div>

      <div :class="$style.install">
        <span :class="$style.prompt" aria-hidden="true">$</span>
        <code>{{ hero.install.command }}</code>
        <CopyButton
          :text="hero.install.command"
          :label="hero.install.copyLabel"
          :copied-label="hero.install.copiedLabel"
        />
      </div>
    </div>
  </header>
</template>

<style module lang="scss">
@use '../../styles/tokens' as *;

.hero {
  position: relative;
  padding: 48px 0 56px;
  overflow: hidden;

  @include up($bp-md) {
    padding: 72px 0 72px;
  }
}

.rings {
  position: absolute;
  top: 46%;
  left: 50%;
  width: 0;
  height: 0;
  pointer-events: none;
}

.ring {
  position: absolute;
  top: 0;
  left: 0;
  border: 1px solid var(--orbit-ring);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.ringInner {
  width: 320px;
  height: 320px;
}

.ringDashed {
  width: 540px;
  height: 540px;
  border: 1px dashed var(--orbit-ring-dashed);
  animation: orbit-spin 120s linear infinite;
}

.ringOuter {
  width: 760px;
  height: 760px;
}

@keyframes orbit-spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.inner {
  @include container;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.logo {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin-bottom: 24px;
  border-radius: 16px;
  box-shadow: 0 0 32px var(--orbit-glow);

  img {
    width: 64px;
    height: 64px;
    border-radius: 16px;
  }
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  margin: 0 0 24px;
  padding: 5px 14px;
  border: 1px solid var(--orbit-accent-line);
  border-radius: $radius-pill;
  background: var(--orbit-surface);
  box-shadow: 0 0 18px var(--orbit-glow);
  color: var(--orbit-accent-text);
  @include mono-label;

  svg {
    flex-shrink: 0;
    color: var(--orbit-cyan);
  }
}

.title {
  max-width: 1040px;
  margin: 0;
  font-family: $font-heading;
  font-weight: 800;
  font-size: 40px;
  line-height: 1.1;
  letter-spacing: -0.035em;
  color: var(--orbit-text-1);

  @include up($bp-sm) {
    font-size: 52px;
  }

  @include up($bp-md) {
    font-size: 64px;
  }

  @include up($bp-lg) {
    font-size: 72px;
  }
}

.accent {
  display: inline-block;
  background: linear-gradient(
    90deg,
    var(--orbit-gradient-from),
    var(--orbit-gradient-via) 55%,
    var(--orbit-gradient-to)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  // Keeps descenders inside the clipped background.
  padding-bottom: 0.08em;
}

.tagline {
  max-width: 660px;
  margin: 20px 0 0;
  font-size: 17px;
  line-height: 1.65;
  color: var(--orbit-text-2);

  @include up($bp-md) {
    font-size: 19px;
  }
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  width: 100%;
  margin-top: 32px;

  @include up($bp-sm) {
    flex-direction: row;
    justify-content: center;
    width: auto;
  }
}

.action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 24px;
  border-radius: $radius-md;
  font-family: $font-heading;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s $ease;
  @include focus-ring;

  &:active {
    transform: scale(0.98);
  }
}

.brand {
  background: var(--orbit-accent);
  color: var(--orbit-on-accent);
  box-shadow:
    0 0 24px var(--orbit-glow),
    0 0 0 1px var(--orbit-accent) inset;

  &:hover {
    background: var(--orbit-accent-hover);
    box-shadow: 0 0 32px var(--orbit-glow);
  }

  svg {
    transition: transform 0.2s $ease;
  }

  &:hover svg {
    transform: translateX(3px);
  }
}

.alt {
  border: 1px solid var(--orbit-border-strong);
  background: var(--orbit-surface);
  color: var(--orbit-text-1);
  font-weight: 600;

  svg {
    color: var(--orbit-cyan);
  }

  &:hover {
    border-color: var(--orbit-accent-line);
    background: var(--orbit-surface-2);
  }
}

.install {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding: 4px 4px 4px 14px;
  border: 1px solid var(--orbit-border);
  border-radius: $radius-md;
  background: var(--orbit-surface-sunken);

  code {
    @include mono-label;
    font-size: 13px;
    color: var(--orbit-text-1);
    background: none;
    padding: 0;
  }
}

.prompt {
  font-family: $font-mono;
  font-weight: 600;
  color: var(--orbit-accent-text);
}

@include reduced-motion {
  .ringDashed {
    animation: none;
  }
}
</style>

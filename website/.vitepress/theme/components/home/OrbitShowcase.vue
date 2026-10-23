<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import CopyButton from './CopyButton.vue';
import OrbitIcon from './OrbitIcon.vue';
import { tokenize } from './highlight';
import type { HomeShowcase } from './model';
import { HOST_SNIPPET, SHELL_APPS } from './showcase';

defineProps<{ showcase: HomeShowcase }>();

const lines = tokenize(HOST_SNIPPET);

/** Index of the app the diagram shows as mounted; cycles unless motion is reduced. */
const active = ref(0);
const activeApp = computed(() => SHELL_APPS[active.value]);
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  timer = setInterval(() => {
    if (document.hidden) return;
    active.value = (active.value + 1) % SHELL_APPS.length;
  }, 2600);
});

onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div :class="$style.showcase">
    <figure :class="$style.window">
      <figcaption :class="$style.windowBar">
        <span :class="$style.dots" aria-hidden="true"><i /><i /><i /></span>
        <span :class="$style.file">
          <OrbitIcon name="code" :size="14" />
          {{ showcase.file }}
        </span>
        <CopyButton
          :text="HOST_SNIPPET"
          :label="showcase.copyLabel"
          :copied-label="showcase.copiedLabel"
          show-label
        />
      </figcaption>
      <pre :class="$style.code" tabindex="0"><code><span
        v-for="(line, i) in lines"
        :key="i"
        :class="$style.line"
      ><span
        :class="$style.lineNo"
        aria-hidden="true"
      >{{ i + 1 }}</span><span
        v-for="(token, j) in line"
        :key="j"
        :class="$style[token.kind]"
      >{{ token.text }}</span></span></code></pre>
    </figure>

    <section :class="$style.shell" :aria-label="showcase.shellTitle">
      <div :class="$style.shellHead">
        <span :class="$style.shellTitle">
          <span :class="$style.liveDot" aria-hidden="true" />
          {{ showcase.shellTitle }}
        </span>
      </div>

      <div :class="$style.urlBar">
        <span :class="$style.urlLabel">{{ showcase.routeLabel }}</span>
        <code :class="$style.url">{{ activeApp.path }}</code>
      </div>

      <ul :class="$style.tiles">
        <li
          v-for="(app, i) in SHELL_APPS"
          :key="app.name"
          :class="$style.tile"
          :style="{ '--tile-color': `var(--orbit-${app.framework})` }"
          :data-active="i === active || undefined"
        >
          <span :class="$style.tileHead">
            <span :class="$style.framework">{{ app.label }}</span>
            <span :class="$style.mounted" :aria-hidden="i !== active">{{
              showcase.mountedLabel
            }}</span>
            <span :class="$style.tileDot" aria-hidden="true" />
          </span>
          <code :class="$style.tileName">name: '{{ app.name }}'</code>
          <code :class="$style.tileRoute"
            >activeWhen: '{{ app.activeWhen }}'</code
          >
        </li>
      </ul>

      <div :class="$style.bus">
        <OrbitIcon name="sync" :size="16" />
        <span>{{ showcase.busLabel }}</span>
        <code>@tuvix.js/event-bus</code>
      </div>
    </section>
  </div>
</template>

<style module lang="scss">
@use '../../styles/tokens' as *;

.showcase {
  @include container;
  display: grid;
  gap: 20px;
  margin-bottom: 72px;

  @include up($bp-md) {
    margin-bottom: 96px;
  }

  @include up($bp-lg) {
    grid-template-columns: minmax(0, 1.08fr) minmax(0, 1fr);
    gap: 24px;
  }
}

/* ── Code window ── */
.window {
  @include card;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  box-shadow: var(--orbit-shadow);
}

.windowBar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding: 0 8px 0 16px;
  border-bottom: 1px solid var(--orbit-border);
  background: var(--orbit-surface-sunken);

  > button {
    margin-left: auto;
  }
}

.dots {
  display: inline-flex;
  gap: 7px;

  i {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #ef4444;
    opacity: 0.75;
  }

  i:nth-child(2) {
    background: #f59e0b;
  }

  i:nth-child(3) {
    background: #10b981;
  }
}

.file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 3px 10px;
  border: 1px solid var(--orbit-border);
  border-radius: $radius-sm;
  background: var(--orbit-surface-2);
  color: var(--orbit-text-2);
  @include mono-label;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  svg {
    flex-shrink: 0;
    color: var(--orbit-cyan);
  }
}

.code {
  flex: 1;
  margin: 0;
  padding: 18px 0;
  overflow-x: auto;
  background: var(--orbit-surface);
  font-family: $font-mono;
  font-size: 13px;
  line-height: 22px;
  @include focus-ring(-2px);

  code {
    display: block;
    min-width: max-content;
    padding: 0;
    background: none;
    font: inherit;
  }
}

.line {
  display: block;
  padding-right: 20px;
  white-space: pre;
}

.lineNo {
  display: inline-block;
  width: 44px;
  padding-right: 16px;
  text-align: right;
  color: var(--orbit-text-3);
  opacity: 0.7;
  user-select: none;
}

.keyword {
  color: var(--orbit-syntax-keyword);
}

.string {
  color: var(--orbit-syntax-string);
}

.fn {
  color: var(--orbit-syntax-fn);
}

.prop {
  color: var(--orbit-syntax-prop);
}

.plain {
  color: var(--orbit-syntax-plain);
}

.punct {
  color: var(--orbit-syntax-punct);
}

.comment {
  color: var(--orbit-syntax-comment);
  font-style: italic;
}

/* ── Host shell diagram ── */
.shell {
  @include card;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding: 20px;
  overflow: hidden;
  box-shadow: var(--orbit-shadow);

  @include up($bp-md) {
    padding: 24px;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  &::before,
  &::after {
    content: '';
    position: absolute;
    border: 1px solid var(--orbit-ring);
    border-radius: 50%;
    pointer-events: none;
  }

  &::before {
    right: -90px;
    bottom: -90px;
    width: 220px;
    height: 220px;
  }

  &::after {
    right: -150px;
    bottom: -150px;
    width: 340px;
    height: 340px;
    border-style: dashed;
    border-color: var(--orbit-ring-dashed);
  }
}

.shellHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--orbit-border);
}

.shellTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: $font-heading;
  font-weight: 700;
  font-size: 17px;
  color: var(--orbit-text-1);
}

.liveDot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--orbit-accent);
  box-shadow: 0 0 0 4px var(--orbit-accent-soft);
}

.urlBar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--orbit-border);
  border-radius: $radius-md;
  background: var(--orbit-surface-sunken);
  @include mono-label;
}

.urlLabel {
  color: var(--orbit-text-3);
  text-transform: uppercase;
}

.url {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--orbit-accent-text);
  background: none;
  padding: 0;
  font-size: inherit;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  flex: 1;
  align-content: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--tile-color) 28%, transparent);
  border-radius: $radius-md;
  background: var(--orbit-surface-2);
  transition:
    border-color 0.35s,
    box-shadow 0.35s,
    background-color 0.35s;

  &[data-active] {
    border-color: var(--tile-color);
    background: color-mix(
      in srgb,
      var(--tile-color) 8%,
      var(--orbit-surface-2)
    );
    box-shadow: 0 0 22px color-mix(in srgb, var(--tile-color) 22%, transparent);
  }
}

.tileHead {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.framework {
  margin-right: auto;
  white-space: nowrap;
  font-family: $font-mono;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tile-color);
}

.tileDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tile-color);
  opacity: 0.4;

  [data-active] & {
    opacity: 1;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--tile-color) 20%, transparent);
  }
}

.tileName,
.tileRoute {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0;
  background: none;
  font-family: $font-mono;
  font-size: 12px;
  line-height: 18px;
}

.tileName {
  color: var(--orbit-text-1);
}

.tileRoute {
  color: var(--orbit-text-3);
}

.mounted {
  padding: 1px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--tile-color) 14%, transparent);
  color: var(--tile-color);
  font-family: $font-mono;
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 0.35s;

  [data-active] & {
    opacity: 1;
  }
}

.bus {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  margin-top: auto;
  padding: 12px 14px;
  border: 1px solid var(--orbit-border);
  border-radius: $radius-md;
  background: var(--orbit-surface-sunken);
  color: var(--orbit-text-1);
  font-size: 14px;
  font-weight: 500;

  svg {
    color: var(--orbit-accent-text);
  }

  code {
    margin-left: auto;
    padding: 0;
    background: none;
    color: var(--orbit-accent-text);
    @include mono-label;
  }
}

@include up($bp-sm) {
  .tile {
    padding: 14px 16px;
  }
}

@media (max-width: 380px) {
  .tiles {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

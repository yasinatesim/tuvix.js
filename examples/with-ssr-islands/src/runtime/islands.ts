import { onLifecycle, whenMounted } from '@tuvix.js/loader';

/**
 * Page-wide effects that need island DOM, in the spirit of a site header
 * script that binds scroll and pointer effects to every section.
 *
 * It listens for Tuvix lifecycle events instead of polling for framework
 * internals: an island's DOM is final once its adapter dispatched
 * `tuvix:mounted`, so listeners bound then are never lost to hydration.
 * Effects bound to an island's elements go away with those elements when the
 * island unmounts.
 */
export function startIslandRuntime(): () => void {
  const stopMounted = onLifecycle('mounted', ({ container }) => {
    container.classList.add('is-live');
    for (const el of container.querySelectorAll<HTMLElement>('[data-tilt]'))
      bindTilt(el);
  });

  const stopError = onLifecycle('error', ({ container, name, error }) => {
    container.classList.add('is-failed');
    // Logged as information, so the demo's "no console errors" check stays
    // meaningful for real errors.
    console.info(
      `[islands] ${name} failed:`,
      error instanceof Error ? error.message : error
    );
  });

  // `whenMounted` also resolves when the island mounted before this line ran.
  const controller = new AbortController();
  whenMounted('vue-card', { signal: controller.signal }).then(
    (detail) => {
      document.documentElement.dataset.firstVueMount = detail.hydrated
        ? 'hydrated'
        : 'fresh';
    },
    () => undefined
  );

  return () => {
    stopMounted();
    stopError();
    controller.abort();
  };
}

/** Tilts the element toward the pointer through two CSS custom properties. */
function bindTilt(el: HTMLElement): void {
  el.addEventListener('pointermove', (event) => {
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--tilt-x', `${(-y * 6).toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${(x * 6).toFixed(2)}deg`);
  });
  el.addEventListener('pointerleave', () => {
    el.style.removeProperty('--tilt-x');
    el.style.removeProperty('--tilt-y');
  });
  el.dataset.tiltBound = '';
}

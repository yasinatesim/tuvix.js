import type { ICssSandbox } from './types';

/**
 * CSS sandbox using Shadow DOM to isolate styles.
 *
 * Wraps a container element's content in a Shadow DOM boundary,
 * preventing CSS leaks between micro apps.
 *
 * @example
 * ```ts
 * const cssSandbox = new CssSandbox();
 * const shadowRoot = cssSandbox.wrap(container);
 * cssSandbox.addStyle(shadowRoot, '.app { color: red; }');
 * ```
 */
export class CssSandbox implements ICssSandbox {
  private shadowRoots: WeakMap<HTMLElement, ShadowRoot>;

  constructor() {
    this.shadowRoots = new WeakMap();
  }

  /**
   * Wrap a container in Shadow DOM.
   * Moves existing children into the shadow root.
   */
  wrap(container: HTMLElement): ShadowRoot {
    const existing = this.shadowRoots.get(container);
    if (existing) {
      return existing;
    }

    const shadowRoot = container.attachShadow({ mode: 'open' });

    // Move existing content into shadow root
    while (container.childNodes.length > 0) {
      const child = container.childNodes[0];
      if (child) {
        shadowRoot.appendChild(child);
      }
    }

    this.shadowRoots.set(container, shadowRoot);
    return shadowRoot;
  }

  /**
   * Add a scoped stylesheet to a shadow root.
   */
  addStyle(shadowRoot: ShadowRoot, css: string): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = css;
    shadowRoot.appendChild(style);
    return style;
  }

  /**
   * Remove a stylesheet from a shadow root.
   */
  removeStyle(_shadowRoot: ShadowRoot, styleEl: HTMLStyleElement): void {
    styleEl.remove();
  }

  /**
   * Remove the Shadow DOM wrapper. Content stays in place.
   */
  unwrap(container: HTMLElement): void {
    const shadowRoot = this.shadowRoots.get(container);
    if (!shadowRoot) return;

    // Move shadow content back to regular DOM
    // Note: Shadow DOM can't be fully removed, but we clear it
    while (shadowRoot.childNodes.length > 0) {
      const child = shadowRoot.childNodes[0];
      if (child) {
        // Style elements should be discarded
        if (child instanceof HTMLStyleElement) {
          child.remove();
        }
      } else {
        break;
      }
    }

    this.shadowRoots.delete(container);
  }
}

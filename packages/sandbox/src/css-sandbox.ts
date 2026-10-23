import type { AdoptedStyles, AdoptStylesOptions, ICssSandbox } from './types';

/** Marks the `<slot>` that `unwrap` leaves behind so light DOM renders. */
const PARKING_SLOT_ATTR = 'data-tuvix-sandbox-slot';

/** Marks `<style>`/`<link>` elements created by `adoptStyles`. */
const ADOPTED_STYLE_ATTR = 'data-tuvix-style';

/** Load promises for adopted `<link>` elements, shared across calls. */
const linkReady = new WeakMap<HTMLLinkElement, Promise<void>>();

/**
 * Stylesheet nodes `unwrap` took out of a shadow root, in document order.
 * The next `wrap` of the same host (by any instance) puts them back.
 */
const parkedStyles = new WeakMap<ShadowRoot, Element[]>();

/** Drop `el` from the parked list so a later `wrap` does not restore it. */
function unpark(shadowRoot: ShadowRoot, el: Element): void {
  const parked = parkedStyles.get(shadowRoot);
  if (!parked) return;
  const index = parked.indexOf(el);
  if (index >= 0) parked.splice(index, 1);
}

function isElement(node: Node): node is Element {
  return node.nodeType === 1;
}

function isStylesheetNode(node: Node): boolean {
  if (!isElement(node)) return false;
  if (node.localName === 'style') return true;
  return (
    node.localName === 'link' &&
    (node.getAttribute('rel') ?? '').split(/\s+/).includes('stylesheet')
  );
}

function waitForLink(link: HTMLLinkElement): Promise<void> {
  const known = linkReady.get(link);
  if (known) return known;
  const ready = new Promise<void>((resolve) => {
    const done = (): void => {
      link.removeEventListener('load', done);
      link.removeEventListener('error', done);
      resolve();
    };
    link.addEventListener('load', done);
    link.addEventListener('error', done);
  });
  linkReady.set(link, ready);
  return ready;
}

/**
 * CSS sandbox that isolates a container's styles inside a Shadow DOM.
 *
 * `wrap` moves the container's children into an open shadow root. A shadow
 * root can never be detached, so `unwrap` moves the children back and leaves
 * a `<slot>` in the shadow root so they render again. Calling `wrap` later on
 * the same element reuses the existing shadow root instead of attaching a
 * second one, and restores the stylesheets `unwrap` set aside.
 *
 * @example
 * ```ts
 * const cssSandbox = new CssSandbox();
 * const shadowRoot = cssSandbox.wrap(container);
 * cssSandbox.adoptStyles(shadowRoot, { urls: ['/apps/cart/style.css'] });
 * cssSandbox.addStyle(shadowRoot, '.app { color: red; }');
 * ```
 */
export class CssSandbox implements ICssSandbox {
  private shadowRoots: WeakMap<HTMLElement, ShadowRoot>;

  constructor() {
    this.shadowRoots = new WeakMap();
  }

  /**
   * Move the container's children into a shadow root and return it.
   *
   * Reuses `container.shadowRoot` when the element already has an open shadow
   * root (from an earlier `wrap`, another `CssSandbox`, or an `unwrap`), and
   * puts back the `<style>`/`<link>` nodes the last `unwrap` set aside.
   * Throws only when `attachShadow` itself fails, for example on elements
   * that cannot host a shadow root or that already have a closed one.
   */
  wrap(container: HTMLElement): ShadowRoot {
    const known = this.shadowRoots.get(container);
    if (known) return known;

    let shadowRoot = container.shadowRoot;
    if (shadowRoot) {
      for (const child of Array.from(shadowRoot.childNodes)) {
        if (isElement(child) && child.hasAttribute(PARKING_SLOT_ATTR)) {
          child.remove();
        }
      }
      const parked = parkedStyles.get(shadowRoot);
      if (parked) {
        shadowRoot.prepend(...parked);
        parkedStyles.delete(shadowRoot);
      }
    } else {
      try {
        shadowRoot = container.attachShadow({ mode: 'open' });
      } catch (err) {
        throw new Error(
          `[Tuvix Sandbox] Cannot attach Shadow DOM to <${container.tagName.toLowerCase()}>: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    while (container.firstChild) {
      shadowRoot.appendChild(container.firstChild);
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
   * Remove a stylesheet from a shadow root. Also works while the host is
   * unwrapped: the style is not restored by the next `wrap`.
   */
  removeStyle(shadowRoot: ShadowRoot, styleEl: HTMLStyleElement): void {
    styleEl.remove();
    unpark(shadowRoot, styleEl);
  }

  /**
   * Insert an app's stylesheets at the start of a shadow root, after styles
   * adopted earlier. URLs become `<link rel="stylesheet">`; a URL already
   * adopted into this shadow root is skipped. CSS strings become `<style>`.
   *
   * `ready` resolves once every new or pending `<link>` fires `load` or
   * `error`. It never rejects. Environments that do not load stylesheets
   * (jsdom) never fire these events, so do not await `ready` there.
   *
   * @example
   * ```ts
   * const adopted = cssSandbox.adoptStyles(shadowRoot, {
   *   urls: ['/apps/cart/style.css'],
   *   cssText: ':host { display: block; }',
   * });
   * await adopted.ready;
   * // later
   * adopted.remove();
   * ```
   */
  adoptStyles(
    shadowRoot: ShadowRoot,
    styles: AdoptStylesOptions
  ): AdoptedStyles {
    const existingLinks = new Map<string, HTMLLinkElement>();
    for (const el of parkedStyles.get(shadowRoot) ?? []) {
      if (el.localName === 'link' && el.hasAttribute(ADOPTED_STYLE_ATTR)) {
        existingLinks.set(el.getAttribute('href') ?? '', el as HTMLLinkElement);
      }
    }
    let anchor: Node | null = null;
    for (const child of Array.from(shadowRoot.childNodes)) {
      if (isElement(child) && child.hasAttribute(ADOPTED_STYLE_ATTR)) {
        if (child.localName === 'link') {
          existingLinks.set(
            child.getAttribute('href') ?? '',
            child as HTMLLinkElement
          );
        }
        continue;
      }
      anchor = child;
      break;
    }

    const elements: HTMLElement[] = [];
    const pending: Promise<void>[] = [];

    for (const url of styles.urls ?? []) {
      const existing = existingLinks.get(url);
      if (existing) {
        const known = linkReady.get(existing);
        if (known) pending.push(known);
        continue;
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.setAttribute('href', url);
      link.setAttribute(ADOPTED_STYLE_ATTR, '');
      pending.push(waitForLink(link));
      existingLinks.set(url, link);
      elements.push(link);
    }

    const cssTexts =
      typeof styles.cssText === 'string'
        ? [styles.cssText]
        : (styles.cssText ?? []);
    for (const css of cssTexts) {
      const style = document.createElement('style');
      style.setAttribute(ADOPTED_STYLE_ATTR, '');
      style.textContent = css;
      elements.push(style);
    }

    for (const el of elements) {
      shadowRoot.insertBefore(el, anchor);
    }

    return {
      elements,
      ready: Promise.all(pending).then(() => undefined),
      remove(): void {
        for (const el of elements) {
          el.remove();
          unpark(shadowRoot, el);
        }
      },
    };
  }

  /**
   * Move the shadow root's content back into the container's light DOM.
   *
   * `<style>` and `<link rel="stylesheet">` nodes leave the DOM so the app's
   * styles stop applying, and the next `wrap` of this container puts them
   * back. The shadow root stays attached (the DOM offers no way to remove
   * it) and holds a single `<slot>`, so the restored children render as
   * before. Does nothing for a container this instance did not wrap.
   */
  unwrap(container: HTMLElement): void {
    const shadowRoot = this.shadowRoots.get(container);
    if (!shadowRoot) return;

    const parked: Element[] = [];
    for (const child of Array.from(shadowRoot.childNodes)) {
      if (isStylesheetNode(child)) {
        child.remove();
        parked.push(child as Element);
      } else if (isElement(child) && child.hasAttribute(PARKING_SLOT_ATTR)) {
        child.remove();
      } else {
        container.appendChild(child);
      }
    }
    if (parked.length > 0) parkedStyles.set(shadowRoot, parked);

    const slot = document.createElement('slot');
    slot.setAttribute(PARKING_SLOT_ATTR, '');
    shadowRoot.appendChild(slot);

    this.shadowRoots.delete(container);
  }
}

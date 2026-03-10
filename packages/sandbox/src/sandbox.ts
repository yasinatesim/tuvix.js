import type { SandboxOptions, ISandbox, ICssSandbox, IJsSandbox } from './types';
import { CssSandbox } from './css-sandbox';
import { JsSandbox } from './js-sandbox';

/**
 * Combined sandbox providing both CSS and JS isolation.
 *
 * @example
 * ```ts
 * const sandbox = new Sandbox({ css: true, js: true });
 * const shadowRoot = sandbox.activate(container);
 *
 * // App runs in isolation — styles and globals are scoped
 *
 * sandbox.deactivate(container);
 * ```
 */
export class Sandbox implements ISandbox {
  private cssSandbox: CssSandbox;
  private jsSandbox: JsSandbox;
  private options: Required<SandboxOptions>;

  constructor(options: SandboxOptions = {}) {
    this.options = {
      css: options.css ?? true,
      js: options.js ?? true,
      allowedGlobals: options.allowedGlobals ?? [],
      strict: options.strict ?? false,
    };

    this.cssSandbox = new CssSandbox();
    this.jsSandbox = new JsSandbox(
      this.options.allowedGlobals,
      this.options.strict
    );
  }

  get css(): ICssSandbox {
    return this.cssSandbox;
  }

  get js(): IJsSandbox {
    return this.jsSandbox;
  }

  /**
   * Activate all isolation layers for a container.
   * Returns the Shadow DOM root (if CSS isolation is enabled).
   */
  activate(container: HTMLElement): ShadowRoot {
    let shadowRoot: ShadowRoot;

    if (this.options.css) {
      shadowRoot = this.cssSandbox.wrap(container);
    } else {
      // Return container's shadow root if it exists, or create minimal one
      shadowRoot =
        container.shadowRoot ?? container.attachShadow({ mode: 'open' });
    }

    if (this.options.js) {
      this.jsSandbox.activate();
    }

    return shadowRoot;
  }

  /**
   * Deactivate all isolation layers.
   */
  deactivate(container: HTMLElement): void {
    if (this.options.js) {
      this.jsSandbox.deactivate();
    }

    if (this.options.css) {
      this.cssSandbox.unwrap(container);
    }
  }

  /**
   * Destroy the sandbox and clean up all resources.
   */
  destroy(container: HTMLElement): void {
    this.deactivate(container);
    this.jsSandbox.reset();
  }
}

/**
 * Factory function to create a new Sandbox instance.
 */
export function createSandbox(options?: SandboxOptions): ISandbox {
  return new Sandbox(options);
}

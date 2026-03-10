/**
 * DOM-based debug panel injected into the page.
 * Shows registered apps, mounted apps, and event history.
 */
export class DevToolsPanel {
  private element: HTMLElement | null;
  private visible: boolean;

  constructor() {
    this.element = null;
    this.visible = false;
  }

  /**
   * Create and inject the panel into the DOM.
   */
  mount(): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.id = 'tuvix-devtools';
    this.element.innerHTML = this.getTemplate();
    this.applyStyles();

    document.body.appendChild(this.element);

    // Toggle button
    const toggle = this.element.querySelector('#tuvix-dt-toggle');
    toggle?.addEventListener('click', () => this.toggle());

    this.visible = true;
  }

  /**
   * Remove the panel from the DOM.
   */
  unmount(): void {
    this.element?.remove();
    this.element = null;
    this.visible = false;
  }

  /**
   * Toggle panel visibility.
   */
  toggle(): void {
    if (!this.element) return;

    const panel = this.element.querySelector('#tuvix-dt-panel') as HTMLElement;
    if (!panel) return;

    this.visible = !this.visible;
    panel.style.display = this.visible ? 'block' : 'none';
  }

  /**
   * Update the panel content with current state.
   */
  update(state: {
    registeredApps: string[];
    mountedApps: string[];
    currentRoute: string;
    events: Array<{ timestamp: number; event: string }>;
  }): void {
    if (!this.element) return;

    const appsEl = this.element.querySelector('#tuvix-dt-apps');
    const routeEl = this.element.querySelector('#tuvix-dt-route');
    const eventsEl = this.element.querySelector('#tuvix-dt-events');

    if (appsEl) {
      appsEl.innerHTML = '';
      for (const name of state.registeredApps) {
        const isMounted = state.mountedApps.includes(name);
        const dot = isMounted ? '🟢' : '⚪';
        const row = document.createElement('div');
        row.style.cssText = 'padding:2px 0;font-size:12px';
        row.textContent = `${dot} ${name}`;
        appsEl.appendChild(row);
      }
    }

    if (routeEl) {
      routeEl.textContent = state.currentRoute;
    }

    if (eventsEl) {
      eventsEl.innerHTML = '';
      const recent = state.events.slice(-10).reverse();
      for (const e of recent) {
        const time = new Date(e.timestamp).toLocaleTimeString();
        const row = document.createElement('div');
        row.style.cssText = 'padding:1px 0;font-size:11px;color:#aaa';
        row.textContent = `${time} — ${e.event}`;
        eventsEl.appendChild(row);
      }
    }
  }

  private getTemplate(): string {
    return `
      <button id="tuvix-dt-toggle"
        style="position:fixed;bottom:12px;right:12px;z-index:99999;
        width:36px;height:36px;border-radius:50%;border:none;
        background:#00e5a0;color:#080c10;font-weight:bold;font-size:16px;
        cursor:pointer;box-shadow:0 2px 12px rgba(0,229,160,.3)">
        ⬡
      </button>
      <div id="tuvix-dt-panel" style="display:block">
        <div style="padding:12px 16px;border-bottom:1px solid #1e2d3d;
          font-weight:700;font-size:13px;color:#eaf2f8;display:flex;
          align-items:center;gap:8px">
          <span style="color:#00e5a0">⬡</span> Tuvix DevTools
        </div>
        <div style="padding:12px 16px">
          <div style="font-size:11px;color:#5c7080;text-transform:uppercase;
            letter-spacing:.06em;margin-bottom:6px">Apps</div>
          <div id="tuvix-dt-apps" style="margin-bottom:12px"></div>
          <div style="font-size:11px;color:#5c7080;text-transform:uppercase;
            letter-spacing:.06em;margin-bottom:4px">Route</div>
          <div id="tuvix-dt-route" style="font-size:12px;color:#00e5a0;
            margin-bottom:12px;font-family:monospace">/</div>
          <div style="font-size:11px;color:#5c7080;text-transform:uppercase;
            letter-spacing:.06em;margin-bottom:4px">Events</div>
          <div id="tuvix-dt-events" style="max-height:120px;overflow-y:auto;
            font-family:monospace"></div>
        </div>
      </div>
    `;
  }

  private applyStyles(): void {
    if (!this.element) return;

    const panel = this.element.querySelector('#tuvix-dt-panel') as HTMLElement;
    if (panel) {
      Object.assign(panel.style, {
        position: 'fixed',
        bottom: '56px',
        right: '12px',
        zIndex: '99998',
        width: '280px',
        maxHeight: '400px',
        overflowY: 'auto',
        background: '#0d1117',
        border: '1px solid #1e2d3d',
        borderRadius: '10px',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        boxShadow: '0 8px 32px rgba(0,0,0,.5)',
      });
    }
  }
}

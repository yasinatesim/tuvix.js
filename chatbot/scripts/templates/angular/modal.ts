import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'confirmation',
    description: 'Confirmation modal with accept and cancel actions',
    tags: ['modal', 'confirmation', 'dialog'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-confirmation-modal',
  template: \`

    <button class="trigger" (click)="open=true">Delete Item</button>
    <div class="overlay" *ngIf="open" (click)="open=false">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3 class="title">Are you sure?</h3>
        <p class="message">This action cannot be undone. The item will be permanently removed.</p>
        <div class="actions">
          <button class="btn-cancel" (click)="open=false">Cancel</button>
          <button class="btn-danger" (click)="open=false">Delete</button>
        </div>
      </div>
    </div>
  
  \`,
})
export class ConfirmationModalComponent {
open = false;
}

const app = defineMicroApp({
  name: 'confirmation-modal',
  async mount({ container }) {
    const el = document.createElement('app-confirmation-modal');
    container.appendChild(el);
    await bootstrapApplication(ConfirmationModalComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'form',
    description: 'Modal with an embedded form for data entry',
    tags: ['modal', 'form', 'input'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-form-modal',
  template: \`

    <button class="trigger" (click)="open=true">Add New</button>
    <div class="overlay" *ngIf="open" (click)="open=false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="header"><h3>Add Item</h3><button class="close" (click)="open=false">\\u2715</button></div>
        <form (submit)="onSubmit($event)">
          <label class="label">Name</label>
          <input class="input" placeholder="Item name" />
          <label class="label">Description</label>
          <textarea class="textarea" rows="3" placeholder="Describe the item..."></textarea>
          <div class="actions">
            <button type="button" class="btn-cancel" (click)="open=false">Cancel</button>
            <button type="submit" class="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  
  \`,
})
export class FormModalComponent {
open = false;
  onSubmit(e: Event) { e.preventDefault(); this.open = false; }
}

const app = defineMicroApp({
  name: 'form-modal',
  async mount({ container }) {
    const el = document.createElement('app-form-modal');
    container.appendChild(el);
    await bootstrapApplication(FormModalComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'lightbox',
    description: 'Lightbox modal for viewing images at full size',
    tags: ['modal', 'lightbox', 'image'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-lightbox-modal',
  template: \`

    <div class="thumbnails">
      <div *ngFor="let img of images; let i = index" class="thumb" [style.background]="img.color" (click)="openImage(i)"></div>
    </div>
    <div class="overlay" *ngIf="selectedIndex >= 0" (click)="selectedIndex=-1">
      <button class="nav-btn prev" (click)="prev($event)">\\u2190</button>
      <div class="lightbox" [style.background]="images[selectedIndex].color" (click)="$event.stopPropagation()">
        <div class="caption">{{ images[selectedIndex].title }}</div>
      </div>
      <button class="nav-btn next" (click)="next($event)">\\u2192</button>
      <button class="close-btn" (click)="selectedIndex=-1">\\u2715</button>
    </div>
  
  \`,
})
export class LightboxModalComponent {
selectedIndex = -1;
  images = [
    { title: 'Sunset', color: 'linear-gradient(135deg, #fde68a, #f97316)' },
    { title: 'Ocean', color: 'linear-gradient(135deg, #93c5fd, #3b82f6)' },
    { title: 'Forest', color: 'linear-gradient(135deg, #86efac, #22c55e)' },
    { title: 'Mountains', color: 'linear-gradient(135deg, #c4b5fd, #7c3aed)' },
  ];
  openImage(i: number) { this.selectedIndex = i; }
  prev(e: Event) { e.stopPropagation(); this.selectedIndex = (this.selectedIndex - 1 + this.images.length) % this.images.length; }
  next(e: Event) { e.stopPropagation(); this.selectedIndex = (this.selectedIndex + 1) % this.images.length; }
}

const app = defineMicroApp({
  name: 'lightbox-modal',
  async mount({ container }) {
    const el = document.createElement('app-lightbox-modal');
    container.appendChild(el);
    await bootstrapApplication(LightboxModalComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'video',
    description: 'Video player modal with placeholder content',
    tags: ['modal', 'video', 'player'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-video-modal',
  template: \`

    <button class="trigger" (click)="open=true">\\u25B6 Watch Video</button>
    <div class="overlay" *ngIf="open" (click)="open=false">
      <div class="modal" (click)="$event.stopPropagation()">
        <button class="close" (click)="open=false">\\u2715</button>
        <div class="video-placeholder">
          <span class="play-icon">\\u25B6</span>
          <p class="video-title">Product Demo Video</p>
        </div>
      </div>
    </div>
  
  \`,
})
export class VideoModalComponent {
open = false;
}

const app = defineMicroApp({
  name: 'video-modal',
  async mount({ container }) {
    const el = document.createElement('app-video-modal');
    container.appendChild(el);
    await bootstrapApplication(VideoModalComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'settings',
    description: 'Settings modal with tabbed configuration panels',
    tags: ['modal', 'settings', 'tabs'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-settings-modal',
  template: \`

    <button class="trigger" (click)="open=true">\\u2699 Settings</button>
    <div class="overlay" *ngIf="open" (click)="open=false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="header"><h3>Settings</h3><button class="close" (click)="open=false">\\u2715</button></div>
        <div class="body">
          <nav class="tabs">
            <button *ngFor="let tab of tabs" class="tab" [class.active]="activeTab===tab" (click)="activeTab=tab">{{ tab }}</button>
          </nav>
          <div class="panel">
            <h4>{{ activeTab }}</h4>
            <p class="placeholder">Configure your {{ activeTab.toLowerCase() }} preferences here.</p>
          </div>
        </div>
        <div class="footer"><button class="btn" (click)="open=false">Save Changes</button></div>
      </div>
    </div>
  
  \`,
})
export class SettingsModalComponent {
open = false;
  activeTab = 'General';
  tabs = ['General', 'Appearance', 'Notifications', 'Security'];
}

const app = defineMicroApp({
  name: 'settings-modal',
  async mount({ container }) {
    const el = document.createElement('app-settings-modal');
    container.appendChild(el);
    await bootstrapApplication(SettingsModalComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'side-panel',
    description: 'Side panel modal that slides in from the right',
    tags: ['modal', 'side-panel', 'drawer'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-side-panel',
  template: \`

    <button class="trigger" (click)="open=true">Open Panel</button>
    <div class="overlay" *ngIf="open">
      <div class="backdrop" (click)="open=false"></div>
      <aside class="panel">
        <div class="header"><h3>Details</h3><button class="close" (click)="open=false">\\u2715</button></div>
        <div class="body">
          <p class="text">Side panel content goes here. Useful for detail views and forms.</p>
        </div>
      </aside>
    </div>
  
  \`,
})
export class SidePanelComponent {
open = false;
}

const app = defineMicroApp({
  name: 'side-panel-modal',
  async mount({ container }) {
    const el = document.createElement('app-side-panel');
    container.appendChild(el);
    await bootstrapApplication(SidePanelComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'image-gallery',
    description: 'Image gallery modal with grid and full-view mode',
    tags: ['modal', 'gallery', 'images'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-gallery-modal',
  template: \`

    <button class="trigger" (click)="open=true">View Gallery</button>
    <div class="overlay" *ngIf="open" (click)="open=false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="header"><h3>Gallery</h3><button class="close" (click)="open=false">\\u2715</button></div>
        <div class="grid">
          <div *ngFor="let img of images" class="grid-item" [style.background]="img.color">
            <span class="img-label">{{ img.label }}</span>
          </div>
        </div>
      </div>
    </div>
  
  \`,
})
export class GalleryModalComponent {
open = false;
  images = [
    { label: 'Photo 1', color: 'linear-gradient(135deg, #a78bfa, #6366f1)' },
    { label: 'Photo 2', color: 'linear-gradient(135deg, #fde68a, #f59e0b)' },
    { label: 'Photo 3', color: 'linear-gradient(135deg, #86efac, #22c55e)' },
    { label: 'Photo 4', color: 'linear-gradient(135deg, #fca5a5, #ef4444)' },
    { label: 'Photo 5', color: 'linear-gradient(135deg, #93c5fd, #3b82f6)' },
    { label: 'Photo 6', color: 'linear-gradient(135deg, #fdba74, #f97316)' },
  ];
}

const app = defineMicroApp({
  name: 'image-gallery-modal',
  async mount({ container }) {
    const el = document.createElement('app-gallery-modal');
    container.appendChild(el);
    await bootstrapApplication(GalleryModalComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'terms',
    description: 'Terms and conditions modal with scrollable content and accept button',
    tags: ['modal', 'terms', 'legal'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-terms-modal',
  template: \`

    <button class="trigger" (click)="open=true">View Terms</button>
    <div class="overlay" *ngIf="open" (click)="open=false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="header"><h3>Terms & Conditions</h3></div>
        <div class="body">
          <p *ngFor="let p of paragraphs" class="text">{{ p }}</p>
        </div>
        <div class="footer">
          <button class="btn-cancel" (click)="open=false">Decline</button>
          <button class="btn-primary" (click)="open=false">Accept</button>
        </div>
      </div>
    </div>
  
  \`,
})
export class TermsModalComponent {
open = false;
  paragraphs = [
    'By using this service, you agree to the following terms and conditions.',
    'We reserve the right to modify these terms at any time. Continued use constitutes acceptance.',
    'Your data is processed in accordance with our privacy policy. We do not sell personal information.',
    'This service is provided as-is without warranties of any kind, express or implied.',
    'You are responsible for maintaining the security of your account credentials.',
  ];
}

const app = defineMicroApp({
  name: 'terms-modal',
  async mount({ container }) {
    const el = document.createElement('app-terms-modal');
    container.appendChild(el);
    await bootstrapApplication(TermsModalComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'alert',
    description: 'Alert modal for displaying important messages with icon',
    tags: ['modal', 'alert', 'warning'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-alert-modal',
  template: \`

    <button class="trigger" (click)="open=true">Show Alert</button>
    <div class="overlay" *ngIf="open" (click)="open=false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="icon">\\u26A0</div>
        <h3 class="title">Warning</h3>
        <p class="message">Your session is about to expire. Please save your work to avoid losing changes.</p>
        <div class="actions">
          <button class="btn-primary" (click)="open=false">Continue Session</button>
          <button class="btn-link" (click)="open=false">Log Out</button>
        </div>
      </div>
    </div>
  
  \`,
})
export class AlertModalComponent {
open = false;
}

const app = defineMicroApp({
  name: 'alert-modal',
  async mount({ container }) {
    const el = document.createElement('app-alert-modal');
    container.appendChild(el);
    await bootstrapApplication(AlertModalComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'fullscreen',
    description: 'Fullscreen modal that covers the entire viewport',
    tags: ['modal', 'fullscreen', 'overlay'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-fullscreen-modal',
  template: \`

    <button class="trigger" (click)="open=true">Open Fullscreen</button>
    <div class="modal" *ngIf="open">
      <header class="header">
        <h3>Fullscreen View</h3>
        <button class="close" (click)="open=false">\\u2715 Close</button>
      </header>
      <main class="body">
        <p class="text">This modal takes up the entire viewport. Useful for immersive experiences, editors, or previews.</p>
      </main>
    </div>
  
  \`,
})
export class FullscreenModalComponent {
open = false;
}

const app = defineMicroApp({
  name: 'fullscreen-modal',
  async mount({ container }) {
    const el = document.createElement('app-fullscreen-modal');
    container.appendChild(el);
    await bootstrapApplication(FullscreenModalComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'drawer',
    description: 'Bottom drawer modal that slides up from the bottom',
    tags: ['modal', 'drawer', 'bottom'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-drawer-modal',
  template: \`

    <button class="trigger" (click)="open=true">Open Drawer</button>
    <div class="overlay" *ngIf="open">
      <div class="backdrop" (click)="open=false"></div>
      <div class="drawer">
        <div class="handle"></div>
        <h3 class="title">Quick Actions</h3>
        <div class="actions">
          <button *ngFor="let action of actions" class="action-btn" (click)="open=false">{{ action }}</button>
        </div>
      </div>
    </div>
  
  \`,
})
export class DrawerModalComponent {
open = false;
  actions = ['Share', 'Copy Link', 'Edit', 'Archive', 'Delete'];
}

const app = defineMicroApp({
  name: 'drawer-modal',
  async mount({ container }) {
    const el = document.createElement('app-drawer-modal');
    container.appendChild(el);
    await bootstrapApplication(DrawerModalComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'bottom-sheet',
    description: 'Bottom sheet modal with list of selectable options',
    tags: ['modal', 'bottom-sheet', 'select'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-bottom-sheet',
  template: \`

    <button class="trigger" (click)="open=true">Select Option</button>
    <div class="overlay" *ngIf="open">
      <div class="backdrop" (click)="open=false"></div>
      <div class="sheet">
        <div class="handle"></div>
        <h3 class="title">Choose an option</h3>
        <div class="options">
          <button *ngFor="let opt of options" class="option" [class.selected]="selected===opt" (click)="selected=opt; open=false">
            <span>{{ opt }}</span>
            <span *ngIf="selected===opt" class="check">\\u2713</span>
          </button>
        </div>
      </div>
    </div>
  
  \`,
})
export class BottomSheetComponent {
open = false;
  selected = 'Standard';
  options = ['Economy', 'Standard', 'Express', 'Priority', 'Same Day'];
}

const app = defineMicroApp({
  name: 'bottom-sheet-modal',
  async mount({ container }) {
    const el = document.createElement('app-bottom-sheet');
    container.appendChild(el);
    await bootstrapApplication(BottomSheetComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'cookie-consent',
    description: 'Cookie consent modal with preference options',
    tags: ['modal', 'cookie', 'consent'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-cookie-modal',
  template: \`

    <div class="banner" *ngIf="visible">
      <div class="content">
        <h3 class="title">\\u{1F36A} Cookie Preferences</h3>
        <p class="message">We use cookies to enhance your experience. Choose your preferences below.</p>
        <div class="options">
          <label class="option" *ngFor="let c of cookies">
            <input type="checkbox" [checked]="c.enabled" (change)="c.enabled=!c.enabled" [disabled]="c.required" />
            <span>{{ c.label }}</span>
          </label>
        </div>
      </div>
      <div class="actions">
        <button class="btn-outline" (click)="visible=false">Reject All</button>
        <button class="btn-primary" (click)="visible=false">Accept Selected</button>
      </div>
    </div>
  
  \`,
})
export class CookieModalComponent {
visible = true;
  cookies = [
    { label: 'Essential', enabled: true, required: true },
    { label: 'Analytics', enabled: false, required: false },
    { label: 'Marketing', enabled: false, required: false },
    { label: 'Preferences', enabled: true, required: false },
  ];
}

const app = defineMicroApp({
  name: 'cookie-consent-modal',
  async mount({ container }) {
    const el = document.createElement('app-cookie-modal');
    container.appendChild(el);
    await bootstrapApplication(CookieModalComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'search',
    description: 'Search modal with input and recent search suggestions',
    tags: ['modal', 'search', 'command'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-search-modal',
  template: \`

    <button class="trigger" (click)="open=true">\\u{1F50D} Search</button>
    <div class="overlay" *ngIf="open" (click)="open=false">
      <div class="modal" (click)="$event.stopPropagation()">
        <input class="search-input" placeholder="Search..." autofocus [value]="query" (input)="query=$any($event.target).value" />
        <div class="results">
          <div class="section-title">Recent</div>
          <a *ngFor="let item of filtered" href="#" class="result-item" (click)="open=false">{{ item }}</a>
        </div>
      </div>
    </div>
  
  \`,
})
export class SearchModalComponent {
open = false;
  query = '';
  recent = ['Dashboard', 'User Settings', 'API Documentation', 'Billing', 'Team Members'];
  get filtered() { return this.recent.filter(r => r.toLowerCase().includes(this.query.toLowerCase())); }
}

const app = defineMicroApp({
  name: 'search-modal',
  async mount({ container }) {
    const el = document.createElement('app-search-modal');
    container.appendChild(el);
    await bootstrapApplication(SearchModalComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'command-palette',
    description: 'Command palette modal with keyboard shortcut hint',
    tags: ['modal', 'command-palette', 'keyboard'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-command-palette',
  template: \`

    <p class="hint">Press Ctrl+K to open command palette</p>
    <div class="overlay" *ngIf="open" (click)="open=false">
      <div class="modal" (click)="$event.stopPropagation()">
        <input class="input" placeholder="Type a command..." [value]="query" (input)="query=$any($event.target).value" />
        <div class="commands">
          <button *ngFor="let cmd of filtered" class="cmd" (click)="open=false">
            <span class="cmd-label">{{ cmd.label }}</span>
            <span class="cmd-shortcut">{{ cmd.shortcut }}</span>
          </button>
        </div>
      </div>
    </div>
  
  \`,
})
export class CommandPaletteComponent {
open = false;
  query = '';
  commands = [
    { label: 'Go to Dashboard', shortcut: 'G D' },
    { label: 'New Project', shortcut: 'N P' },
    { label: 'Search Files', shortcut: 'Ctrl+F' },
    { label: 'Toggle Theme', shortcut: 'Ctrl+T' },
    { label: 'Open Settings', shortcut: 'Ctrl+,' },
    { label: 'View Shortcuts', shortcut: '?' },
  ];
  get filtered() { return this.commands.filter(c => c.label.toLowerCase().includes(this.query.toLowerCase())); }
  @HostListener('window:keydown', ['$event']) onKey(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === 'k') { e.preventDefault(); this.open = !this.open; this.query = ''; }
    if (e.key === 'Escape') { this.open = false; }
  }
}

const app = defineMicroApp({
  name: 'command-palette-modal',
  async mount({ container }) {
    const el = document.createElement('app-command-palette');
    container.appendChild(el);
    await bootstrapApplication(CommandPaletteComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
];

export default templates;

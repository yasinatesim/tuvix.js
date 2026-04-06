import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'confirmation',
    description: 'Confirmation modal with accept and cancel actions',
    tags: ['modal', 'confirmation', 'dialog'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .trigger { padding: 10px 20px; background: #ef4444; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal { background: #fff; border-radius: 12px; padding: 24px; width: 400px; max-width: 90vw; }
    .title { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
    .message { font-size: 14px; color: #6b7280; margin: 0 0 24px; line-height: 1.5; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-cancel { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
    .btn-danger { padding: 8px 20px; border: none; border-radius: 6px; background: #ef4444; color: #fff; cursor: pointer; font-weight: 600; }
  \`]
})
export class ConfirmationModalComponent {
  open = false;
}

@NgModule({
  declarations: [ConfirmationModalComponent],
  imports: [BrowserModule],
  bootstrap: [ConfirmationModalComponent],
})
export class ConfirmationModalModule {}

export default createAngularMicroApp({
  name: 'confirmation-modal',
  module: ConfirmationModalModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'form',
    description: 'Modal with an embedded form for data entry',
    tags: ['modal', 'form', 'input'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .trigger { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal { background: #fff; border-radius: 12px; width: 440px; max-width: 90vw; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
    .header h3 { margin: 0; font-size: 18px; }
    .close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
    form { padding: 24px; }
    .label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #374151; }
    .input, .textarea { display: block; width: 100%; padding: 10px 12px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box; font-family: inherit; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
    .btn-cancel { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
    .btn-primary { padding: 8px 20px; border: none; border-radius: 6px; background: #6366f1; color: #fff; cursor: pointer; font-weight: 600; }
  \`]
})
export class FormModalComponent {
  open = false;
  onSubmit(e: Event) { e.preventDefault(); this.open = false; }
}

@NgModule({
  declarations: [FormModalComponent],
  imports: [BrowserModule],
  bootstrap: [FormModalComponent],
})
export class FormModalModule {}

export default createAngularMicroApp({
  name: 'form-modal',
  module: FormModalModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'lightbox',
    description: 'Lightbox modal for viewing images at full size',
    tags: ['modal', 'lightbox', 'image'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .thumbnails { display: flex; gap: 8px; flex-wrap: wrap; }
    .thumb { width: 100px; height: 80px; border-radius: 8px; cursor: pointer; transition: opacity 0.2s; }
    .thumb:hover { opacity: 0.8; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .lightbox { width: 600px; height: 400px; border-radius: 8px; display: flex; align-items: flex-end; justify-content: center; }
    .caption { color: #fff; font-size: 14px; padding: 12px; background: rgba(0,0,0,0.5); border-radius: 0 0 8px 8px; width: 100%; text-align: center; }
    .nav-btn { position: absolute; background: rgba(255,255,255,0.2); border: none; color: #fff; font-size: 24px; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; }
    .prev { left: 24px; }
    .next { right: 24px; }
    .close-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; }
  \`]
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

@NgModule({
  declarations: [LightboxModalComponent],
  imports: [BrowserModule],
  bootstrap: [LightboxModalComponent],
})
export class LightboxModalModule {}

export default createAngularMicroApp({
  name: 'lightbox-modal',
  module: LightboxModalModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'video',
    description: 'Video player modal with placeholder content',
    tags: ['modal', 'video', 'player'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .trigger { padding: 12px 24px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 15px; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal { position: relative; width: 640px; max-width: 90vw; }
    .close { position: absolute; top: -36px; right: 0; background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; }
    .video-placeholder { aspect-ratio: 16/9; background: #111827; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .play-icon { font-size: 48px; color: #fff; margin-bottom: 8px; }
    .video-title { color: #9ca3af; font-size: 14px; }
  \`]
})
export class VideoModalComponent {
  open = false;
}

@NgModule({
  declarations: [VideoModalComponent],
  imports: [BrowserModule],
  bootstrap: [VideoModalComponent],
})
export class VideoModalModule {}

export default createAngularMicroApp({
  name: 'video-modal',
  module: VideoModalModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'settings',
    description: 'Settings modal with tabbed configuration panels',
    tags: ['modal', 'settings', 'tabs'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .trigger { padding: 10px 20px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal { background: #fff; border-radius: 12px; width: 560px; max-width: 90vw; max-height: 80vh; display: flex; flex-direction: column; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
    .header h3 { margin: 0; font-size: 18px; }
    .close { background: none; border: none; font-size: 18px; cursor: pointer; }
    .body { display: flex; flex: 1; min-height: 300px; }
    .tabs { display: flex; flex-direction: column; width: 160px; border-right: 1px solid #e5e7eb; padding: 12px 0; }
    .tab { padding: 10px 20px; background: none; border: none; text-align: left; cursor: pointer; font-size: 13px; color: #6b7280; }
    .tab.active { color: #6366f1; font-weight: 600; background: #ede9fe; }
    .panel { flex: 1; padding: 20px; }
    .panel h4 { margin: 0 0 8px; }
    .placeholder { font-size: 14px; color: #6b7280; }
    .footer { padding: 16px 24px; border-top: 1px solid #e5e7eb; text-align: right; }
    .btn { padding: 8px 24px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
  \`]
})
export class SettingsModalComponent {
  open = false;
  activeTab = 'General';
  tabs = ['General', 'Appearance', 'Notifications', 'Security'];
}

@NgModule({
  declarations: [SettingsModalComponent],
  imports: [BrowserModule],
  bootstrap: [SettingsModalComponent],
})
export class SettingsModalModule {}

export default createAngularMicroApp({
  name: 'settings-modal',
  module: SettingsModalModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'side-panel',
    description: 'Side panel modal that slides in from the right',
    tags: ['modal', 'side-panel', 'drawer'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .trigger { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .overlay { position: fixed; inset: 0; z-index: 50; display: flex; justify-content: flex-end; }
    .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
    .panel { position: relative; width: 400px; height: 100%; background: #fff; box-shadow: -4px 0 12px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #e5e7eb; }
    .header h3 { margin: 0; font-size: 18px; }
    .close { background: none; border: none; font-size: 18px; cursor: pointer; }
    .body { flex: 1; padding: 20px; overflow-y: auto; }
    .text { font-size: 14px; color: #6b7280; line-height: 1.6; }
  \`]
})
export class SidePanelComponent {
  open = false;
}

@NgModule({
  declarations: [SidePanelComponent],
  imports: [BrowserModule],
  bootstrap: [SidePanelComponent],
})
export class SidePanelModule {}

export default createAngularMicroApp({
  name: 'side-panel-modal',
  module: SidePanelModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'image-gallery',
    description: 'Image gallery modal with grid and full-view mode',
    tags: ['modal', 'gallery', 'images'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .trigger { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal { background: #fff; border-radius: 12px; width: 600px; max-width: 90vw; max-height: 80vh; overflow: hidden; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
    .header h3 { margin: 0; }
    .close { background: none; border: none; font-size: 18px; cursor: pointer; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; overflow-y: auto; max-height: 60vh; }
    .grid-item { aspect-ratio: 1; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .img-label { color: #fff; font-size: 12px; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
  \`]
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

@NgModule({
  declarations: [GalleryModalComponent],
  imports: [BrowserModule],
  bootstrap: [GalleryModalComponent],
})
export class GalleryModalModule {}

export default createAngularMicroApp({
  name: 'image-gallery-modal',
  module: GalleryModalModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'terms',
    description: 'Terms and conditions modal with scrollable content and accept button',
    tags: ['modal', 'terms', 'legal'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .trigger { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal { background: #fff; border-radius: 12px; width: 500px; max-width: 90vw; max-height: 80vh; display: flex; flex-direction: column; }
    .header { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
    .header h3 { margin: 0; font-size: 18px; }
    .body { flex: 1; overflow-y: auto; padding: 24px; }
    .text { font-size: 13px; color: #6b7280; line-height: 1.6; margin: 0 0 12px; }
    .footer { padding: 16px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 8px; }
    .btn-cancel { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
    .btn-primary { padding: 8px 20px; border: none; border-radius: 6px; background: #6366f1; color: #fff; cursor: pointer; font-weight: 600; }
  \`]
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

@NgModule({
  declarations: [TermsModalComponent],
  imports: [BrowserModule],
  bootstrap: [TermsModalComponent],
})
export class TermsModalModule {}

export default createAngularMicroApp({
  name: 'terms-modal',
  module: TermsModalModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'alert',
    description: 'Alert modal for displaying important messages with icon',
    tags: ['modal', 'alert', 'warning'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .trigger { padding: 10px 20px; background: #f59e0b; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal { background: #fff; border-radius: 12px; padding: 32px; width: 380px; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 12px; }
    .title { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
    .message { font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0 0 24px; }
    .actions { display: flex; flex-direction: column; gap: 8px; }
    .btn-primary { padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-link { background: none; border: none; color: #6b7280; cursor: pointer; font-size: 13px; }
  \`]
})
export class AlertModalComponent {
  open = false;
}

@NgModule({
  declarations: [AlertModalComponent],
  imports: [BrowserModule],
  bootstrap: [AlertModalComponent],
})
export class AlertModalModule {}

export default createAngularMicroApp({
  name: 'alert-modal',
  module: AlertModalModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'fullscreen',
    description: 'Fullscreen modal that covers the entire viewport',
    tags: ['modal', 'fullscreen', 'overlay'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .trigger { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .modal { position: fixed; inset: 0; background: #fff; z-index: 50; display: flex; flex-direction: column; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }
    .header h3 { margin: 0; font-size: 18px; }
    .close { background: none; border: none; font-size: 14px; cursor: pointer; color: #6b7280; }
    .body { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .text { font-size: 16px; color: #6b7280; text-align: center; max-width: 500px; }
  \`]
})
export class FullscreenModalComponent {
  open = false;
}

@NgModule({
  declarations: [FullscreenModalComponent],
  imports: [BrowserModule],
  bootstrap: [FullscreenModalComponent],
})
export class FullscreenModalModule {}

export default createAngularMicroApp({
  name: 'fullscreen-modal',
  module: FullscreenModalModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'drawer',
    description: 'Bottom drawer modal that slides up from the bottom',
    tags: ['modal', 'drawer', 'bottom'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .trigger { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .overlay { position: fixed; inset: 0; z-index: 50; display: flex; flex-direction: column; justify-content: flex-end; }
    .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
    .drawer { position: relative; background: #fff; border-radius: 16px 16px 0 0; padding: 12px 24px 32px; }
    .handle { width: 40px; height: 4px; background: #d1d5db; border-radius: 2px; margin: 0 auto 16px; }
    .title { font-size: 18px; font-weight: 700; margin: 0 0 16px; }
    .actions { display: flex; flex-direction: column; gap: 8px; }
    .action-btn { padding: 14px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 15px; cursor: pointer; text-align: left; }
    .action-btn:hover { background: #ede9fe; }
  \`]
})
export class DrawerModalComponent {
  open = false;
  actions = ['Share', 'Copy Link', 'Edit', 'Archive', 'Delete'];
}

@NgModule({
  declarations: [DrawerModalComponent],
  imports: [BrowserModule],
  bootstrap: [DrawerModalComponent],
})
export class DrawerModalModule {}

export default createAngularMicroApp({
  name: 'drawer-modal',
  module: DrawerModalModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'bottom-sheet',
    description: 'Bottom sheet modal with list of selectable options',
    tags: ['modal', 'bottom-sheet', 'select'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .trigger { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .overlay { position: fixed; inset: 0; z-index: 50; display: flex; flex-direction: column; justify-content: flex-end; }
    .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
    .sheet { position: relative; background: #fff; border-radius: 16px 16px 0 0; padding: 12px 24px 24px; max-height: 60vh; overflow-y: auto; }
    .handle { width: 40px; height: 4px; background: #d1d5db; border-radius: 2px; margin: 0 auto 16px; }
    .title { font-size: 16px; font-weight: 700; margin: 0 0 12px; }
    .options { display: flex; flex-direction: column; gap: 4px; }
    .option { display: flex; justify-content: space-between; padding: 14px 12px; background: none; border: none; border-radius: 8px; font-size: 15px; cursor: pointer; text-align: left; }
    .option:hover { background: #f3f4f6; }
    .option.selected { background: #ede9fe; color: #6366f1; }
    .check { color: #6366f1; font-weight: 700; }
  \`]
})
export class BottomSheetComponent {
  open = false;
  selected = 'Standard';
  options = ['Economy', 'Standard', 'Express', 'Priority', 'Same Day'];
}

@NgModule({
  declarations: [BottomSheetComponent],
  imports: [BrowserModule],
  bootstrap: [BottomSheetComponent],
})
export class BottomSheetModule {}

export default createAngularMicroApp({
  name: 'bottom-sheet-modal',
  module: BottomSheetModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'cookie-consent',
    description: 'Cookie consent modal with preference options',
    tags: ['modal', 'cookie', 'consent'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .banner { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #e5e7eb; padding: 24px; box-shadow: 0 -4px 12px rgba(0,0,0,0.1); z-index: 50; }
    .title { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .message { font-size: 13px; color: #6b7280; margin: 0 0 12px; }
    .options { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .option { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-outline { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
    .btn-primary { padding: 8px 20px; border: none; border-radius: 6px; background: #6366f1; color: #fff; cursor: pointer; font-weight: 600; }
  \`]
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

@NgModule({
  declarations: [CookieModalComponent],
  imports: [BrowserModule],
  bootstrap: [CookieModalComponent],
})
export class CookieModalModule {}

export default createAngularMicroApp({
  name: 'cookie-consent-modal',
  module: CookieModalModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'search',
    description: 'Search modal with input and recent search suggestions',
    tags: ['modal', 'search', 'command'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .trigger { padding: 10px 20px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; color: #6b7280; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-start; justify-content: center; padding-top: 120px; z-index: 50; }
    .modal { background: #fff; border-radius: 12px; width: 480px; max-width: 90vw; overflow: hidden; }
    .search-input { width: 100%; padding: 16px 20px; border: none; border-bottom: 1px solid #e5e7eb; font-size: 16px; outline: none; box-sizing: border-box; }
    .results { padding: 8px 0; max-height: 300px; overflow-y: auto; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9ca3af; padding: 8px 20px; }
    .result-item { display: block; padding: 10px 20px; text-decoration: none; color: #374151; font-size: 14px; }
    .result-item:hover { background: #f3f4f6; }
  \`]
})
export class SearchModalComponent {
  open = false;
  query = '';
  recent = ['Dashboard', 'User Settings', 'API Documentation', 'Billing', 'Team Members'];
  get filtered() { return this.recent.filter(r => r.toLowerCase().includes(this.query.toLowerCase())); }
}

@NgModule({
  declarations: [SearchModalComponent],
  imports: [BrowserModule],
  bootstrap: [SearchModalComponent],
})
export class SearchModalModule {}

export default createAngularMicroApp({
  name: 'search-modal',
  module: SearchModalModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'command-palette',
    description: 'Command palette modal with keyboard shortcut hint',
    tags: ['modal', 'command-palette', 'keyboard'],
    code: `import { Component, HostListener } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .hint { font-size: 13px; color: #9ca3af; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-start; justify-content: center; padding-top: 100px; z-index: 50; }
    .modal { background: #fff; border-radius: 12px; width: 500px; max-width: 90vw; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
    .input { width: 100%; padding: 16px 20px; border: none; border-bottom: 1px solid #e5e7eb; font-size: 15px; outline: none; box-sizing: border-box; }
    .commands { max-height: 300px; overflow-y: auto; padding: 4px 0; }
    .cmd { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px 20px; background: none; border: none; cursor: pointer; text-align: left; }
    .cmd:hover { background: #f3f4f6; }
    .cmd-label { font-size: 14px; color: #374151; }
    .cmd-shortcut { font-size: 12px; color: #9ca3af; background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-family: monospace; }
  \`]
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

@NgModule({
  declarations: [CommandPaletteComponent],
  imports: [BrowserModule],
  bootstrap: [CommandPaletteComponent],
})
export class CommandPaletteModule {}

export default createAngularMicroApp({
  name: 'command-palette-modal',
  module: CommandPaletteModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
];

export default templates;

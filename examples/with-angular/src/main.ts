import { createAngularMicroApp } from '@tuvix.js/angular';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { HomeAppModule } from './app/home.module';
import { ProfileAppModule } from './app/profile.module';
import { createOrchestrator } from '@tuvix.js/core';

// 1. Create the Angular Micro Apps (pass NgModule + platform from consumer's Angular)
const homeApp = createAngularMicroApp({ name: 'home', module: HomeAppModule, platform: platformBrowserDynamic, selector: 'app-home' });
const profileApp = createAngularMicroApp({ name: 'profile', module: ProfileAppModule, platform: platformBrowserDynamic, selector: 'app-profile' });

// 2. We expose the micro apps to the global scope since Angular CLI build outputs a single bundle for this example
(window as any).__TUVIX_HOME_APP__ = homeApp;
(window as any).__TUVIX_PROFILE_APP__ = profileApp;

// 3. Initialize Orchestrator
const orchestrator = createOrchestrator({
  onError(error: Error, appName: string) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'home',
  entry: { scripts: [] },
  container: '#home',
  activeWhen: () => true,
  props: { name: 'Alice' },
});

orchestrator.register({
  name: 'profile',
  entry: { scripts: [] },
  container: '#profile',
  activeWhen: () => true,
  props: { theme: 'dark' },
});

orchestrator.start();
console.log('🚀 Tuvix.js shell started (with-angular)');

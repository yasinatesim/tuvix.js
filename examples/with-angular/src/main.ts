import { createAngularMicroApp } from '@tuvix.js/angular';
import { HomeApp } from './app/home.component';
import { ProfileApp } from './app/profile.component';
import { createOrchestrator } from '@tuvix.js/core';

// 1. Create the Angular Micro Apps
const homeApp = createAngularMicroApp({ name: 'home', component: HomeApp });
const profileApp = createAngularMicroApp({ name: 'profile', component: ProfileApp });

// 2. We expose the micro apps to the global scope since Angular CLI build outputs a single bundle for this example
(window as any).__TUVIX_HOME_APP__ = homeApp;
(window as any).__TUVIX_PROFILE_APP__ = profileApp;

// 3. Initialize Orchestrator
const orchestrator = createOrchestrator({
  onError(error, appName) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'home',
  entry: { type: 'global', variable: '__TUVIX_HOME_APP__' },
  container: '#home',
  activeWhen: () => true,
  props: { name: 'Alice' },
});

orchestrator.register({
  name: 'profile',
  entry: { type: 'global', variable: '__TUVIX_PROFILE_APP__' },
  container: '#profile',
  activeWhen: () => true,
  props: { theme: 'dark' },
});

orchestrator.start();
console.log('🚀 Tuvix.js shell started (with-angular)');

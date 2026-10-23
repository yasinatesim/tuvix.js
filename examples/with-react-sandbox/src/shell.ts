import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  onError(error: Error, appName: string) {
    console.error(`[Shell] App "${appName}" failed:`, error);
  },
});

// sandbox: true renders app1 inside an open shadow root on #app1. Page CSS
// cannot select its elements and the <style> it renders stays inside.
orchestrator.register({
  name: 'app1',
  entry: () => import('./apps/app1/main'),
  container: '#app1',
  activeWhen: '/',
  sandbox: true,
});

// app2 renders into the light DOM, so the <style> it renders applies to the
// whole page. It is the control case.
orchestrator.register({
  name: 'app2',
  entry: () => import('./apps/app2/main'),
  container: '#app2',
  activeWhen: '/',
});

orchestrator.start();

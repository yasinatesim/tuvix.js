import { createOrchestrator } from '@tuvix.js/core';
const orchestrator = createOrchestrator({
    onError(error, appName) {
        console.error(`[Shell] App "${appName}" failed:`, error);
    },
});
orchestrator.register({
    name: 'react-app',
    entry: '/src/apps/react-app/main.tsx',
    container: '#react-app',
    activeWhen: () => true,
});
orchestrator.register({
    name: 'vue-app',
    entry: '/src/apps/vue-app/main.ts',
    container: '#vue-app',
    activeWhen: () => true,
});
orchestrator.start();
console.log('🚀 Tuvix.js shell started (with-multiple-frameworks)');
//# sourceMappingURL=shell.js.map
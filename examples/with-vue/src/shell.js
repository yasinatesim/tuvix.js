import { createOrchestrator } from '@tuvix.js/core';
const orchestrator = createOrchestrator({
    onError(error, appName) {
        console.error(`[Shell] App "${appName}" failed:`, error);
    },
});
orchestrator.register({
    name: 'home',
    entry: '/src/apps/home/main.ts',
    container: '#home',
    activeWhen: () => true,
    props: { name: 'Alice' },
});
orchestrator.register({
    name: 'profile',
    entry: '/src/apps/profile/main.ts',
    container: '#profile',
    activeWhen: () => true,
    props: { theme: 'dark' },
});
orchestrator.start();
console.log('🚀 Tuvix.js shell started (with-vue)');
//# sourceMappingURL=shell.js.map
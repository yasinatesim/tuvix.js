import { getGlobalBus } from '@tuvix.js/event-bus';
import { createReactMicroApp } from '@tuvix.js/react';
import SidebarApp from './SidebarApp';

// Each app reads the shared bus itself instead of receiving it from the shell.
function Root() {
  return <SidebarApp bus={getGlobalBus()} />;
}

export default createReactMicroApp({ name: 'sidebar', App: Root });

import { getGlobalBus } from '@tuvix.js/event-bus';
import { createReactMicroApp } from '@tuvix.js/react';
import HeaderApp from './HeaderApp';

// Each app reads the shared bus itself instead of receiving it from the shell.
function Root() {
  return <HeaderApp bus={getGlobalBus()} />;
}

export default createReactMicroApp({ name: 'header', App: Root });

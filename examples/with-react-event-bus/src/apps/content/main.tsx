import { getGlobalBus } from '@tuvix.js/event-bus';
import { createReactMicroApp } from '@tuvix.js/react';
import ContentApp from './ContentApp';

// Each app reads the shared bus itself instead of receiving it from the shell.
function Root() {
  return <ContentApp bus={getGlobalBus()} />;
}

export default createReactMicroApp({ name: 'content', App: Root });

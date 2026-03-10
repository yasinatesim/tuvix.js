import express from 'express';
import { composeHTML } from '@tuvix.js/server';
import React from 'react';
import { renderToString } from 'react-dom/server';

const app = express();
const port = 3000;

// Basic html shell template
// Notice the `<tuvix-slot name="app-name">` elements. The server renderer will inject matched fragments here.
const shellTemplate = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tuvix.js — SSR React Integration</title>
    <style>
      body { margin: 0; background: #0f0f1a; color: #e0e0e0; font-family: system-ui; }
      nav { padding: 16px 24px; background: #16213e; }
      nav a { color: #93c5fd; text-decoration: none; font-weight: bold; margin-right: 16px; }
      .container { padding: 24px; max-width: 900px; margin: 0 auto; }
      h1 { margin-bottom: 24px; }
    </style>
  </head>
  <body>
    <nav>
      <span>⬡ Tuvix.js Server Integration</span>
      <span style="float:right; color: #666">Server-Side Rendered</span>
    </nav>
    <div class="container">
      <h1>Dashboard SSR</h1>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- Tuvix will inject the "left-service" HTML here -->
        <tuvix-slot name="left-service">
          <div style="padding: 24px; background: #222; border-radius: 8px;">
            Loading left service fallback...
          </div>
        </tuvix-slot>

        <!-- Tuvix will inject the "right-service" HTML here -->
        <tuvix-slot name="right-service">
           <div style="padding: 24px; background: #222; border-radius: 8px;">
            Loading right service fallback...
          </div>
        </tuvix-slot>
      </div>
    </div>
  </body>
</html>
`;

// Simple React components that represent our "services"
function LeftApp() {
  return React.createElement('div', { style: { padding: '24px', background: '#30475e', borderRadius: '8px' } },
    React.createElement('h2', { style: { marginTop: 0, color: '#f05454' } }, 'Left Service (React)'),
    React.createElement('p', null, 'This chunk of HTML was rendered by React on the server and injected into the Tuvix template stream.')
  );
}

function RightApp() {
  return React.createElement('div', { style: { padding: '24px', background: '#222831', borderRadius: '8px' } },
    React.createElement('h2', { style: { marginTop: 0, color: '#f2a365' } }, 'Right Service (React)'),
    React.createElement('p', null, 'This chunk of HTML was also rendered server-side in a separate fragment.')
  );
}

// Define our page route
app.get('/', (req, res) => {
  console.log('[Express] rendering /');

  // Render each micro-app fragment server-side.
  // In a real microservice setup, these might be fetch calls to remote endpoints.
  const slots = {
    'left-service': renderToString(React.createElement(LeftApp)),
    'right-service': renderToString(React.createElement(RightApp)),
  };

  // Stitch the fragments into the shell template via Tuvix slot replacement.
  const finalHtml = composeHTML(shellTemplate, slots);
  res.setHeader('Content-Type', 'text/html');
  res.send(finalHtml);
});

// Only start the server when run directly, not when imported by tests
if (process.argv[1] === new URL(import.meta.url).pathname) {
  app.listen(port, () => {
    console.log(`🚀 SSR example running at http://localhost:${port}`);
  });
}

export { app };

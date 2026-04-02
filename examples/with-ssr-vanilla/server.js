import express from 'express';
import { composeHTML } from '@tuvix.js/server';

const app = express();
const port = 3001;

// Basic html shell template
// Notice the `<tuvix-slot name="app-name">` elements. The server renderer will inject matched fragments here.
const shellTemplate = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tuvix.js — SSR Vanilla JS Integration</title>
    <style>
      body { margin: 0; background: #0f0f1a; color: #e0e0e0; font-family: system-ui; }
      nav { padding: 16px 24px; background: #16213e; }
      nav span { color: #93c5fd; font-weight: bold; }
      .container { padding: 24px; max-width: 900px; margin: 0 auto; }
      h1 { margin-bottom: 24px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
      .card { padding: 24px; background: #222; border-radius: 8px; }
    </style>
  </head>
  <body>
    <nav>
      <span>⬡ Tuvix.js Server Integration (Vanilla JS)</span>
      <span style="float:right; color: #666">Server-Side Rendered</span>
    </nav>
    <div class="container">
      <h1>Dashboard SSR</h1>
      <div class="grid">
        <!-- Tuvix will inject the "left-service" HTML here -->
        <tuvix-slot name="left-service">
          <div class="card">Loading left service fallback...</div>
        </tuvix-slot>

        <!-- Tuvix will inject the "right-service" HTML here -->
        <tuvix-slot name="right-service">
          <div class="card">Loading right service fallback...</div>
        </tuvix-slot>
      </div>
    </div>
  </body>
</html>
`;

// Simple HTML fragment renderers — pure vanilla, no framework
function renderLeftService() {
  return `
    <div style="padding: 24px; background: #30475e; border-radius: 8px;">
      <h2 style="margin-top: 0; color: #f05454;">Left Service (Vanilla JS)</h2>
      <p>This HTML fragment was composed on the server using plain JavaScript and injected into the Tuvix template.</p>
    </div>
  `;
}

function renderRightService() {
  return `
    <div style="padding: 24px; background: #222831; border-radius: 8px;">
      <h2 style="margin-top: 0; color: #f2a365;">Right Service (Vanilla JS)</h2>
      <p>This fragment was also rendered server-side — no framework, just a plain function returning an HTML string.</p>
    </div>
  `;
}

// Define our page route
app.get('/', (req, res) => {
  console.log('[Express] rendering /');

  const slots = {
    'left-service': renderLeftService(),
    'right-service': renderRightService(),
  };

  // Stitch the fragments into the shell template via Tuvix slot replacement.
  const finalHtml = composeHTML(shellTemplate, slots);
  res.setHeader('Content-Type', 'text/html');
  res.send(finalHtml);
});

// Only start the server when run directly, not when imported by tests
if (process.argv[1] === new URL(import.meta.url).pathname) {
  app.listen(port, () => {
    console.log(`🚀 SSR Vanilla example running at http://localhost:${port}`);
  });
}

export { app };

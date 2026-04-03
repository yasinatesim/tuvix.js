const TUVIX_VERSION = '0.1.4';

const BUILTIN_IMPORTS: Record<string, string> = {
  'tuvix.js': `https://esm.sh/tuvix.js@${TUVIX_VERSION}`,
  '@tuvix.js/core': `https://esm.sh/@tuvix.js/core@${TUVIX_VERSION}`,
  '@tuvix.js/loader': `https://esm.sh/@tuvix.js/loader@${TUVIX_VERSION}`,
  '@tuvix.js/router': `https://esm.sh/@tuvix.js/router@${TUVIX_VERSION}`,
  '@tuvix.js/event-bus': `https://esm.sh/@tuvix.js/event-bus@${TUVIX_VERSION}`,
  '@tuvix.js/sandbox': `https://esm.sh/@tuvix.js/sandbox@${TUVIX_VERSION}`,
};

interface BuildFrameOptions {
  compiledCode: string;
  extraImports?: Record<string, string>;
}

export function buildFrame({ compiledCode, extraImports = {} }: BuildFrameOptions): string {
  // Extra imports merged in first; built-ins override any conflicts
  const imports = { ...extraImports, ...BUILTIN_IMPORTS };

  // Escape </script> to prevent injection
  const safeCode = compiledCode.replaceAll('</script>', '<\\/script>');

  const importmap = JSON.stringify({ imports }, null, 2);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script type="importmap">${importmap}<\/script>
  <script>
    ['log', 'warn', 'error'].forEach(function(method) {
      var original = console[method];
      console[method] = function() {
        var args = Array.prototype.slice.call(arguments).map(String);
        parent.postMessage({ type: 'console', level: method, args: args }, '*');
        original.apply(console, arguments);
      };
    });
    window.onerror = function(msg, _src, line, col) {
      parent.postMessage({ type: 'runtime-error', msg: String(msg), line: line, col: col }, '*');
    };
    window.addEventListener('unhandledrejection', function(e) {
      parent.postMessage({ type: 'runtime-error', msg: String(e.reason) }, '*');
    });
  <\/script>
</head>
<body>
  <div id="app"></div>
  <script type="module">
${safeCode}
parent.postMessage({ type: 'mounted' }, '*');
  <\/script>
</body>
</html>`;
}

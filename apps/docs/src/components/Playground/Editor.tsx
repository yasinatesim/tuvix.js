import MonacoEditor, { type OnChange, type BeforeMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface EditorProps {
  value: string;
  onChange: OnChange;
  readOnly?: boolean;
  height: number;
  markers?: editor.IMarkerData[];
}

// Configure Monaco to find its workers via CDN
// Note: @monaco-editor/react loads workers from CDN by default — this explicit
// configuration is optional but avoids CDN dependency surprises.
const beforeMount: BeforeMount = (_monaco) => {
  window.MonacoEnvironment = {
    getWorkerUrl(_moduleId: string, label: string) {
      if (label === 'typescript' || label === 'javascript') {
        return 'https://cdn.jsdelivr.net/npm/monaco-editor/esm/vs/language/typescript/ts.worker.js';
      }
      return 'https://cdn.jsdelivr.net/npm/monaco-editor/esm/vs/editor/editor.worker.js';
    },
  };

  // Suppress "Cannot find module 'tuvix.js'" errors in Monaco — imports resolve at runtime via importmap
  _monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });
};

export function Editor({ value, onChange, readOnly = false, height, markers = [] }: EditorProps) {
  return (
    <MonacoEditor
      height={height}
      language="typescript"
      value={value}
      onChange={onChange}
      beforeMount={beforeMount}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        theme: 'vs-dark',
        padding: { top: 12 },
      }}
    />
  );
}

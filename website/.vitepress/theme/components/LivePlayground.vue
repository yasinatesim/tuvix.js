<template>
  <div class="live-playground">

    <!-- Tab bar -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id, soon: tab.soon }"
        @click="!tab.soon && switchTab(tab.id)"
      >
        <span class="tab-icon" v-html="tab.icon" />
        {{ tab.label }}
        <span v-if="tab.soon" class="soon-badge">soon</span>
      </button>
    </div>

    <!-- Body -->
    <div class="playground-body">

      <!-- Editor -->
      <div class="editor-pane">
        <div class="pane-header">
          <span>Editor</span>
          <span v-if="compiling" class="compiling-pill">Compiling…</span>
        </div>
        <div ref="editorEl" class="editor-mount" />
      </div>

      <!-- Right: preview + console -->
      <div class="right-pane">
        <div class="preview-pane">
          <div class="pane-header">
            <span><span class="live-dot" />Preview</span>
          </div>
          <iframe
            ref="iframeEl"
            class="preview-frame"
            sandbox="allow-scripts"
            title="Live Preview"
          />
        </div>

        <div class="console-pane">
          <div class="pane-header">
            <span>Console</span>
            <button class="clear-btn" @click="messages = []">Clear</button>
          </div>
          <div class="console-body">
            <div
              v-for="(msg, i) in messages"
              :key="i"
              class="console-msg"
              :class="msg.kind"
            >
              <span class="msg-icon">{{ ICONS[msg.kind] }}</span>
              <span class="msg-text">{{ msg.text }}</span>
              <span v-if="msg.line" class="msg-loc">:{{ msg.line }}</span>
            </div>
            <div v-if="!messages.length" class="console-empty">No output yet</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

// ── Tab definitions ────────────────────────────────────────────────
const VANILLA_CODE = `import { defineMicroApp } from 'tuvix.js';

let todos = ['Learn tuvix.js', 'Build micro-apps'];

function render(container) {
  container.innerHTML = \`
    <div style="font-family:sans-serif;padding:24px;max-width:420px">
      <h2 style="color:#00e5a0;margin:0 0 16px;font-size:20px">
        Todo — Vanilla JS
      </h2>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <input id="inp" placeholder="Add todo…"
          style="flex:1;padding:8px 12px;border:1px solid #2d3748;border-radius:6px;
                 background:#0d1117;color:#e2e8f0;outline:none;font-size:14px">
        <button onclick="window.__addTodo()"
          style="padding:8px 16px;background:#00e5a0;color:#000;border:none;
                 border-radius:6px;cursor:pointer;font-weight:600;font-size:14px">Add</button>
      </div>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px">
        \${todos.map((t, i) => \`
          <li style="display:flex;align-items:center;padding:10px 12px;
                     background:#0d1117;border:1px solid #1e2d3d;border-radius:6px">
            <span style="flex:1;color:#e2e8f0;font-size:14px">\${t}</span>
            <button onclick="window.__removeTodo(\${i})"
              style="background:none;border:none;color:#5c7080;cursor:pointer;
                     font-size:16px;padding:0 4px;line-height:1">×</button>
          </li>
        \`).join('')}
      </ul>
    </div>
  \`;
}

const app = defineMicroApp({
  name: 'todo-vanilla',
  mount({ container }) {
    window.__addTodo = () => {
      const el = document.getElementById('inp');
      if (el?.value.trim()) { todos.push(el.value.trim()); el.value = ''; render(container); }
    };
    window.__removeTodo = (i) => { todos.splice(i, 1); render(container); };
    render(container);
  },
  unmount({ container }) { container.innerHTML = ''; },
});

app.mount({ container: document.getElementById('app') });
`;

const REACT_CODE = `import { defineMicroApp } from 'tuvix.js';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

function TodoApp() {
  const [todos, setTodos] = useState(['Learn tuvix.js', 'Build micro-apps']);
  const [input, setInput] = useState('');

  const add = () => {
    if (input.trim()) { setTodos(p => [...p, input.trim()]); setInput(''); }
  };

  const s = {
    wrap: { fontFamily:'sans-serif', padding:24, maxWidth:420 },
    h2:   { color:'#00e5a0', margin:'0 0 16px', fontSize:20 },
    row:  { display:'flex', gap:8, marginBottom:16 },
    inp:  { flex:1, padding:'8px 12px', border:'1px solid #2d3748', borderRadius:6,
            background:'#0d1117', color:'#e2e8f0', outline:'none', fontSize:14 },
    btn:  { padding:'8px 16px', background:'#00e5a0', color:'#000', border:'none',
            borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:14 },
    ul:   { listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:6 },
    li:   { display:'flex', alignItems:'center', padding:'10px 12px',
            background:'#0d1117', border:'1px solid #1e2d3d', borderRadius:6 },
    x:    { background:'none', border:'none', color:'#5c7080', cursor:'pointer', fontSize:16, padding:'0 4px', lineHeight:1 },
  };

  return (
    <div style={s.wrap}>
      <h2 style={s.h2}>Todo — React</h2>
      <div style={s.row}>
        <input style={s.inp} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add todo…" />
        <button style={s.btn} onClick={add}>Add</button>
      </div>
      <ul style={s.ul}>
        {todos.map((t, i) => (
          <li key={i} style={s.li}>
            <span style={{ flex:1, color:'#e2e8f0', fontSize:14 }}>{t}</span>
            <button style={s.x} onClick={() => setTodos(todos.filter((_, j) => j !== i))}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const app = defineMicroApp({
  name: 'todo-react',
  mount({ container }) { createRoot(container).render(<TodoApp />); },
  unmount({ container }) { container.innerHTML = ''; },
});

app.mount({ container: document.getElementById('app') });
`;

const VUE_CODE = `import { defineMicroApp } from 'tuvix.js';
import { createApp, ref } from 'vue';

const app = defineMicroApp({
  name: 'todo-vue',
  mount({ container }) {
    createApp({
      setup() {
        const todos = ref(['Learn tuvix.js', 'Build micro-apps']);
        const input = ref('');
        const add = () => {
          if (input.value.trim()) { todos.value.push(input.value.trim()); input.value = ''; }
        };
        const remove = (i) => todos.value.splice(i, 1);
        return { todos, input, add, remove };
      },
      template: \`
        <div style="font-family:sans-serif;padding:24px;max-width:420px">
          <h2 style="color:#00e5a0;margin:0 0 16px;font-size:20px">Todo — Vue</h2>
          <div style="display:flex;gap:8px;margin-bottom:16px">
            <input v-model="input" @keydown.enter="add" placeholder="Add todo…"
              style="flex:1;padding:8px 12px;border:1px solid #2d3748;border-radius:6px;
                     background:#0d1117;color:#e2e8f0;outline:none;font-size:14px" />
            <button @click="add"
              style="padding:8px 16px;background:#00e5a0;color:#000;border:none;
                     border-radius:6px;cursor:pointer;font-weight:600;font-size:14px">Add</button>
          </div>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px">
            <li v-for="(t, i) in todos" :key="i"
              style="display:flex;align-items:center;padding:10px 12px;
                     background:#0d1117;border:1px solid #1e2d3d;border-radius:6px">
              <span style="flex:1;color:#e2e8f0;font-size:14px">{{ t }}</span>
              <button @click="remove(i)"
                style="background:none;border:none;color:#5c7080;cursor:pointer;font-size:16px;padding:0 4px;line-height:1">×</button>
            </li>
          </ul>
        </div>
      \`,
    }).mount(container);
  },
  unmount({ container }) { container.innerHTML = ''; },
});

app.mount({ container: document.getElementById('app') });
`;

const tabs = [
  { id: 'vanilla', label: 'Vanilla JS', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><text y="18" font-size="18">JS</text></svg>', code: VANILLA_CODE, soon: false },
  { id: 'react',   label: 'React',      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#61dafb"><circle cx="12" cy="12" r="2.5"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61dafb" stroke-width="1.5" fill="none"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61dafb" stroke-width="1.5" fill="none" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61dafb" stroke-width="1.5" fill="none" transform="rotate(120 12 12)"/></svg>', code: REACT_CODE, soon: false },
  { id: 'vue',     label: 'Vue',        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#42b883"><path d="M2 3h3.5L12 15 18.5 3H22L12 21 2 3z"/><path d="M6.5 3h3L12 8.5 14.5 3h3L12 14 6.5 3z" fill="#35495e"/></svg>', code: VUE_CODE, soon: false },
  { id: 'svelte',  label: 'Svelte',     icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#ff3e00"><path d="M20.7 3.6C18.3.7 14.2.2 11.3 2.4L5.6 6.7c-1.3 1-2.1 2.4-2.3 4-.2 1.3.1 2.6.8 3.7-.5.8-.8 1.7-.9 2.6-.2 1.7.3 3.4 1.4 4.7 2.4 2.9 6.5 3.4 9.4 1.2l5.7-4.3c1.3-1 2.1-2.4 2.3-4 .2-1.3-.1-2.6-.8-3.7.5-.8.8-1.7.9-2.6.2-1.7-.3-3.4-1.4-4.7z"/></svg>', code: '', soon: true },
  { id: 'angular', label: 'Angular',    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#dd0031"><path d="M12 2L2 6.5l1.6 13.1L12 22l8.4-2.4L22 6.5 12 2zm0 2.2l7.2 3.1-1.3 10.8L12 19.8l-5.9-1.7-1.3-10.8L12 4.2z"/><path d="M12 6.5L8.3 15.5h1.4l.8-1.9h3l.8 1.9h1.4L12 6.5zm0 2.7l1.1 2.7H11l1-2.7z" fill="#fff"/></svg>', code: '', soon: true },
];

// ── Constants ──────────────────────────────────────────────────────
const TUVIX = '0.1.4';
const BASE_IMPORTS: Record<string, string> = {
  'tuvix.js':          `https://esm.sh/tuvix.js@${TUVIX}`,
  '@tuvix.js/core':    `https://esm.sh/@tuvix.js/core@${TUVIX}`,
  '@tuvix.js/loader':  `https://esm.sh/@tuvix.js/loader@${TUVIX}`,
  '@tuvix.js/router':  `https://esm.sh/@tuvix.js/router@${TUVIX}`,
  '@tuvix.js/event-bus': `https://esm.sh/@tuvix.js/event-bus@${TUVIX}`,
  '@tuvix.js/sandbox': `https://esm.sh/@tuvix.js/sandbox@${TUVIX}`,
};
const REACT_IMPORTS: Record<string, string> = {
  'react':             'https://esm.sh/react@18',
  'react-dom':         'https://esm.sh/react-dom@18',
  'react-dom/client':  'https://esm.sh/react-dom@18/client',
  'react/jsx-runtime': 'https://esm.sh/react@18/jsx-runtime',
};
const VUE_IMPORTS: Record<string, string> = {
  'vue': 'https://esm.sh/vue@3',
};

const ICONS: Record<string, string> = {
  log: '›', warn: '⚠', error: '✕', 'runtime-error': '❌', success: '✓',
};

// Build closing script tag via unicode to avoid confusing the Vue SFC parser
const CS = '<\u002Fscript>';

function buildSrcdoc(compiledCode: string, tabId: string): string {
  const extra = tabId === 'react' ? REACT_IMPORTS : tabId === 'vue' ? VUE_IMPORTS : {};
  const imports = { ...BASE_IMPORTS, ...extra };
  const importmap = JSON.stringify({ imports }, null, 2);
  const safeCode = compiledCode.replaceAll('<' + '/script>', '<\\/' + 'script>');
  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8">',
    '<style>*{box-sizing:border-box}body{margin:0;background:#080c10;color:#e2e8f0}</style>',
    '<script type="importmap">', importmap, CS,
    '<script>',
    "['log','warn','error'].forEach(m=>{const o=console[m];console[m]=(...a)=>{parent.postMessage({type:'console',level:m,args:a.map(String)},'*');o.apply(console,a)};});",
    "window.onerror=(msg,_,line,col)=>{parent.postMessage({type:'runtime-error',msg,line,col},'*');};",
    "window.addEventListener('unhandledrejection',e=>{parent.postMessage({type:'runtime-error',msg:String(e.reason)},'*');});",
    CS,
    '</head><body><div id="app"></div>',
    '<script type="module">', safeCode, "\nparent.postMessage({type:'mounted'},'*');", CS,
    '</body></html>',
  ].join('');
}

// ── State ──────────────────────────────────────────────────────────
const activeTab = ref('vanilla');
const editorEl  = ref<HTMLElement>();
const iframeEl  = ref<HTMLIFrameElement>();
const messages  = ref<{ kind: string; text: string; line?: number }[]>([]);
const compiling = ref(false);

let esbuild: typeof import('esbuild-wasm') | null = null;
let editorInstance: import('monaco-editor').editor.IStandaloneCodeEditor | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let compileId = 0;

// ── Compile ────────────────────────────────────────────────────────
async function compile(code: string, tabId: string, id: number) {
  if (!esbuild) return;
  compiling.value = true;
  try {
    const isReact = tabId === 'react';
    const result = await esbuild.transform(code, {
      loader:         isReact ? 'tsx' : 'ts',
      format:         'esm',
      target:         'es2020',
      jsx:            isReact ? 'automatic' : undefined,
      jsxImportSource: isReact ? 'react' : undefined,
    });
    if (id !== compileId) return;
    messages.value = [{ kind: 'success', text: `Compiled in ${result.code.length > 0 ? '~' : ''}${Math.round(performance.now() % 1000)}ms` }];
    if (iframeEl.value) iframeEl.value.srcdoc = buildSrcdoc(result.code, tabId);
  } catch (err: unknown) {
    if (id !== compileId) return;
    const e = err as { errors?: { text: string; location?: { line: number } }[]; message?: string };
    const first = e.errors?.[0];
    messages.value = [{ kind: 'error', text: `Build error: ${first?.text ?? e.message ?? String(err)}`, line: first?.location?.line }];
    if (iframeEl.value) iframeEl.value.srcdoc = '';
  } finally {
    if (id === compileId) compiling.value = false;
  }
}

function scheduleCompile(code: string) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    compileId++;
    compile(code, activeTab.value, compileId);
  }, 300);
}

function switchTab(tabId: string) {
  activeTab.value = tabId;
  const tab = tabs.find(t => t.id === tabId)!;
  editorInstance?.setValue(tab.code);
  messages.value = [];
  scheduleCompile(tab.code);
}

function onMessage(e: MessageEvent) {
  if (e.source !== iframeEl.value?.contentWindow) return;
  const d = e.data;
  if (d?.type === 'console')      messages.value.push({ kind: d.level, text: d.args.join(' ') });
  if (d?.type === 'runtime-error') messages.value.push({ kind: 'runtime-error', text: `Runtime: ${d.msg}`, line: d.line });
}

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(async () => {
  window.addEventListener('message', onMessage);

  const eb = await import('esbuild-wasm');
  await eb.initialize({ wasmURL: '/esbuild.wasm' });
  esbuild = eb;

  const loader = await import('@monaco-editor/loader');
  const monaco = await loader.default.init();
  if (!editorEl.value) return;

  editorInstance = monaco.editor.create(editorEl.value, {
    value:               tabs[0].code,
    language:            'typescript',
    theme:               'vs-dark',
    fontSize:            13,
    fontFamily:          "'JetBrains Mono', ui-monospace, monospace",
    minimap:             { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers:         'on',
    tabSize:             2,
    automaticLayout:     true,
    padding:             { top: 12 },
    wordWrap:            'on',
  });

  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation:   false,
  });

  editorInstance.onDidChangeModelContent(() => scheduleCompile(editorInstance!.getValue()));
  scheduleCompile(tabs[0].code);
});

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage);
  editorInstance?.dispose();
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>

<style scoped>
.live-playground {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--vp-nav-height, 64px));
  background: var(--vp-c-bg);
  border-top: 1px solid var(--vp-c-divider);
}

/* ── Tab bar ───────────────────────────────────────── */
.tab-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px 16px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  flex-shrink: 0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: none;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--vp-font-family-base);
}

.tab-btn:hover:not(.soon) {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}

.tab-btn.active {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-divider);
}

.tab-btn.soon {
  opacity: 0.45;
  cursor: not-allowed;
}

.soon-badge {
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(0, 229, 160, 0.1);
  color: var(--vp-c-brand-1);
  border: 1px solid rgba(0, 229, 160, 0.2);
}

/* ── Body ──────────────────────────────────────────── */
.playground-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* ── Pane header ───────────────────────────────────── */
.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 12px;
  background: var(--vp-c-bg-mute);
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}

.compiling-pill {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  background: rgba(0, 229, 160, 0.1);
  color: var(--vp-c-brand-1);
  animation: fade 0.6s ease-in-out infinite alternate;
}

@keyframes fade { from { opacity: 1 } to { opacity: 0.4 } }

.live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  margin-right: 6px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }

/* ── Editor pane ───────────────────────────────────── */
.editor-pane {
  display: flex;
  flex-direction: column;
  width: 55%;
  border-right: 1px solid var(--vp-c-divider);
  min-width: 0;
}

.editor-mount {
  flex: 1;
  overflow: hidden;
}

/* ── Right pane ────────────────────────────────────── */
.right-pane {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.preview-pane {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.preview-frame {
  flex: 1;
  border: none;
  background: #080c10;
  width: 100%;
}

/* ── Console ───────────────────────────────────────── */
.console-pane {
  display: flex;
  flex-direction: column;
  height: 130px;
  flex-shrink: 0;
}

.clear-btn {
  background: none;
  border: none;
  color: var(--vp-c-text-3);
  font-size: 10px;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}

.clear-btn:hover { color: var(--vp-c-text-2); }

.console-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 10px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
}

.console-msg {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 2px 0;
  line-height: 1.5;
}

.console-msg.log .msg-text        { color: var(--vp-c-text-2); }
.console-msg.warn .msg-text       { color: #e5b700; }
.console-msg.error .msg-text,
.console-msg.runtime-error .msg-text { color: #f87171; }
.console-msg.success .msg-text    { color: var(--vp-c-brand-1); }

.msg-icon { flex-shrink: 0; opacity: 0.6; }
.msg-loc  { margin-left: auto; color: var(--vp-c-text-3); font-size: 10px; }

.console-empty {
  color: var(--vp-c-text-3);
  font-size: 12px;
  padding: 2px 0;
}

/* ── Mobile ────────────────────────────────────────── */
@media (max-width: 768px) {
  .live-playground { height: auto; }
  .playground-body { flex-direction: column; }
  .editor-pane { width: 100%; height: 300px; border-right: none; border-bottom: 1px solid var(--vp-c-divider); }
  .right-pane { height: 400px; }
}
</style>

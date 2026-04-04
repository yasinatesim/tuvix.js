<template>
  <div class="live-playground">

    <div class="tab-bar">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="switchTab(tab.id)"
      >
        <span class="tab-icon" v-html="tab.icon" />
        {{ tab.label }}
      </button>
    </div>

    <div class="playground-body">
      <div class="editor-pane">
        <div class="pane-header">
          <span>{{ activeTabObj?.file }}</span>
          <span v-if="compiling" class="compiling-pill">Compiling…</span>
        </div>
        <div ref="editorEl" class="editor-mount" />
      </div>

      <div class="right-pane">
        <div class="preview-pane">
          <div class="pane-header"><span class="live-dot" />Preview</div>
          <iframe ref="iframeEl" class="preview-frame" sandbox="allow-scripts" title="Live Preview" />
        </div>
        <div class="console-pane">
          <div class="pane-header">
            Console
            <button class="clear-btn" @click="messages = []">Clear</button>
          </div>
          <div class="console-body">
            <div v-for="(msg, i) in messages" :key="i" class="console-msg" :class="msg.kind">
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

// ── Closing script tag via unicode — keeps Vue SFC parser happy ────
const CS = '<\u002Fscript>';

// ── Icons ──────────────────────────────────────────────────────────
const ICONS: Record<string, string> = {
  log: '›', warn: '⚠', error: '✕', 'runtime-error': '❌', success: '✓',
};

// ── Code examples ──────────────────────────────────────────────────
const VANILLA_CODE = `import { defineMicroApp } from 'tuvix.js';

let todos = ['Learn tuvix.js', 'Build micro-apps'];

function render(el: HTMLElement) {
  el.innerHTML = \`
    <div style="font-family:sans-serif;padding:24px;max-width:420px">
      <h2 style="color:#00e5a0;margin:0 0 16px;font-size:20px">Todo — Vanilla JS</h2>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <input id="inp" placeholder="Add todo…"
          style="flex:1;padding:8px 12px;border:1px solid #2d3748;border-radius:6px;
                 background:#0d1117;color:#e2e8f0;outline:none;font-size:14px">
        <button onclick="__add()"
          style="padding:8px 16px;background:#00e5a0;color:#000;border:none;
                 border-radius:6px;cursor:pointer;font-weight:600;font-size:14px">Add</button>
      </div>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px">
        \${todos.map((t, i) => \`
          <li style="display:flex;align-items:center;padding:10px 12px;
                     background:#0d1117;border:1px solid #1e2d3d;border-radius:6px">
            <span style="flex:1;color:#e2e8f0;font-size:14px">\${t}</span>
            <button onclick="__rm(\${i})"
              style="background:none;border:none;color:#5c7080;cursor:pointer;font-size:18px;line-height:1">×</button>
          </li>\`).join('')}
      </ul>
    </div>\`;
}

const app = defineMicroApp({
  name: 'todo-vanilla',
  mount({ container }) {
    window.__add = () => {
      const inp = document.getElementById('inp') as HTMLInputElement;
      if (inp?.value.trim()) { todos.push(inp.value.trim()); inp.value = ''; render(container); }
    };
    window.__rm = (i: number) => { todos.splice(i, 1); render(container); };
    render(container);
  },
  unmount({ container }) { container.innerHTML = ''; },
});

app.mount({ container: document.getElementById('app')! });
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
    ul:   { listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column' as const, gap:6 },
    li:   { display:'flex', alignItems:'center', padding:'10px 12px', marginBottom:0,
            background:'#0d1117', border:'1px solid #1e2d3d', borderRadius:6 },
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
            <button onClick={() => setTodos(todos.filter((_, j) => j !== i))}
              style={{ background:'none', border:'none', color:'#5c7080', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
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

app.mount({ container: document.getElementById('app')! });
`;

const VUE_CODE = `<template>
  <div style="font-family:sans-serif;padding:24px;max-width:420px">
    <h2 style="color:#00e5a0;margin:0 0 16px;font-size:20px">Todo — Vue</h2>
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <input v-model="input" @keydown.enter="add" placeholder="Add todo…"
        style="flex:1;padding:8px 12px;border:1px solid #2d3748;border-radius:6px;background:#0d1117;color:#e2e8f0;outline:none;font-size:14px" />
      <button @click="add"
        style="padding:8px 16px;background:#00e5a0;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px">
        Add
      </button>
    </div>
    <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px">
      <li v-for="(t, i) in todos" :key="i"
        style="display:flex;align-items:center;padding:10px 12px;background:#0d1117;border:1px solid #1e2d3d;border-radius:6px">
        <span style="flex:1;color:#e2e8f0;font-size:14px">{{ t }}</span>
        <button @click="remove(i)"
          style="background:none;border:none;color:#5c7080;cursor:pointer;font-size:18px;line-height:1">×</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const todos = ref(['Learn tuvix.js', 'Build micro-apps']);
const input = ref('');

const add = () => {
  if (input.value.trim()) { todos.value.push(input.value.trim()); input.value = ''; }
};
const remove = (i: number) => todos.value.splice(i, 1);
${CS}
`;

const SVELTE_CODE = `<script lang="ts">
  import { defineMicroApp } from 'tuvix.js';

  let todos: string[] = ['Learn tuvix.js', 'Build micro-apps'];
  let input = '';

  function add() {
    if (input.trim()) { todos = [...todos, input.trim()]; input = ''; }
  }
  function remove(i: number) {
    todos = todos.filter((_, j) => j !== i);
  }
${CS}

<div style="font-family:sans-serif;padding:24px;max-width:420px">
  <h2 style="color:#00e5a0;margin:0 0 16px;font-size:20px">Todo — Svelte</h2>
  <div style="display:flex;gap:8px;margin-bottom:16px">
    <input bind:value={input} on:keydown={(e) => e.key === 'Enter' && add()} placeholder="Add todo…"
      style="flex:1;padding:8px 12px;border:1px solid #2d3748;border-radius:6px;background:#0d1117;color:#e2e8f0;outline:none;font-size:14px" />
    <button on:click={add}
      style="padding:8px 16px;background:#00e5a0;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px">
      Add
    </button>
  </div>
  <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px">
    {#each todos as todo, i}
      <li style="display:flex;align-items:center;padding:10px 12px;background:#0d1117;border:1px solid #1e2d3d;border-radius:6px">
        <span style="flex:1;color:#e2e8f0;font-size:14px">{todo}</span>
        <button on:click={() => remove(i)}
          style="background:none;border:none;color:#5c7080;cursor:pointer;font-size:18px;line-height:1">×</button>
      </li>
    {/each}
  </ul>
</div>
`;

const ANGULAR_CODE = `import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  imports: [FormsModule],
  selector: 'app-root',
  template: \`
    <div style="font-family:sans-serif;padding:24px;max-width:420px">
      <h2 style="color:#00e5a0;margin:0 0 16px;font-size:20px">Todo — Angular</h2>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <input [(ngModel)]="input" (keydown.enter)="add()" placeholder="Add todo…"
          style="flex:1;padding:8px 12px;border:1px solid #2d3748;border-radius:6px;background:#0d1117;color:#e2e8f0;outline:none;font-size:14px" />
        <button (click)="add()"
          style="padding:8px 16px;background:#00e5a0;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px">
          Add
        </button>
      </div>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px">
        @for (todo of todos; track $index; let i = $index) {
          <li style="display:flex;align-items:center;padding:10px 12px;background:#0d1117;border:1px solid #1e2d3d;border-radius:6px">
            <span style="flex:1;color:#e2e8f0;font-size:14px">{{ todo }}</span>
            <button (click)="remove(i)"
              style="background:none;border:none;color:#5c7080;cursor:pointer;font-size:18px;line-height:1">×</button>
          </li>
        }
      </ul>
    </div>
  \`,
})
export class AppComponent {
  todos = ['Learn tuvix.js', 'Build micro-apps'];
  input = '';

  add() {
    if (this.input.trim()) { this.todos = [...this.todos, this.input.trim()]; this.input = ''; }
  }
  remove(i: number) { this.todos = this.todos.filter((_, j) => j !== i); }
}

bootstrapApplication(AppComponent);
`;

// ── Tab definitions ────────────────────────────────────────────────
const TABS = [
  { id: 'vanilla',  label: 'Vanilla JS', file: 'app.ts',      lang: 'typescript',      icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="#f7df1e"><rect width="24" height="24" rx="3"/><path d="M6 17.5c.4.7 1 1.2 1.8 1.2.8 0 1.2-.4 1.2-.9 0-.6-.5-.9-1.4-1.3l-.5-.2C5.7 15.7 5 14.9 5 13.6c0-1.4 1.1-2.5 2.7-2.5 1.2 0 2 .4 2.6 1.5l-1.4.9c-.3-.6-.6-.8-1.2-.8s-.9.4-.9.8c0 .6.4.8 1.2 1.2l.5.2c1.5.6 2.2 1.4 2.2 2.8 0 1.6-1.3 2.6-3 2.6-1.7 0-2.8-.8-3.3-1.9l1.6-.9zM13 17.5c.3.5.6.9 1.2.9.5 0 .9-.2.9-1v-5.3h1.8V17.4c0 1.7-1 2.5-2.5 2.5-1.3 0-2.1-.7-2.5-1.5l1.1-.9z" fill="#000"/></svg>', code: VANILLA_CODE },
  { id: 'react',    label: 'React',      file: 'App.tsx',      lang: 'typescriptreact', icon: '<svg width="13" height="13" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.2" fill="#61dafb"/><ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#61dafb" stroke-width="1.3" fill="none"/><ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#61dafb" stroke-width="1.3" fill="none" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#61dafb" stroke-width="1.3" fill="none" transform="rotate(120 12 12)"/></svg>', code: REACT_CODE },
  { id: 'vue',      label: 'Vue',        file: 'App.vue',      lang: 'html',            icon: '<svg width="13" height="13" viewBox="0 0 24 24"><path d="M2 3h3.5L12 15 18.5 3H22L12 21z" fill="#42b883"/><path d="M6.5 3h3L12 8.5 14.5 3h3L12 14z" fill="#35495e"/></svg>', code: VUE_CODE },
  { id: 'svelte',   label: 'Svelte',     file: 'App.svelte',   lang: 'html',            icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="#ff3e00"><path d="M20.3 4.3C17.8 1.1 13.2.4 10 2.9L4.2 7.4C2.8 8.5 1.9 10 1.7 11.7c-.2 1.3.1 2.7.9 3.8-.5.8-.8 1.8-.9 2.7-.2 1.8.4 3.5 1.5 4.8 2.5 3.2 7.1 3.9 10.3 1.4l5.8-4.5c1.4-1.1 2.3-2.6 2.5-4.3.2-1.3-.1-2.7-.9-3.8.5-.8.8-1.8.9-2.7.2-1.7-.4-3.5-1.5-4.8z"/><path d="M10.5 18.5c-1.7.5-3.5-.2-4.4-1.7-.6-1-.8-2.2-.5-3.3l.2-.6.5.4c.6.4 1.2.7 1.9.9l.2.1-.1.2c-.2.4-.1.9.2 1.2.5.6 1.3.8 2 .5l5.4-3.4c.3-.2.5-.5.5-.8 0-.3-.1-.6-.4-.8-.5-.4-1.3-.3-1.8.1l-1.9 1.2c-.7.4-1.5.6-2.3.6-1.7 0-3.1-1-3.8-2.5-.6-1.3-.5-2.9.3-4.1.9-1.2 2.3-1.9 3.8-1.8.7 0 1.4.2 2 .5l.5.3-.5-.3 5.5-3.5c.3-.2.7-.3 1-.3 1 0 1.9.5 2.4 1.3.5.8.6 1.8.3 2.7l-.2.6-.5-.4c-.6-.4-1.2-.7-1.9-.9l-.2-.1.1-.2c.2-.4.1-.9-.2-1.2-.5-.6-1.3-.8-2-.5l-5.4 3.4c-.3.2-.5.5-.5.8 0 .3.1.6.4.8.5.4 1.3.3 1.8-.1l1.9-1.2c.7-.4 1.5-.6 2.3-.6 1.7 0 3.1 1 3.8 2.5.6 1.3.5 2.9-.3 4.1-.9 1.2-2.3 1.9-3.8 1.8-.7 0-1.4-.2-2-.5l-5.5 3.5c-.3.2-.6.3-1 .3z" fill="#fff"/></svg>', code: SVELTE_CODE },
  { id: 'angular',  label: 'Angular',    file: 'app.component.ts', lang: 'typescript',  icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="#dd0031"><path d="M12 2L2 6.5l1.6 13.2L12 22l8.4-2.3L22 6.5z"/><path d="M12 4.3l7 2.9-1.3 10.5L12 19.7l-5.7-2-1.3-10.5z" fill="#c3002f"/><path d="M12 6.5L8.5 15h1.3l.7-1.8h3l.7 1.8h1.3L12 6.5zm0 2.4l1.1 2.9h-2.2z" fill="#fff"/></svg>', code: ANGULAR_CODE },
];

// ── Importmaps ─────────────────────────────────────────────────────
const TUVIX = '0.1.4';
const BASE: Record<string, string> = {
  'tuvix.js':            `https://esm.sh/tuvix.js@${TUVIX}`,
  '@tuvix.js/core':      `https://esm.sh/@tuvix.js/core@${TUVIX}`,
  '@tuvix.js/loader':    `https://esm.sh/@tuvix.js/loader@${TUVIX}`,
  '@tuvix.js/router':    `https://esm.sh/@tuvix.js/router@${TUVIX}`,
  '@tuvix.js/event-bus': `https://esm.sh/@tuvix.js/event-bus@${TUVIX}`,
  '@tuvix.js/sandbox':   `https://esm.sh/@tuvix.js/sandbox@${TUVIX}`,
};
const FRAMEWORK_IMPORTS: Record<string, Record<string, string>> = {
  react: {
    'react':             'https://esm.sh/react@18',
    'react-dom':         'https://esm.sh/react-dom@18',
    'react-dom/client':  'https://esm.sh/react-dom@18/client',
    'react/jsx-runtime': 'https://esm.sh/react@18/jsx-runtime',
  },
  vue: {
    'vue': 'https://esm.sh/vue@3',
  },
  svelte: {
    'svelte':             'https://esm.sh/svelte@4',
    'svelte/internal':    'https://esm.sh/svelte@4/internal',
    'svelte/store':       'https://esm.sh/svelte@4/store',
    'svelte/transition':  'https://esm.sh/svelte@4/transition',
    'svelte/animate':     'https://esm.sh/svelte@4/animate',
    'svelte/easing':      'https://esm.sh/svelte@4/easing',
    'svelte/motion':      'https://esm.sh/svelte@4/motion',
  },
  angular: {
    '@angular/core':                    'https://esm.sh/@angular/core@17',
    '@angular/common':                  'https://esm.sh/@angular/common@17',
    '@angular/forms':                   'https://esm.sh/@angular/forms@17',
    '@angular/platform-browser':        'https://esm.sh/@angular/platform-browser@17',
    '@angular/platform-browser/animations': 'https://esm.sh/@angular/platform-browser@17/animations',
    '@angular/compiler':                'https://esm.sh/@angular/compiler@17',
    'rxjs':                             'https://esm.sh/rxjs@7',
    'rxjs/operators':                   'https://esm.sh/rxjs@7/operators',
  },
};

// ── Refs & state ───────────────────────────────────────────────────
const activeTab  = ref('vanilla');
const editorEl   = ref<HTMLElement>();
const iframeEl   = ref<HTMLIFrameElement>();
const messages   = ref<{ kind: string; text: string; line?: number }[]>([]);
const compiling  = ref(false);

const activeTabObj = computed(() => TABS.find(t => t.id === activeTab.value));

let esbuild:       typeof import('esbuild-wasm') | null = null;
let editorInst:    import('monaco-editor').editor.IStandaloneCodeEditor | null = null;
let monacoApi:     typeof import('monaco-editor') | null = null;
let debounce:      ReturnType<typeof setTimeout> | null = null;
let compileId = 0;

// ── Frame builder ──────────────────────────────────────────────────
function buildSrcdoc(code: string, tabId: string): string {
  const imports = { ...BASE, ...(FRAMEWORK_IMPORTS[tabId] ?? {}) };
  const importmap = JSON.stringify({ imports }, null, 2);
  const safe = code.replaceAll('<' + '/script>', '<\\/' + 'script>');
  // Angular needs zone.js loaded before anything else
  const zoneTag = tabId === 'angular'
    ? ['<script src="https://esm.sh/zone.js@0.14/dist/zone.js">', CS].join('')
    : '';
  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8">',
    '<style>*{box-sizing:border-box}body{margin:0;background:#080c10;color:#e2e8f0}</style>',
    zoneTag,
    '<script type="importmap">', importmap, CS,
    '<script>',
    "['log','warn','error'].forEach(m=>{const o=console[m];console[m]=(...a)=>{parent.postMessage({type:'console',level:m,args:a.map(String)},'*');o.apply(console,a)};});",
    "window.onerror=(msg,_,line,col)=>{parent.postMessage({type:'runtime-error',msg,line,col},'*');};",
    "window.addEventListener('unhandledrejection',e=>{parent.postMessage({type:'runtime-error',msg:String(e.reason)},'*');});",
    CS,
    '</head><body><div id="app"></div>',
    '<script type="module">', safe, "\nparent.postMessage({type:'mounted'},'*');", CS,
    '</body></html>',
  ].join('');
}

// ── Vue SFC transformer ────────────────────────────────────────────
function transformVueSFC(sfc: string): string {
  const template = sfc.match(/<template>([\s\S]*?)<\/template>/)?.[1]?.trim() ?? '';
  const scriptRaw = sfc.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1]?.trim() ?? '';

  // Split imports from body
  const lines = scriptRaw.split('\n');
  const importLines: string[] = [];
  const bodyLines: string[] = [];
  for (const line of lines) {
    if (/^\s*import\s/.test(line)) importLines.push(line);
    else bodyLines.push(line);
  }

  // Collect top-level const/let/function names to return from setup()
  const names = bodyLines
    .map(l => l.match(/^\s*(?:const|let|var)\s+(\w+)|^\s*function\s+(\w+)/))
    .filter(Boolean)
    .map(m => m![1] || m![2]);

  // Escape the template for use inside a JS template literal
  const escapedTpl = template.replace(/\\/g, '\\\\').replace(/`/g, '\\`');

  // Remove tuvix imports from user script (we add them ourselves)
  const userImports = importLines
    .filter(l => !l.includes('tuvix') && !l.includes('defineMicroApp'))
    .join('\n');

  return `
import { createApp, defineComponent } from 'vue';
import { defineMicroApp } from 'tuvix.js';
${userImports}

const __component = defineComponent({
  setup() {
${bodyLines.join('\n')}
    return { ${names.join(', ')} };
  },
  template: \`${escapedTpl}\`,
});

const __app = defineMicroApp({
  name: 'vue-sfc',
  mount({ container }) { createApp(__component).mount(container); },
  unmount({ container }) { container.innerHTML = ''; },
});
__app.mount({ container: document.getElementById('app')! });
`;
}

// ── Svelte transformer ─────────────────────────────────────────────
async function transformSvelte(code: string): Promise<string> {
  // Load Svelte compiler from CDN (lazy, cached after first load)
  const svelte = await import(/* @vite-ignore */ 'https://esm.sh/svelte@4/compiler');
  const { js } = (svelte as any).compile(code, {
    filename: 'App.svelte',
    format: 'esm',
    generate: 'client',
    enableSourcemap: false,
  });
  // Convert `export default App` to a local var so we can mount it
  const compiled = (js.code as string).replace(/export default (\w+)/, 'const __SvelteApp = $1');
  return compiled + '\nnew __SvelteApp({ target: document.getElementById("app") });';
}

// ── Esbuild compilation ────────────────────────────────────────────
async function compileWithEsbuild(code: string, tabId: string): Promise<string> {
  const isReact   = tabId === 'react';
  const isAngular = tabId === 'angular';
  const result = await esbuild!.transform(code, {
    loader:          isReact ? 'tsx' : 'ts',
    format:          'esm',
    target:          'es2020',
    jsx:             isReact ? 'automatic' : undefined,
    jsxImportSource: isReact ? 'react'     : undefined,
    tsconfigRaw:     isAngular
      ? JSON.stringify({ compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false } })
      : undefined,
  });
  return result.code;
}

// ── Main compile pipeline ──────────────────────────────────────────
async function compile(code: string, tabId: string, id: number) {
  if (!esbuild) return;
  compiling.value = true;
  const t0 = performance.now();
  try {
    let compiled: string;
    if (tabId === 'vue') {
      compiled = await compileWithEsbuild(transformVueSFC(code), 'typescript');
    } else if (tabId === 'svelte') {
      compiled = await transformSvelte(code);
    } else {
      compiled = await compileWithEsbuild(code, tabId);
    }
    if (id !== compileId) return;
    messages.value = [{ kind: 'success', text: `Compiled in ${Math.round(performance.now() - t0)}ms` }];
    if (iframeEl.value) iframeEl.value.srcdoc = buildSrcdoc(compiled, tabId);
  } catch (err: unknown) {
    if (id !== compileId) return;
    const e = err as { errors?: { text: string; location?: { line: number } }[]; message?: string };
    const first = e.errors?.[0];
    messages.value = [{
      kind: 'error',
      text: `Build error: ${first?.text ?? e.message ?? String(err)}`,
      line: first?.location?.line,
    }];
    if (iframeEl.value) iframeEl.value.srcdoc = '';
  } finally {
    if (id === compileId) compiling.value = false;
  }
}

function scheduleCompile(code: string) {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => { compileId++; compile(code, activeTab.value, compileId); }, 300);
}

// ── Tab switching ──────────────────────────────────────────────────
function switchTab(tabId: string) {
  activeTab.value = tabId;
  const tab = TABS.find(t => t.id === tabId)!;
  editorInst?.setValue(tab.code);
  // Update Monaco language
  const model = editorInst?.getModel();
  if (model && monacoApi) monacoApi.editor.setModelLanguage(model, tab.lang);
  messages.value = [];
  if (iframeEl.value) iframeEl.value.srcdoc = '';
  scheduleCompile(tab.code);
}

// ── postMessage handler ────────────────────────────────────────────
function onMessage(e: MessageEvent) {
  if (e.source !== iframeEl.value?.contentWindow) return;
  const d = e.data;
  if (d?.type === 'console')       messages.value.push({ kind: d.level, text: d.args.join(' ') });
  if (d?.type === 'runtime-error') messages.value.push({ kind: 'runtime-error', text: `Runtime: ${d.msg}`, line: d.line });
}

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(async () => {
  window.addEventListener('message', onMessage);

  // Init esbuild-wasm
  const eb = await import('esbuild-wasm');
  await eb.initialize({ wasmURL: '/esbuild.wasm' });
  esbuild = eb;

  // Setup Monaco environment for workers
  (window as any).MonacoEnvironment = {
    getWorkerUrl(_: string, label: string) {
      const base = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/esm/vs/';
      if (label === 'html' || label === 'handlebars') return base + 'language/html/html.worker.js';
      if (label === 'typescript' || label === 'javascript') return base + 'language/typescript/ts.worker.js';
      return base + 'editor/editor.worker.js';
    },
  };

  // Init Monaco
  const loader = await import('@monaco-editor/loader');
  const monaco = await loader.default.init();
  monacoApi = monaco;
  if (!editorEl.value) return;

  editorInst = monaco.editor.create(editorEl.value, {
    value:                TABS[0].code,
    language:             TABS[0].lang,
    theme:                'vs-dark',
    fontSize:             13,
    fontFamily:           "'JetBrains Mono', ui-monospace, monospace",
    minimap:              { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers:          'on',
    tabSize:              2,
    automaticLayout:      true,
    padding:              { top: 12 },
    wordWrap:             'on',
  });

  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation:   false,
  });

  editorInst.onDidChangeModelContent(() => scheduleCompile(editorInst!.getValue()));
  scheduleCompile(TABS[0].code);
});

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage);
  editorInst?.dispose();
  if (debounce) clearTimeout(debounce);
});
</script>

<style scoped>
.live-playground {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--vp-nav-height, 64px));
  background: var(--vp-c-bg);
}

/* ── Tab bar ─────────────────────────────────────── */
.tab-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  flex-shrink: 0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: none;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--vp-font-family-base);
  line-height: 1;
}

.tab-btn:hover { background: var(--vp-c-bg-mute); color: var(--vp-c-text-1); }
.tab-btn.active { background: var(--vp-c-bg-mute); color: var(--vp-c-brand-1); border-color: var(--vp-c-divider); }

/* ── Body ────────────────────────────────────────── */
.playground-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* ── Pane header ─────────────────────────────────── */
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
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.compiling-pill {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 10px;
  background: rgba(0, 229, 160, 0.1);
  color: var(--vp-c-brand-1);
  animation: fade 0.7s ease-in-out infinite alternate;
  font-family: var(--vp-font-family-base);
  letter-spacing: 0;
  text-transform: none;
}

@keyframes fade { from { opacity: 1 } to { opacity: 0.3 } }

.live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  margin-right: 6px;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse { 0%,100% { opacity:1; box-shadow: 0 0 0 0 rgba(0,229,160,.4) } 50% { opacity:.5; box-shadow: 0 0 0 4px rgba(0,229,160,0) } }

/* ── Editor pane ─────────────────────────────────── */
.editor-pane {
  display: flex;
  flex-direction: column;
  width: 55%;
  border-right: 1px solid var(--vp-c-divider);
  min-width: 0;
}

.editor-mount { flex: 1; overflow: hidden; }

/* ── Right pane ──────────────────────────────────── */
.right-pane { display: flex; flex-direction: column; flex: 1; min-width: 0; }

.preview-pane {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.preview-frame { flex: 1; border: none; background: #080c10; width: 100%; }

/* ── Console ─────────────────────────────────────── */
.console-pane { display: flex; flex-direction: column; height: 128px; flex-shrink: 0; }

.clear-btn {
  background: none; border: none; color: var(--vp-c-text-3);
  font-size: 10px; cursor: pointer; padding: 0; font-family: inherit;
  text-transform: none; letter-spacing: 0;
}
.clear-btn:hover { color: var(--vp-c-text-2); }

.console-body {
  flex: 1; overflow-y: auto; padding: 6px 10px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
}

.console-msg { display: flex; align-items: baseline; gap: 6px; padding: 2px 0; line-height: 1.5; }

.console-msg.log .msg-text         { color: var(--vp-c-text-2); }
.console-msg.warn .msg-text        { color: #e5b700; }
.console-msg.error .msg-text,
.console-msg.runtime-error .msg-text { color: #f87171; }
.console-msg.success .msg-text     { color: var(--vp-c-brand-1); }

.msg-icon  { flex-shrink: 0; opacity: 0.6; }
.msg-loc   { margin-left: auto; color: var(--vp-c-text-3); font-size: 10px; }
.console-empty { color: var(--vp-c-text-3); font-size: 12px; padding: 2px 0; }

/* ── Mobile ──────────────────────────────────────── */
@media (max-width: 768px) {
  .live-playground { height: auto; }
  .playground-body { flex-direction: column; }
  .editor-pane { width: 100%; height: 260px; border-right: none; border-bottom: 1px solid var(--vp-c-divider); }
  .right-pane { height: 360px; }
}
</style>

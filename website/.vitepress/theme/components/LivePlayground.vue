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

    <div class="demo-bar">
      <button class="demo-btn" :class="{ active: demoType === 'counter' }" @click="switchDemo('counter')">Counter</button>
      <button class="demo-btn" :class="{ active: demoType === 'todo' }" @click="switchDemo('todo')">Todo</button>
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

// ── Vanilla ─────────────────────────────────────────────────────────
const VANILLA_COUNTER_CODE = `import { defineMicroApp } from 'tuvix.js';

let count = 0;

function render(el: HTMLElement) {
  el.innerHTML = \`
    <div style="font-family:sans-serif;padding:24px;max-width:420px;text-align:center">
      <h2 style="color:#00e5a0;margin:0 0 20px;font-size:20px">Counter — Vanilla JS</h2>
      <div style="font-size:48px;font-weight:700;color:#e2e8f0;margin:0 0 20px">\${count}</div>
      <div style="display:flex;gap:12px;justify-content:center">
        <button onclick="__dec()"
          style="padding:10px 24px;background:#1e2d3d;color:#e2e8f0;border:1px solid #2d3748;
                 border-radius:8px;cursor:pointer;font-size:20px;font-weight:600">&minus;</button>
        <button onclick="__inc()"
          style="padding:10px 24px;background:#00e5a0;color:#000;border:none;
                 border-radius:8px;cursor:pointer;font-size:20px;font-weight:600">+</button>
      </div>
    </div>\`;
}

const app = defineMicroApp({
  name: 'counter-vanilla',
  mount({ container }) {
    window.__dec = () => { count--; render(container); };
    window.__inc = () => { count++; render(container); };
    render(container);
  },
  unmount({ container }) { container.innerHTML = ''; },
});

app.mount({ container: document.getElementById('app') as HTMLElement });
`;

const VANILLA_TODO_CODE = `import { defineMicroApp } from 'tuvix.js';

interface Todo { id: number; title: string; completed: boolean; }
let todos: Todo[] = [
  { id: 1, title: 'Learn tuvix.js', completed: false },
  { id: 2, title: 'Build micro-apps', completed: false },
];
let editingId: number | null = null;

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
        \${todos.map(t => \`
          <li style="display:flex;align-items:center;padding:10px 12px;
                     background:#0d1117;border:1px solid #1e2d3d;border-radius:6px">
            <input type="checkbox" \${t.completed ? 'checked' : ''} onchange="__toggle(\${t.id})"
              style="margin-right:10px;cursor:pointer">
            \${editingId === t.id
              ? \`<input id="edit-\${t.id}" value="\${t.title}" onkeydown="if(event.key==='Enter')__saveEdit(\${t.id})"
                   style="flex:1;padding:4px 8px;border:1px solid #2d3748;border-radius:4px;
                          background:#0d1117;color:#e2e8f0;outline:none;font-size:14px">
                 <button onclick="__saveEdit(\${t.id})"
                   style="background:none;border:none;color:#00e5a0;cursor:pointer;font-size:14px;margin-left:6px">Save</button>\`
              : \`<span style="flex:1;color:#e2e8f0;font-size:14px;\${t.completed ? 'text-decoration:line-through;opacity:0.5' : ''}">\${t.title}</span>
                 <button onclick="__startEdit(\${t.id})"
                   style="background:none;border:none;color:#5c7080;cursor:pointer;font-size:14px;margin-right:4px">Edit</button>\`}
            <button onclick="__rm(\${t.id})"
              style="background:none;border:none;color:#5c7080;cursor:pointer;font-size:18px;line-height:1">&times;</button>
          </li>\`).join('')}
      </ul>
    </div>\`;
}

const app = defineMicroApp({
  name: 'todo-vanilla',
  mount({ container }) {
    window.__add = () => {
      const inp = document.getElementById('inp') as HTMLInputElement;
      if (inp?.value.trim()) { todos.push({ id: Date.now(), title: inp.value.trim(), completed: false }); inp.value = ''; render(container); }
    };
    window.__rm = (id: number) => { todos = todos.filter(t => t.id !== id); render(container); };
    window.__toggle = (id: number) => { const t = todos.find(x => x.id === id); if (t) t.completed = !t.completed; render(container); };
    window.__startEdit = (id: number) => { editingId = id; render(container); };
    window.__saveEdit = (id: number) => {
      const inp = document.getElementById('edit-' + id) as HTMLInputElement;
      if (inp?.value.trim()) { const t = todos.find(x => x.id === id); if (t) t.title = inp.value.trim(); }
      editingId = null; render(container);
    };
    render(container);
  },
  unmount({ container }) { container.innerHTML = ''; },
});

app.mount({ container: document.getElementById('app') as HTMLElement });
`;

// ── React ───────────────────────────────────────────────────────────
const REACT_COUNTER_CODE = `import { createReactMicroApp } from '@tuvix.js/react';
import { useState } from 'react';

function CounterApp() {
  const [count, setCount] = useState(0);

  const s = {
    wrap:  { fontFamily:'sans-serif', padding:24, maxWidth:420, textAlign:'center' as const },
    h2:    { color:'#00e5a0', margin:'0 0 20px', fontSize:20 },
    count: { fontSize:48, fontWeight:700, color:'#e2e8f0', margin:'0 0 20px' },
    row:   { display:'flex', gap:12, justifyContent:'center' },
    dec:   { padding:'10px 24px', background:'#1e2d3d', color:'#e2e8f0', border:'1px solid #2d3748',
             borderRadius:8, cursor:'pointer', fontSize:20, fontWeight:600 },
    inc:   { padding:'10px 24px', background:'#00e5a0', color:'#000', border:'none',
             borderRadius:8, cursor:'pointer', fontSize:20, fontWeight:600 },
  };

  return (
    <div style={s.wrap}>
      <h2 style={s.h2}>Counter — React</h2>
      <div style={s.count}>{count}</div>
      <div style={s.row}>
        <button style={s.dec} onClick={() => setCount(c => c - 1)}>&minus;</button>
        <button style={s.inc} onClick={() => setCount(c => c + 1)}>+</button>
      </div>
    </div>
  );
}

const app = createReactMicroApp({
  name: 'counter-react',
  App: CounterApp,
});

app.mount({ container: document.getElementById('app') as HTMLElement });
`;

const REACT_TODO_CODE = `import { createReactMicroApp } from '@tuvix.js/react';
import { useState } from 'react';

interface Todo { id: number; title: string; completed: boolean; }

function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, title: 'Learn tuvix.js', completed: false },
    { id: 2, title: 'Build micro-apps', completed: false },
  ]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const add = () => { if (input.trim()) { setTodos(p => [...p, { id: Date.now(), title: input.trim(), completed: false }]); setInput(''); } };
  const remove = (id: number) => setTodos(p => p.filter(t => t.id !== id));
  const toggle = (id: number) => setTodos(p => p.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const startEdit = (t: Todo) => { setEditingId(t.id); setEditText(t.title); };
  const saveEdit = () => { if (editingId !== null && editText.trim()) { setTodos(p => p.map(t => t.id === editingId ? { ...t, title: editText.trim() } : t)); setEditingId(null); } };

  const s = {
    wrap: { fontFamily:'sans-serif', padding:24, maxWidth:420 },
    h2:   { color:'#00e5a0', margin:'0 0 16px', fontSize:20 },
    row:  { display:'flex', gap:8, marginBottom:16 },
    inp:  { flex:1, padding:'8px 12px', border:'1px solid #2d3748', borderRadius:6,
            background:'#0d1117', color:'#e2e8f0', outline:'none', fontSize:14 },
    btn:  { padding:'8px 16px', background:'#00e5a0', color:'#000', border:'none',
            borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:14 },
    ul:   { listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column' as const, gap:6 },
    li:   { display:'flex', alignItems:'center', padding:'10px 12px',
            background:'#0d1117', border:'1px solid #1e2d3d', borderRadius:6 },
  };

  return (
    <div style={s.wrap}>
      <h2 style={s.h2}>Todo — React</h2>
      <div style={s.row}>
        <input style={s.inp} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add todo..." />
        <button style={s.btn} onClick={add}>Add</button>
      </div>
      <ul style={s.ul}>
        {todos.map(t => (
          <li key={t.id} style={s.li}>
            <input type="checkbox" checked={t.completed} onChange={() => toggle(t.id)}
              style={{ marginRight:10, cursor:'pointer' }} />
            {editingId === t.id ? (
              <>
                <input style={{ ...s.inp, marginRight:6 }} value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus />
                <button onClick={saveEdit}
                  style={{ background:'none', border:'none', color:'#00e5a0', cursor:'pointer', fontSize:14 }}>Save</button>
              </>
            ) : (
              <>
                <span style={{ flex:1, color:'#e2e8f0', fontSize:14,
                  textDecoration: t.completed ? 'line-through' : 'none',
                  opacity: t.completed ? 0.5 : 1 }}>{t.title}</span>
                <button onClick={() => startEdit(t)}
                  style={{ background:'none', border:'none', color:'#5c7080', cursor:'pointer', fontSize:14, marginRight:4 }}>Edit</button>
              </>
            )}
            <button onClick={() => remove(t.id)}
              style={{ background:'none', border:'none', color:'#5c7080', cursor:'pointer', fontSize:18, lineHeight:1 }}>&times;</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const app = createReactMicroApp({
  name: 'todo-react',
  App: TodoApp,
});

app.mount({ container: document.getElementById('app') as HTMLElement });
`;

// ── Vue ─────────────────────────────────────────────────────────────
const VUE_COUNTER_CODE = `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const CounterApp = defineComponent({
  setup() {
    const count = ref(0);
    return { count };
  },
  template: \`
    <div style="font-family:sans-serif;padding:24px;max-width:420px;text-align:center">
      <h2 style="color:#00e5a0;margin:0 0 20px;font-size:20px">Counter — Vue</h2>
      <div style="font-size:48px;font-weight:700;color:#e2e8f0;margin:0 0 20px">{{ count }}</div>
      <div style="display:flex;gap:12px;justify-content:center">
        <button @click="count--"
          style="padding:10px 24px;background:#1e2d3d;color:#e2e8f0;border:1px solid #2d3748;
                 border-radius:8px;cursor:pointer;font-size:20px;font-weight:600">&minus;</button>
        <button @click="count++"
          style="padding:10px 24px;background:#00e5a0;color:#000;border:none;
                 border-radius:8px;cursor:pointer;font-size:20px;font-weight:600">+</button>
      </div>
    </div>
  \`,
});

const app = createVueMicroApp({
  name: 'counter-vue',
  App: CounterApp,
});

app.mount({ container: document.getElementById('app') as HTMLElement });
`;

const VUE_TODO_CODE = `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const TodoApp = defineComponent({
  setup() {
    const todos = ref([
      { id: 1, title: 'Learn tuvix.js', completed: false },
      { id: 2, title: 'Build micro-apps', completed: false },
    ]);
    const input = ref('');
    const editingId = ref(null as number | null);
    const editText = ref('');

    const add = () => {
      if (input.value.trim()) { todos.value.push({ id: Date.now(), title: input.value.trim(), completed: false }); input.value = ''; }
    };
    const remove = (id: number) => { todos.value = todos.value.filter(t => t.id !== id); };
    const toggle = (id: number) => {
      const t = todos.value.find(x => x.id === id);
      if (t) t.completed = !t.completed;
    };
    const startEdit = (t: { id: number; title: string }) => { editingId.value = t.id; editText.value = t.title; };
    const saveEdit = () => {
      if (editingId.value !== null && editText.value.trim()) {
        const t = todos.value.find(x => x.id === editingId.value);
        if (t) t.title = editText.value.trim();
        editingId.value = null;
      }
    };

    return { todos, input, editingId, editText, add, remove, toggle, startEdit, saveEdit };
  },
  template: \`
    <div style="font-family:sans-serif;padding:24px;max-width:420px">
      <h2 style="color:#00e5a0;margin:0 0 16px;font-size:20px">Todo — Vue</h2>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <input v-model="input" @keydown.enter="add" placeholder="Add todo..."
          style="flex:1;padding:8px 12px;border:1px solid #2d3748;border-radius:6px;background:#0d1117;color:#e2e8f0;outline:none;font-size:14px" />
        <button @click="add"
          style="padding:8px 16px;background:#00e5a0;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px">Add</button>
      </div>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px">
        <li v-for="t in todos" :key="t.id"
          style="display:flex;align-items:center;padding:10px 12px;background:#0d1117;border:1px solid #1e2d3d;border-radius:6px">
          <input type="checkbox" :checked="t.completed" @change="toggle(t.id)"
            style="margin-right:10px;cursor:pointer" />
          <template v-if="editingId === t.id">
            <input v-model="editText" @keydown.enter="saveEdit"
              style="flex:1;padding:4px 8px;border:1px solid #2d3748;border-radius:4px;background:#0d1117;color:#e2e8f0;outline:none;font-size:14px;margin-right:6px" />
            <button @click="saveEdit"
              style="background:none;border:none;color:#00e5a0;cursor:pointer;font-size:14px">Save</button>
          </template>
          <template v-else>
            <span :style="{ flex:1, color:'#e2e8f0', fontSize:'14px', textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.5 : 1 }">{{ t.title }}</span>
            <button @click="startEdit(t)"
              style="background:none;border:none;color:#5c7080;cursor:pointer;font-size:14px;margin-right:4px">Edit</button>
          </template>
          <button @click="remove(t.id)"
            style="background:none;border:none;color:#5c7080;cursor:pointer;font-size:18px;line-height:1">&times;</button>
        </li>
      </ul>
    </div>
  \`,
});

const app = createVueMicroApp({
  name: 'todo-vue',
  App: TodoApp,
});

app.mount({ container: document.getElementById('app') as HTMLElement });
`;

// ── Svelte ──────────────────────────────────────────────────────────
const SVELTE_COUNTER_CODE = `<!-- Entry file (main.ts):
  import { createSvelteMicroApp } from '@tuvix.js/svelte';
  import App from './Counter.svelte';
  const app = createSvelteMicroApp({ name: 'counter-svelte', App });
  app.mount({ container: document.getElementById('app') as HTMLElement });
-->

<script lang="ts">
  let count = 0;
${CS}

<div style="font-family:sans-serif;padding:24px;max-width:420px;text-align:center">
  <h2 style="color:#00e5a0;margin:0 0 20px;font-size:20px">Counter — Svelte</h2>
  <div style="font-size:48px;font-weight:700;color:#e2e8f0;margin:0 0 20px">{count}</div>
  <div style="display:flex;gap:12px;justify-content:center">
    <button on:click={() => count--}
      style="padding:10px 24px;background:#1e2d3d;color:#e2e8f0;border:1px solid #2d3748;
             border-radius:8px;cursor:pointer;font-size:20px;font-weight:600">&minus;</button>
    <button on:click={() => count++}
      style="padding:10px 24px;background:#00e5a0;color:#000;border:none;
             border-radius:8px;cursor:pointer;font-size:20px;font-weight:600">+</button>
  </div>
</div>
`;

const SVELTE_TODO_CODE = `<!-- Entry file (main.ts):
  import { createSvelteMicroApp } from '@tuvix.js/svelte';
  import App from './Todo.svelte';
  const app = createSvelteMicroApp({ name: 'todo-svelte', App });
  app.mount({ container: document.getElementById('app') as HTMLElement });
-->

<script lang="ts">
  let todos = [
    { id: 1, title: 'Learn tuvix.js', completed: false },
    { id: 2, title: 'Build micro-apps', completed: false },
  ];
  let input = '';
  let editingId: number | null = null;
  let editText = '';

  function add() {
    if (input.trim()) { todos = [...todos, { id: Date.now(), title: input.trim(), completed: false }]; input = ''; }
  }
  function remove(id: number) { todos = todos.filter(t => t.id !== id); }
  function toggle(id: number) { todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t); }
  function startEdit(t: { id: number; title: string }) { editingId = t.id; editText = t.title; }
  function saveEdit() {
    if (editingId !== null && editText.trim()) { todos = todos.map(t => t.id === editingId ? { ...t, title: editText.trim() } : t); editingId = null; }
  }
${CS}

<div style="font-family:sans-serif;padding:24px;max-width:420px">
  <h2 style="color:#00e5a0;margin:0 0 16px;font-size:20px">Todo — Svelte</h2>
  <div style="display:flex;gap:8px;margin-bottom:16px">
    <input bind:value={input} on:keydown={(e) => e.key === 'Enter' && add()} placeholder="Add todo..."
      style="flex:1;padding:8px 12px;border:1px solid #2d3748;border-radius:6px;background:#0d1117;color:#e2e8f0;outline:none;font-size:14px" />
    <button on:click={add}
      style="padding:8px 16px;background:#00e5a0;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px">
      Add
    </button>
  </div>
  <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px">
    {#each todos as todo (todo.id)}
      <li style="display:flex;align-items:center;padding:10px 12px;background:#0d1117;border:1px solid #1e2d3d;border-radius:6px">
        <input type="checkbox" checked={todo.completed} on:change={() => toggle(todo.id)}
          style="margin-right:10px;cursor:pointer" />
        {#if editingId === todo.id}
          <input bind:value={editText} on:keydown={(e) => e.key === 'Enter' && saveEdit()}
            style="flex:1;padding:4px 8px;border:1px solid #2d3748;border-radius:4px;background:#0d1117;color:#e2e8f0;outline:none;font-size:14px;margin-right:6px" />
          <button on:click={saveEdit}
            style="background:none;border:none;color:#00e5a0;cursor:pointer;font-size:14px">Save</button>
        {:else}
          <span style="flex:1;color:#e2e8f0;font-size:14px;{todo.completed ? 'text-decoration:line-through;opacity:0.5' : ''}">{todo.title}</span>
          <button on:click={() => startEdit(todo)}
            style="background:none;border:none;color:#5c7080;cursor:pointer;font-size:14px;margin-right:4px">Edit</button>
        {/if}
        <button on:click={() => remove(todo.id)}
          style="background:none;border:none;color:#5c7080;cursor:pointer;font-size:18px;line-height:1">&times;</button>
      </li>
    {/each}
  </ul>
</div>
`;

// ── Angular ─────────────────────────────────────────────────────────
const ANGULAR_COUNTER_CODE = `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-root',
  template: \`
    <div style="font-family:sans-serif;padding:24px;max-width:420px;text-align:center">
      <h2 style="color:#00e5a0;margin:0 0 20px;font-size:20px">Counter — Angular</h2>
      <div style="font-size:48px;font-weight:700;color:#e2e8f0;margin:0 0 20px">{{ count }}</div>
      <div style="display:flex;gap:12px;justify-content:center">
        <button (click)="count = count - 1"
          style="padding:10px 24px;background:#1e2d3d;color:#e2e8f0;border:1px solid #2d3748;
                 border-radius:8px;cursor:pointer;font-size:20px;font-weight:600">&minus;</button>
        <button (click)="count = count + 1"
          style="padding:10px 24px;background:#00e5a0;color:#000;border:none;
                 border-radius:8px;cursor:pointer;font-size:20px;font-weight:600">+</button>
      </div>
    </div>
  \`,
})
export class CounterComponent {
  count = 0;
}

// Tuvix.js integration: wrap Angular standalone component as a micro app
const app = defineMicroApp({
  name: 'counter-angular',
  async mount({ container }) {
    const el = document.createElement('app-root');
    container.appendChild(el);
    await bootstrapApplication(CounterComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });
`;

const ANGULAR_TODO_CODE = `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';

interface Todo { id: number; title: string; completed: boolean; }

@Component({
  standalone: true,
  imports: [FormsModule],
  selector: 'app-root',
  template: \`
    <div style="font-family:sans-serif;padding:24px;max-width:420px">
      <h2 style="color:#00e5a0;margin:0 0 16px;font-size:20px">Todo — Angular</h2>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <input [(ngModel)]="input" (keydown.enter)="add()" placeholder="Add todo..."
          style="flex:1;padding:8px 12px;border:1px solid #2d3748;border-radius:6px;background:#0d1117;color:#e2e8f0;outline:none;font-size:14px" />
        <button (click)="add()"
          style="padding:8px 16px;background:#00e5a0;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px">
          Add
        </button>
      </div>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px">
        @for (todo of todos; track todo.id) {
          <li style="display:flex;align-items:center;padding:10px 12px;background:#0d1117;border:1px solid #1e2d3d;border-radius:6px">
            <input type="checkbox" [checked]="todo.completed" (change)="toggle(todo.id)"
              style="margin-right:10px;cursor:pointer" />
            @if (editingId === todo.id) {
              <input [(ngModel)]="editText" (keydown.enter)="saveEdit()"
                style="flex:1;padding:4px 8px;border:1px solid #2d3748;border-radius:4px;background:#0d1117;color:#e2e8f0;outline:none;font-size:14px;margin-right:6px" />
              <button (click)="saveEdit()"
                style="background:none;border:none;color:#00e5a0;cursor:pointer;font-size:14px">Save</button>
            } @else {
              <span [style]="'flex:1;color:#e2e8f0;font-size:14px;' + (todo.completed ? 'text-decoration:line-through;opacity:0.5' : '')">{{ todo.title }}</span>
              <button (click)="startEdit(todo)"
                style="background:none;border:none;color:#5c7080;cursor:pointer;font-size:14px;margin-right:4px">Edit</button>
            }
            <button (click)="remove(todo.id)"
              style="background:none;border:none;color:#5c7080;cursor:pointer;font-size:18px;line-height:1">&times;</button>
          </li>
        }
      </ul>
    </div>
  \`,
})
export class TodoComponent {
  todos: Todo[] = [
    { id: 1, title: 'Learn tuvix.js', completed: false },
    { id: 2, title: 'Build micro-apps', completed: false },
  ];
  input = '';
  editingId: number | null = null;
  editText = '';

  add() {
    if (this.input.trim()) { this.todos = [...this.todos, { id: Date.now(), title: this.input.trim(), completed: false }]; this.input = ''; }
  }
  remove(id: number) { this.todos = this.todos.filter(t => t.id !== id); }
  toggle(id: number) { this.todos = this.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t); }
  startEdit(t: Todo) { this.editingId = t.id; this.editText = t.title; }
  saveEdit() {
    if (this.editingId !== null && this.editText.trim()) {
      this.todos = this.todos.map(t => t.id === this.editingId ? { ...t, title: this.editText.trim() } : t);
      this.editingId = null;
    }
  }
}

// Tuvix.js integration: wrap Angular standalone component as a micro app
const app = defineMicroApp({
  name: 'todo-angular',
  async mount({ container }) {
    const el = document.createElement('app-root');
    container.appendChild(el);
    await bootstrapApplication(TodoComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });
`;

// ── Demo code map ──────────────────────────────────────────────────
const DEMO_CODES: Record<string, Record<string, string>> = {
  vanilla:  { counter: VANILLA_COUNTER_CODE,  todo: VANILLA_TODO_CODE },
  react:    { counter: REACT_COUNTER_CODE,    todo: REACT_TODO_CODE },
  vue:      { counter: VUE_COUNTER_CODE,      todo: VUE_TODO_CODE },
  svelte:   { counter: SVELTE_COUNTER_CODE,   todo: SVELTE_TODO_CODE },
  angular:  { counter: ANGULAR_COUNTER_CODE,  todo: ANGULAR_TODO_CODE },
};

// ── Tab definitions ────────────────────────────────────────────────
const TABS = [
  { id: 'vanilla',  label: 'Vanilla JS', file: 'app.ts',      lang: 'vanilla-ts',      icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="#f7df1e"><rect width="24" height="24" rx="3"/><path d="M6 17.5c.4.7 1 1.2 1.8 1.2.8 0 1.2-.4 1.2-.9 0-.6-.5-.9-1.4-1.3l-.5-.2C5.7 15.7 5 14.9 5 13.6c0-1.4 1.1-2.5 2.7-2.5 1.2 0 2 .4 2.6 1.5l-1.4.9c-.3-.6-.6-.8-1.2-.8s-.9.4-.9.8c0 .6.4.8 1.2 1.2l.5.2c1.5.6 2.2 1.4 2.2 2.8 0 1.6-1.3 2.6-3 2.6-1.7 0-2.8-.8-3.3-1.9l1.6-.9zM13 17.5c.3.5.6.9 1.2.9.5 0 .9-.2.9-1v-5.3h1.8V17.4c0 1.7-1 2.5-2.5 2.5-1.3 0-2.1-.7-2.5-1.5l1.1-.9z" fill="#000"/></svg>' },
  { id: 'react',    label: 'React',      file: 'App.tsx',      lang: 'react-ts',        icon: '<svg width="13" height="13" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.2" fill="#61dafb"/><ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#61dafb" stroke-width="1.3" fill="none"/><ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#61dafb" stroke-width="1.3" fill="none" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#61dafb" stroke-width="1.3" fill="none" transform="rotate(120 12 12)"/></svg>' },
  { id: 'vue',      label: 'Vue',        file: 'main.ts',      lang: 'typescript',            icon: '<svg width="13" height="13" viewBox="0 0 24 24"><path d="M2 3h3.5L12 15 18.5 3H22L12 21z" fill="#42b883"/><path d="M6.5 3h3L12 8.5 14.5 3h3L12 14z" fill="#35495e"/></svg>' },
  { id: 'svelte',   label: 'Svelte',     file: 'App.svelte',   lang: 'html',            icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="#ff3e00"><path d="M20.3 4.3C17.8 1.1 13.2.4 10 2.9L4.2 7.4C2.8 8.5 1.9 10 1.7 11.7c-.2 1.3.1 2.7.9 3.8-.5.8-.8 1.8-.9 2.7-.2 1.8.4 3.5 1.5 4.8 2.5 3.2 7.1 3.9 10.3 1.4l5.8-4.5c1.4-1.1 2.3-2.6 2.5-4.3.2-1.3-.1-2.7-.9-3.8.5-.8.8-1.8.9-2.7.2-1.7-.4-3.5-1.5-4.8z"/><path d="M10.5 18.5c-1.7.5-3.5-.2-4.4-1.7-.6-1-.8-2.2-.5-3.3l.2-.6.5.4c.6.4 1.2.7 1.9.9l.2.1-.1.2c-.2.4-.1.9.2 1.2.5.6 1.3.8 2 .5l5.4-3.4c.3-.2.5-.5.5-.8 0-.3-.1-.6-.4-.8-.5-.4-1.3-.3-1.8.1l-1.9 1.2c-.7.4-1.5.6-2.3.6-1.7 0-3.1-1-3.8-2.5-.6-1.3-.5-2.9.3-4.1.9-1.2 2.3-1.9 3.8-1.8.7 0 1.4.2 2 .5l.5.3-.5-.3 5.5-3.5c.3-.2.7-.3 1-.3 1 0 1.9.5 2.4 1.3.5.8.6 1.8.3 2.7l-.2.6-.5-.4c-.6-.4-1.2-.7-1.9-.9l-.2-.1.1-.2c.2-.4.1-.9-.2-1.2-.5-.6-1.3-.8-2-.5l-5.4 3.4c-.3.2-.5.5-.5.8 0 .3.1.6.4.8.5.4 1.3.3 1.8-.1l1.9-1.2c.7-.4 1.5-.6 2.3-.6 1.7 0 3.1 1 3.8 2.5.6 1.3.5 2.9-.3 4.1-.9 1.2-2.3 1.9-3.8 1.8-.7 0-1.4-.2-2-.5l-5.5 3.5c-.3.2-.6.3-1 .3z" fill="#fff"/></svg>' },
  { id: 'angular',  label: 'Angular',    file: 'app.component.ts', lang: 'angular-ts',  icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="#dd0031"><path d="M12 2L2 6.5l1.6 13.2L12 22l8.4-2.3L22 6.5z"/><path d="M12 4.3l7 2.9-1.3 10.5L12 19.7l-5.7-2-1.3-10.5z" fill="#c3002f"/><path d="M12 6.5L8.5 15h1.3l.7-1.8h3l.7 1.8h1.3L12 6.5zm0 2.4l1.1 2.9h-2.2z" fill="#fff"/></svg>' },
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
    '@tuvix.js/react':   `https://esm.sh/@tuvix.js/react@${TUVIX}`,
    'react':             'https://esm.sh/react@18',
    'react-dom':         'https://esm.sh/react-dom@18',
    'react-dom/client':  'https://esm.sh/react-dom@18/client',
    'react/jsx-runtime': 'https://esm.sh/react@18/jsx-runtime',
  },
  vue: {
    '@tuvix.js/vue': `https://esm.sh/@tuvix.js/vue@${TUVIX}`,
    'vue': 'https://esm.sh/vue@3',
  },
  svelte: {
    '@tuvix.js/svelte':   `https://esm.sh/@tuvix.js/svelte@${TUVIX}`,
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
const demoType   = ref<'counter' | 'todo'>('counter');
const editorEl   = ref<HTMLElement>();
const iframeEl   = ref<HTMLIFrameElement>();
const messages   = ref<{ kind: string; text: string; line?: number }[]>([]);
const compiling  = ref(false);

const activeTabObj = computed(() => TABS.find(t => t.id === activeTab.value));

function getCode(tabId: string, demo: string): string {
  return DEMO_CODES[tabId]?.[demo] ?? '';
}

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
import { defineComponent } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';
${userImports}

const __component = defineComponent({
  setup() {
${bodyLines.join('\n')}
    return { ${names.join(', ')} };
  },
  template: \`${escapedTpl}\`,
});

const __app = createVueMicroApp({
  name: 'vue-sfc',
  App: __component,
});
__app.mount({ container: document.getElementById('app') as HTMLElement });
`;
}

// ── Svelte transformer ─────────────────────────────────────────────
async function transformSvelte(code: string): Promise<string> {
  // Load Svelte compiler from CDN (lazy, cached after first load)
  const svelte = await import(/* @vite-ignore */ 'https://esm.sh/svelte@4/compiler');
  const { js } = (svelte as { compile: (code: string, opts: Record<string, unknown>) => { js: { code: string } } }).compile(code, {
    filename: 'App.svelte',
    format: 'esm',
    generate: 'client',
    enableSourcemap: false,
  });
  // Convert `export default App` to a local var so we can mount it
  const compiled = (js.code as string).replace(/export default (\w+)/, 'const __SvelteApp = $1');
  return `import { createSvelteMicroApp } from '@tuvix.js/svelte';
${compiled}
const __app = createSvelteMicroApp({ name: 'svelte-app', App: __SvelteApp });
__app.mount({ container: document.getElementById('app') as HTMLElement });`;
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
    if (tabId === 'vue' && code.includes('<template>')) {
      // Vue SFC format — use SFC transformer
      compiled = await compileWithEsbuild(transformVueSFC(code), 'typescript');
    } else if (tabId === 'vue') {
      // Vue TypeScript format — compile directly
      compiled = await compileWithEsbuild(code, 'typescript');
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
function loadEditor(tabId: string, demo: string) {
  const tab = TABS.find(t => t.id === tabId)!;
  const code = getCode(tabId, demo);
  if (editorInst && monacoApi) {
    const oldModel = editorInst.getModel();
    const uri = monacoApi.Uri.parse(`file:///playground/${tab.file}`);
    const existing = monacoApi.editor.getModel(uri);
    if (existing) existing.dispose();
    const newModel = monacoApi.editor.createModel(code, tab.lang, uri);
    editorInst.setModel(newModel);
    oldModel?.dispose();
    editorInst.onDidChangeModelContent(() => scheduleCompile(editorInst!.getValue()));
  }
  messages.value = [];
  if (iframeEl.value) iframeEl.value.srcdoc = '';
  scheduleCompile(code);
}

function switchTab(tabId: string) {
  activeTab.value = tabId;
  loadEditor(tabId, demoType.value);
}

function switchDemo(demo: 'counter' | 'todo') {
  demoType.value = demo;
  loadEditor(activeTab.value, demo);
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
  (window as Window & { MonacoEnvironment: { getWorkerUrl: (_: string, label: string) => string } }).MonacoEnvironment = {
    getWorkerUrl(_: string, label: string) {
      const base = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/esm/vs/';
      if (label === 'html' || label === 'handlebars') return base + 'language/html/html.worker.js';
      if (label === 'typescript' || label === 'javascript' || label === 'typescriptreact') return base + 'language/typescript/ts.worker.js';
      return base + 'editor/editor.worker.js';
    },
  };

  // Init Monaco — pin version so worker URLs match
  const loader = await import('@monaco-editor/loader');
  loader.default.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
  const monaco = await loader.default.init();
  monacoApi = monaco;
  if (!editorEl.value) return;

  // Register angular-ts: TypeScript + embedded HTML inside template literals
  monaco.languages.register({ id: 'angular-ts' });
  monaco.languages.setMonarchTokensProvider('angular-ts', {
    defaultToken: '',
    tokenPostfix: '.ts',
    keywords: [
      'abstract','any','as','async','await','boolean','break','case','catch','class',
      'const','constructor','continue','debugger','declare','default','delete','do',
      'else','enum','export','extends','false','finally','for','from','function','get',
      'if','implements','import','in','infer','instanceof','interface','is','keyof',
      'let','module','namespace','never','new','null','number','object','of','package',
      'private','protected','public','readonly','require','return','set','static',
      'string','super','switch','symbol','this','throw','true','try','type','typeof',
      'undefined','unique','unknown','var','void','while','with','yield',
    ],
    tokenizer: {
      root: [
        // Angular: template: ` → switch to embedded HTML (no capture groups — nextEmbedded requires simple rule)
        [/template\s*:\s*`/, { token: 'string.tpl', next: '@htmlTpl', nextEmbedded: 'html' }],
        [/@[a-zA-Z_$][\w$]*/, 'annotation'],
        [/[a-zA-Z_$][\w$]*(?=\s*\()/, { cases: { '@keywords': 'keyword', '@default': 'function' } }],
        [/[a-zA-Z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, { token: 'string.quote', bracket: '@open', next: '@dblString' }],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/'/, { token: 'string.quote', bracket: '@open', next: '@sglString' }],
        [/`/, { token: 'string.quote', bracket: '@open', next: '@backtick' }],
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@blockComment'],
        [/\d+[eE][-+]?\d+/, 'number.float'],
        [/\d+\.\d*[eE][-+]?\d+/, 'number.float'],
        [/\d+\.\d+/, 'number.float'],
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/\d+/, 'number'],
        [/(\.)([a-zA-Z_$][\w$]*)(?=\s*\()/, ['delimiter', 'function']],
        [/(\.)([a-zA-Z_$][\w$]*)/, ['delimiter', 'variable.predefined']],
        [/[;,]/, 'delimiter'],
        [/[{}()[\]]/, 'delimiter'],
        [/[<>](?!.*=>)/, 'delimiter'],
        [/[=!<>]=?/, 'keyword.operator'],
        [/[+\-*/%&|^~?:]/, 'keyword.operator'],
      ],
      htmlTpl: [
        [/`/, { token: 'string.tpl', bracket: '@close', next: '@pop', nextEmbedded: '@pop' }],
      ],
      dblString: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      ],
      sglString: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      ],
      backtick: [
        [/[^\\`$]+/, 'string'],
        [/\\./, 'string.escape'],
        [/\$\{/, { token: 'delimiter', next: '@root' }],
        [/`/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      ],
      blockComment: [
        [/\*\//, 'comment', '@pop'],
        [/./, 'comment'],
      ],
    },
  } as import('monaco-editor').languages.IMonarchLanguage);

  // Register react-ts: TypeScript + JSX syntax highlighting via Monarch
  monaco.languages.register({ id: 'react-ts' });
  monaco.languages.setMonarchTokensProvider('react-ts', {
    defaultToken: '',
    tokenPostfix: '.tsx',
    keywords: [
      'abstract','any','as','async','await','boolean','break','case','catch','class',
      'const','constructor','continue','debugger','declare','default','delete','do',
      'else','enum','export','extends','false','finally','for','from','function','get',
      'if','implements','import','in','infer','instanceof','interface','is','keyof',
      'let','module','namespace','never','new','null','number','object','of','package',
      'private','protected','public','readonly','require','return','set','static',
      'string','super','switch','symbol','this','throw','true','try','type','typeof',
      'undefined','unique','unknown','var','void','while','with','yield',
    ],
    tokenizer: {
      root: [
        // JSX closing tag </div> </Component>
        [/<\/[A-Za-z][A-Za-z0-9.-]*\s*>/, 'tag'],
        // JSX fragment close </>
        [/<\/>/, 'delimiter.html'],
        // JSX fragment open <>
        [/<>/, 'delimiter.html'],
        // JSX opening/self-closing tag: split < from tagName
        [/(<)([A-Za-z][A-Za-z0-9.-]*)/, ['delimiter.html', { token: 'tag', next: '@jsxAttr' }]],
        [/@[a-zA-Z_$][\w$]*/, 'annotation'],
        // Function calls: fn( — keywords stay keyword, rest become function
        [/[a-zA-Z_$][\w$]*(?=\s*\()/, { cases: { '@keywords': 'keyword', '@default': 'function' } }],
        [/[a-zA-Z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, { token: 'string.quote', bracket: '@open', next: '@dblString' }],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/'/, { token: 'string.quote', bracket: '@open', next: '@sglString' }],
        [/`/, { token: 'string.quote', bracket: '@open', next: '@backtick' }],
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@blockComment'],
        [/\d+[eE][-+]?\d+/, 'number.float'],
        [/\d+\.\d*[eE][-+]?\d+/, 'number.float'],
        [/\d+\.\d+/, 'number.float'],
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/\d+/, 'number'],
        // Property access: .method( → function, .prop → variable.predefined
        [/(\.)([a-zA-Z_$][\w$]*)(?=\s*\()/, ['delimiter', 'function']],
        [/(\.)([a-zA-Z_$][\w$]*)/, ['delimiter', 'variable.predefined']],
        [/[;,]/, 'delimiter'],
        [/[{}()[\]]/, 'delimiter'],
        [/[=!<>]=?/, 'keyword.operator'],
        [/[+\-*/%&|^~?:]/, 'keyword.operator'],
      ],
      // Inside a JSX opening tag: collect attributes then pop back
      jsxAttr: [
        [/\/>/, { token: 'delimiter.html', next: '@pop' }],
        [/>/, { token: 'delimiter.html', next: '@pop' }],
        [/[a-zA-Z_][\w-]*/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/"[^"]*"/, 'attribute.value'],
        [/'[^']*'/, 'attribute.value'],
        // { expr } — use jsxExpr to handle nesting (style={{ ... }}, multiline)
        [/\{/, { token: 'delimiter', next: '@jsxExpr' }],
        [/\s+/, ''],
      ],
      // Brace-aware expression inside JSX attribute or children {expr}
      jsxExpr: [
        [/\{/, { token: 'delimiter', next: '@jsxExpr' }],
        [/\}/, { token: 'delimiter', next: '@pop' }],
        [/[a-zA-Z_$][\w$]*(?=\s*\()/, { cases: { '@keywords': 'keyword', '@default': 'function' } }],
        [/[a-zA-Z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/`/, { token: 'string.quote', next: '@backtick' }],
        [/\/\/.*$/, 'comment'],
        [/\d+[eE][-+]?\d+/, 'number.float'],
        [/\d+\.\d+/, 'number.float'],
        [/\d+/, 'number'],
        [/[=!<>]=?/, 'keyword.operator'],
        [/[+\-*/%&|^~?:]/, 'keyword.operator'],
        [/(\.)([a-zA-Z_$][\w$]*)(?=\s*\()/, ['delimiter', 'function']],
        [/(\.)([a-zA-Z_$][\w$]*)/, ['delimiter', 'variable.predefined']],
        [/[;,.()[\]]/, 'delimiter'],
        [/\s+/, ''],
      ],
      dblString: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      ],
      sglString: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      ],
      backtick: [
        [/[^\\`$]+/, 'string'],
        [/\\./, 'string.escape'],
        [/\$\{/, { token: 'delimiter', next: '@root' }],
        [/`/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      ],
      blockComment: [
        [/\*\//, 'comment', '@pop'],
        [/./, 'comment'],
      ],
    },
  } as import('monaco-editor').languages.IMonarchLanguage);

  // Register vanilla-ts: TypeScript + embedded HTML inside = ` template literals
  monaco.languages.register({ id: 'vanilla-ts' });
  monaco.languages.setMonarchTokensProvider('vanilla-ts', {
    defaultToken: '',
    tokenPostfix: '.ts',
    keywords: [
      'abstract','any','as','async','await','boolean','break','case','catch','class',
      'const','constructor','continue','debugger','declare','default','delete','do',
      'else','enum','export','extends','false','finally','for','from','function','get',
      'if','implements','import','in','infer','instanceof','interface','is','keyof',
      'let','module','namespace','never','new','null','number','object','of','package',
      'private','protected','public','readonly','require','return','set','static',
      'string','super','switch','symbol','this','throw','true','try','type','typeof',
      'undefined','unique','unknown','var','void','while','with','yield',
    ],
    tokenizer: {
      root: [
        // = ` (not =>) → embedded HTML template literal
        [/=(?!>)\s*`/, { token: 'string.tpl', next: '@htmlTpl', nextEmbedded: 'html' }],
        [/@[a-zA-Z_$][\w$]*/, 'annotation'],
        [/[a-zA-Z_$][\w$]*(?=\s*\()/, { cases: { '@keywords': 'keyword', '@default': 'function' } }],
        [/[a-zA-Z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, { token: 'string.quote', bracket: '@open', next: '@dblString' }],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/'/, { token: 'string.quote', bracket: '@open', next: '@sglString' }],
        [/`/, { token: 'string.quote', bracket: '@open', next: '@backtick' }],
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@blockComment'],
        [/\d+[eE][-+]?\d+/, 'number.float'],
        [/\d+\.\d*[eE][-+]?\d+/, 'number.float'],
        [/\d+\.\d+/, 'number.float'],
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/\d+/, 'number'],
        [/(\.)([a-zA-Z_$][\w$]*)(?=\s*\()/, ['delimiter', 'function']],
        [/(\.)([a-zA-Z_$][\w$]*)/, ['delimiter', 'variable.predefined']],
        [/[;,]/, 'delimiter'],
        [/[{}()[\]]/, 'delimiter'],
        [/[=!<>]=?/, 'keyword.operator'],
        [/[+\-*/%&|^~?:]/, 'keyword.operator'],
      ],
      // Embedded HTML template — exit on ` or temporarily exit on ${
      htmlTpl: [
        [/`/, { token: 'string.tpl', next: '@pop', nextEmbedded: '@pop' }],
        [/\$\{/, { token: 'delimiter.ts', next: '@tplExpr', nextEmbedded: '@pop' }],
      ],
      // Inside ${ ... } — re-enter HTML on closing }
      tplExpr: [
        [/=(?!>)\s*`/, { token: 'string.tpl', next: '@htmlTpl', nextEmbedded: 'html' }],
        [/`/, { token: 'string.quote', next: '@backtick' }],
        [/\{/, { token: 'delimiter', next: '@tplExpr' }],
        [/\}/, { token: 'delimiter.ts', next: '@pop', nextEmbedded: 'html' }],
        [/[a-zA-Z_$][\w$]*(?=\s*\()/, { cases: { '@keywords': 'keyword', '@default': 'function' } }],
        [/[a-zA-Z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/\/\/.*$/, 'comment'],
        [/\d+[eE][-+]?\d+/, 'number.float'],
        [/\d+\.\d+/, 'number.float'],
        [/\d+/, 'number'],
        [/[=!<>]=?/, 'keyword.operator'],
        [/[+\-*/%&|^~?:]/, 'keyword.operator'],
        [/(\.)([a-zA-Z_$][\w$]*)(?=\s*\()/, ['delimiter', 'function']],
        [/(\.)([a-zA-Z_$][\w$]*)/, ['delimiter', 'variable.predefined']],
        [/[;,.()[\]]/, 'delimiter'],
        [/\s+/, ''],
      ],
      dblString: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      ],
      sglString: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      ],
      backtick: [
        [/[^\\`$]+/, 'string'],
        [/\\./, 'string.escape'],
        [/\$\{/, { token: 'delimiter', next: '@tplExprNoEmbed' }],
        [/`/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      ],
      // Expression inside non-HTML backtick (no re-embed on })
      tplExprNoEmbed: [
        [/\{/, { token: 'delimiter', next: '@tplExprNoEmbed' }],
        [/\}/, { token: 'delimiter', next: '@pop' }],
        [/[a-zA-Z_$][\w$]*(?=\s*\()/, { cases: { '@keywords': 'keyword', '@default': 'function' } }],
        [/[a-zA-Z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/\d+/, 'number'],
        [/[=!<>]=?/, 'keyword.operator'],
        [/[+\-*/%&|^~?:]/, 'keyword.operator'],
        [/(\.)([a-zA-Z_$][\w$]*)(?=\s*\()/, ['delimiter', 'function']],
        [/(\.)([a-zA-Z_$][\w$]*)/, ['delimiter', 'variable.predefined']],
        [/[;,.()[\]]/, 'delimiter'],
        [/\s+/, ''],
      ],
      blockComment: [
        [/\*\//, 'comment', '@pop'],
        [/./, 'comment'],
      ],
    },
  } as import('monaco-editor').languages.IMonarchLanguage);

  // Apply same TS diagnostics to angular-ts
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });

  // Darcula theme (IntelliJ-style)
  monaco.editor.defineTheme('darcula', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '',                    foreground: 'A9B7C6', background: '2B2B2B' },
      { token: 'comment',             foreground: '808080', fontStyle: 'italic' },
      { token: 'comment.doc',         foreground: '629755', fontStyle: 'italic' },
      { token: 'string',              foreground: '6A8759' },
      { token: 'string.escape',       foreground: 'CC7832' },
      { token: 'keyword',             foreground: 'CC7832', fontStyle: 'bold' },
      { token: 'keyword.operator',    foreground: 'CC7832' },
      { token: 'number',              foreground: '6897BB' },
      { token: 'delimiter',           foreground: 'CC7832' },
      { token: 'type',                foreground: 'A9B7C6' },
      { token: 'type.identifier',     foreground: 'A9B7C6' },
      { token: 'identifier',          foreground: 'A9B7C6' },
      { token: 'variable',            foreground: 'A9B7C6' },
      { token: 'variable.predefined', foreground: '9876AA' },
      { token: 'function',            foreground: 'FFC66D' },
      { token: 'tag',                 foreground: 'E8BF6A' },
      { token: 'attribute.name',      foreground: 'BABABA' },
      { token: 'attribute.value',     foreground: '6A8759' },
      { token: 'metatag',             foreground: 'E8BF6A' },
      { token: 'annotation',          foreground: 'BBB529' },
      { token: 'regexp',              foreground: '364135' },
      // JSX / HTML tokens (used by typescriptreact and html language modes)
      { token: 'tag.html',            foreground: 'E8BF6A' },
      { token: 'tag.tsx',             foreground: 'E8BF6A' },
      { token: 'tag.ts',              foreground: 'E8BF6A' },
      { token: 'delimiter.html',      foreground: 'E8BF6A' },
      { token: 'delimiter.tsx',       foreground: 'E8BF6A' },
      { token: 'attribute.name.html', foreground: 'BABABA' },
      { token: 'attribute.name.tsx',  foreground: 'BABABA' },
      { token: 'attribute.value.html',foreground: '6A8759' },
      { token: 'attribute.value.tsx', foreground: '6A8759' },
      { token: 'string.tpl',          foreground: '6A8759' },
      // CSS tokens (Monaco embeds CSS inside style="" attributes automatically)
      { token: 'attribute.name.css',        foreground: '9876AA' },  // property names: font-family, padding
      { token: 'attribute.value.css',       foreground: 'A9B7C6' },
      { token: 'keyword.css',               foreground: '6A8759' },  // value keywords: none, flex, bold, sans-serif
      { token: 'number.css',                foreground: '6897BB' },  // numbers: 24, 0.5
      { token: 'unit.css',                  foreground: '6897BB' },  // px, em, rem, %
      { token: 'string.css',                foreground: '6A8759' },
      { token: 'delimiter.css',             foreground: 'CC7832' },  // : ;
      { token: 'delimiter.bracket.css',     foreground: 'CC7832' },
      { token: 'selector.css',              foreground: 'E8BF6A' },
      { token: 'tag.css',                   foreground: 'E8BF6A' },
      { token: 'pseudo.css',                foreground: 'A9B7C6' },
      { token: 'meta.scss',                 foreground: 'BABABA' },
    ],
    colors: {
      'editor.background':               '#2B2B2B',
      'editor.foreground':               '#A9B7C6',
      'editor.lineHighlightBackground':  '#323232',
      'editor.selectionBackground':      '#214283',
      'editor.inactiveSelectionBackground': '#214283AA',
      'editorLineNumber.foreground':     '#606366',
      'editorLineNumber.activeForeground': '#A4A3A3',
      'editorIndentGuide.background':    '#3B3B3B',
      'editorCursor.foreground':         '#EFEFEF',
      'editorWhitespace.foreground':     '#3B3B3B',
      'editorWidget.background':         '#3C3F41',
      'editorSuggestWidget.background':  '#3C3F41',
      'editorSuggestWidget.border':      '#4B4B4B',
      'editorSuggestWidget.selectedBackground': '#4B6EAF',
      'scrollbarSlider.background':      '#4C5052AA',
      'scrollbarSlider.hoverBackground': '#616161AA',
      'editorBracketHighlight.foreground1': '#FFD700',
      'editorBracketHighlight.foreground2': '#DA70D6',
      'editorBracketHighlight.foreground3': '#87CEFA',
      'editorBracketHighlight.foreground4': '#FFD700',
      'editorBracketHighlight.foreground5': '#DA70D6',
      'editorBracketHighlight.foreground6': '#87CEFA',
    },
  });

  // Configure TypeScript + TSX language services
  const tsDefaults = monaco.languages.typescript.typescriptDefaults;
  tsDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    jsxImportSource: 'react',
    allowJs: true,
  });
  tsDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation:   false,
  });

  // Apply same config to TSX (React)
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation:   false,
  });

  // Create initial model with proper file URI so TypeScript service treats it as a .ts file
  const firstTab = TABS[0];
  const firstCode = getCode(firstTab.id, demoType.value);
  const firstUri = monaco.Uri.parse(`file:///playground/${firstTab.file}`);
  const firstModel = monaco.editor.createModel(firstCode, firstTab.lang, firstUri);

  editorInst = monaco.editor.create(editorEl.value, {
    model:                firstModel,
    theme:                'darcula',
    fontSize:             14,
    fontFamily:           "'FiraCode-Retina', 'Fira Code', 'JetBrains Mono', ui-monospace, monospace",
    fontLigatures:        true,
    minimap:              { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers:          'on',
    tabSize:              2,
    automaticLayout:      true,
    padding:              { top: 14 },
    wordWrap:             'on',
    lineHeight:           30,
    renderWhitespace:     'none',
    bracketPairColorization: { enabled: true },
  });

  editorInst.onDidChangeModelContent(() => scheduleCompile(editorInst!.getValue()));
  scheduleCompile(firstCode);
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

/* ── Demo bar ───────────────────────────────────── */
.demo-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  flex-shrink: 0;
}

.demo-btn {
  padding: 3px 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: none;
  color: var(--vp-c-text-3);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--vp-font-family-base);
  line-height: 1.4;
}

.demo-btn:hover { background: var(--vp-c-bg-mute); color: var(--vp-c-text-1); }
.demo-btn.active { background: rgba(0, 229, 160, 0.1); color: var(--vp-c-brand-1); border-color: rgba(0, 229, 160, 0.3); }

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

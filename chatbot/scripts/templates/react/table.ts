import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'basic',
    description: 'Basic table with headers, rows, and alternating row colors',
    tags: ['table', 'basic', 'data'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function BasicTable() {
  const headers = ['Name', 'Email', 'Role', 'Status'];
  const rows = [
    ['Alice Johnson', 'alice@mail.com', 'Admin', 'Active'],
    ['Bob Smith', 'bob@mail.com', 'Editor', 'Active'],
    ['Carol Davis', 'carol@mail.com', 'Viewer', 'Inactive'],
    ['Dan Lee', 'dan@mail.com', 'Editor', 'Active'],
  ];

  return (
    <div style={{ overflow: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            {headers.map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
              {row.map((cell, j) => <td key={j} style={{ padding: '10px 16px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default createReactMicroApp({ name: 'basic-table', App: BasicTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'sortable',
    description: 'Sortable table with clickable column headers',
    tags: ['table', 'sortable', 'interactive'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

interface Row { name: string; age: number; city: string }

function SortableTable() {
  const data: Row[] = [
    { name: 'Alice', age: 28, city: 'NYC' },
    { name: 'Bob', age: 34, city: 'LA' },
    { name: 'Carol', age: 22, city: 'Chicago' },
    { name: 'Dan', age: 41, city: 'Houston' },
    { name: 'Eve', age: 30, city: 'Phoenix' },
  ];
  const [sortKey, setSortKey] = useState<keyof Row>('name');
  const [asc, setAsc] = useState(true);

  const sorted = [...data].sort((a, b) => {
    const va = a[sortKey]; const vb = b[sortKey];
    const cmp = typeof va === 'number' ? va - (vb as number) : String(va).localeCompare(String(vb));
    return asc ? cmp : -cmp;
  });

  const toggleSort = (key: keyof Row) => { if (sortKey === key) setAsc(!asc); else { setSortKey(key); setAsc(true); } };

  return (
    <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            {(['name', 'age', 'city'] as const).map((key) => (
              <th key={key} onClick={() => toggleSort(key)} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', cursor: 'pointer', borderBottom: '1px solid #e5e7eb', userSelect: 'none' }}>
                {key.charAt(0).toUpperCase() + key.slice(1)} {sortKey === key ? (asc ? '\\u25B2' : '\\u25BC') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.name}>
              <td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.name}</td>
              <td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.age}</td>
              <td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.city}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default createReactMicroApp({ name: 'sortable-table', App: SortableTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'paginated',
    description: 'Table with pagination controls and page size selector',
    tags: ['table', 'paginated', 'navigation'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function PaginatedTable() {
  const allData = Array.from({ length: 50 }).map((_, i) => ({ id: i + 1, name: 'User ' + (i + 1), email: 'user' + (i + 1) + '@mail.com' }));
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const totalPages = Math.ceil(allData.length / pageSize);
  const pageData = allData.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div>
      <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ backgroundColor: '#f9fafb' }}>
            {['ID', 'Name', 'Email'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {pageData.map((row) => (
              <tr key={row.id}><td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.id}</td><td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.name}</td><td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.email}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 4px', fontSize: '14px', color: '#6b7280' }}>
        <span>Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, allData.length)} of {allData.length}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.5 : 1 }}>Prev</button>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.5 : 1 }}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default createReactMicroApp({ name: 'paginated-table', App: PaginatedTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'filterable',
    description: 'Table with column filter inputs',
    tags: ['table', 'filterable', 'search'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function FilterableTable() {
  const data = [
    { name: 'Alice', department: 'Engineering', location: 'NYC' },
    { name: 'Bob', department: 'Design', location: 'LA' },
    { name: 'Carol', department: 'Engineering', location: 'Chicago' },
    { name: 'Dan', department: 'Marketing', location: 'NYC' },
    { name: 'Eve', department: 'Design', location: 'Houston' },
  ];
  const [filter, setFilter] = useState('');
  const filtered = data.filter((r) => Object.values(r).some((v) => v.toLowerCase().includes(filter.toLowerCase())));

  return (
    <div>
      <input placeholder="Filter table..." value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', marginBottom: '12px', outline: 'none', boxSizing: 'border-box', fontSize: '14px' }} />
      <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ backgroundColor: '#f9fafb' }}>
            {['Name', 'Department', 'Location'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.name}><td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.name}</td><td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.department}</td><td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.location}</td></tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={3} style={{ padding: '20px 16px', textAlign: 'center', color: '#9ca3af' }}>No matches found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default createReactMicroApp({ name: 'filterable-table', App: FilterableTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'crud',
    description: 'CRUD table with add, edit, and delete row actions',
    tags: ['table', 'crud', 'editable'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function CrudTable() {
  const [rows, setRows] = useState([{ id: 1, name: 'Item A', qty: 10 }, { id: 2, name: 'Item B', qty: 5 }]);
  const [nextId, setNextId] = useState(3);

  const addRow = () => { setRows([...rows, { id: nextId, name: 'New Item', qty: 0 }]); setNextId(nextId + 1); };
  const deleteRow = (id: number) => setRows(rows.filter((r) => r.id !== id));
  const updateRow = (id: number, field: string, value: string) => setRows(rows.map((r) => r.id === id ? { ...r, [field]: field === 'qty' ? Number(value) : value } : r));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>Inventory</h3>
        <button onClick={addRow} style={{ padding: '6px 16px', border: 'none', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ Add</button>
      </div>
      <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ backgroundColor: '#f9fafb' }}>
            {['Name', 'Qty', 'Actions'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={{ padding: '6px 16px', borderBottom: '1px solid #e5e7eb' }}><input value={row.name} onChange={(e) => updateRow(row.id, 'name', e.target.value)} style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '6px 8px', outline: 'none' }} /></td>
                <td style={{ padding: '6px 16px', borderBottom: '1px solid #e5e7eb' }}><input type="number" value={row.qty} onChange={(e) => updateRow(row.id, 'qty', e.target.value)} style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '6px 8px', width: '60px', outline: 'none' }} /></td>
                <td style={{ padding: '6px 16px', borderBottom: '1px solid #e5e7eb' }}><button onClick={() => deleteRow(row.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default createReactMicroApp({ name: 'crud-table', App: CrudTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'expandable-rows',
    description: 'Table with expandable row details section',
    tags: ['table', 'expandable', 'details'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function ExpandableTable() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const data = [
    { id: 1, name: 'Order #1001', date: '2025-03-10', total: '$120.00', details: 'Widget Pro x2, Cable x1' },
    { id: 2, name: 'Order #1002', date: '2025-03-12', total: '$45.00', details: 'Adapter x3' },
    { id: 3, name: 'Order #1003', date: '2025-03-15', total: '$230.00', details: 'Monitor Stand x1, Keyboard x1' },
  ];

  return (
    <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ backgroundColor: '#f9fafb' }}>
          {['', 'Order', 'Date', 'Total'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {data.map((row) => (
            <React.Fragment key={row.id}>
              <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === row.id ? null : row.id)}>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>{expanded === row.id ? '\\u25BC' : '\\u25B6'}</td>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 500 }}>{row.name}</td>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#6b7280' }}>{row.date}</td>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 600 }}>{row.total}</td>
              </tr>
              {expanded === row.id && (
                <tr><td colSpan={4} style={{ padding: '16px 16px 16px 48px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#6b7280' }}>Items: {row.details}</td></tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default createReactMicroApp({ name: 'expandable-table', App: ExpandableTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'selectable',
    description: 'Table with checkbox row selection and bulk actions',
    tags: ['table', 'selectable', 'checkbox'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function SelectableTable() {
  const data = [
    { id: 1, name: 'File A.pdf', size: '2.4 MB' },
    { id: 2, name: 'Report.docx', size: '1.1 MB' },
    { id: 3, name: 'Image.png', size: '5.2 MB' },
    { id: 4, name: 'Data.csv', size: '0.8 MB' },
  ];
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleAll = () => setSelected(selected.size === data.length ? new Set() : new Set(data.map((d) => d.id)));
  const toggle = (id: number) => { const s = new Set(selected); if (s.has(id)) s.delete(id); else s.add(id); setSelected(s); };

  return (
    <div>
      {selected.size > 0 && (
        <div style={{ padding: '8px 12px', backgroundColor: '#ede9fe', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#6366f1', fontWeight: 500 }}>{selected.size} selected</span>
          <button onClick={() => setSelected(new Set())} style={{ padding: '4px 12px', border: 'none', borderRadius: '4px', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>Delete Selected</button>
        </div>
      )}
      <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ backgroundColor: '#f9fafb' }}>
            <th style={{ width: '40px', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}><input type="checkbox" checked={selected.size === data.length} onChange={toggleAll} /></th>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Size</th>
          </tr></thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} style={{ backgroundColor: selected.has(row.id) ? '#ede9fe' : '#fff' }}>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb' }}><input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} /></td>
                <td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.name}</td>
                <td style={{ padding: '10px 16px', fontSize: '14px', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{row.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default createReactMicroApp({ name: 'selectable-table', App: SelectableTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-actions',
    description: 'Table with per-row action buttons dropdown',
    tags: ['table', 'actions', 'menu'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function ActionsTable() {
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const data = [
    { id: 1, name: 'Alice', role: 'Admin' },
    { id: 2, name: 'Bob', role: 'Editor' },
    { id: 3, name: 'Carol', role: 'Viewer' },
  ];

  return (
    <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'visible', position: 'relative' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ backgroundColor: '#f9fafb' }}>
          {['Name', 'Role', ''].map((h, i) => <th key={i} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.name}</td>
              <td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>{row.role}</td>
              <td style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', position: 'relative' }}>
                <button onClick={() => setOpenMenu(openMenu === row.id ? null : row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>\\u22EF</button>
                {openMenu === row.id && (
                  <div style={{ position: 'absolute', right: '16px', top: '100%', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '120px' }}>
                    {['Edit', 'Duplicate', 'Delete'].map((action) => (
                      <button key={action} onClick={() => setOpenMenu(null)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: action === 'Delete' ? '#ef4444' : '#374151' }}>{action}</button>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default createReactMicroApp({ name: 'actions-table', App: ActionsTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-status',
    description: 'Table with color-coded status badges per row',
    tags: ['table', 'status', 'badge'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function StatusTable() {
  const data = [
    { task: 'Design review', assignee: 'Alice', status: 'completed' },
    { task: 'API integration', assignee: 'Bob', status: 'in-progress' },
    { task: 'Testing', assignee: 'Carol', status: 'pending' },
    { task: 'Deploy to staging', assignee: 'Dan', status: 'failed' },
  ];
  const statusColors: Record<string, { bg: string; text: string }> = {
    completed: { bg: '#dcfce7', text: '#16a34a' },
    'in-progress': { bg: '#dbeafe', text: '#2563eb' },
    pending: { bg: '#fef3c7', text: '#d97706' },
    failed: { bg: '#fee2e2', text: '#dc2626' },
  };

  return (
    <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ backgroundColor: '#f9fafb' }}>
          {['Task', 'Assignee', 'Status'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.task}>
              <td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.task}</td>
              <td style={{ padding: '10px 16px', fontSize: '14px', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{row.assignee}</td>
              <td style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, backgroundColor: statusColors[row.status].bg, color: statusColors[row.status].text }}>{row.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default createReactMicroApp({ name: 'status-table', App: StatusTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'virtualized',
    description: 'Virtualized table rendering only visible rows for performance',
    tags: ['table', 'virtualized', 'performance'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState, useRef, useEffect } from 'react';

function VirtualizedTable() {
  const totalRows = 10000;
  const rowHeight = 36;
  const visibleCount = 15;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const startIdx = Math.floor(scrollTop / rowHeight);
  const endIdx = Math.min(startIdx + visibleCount + 2, totalRows);
  const offsetY = startIdx * rowHeight;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>{totalRows.toLocaleString()} rows (virtualized)</div>
      <div ref={containerRef} style={{ height: visibleCount * rowHeight + 'px', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        <div style={{ height: totalRows * rowHeight + 'px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: offsetY + 'px', width: '100%' }}>
            {Array.from({ length: endIdx - startIdx }).map((_, i) => {
              const idx = startIdx + i;
              return (
                <div key={idx} style={{ height: rowHeight + 'px', display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid #f3f4f6', fontSize: '14px', backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <span style={{ width: '80px', color: '#9ca3af' }}>#{idx + 1}</span>
                  <span style={{ flex: 1 }}>Row Item {idx + 1}</span>
                  <span style={{ color: '#6b7280' }}>{(Math.random() * 100).toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default createReactMicroApp({ name: 'virtualized-table', App: VirtualizedTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'grouped',
    description: 'Table with grouped rows under section headers',
    tags: ['table', 'grouped', 'sections'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function GroupedTable() {
  const groups: Record<string, { name: string; amount: string }[]> = {
    'Q1 2025': [{ name: 'January', amount: '$12,400' }, { name: 'February', amount: '$14,200' }, { name: 'March', amount: '$11,800' }],
    'Q2 2025': [{ name: 'April', amount: '$15,100' }, { name: 'May', amount: '$13,900' }, { name: 'June', amount: '$16,300' }],
  };

  return (
    <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ backgroundColor: '#f9fafb' }}>
          {['Period', 'Revenue'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {Object.entries(groups).map(([group, rows]) => (
            <React.Fragment key={group}>
              <tr><td colSpan={2} style={{ padding: '10px 16px', backgroundColor: '#f3f4f6', fontWeight: 700, fontSize: '13px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{group}</td></tr>
              {rows.map((row) => (
                <tr key={row.name}><td style={{ padding: '10px 16px 10px 32px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.name}</td><td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>{row.amount}</td></tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default createReactMicroApp({ name: 'grouped-table', App: GroupedTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'editable-inline',
    description: 'Table with inline editable cells on double-click',
    tags: ['table', 'editable', 'inline'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React, { useState } from 'react';

function EditableTable() {
  const [data, setData] = useState([
    { id: 1, name: 'Widget A', price: 29.99, stock: 150 },
    { id: 2, name: 'Widget B', price: 49.99, stock: 80 },
    { id: 3, name: 'Widget C', price: 19.99, stock: 200 },
  ]);
  const [editing, setEditing] = useState<{ id: number; field: string } | null>(null);

  const updateField = (id: number, field: string, value: string) => {
    setData(data.map((r) => r.id === id ? { ...r, [field]: field === 'name' ? value : Number(value) } : r));
  };

  return (
    <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ backgroundColor: '#f9fafb' }}>
          {['Product', 'Price', 'Stock'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              {(['name', 'price', 'stock'] as const).map((field) => (
                <td key={field} onDoubleClick={() => setEditing({ id: row.id, field })} style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', cursor: 'text' }}>
                  {editing?.id === row.id && editing.field === field ? (
                    <input autoFocus value={String(row[field])} onChange={(e) => updateField(row.id, field, e.target.value)} onBlur={() => setEditing(null)} onKeyDown={(e) => e.key === 'Enter' && setEditing(null)} style={{ border: '1px solid #6366f1', borderRadius: '4px', padding: '4px 8px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                  ) : (
                    <span>{field === 'price' ? '$' + row[field].toFixed(2) : row[field]}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '8px 16px', fontSize: '12px', color: '#9ca3af' }}>Double-click a cell to edit</div>
    </div>
  );
}

export default createReactMicroApp({ name: 'editable-table', App: EditableTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-summary',
    description: 'Table with summary footer row showing totals',
    tags: ['table', 'summary', 'totals'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function SummaryTable() {
  const data = [
    { product: 'Plan A', users: 120, revenue: 3600 },
    { product: 'Plan B', users: 85, revenue: 5100 },
    { product: 'Plan C', users: 42, revenue: 6300 },
  ];
  const totalUsers = data.reduce((s, r) => s + r.users, 0);
  const totalRevenue = data.reduce((s, r) => s + r.revenue, 0);

  return (
    <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ backgroundColor: '#f9fafb' }}>
          {['Product', 'Users', 'Revenue'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.product}>
              <td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.product}</td>
              <td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{row.users}</td>
              <td style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>\${row.revenue.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '14px' }}>Total</td>
            <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '14px' }}>{totalUsers}</td>
            <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '14px', color: '#6366f1' }}>\${totalRevenue.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default createReactMicroApp({ name: 'summary-table', App: SummaryTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'responsive',
    description: 'Responsive table that stacks on mobile viewports',
    tags: ['table', 'responsive', 'mobile'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function ResponsiveTable() {
  const headers = ['Name', 'Title', 'Department', 'Location'];
  const rows = [
    ['Alice Johnson', 'Lead Engineer', 'Engineering', 'NYC'],
    ['Bob Smith', 'Designer', 'Design', 'LA'],
    ['Carol Davis', 'PM', 'Product', 'Chicago'],
  ];

  return (
    <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
        <thead><tr style={{ backgroundColor: '#f9fafb' }}>
          {headers.map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j} style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default createReactMicroApp({ name: 'responsive-table', App: ResponsiveTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
  {
    variant: 'with-export',
    description: 'Table with export to CSV functionality',
    tags: ['table', 'export', 'csv'],
    code: `import { createReactMicroApp } from '@tuvix.js/react';
import React from 'react';

function ExportTable() {
  const headers = ['Name', 'Email', 'Plan', 'Spend'];
  const data = [
    ['Alice', 'alice@mail.com', 'Pro', '$120'],
    ['Bob', 'bob@mail.com', 'Basic', '$45'],
    ['Carol', 'carol@mail.com', 'Enterprise', '$500'],
    ['Dan', 'dan@mail.com', 'Pro', '$120'],
  ];

  const exportCSV = () => {
    const csv = [headers.join(','), ...data.map((r) => r.join(','))].join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Users</h3>
        <button onClick={exportCSV} style={{ padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Export CSV</button>
      </div>
      <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ backgroundColor: '#f9fafb' }}>
            {headers.map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j} style={{ padding: '10px 16px', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default createReactMicroApp({ name: 'export-table', App: ExportTable });`,
    dependencies: ['@tuvix.js/react', '@tuvix.js/core'],
  },
];

export default templates;

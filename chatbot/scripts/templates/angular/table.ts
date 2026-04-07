import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'basic',
    description: 'Basic table with headers and rows of data',
    tags: ['table', 'basic', 'data'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-basic-table',
  template: \`

    <div class="container">
      <table class="table">
        <thead><tr><th *ngFor="let h of headers">{{ h }}</th></tr></thead>
        <tbody><tr *ngFor="let row of rows"><td *ngFor="let cell of row">{{ cell }}</td></tr></tbody>
      </table>
    </div>
  
  \`,
})
export class BasicTableComponent {
headers = ['Name', 'Email', 'Role', 'Status'];
  rows = [
    ['Alice Johnson', 'alice@example.com', 'Admin', 'Active'],
    ['Bob Smith', 'bob@example.com', 'Editor', 'Active'],
    ['Carol White', 'carol@example.com', 'Viewer', 'Inactive'],
    ['Dave Brown', 'dave@example.com', 'Editor', 'Active'],
  ];
}

const app = defineMicroApp({
  name: 'basic-table',
  async mount({ container }) {
    const el = document.createElement('app-basic-table');
    container.appendChild(el);
    await bootstrapApplication(BasicTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'sortable',
    description: 'Table with clickable column headers for sorting',
    tags: ['table', 'sortable', 'interactive'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-sortable-table',
  template: \`

    <table class="table">
      <thead><tr><th *ngFor="let h of headers" (click)="sort(h)" class="sortable">{{ h }} {{ sortCol===h ? (sortDir==='asc' ? '\\u25B2' : '\\u25BC') : '' }}</th></tr></thead>
      <tbody><tr *ngFor="let row of sorted"><td *ngFor="let h of headers">{{ row[h] }}</td></tr></tbody>
    </table>
  
  \`,
})
export class SortableTableComponent {
headers = ['Name', 'Age', 'City'];
  data: Record<string, string>[] = [
    { Name: 'Alice', Age: '28', City: 'NYC' },
    { Name: 'Bob', Age: '35', City: 'LA' },
    { Name: 'Carol', Age: '22', City: 'Chicago' },
    { Name: 'Dave', Age: '31', City: 'Austin' },
  ];
  sortCol = '';
  sortDir: 'asc' | 'desc' = 'asc';
  get sorted() {
    if (!this.sortCol) return this.data;
    return [...this.data].sort((a, b) => {
      const cmp = (a[this.sortCol] ?? '').localeCompare(b[this.sortCol] ?? '');
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }
  sort(col: string) { if (this.sortCol === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; } else { this.sortCol = col; this.sortDir = 'asc'; } }
}

const app = defineMicroApp({
  name: 'sortable-table',
  async mount({ container }) {
    const el = document.createElement('app-sortable-table');
    container.appendChild(el);
    await bootstrapApplication(SortableTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'paginated',
    description: 'Table with pagination controls for navigating pages',
    tags: ['table', 'paginated', 'navigation'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-paginated-table',
  template: \`

    <table class="table">
      <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
      <tbody><tr *ngFor="let row of pageData"><td>{{ row.id }}</td><td>{{ row.name }}</td><td>{{ row.email }}</td></tr></tbody>
    </table>
    <div class="pagination">
      <button [disabled]="page===1" (click)="page=page-1">Prev</button>
      <span>Page {{ page }} of {{ totalPages }}</span>
      <button [disabled]="page===totalPages" (click)="page=page+1">Next</button>
    </div>
  
  \`,
})
export class PaginatedTableComponent {
perPage = 3;
  page = 1;
  data = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: 'User ' + (i + 1), email: 'user' + (i + 1) + '@mail.com' }));
  get totalPages() { return Math.ceil(this.data.length / this.perPage); }
  get pageData() { const s = (this.page - 1) * this.perPage; return this.data.slice(s, s + this.perPage); }
}

const app = defineMicroApp({
  name: 'paginated-table',
  async mount({ container }) {
    const el = document.createElement('app-paginated-table');
    container.appendChild(el);
    await bootstrapApplication(PaginatedTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'filterable',
    description: 'Table with search filter input above the data',
    tags: ['table', 'filterable', 'search'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-filterable-table',
  template: \`

    <div class="toolbar"><input class="filter" placeholder="Filter..." [value]="query" (input)="query=$any($event.target).value" /></div>
    <table class="table">
      <thead><tr><th>Product</th><th>Category</th><th>Price</th></tr></thead>
      <tbody><tr *ngFor="let row of filtered"><td>{{ row.product }}</td><td>{{ row.category }}</td><td>{{ row.price }}</td></tr></tbody>
    </table>
  
  \`,
})
export class FilterableTableComponent {
query = '';
  data = [
    { product: 'Laptop', category: 'Electronics', price: '$999' },
    { product: 'Desk', category: 'Furniture', price: '$349' },
    { product: 'Headphones', category: 'Electronics', price: '$79' },
    { product: 'Chair', category: 'Furniture', price: '$249' },
    { product: 'Keyboard', category: 'Electronics', price: '$129' },
  ];
  get filtered() { return this.data.filter(r => Object.values(r).some(v => v.toLowerCase().includes(this.query.toLowerCase()))); }
}

const app = defineMicroApp({
  name: 'filterable-table',
  async mount({ container }) {
    const el = document.createElement('app-filterable-table');
    container.appendChild(el);
    await bootstrapApplication(FilterableTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'crud',
    description: 'CRUD table with add, edit and delete row capabilities',
    tags: ['table', 'crud', 'editable'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-crud-table',
  template: \`

    <div class="toolbar"><button class="add-btn" (click)="addRow()">+ Add Row</button></div>
    <table class="table">
      <thead><tr><th>Name</th><th>Value</th><th>Actions</th></tr></thead>
      <tbody>
        <tr *ngFor="let row of rows; let i = index">
          <td>{{ row.name }}</td>
          <td>{{ row.value }}</td>
          <td><button class="action-btn delete" (click)="rows.splice(i, 1)">Delete</button></td>
        </tr>
      </tbody>
    </table>
  
  \`,
})
export class CrudTableComponent {
rows = [
    { name: 'Item A', value: '100' },
    { name: 'Item B', value: '200' },
    { name: 'Item C', value: '300' },
  ];
  addRow() { this.rows.push({ name: 'New Item', value: '0' }); }
}

const app = defineMicroApp({
  name: 'crud-table',
  async mount({ container }) {
    const el = document.createElement('app-crud-table');
    container.appendChild(el);
    await bootstrapApplication(CrudTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'expandable-rows',
    description: 'Table with expandable rows showing detail content',
    tags: ['table', 'expandable', 'detail'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-expandable-table',
  template: \`

    <table class="table">
      <thead><tr><th></th><th>Order</th><th>Customer</th><th>Total</th></tr></thead>
      <tbody>
        <ng-container *ngFor="let row of rows">
          <tr (click)="toggle(row.id)" class="main-row">
            <td>{{ expanded[row.id] ? '\\u25BC' : '\\u25B6' }}</td>
            <td>{{ row.order }}</td><td>{{ row.customer }}</td><td>{{ row.total }}</td>
          </tr>
          <tr *ngIf="expanded[row.id]" class="detail-row">
            <td colspan="4"><div class="detail">{{ row.detail }}</div></td>
          </tr>
        </ng-container>
      </tbody>
    </table>
  
  \`,
})
export class ExpandableTableComponent {
expanded: Record<number, boolean> = {};
  rows = [
    { id: 1, order: '#1001', customer: 'Alice', total: '$120', detail: 'Ordered: Laptop Stand, USB Hub' },
    { id: 2, order: '#1002', customer: 'Bob', total: '$85', detail: 'Ordered: Wireless Mouse, Mousepad' },
    { id: 3, order: '#1003', customer: 'Carol', total: '$220', detail: 'Ordered: Mechanical Keyboard, Wrist Rest' },
  ];
  toggle(id: number) { this.expanded[id] = !this.expanded[id]; }
}

const app = defineMicroApp({
  name: 'expandable-rows-table',
  async mount({ container }) {
    const el = document.createElement('app-expandable-table');
    container.appendChild(el);
    await bootstrapApplication(ExpandableTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'selectable',
    description: 'Table with row selection checkboxes',
    tags: ['table', 'selectable', 'checkbox'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-selectable-table',
  template: \`

    <div class="toolbar">{{ selectedCount }} selected</div>
    <table class="table">
      <thead><tr><th><input type="checkbox" [checked]="allSelected" (change)="toggleAll()" /></th><th>Name</th><th>Email</th></tr></thead>
      <tbody><tr *ngFor="let row of rows" [class.selected]="row.selected">
        <td><input type="checkbox" [checked]="row.selected" (change)="row.selected=!row.selected" /></td>
        <td>{{ row.name }}</td><td>{{ row.email }}</td>
      </tr></tbody>
    </table>
  
  \`,
})
export class SelectableTableComponent {
rows = [
    { name: 'Alice', email: 'alice@mail.com', selected: false },
    { name: 'Bob', email: 'bob@mail.com', selected: false },
    { name: 'Carol', email: 'carol@mail.com', selected: false },
    { name: 'Dave', email: 'dave@mail.com', selected: false },
  ];
  get selectedCount() { return this.rows.filter(r => r.selected).length; }
  get allSelected() { return this.rows.every(r => r.selected); }
  toggleAll() { const next = !this.allSelected; this.rows.forEach(r => r.selected = next); }
}

const app = defineMicroApp({
  name: 'selectable-table',
  async mount({ container }) {
    const el = document.createElement('app-selectable-table');
    container.appendChild(el);
    await bootstrapApplication(SelectableTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-actions',
    description: 'Table with action buttons in each row',
    tags: ['table', 'actions', 'buttons'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-actions-table',
  template: \`

    <table class="table">
      <thead><tr><th>Name</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody><tr *ngFor="let row of rows">
        <td>{{ row.name }}</td>
        <td><span class="badge" [class]="row.status">{{ row.status }}</span></td>
        <td class="action-cell"><button class="btn-sm">Edit</button><button class="btn-sm">View</button><button class="btn-sm danger">Delete</button></td>
      </tr></tbody>
    </table>
  
  \`,
})
export class ActionsTableComponent {
rows = [
    { name: 'Project Alpha', status: 'active' },
    { name: 'Project Beta', status: 'inactive' },
    { name: 'Project Gamma', status: 'active' },
  ];
}

const app = defineMicroApp({
  name: 'actions-table',
  async mount({ container }) {
    const el = document.createElement('app-actions-table');
    container.appendChild(el);
    await bootstrapApplication(ActionsTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-status',
    description: 'Table with color-coded status indicators',
    tags: ['table', 'status', 'indicator'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-status-table',
  template: \`

    <table class="table">
      <thead><tr><th>Service</th><th>Region</th><th>Uptime</th><th>Status</th></tr></thead>
      <tbody><tr *ngFor="let row of rows">
        <td class="name">{{ row.service }}</td><td>{{ row.region }}</td><td>{{ row.uptime }}</td>
        <td><span class="status"><span class="dot" [style.background]="statusColor(row.status)"></span>{{ row.status }}</span></td>
      </tr></tbody>
    </table>
  
  \`,
})
export class StatusTableComponent {
rows = [
    { service: 'API', region: 'US-East', uptime: '99.99%', status: 'Operational' },
    { service: 'CDN', region: 'Global', uptime: '99.95%', status: 'Degraded' },
    { service: 'Database', region: 'US-East', uptime: '99.97%', status: 'Operational' },
    { service: 'Auth', region: 'EU-West', uptime: '98.50%', status: 'Outage' },
  ];
  statusColor(s: string) { return s === 'Operational' ? '#10b981' : s === 'Degraded' ? '#f59e0b' : '#ef4444'; }
}

const app = defineMicroApp({
  name: 'status-table',
  async mount({ container }) {
    const el = document.createElement('app-status-table');
    container.appendChild(el);
    await bootstrapApplication(StatusTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'virtualized',
    description: 'Virtualized table rendering visible rows for large datasets',
    tags: ['table', 'virtualized', 'performance'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-virtualized-table',
  template: \`

    <div class="info">Showing {{ visibleStart + 1 }}-{{ visibleEnd }} of {{ data.length }} rows</div>
    <div class="scroll-container" (scroll)="onScroll($event)">
      <div [style.height.px]="data.length * rowHeight">
        <table class="table" [style.transform]="'translateY(' + visibleStart * rowHeight + 'px)'">
          <thead><tr><th>ID</th><th>Name</th><th>Value</th></tr></thead>
          <tbody><tr *ngFor="let row of visibleRows"><td>{{ row.id }}</td><td>{{ row.name }}</td><td>{{ row.value }}</td></tr></tbody>
        </table>
      </div>
    </div>
  
  \`,
})
export class VirtualizedTableComponent {
rowHeight = 36;
  visibleCount = 10;
  visibleStart = 0;
  data = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, name: 'Row ' + (i + 1), value: Math.floor(Math.random() * 1000) }));
  get visibleEnd() { return Math.min(this.visibleStart + this.visibleCount, this.data.length); }
  get visibleRows() { return this.data.slice(this.visibleStart, this.visibleEnd); }
  onScroll(e: Event) { this.visibleStart = Math.floor((e.target as HTMLElement).scrollTop / this.rowHeight); }
}

const app = defineMicroApp({
  name: 'virtualized-table',
  async mount({ container }) {
    const el = document.createElement('app-virtualized-table');
    container.appendChild(el);
    await bootstrapApplication(VirtualizedTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'grouped',
    description: 'Table with grouped rows under section headers',
    tags: ['table', 'grouped', 'sections'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-grouped-table',
  template: \`

    <table class="table">
      <ng-container *ngFor="let group of groups">
        <thead><tr><th colspan="3" class="group-header">{{ group.label }} ({{ group.items.length }})</th></tr></thead>
        <tbody><tr *ngFor="let item of group.items"><td>{{ item.name }}</td><td>{{ item.type }}</td><td>{{ item.size }}</td></tr></tbody>
      </ng-container>
    </table>
  
  \`,
})
export class GroupedTableComponent {
groups = [
    { label: 'Documents', items: [{ name: 'Report.pdf', type: 'PDF', size: '2.4 MB' }, { name: 'Notes.docx', type: 'Word', size: '128 KB' }] },
    { label: 'Images', items: [{ name: 'Photo.jpg', type: 'JPEG', size: '3.1 MB' }, { name: 'Logo.png', type: 'PNG', size: '45 KB' }] },
    { label: 'Code', items: [{ name: 'App.ts', type: 'TypeScript', size: '8 KB' }, { name: 'Style.css', type: 'CSS', size: '3 KB' }] },
  ];
}

const app = defineMicroApp({
  name: 'grouped-table',
  async mount({ container }) {
    const el = document.createElement('app-grouped-table');
    container.appendChild(el);
    await bootstrapApplication(GroupedTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'editable-inline',
    description: 'Table with inline editing on cell click',
    tags: ['table', 'editable', 'inline'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-editable-table',
  template: \`

    <table class="table">
      <thead><tr><th>Name</th><th>Role</th><th>Department</th></tr></thead>
      <tbody><tr *ngFor="let row of rows; let i = index">
        <td *ngFor="let col of cols" (dblclick)="startEdit(i, col)" class="cell">
          <input *ngIf="editing===i+col" class="edit-input" [value]="row[col]" (blur)="save(i, col, $event)" (keydown.enter)="save(i, col, $event)" autofocus />
          <span *ngIf="editing!==i+col">{{ row[col] }}</span>
        </td>
      </tr></tbody>
    </table>
    <p class="hint">Double-click a cell to edit</p>
  
  \`,
})
export class EditableTableComponent {
cols = ['name', 'role', 'dept'];
  rows: Record<string, string>[] = [
    { name: 'Alice', role: 'Admin', dept: 'Engineering' },
    { name: 'Bob', role: 'Editor', dept: 'Marketing' },
    { name: 'Carol', role: 'Viewer', dept: 'Sales' },
  ];
  editing = '';
  startEdit(i: number, col: string) { this.editing = i + col; }
  save(i: number, col: string, e: Event) { this.rows[i][col] = (e.target as HTMLInputElement).value; this.editing = ''; }
}

const app = defineMicroApp({
  name: 'editable-inline-table',
  async mount({ container }) {
    const el = document.createElement('app-editable-table');
    container.appendChild(el);
    await bootstrapApplication(EditableTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-summary',
    description: 'Table with a summary/totals footer row',
    tags: ['table', 'summary', 'totals'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-summary-table',
  template: \`

    <table class="table">
      <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody><tr *ngFor="let row of rows"><td>{{ row.product }}</td><td>{{ row.qty }}</td><td>{{ '$' + row.price }}</td><td>{{ '$' + (row.qty * row.price) }}</td></tr></tbody>
      <tfoot><tr class="summary"><td colspan="3">Grand Total</td><td>{{ '$' + grandTotal }}</td></tr></tfoot>
    </table>
  
  \`,
})
export class SummaryTableComponent {
rows = [
    { product: 'Widget A', qty: 5, price: 20 },
    { product: 'Widget B', qty: 3, price: 45 },
    { product: 'Widget C', qty: 8, price: 12 },
    { product: 'Widget D', qty: 2, price: 80 },
  ];
  get grandTotal() { return this.rows.reduce((sum, r) => sum + r.qty * r.price, 0); }
}

const app = defineMicroApp({
  name: 'summary-table',
  async mount({ container }) {
    const el = document.createElement('app-summary-table');
    container.appendChild(el);
    await bootstrapApplication(SummaryTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'responsive',
    description: 'Responsive table that adapts to small screen sizes',
    tags: ['table', 'responsive', 'mobile'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-responsive-table',
  template: \`

    <div class="table-wrapper">
      <table class="table">
        <thead><tr><th *ngFor="let h of headers">{{ h }}</th></tr></thead>
        <tbody><tr *ngFor="let row of rows"><td *ngFor="let h of headers" [attr.data-label]="h">{{ row[h] }}</td></tr></tbody>
      </table>
    </div>
  
  \`,
})
export class ResponsiveTableComponent {
headers = ['Name', 'Email', 'Role', 'Status', 'Joined'];
  rows: Record<string, string>[] = [
    { Name: 'Alice', Email: 'alice@co.com', Role: 'Admin', Status: 'Active', Joined: 'Jan 2023' },
    { Name: 'Bob', Email: 'bob@co.com', Role: 'Dev', Status: 'Active', Joined: 'Mar 2023' },
    { Name: 'Carol', Email: 'carol@co.com', Role: 'Design', Status: 'Inactive', Joined: 'Jul 2022' },
  ];
}

const app = defineMicroApp({
  name: 'responsive-table',
  async mount({ container }) {
    const el = document.createElement('app-responsive-table');
    container.appendChild(el);
    await bootstrapApplication(ResponsiveTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-export',
    description: 'Table with CSV export button for data download',
    tags: ['table', 'export', 'csv'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-export-table',
  template: \`

    <div class="toolbar"><button class="export-btn" (click)="exportCSV()">Export CSV</button></div>
    <table class="table">
      <thead><tr><th *ngFor="let h of headers">{{ h }}</th></tr></thead>
      <tbody><tr *ngFor="let row of rows"><td *ngFor="let h of headers">{{ row[h] }}</td></tr></tbody>
    </table>
  
  \`,
})
export class ExportTableComponent {
headers = ['Name', 'Revenue', 'Growth'];
  rows: Record<string, string>[] = [
    { Name: 'Product A', Revenue: '$12,400', Growth: '+15%' },
    { Name: 'Product B', Revenue: '$8,200', Growth: '+8%' },
    { Name: 'Product C', Revenue: '$23,100', Growth: '+22%' },
    { Name: 'Product D', Revenue: '$5,600', Growth: '-3%' },
  ];
  exportCSV() {
    const csv = [this.headers.join(','), ...this.rows.map(r => this.headers.map(h => r[h]).join(','))].join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}

const app = defineMicroApp({
  name: 'export-table',
  async mount({ container }) {
    const el = document.createElement('app-export-table');
    container.appendChild(el);
    await bootstrapApplication(ExportTableComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
];

export default templates;

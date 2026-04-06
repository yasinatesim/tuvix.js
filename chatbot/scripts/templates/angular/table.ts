import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'basic',
    description: 'Basic table with headers and rows of data',
    tags: ['table', 'basic', 'data'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-basic-table',
  template: \`
    <div class="container">
      <table class="table">
        <thead><tr><th *ngFor="let h of headers">{{ h }}</th></tr></thead>
        <tbody><tr *ngFor="let row of rows"><td *ngFor="let cell of row">{{ cell }}</td></tr></tbody>
      </table>
    </div>
  \`,
  styles: [\`
    .container { overflow-x: auto; }
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { font-weight: 600; color: #374151; background: #f9fafb; }
    td { color: #6b7280; }
    tr:hover td { background: #f9fafb; }
  \`]
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

@NgModule({ declarations: [BasicTableComponent], imports: [BrowserModule], bootstrap: [BasicTableComponent] })
export class BasicTableModule {}

export default createAngularMicroApp({ name: 'basic-table', module: BasicTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'sortable',
    description: 'Table with clickable column headers for sorting',
    tags: ['table', 'sortable', 'interactive'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-sortable-table',
  template: \`
    <table class="table">
      <thead><tr><th *ngFor="let h of headers" (click)="sort(h)" class="sortable">{{ h }} {{ sortCol===h ? (sortDir==='asc' ? '\\u25B2' : '\\u25BC') : '' }}</th></tr></thead>
      <tbody><tr *ngFor="let row of sorted"><td *ngFor="let h of headers">{{ row[h] }}</td></tr></tbody>
    </table>
  \`,
  styles: [\`
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { font-weight: 600; background: #f9fafb; }
    .sortable { cursor: pointer; user-select: none; }
    .sortable:hover { color: #6366f1; }
    td { color: #6b7280; }
  \`]
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

@NgModule({ declarations: [SortableTableComponent], imports: [BrowserModule], bootstrap: [SortableTableComponent] })
export class SortableTableModule {}

export default createAngularMicroApp({ name: 'sortable-table', module: SortableTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'paginated',
    description: 'Table with pagination controls for navigating pages',
    tags: ['table', 'paginated', 'navigation'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { font-weight: 600; background: #f9fafb; }
    td { color: #6b7280; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; padding: 16px; font-size: 14px; }
    .pagination button { padding: 6px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
    .pagination button:disabled { opacity: 0.4; cursor: default; }
  \`]
})
export class PaginatedTableComponent {
  perPage = 3;
  page = 1;
  data = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: 'User ' + (i + 1), email: 'user' + (i + 1) + '@mail.com' }));
  get totalPages() { return Math.ceil(this.data.length / this.perPage); }
  get pageData() { const s = (this.page - 1) * this.perPage; return this.data.slice(s, s + this.perPage); }
}

@NgModule({ declarations: [PaginatedTableComponent], imports: [BrowserModule], bootstrap: [PaginatedTableComponent] })
export class PaginatedTableModule {}

export default createAngularMicroApp({ name: 'paginated-table', module: PaginatedTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'filterable',
    description: 'Table with search filter input above the data',
    tags: ['table', 'filterable', 'search'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-filterable-table',
  template: \`
    <div class="toolbar"><input class="filter" placeholder="Filter..." [value]="query" (input)="query=$any($event.target).value" /></div>
    <table class="table">
      <thead><tr><th>Product</th><th>Category</th><th>Price</th></tr></thead>
      <tbody><tr *ngFor="let row of filtered"><td>{{ row.product }}</td><td>{{ row.category }}</td><td>{{ row.price }}</td></tr></tbody>
    </table>
  \`,
  styles: [\`
    .toolbar { padding: 12px 0; }
    .filter { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; width: 240px; outline: none; }
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { font-weight: 600; background: #f9fafb; }
    td { color: #6b7280; }
  \`]
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

@NgModule({ declarations: [FilterableTableComponent], imports: [BrowserModule], bootstrap: [FilterableTableComponent] })
export class FilterableTableModule {}

export default createAngularMicroApp({ name: 'filterable-table', module: FilterableTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'crud',
    description: 'CRUD table with add, edit and delete row capabilities',
    tags: ['table', 'crud', 'editable'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .toolbar { padding: 12px 0; }
    .add-btn { padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { font-weight: 600; background: #f9fafb; }
    .action-btn { padding: 4px 12px; border: 1px solid #d1d5db; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; }
    .delete { color: #ef4444; border-color: #fca5a5; }
  \`]
})
export class CrudTableComponent {
  rows = [
    { name: 'Item A', value: '100' },
    { name: 'Item B', value: '200' },
    { name: 'Item C', value: '300' },
  ];
  addRow() { this.rows.push({ name: 'New Item', value: '0' }); }
}

@NgModule({ declarations: [CrudTableComponent], imports: [BrowserModule], bootstrap: [CrudTableComponent] })
export class CrudTableModule {}

export default createAngularMicroApp({ name: 'crud-table', module: CrudTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'expandable-rows',
    description: 'Table with expandable rows showing detail content',
    tags: ['table', 'expandable', 'detail'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { font-weight: 600; background: #f9fafb; }
    .main-row { cursor: pointer; }
    .main-row:hover td { background: #f9fafb; }
    .detail-row td { background: #f3f4f6; }
    .detail { padding: 8px; font-size: 13px; color: #6b7280; }
  \`]
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

@NgModule({ declarations: [ExpandableTableComponent], imports: [BrowserModule], bootstrap: [ExpandableTableComponent] })
export class ExpandableTableModule {}

export default createAngularMicroApp({ name: 'expandable-rows-table', module: ExpandableTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'selectable',
    description: 'Table with row selection checkboxes',
    tags: ['table', 'selectable', 'checkbox'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .toolbar { padding: 8px 0; font-size: 13px; color: #6b7280; }
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { font-weight: 600; background: #f9fafb; }
    tr.selected td { background: #ede9fe; }
  \`]
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

@NgModule({ declarations: [SelectableTableComponent], imports: [BrowserModule], bootstrap: [SelectableTableComponent] })
export class SelectableTableModule {}

export default createAngularMicroApp({ name: 'selectable-table', module: SelectableTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-actions',
    description: 'Table with action buttons in each row',
    tags: ['table', 'actions', 'buttons'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { font-weight: 600; background: #f9fafb; }
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge.active { background: #d1fae5; color: #065f46; }
    .badge.inactive { background: #fee2e2; color: #991b1b; }
    .action-cell { display: flex; gap: 4px; }
    .btn-sm { padding: 4px 10px; border: 1px solid #d1d5db; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; }
    .btn-sm.danger { color: #ef4444; border-color: #fca5a5; }
  \`]
})
export class ActionsTableComponent {
  rows = [
    { name: 'Project Alpha', status: 'active' },
    { name: 'Project Beta', status: 'inactive' },
    { name: 'Project Gamma', status: 'active' },
  ];
}

@NgModule({ declarations: [ActionsTableComponent], imports: [BrowserModule], bootstrap: [ActionsTableComponent] })
export class ActionsTableModule {}

export default createAngularMicroApp({ name: 'actions-table', module: ActionsTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-status',
    description: 'Table with color-coded status indicators',
    tags: ['table', 'status', 'indicator'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { font-weight: 600; background: #f9fafb; }
    .name { font-weight: 500; color: #374151; }
    td { color: #6b7280; }
    .status { display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
  \`]
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

@NgModule({ declarations: [StatusTableComponent], imports: [BrowserModule], bootstrap: [StatusTableComponent] })
export class StatusTableModule {}

export default createAngularMicroApp({ name: 'status-table', module: StatusTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'virtualized',
    description: 'Virtualized table rendering visible rows for large datasets',
    tags: ['table', 'virtualized', 'performance'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .info { font-size: 12px; color: #9ca3af; padding: 8px 0; }
    .scroll-container { height: 300px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; }
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 16px; text-align: left; font-size: 13px; }
    th { font-weight: 600; background: #f9fafb; position: sticky; top: 0; }
    td { color: #6b7280; border-bottom: 1px solid #f3f4f6; }
  \`]
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

@NgModule({ declarations: [VirtualizedTableComponent], imports: [BrowserModule], bootstrap: [VirtualizedTableComponent] })
export class VirtualizedTableModule {}

export default createAngularMicroApp({ name: 'virtualized-table', module: VirtualizedTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'grouped',
    description: 'Table with grouped rows under section headers',
    tags: ['table', 'grouped', 'sections'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-grouped-table',
  template: \`
    <table class="table">
      <ng-container *ngFor="let group of groups">
        <thead><tr><th colspan="3" class="group-header">{{ group.label }} ({{ group.items.length }})</th></tr></thead>
        <tbody><tr *ngFor="let item of group.items"><td>{{ item.name }}</td><td>{{ item.type }}</td><td>{{ item.size }}</td></tr></tbody>
      </ng-container>
    </table>
  \`,
  styles: [\`
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 16px; text-align: left; font-size: 14px; }
    .group-header { background: #f3f4f6; font-weight: 700; color: #374151; border-bottom: 2px solid #e5e7eb; }
    td { color: #6b7280; border-bottom: 1px solid #f3f4f6; }
  \`]
})
export class GroupedTableComponent {
  groups = [
    { label: 'Documents', items: [{ name: 'Report.pdf', type: 'PDF', size: '2.4 MB' }, { name: 'Notes.docx', type: 'Word', size: '128 KB' }] },
    { label: 'Images', items: [{ name: 'Photo.jpg', type: 'JPEG', size: '3.1 MB' }, { name: 'Logo.png', type: 'PNG', size: '45 KB' }] },
    { label: 'Code', items: [{ name: 'App.ts', type: 'TypeScript', size: '8 KB' }, { name: 'Style.css', type: 'CSS', size: '3 KB' }] },
  ];
}

@NgModule({ declarations: [GroupedTableComponent], imports: [BrowserModule], bootstrap: [GroupedTableComponent] })
export class GroupedTableModule {}

export default createAngularMicroApp({ name: 'grouped-table', module: GroupedTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'editable-inline',
    description: 'Table with inline editing on cell click',
    tags: ['table', 'editable', 'inline'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { font-weight: 600; background: #f9fafb; }
    .cell { cursor: pointer; min-width: 120px; }
    .cell:hover { background: #f9fafb; }
    .edit-input { width: 100%; padding: 4px 8px; border: 2px solid #6366f1; border-radius: 4px; font-size: 14px; outline: none; box-sizing: border-box; }
    .hint { font-size: 12px; color: #9ca3af; margin-top: 8px; }
  \`]
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

@NgModule({ declarations: [EditableTableComponent], imports: [BrowserModule], bootstrap: [EditableTableComponent] })
export class EditableTableModule {}

export default createAngularMicroApp({ name: 'editable-inline-table', module: EditableTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-summary',
    description: 'Table with a summary/totals footer row',
    tags: ['table', 'summary', 'totals'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-summary-table',
  template: \`
    <table class="table">
      <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody><tr *ngFor="let row of rows"><td>{{ row.product }}</td><td>{{ row.qty }}</td><td>{{ '$' + row.price }}</td><td>{{ '$' + (row.qty * row.price) }}</td></tr></tbody>
      <tfoot><tr class="summary"><td colspan="3">Grand Total</td><td>{{ '$' + grandTotal }}</td></tr></tfoot>
    </table>
  \`,
  styles: [\`
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { font-weight: 600; background: #f9fafb; }
    td { color: #6b7280; }
    .summary td { font-weight: 700; color: #374151; background: #f9fafb; border-top: 2px solid #e5e7eb; }
  \`]
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

@NgModule({ declarations: [SummaryTableComponent], imports: [BrowserModule], bootstrap: [SummaryTableComponent] })
export class SummaryTableModule {}

export default createAngularMicroApp({ name: 'summary-table', module: SummaryTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'responsive',
    description: 'Responsive table that adapts to small screen sizes',
    tags: ['table', 'responsive', 'mobile'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-responsive-table',
  template: \`
    <div class="table-wrapper">
      <table class="table">
        <thead><tr><th *ngFor="let h of headers">{{ h }}</th></tr></thead>
        <tbody><tr *ngFor="let row of rows"><td *ngFor="let h of headers" [attr.data-label]="h">{{ row[h] }}</td></tr></tbody>
      </table>
    </div>
  \`,
  styles: [\`
    .table-wrapper { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 8px; }
    .table { width: 100%; border-collapse: collapse; min-width: 600px; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; white-space: nowrap; }
    th { font-weight: 600; background: #f9fafb; }
    td { color: #6b7280; }
  \`]
})
export class ResponsiveTableComponent {
  headers = ['Name', 'Email', 'Role', 'Status', 'Joined'];
  rows: Record<string, string>[] = [
    { Name: 'Alice', Email: 'alice@co.com', Role: 'Admin', Status: 'Active', Joined: 'Jan 2023' },
    { Name: 'Bob', Email: 'bob@co.com', Role: 'Dev', Status: 'Active', Joined: 'Mar 2023' },
    { Name: 'Carol', Email: 'carol@co.com', Role: 'Design', Status: 'Inactive', Joined: 'Jul 2022' },
  ];
}

@NgModule({ declarations: [ResponsiveTableComponent], imports: [BrowserModule], bootstrap: [ResponsiveTableComponent] })
export class ResponsiveTableModule {}

export default createAngularMicroApp({ name: 'responsive-table', module: ResponsiveTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-export',
    description: 'Table with CSV export button for data download',
    tags: ['table', 'export', 'csv'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-export-table',
  template: \`
    <div class="toolbar"><button class="export-btn" (click)="exportCSV()">Export CSV</button></div>
    <table class="table">
      <thead><tr><th *ngFor="let h of headers">{{ h }}</th></tr></thead>
      <tbody><tr *ngFor="let row of rows"><td *ngFor="let h of headers">{{ row[h] }}</td></tr></tbody>
    </table>
  \`,
  styles: [\`
    .toolbar { padding: 12px 0; display: flex; justify-content: flex-end; }
    .export-btn { padding: 8px 16px; background: #10b981; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { font-weight: 600; background: #f9fafb; }
    td { color: #6b7280; }
  \`]
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

@NgModule({ declarations: [ExportTableComponent], imports: [BrowserModule], bootstrap: [ExportTableComponent] })
export class ExportTableModule {}

export default createAngularMicroApp({ name: 'export-table', module: ExportTableModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
];

export default templates;

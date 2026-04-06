import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'basic',
    description: 'Basic data table with header row and striped rows',
    tags: ['table', 'basic', 'data'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const BasicTable = defineComponent({
  setup() {
  const columns = ref(['Name', 'Email', 'Role', 'Status']);
      const rows = ref([
        { Name: 'Alice', Email: 'alice@example.com', Role: 'Admin', Status: 'Active' },
        { Name: 'Bob', Email: 'bob@example.com', Role: 'Editor', Status: 'Active' },
        { Name: 'Carol', Email: 'carol@example.com', Role: 'Viewer', Status: 'Inactive' },
        { Name: 'Dave', Email: 'dave@example.com', Role: 'Editor', Status: 'Active' },
      ]);
      return { columns, rows };
  },
  template: \`
    <div class="basic-table-wrapper">
    <table class="basic-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col">{{ col }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in rows" :key="idx">
          <td v-for="col in columns" :key="col">{{ row[col] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'basic-table',
  App: BasicTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'sortable',
    description: 'Sortable table with click-to-sort column headers and direction indicators',
    tags: ['table', 'sortable', 'interactive'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const SortableTable = defineComponent({
  setup() {
  const columns = ['Name', 'Age', 'Department', 'Salary'];
      const rows = ref([
        { Name: 'Alice', Age: 32, Department: 'Engineering', Salary: 95000 },
        { Name: 'Bob', Age: 28, Department: 'Design', Salary: 78000 },
        { Name: 'Carol', Age: 35, Department: 'Engineering', Salary: 105000 },
        { Name: 'Dave', Age: 41, Department: 'Marketing', Salary: 88000 },
        { Name: 'Eve', Age: 29, Department: 'Design', Salary: 82000 },
      ]);
      const sortCol = ref('Name');
      const sortDir = ref<'asc' | 'desc'>('asc');
      const sortBy = (col: string) => {
        if (sortCol.value === col) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
        else { sortCol.value = col; sortDir.value = 'asc'; }
      };
      const sortedRows = computed(() => {
        const copy = [...rows.value];
        copy.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
          const av = a[sortCol.value]; const bv = b[sortCol.value];
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return sortDir.value === 'asc' ? cmp : -cmp;
        });
        return copy;
      });
      return { columns, sortedRows, sortCol, sortDir, sortBy };
  },
  template: \`
    <div class="sortable-table-wrapper">
    <table class="sortable-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col" @click="sortBy(col)" class="sortable-th">
            {{ col }}
            <span v-if="sortCol === col" class="sort-arrow">{{ sortDir === 'asc' ? '\\u25B2' : '\\u25BC' }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in sortedRows" :key="idx">
          <td v-for="col in columns" :key="col">{{ row[col] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'sortable-table',
  App: SortableTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'paginated',
    description: 'Paginated table with page navigation and rows-per-page selector',
    tags: ['table', 'paginated', 'navigation'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const PaginatedTable = defineComponent({
  setup() {
  const columns = ['ID', 'Product', 'Category', 'Price'];
      const allRows = Array.from({ length: 25 }, (_, i) => ({
        ID: String(i + 1), Product: 'Item ' + (i + 1),
        Category: ['Electronics', 'Books', 'Clothing'][i % 3], Price: '$' + ((i + 1) * 10),
      }));
      const perPage = ref(5);
      const currentPage = ref(1);
      const totalPages = computed(() => Math.ceil(allRows.length / perPage.value));
      const pageRows = computed(() => {
        const start = (currentPage.value - 1) * perPage.value;
        return allRows.slice(start, start + perPage.value);
      });
      return { columns, pageRows, currentPage, totalPages };
  },
  template: \`
    <div class="paginated-table">
    <table>
      <thead>
        <tr><th v-for="col in columns" :key="col">{{ col }}</th></tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in pageRows" :key="idx">
          <td v-for="col in columns" :key="col">{{ row[col] }}</td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <div class="page-controls">
        <button :disabled="currentPage <= 1" @click="currentPage--">Prev</button>
        <button v-for="p in totalPages" :key="p" :class="{ active: p === currentPage }" @click="currentPage = p">{{ p }}</button>
        <button :disabled="currentPage >= totalPages" @click="currentPage++">Next</button>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'paginated-table',
  App: PaginatedTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'filterable',
    description: 'Table with column filter inputs for live data filtering',
    tags: ['table', 'filterable', 'search'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const FilterableTable = defineComponent({
  setup() {
  const columns = ['Name', 'Country', 'Industry', 'Revenue'];
      const rows = ref([
        { Name: 'Acme Corp', Country: 'USA', Industry: 'Tech', Revenue: '$2.5M' },
        { Name: 'GlobalTech', Country: 'UK', Industry: 'Tech', Revenue: '$8.1M' },
        { Name: 'FoodCo', Country: 'Canada', Industry: 'Food', Revenue: '$1.2M' },
        { Name: 'AutoParts', Country: 'Germany', Industry: 'Auto', Revenue: '$5.3M' },
        { Name: 'MediHealth', Country: 'USA', Industry: 'Health', Revenue: '$3.7M' },
      ]);
      const filterText = ref('');
      const filteredRows = computed(() => {
        if (!filterText.value) return rows.value;
        const q = filterText.value.toLowerCase();
        return rows.value.filter(r =>
          Object.values(r).some(v => String(v).toLowerCase().includes(q))
        );
      });
      return { columns, rows, filterText, filteredRows };
  },
  template: \`
    <div class="filterable-table">
    <div class="filter-bar">
      <input v-model="filterText" placeholder="Filter all columns..." class="filter-input" />
    </div>
    <table>
      <thead>
        <tr><th v-for="col in columns" :key="col">{{ col }}</th></tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in filteredRows" :key="idx">
          <td v-for="col in columns" :key="col">{{ row[col] }}</td>
        </tr>
        <tr v-if="!filteredRows.length">
          <td :colspan="columns.length" class="empty-row">No matching records</td>
        </tr>
      </tbody>
    </table>
    <div class="result-count">{{ filteredRows.length }} of {{ rows.length }} records</div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'filterable-table',
  App: FilterableTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'crud',
    description: 'CRUD table with inline add, edit, and delete functionality',
    tags: ['table', 'crud', 'editable'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const CrudTable = defineComponent({
  setup() {
  let nextId = 4;
      const rows = ref([
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
        { id: 3, name: 'Carol', email: 'carol@example.com' },
      ]);
      const editingId = ref<number | null>(null);
      const addRow = () => {
        rows.value.push({ id: nextId++, name: 'New User', email: 'new@example.com' });
        editingId.value = nextId - 1;
      };
      const deleteRow = (id: number) => {
        rows.value = rows.value.filter(r => r.id !== id);
      };
      return { rows, editingId, addRow, deleteRow };
  },
  template: \`
    <div class="crud-table">
    <div class="table-header">
      <h3>Users</h3>
      <button class="add-btn" @click="addRow">+ Add User</button>
    </div>
    <table>
      <thead>
        <tr><th>Name</th><th>Email</th><th>Actions</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>
            <input v-if="editingId === row.id" v-model="row.name" class="edit-input" />
            <span v-else>{{ row.name }}</span>
          </td>
          <td>
            <input v-if="editingId === row.id" v-model="row.email" class="edit-input" />
            <span v-else>{{ row.email }}</span>
          </td>
          <td class="actions-cell">
            <button v-if="editingId === row.id" class="btn-save" @click="editingId = null">Save</button>
            <button v-else class="btn-edit" @click="editingId = row.id">Edit</button>
            <button class="btn-delete" @click="deleteRow(row.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'crud-table',
  App: CrudTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'expandable-rows',
    description: 'Table with expandable rows to show additional detail content',
    tags: ['table', 'expandable', 'detail'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ExpandableTable = defineComponent({
  setup() {
  const expanded = ref<number[]>([]);
      const rows = ref([
        { id: 1, order: '#1001', customer: 'Alice', total: '$120', items: ['Widget A', 'Widget B'], shipping: 'Express' },
        { id: 2, order: '#1002', customer: 'Bob', total: '$85', items: ['Gadget X'], shipping: 'Standard' },
        { id: 3, order: '#1003', customer: 'Carol', total: '$210', items: ['Widget C', 'Gadget Y', 'Tool Z'], shipping: 'Express' },
      ]);
      const toggle = (id: number) => {
        const idx = expanded.value.indexOf(id);
        if (idx >= 0) expanded.value.splice(idx, 1); else expanded.value.push(id);
      };
      return { rows, expanded, toggle };
  },
  template: \`
    <div class="expandable-table">
    <table>
      <thead>
        <tr><th>Order</th><th>Customer</th><th>Total</th><th></th></tr>
      </thead>
      <tbody>
        <template v-for="row in rows" :key="row.id">
          <tr @click="toggle(row.id)" class="main-row">
            <td>{{ row.order }}</td>
            <td>{{ row.customer }}</td>
            <td>{{ row.total }}</td>
            <td class="expand-cell">{{ expanded.includes(row.id) ? '\\u25BC' : '\\u25B6' }}</td>
          </tr>
          <tr v-if="expanded.includes(row.id)" class="detail-row">
            <td colspan="4">
              <div class="detail-content">
                <p><strong>Items:</strong> {{ row.items.join(', ') }}</p>
                <p><strong>Shipping:</strong> {{ row.shipping }}</p>
              </div>
            </td>
          </tr>
  \`,
});

const app = createVueMicroApp({
  name: 'expandable-table',
  App: ExpandableTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'selectable',
    description: 'Table with checkbox selection for bulk actions',
    tags: ['table', 'selectable', 'checkbox'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const SelectableTable = defineComponent({
  setup() {
  const rows = ref([
        { id: 1, name: 'Alice', email: 'alice@co.com', role: 'Admin' },
        { id: 2, name: 'Bob', email: 'bob@co.com', role: 'Editor' },
        { id: 3, name: 'Carol', email: 'carol@co.com', role: 'Viewer' },
        { id: 4, name: 'Dave', email: 'dave@co.com', role: 'Editor' },
      ]);
      const selectedIds = ref<number[]>([]);
      const allSelected = computed(() => selectedIds.value.length === rows.value.length);
      const toggleAll = () => {
        selectedIds.value = allSelected.value ? [] : rows.value.map(r => r.id);
      };
      const toggleRow = (id: number) => {
        const idx = selectedIds.value.indexOf(id);
        if (idx >= 0) selectedIds.value.splice(idx, 1); else selectedIds.value.push(id);
      };
      return { rows, selectedIds, allSelected, toggleAll, toggleRow };
  },
  template: \`
    <div class="selectable-table">
    <div v-if="selectedIds.length" class="bulk-bar">
      {{ selectedIds.length }} selected
      <button class="bulk-btn" @click="selectedIds = []">Deselect All</button>
      <button class="bulk-btn danger">Delete Selected</button>
    </div>
    <table>
      <thead>
        <tr>
          <th><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
          <th>Name</th><th>Email</th><th>Role</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id" :class="{ selected: selectedIds.includes(row.id) }">
          <td><input type="checkbox" :checked="selectedIds.includes(row.id)" @change="toggleRow(row.id)" /></td>
          <td>{{ row.name }}</td>
          <td>{{ row.email }}</td>
          <td>{{ row.role }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'selectable-table',
  App: SelectableTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-actions',
    description: 'Table with action buttons per row for edit, view, and delete',
    tags: ['table', 'actions', 'buttons'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ActionsTable = defineComponent({
  setup() {
  const rows = ref<Row[]>([
        { id: 1, name: 'Project Alpha', status: 'active', created: '2024-01-15' },
        { id: 2, name: 'Project Beta', status: 'draft', created: '2024-02-20' },
        { id: 3, name: 'Project Gamma', status: 'archived', created: '2023-11-05' },
      ]);
      const viewRow = (row: Row) => alert('Viewing: ' + row.name);
      const editRow = (row: Row) => alert('Editing: ' + row.name);
      const deleteRow = (id: number) => { rows.value = rows.value.filter(r => r.id !== id); };
      return { rows, viewRow, editRow, deleteRow };
  },
  template: \`
    <div class="actions-table">
    <table>
      <thead>
        <tr><th>Name</th><th>Status</th><th>Created</th><th>Actions</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td class="name-cell">{{ row.name }}</td>
          <td><span class="status-badge" :class="row.status">{{ row.status }}</span></td>
          <td>{{ row.created }}</td>
          <td class="actions-cell">
            <button class="action-btn view" @click="viewRow(row)">View</button>
            <button class="action-btn edit" @click="editRow(row)">Edit</button>
            <button class="action-btn delete" @click="deleteRow(row.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'actions-table',
  App: ActionsTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-status',
    description: 'Table with color-coded status badges and priority indicators',
    tags: ['table', 'status', 'priority'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const StatusTable = defineComponent({
  setup() {
  const rows = ref([
        { task: 'Design homepage', assignee: 'Alice', priority: 'high', status: 'in-progress' },
        { task: 'Fix login bug', assignee: 'Bob', priority: 'critical', status: 'open' },
        { task: 'Update docs', assignee: 'Carol', priority: 'low', status: 'done' },
        { task: 'Deploy v2.1', assignee: 'Dave', priority: 'medium', status: 'review' },
      ]);
      return { rows };
  },
  template: \`
    <div class="status-table">
    <table>
      <thead>
        <tr><th>Task</th><th>Assignee</th><th>Priority</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.task">
          <td class="task-name">{{ row.task }}</td>
          <td>{{ row.assignee }}</td>
          <td><span class="priority-dot" :class="row.priority"></span> {{ row.priority }}</td>
          <td><span class="status-chip" :class="row.status">{{ row.status }}</span></td>
        </tr>
      </tbody>
    </table>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'status-table',
  App: StatusTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'virtualized',
    description: 'Virtualized table that renders only visible rows for large datasets',
    tags: ['table', 'virtualized', 'performance'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const VirtualizedTable = defineComponent({
  setup() {
  const rowHeight = 40;
      const visibleCount = 10;
      const totalRows = 1000;
      const scrollTop = ref(0);
      const allRows = Array.from({ length: totalRows }, (_, i) => ({
        id: i + 1, name: 'Item ' + (i + 1),
        value: '$' + (Math.random() * 1000).toFixed(2),
        category: ['A', 'B', 'C', 'D'][i % 4],
      }));
      const startIdx = computed(() => Math.floor(scrollTop.value / rowHeight));
      const offsetY = computed(() => startIdx.value * rowHeight);
      const visibleRows = computed(() => allRows.slice(startIdx.value, startIdx.value + visibleCount));
      const onScroll = (e: Event) => { scrollTop.value = (e.target as HTMLElement).scrollTop; };
      return { visibleRows, totalRows, rowHeight, offsetY, onScroll };
  },
  template: \`
    <div class="virtual-table">
    <div class="table-info">Showing {{ visibleRows.length }} of {{ totalRows }} rows</div>
    <div class="scroll-container" @scroll="onScroll" ref="scrollContainer">
      <div :style="{ height: totalRows * rowHeight + 'px', position: 'relative' }">
        <table :style="{ transform: 'translateY(' + offsetY + 'px)' }">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Value</th><th>Category</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in visibleRows" :key="row.id">
              <td>{{ row.id }}</td><td>{{ row.name }}</td>
              <td>{{ row.value }}</td><td>{{ row.category }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'virtualized-table',
  App: VirtualizedTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'grouped',
    description: 'Table with grouped rows by category and collapsible group headers',
    tags: ['table', 'grouped', 'categories'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const GroupedTable = defineComponent({
  setup() {
  const expandedGroups = ref<string[]>(['Electronics']);
      const groups = ref([
        { name: 'Electronics', items: [
          { name: 'Laptop', value: '$999', date: '2024-01-10' },
          { name: 'Phone', value: '$699', date: '2024-01-12' },
        ]},
        { name: 'Clothing', items: [
          { name: 'Jacket', value: '$120', date: '2024-01-15' },
          { name: 'Shoes', value: '$89', date: '2024-01-18' },
        ]},
        { name: 'Books', items: [
          { name: 'Novel', value: '$15', date: '2024-02-01' },
        ]},
      ]);
      const toggleGroup = (name: string) => {
        const idx = expandedGroups.value.indexOf(name);
        if (idx >= 0) expandedGroups.value.splice(idx, 1); else expandedGroups.value.push(name);
      };
      return { groups, expandedGroups, toggleGroup };
  },
  template: \`
    <div class="grouped-table">
    <table>
      <thead><tr><th>Name</th><th>Value</th><th>Date</th></tr></thead>
      <tbody>
        <template v-for="group in groups" :key="group.name">
          <tr class="group-header" @click="toggleGroup(group.name)">
            <td colspan="3">
              <span class="group-arrow">{{ expandedGroups.includes(group.name) ? '\\u25BC' : '\\u25B6' }}</span>
              {{ group.name }} ({{ group.items.length }})
            </td>
          </tr>
          <template v-if="expandedGroups.includes(group.name)">
            <tr v-for="item in group.items" :key="item.name" class="group-item">
              <td>{{ item.name }}</td><td>{{ item.value }}</td><td>{{ item.date }}</td>
            </tr>
  \`,
});

const app = createVueMicroApp({
  name: 'grouped-table',
  App: GroupedTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'editable-inline',
    description: 'Table with inline cell editing on double-click',
    tags: ['table', 'editable', 'inline'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, reactive } from 'vue';

const EditableInlineTable = defineComponent({
  setup() {
  const columns = ['Product', 'Price', 'Stock', 'SKU'];
      const rows = reactive([
        { Product: 'Widget A', Price: '$25', Stock: '142', SKU: 'WA-001' },
        { Product: 'Widget B', Price: '$35', Stock: '89', SKU: 'WB-002' },
        { Product: 'Gadget X', Price: '$99', Stock: '24', SKU: 'GX-003' },
      ]);
      const editing = reactive({ row: -1, col: '' });
      const startEdit = (row: number, col: string) => { editing.row = row; editing.col = col; };
      const stopEdit = () => { editing.row = -1; editing.col = ''; };
      return { columns, rows, editing, startEdit, stopEdit };
  },
  template: \`
    <div class="editable-table">
    <table>
      <thead><tr><th v-for="col in columns" :key="col">{{ col }}</th></tr></thead>
      <tbody>
        <tr v-for="(row, rIdx) in rows" :key="rIdx">
          <td v-for="col in columns" :key="col"
              @dblclick="startEdit(rIdx, col)"
              class="editable-cell">
            <input v-if="editing.row === rIdx && editing.col === col"
                   v-model="rows[rIdx][col]" @blur="stopEdit" @keyup.enter="stopEdit"
                   class="cell-input" />
            <span v-else>{{ row[col] }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <p class="edit-hint">Double-click a cell to edit</p>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'editable-inline-table',
  App: EditableInlineTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-summary',
    description: 'Table with summary row showing totals and aggregated values',
    tags: ['table', 'summary', 'totals'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const SummaryTable = defineComponent({
  setup() {
  const rows = ref([
        { product: 'Widget A', quantity: 10, price: 25.00 },
        { product: 'Widget B', quantity: 5, price: 42.50 },
        { product: 'Gadget X', quantity: 8, price: 99.99 },
        { product: 'Tool Y', quantity: 12, price: 15.75 },
      ]);
      const totalQty = computed(() => rows.value.reduce((s, r) => s + r.quantity, 0));
      const grandTotal = computed(() => rows.value.reduce((s, r) => s + r.quantity * r.price, 0));
      return { rows, totalQty, grandTotal };
  },
  template: \`
    <div class="summary-table">
    <table>
      <thead><tr><th>Product</th><th>Quantity</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>
        <tr v-for="row in rows" :key="row.product">
          <td>{{ row.product }}</td>
          <td>{{ row.quantity }}</td>
          <td>\${{ row.price.toFixed(2) }}</td>
          <td>\${{ (row.quantity * row.price).toFixed(2) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="summary-row">
          <td><strong>Total</strong></td>
          <td><strong>{{ totalQty }}</strong></td>
          <td></td>
          <td><strong>\${{ grandTotal.toFixed(2) }}</strong></td>
        </tr>
      </tfoot>
    </table>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'summary-table',
  App: SummaryTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'responsive',
    description: 'Responsive table that converts to card layout on small screens',
    tags: ['table', 'responsive', 'mobile'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ResponsiveTable = defineComponent({
  setup() {
  const columns = ref(['Name', 'Department', 'Location', 'Salary', 'Status']);
      const rows = ref([
        { Name: 'Alice Chen', Department: 'Engineering', Location: 'SF', Salary: '$130K', Status: 'Active' },
        { Name: 'Bob Smith', Department: 'Design', Location: 'NYC', Salary: '$95K', Status: 'Active' },
        { Name: 'Carol Lee', Department: 'Marketing', Location: 'LA', Salary: '$88K', Status: 'On Leave' },
      ]);
      return { columns, rows };
  },
  template: \`
    <div class="responsive-table">
    <table>
      <thead>
        <tr><th v-for="col in columns" :key="col">{{ col }}</th></tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in rows" :key="idx" :data-label="JSON.stringify(row)">
          <td v-for="col in columns" :key="col" :data-label="col">{{ row[col] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'responsive-table',
  App: ResponsiveTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-export',
    description: 'Table with export buttons for CSV and JSON download',
    tags: ['table', 'export', 'download'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ExportTable = defineComponent({
  setup() {
  const columns = ['ID', 'Name', 'Category', 'Revenue'];
      const rows = ref([
        { ID: '1', Name: 'Product A', Category: 'Electronics', Revenue: '$12,500' },
        { ID: '2', Name: 'Product B', Category: 'Clothing', Revenue: '$8,200' },
        { ID: '3', Name: 'Product C', Category: 'Electronics', Revenue: '$15,800' },
        { ID: '4', Name: 'Product D', Category: 'Home', Revenue: '$6,400' },
      ]);
      const exportMessage = ref('');
      const exportCSV = () => {
        const csv = [columns.join(','), ...rows.value.map(r => columns.map(c => r[c as keyof typeof r]).join(','))].join('\\n');
        exportMessage.value = 'CSV exported (' + csv.length + ' bytes)';
        setTimeout(() => { exportMessage.value = ''; }, 2000);
      };
      const exportJSON = () => {
        const json = JSON.stringify(rows.value, null, 2);
        exportMessage.value = 'JSON exported (' + json.length + ' bytes)';
        setTimeout(() => { exportMessage.value = ''; }, 2000);
      };
      return { columns, rows, exportMessage, exportCSV, exportJSON };
  },
  template: \`
    <div class="export-table">
    <div class="table-toolbar">
      <h3>Data Export</h3>
      <div class="export-btns">
        <button class="export-btn" @click="exportCSV">Export CSV</button>
        <button class="export-btn" @click="exportJSON">Export JSON</button>
      </div>
    </div>
    <table>
      <thead><tr><th v-for="col in columns" :key="col">{{ col }}</th></tr></thead>
      <tbody>
        <tr v-for="(row, idx) in rows" :key="idx">
          <td v-for="col in columns" :key="col">{{ row[col] }}</td>
        </tr>
      </tbody>
    </table>
    <div v-if="exportMessage" class="export-msg">{{ exportMessage }}</div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'export-table',
  App: ExportTable,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;

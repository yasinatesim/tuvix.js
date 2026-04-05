import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'basic',
    description: 'Basic data table with header row and striped rows',
    tags: ['table', 'basic', 'data'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const BasicTable = defineComponent({
  name: 'BasicTable',
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
});

export default createVueMicroApp({ name: 'basic-table', App: BasicTable });
</script>

<style scoped>
.basic-table-wrapper { overflow-x: auto; }
.basic-table { width: 100%; border-collapse: collapse; }
.basic-table th {
  text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600;
  color: #6b7280; border-bottom: 2px solid #e5e7eb; background: #f9fafb;
}
.basic-table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
.basic-table tbody tr:nth-child(even) { background: #f9fafb; }
.basic-table tbody tr:hover { background: #eff6ff; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'sortable',
    description: 'Sortable table with click-to-sort column headers and direction indicators',
    tags: ['table', 'sortable', 'interactive'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SortableTable = defineComponent({
  name: 'SortableTable',
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
});

export default createVueMicroApp({ name: 'sortable-table', App: SortableTable });
</script>

<style scoped>
.sortable-table-wrapper { overflow-x: auto; }
.sortable-table { width: 100%; border-collapse: collapse; }
.sortable-th {
  text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600;
  color: #374151; border-bottom: 2px solid #e5e7eb; background: #f9fafb;
  cursor: pointer; user-select: none;
}
.sortable-th:hover { background: #f3f4f6; }
.sort-arrow { font-size: 10px; margin-left: 4px; }
.sortable-table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
.sortable-table tbody tr:hover { background: #eff6ff; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'paginated',
    description: 'Paginated table with page navigation and rows-per-page selector',
    tags: ['table', 'paginated', 'navigation'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const PaginatedTable = defineComponent({
  name: 'PaginatedTable',
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
});

export default createVueMicroApp({ name: 'paginated-table', App: PaginatedTable });
</script>

<style scoped>
.paginated-table { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.paginated-table table { width: 100%; border-collapse: collapse; }
.paginated-table th {
  text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600;
  color: #6b7280; border-bottom: 2px solid #e5e7eb; background: #f9fafb;
}
.paginated-table td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
.pagination {
  display: flex; justify-content: space-between; align-items: center; padding: 12px 16px;
}
.page-info { font-size: 13px; color: #6b7280; }
.page-controls { display: flex; gap: 4px; }
.page-controls button {
  padding: 6px 12px; border: 1px solid #d1d5db; background: #fff;
  border-radius: 4px; font-size: 13px; cursor: pointer;
}
.page-controls button.active { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.page-controls button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'filterable',
    description: 'Table with column filter inputs for live data filtering',
    tags: ['table', 'filterable', 'search'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const FilterableTable = defineComponent({
  name: 'FilterableTable',
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
});

export default createVueMicroApp({ name: 'filterable-table', App: FilterableTable });
</script>

<style scoped>
.filterable-table { background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.filter-bar { padding: 16px; }
.filter-input {
  width: 100%; padding: 10px 14px; border: 1px solid #d1d5db;
  border-radius: 6px; font-size: 14px; box-sizing: border-box;
}
.filter-input:focus { outline: none; border-color: #3b82f6; }
.filterable-table table { width: 100%; border-collapse: collapse; }
.filterable-table th {
  text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600;
  color: #6b7280; border-bottom: 2px solid #e5e7eb;
}
.filterable-table td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
.empty-row { text-align: center; color: #9ca3af; padding: 24px; }
.result-count { padding: 12px 16px; font-size: 13px; color: #6b7280; border-top: 1px solid #f3f4f6; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'crud',
    description: 'CRUD table with inline add, edit, and delete functionality',
    tags: ['table', 'crud', 'editable'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const CrudTable = defineComponent({
  name: 'CrudTable',
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
});

export default createVueMicroApp({ name: 'crud-table', App: CrudTable });
</script>

<style scoped>
.crud-table { background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.table-header {
  display: flex; justify-content: space-between; align-items: center; padding: 16px;
}
.table-header h3 { margin: 0; font-size: 18px; }
.add-btn {
  padding: 8px 16px; background: #3b82f6; color: #fff; border: none;
  border-radius: 6px; font-weight: 600; cursor: pointer;
}
.crud-table table { width: 100%; border-collapse: collapse; }
.crud-table th {
  text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600;
  color: #6b7280; border-bottom: 2px solid #e5e7eb;
}
.crud-table td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
.edit-input { padding: 6px 8px; border: 1px solid #3b82f6; border-radius: 4px; font-size: 14px; }
.actions-cell { display: flex; gap: 6px; }
.btn-edit { padding: 4px 12px; background: #eff6ff; color: #3b82f6; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
.btn-save { padding: 4px 12px; background: #d1fae5; color: #059669; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
.btn-delete { padding: 4px 12px; background: #fef2f2; color: #ef4444; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'expandable-rows',
    description: 'Table with expandable rows to show additional detail content',
    tags: ['table', 'expandable', 'detail'],
    code: `<template>
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
        </template>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ExpandableTable = defineComponent({
  name: 'ExpandableTable',
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
});

export default createVueMicroApp({ name: 'expandable-table', App: ExpandableTable });
</script>

<style scoped>
.expandable-table { background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
.expandable-table table { width: 100%; border-collapse: collapse; }
.expandable-table th {
  text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600;
  color: #6b7280; border-bottom: 2px solid #e5e7eb; background: #f9fafb;
}
.main-row { cursor: pointer; }
.main-row:hover { background: #f9fafb; }
.main-row td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
.expand-cell { text-align: center; color: #9ca3af; font-size: 12px; }
.detail-row td { padding: 0; }
.detail-content {
  padding: 16px 32px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;
}
.detail-content p { margin: 4px 0; font-size: 14px; color: #374151; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'selectable',
    description: 'Table with checkbox selection for bulk actions',
    tags: ['table', 'selectable', 'checkbox'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SelectableTable = defineComponent({
  name: 'SelectableTable',
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
});

export default createVueMicroApp({ name: 'selectable-table', App: SelectableTable });
</script>

<style scoped>
.selectable-table { background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
.bulk-bar {
  display: flex; align-items: center; gap: 12px; padding: 10px 16px;
  background: #eff6ff; font-size: 14px; font-weight: 500; color: #3b82f6;
}
.bulk-btn { padding: 4px 12px; background: #fff; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; cursor: pointer; }
.bulk-btn.danger { color: #ef4444; border-color: #ef4444; }
.selectable-table table { width: 100%; border-collapse: collapse; }
.selectable-table th {
  text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600;
  color: #6b7280; border-bottom: 2px solid #e5e7eb;
}
.selectable-table td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
.selectable-table tr.selected { background: #eff6ff; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-actions',
    description: 'Table with action buttons per row for edit, view, and delete',
    tags: ['table', 'actions', 'buttons'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

interface Row { id: number; name: string; status: string; created: string; }

const ActionsTable = defineComponent({
  name: 'ActionsTable',
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
});

export default createVueMicroApp({ name: 'actions-table', App: ActionsTable });
</script>

<style scoped>
.actions-table { background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
.actions-table table { width: 100%; border-collapse: collapse; }
.actions-table th {
  text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600;
  color: #6b7280; border-bottom: 2px solid #e5e7eb; background: #f9fafb;
}
.actions-table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
.name-cell { font-weight: 600; }
.status-badge {
  padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;
}
.status-badge.active { background: #d1fae5; color: #059669; }
.status-badge.draft { background: #fef3c7; color: #d97706; }
.status-badge.archived { background: #f3f4f6; color: #6b7280; }
.actions-cell { display: flex; gap: 6px; }
.action-btn {
  padding: 4px 10px; border: none; border-radius: 4px; font-size: 12px;
  cursor: pointer; font-weight: 500;
}
.action-btn.view { background: #eff6ff; color: #3b82f6; }
.action-btn.edit { background: #fef3c7; color: #d97706; }
.action-btn.delete { background: #fef2f2; color: #ef4444; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-status',
    description: 'Table with color-coded status badges and priority indicators',
    tags: ['table', 'status', 'priority'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const StatusTable = defineComponent({
  name: 'StatusTable',
  setup() {
    const rows = ref([
      { task: 'Design homepage', assignee: 'Alice', priority: 'high', status: 'in-progress' },
      { task: 'Fix login bug', assignee: 'Bob', priority: 'critical', status: 'open' },
      { task: 'Update docs', assignee: 'Carol', priority: 'low', status: 'done' },
      { task: 'Deploy v2.1', assignee: 'Dave', priority: 'medium', status: 'review' },
    ]);
    return { rows };
  },
});

export default createVueMicroApp({ name: 'status-table', App: StatusTable });
</script>

<style scoped>
.status-table { background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
.status-table table { width: 100%; border-collapse: collapse; }
.status-table th {
  text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600;
  color: #6b7280; border-bottom: 2px solid #e5e7eb; background: #f9fafb;
}
.status-table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
.task-name { font-weight: 600; }
.priority-dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px;
}
.priority-dot.critical { background: #ef4444; }
.priority-dot.high { background: #f59e0b; }
.priority-dot.medium { background: #3b82f6; }
.priority-dot.low { background: #10b981; }
.status-chip {
  padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;
}
.status-chip.open { background: #fef2f2; color: #ef4444; }
.status-chip.in-progress { background: #eff6ff; color: #3b82f6; }
.status-chip.review { background: #fef3c7; color: #d97706; }
.status-chip.done { background: #d1fae5; color: #059669; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'virtualized',
    description: 'Virtualized table that renders only visible rows for large datasets',
    tags: ['table', 'virtualized', 'performance'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const VirtualizedTable = defineComponent({
  name: 'VirtualizedTable',
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
});

export default createVueMicroApp({ name: 'virtualized-table', App: VirtualizedTable });
</script>

<style scoped>
.virtual-table { background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
.table-info { padding: 12px 16px; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
.scroll-container { height: 400px; overflow-y: auto; }
.virtual-table table { width: 100%; border-collapse: collapse; }
.virtual-table th {
  text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600;
  color: #6b7280; background: #f9fafb; position: sticky; top: 0;
}
.virtual-table td { padding: 10px 16px; font-size: 14px; height: 40px; box-sizing: border-box; }
.virtual-table tbody tr:nth-child(even) { background: #f9fafb; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'grouped',
    description: 'Table with grouped rows by category and collapsible group headers',
    tags: ['table', 'grouped', 'categories'],
    code: `<template>
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
          </template>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const GroupedTable = defineComponent({
  name: 'GroupedTable',
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
});

export default createVueMicroApp({ name: 'grouped-table', App: GroupedTable });
</script>

<style scoped>
.grouped-table { background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
.grouped-table table { width: 100%; border-collapse: collapse; }
.grouped-table th {
  text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600;
  color: #6b7280; border-bottom: 2px solid #e5e7eb; background: #f9fafb;
}
.group-header td {
  padding: 10px 16px; font-weight: 700; font-size: 14px; background: #f3f4f6;
  cursor: pointer; border-bottom: 1px solid #e5e7eb;
}
.group-arrow { font-size: 10px; margin-right: 8px; color: #6b7280; }
.group-item td { padding: 10px 16px 10px 32px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'editable-inline',
    description: 'Table with inline cell editing on double-click',
    tags: ['table', 'editable', 'inline'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const EditableInlineTable = defineComponent({
  name: 'EditableInlineTable',
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
});

export default createVueMicroApp({ name: 'editable-inline-table', App: EditableInlineTable });
</script>

<style scoped>
.editable-table { background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.editable-table table { width: 100%; border-collapse: collapse; }
.editable-table th {
  text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600;
  color: #6b7280; border-bottom: 2px solid #e5e7eb; background: #f9fafb;
}
.editable-cell { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; cursor: text; }
.editable-cell:hover { background: #fefce8; }
.cell-input {
  width: 100%; padding: 4px 6px; border: 2px solid #3b82f6; border-radius: 4px;
  font-size: 14px; outline: none; box-sizing: border-box;
}
.edit-hint { padding: 8px 16px; font-size: 12px; color: #9ca3af; margin: 0; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-summary',
    description: 'Table with summary row showing totals and aggregated values',
    tags: ['table', 'summary', 'totals'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SummaryTable = defineComponent({
  name: 'SummaryTable',
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
});

export default createVueMicroApp({ name: 'summary-table', App: SummaryTable });
</script>

<style scoped>
.summary-table { background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
.summary-table table { width: 100%; border-collapse: collapse; }
.summary-table th {
  text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600;
  color: #6b7280; border-bottom: 2px solid #e5e7eb; background: #f9fafb;
}
.summary-table td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
.summary-row td {
  padding: 14px 16px; background: #f9fafb; border-top: 2px solid #e5e7eb; font-size: 15px;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'responsive',
    description: 'Responsive table that converts to card layout on small screens',
    tags: ['table', 'responsive', 'mobile'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ResponsiveTable = defineComponent({
  name: 'ResponsiveTable',
  setup() {
    const columns = ref(['Name', 'Department', 'Location', 'Salary', 'Status']);
    const rows = ref([
      { Name: 'Alice Chen', Department: 'Engineering', Location: 'SF', Salary: '$130K', Status: 'Active' },
      { Name: 'Bob Smith', Department: 'Design', Location: 'NYC', Salary: '$95K', Status: 'Active' },
      { Name: 'Carol Lee', Department: 'Marketing', Location: 'LA', Salary: '$88K', Status: 'On Leave' },
    ]);
    return { columns, rows };
  },
});

export default createVueMicroApp({ name: 'responsive-table', App: ResponsiveTable });
</script>

<style scoped>
.responsive-table { background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow-x: auto; }
.responsive-table table { width: 100%; border-collapse: collapse; }
.responsive-table th {
  text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600;
  color: #6b7280; border-bottom: 2px solid #e5e7eb; background: #f9fafb;
}
.responsive-table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
@media (max-width: 768px) {
  .responsive-table table, .responsive-table thead, .responsive-table tbody,
  .responsive-table th, .responsive-table td, .responsive-table tr { display: block; }
  .responsive-table thead { display: none; }
  .responsive-table tr { margin-bottom: 12px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; }
  .responsive-table td {
    display: flex; justify-content: space-between; padding: 8px 12px;
    border-bottom: 1px solid #f3f4f6;
  }
  .responsive-table td::before { content: attr(data-label); font-weight: 600; color: #6b7280; }
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-export',
    description: 'Table with export buttons for CSV and JSON download',
    tags: ['table', 'export', 'download'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ExportTable = defineComponent({
  name: 'ExportTable',
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
});

export default createVueMicroApp({ name: 'export-table', App: ExportTable });
</script>

<style scoped>
.export-table { background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
.table-toolbar {
  display: flex; justify-content: space-between; align-items: center; padding: 16px;
}
.table-toolbar h3 { margin: 0; font-size: 18px; }
.export-btns { display: flex; gap: 8px; }
.export-btn {
  padding: 8px 16px; background: #f3f4f6; border: 1px solid #d1d5db;
  border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: 500;
}
.export-btn:hover { background: #e5e7eb; }
.export-table table { width: 100%; border-collapse: collapse; }
.export-table th {
  text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600;
  color: #6b7280; border-bottom: 2px solid #e5e7eb;
}
.export-table td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
.export-msg {
  padding: 8px 16px; background: #d1fae5; color: #059669; font-size: 13px; font-weight: 500;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;

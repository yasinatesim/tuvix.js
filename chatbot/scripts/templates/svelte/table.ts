import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'basic',
    description: 'Basic data table with headers and rows',
    tags: ['table', 'basic', 'data'],
    code: `<script>
  let columns = ['Name', 'Email', 'Role'];
  let rows = [
    { name: 'Alice', email: 'alice@example.com', role: 'Admin' },
    { name: 'Bob', email: 'bob@example.com', role: 'User' },
    { name: 'Carol', email: 'carol@example.com', role: 'Editor' },
  ];
</script>

<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        {#each columns as col}
          <th>{col}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row}
        <tr>
          <td>{row.name}</td>
          <td>{row.email}</td>
          <td>{row.role}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-wrapper { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600; color: #6b7280; background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; }
  td { padding: 12px 16px; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb; }
  tr:hover td { background-color: #f9fafb; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'sortable',
    description: 'Table with sortable columns by clicking headers',
    tags: ['table', 'sortable', 'interactive'],
    code: `<script>
  let data = [
    { name: 'Alice', age: 32, dept: 'Engineering' },
    { name: 'Bob', age: 28, dept: 'Design' },
    { name: 'Carol', age: 35, dept: 'Marketing' },
    { name: 'Dave', age: 24, dept: 'Engineering' },
  ];
  let sortKey = 'name';
  let sortAsc = true;

  function sortBy(key) {
    if (sortKey === key) {
      sortAsc = !sortAsc;
    } else {
      sortKey = key;
      sortAsc = true;
    }
  }

  $: sorted = [...data].sort((a, b) => {
    let va = a[sortKey];
    let vb = b[sortKey];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });
</script>

<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        {#each ['name', 'age', 'dept'] as col}
          <th on:click={() => sortBy(col)} class="sortable">
            {col.charAt(0).toUpperCase() + col.slice(1)}
            {#if sortKey === col}{sortAsc ? '\u25B2' : '\u25BC'}{/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each sorted as row}
        <tr>
          <td>{row.name}</td>
          <td>{row.age}</td>
          <td>{row.dept}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-wrapper { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600; color: #6b7280; background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; }
  th.sortable { cursor: pointer; user-select: none; }
  th.sortable:hover { color: #374151; }
  td { padding: 12px 16px; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'paginated',
    description: 'Table with pagination controls for large datasets',
    tags: ['table', 'paginated', 'navigation'],
    code: `<script>
  let allData = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: 'User ' + (i + 1), email: 'user' + (i + 1) + '@example.com' }));
  let pageSize = 10;
  let currentPage = 0;

  $: totalPages = Math.ceil(allData.length / pageSize);
  $: pagedData = allData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  function goTo(page) { currentPage = page; }
  function prev() { if (currentPage > 0) currentPage -= 1; }
  function next() { if (currentPage < totalPages - 1) currentPage += 1; }
</script>

<div class="table-wrapper">
  <table>
    <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
    <tbody>
      {#each pagedData as row}
        <tr><td>{row.id}</td><td>{row.name}</td><td>{row.email}</td></tr>
      {/each}
    </tbody>
  </table>
  <div class="pagination">
    <button on:click={prev} disabled={currentPage === 0}>Prev</button>
    <span>Page {currentPage + 1} of {totalPages}</span>
    <button on:click={next} disabled={currentPage === totalPages - 1}>Next</button>
  </div>
</div>

<style>
  .table-wrapper { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600; color: #6b7280; background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; }
  td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
  .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; }
  .pagination button { padding: 6px 14px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
  .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
  .pagination span { font-size: 14px; color: #6b7280; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'filterable',
    description: 'Table with search filter to narrow down rows',
    tags: ['table', 'filterable', 'search'],
    code: `<script>
  let query = '';
  let data = [
    { name: 'Alice', dept: 'Engineering', status: 'Active' },
    { name: 'Bob', dept: 'Design', status: 'Inactive' },
    { name: 'Carol', dept: 'Marketing', status: 'Active' },
    { name: 'Dave', dept: 'Engineering', status: 'Active' },
    { name: 'Eve', dept: 'Sales', status: 'Inactive' },
  ];

  $: filtered = data.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.dept.toLowerCase().includes(query.toLowerCase()));
</script>

<div class="table-container">
  <div class="toolbar">
    <input type="text" bind:value={query} placeholder="Filter by name or department..." class="filter-input" />
    <span class="count">{filtered.length} results</span>
  </div>
  <table>
    <thead><tr><th>Name</th><th>Department</th><th>Status</th></tr></thead>
    <tbody>
      {#each filtered as row}
        <tr><td>{row.name}</td><td>{row.dept}</td><td><span class="status-badge" class:active={row.status === 'Active'}>{row.status}</span></td></tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-container { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
  .toolbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background-color: #f9fafb; }
  .filter-input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; width: 280px; }
  .count { font-size: 13px; color: #6b7280; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
  td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
  .status-badge { padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; background-color: #fef2f2; color: #dc2626; }
  .status-badge.active { background-color: #f0fdf4; color: #16a34a; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'crud',
    description: 'CRUD table with add, edit, and delete operations',
    tags: ['table', 'crud', 'operations'],
    code: `<script>
  let items = [
    { id: 1, name: 'Item Alpha', qty: 10 },
    { id: 2, name: 'Item Beta', qty: 25 },
    { id: 3, name: 'Item Gamma', qty: 5 },
  ];
  let nextId = 4;
  let newName = '';
  let newQty = 0;

  function addItem() {
    if (!newName) return;
    items = [...items, { id: nextId++, name: newName, qty: newQty }];
    newName = '';
    newQty = 0;
  }

  function deleteItem(id) {
    items = items.filter(i => i.id !== id);
  }
</script>

<div class="crud-table">
  <form on:submit|preventDefault={addItem} class="add-row">
    <input type="text" bind:value={newName} placeholder="Name" />
    <input type="number" bind:value={newQty} placeholder="Qty" />
    <button type="submit">Add</button>
  </form>
  <table>
    <thead><tr><th>ID</th><th>Name</th><th>Qty</th><th>Actions</th></tr></thead>
    <tbody>
      {#each items as item}
        <tr>
          <td>{item.id}</td>
          <td>{item.name}</td>
          <td>{item.qty}</td>
          <td><button class="delete-btn" on:click={() => deleteItem(item.id)}>Delete</button></td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .crud-table { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
  .add-row { display: flex; gap: 8px; padding: 12px 16px; background-color: #f9fafb; }
  .add-row input { padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; }
  .add-row input[type="text"] { flex: 1; }
  .add-row input[type="number"] { width: 80px; }
  .add-row button { padding: 8px 16px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
  td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
  .delete-btn { padding: 4px 10px; border: none; border-radius: 4px; background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 600; cursor: pointer; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'expandable-rows',
    description: 'Table with expandable row details on click',
    tags: ['table', 'expandable', 'details'],
    code: `<script>
  let data = [
    { id: 1, name: 'Order #1001', total: '$250', details: 'Widget A x2, Widget B x1. Shipped via FedEx.' },
    { id: 2, name: 'Order #1002', total: '$120', details: 'Widget C x3. Pending shipment.' },
    { id: 3, name: 'Order #1003', total: '$89', details: 'Widget A x1. Delivered.' },
  ];
  let expandedId = 0;

  function toggleExpand(id) {
    expandedId = expandedId === id ? 0 : id;
  }
</script>

<table class="table">
  <thead><tr><th></th><th>Order</th><th>Total</th></tr></thead>
  <tbody>
    {#each data as row}
      <tr on:click={() => toggleExpand(row.id)} class="clickable">
        <td class="expand-icon">{expandedId === row.id ? '\u25BC' : '\u25B6'}</td>
        <td>{row.name}</td>
        <td>{row.total}</td>
      </tr>
      {#if expandedId === row.id}
        <tr class="detail-row">
          <td colspan="3">{row.details}</td>
        </tr>
      {/if}
    {/each}
  </tbody>
</table>

<style>
  .table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600; color: #6b7280; background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; }
  td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
  .clickable { cursor: pointer; }
  .clickable:hover td { background-color: #f9fafb; }
  .expand-icon { width: 30px; color: #6b7280; }
  .detail-row td { background-color: #f9fafb; color: #6b7280; font-size: 13px; padding: 12px 16px 12px 46px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'selectable',
    description: 'Table with checkbox selection for rows',
    tags: ['table', 'selectable', 'checkbox'],
    code: `<script>
  let data = [
    { id: 1, name: 'Document A', type: 'PDF', selected: false },
    { id: 2, name: 'Image B', type: 'PNG', selected: false },
    { id: 3, name: 'Spreadsheet C', type: 'XLSX', selected: false },
    { id: 4, name: 'Document D', type: 'PDF', selected: false },
  ];

  $: allSelected = data.every(r => r.selected);
  $: selectedCount = data.filter(r => r.selected).length;

  function toggleAll() {
    let newVal = !allSelected;
    data = data.map(r => ({ ...r, selected: newVal }));
  }
</script>

<div class="table-container">
  {#if selectedCount > 0}
    <div class="selection-bar">{selectedCount} selected</div>
  {/if}
  <table>
    <thead>
      <tr>
        <th class="check-col"><input type="checkbox" checked={allSelected} on:change={toggleAll} /></th>
        <th>Name</th>
        <th>Type</th>
      </tr>
    </thead>
    <tbody>
      {#each data as row, i}
        <tr class:selected={row.selected}>
          <td class="check-col"><input type="checkbox" bind:checked={data[i].selected} /></td>
          <td>{row.name}</td>
          <td>{row.type}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-container { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
  .selection-bar { padding: 8px 16px; background-color: #ede9fe; color: #6366f1; font-size: 14px; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600; color: #6b7280; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
  .check-col { width: 40px; }
  tr.selected td { background-color: #faf5ff; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-actions',
    description: 'Table with action buttons in each row',
    tags: ['table', 'actions', 'buttons'],
    code: `<script>
  let users = [
    { id: 1, name: 'Alice', role: 'Admin', active: true },
    { id: 2, name: 'Bob', role: 'User', active: true },
    { id: 3, name: 'Carol', role: 'Editor', active: false },
  ];

  function toggleActive(id) {
    users = users.map(u => u.id === id ? { ...u, active: !u.active } : u);
  }

  function removeUser(id) {
    users = users.filter(u => u.id !== id);
  }
</script>

<table class="table">
  <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
  <tbody>
    {#each users as user}
      <tr>
        <td>{user.name}</td>
        <td>{user.role}</td>
        <td><span class="badge" class:active={user.active}>{user.active ? 'Active' : 'Inactive'}</span></td>
        <td class="actions">
          <button on:click={() => toggleActive(user.id)} class="action-btn">{user.active ? 'Deactivate' : 'Activate'}</button>
          <button on:click={() => removeUser(user.id)} class="action-btn delete">Remove</button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600; color: #6b7280; background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; }
  td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
  .badge { padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; background-color: #fef2f2; color: #dc2626; }
  .badge.active { background-color: #f0fdf4; color: #16a34a; }
  .actions { display: flex; gap: 6px; }
  .action-btn { padding: 4px 10px; border: 1px solid #d1d5db; border-radius: 4px; background: #fff; font-size: 12px; cursor: pointer; }
  .action-btn.delete { border-color: #fca5a5; color: #dc2626; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-status',
    description: 'Table with color-coded status badges',
    tags: ['table', 'status', 'badges'],
    code: `<script>
  let orders = [
    { id: '#2001', customer: 'Alice', amount: '$340', status: 'completed' },
    { id: '#2002', customer: 'Bob', amount: '$120', status: 'pending' },
    { id: '#2003', customer: 'Carol', amount: '$560', status: 'failed' },
    { id: '#2004', customer: 'Dave', amount: '$89', status: 'processing' },
  ];
</script>

<table class="table">
  <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
  <tbody>
    {#each orders as order}
      <tr>
        <td class="order-id">{order.id}</td>
        <td>{order.customer}</td>
        <td>{order.amount}</td>
        <td><span class="status {order.status}">{order.status}</span></td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600; color: #6b7280; background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; }
  td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
  .order-id { font-weight: 600; }
  .status { padding: 3px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
  .status.completed { background-color: #f0fdf4; color: #16a34a; }
  .status.pending { background-color: #fffbeb; color: #d97706; }
  .status.failed { background-color: #fef2f2; color: #dc2626; }
  .status.processing { background-color: #eff6ff; color: #2563eb; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'virtualized',
    description: 'Virtualized table rendering only visible rows for performance',
    tags: ['table', 'virtualized', 'performance'],
    code: `<script>
  let allRows = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, value: 'Row ' + (i + 1), score: Math.floor(Math.random() * 100) }));
  let visibleStart = 0;
  let visibleCount = 20;

  $: visibleRows = allRows.slice(visibleStart, visibleStart + visibleCount);

  function handleScroll(e) {
    let scrollTop = e.target.scrollTop;
    visibleStart = Math.floor(scrollTop / 40);
  }
</script>

<div class="info">Showing {visibleStart + 1}-{Math.min(visibleStart + visibleCount, allRows.length)} of {allRows.length} rows</div>
<div class="scroll-container" on:scroll={handleScroll}>
  <div class="spacer-top" style="height: {visibleStart * 40}px"></div>
  <table>
    <thead><tr><th>ID</th><th>Value</th><th>Score</th></tr></thead>
    <tbody>
      {#each visibleRows as row}
        <tr><td>{row.id}</td><td>{row.value}</td><td>{row.score}</td></tr>
      {/each}
    </tbody>
  </table>
  <div class="spacer-bottom" style="height: {(allRows.length - visibleStart - visibleCount) * 40}px"></div>
</div>

<style>
  .info { padding: 8px 16px; font-size: 13px; color: #6b7280; }
  .scroll-container { height: 400px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600; color: #6b7280; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; }
  td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; height: 40px; box-sizing: border-box; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'grouped',
    description: 'Table with grouped rows and section headers',
    tags: ['table', 'grouped', 'sections'],
    code: `<script>
  let groups = [
    { label: 'Engineering', members: [{ name: 'Alice', role: 'Lead' }, { name: 'Dave', role: 'Dev' }] },
    { label: 'Design', members: [{ name: 'Bob', role: 'Lead' }, { name: 'Eve', role: 'UI/UX' }] },
    { label: 'Marketing', members: [{ name: 'Carol', role: 'Manager' }] },
  ];
</script>

<table class="table">
  <thead><tr><th>Name</th><th>Role</th></tr></thead>
  <tbody>
    {#each groups as group}
      <tr class="group-header"><td colspan="2">{group.label} ({group.members.length})</td></tr>
      {#each group.members as member}
        <tr><td>{member.name}</td><td>{member.role}</td></tr>
      {/each}
    {/each}
  </tbody>
</table>

<style>
  .table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600; color: #6b7280; background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; }
  td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
  .group-header td { font-weight: 700; font-size: 13px; background-color: #f3f4f6; color: #374151; padding: 8px 16px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'editable-inline',
    description: 'Table with inline editing on double-click',
    tags: ['table', 'editable', 'inline'],
    code: `<script>
  let data = [
    { id: 1, name: 'Project Alpha', budget: 5000 },
    { id: 2, name: 'Project Beta', budget: 12000 },
    { id: 3, name: 'Project Gamma', budget: 3500 },
  ];
  let editingId = 0;
  let editField = '';
  let editValue = '';

  function startEdit(id, field, value) {
    editingId = id;
    editField = field;
    editValue = String(value);
  }

  function saveEdit() {
    data = data.map(r => {
      if (r.id === editingId) {
        let updated = { ...r };
        updated[editField] = editField === 'budget' ? Number(editValue) : editValue;
        return updated;
      }
      return r;
    });
    editingId = 0;
  }
</script>

<table class="table">
  <thead><tr><th>Project</th><th>Budget</th></tr></thead>
  <tbody>
    {#each data as row}
      <tr>
        <td on:dblclick={() => startEdit(row.id, 'name', row.name)}>
          {#if editingId === row.id && editField === 'name'}
            <input bind:value={editValue} on:blur={saveEdit} on:keydown={(e) => { if (e.key === 'Enter') saveEdit(); }} class="edit-input" />
          {:else}
            {row.name}
          {/if}
        </td>
        <td on:dblclick={() => startEdit(row.id, 'budget', row.budget)}>
          {#if editingId === row.id && editField === 'budget'}
            <input type="number" bind:value={editValue} on:blur={saveEdit} on:keydown={(e) => { if (e.key === 'Enter') saveEdit(); }} class="edit-input" />
          {:else}
            \${row.budget.toLocaleString()}
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
<p class="hint">Double-click a cell to edit.</p>

<style>
  .table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600; color: #6b7280; background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; }
  td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb; cursor: pointer; }
  td:hover { background-color: #faf5ff; }
  .edit-input { padding: 4px 8px; border: 2px solid #6366f1; border-radius: 4px; outline: none; width: 100%; font-size: 14px; }
  .hint { font-size: 12px; color: #9ca3af; margin-top: 8px; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-summary',
    description: 'Table with a summary/totals row at the bottom',
    tags: ['table', 'summary', 'totals'],
    code: `<script>
  let items = [
    { product: 'Widget A', qty: 10, price: 25 },
    { product: 'Widget B', qty: 5, price: 45 },
    { product: 'Widget C', qty: 20, price: 12 },
  ];

  $: totalQty = items.reduce((s, i) => s + i.qty, 0);
  $: totalRevenue = items.reduce((s, i) => s + i.qty * i.price, 0);
</script>

<table class="table">
  <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
  <tbody>
    {#each items as item}
      <tr>
        <td>{item.product}</td>
        <td>{item.qty}</td>
        <td>\${item.price}</td>
        <td>\${item.qty * item.price}</td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr class="summary-row">
      <td>Total</td>
      <td>{totalQty}</td>
      <td></td>
      <td>\${totalRevenue}</td>
    </tr>
  </tfoot>
</table>

<style>
  .table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600; color: #6b7280; background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; }
  td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
  .summary-row td { font-weight: 700; background-color: #f9fafb; border-top: 2px solid #e5e7eb; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'responsive',
    description: 'Responsive table that adapts to small screens',
    tags: ['table', 'responsive', 'mobile'],
    code: `<script>
  let data = [
    { name: 'Alice Johnson', email: 'alice@example.com', phone: '+1 555-0101', city: 'New York' },
    { name: 'Bob Smith', email: 'bob@example.com', phone: '+1 555-0102', city: 'London' },
    { name: 'Carol Williams', email: 'carol@example.com', phone: '+1 555-0103', city: 'Tokyo' },
  ];
</script>

<div class="table-container">
  <table>
    <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>City</th></tr></thead>
    <tbody>
      {#each data as row}
        <tr>
          <td data-label="Name">{row.name}</td>
          <td data-label="Email">{row.email}</td>
          <td data-label="Phone">{row.phone}</td>
          <td data-label="City">{row.city}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-container { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 10px; }
  table { width: 100%; border-collapse: collapse; min-width: 500px; }
  th { text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600; color: #6b7280; background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; }
  td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'with-export',
    description: 'Table with export to CSV button',
    tags: ['table', 'export', 'csv'],
    code: `<script>
  let data = [
    { name: 'Alice', department: 'Engineering', salary: 95000 },
    { name: 'Bob', department: 'Design', salary: 85000 },
    { name: 'Carol', department: 'Marketing', salary: 78000 },
    { name: 'Dave', department: 'Engineering', salary: 102000 },
  ];

  function exportCsv() {
    let header = 'Name,Department,Salary';
    let rows = data.map(r => r.name + ',' + r.department + ',' + r.salary);
    let csv = [header, ...rows].join('\\n');
    alert('CSV exported:\\n' + csv);
  }
</script>

<div class="table-container">
  <div class="toolbar">
    <span class="title">Employee Data</span>
    <button on:click={exportCsv} class="export-btn">Export CSV</button>
  </div>
  <table>
    <thead><tr><th>Name</th><th>Department</th><th>Salary</th></tr></thead>
    <tbody>
      {#each data as row}
        <tr><td>{row.name}</td><td>{row.department}</td><td>\${row.salary.toLocaleString()}</td></tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-container { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
  .toolbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background-color: #f9fafb; }
  .title { font-weight: 600; font-size: 15px; }
  .export-btn { padding: 6px 14px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 16px; font-size: 13px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
  td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
</style>
`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
];

export default templates;

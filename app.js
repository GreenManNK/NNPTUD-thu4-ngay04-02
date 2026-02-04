const API = 'https://api.escuelajs.co/api/v1/products';

let products = [];
let filtered = [];
let page = 1;
let size = 5;
let sortField = '';
let asc = true;
let currentId = null;

document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  loadData();
});

/* ---------- INIT EVENTS ---------- */
function initEvents() {
  document.getElementById('searchInput').oninput = onSearch;
  document.getElementById('pageSize').onchange = onPageSizeChange;
  document.getElementById('sortTitle').onclick = () => sortBy('title');
  document.getElementById('sortPrice').onclick = () => sortBy('price');
  document.getElementById('exportBtn').onclick = exportCSV;
  document.getElementById('createBtn').onclick = createProduct;
  document.getElementById('saveEdit').onclick = updateProduct;
  document.getElementById('editFromView').onclick = openEditFromView;

  document.getElementById('darkToggle').onclick = toggleDark;
  if (localStorage.getItem('dark') === 'true') toggleDark();
}

/* ---------- DARK MODE ---------- */
function toggleDark() {
  document.body.classList.toggle('dark');
  localStorage.setItem('dark', document.body.classList.contains('dark'));
}

/* ---------- LOAD DATA ---------- */
async function loadData() {
  try {
    const res = await fetch(API);
    products = await res.json();
    filtered = [...products];
    render();
  } catch (e) {
    alert('API error. Please run with local server.');
    console.error(e);
  }
}

/* ---------- RENDER ---------- */
function render() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  const start = (page - 1) * size;
  const view = filtered.slice(start, start + size);

  view.forEach(p => {
    tbody.innerHTML += `
      <tr data-bs-toggle="tooltip" title="${p.description}" onclick="openView(${p.id})">
        <td>${p.id}</td>
        <td>${p.title}</td>
        <td>$${p.price}</td>
        <td>${p.category?.name || ''}</td>
        <td><img src="${p.images?.[0] || ''}" class="image-thumb"></td>
      </tr>
    `;
  });

  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));
  renderPagination();
}

/* ---------- PAGINATION ---------- */
function renderPagination() {
  const ul = document.getElementById('pagination');
  ul.innerHTML = '';
  const total = Math.ceil(filtered.length / size);

  for (let i = 1; i <= total; i++) {
    ul.innerHTML += `
      <li class="page-item ${i === page ? 'active' : ''}">
        <a class="page-link" onclick="page=${i};render()">${i}</a>
      </li>
    `;
  }
}

/* ---------- SEARCH ---------- */
function onSearch(e) {
  filtered = products.filter(p =>
    p.title.toLowerCase().includes(e.target.value.toLowerCase())
  );
  page = 1;
  render();
}

/* ---------- PAGE SIZE ---------- */
function onPageSizeChange(e) {
  size = +e.target.value;
  page = 1;
  render();
}

/* ---------- SORT ---------- */
function sortBy(field) {
  asc = sortField === field ? !asc : true;
  sortField = field;
  filtered.sort((a, b) =>
    asc ? a[field] > b[field] ? 1 : -1 : a[field] < b[field] ? 1 : -1
  );
  render();
}

/* ---------- VIEW ---------- */
function openView(id) {
  const p = products.find(x => x.id === id);
  currentId = id;

  viewTitle.innerText = p.title;
  viewDesc.innerText = p.description;
  viewPrice.innerText = p.price;
  viewCategory.innerText = p.category?.name || '';
  viewImg.src = p.images?.[0] || '';

  new bootstrap.Modal(viewModal).show();
}

function openEditFromView() {
  bootstrap.Modal.getInstance(viewModal).hide();
  openEdit(currentId);
}

/* ---------- EDIT ---------- */
function openEdit(id) {
  const p = products.find(x => x.id === id);

  editId.value = p.id;
  editTitle.value = p.title;
  editPrice.value = p.price;
  editDesc.value = p.description;
  editCategory.value = p.category?.id || 1;
  editImage.value = p.images?.[0] || '';
  previewImg.src = p.images?.[0] || '';

  new bootstrap.Modal(editModal).show();
}

async function updateProduct() {
  const payload = {
    title: editTitle.value,
    price: +editPrice.value,
    description: editDesc.value,
    categoryId: +editCategory.value || 1,
    images: [editImage.value]
  };

  await fetch(`${API}/${editId.value}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  await loadData();
  bootstrap.Modal.getInstance(editModal).hide();
}

/* ---------- CREATE ---------- */
async function createProduct() {
  const payload = {
    title: newTitle.value,
    price: +newPrice.value,
    description: newDesc.value,
    categoryId: +newCategory.value || 1,
    images: [newImage.value]
  };

  await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  await loadData();
  bootstrap.Modal.getInstance(createModal).hide();
}

/* ---------- EXPORT CSV ---------- */
function exportCSV() {
  const start = (page - 1) * size;
  const view = filtered.slice(start, start + size);

  let csv = 'id,title,price,category\n';
  view.forEach(p =>
    csv += `${p.id},"${p.title}",${p.price},"${p.category?.name || ''}"\n`
  );

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv]));
  a.download = 'products_view.csv';
  a.click();
}

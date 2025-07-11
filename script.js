// Variables globales
let salesData = [];
let currentItems = [];

// Funciones de API
async function fetchSales() {
  try {
    const response = await fetch('/api/ventas');
    if (!response.ok) throw new Error('Error al obtener ventas');
    salesData = await response.json();
    return salesData;
  } catch (error) {
    console.error('Error al cargar ventas:', error);
    // Fallback a localStorage en caso de error
    salesData = JSON.parse(localStorage.getItem('salesData')) || [];
    return salesData;
  }
}

async function saveSale(saleData) {
  try {
    const response = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });
    if (!response.ok) throw new Error('Error al guardar la venta');
    return await response.json();
  } catch (error) {
    console.error('Error al guardar venta:', error);
    // Fallback a localStorage
    const fallbackSale = { ...saleData, id: Date.now() };
    let localSales = JSON.parse(localStorage.getItem('salesData')) || [];
    localSales.unshift(fallbackSale);
    localStorage.setItem('salesData', JSON.stringify(localSales));
    throw error;
  }
}

// Actualizar fecha y hora cada segundo
function updateDateTime() {
  const now = new Date();
  const dateTimeString = now.toLocaleDateString('es-CO') + ' ' + now.toLocaleTimeString('es-CO');
  const el = document.getElementById('currentDateTime');
  if (el) el.textContent = dateTimeString;
}

// Agregar item a la venta
function addItem() {
  const itemSelect = document.getElementById('newItem');
  const quantityInput = document.getElementById('newQuantity');
  const priceInput = document.getElementById('newPrice');
  if (!itemSelect || !quantityInput || !priceInput) return;

  const item = itemSelect.value;
  const quantity = parseInt(quantityInput.value) || 1;
  const price = parseFloat(priceInput.value) || 0;

  if (!item) return alert('Por favor selecciona un item');
  if (price <= 0) return alert('Por favor ingresa un precio válido');

  const idx = currentItems.findIndex(i => i.item === item);
  if (idx >= 0) {
    currentItems[idx].quantity += quantity;
    currentItems[idx].price = price;
    currentItems[idx].subtotal = currentItems[idx].quantity * price;
  } else {
    currentItems.push({ item, quantity, price, subtotal: quantity * price });
  }

  itemSelect.value = '';
  quantityInput.value = '';
  priceInput.value = '';
  displayCurrentItems();
  updateTotal();
}

// Mostrar items actuales
function displayCurrentItems() {
  const container = document.getElementById('itemsContainer');
  if (!container) return;
  if (currentItems.length === 0) {
    container.innerHTML = '<div class="empty-items">No hay items agregados aún</div>';
    return;
  }
  container.innerHTML = currentItems.map((it, i) => `
    <div class="item-row">
      <div class="item-info">
        <h4>${it.item}</h4>
        <p>Cantidad: ${it.quantity} | Precio unitario: $${it.price.toLocaleString('es-CO')}</p>
      </div>
      <div class="item-price">$${it.subtotal.toLocaleString('es-CO')}</div>
      <button class="remove-item" onclick="removeItem(${i})">🗑️</button>
    </div>
  `).join('');
}

function removeItem(index) {
  currentItems.splice(index, 1);
  displayCurrentItems();
  updateTotal();
}

// Actualizar total y contadores
function updateTotal() {
  const total = currentItems.reduce((sum, it) => sum + it.subtotal, 0);
  const count = currentItems.reduce((sum, it) => sum + it.quantity, 0);
  const amtEl = document.getElementById('totalAmount');
  const cntEl = document.getElementById('totalItems');
  if (amtEl) amtEl.textContent = total.toLocaleString('es-CO');
  if (cntEl) cntEl.textContent = count;
}

// Mostrar historial de ventas en index.html
function displaySalesHistory() {
  const historyContainer = document.getElementById('salesHistory');
  if (!historyContainer) return;
  const recent = salesData.slice(0, 10);
  if (recent.length === 0) {
    historyContainer.innerHTML = '<p style="text-align:center;color:#666;font-style:italic;">No hay ventas registradas aún.</p>';
    return;
  }
  historyContainer.innerHTML = recent.map(sale => `
    <div class="sales-item">
      <h3>Venta #${sale.id} - ${sale.totalItems} items</h3>
      <p><strong>Fecha:</strong> ${sale.fecha} a las ${sale.hora}</p>
      <p><strong>Total:</strong> $${sale.valorTotal.toLocaleString('es-CO')} | <strong>Pago:</strong> ${sale.medioPago}</p>
      <p><strong>Cliente:</strong> ${sale.nombreCliente}</p>
      <ul style="margin:5px 0 0 20px;">
        ${sale.items.map(it => `<li>${it.item} - Cantidad: ${it.quantity} - $${it.subtotal.toLocaleString('es-CO')}</li>`).join('')}
      </ul>
      ${sale.cedula !== 'No especificado' ? `<p><strong>Cédula:</strong> ${sale.cedula}</p>` : ''}
      ${sale.telefono !== 'No especificado' ? `<p><strong>Teléfono:</strong> ${sale.telefono}</p>` : ''}
    </div>
  `).join('');
}

// Inicializar index.html
async function init() {
  updateDateTime();
  setInterval(updateDateTime, 1000);
  await fetchSales();
  displaySalesHistory();
  displayCurrentItems();
  updateTotal();

  // Eventos
  const addBtn = document.getElementById('addItemBtn');
  if (addBtn) addBtn.addEventListener('click', addItem);

  ['newItem','newQuantity','newPrice'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keypress', e => { if (e.key==='Enter') addItem(); });
  });

  const salesForm = document.getElementById('salesForm');
  if (salesForm) {
    salesForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (currentItems.length === 0) return alert('Agrega al menos un item');
      const method = document.getElementById('paymentMethod').value;
      if (!method) return alert('Selecciona un medio de pago');

      const formData = {
        fecha: new Date().toLocaleDateString('es-CO'),
        hora: new Date().toLocaleTimeString('es-CO'),
        medioPago: method,
        items: [...currentItems],
        totalItems: currentItems.reduce((s,i) => s+i.quantity, 0),
        valorTotal: currentItems.reduce((s,i) => s+i.subtotal, 0),
        nombreCliente: document.getElementById('customerName').value || 'No especificado',
        cedula: document.getElementById('customerID').value || 'No especificado',
        telefono: document.getElementById('customerPhone').value || 'No especificado'
      };

      const submitBtn = this.querySelector('button[type="submit"]');
      const origText = submitBtn.textContent;
      submitBtn.textContent = '💾 Guardando...';
      submitBtn.disabled = true;

      try {
        const saved = await saveSale(formData);
        salesData.unshift(saved);
        clearForm();
        displaySalesHistory();
      } catch {
        alert('Error al guardar. Se guardó localmente.');
        clearForm();
        displaySalesHistory();
      } finally {
        submitBtn.textContent = origText;
        submitBtn.disabled = false;
      }
    });
  }
}

// Funciones para reports.html
async function initReports() {
  const totalEl = document.getElementById('totalSales');
  if (!totalEl) return;
  salesData = await fetchSales();

  const ingresos = salesData.reduce((sum, s) => sum + s.valorTotal, 0);
  const prom = salesData.length ? ingresos / salesData.length : 0;
  const hoy = new Date().toLocaleDateString('es-CO');
  const ventasHoy = salesData.filter(s => s.fecha === hoy).length;

  totalEl.textContent = salesData.length;
  document.getElementById('totalRevenue').textContent = '$' + ingresos.toLocaleString('es-CO');
  document.getElementById('averageSale').textContent = '$' + prom.toLocaleString('es-CO');
  document.getElementById('todaySales').textContent = ventasHoy;

  populateReportsTable(salesData);
}

function populateReportsTable(data) {
  const tbody = document.getElementById('salesTableBody');
  if (!tbody) return;
  if (!data.length) {
    document.querySelector('.no-data').style.display = 'block';
    return;
  }
  tbody.innerHTML = data.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${s.fecha}</td>
      <td>${s.nombreCliente}</td>
      <td>${s.items.map(i=>i.item+'('+i.quantity+')').join(', ')}</td>
      <td class="amount">$${s.valorTotal.toLocaleString('es-CO')}</td>
      <td><span class="badge badge-${s.medioPago}">${s.medioPago}</span></td>
      <td><button class="delete-btn" onclick="deleteSale(${s.id})">Eliminar</button></td>
    </tr>
  `).join('');
}

async function deleteSale(id) {
  if (!confirm('¿Eliminar la venta?')) return;
  await fetch(`/api/ventas/${id}`, { method: 'DELETE' });
  initReports();
}

// Arrancadores
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('salesForm')) init();
  if (document.getElementById('totalSales')) initReports();
});

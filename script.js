// Variables globales
let salesData = [];
let currentItems = []; // Array para almacenar los items de la venta actual

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
        const savedSale = await response.json();
        return savedSale;
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
    const dt = now.toLocaleDateString('es-CO') + ' ' + now.toLocaleTimeString('es-CO');
    const el = document.getElementById('currentDateTime');
    if (el) el.textContent = dt;
}

// Inicializar la aplicación (index.html)
async function init() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    await fetchSales();
    displaySalesHistory();
    displayCurrentItems();
    updateTotal();
    setupEventListeners();
}

// Configurar event listeners de index.html
function setupEventListeners() {
    const addBtn = document.getElementById('addItemBtn');
    if (addBtn) addBtn.addEventListener('click', addItem);
    ['newItem','newQuantity','newPrice'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keypress', e => { if (e.key==='Enter') addItem(); });
    });
}

// Agregar item a la venta (index.html)
function addItem() {
    const itemSelect = document.getElementById('newItem');
    const qtyInput   = document.getElementById('newQuantity');
    const priceInput = document.getElementById('newPrice');
    if (!itemSelect || !qtyInput || !priceInput) return;

    const item     = itemSelect.value;
    const quantity = parseInt(qtyInput.value) || 1;
    const price    = parseFloat(priceInput.value) || 0;

    if (!item)  return alert('Por favor selecciona un item');
    if (price<=0) return alert('Por favor ingresa un precio válido');

    const idx = currentItems.findIndex(i=>i.item===item);
    if (idx>=0) {
        currentItems[idx].quantity += quantity;
        currentItems[idx].price = price;
        currentItems[idx].subtotal = currentItems[idx].quantity * price;
    } else {
        currentItems.push({ item, quantity, price, subtotal: quantity*price });
    }

    itemSelect.value = '';
    qtyInput.value   = '';
    priceInput.value = '';
    displayCurrentItems();
    updateTotal();
}

// Mostrar items actuales (index.html)
function displayCurrentItems() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;
    if (currentItems.length===0) {
        container.innerHTML = '<div class="empty-items">No hay items agregados aún</div>';
        return;
    }
    container.innerHTML = currentItems.map((it,i)=>`
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
    currentItems.splice(index,1);
    displayCurrentItems();
    updateTotal();
}

// Actualizar total y contador de items (index.html)
function updateTotal() {
    const total = currentItems.reduce((s,it)=> s+it.subtotal, 0);
    const count = currentItems.reduce((s,it)=> s+it.quantity, 0);
    const amtEl = document.getElementById('totalAmount');
    const cntEl = document.getElementById('totalItems');
    if (amtEl) amtEl.textContent = total.toLocaleString('es-CO');
    if (cntEl) cntEl.textContent = count;
}

// Manejar envío de formulario (index.html)
const salesForm = document.getElementById('salesForm');
if (salesForm) {
    salesForm.addEventListener('submit', async function(e){
        e.preventDefault();
        if (currentItems.length===0) return alert('Por favor agrega al menos un item');
        const method = document.getElementById('paymentMethod').value;
        if (!method) return alert('Por favor selecciona un medio de pago');

        const formData = {
            fecha: new Date().toLocaleDateString('es-CO'),
            hora:  new Date().toLocaleTimeString('es-CO'),
            medioPago: method,
            items: [...currentItems],
            totalItems: currentItems.reduce((s,it)=>s+it.quantity,0),
            valorTotal: currentItems.reduce((s,it)=>s+it.subtotal,0),
            nombreCliente: document.getElementById('customerName').value || 'No especificado',
            cedula:        document.getElementById('customerID').value   || 'No especificado',
            telefono:      document.getElementById('customerPhone').value|| 'No especificado'
        };

        const btn = this.querySelector('button[type="submit"]');
        const orig = btn.textContent;
        btn.textContent = '💾 Guardando...';
        btn.disabled = true;

        try {
            const saved = await saveSale(formData);
            salesData.unshift(saved);
            clearForm();
            displaySalesHistory();
        } catch {
            alert('Error al guardar, se guardó localmente.');
            clearForm();
            displaySalesHistory();
        } finally {
            btn.textContent = orig;
            btn.disabled = false;
        }
    });
}

// Limpiar formulario (index.html)
function clearForm() {
    if (!salesForm) return;
    salesForm.reset();
    currentItems = [];
    displayCurrentItems();
    updateTotal();
    document.getElementById('paymentMethod')?.focus();
}

// Mostrar historial de ventas (index.html)
function displaySalesHistory() {
    const historyContainer = document.getElementById('salesHistory');
    if (!historyContainer) return;
    const recent = salesData.slice(0,10);
    if (recent.length===0) {
        historyContainer.innerHTML = '<p style="text-align:center;color:#666;font-style:italic;">No hay ventas registradas aún.</p>';
        return;
    }
    historyContainer.innerHTML = recent.map(sale=>`
        <div class="sales-item">
            <h3>Venta #${sale.id} - ${sale.totalItems} items</h3>
            <p><strong>Fecha:</strong> ${sale.fecha} a las ${sale.hora}</p>
            <p><strong>Total:</strong> $${sale.valorTotal.toLocaleString('es-CO')} | <strong>Pago:</strong> ${sale.medioPago}</p>
            <p><strong>Cliente:</strong> ${sale.nombreCliente}</p>
            <ul style="margin:5px 0 0 20px;">
                ${sale.items.map(it=>`<li>${it.item} - Cantidad: ${it.quantity} - $${it.subtotal.toLocaleString('es-CO')}</li>`).join('')}
            </ul>
            ${sale.cedula!=='No especificado'?`<p><strong>Cédula:</strong> ${sale.cedula}</p>`:''}
            ${sale.telefono!=='No especificado'?`<p><strong>Teléfono:</strong> ${sale.telefono}</p>`:''}
        </div>
    `).join('');
}

// Exportar datos a JSON
function exportData() {
    const dataStr = JSON.stringify(salesData,null,2);
    const blob = new Blob([dataStr],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ventas_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Alias para HTML
function exportToCSV() { exportData(); }

// Calcular total del día
function getTodayTotal() {
    const today = new Date().toLocaleDateString('es-CO');
    return salesData.filter(s=>s.fecha===today).reduce((t,s)=>t+s.valorTotal,0);
}

// Estadísticas del día
function getDayStats() {
    const todaySales = salesData.filter(s=>s.fecha===new Date().toLocaleDateString('es-CO'));
    return {
        totalVentas: todaySales.length,
        totalIngresos: todaySales.reduce((t,s)=>t+s.valorTotal,0),
        promedioVenta: todaySales.length>0
            ? todaySales.reduce((t,s)=>t+s.valorTotal,0)/todaySales.length
            : 0,
        itemMasVendido: getMostSoldItem(todaySales),
        medioPagoMasUsado: getMostUsedPaymentMethod(todaySales)
    };
}

function getMostSoldItem(sales) {
    if (!sales.length) return 'N/A';
    const counts = {};
    sales.forEach(s=>s.items.forEach(i=>counts[i.item]=(counts[i.item]||0)+i.quantity));
    return Object.keys(counts).reduce((a,b)=>counts[a]>counts[b]?a:b,'');
}

function getMostUsedPaymentMethod(sales) {
    if (!sales.length) return 'N/A';
    const counts = {};
    sales.forEach(s=>counts[s.medioPago]=(counts[s.medioPago]||0)+1);
    return Object.keys(counts).reduce((a,b)=>counts[a]>counts[b]?a:b,'');
}

function showStats() {
    console.log('Estadísticas del día:', getDayStats());
}

// Eliminar todos los datos
async function clearAllData() {
    if (!confirm('¿Eliminar todos los datos?')) return;
    try {
        await fetch('/api/ventas',{method:'DELETE'});
        alert('Datos del servidor borrados.');
    } catch (e) {
        console.error('Error borrando servidor:',e);
    }
    localStorage.removeItem('salesData');
    salesData = [];
    currentItems = [];
    displaySalesHistory();
    displayCurrentItems();
    updateTotal();
    alert('Datos locales borrados.');
}

// Importar desde JSON
function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) throw new Error('Formato inválido');
            salesData = imported;
            localStorage.setItem('salesData', JSON.stringify(salesData));
            displaySalesHistory();
            alert('Importación exitosa.');
        } catch (err) {
            alert('Error al importar: '+err.message);
        }
    };
    reader.readAsText(file);
}

// Sincronizar local → servidor
async function syncLocalDataToServer() {
    const local = JSON.parse(localStorage.getItem('salesData'))||[];
    for (let sale of local) {
        if (!sale.synced) {
            try {
                await saveSale(sale);
                sale.synced = true;
            } catch {}
        }
    }
    localStorage.setItem('salesData', JSON.stringify(local));
}

// --- Extensiones para reports.html ---

// Inicializar reports.html
async function initReports() {
    if (!document.getElementById('totalSales')) return;
    salesData = await fetchSales();
    const ingresosTotales = salesData.reduce((s,sale)=> s+sale.valorTotal, 0);
    const promedio = salesData.length ? ingresosTotales/salesData.length : 0;
    const hoy = new Date().toLocaleDateString('es-CO');
    const ventasHoy = salesData.filter(s=>s.fecha===hoy).length;
    document.getElementById('totalSales').textContent   = salesData.length;
    document.getElementById('totalRevenue').textContent = '$'+ingresosTotales.toLocaleString('es-CO');
    document.getElementById('averageSale').textContent  = '$'+promedio.toLocaleString('es-CO');
    document.getElementById('todaySales').textContent   = ventasHoy;
    populateReportsTable(salesData);
}

// Pinta la tabla de reports.html
function populateReportsTable(data) {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;
    if (!data.length) {
        document.querySelector('.no-data').style.display = 'block';
        return;
    }
    tbody.innerHTML = data.map(sale=>`
        <tr>
            <td>${sale.id}</td>
            <td>${sale.fecha}</td>
            <td>${sale.nombreCliente}</td>
            <td>${sale.items.map(i=>`${i.item}(${i.quantity})`).join(', ')}</td>
            <td class="amount">$${sale.valorTotal.toLocaleString('es-CO')}</td>
            <td><span class="badge badge-${sale.medioPago}">${sale.medioPago}</span></td>
            <td><button class="delete-btn" onclick="deleteSale(${sale.id})">Eliminar</button></td>
        </tr>
    `).join('');
}

// Eliminar desde reports.html
async function deleteSale(id) {
    if (!confirm('¿Eliminar la venta?')) return;
    await fetch(`/api/ventas/${id}`, { method: 'DELETE' });
    initReports();
}

// Arrancadores
window.addEventListener('load', init);
document.addEventListener('DOMContentLoaded', initReports);

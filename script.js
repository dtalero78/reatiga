// Variables globales
let salesData = JSON.parse(localStorage.getItem('salesData')) || [];
let saleCounter = parseInt(localStorage.getItem('saleCounter')) || 1;
let currentItems = []; // Array para almacenar los items de la venta actual

// Actualizar fecha y hora cada segundo
function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleDateString('es-CO') + ' ' + now.toLocaleTimeString('es-CO');
    document.getElementById('currentDateTime').textContent = dateTimeString;
}

// Inicializar la aplicación
function init() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    displaySalesHistory();
    displayCurrentItems();
    updateTotal();
}

// Agregar item a la venta
function addItem() {
    const itemSelect = document.getElementById('newItem');
    const quantityInput = document.getElementById('newQuantity');
    const priceInput = document.getElementById('newPrice');
    
    const item = itemSelect.value;
    const quantity = parseInt(quantityInput.value) || 1;
    const price = parseFloat(priceInput.value) || 0;
    
    if (!item) {
        alert('Por favor selecciona un item');
        return;
    }
    
    if (price <= 0) {
        alert('Por favor ingresa un precio válido');
        return;
    }
    
    // Verificar si el item ya existe
    const existingItemIndex = currentItems.findIndex(i => i.item === item);
    
    if (existingItemIndex >= 0) {
        // Si existe, actualizar cantidad y precio
        currentItems[existingItemIndex].quantity += quantity;
        currentItems[existingItemIndex].price = price; // Usar el precio más reciente
        currentItems[existingItemIndex].subtotal = currentItems[existingItemIndex].quantity * price;
    } else {
        // Si no existe, agregar nuevo item
        currentItems.push({
            item: item,
            quantity: quantity,
            price: price,
            subtotal: quantity * price
        });
    }
    
    // Limpiar formulario de agregar item
    itemSelect.value = '';
    quantityInput.value = '';
    priceInput.value = '';
    
    // Actualizar display
    displayCurrentItems();
    updateTotal();
}

// Mostrar items actuales
function displayCurrentItems() {
    const container = document.getElementById('itemsContainer');
    
    if (currentItems.length === 0) {
        container.innerHTML = '<div class="empty-items">No hay items agregados aún</div>';
        return;
    }
    
    container.innerHTML = currentItems.map((item, index) => `
        <div class="item-row">
            <div class="item-info">
                <h4>${item.item}</h4>
                <p>Cantidad: ${item.quantity} | Precio unitario: ${item.price.toLocaleString('es-CO')}</p>
            </div>
            <div class="item-price">${item.subtotal.toLocaleString('es-CO')}</div>
            <button class="remove-item" onclick="removeItem(${index})">🗑️</button>
        </div>
    `).join('');
}

// Eliminar item de la venta
function removeItem(index) {
    currentItems.splice(index, 1);
    displayCurrentItems();
    updateTotal();
}

// Actualizar total
function updateTotal() {
    const total = currentItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalItems = currentItems.reduce((sum, item) => sum + item.quantity, 0);
    
    document.getElementById('totalAmount').textContent = total.toLocaleString('es-CO');
    document.getElementById('totalItems').textContent = totalItems;
}

// Manejar el envío del formulario
document.getElementById('salesForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validar que haya items
    if (currentItems.length === 0) {
        alert('Por favor agrega al menos un item a la venta');
        return;
    }
    
    // Validar medio de pago
    if (!document.getElementById('paymentMethod').value) {
        alert('Por favor selecciona un medio de pago');
        return;
    }
    
    const formData = {
        id: saleCounter++,
        fecha: new Date().toLocaleDateString('es-CO'),
        hora: new Date().toLocaleTimeString('es-CO'),
        medioPago: document.getElementById('paymentMethod').value,
        items: [...currentItems], // Copia de los items
        totalItems: currentItems.reduce((sum, item) => sum + item.quantity, 0),
        valorTotal: currentItems.reduce((sum, item) => sum + item.subtotal, 0),
        nombreCliente: document.getElementById('customerName').value || 'No especificado',
        cedula: document.getElementById('customerID').value || 'No especificado',
        telefono: document.getElementById('customerPhone').value || 'No especificado'
    };

    // Guardar en localStorage
    salesData.unshift(formData);
    localStorage.setItem('salesData', JSON.stringify(salesData));
    localStorage.setItem('saleCounter', saleCounter.toString());

    // Mostrar mensaje de éxito
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);

    // Limpiar formulario
    clearForm();
    
    // Actualizar historial
    displaySalesHistory();
});

// Limpiar formulario
function clearForm() {
    document.getElementById('salesForm').reset();
    currentItems = [];
    displayCurrentItems();
    updateTotal();
    document.getElementById('paymentMethod').focus();
}

// Mostrar historial de ventas
function displaySalesHistory() {
    const historyContainer = document.getElementById('salesHistory');
    const recentSales = salesData.slice(0, 10); // Mostrar últimas 10 ventas

    if (recentSales.length === 0) {
        historyContainer.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No hay ventas registradas aún.</p>';
        return;
    }

    const historyHTML = recentSales.map(sale => `
        <div class="sales-item">
            <h3>Venta #${sale.id} - ${sale.totalItems} items</h3>
            <p><strong>Fecha:</strong> ${sale.fecha} a las ${sale.hora}</p>
            <p><strong>Total:</strong> ${sale.valorTotal.toLocaleString('es-CO')} | <strong>Medio de Pago:</strong> ${sale.medioPago}</p>
            <p><strong>Cliente:</strong> ${sale.nombreCliente}</p>
            <div style="margin-top: 10px;">
                <strong>Items:</strong>
                <ul style="margin: 5px 0 0 20px;">
                    ${sale.items.map(item => `
                        <li>${item.item} - Cantidad: ${item.quantity} - ${item.subtotal.toLocaleString('es-CO')}</li>
                    `).join('')}
                </ul>
            </div>
            ${sale.cedula !== 'No especificado' ? `<p><strong>Cédula:</strong> ${sale.cedula}</p>` : ''}
            ${sale.telefono !== 'No especificado' ? `<p><strong>Teléfono:</strong> ${sale.telefono}</p>` : ''}
        </div>
    `).join('');

    historyContainer.innerHTML = historyHTML;
}

// Función para exportar datos (bonus)
function exportData() {
    const dataStr = JSON.stringify(salesData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ventas_' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
}

// Función para calcular total de ventas del día
function getTodayTotal() {
    const today = new Date().toLocaleDateString('es-CO');
    const todaySales = salesData.filter(sale => sale.fecha === today);
    return todaySales.reduce((total, sale) => total + sale.valorTotal, 0);
}

// Función para obtener estadísticas del día
function getDayStats() {
    const today = new Date().toLocaleDateString('es-CO');
    const todaySales = salesData.filter(sale => sale.fecha === today);
    
    const stats = {
        totalVentas: todaySales.length,
        totalIngresos: todaySales.reduce((total, sale) => total + sale.valorTotal, 0),
        promedioVenta: todaySales.length > 0 ? (todaySales.reduce((total, sale) => total + sale.valorTotal, 0) / todaySales.length) : 0,
        itemMasVendido: getMostSoldItem(todaySales),
        medioPagoMasUsado: getMostUsedPaymentMethod(todaySales)
    };
    
    return stats;
}

// Función auxiliar para obtener el item más vendido
function getMostSoldItem(sales) {
    if (sales.length === 0) return 'N/A';
    
    const itemCount = {};
    sales.forEach(sale => {
        sale.items.forEach(item => {
            itemCount[item.item] = (itemCount[item.item] || 0) + item.quantity;
        });
    });
    
    if (Object.keys(itemCount).length === 0) return 'N/A';
    
    return Object.keys(itemCount).reduce((a, b) => itemCount[a] > itemCount[b] ? a : b);
}

// Función auxiliar para obtener el medio de pago más usado
function getMostUsedPaymentMethod(sales) {
    if (sales.length === 0) return 'N/A';
    
    const paymentCount = {};
    sales.forEach(sale => {
        paymentCount[sale.medioPago] = (paymentCount[sale.medioPago] || 0) + 1;
    });
    
    return Object.keys(paymentCount).reduce((a, b) => paymentCount[a] > paymentCount[b] ? a : b);
}

// Función para mostrar estadísticas en consola (para debugging)
function showStats() {
    const stats = getDayStats();
    console.log('Estadísticas del día:', stats);
}

// Inicializar la aplicación cuando se carga la página
window.addEventListener('load', init);

// Función para limpiar todos los datos (usar con cuidado)
function clearAllData() {
    if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('salesData');
        localStorage.removeItem('saleCounter');
        salesData = [];
        saleCounter = 1;
        displaySalesHistory();
        alert('Todos los datos han sido eliminados.');
    }
}

// Función para importar datos desde archivo JSON
function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    salesData = importedData;
                    localStorage.setItem('salesData', JSON.stringify(salesData));
                    displaySalesHistory();
                    alert('Datos importados exitosamente.');
                } else {
                    alert('El archivo no tiene el formato correcto.');
                }
            } catch (error) {
                alert('Error al leer el archivo: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
} los datos? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('salesData');
        localStorage.removeItem('saleCounter');
        salesData = [];
        saleCounter = 1;
        displaySalesHistory();
        alert('Todos los datos han sido eliminados.');
    }
}

// Función para importar datos desde archivo JSON
function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    salesData = importedData;
                    localStorage.setItem('salesData', JSON.stringify(salesData));
                    displaySalesHistory();
                    alert('Datos importados exitosamente.');
                } else {
                    alert('El archivo no tiene el formato correcto.');
                }
            } catch (error) {
                alert('Error al leer el archivo: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}
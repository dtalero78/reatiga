// Variables globales
let salesData = JSON.parse(localStorage.getItem('salesData')) || [];
let saleCounter = parseInt(localStorage.getItem('saleCounter')) || 1;

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
}

// Manejar el envío del formulario
document.getElementById('salesForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        id: saleCounter++,
        fecha: new Date().toLocaleDateString('es-CO'),
        hora: new Date().toLocaleTimeString('es-CO'),
        medioPago: document.getElementById('paymentMethod').value,
        item: document.getElementById('item').value,
        cantidad: parseInt(document.getElementById('quantity').value),
        valorPagado: parseFloat(document.getElementById('amount').value),
        nombreCliente: document.getElementById('customerName').value || 'No especificado',
        cedula: document.getElementById('customerID').value || 'No especificado',
        telefono: document.getElementById('customerPhone').value || 'No especificado'
    };

    // Guardar en localStorage (simulando base de datos)
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
    // Mantener solo los campos obligatorios en foco
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
            <h3>Venta #${sale.id} - ${sale.item}</h3>
            <p><strong>Fecha:</strong> ${sale.fecha} a las ${sale.hora}</p>
            <p><strong>Cantidad:</strong> ${sale.cantidad} | <strong>Valor:</strong> $${sale.valorPagado.toLocaleString('es-CO')}</p>
            <p><strong>Medio de Pago:</strong> ${sale.medioPago}</p>
            <p><strong>Cliente:</strong> ${sale.nombreCliente}</p>
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
    return todaySales.reduce((total, sale) => total + sale.valorPagado, 0);
}

// Función para obtener estadísticas del día
function getDayStats() {
    const today = new Date().toLocaleDateString('es-CO');
    const todaySales = salesData.filter(sale => sale.fecha === today);
    
    const stats = {
        totalVentas: todaySales.length,
        totalIngresos: todaySales.reduce((total, sale) => total + sale.valorPagado, 0),
        promedioVenta: todaySales.length > 0 ? (todaySales.reduce((total, sale) => total + sale.valorPagado, 0) / todaySales.length) : 0,
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
        itemCount[sale.item] = (itemCount[sale.item] || 0) + sale.cantidad;
    });
    
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
}
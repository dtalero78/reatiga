const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos
app.use(express.static('.'));

// Inicializar base de datos
const db = new sqlite3.Database('./sales.db', (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        initializeDatabase();
    }
});

// Crear tabla si no existe
function initializeDatabase() {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ventas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            hora TEXT NOT NULL,
            medioPago TEXT NOT NULL,
            items TEXT NOT NULL,
            totalItems INTEGER NOT NULL,
            valorTotal REAL NOT NULL,
            nombreCliente TEXT,
            cedula TEXT,
            telefono TEXT,
            fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.run(createTableSQL, (err) => {
        if (err) {
            console.error('Error al crear la tabla:', err.message);
        } else {
            console.log('Tabla de ventas inicializada correctamente.');
        }
    });
}

// API Routes

// Obtener todas las ventas
app.get('/api/ventas', (req, res) => {
    const sql = 'SELECT * FROM ventas ORDER BY id DESC';
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener ventas:', err.message);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
        }
        
        // Parsear el campo items de JSON string a objeto
        const ventas = rows.map(row => ({
            ...row,
            items: JSON.parse(row.items)
        }));
        
        res.json(ventas);
    });
});

// Crear nueva venta
app.post('/api/ventas', (req, res) => {
    const {
        fecha,
        hora,
        medioPago,
        items,
        totalItems,
        valorTotal,
        nombreCliente,
        cedula,
        telefono
    } = req.body;

    // Validaciones básicas
    if (!fecha || !hora || !medioPago || !items || !totalItems || !valorTotal) {
        return res.status(400).json({ 
            error: 'Faltan campos obligatorios' 
        });
    }

    const sql = `
        INSERT INTO ventas (
            fecha, hora, medioPago, items, totalItems, 
            valorTotal, nombreCliente, cedula, telefono
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        fecha,
        hora,
        medioPago,
        JSON.stringify(items), // Convertir array a JSON string
        totalItems,
        valorTotal,
        nombreCliente || 'No especificado',
        cedula || 'No especificado',
        telefono || 'No especificado'
    ];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('Error al insertar venta:', err.message);
            res.status(500).json({ error: 'Error al guardar la venta' });
            return;
        }

        // Devolver la venta creada con su ID
        const ventaCreada = {
            id: this.lastID,
            fecha,
            hora,
            medioPago,
            items,
            totalItems,
            valorTotal,
            nombreCliente: nombreCliente || 'No especificado',
            cedula: cedula || 'No especificado',
            telefono: telefono || 'No especificado'
        };

        res.status(201).json(ventaCreada);
    });
});

// Obtener ventas por fecha
app.get('/api/ventas/fecha/:fecha', (req, res) => {
    const fecha = req.params.fecha;
    const sql = 'SELECT * FROM ventas WHERE fecha = ? ORDER BY id DESC';
    
    db.all(sql, [fecha], (err, rows) => {
        if (err) {
            console.error('Error al obtener ventas por fecha:', err.message);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
        }
        
        const ventas = rows.map(row => ({
            ...row,
            items: JSON.parse(row.items)
        }));
        
        res.json(ventas);
    });
});

// Obtener resumen de ventas del día
app.get('/api/resumen/:fecha', (req, res) => {
    const fecha = req.params.fecha;
    const sql = `
        SELECT 
            COUNT(*) as totalVentas,
            SUM(valorTotal) as totalIngresos,
            AVG(valorTotal) as promedioVenta,
            SUM(totalItems) as totalItems
        FROM ventas 
        WHERE fecha = ?
    `;
    
    db.get(sql, [fecha], (err, row) => {
        if (err) {
            console.error('Error al obtener resumen:', err.message);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
        }
        
        res.json({
            totalVentas: row.totalVentas || 0,
            totalIngresos: row.totalIngresos || 0,
            promedioVenta: row.promedioVenta || 0,
            totalItems: row.totalItems || 0
        });
    });
});

// Eliminar venta
app.delete('/api/ventas/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM ventas WHERE id = ?';
    
    db.run(sql, [id], function(err) {
        if (err) {
            console.error('Error al eliminar venta:', err.message);
            res.status(500).json({ error: 'Error al eliminar la venta' });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Venta no encontrada' });
            return;
        }
        
        res.json({ mensaje: 'Venta eliminada correctamente' });
    });
});

// Eliminar todas las ventas
app.delete('/api/ventas', (req, res) => {
    const sql = 'DELETE FROM ventas';
    
    db.run(sql, [], function(err) {
        if (err) {
            console.error('Error al eliminar todas las ventas:', err.message);
            res.status(500).json({ error: 'Error al eliminar todas las ventas' });
            return;
        }
        
        // Reiniciar el autoincrement
        db.run('DELETE FROM sqlite_sequence WHERE name="ventas"', (err) => {
            if (err) {
                console.error('Error al reiniciar autoincrement:', err.message);
            }
        });
        
        res.json({ mensaje: `${this.changes} ventas eliminadas correctamente` });
    });
});

// Obtener estadísticas generales
app.get('/api/estadisticas', (req, res) => {
    const sql = `
        SELECT 
            COUNT(*) as totalVentas,
            SUM(valorTotal) as totalIngresos,
            AVG(valorTotal) as promedioVenta,
            MIN(fecha) as primeraVenta,
            MAX(fecha) as ultimaVenta
        FROM ventas
    `;
    
    db.get(sql, [], (err, row) => {
        if (err) {
            console.error('Error al obtener estadísticas:', err.message);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
        }
        
        res.json(row);
    });
});

// Rutas para páginas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/reports.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'reports.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Sales app is running',
        database: 'Connected'
    });
});

// Manejar rutas no encontradas
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sales Registration App running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});

// Manejar cierre graceful
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    db.close((err) => {
        if (err) {
            console.error('Error al cerrar la base de datos:', err.message);
        } else {
            console.log('Conexión a la base de datos cerrada.');
        }
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    db.close((err) => {
        if (err) {
            console.error('Error al cerrar la base de datos:', err.message);
        } else {
            console.log('Conexión a la base de datos cerrada.');
        }
        process.exit(0);
    });
});
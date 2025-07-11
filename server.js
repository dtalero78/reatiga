const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos desde el directorio actual
app.use(express.static('.'));

// Ruta para la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para reportes
app.get('/reports.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'reports.html'));
});

// Manejar todas las demás rutas sirviendo index.html (SPA behavior)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint para Digital Ocean
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Sales app is running' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sales Registration App running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});

// Manejar cierre graceful
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    process.exit(0);
});
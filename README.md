// =============================================================================
// README.md - Instrucciones de instalación y uso
// =============================================================================
# Aplicación de Registro de Ventas

Una aplicación web sencilla para registrar ventas presenciales con base de datos SQLite.

## Características

- ✅ Registro de ventas con fecha y hora automática
- ✅ Campos obligatorios: medio de pago, item, cantidad, valor pagado
- ✅ Campos opcionales: nombre, cédula, teléfono del cliente
- ✅ Base de datos SQLite local
- ✅ Interfaz moderna y responsiva
- ✅ API REST para operaciones CRUD
- ✅ Reportes y resúmenes de ventas

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd sales-registration-app
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Inicializar la base de datos**
   ```bash
   npm run init-db
   ```

4. **Iniciar la aplicación**
   ```bash
   npm start
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## Uso

### Registrar una venta
1. La fecha y hora se capturan automáticamente
2. Selecciona el medio de pago (obligatorio)
3. Selecciona el item (obligatorio)
4. Ingresa la cantidad (obligatorio)
5. Ingresa el valor pagado (obligatorio)
6. Opcionalmente, ingresa los datos del cliente
7. Haz clic en "Registrar Venta"

### Ver historial de ventas
- Las últimas ventas aparecen automáticamente en la parte inferior
- Puedes ver detalles de cada venta registrada

## API Endpoints

- `GET /api/ventas` - Obtener todas las ventas
- `POST /api/ventas` - Registrar nueva venta
- `GET /api/ventas/fecha/:fecha` - Obtener ventas por fecha
- `GET /api/resumen/:fecha` - Obtener resumen de ventas del día
- `DELETE /api/ventas/:id` - Eliminar venta

## Estructura del Proyecto

```
sales-registration-app/
├── package.json
├── server.js
├── init-database.js
├── sales.db (se crea automáticamente)
├── public/
│   └── index.html
└── README.md
```

## Desarrollo

Para desarrollo con auto-reload:
```bash
npm run dev
```

## Respaldo de datos

La base de datos se guarda en el archivo `sales.db`. Para hacer respaldo:
```bash
cp sales.db sales_backup_$(date +%Y%m%d).db
```
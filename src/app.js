// /home/agus/Documentos/VetHealth/VetBack/src/app.js
const express = require('express');
const app = express();
const cors = require('cors'); 
// Middlewares
app.use(express.json());

// 1. Importar las rutas. Asegúrate de que las rutas son importadas como objetos
const productoRoutes = require('./routes/producto.routes');
//const loteRoutes = require('./routes/loteProducto.routes');
const citaRoutes = require('./routes/cita.routes'); 
const clienteRoutes = require('./routes/cliente.routes');
const expedienteRoutes = require('./routes/expediente.routes');
const consultaRoutes = require('./routes/consulta.routes');
const reporteRoutes = require('./routes/pdf.routes');
const path = require('path');
const proveedorRoutes = require('./routes/proveedor.routes');
const categoriaRoutes = require('./routes/categoria.routes');
const movimientoRoutes = require('./routes/movimiento.routes')
const lotesRoutes = require('./routes/lote.routes');


app.use(cors({
  origin: '*'
}));

// conexion a las rutas
app.use('/api/productos', productoRoutes); 
//app.use('/api/lotes', loteRoutes);
app.use('/api/citas', citaRoutes); 
app.use('/api/clientes', clienteRoutes);
app.use('/api/expedientes', expedienteRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/reportes', express.static(path.join(__dirname, 'reportes')));
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/lotes', lotesRoutes)


module.exports = app;



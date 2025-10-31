const express = require('express');
const app = express();
const cors = require('cors'); 
const path = require('path');

// Middlewares
app.use(express.json());
app.use(cors({
  origin: '*'
}));

// 1. Importar las rutas
const productoRoutes = require('./routes/producto.routes');
const citaRoutes = require('./routes/cita.routes'); 
const clienteRoutes = require('./routes/cliente.routes');
const expedienteRoutes = require('./routes/expediente.routes');
const consultaRoutes = require('./routes/consulta.routes');
const reporteRoutes = require('./routes/pdf.routes');
const proveedorRoutes = require('./routes/proveedor.routes');
const categoriaRoutes = require('./routes/categoria.routes');
const movimientoRoutes = require('./routes/movimiento.routes');
const lotesRoutes = require('./routes/lote.routes');
const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const alertaRoutes = require('./routes/alerta.routes');

// Conexión a las rutas
app.use('/api/productos', productoRoutes); 
app.use('/api/citas', citaRoutes); 
app.use('/api/clientes', clienteRoutes);
app.use('/api/expedientes', expedienteRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/reportes', express.static(path.join(__dirname, 'reportes')));
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/lotes', lotesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/alertas', alertaRoutes);

module.exports = app;
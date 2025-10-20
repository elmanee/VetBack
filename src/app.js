const express = require('express');
const app = express();

// Middlewares
app.use(express.json());

// rutas
const productoRoutes = require('./routes/producto.routes');
const loteRoutes = require('./routes/loteProducto.routes');


// conexion a las rutas
app.use('/api/productos', productoRoutes); 
app.use('/api/lotes', loteRoutes);

module.exports = app;
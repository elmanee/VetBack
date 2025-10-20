const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');

router.route('/')
    .get(productoController.getAllProductos)
    .post(productoController.createProducto);

router.route('/:id')
    .get(productoController.getProductoById)
    .put(productoController.updateProducto) 
    .delete(productoController.deleteProducto);

module.exports = router;
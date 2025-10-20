const express = require('express');
const router = express.Router();
const loteProductoController = require('../controllers/loteProducto.controller');

// rutas base
router.route('/')
    .get(loteProductoController.getAllLotes)
    .post(loteProductoController.createLote);

// R]rutas por ID de lote:
router.route('/:id')
    .put(loteProductoController.updateLoteInventory) 
    .delete(loteProductoController.deleteLote);

module.exports = router;

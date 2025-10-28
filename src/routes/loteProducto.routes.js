const express = require('express');
const router = express.Router();
const loteProductoController = require('../controllers/loteProducto.controller');

router.get('/detalle/:id', loteProductoController.getDetalleProductoYLote);

router.route('/')
  .get(loteProductoController.getAllLotes)
  .post(loteProductoController.createLote);

router.route('/:id')
  .put(loteProductoController.updateLoteInventory)
  .delete(loteProductoController.deleteLote);

module.exports = router;

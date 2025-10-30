const express = require('express');
const router = express.Router();
const loteController = require('../controllers/lote.controller');
const LoteProductoController = require('../controllers/loteProducto.controller');

router.post('/', loteController.createLote);
router.get('/', loteController.getAllLotes);
router.get('/:id', LoteProductoController.getLotesByProductoId);

router.get('/detalle/:id', LoteProductoController.getDetalleProductoYLote);

router.patch('/:id', LoteProductoController.updateLoteInventory);
router.delete('/:id', LoteProductoController.deleteLote);
module.exports = router;

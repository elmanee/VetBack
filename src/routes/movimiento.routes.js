const express = require('express');
const router = express.Router();
const movimientoController = require('../controllers/movimiento.controller');

router.route('/')
  .get(movimientoController.getAllMovimientos)
  .post(movimientoController.createMovimiento);

module.exports = router;

const express = require('express');
const router = express.Router();
const loteController = require('../controllers/lote.controller');

router.post('/', loteController.createLote);
router.get('/', loteController.getAllLotes);

module.exports = router;

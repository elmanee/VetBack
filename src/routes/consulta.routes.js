const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consulta.controller');

// GET /api/consultas/verificar-cita/:cita_id - Verificar si una cita puede ser atendida
router.get('/verificar-cita/:cita_id', consultaController.verificarCita);

// GET /api/consultas/expediente/:expediente_id - Obtener consultas de un expediente
router.get('/expediente/:expediente_id', consultaController.getConsultasByExpediente);

// GET /api/consultas/:id - Obtener consulta por ID
router.get('/:id', consultaController.getConsultaById);

// POST /api/consultas - Registrar nueva consulta completa
router.post('/', consultaController.registrarConsulta);

// PUT /api/consultas/:id - Actualizar observaciones de una consulta
router.put('/:id', consultaController.updateConsulta);

module.exports = router;
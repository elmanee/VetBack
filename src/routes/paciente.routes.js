const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/paciente.controller');

// GET /api/pacientes/:id - Obtener paciente por ID
router.get('/:id', pacienteController.obtenerPacientePorId);

// POST /api/pacientes - Crear nuevo paciente
router.post('/', pacienteController.crearPaciente);

// GET /api/pacientes/cliente/:clienteId - Obtener pacientes por cliente
router.get('/cliente/:clienteId', pacienteController.obtenerPacientesPorCliente);

// PUT /api/pacientes/:id - Actualizar paciente
router.put('/:id', pacienteController.actualizarPaciente);

// GET /api/pacientes/buscar/buscar?cliente_id=1&nombre=Rocky - Buscar paciente
router.get('/buscar/buscar', pacienteController.buscarPaciente);

module.exports = router;
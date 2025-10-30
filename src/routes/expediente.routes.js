const express = require('express');
const router = express.Router();
const expedienteController = require('../controllers/expediente.controller');

// GET /api/expedientes - Obtener todos los expedientes
router.get('/', expedienteController.getAllExpedientes);

// GET /api/buscar/expedientes - Búsqueda avanzada con filtros
// Query params: nombre_mascota, propietario, numero_expediente, fecha_desde, fecha_hasta, diagnostico, estado
router.get('/search', expedienteController.searchExpedientes);

// GET /api/expedientes/mascota/:mascota_id - Obtener expediente por mascota
router.get('/mascota/:mascota_id', expedienteController.getExpedienteByMascota);

// GET /api/expedientes/numero/:numero_expediente - Obtener expediente por número
router.get('/numero/:numero_expediente', expedienteController.getExpedienteByNumero);

// GET /api/expedientes/:id/historial - Obtener historial completo del expediente
router.get('/:id/historial', expedienteController.getHistorialCompleto);

// GET /api/expedientes/:id - Obtener expediente por ID
router.get('/:id', expedienteController.getExpedienteById);

// POST /api/expedientes - Crear nuevo expediente
router.post('/', expedienteController.createExpediente);

// PUT /api/expedientes/:id - Actualizar expediente
router.put('/:id', expedienteController.updateExpediente);

module.exports = router;
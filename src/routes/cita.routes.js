// /home/agus/Documentos/VetHealth/VetBack/src/routes/cita.routes.js
const express = require('express');
const router = express.Router();
const citaController = require('../controllers/cita.controller');
const verifyToken = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

// ⭐ IMPORTANTE: Esta ruta debe estar ANTES del verifyToken
// porque es accedida desde un enlace público en el email
router.get('/confirmar/:token', citaController.confirmarCita);

// Ahora sí, aplicar autenticación a las demás rutas
router.use(verifyToken);

// RQF01 - Rutas RESTful para Citas
router.route('/')
    // GET /api/citas -> Consulta de agenda/calendario
    .get(citaController.getAllCitas)
    // POST /api/citas -> Registrar nueva cita (y valida disponibilidad)
    .post(citaController.createCita);

router.route('/:id')
    // PUT /api/citas/:id -> Reprogramar cita
    .put(citaController.updateCita)
    // DELETE /api/citas/:id -> Cancelar cita
    .delete(citaController.deleteCita);

router.get('/veterinario/:id', checkRole(['Veterinario']), citaController.getCitasByVeterinario);

module.exports = router;
// /home/agus/Documentos/VetHealth/VetBack/src/routes/cita.routes.js
const express = require('express');
const router = express.Router();
const citaController = require('../controllers/cita.controller');
const { confirmarCita } = require('../controllers/cita.controller');
const verifyToken = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

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

    router.get('/confirmar/:token', confirmarCita); // <-- NUEVA RUTA

router.get('/veterinario/:id', checkRole(['Veterinario']), citaController.getCitasByVeterinario);
    
module.exports = router;
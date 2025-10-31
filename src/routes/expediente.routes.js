const express = require('express');
const router = express.Router();
const expedienteController = require('../controllers/expediente.controller');
const verifyToken = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

router.use(verifyToken);

// Crear un expediente (solo veterinarios)
router.post('/', expedienteController.crearExpediente);

// Obtener todos los expedientes
router.get('/', expedienteController.obtenerExpedientes);

module.exports = router;

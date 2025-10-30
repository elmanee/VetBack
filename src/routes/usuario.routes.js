const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const verifyToken = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

router.use(verifyToken);

router.get('/:id', checkRole(['Admin']), usuarioController.getUsuarioById);

module.exports = router;

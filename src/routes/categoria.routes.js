const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoria.controller');

router.route('/')
  .get(categoriaController.getAllCategorias)
  .post(categoriaController.createCategoria); 

router.route('/:id')
  .get(categoriaController.getCategoriaById);

module.exports = router;

const PacienteModel = require('../models/paciente.model');

const pacienteController = {
  /**
   * Obtener paciente por ID
   */
  async obtenerPacientePorId(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`[PACIENTE CONTROLLER] Buscando paciente con ID: ${id}`);
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de paciente inválido'
        });
      }
      
      const paciente = await PacienteModel.findById(parseInt(id));
      
      if (!paciente) {
        return res.status(404).json({
          success: false,
          message: 'Paciente no encontrado'
        });
      }
      
      console.log(`[PACIENTE CONTROLLER] Paciente encontrado:`, paciente);
      
      res.json({
        success: true,
        data: paciente
      });
      
    } catch (error) {
      console.error('[PACIENTE CONTROLLER] Error al obtener paciente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener paciente'
      });
    }
  },

  /**
   * Crear nuevo paciente
   */
  async crearPaciente(req, res) {
    try {
      const { cliente_id, nombre, animal_id, raza, edad, peso } = req.body;
      
      console.log('[PACIENTE CONTROLLER] Datos recibidos para crear paciente:', req.body);
      
      // Validaciones
      if (!cliente_id || !nombre) {
        return res.status(400).json({
          success: false,
          message: 'Los campos cliente_id y nombre son obligatorios'
        });
      }
      
      if (isNaN(cliente_id)) {
        return res.status(400).json({
          success: false,
          message: 'cliente_id debe ser un número válido'
        });
      }
      
      // Verificar si ya existe un paciente con el mismo nombre para este cliente
      // Nota: Necesitarías agregar este método a tu modelo
      const pacientesExistentes = await PacienteModel.findAll();
      const pacienteExistente = pacientesExistentes.find(
        p => p.cliente_id === parseInt(cliente_id) && 
             p.nombre.toLowerCase() === nombre.toLowerCase()
      );
      
      if (pacienteExistente) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un paciente con ese nombre para este cliente',
          data: pacienteExistente
        });
      }
      
      // Preparar datos para crear el paciente
      const pacienteData = {
        cliente_id: parseInt(cliente_id),
        nombre: nombre.trim(),
        raza: raza || null,
        edad: edad ? parseInt(edad) : null,
        peso: peso ? parseFloat(peso) : null
      };
      
      // Nota: Tu modelo actual no incluye animal_id, necesitarías actualizarlo
      // Por ahora lo omitimos o actualiza tu modelo
      console.log('[PACIENTE CONTROLLER] Creando paciente con datos:', pacienteData);
      
      const nuevoPaciente = await PacienteModel.create(pacienteData);
      
      console.log('[PACIENTE CONTROLLER] Paciente creado exitosamente:', nuevoPaciente);
      
      res.status(201).json({
        success: true,
        message: 'Paciente creado exitosamente',
        data: nuevoPaciente
      });
      
    } catch (error) {
      console.error('[PACIENTE CONTROLLER] Error al crear paciente:', error);
      
      // Manejar errores específicos de la base de datos
      if (error.code === '23503') { // Foreign key violation en PostgreSQL
        return res.status(400).json({
          success: false,
          message: 'El cliente no existe'
        });
      }
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          success: false,
          message: 'Ya existe un paciente con ese nombre'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear paciente'
      });
    }
  },

  /**
   * Obtener pacientes por cliente
   */
  async obtenerPacientesPorCliente(req, res) {
    try {
      const { clienteId } = req.params;
      
      console.log(`[PACIENTE CONTROLLER] Buscando pacientes para cliente ID: ${clienteId}`);
      
      if (!clienteId || isNaN(clienteId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de cliente inválido'
        });
      }
      
      // Necesitarías agregar este método a tu modelo
      const todosPacientes = await PacienteModel.findAll();
      const pacientes = todosPacientes.filter(p => p.cliente_id === parseInt(clienteId));
      
      console.log(`[PACIENTE CONTROLLER] Encontrados ${pacientes.length} pacientes para el cliente`);
      
      res.json({
        success: true,
        data: pacientes
      });
      
    } catch (error) {
      console.error('[PACIENTE CONTROLLER] Error al obtener pacientes por cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener pacientes'
      });
    }
  },

  /**
   * Actualizar paciente
   */
  async actualizarPaciente(req, res) {
    try {
      const { id } = req.params;
      const { nombre, raza, edad, peso } = req.body;
      
      console.log(`[PACIENTE CONTROLLER] Actualizando paciente ID: ${id} con datos:`, req.body);
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de paciente inválido'
        });
      }
      
      // Verificar que el paciente existe
      const pacienteExistente = await PacienteModel.findById(parseInt(id));
      
      if (!pacienteExistente) {
        return res.status(404).json({
          success: false,
          message: 'Paciente no encontrado'
        });
      }
      
      // Preparar datos para actualizar
      const updateData = {
        nombre: nombre || pacienteExistente.nombre,
        raza: raza !== undefined ? raza : pacienteExistente.raza,
        edad: edad !== undefined ? parseInt(edad) : pacienteExistente.edad,
        peso: peso !== undefined ? parseFloat(peso) : pacienteExistente.peso
      };
      
      const pacienteActualizado = await PacienteModel.update(parseInt(id), updateData);
      
      console.log('[PACIENTE CONTROLLER] Paciente actualizado exitosamente:', pacienteActualizado);
      
      res.json({
        success: true,
        message: 'Paciente actualizado exitosamente',
        data: pacienteActualizado
      });
      
    } catch (error) {
      console.error('[PACIENTE CONTROLLER] Error al actualizar paciente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar paciente'
      });
    }
  },

  /**
   * Buscar paciente por nombre y cliente (útil para verificar existencia)
   */
  async buscarPaciente(req, res) {
    try {
      const { cliente_id, nombre } = req.query;
      
      console.log(`[PACIENTE CONTROLLER] Buscando paciente - Cliente: ${cliente_id}, Nombre: ${nombre}`);
      
      if (!cliente_id || !nombre) {
        return res.status(400).json({
          success: false,
          message: 'Los parámetros cliente_id y nombre son requeridos'
        });
      }
      
      const todosPacientes = await PacienteModel.findAll();
      const paciente = todosPacientes.find(
        p => p.cliente_id === parseInt(cliente_id) && 
             p.nombre.toLowerCase().includes(nombre.toLowerCase())
      );
      
      res.json({
        success: true,
        data: paciente,
        existe: !!paciente
      });
      
    } catch (error) {
      console.error('[PACIENTE CONTROLLER] Error al buscar paciente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al buscar paciente'
      });
    }
  }
};

module.exports = pacienteController;
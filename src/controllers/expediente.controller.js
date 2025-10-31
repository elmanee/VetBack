const ExpedienteModel = require('../models/expediente.model');
const PacienteModel = require('../models/paciente.model');
const responseHandler = require('../utils/responseHandler');

const crearExpediente = async (req, res) => {
  try {
    const { cliente_id, nombre, raza, edad, peso, observaciones_generales } = req.body;

    if (!cliente_id || !nombre) {
      return responseHandler.error(res, 'Faltan datos del paciente o cliente.', 400);
    }

    // Crear paciente
    const paciente = await PacienteModel.create({
      cliente_id,
      nombre,
      raza,
      edad,
      peso,
    });

    const paciente_id = paciente.id;
    const numero_expediente = `EXP-${Date.now()}`;

    // Crear expediente asociado
    const expediente = await ExpedienteModel.create({
      paciente_id,
      numero_expediente,
      observaciones_generales,
    });

    return responseHandler.success(
      res,
      expediente,
      'Expediente creado correctamente',
      201
    );
  } catch (error) {
    console.error('[CONTROLADOR EXPEDIENTE] Error al crear expediente:', error);
    return responseHandler.error(res, 'Error al crear expediente', 500);
  }
};

const obtenerExpedientes = async (req, res) => {
  try {
    const expedientes = await ExpedienteModel.findAll();
    return responseHandler.success(res, expedientes, 'Expedientes obtenidos correctamente');
  } catch (error) {
    console.error('[CONTROLADOR EXPEDIENTE] Error al obtener expedientes:', error);
    return responseHandler.error(res, 'Error al obtener expedientes', 500);
  }
};

module.exports = { crearExpediente, obtenerExpedientes };

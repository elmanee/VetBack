// /home/agus/Documentos/VetHealth/VetBack/src/controllers/cita.controller.js
const CitaModel = require('../models/cita.model');
const ClienteModel = require('../models/cliente.model'); 
const responseHandler = require('../utils/responseHandler');
const emailService = require('../services/emailService');

// Función  para  la notificación
const enviarNotificacion = async (cita, tipo = 'CONFIRMACIÓN') => {
    console.info("---------------------------------------------------------------------");
    console.info(`ENVIANDO ${tipo} (RQF01) para Cita ID ${cita.id_cita}`);
    
    // Obtener datos del cliente
    const cliente = await ClienteModel.findById(cita.cliente_id);
    
    if (!cliente) {
        console.warn('[CONTROLADOR CITA] No se pudo obtener el cliente para enviar notificación');
        return;
    }
    
    try {
        let resultado;
        
        if (tipo === 'CONFIRMACIÓN') {
            resultado = await emailService.enviarConfirmacionCita(cita, cliente.correo, cliente.nombre_completo);
        } else if (tipo === 'REPROGRAMACIÓN') {
            resultado = await emailService.enviarNotificacionReprogramacion(cita, cliente.correo, cliente.nombre_completo);
        } else if (tipo === 'CANCELACIÓN') {
            resultado = await emailService.enviarNotificacionCancelacion(cita, cliente.correo, cliente.nombre_completo);
        }
        
        if (resultado.success) {
            console.info(`✅ Notificación enviada exitosamente a ${cliente.correo}`);
        } else {
            console.error(`❌ Error al enviar notificación: ${resultado.error}`);
        }
    } catch (error) {
        console.error('[CONTROLADOR CITA] Error al enviar notificación:', error);
    }
    
    console.info("---------------------------------------------------------------------");
};

// ============================================
// POST /api/citas - Registrar nueva cita
// ============================================
const createCita = async (req, res) => {
    console.log('[CONTROLADOR CITA] Iniciando registro de cita...');
    console.log('[CONTROLADOR CITA] Datos recibidos:', req.body);
    
    const { cliente, cita } = req.body;
    let cliente_id;

    try {
        // ===============================================
        // PASO 1: GESTIÓN DE CLIENTE (Nuevo/Existente)
        // ===============================================

        if (cliente && cliente.correo && !cliente.cliente_id) {
            console.log('[CONTROLADOR CITA] Verificando si el cliente ya existe...');
            
            const clienteExistente = await ClienteModel.findByEmail(cliente.correo);

            if (!clienteExistente) {
                console.log('[CONTROLADOR CITA] Cliente nuevo, creando registro...');
                
                const nuevoCliente = await ClienteModel.create({
                    nombre_completo: cliente.nombre_completo,
                    correo: cliente.correo,
                    telefono: cliente.telefono,
                    direccion: cliente.direccion
                });
                
                cliente_id = nuevoCliente.id;
                console.log(`[CONTROLADOR CITA] Cliente nuevo creado con ID: ${cliente_id}`);
            } else {
                cliente_id = clienteExistente.id;
                console.log(`[CONTROLADOR CITA] Cliente existente encontrado con ID: ${cliente_id}`);
            }
        } else if (cliente && cliente.cliente_id) {
            cliente_id = cliente.cliente_id;
            console.log(`[CONTROLADOR CITA] Usando cliente existente con ID: ${cliente_id}`);
        } else {
            return responseHandler.error(res, 'Datos de cliente incompletos o inválidos.', 400);
        }
        
        // ===============================================
        // PASO 2: VALIDACIÓN Y REGISTRO DE CITA
        // ===============================================

        const { fecha_cita, hora_cita, veterinario_id, motivo, animal_id, mascota_id = null } = cita;

        if (!fecha_cita || !hora_cita || !veterinario_id || !motivo || !animal_id) {
            return responseHandler.error(res, 'Faltan campos obligatorios de la cita.', 400);
        }

        console.log('[CONTROLADOR CITA] Validando disponibilidad del veterinario...');
        const hayConflicto = await CitaModel.checkAvailability(fecha_cita, hora_cita, veterinario_id);
        
        if (hayConflicto) {
            return responseHandler.error(res, 'Conflicto de Horario: El veterinario ya tiene una cita en ese horario.', 409);
        }

        console.log('[CONTROLADOR CITA] Registrando cita en la base de datos...');
        const nuevaCita = await CitaModel.create({
            cliente_id, 
            mascota_id, 
            veterinario_id, 
            fecha_cita, 
            hora_cita, 
            motivo, 
            animal_id
        });
        
        console.log(`[CONTROLADOR CITA] Cita registrada con ID: ${nuevaCita.id_cita}`);
        
        enviarNotificacion(nuevaCita, 'CONFIRMACIÓN'); 
        
        return responseHandler.success(res, nuevaCita, 'Cita registrada con éxito. Confirmación enviada.', 201);

    } catch (error) {
        console.error("[CONTROLADOR CITA] Error al registrar la cita:", error);
        return responseHandler.error(res, 'Error interno al registrar la cita.', 500);
    }
};

// ============================================
// GET /api/citas - Obtener todas las citas
// ============================================
const getAllCitas = async (req, res) => {
    console.log('[CONTROLADOR CITA] Obteniendo todas las citas...');
    
    try {
        const citas = await CitaModel.findAll();
        console.log(`[CONTROLADOR CITA] Se encontraron ${citas.length} citas`);
        
        return responseHandler.success(
            res,
            citas,
            `Se encontraron ${citas.length} citas programadas.`
        );
    } catch (error) {
        console.error("[CONTROLADOR CITA] Error al obtener citas:", error);
        return responseHandler.error(
            res,
            'Error interno del servidor al obtener la agenda de citas.'
        );
    }
};

// ============================================
// PUT /api/citas/:id - Reprogramar cita
// ============================================
const updateCita = async (req, res) => {
    console.log('[CONTROLADOR CITA] Iniciando actualización de cita...');
    const { id } = req.params;
    const { fecha_cita, hora_cita, veterinario_id } = req.body;
    
    console.log(`[CONTROLADOR CITA] ID de cita: ${id}`);
    console.log('[CONTROLADOR CITA] Nuevos datos:', req.body);
    
    try {
        // Validar que la cita exista
        const citaExistente = await CitaModel.findById(id);
        
        if (!citaExistente) {
            console.log('[CONTROLADOR CITA] Cita no encontrada');
            return responseHandler.error(res, 'Cita no encontrada', 404);
        }
        
        // Validar que la cita no esté cancelada
        if (citaExistente.estado === 'Cancelada') {
            console.log('[CONTROLADOR CITA] No se puede reprogramar una cita cancelada');
            return responseHandler.error(res, 'No se puede reprogramar una cita cancelada', 400);
        }
        
        // Validar campos requeridos
        if (!fecha_cita || !hora_cita) {
            console.log('[CONTROLADOR CITA] Faltan campos requeridos');
            return responseHandler.error(res, 'Fecha y hora son obligatorios', 400);
        }
        
        // Validar disponibilidad del nuevo horario
        const vet_id = veterinario_id || citaExistente.veterinario_id;
        const hayConflicto = await CitaModel.checkAvailability(fecha_cita, hora_cita, vet_id);
        
        if (hayConflicto) {
            return responseHandler.error(res, 'Conflicto de Horario: Ya existe una cita en ese horario.', 409);
        }
        
        // Actualizar la cita
        const citaActualizada = await CitaModel.update(id, {
            fecha_cita,
            hora_cita,
            veterinario_id: vet_id,
            estado: 'Pendiente'
        });
        
        console.log('[CONTROLADOR CITA] Cita reprogramada con éxito');
        
        enviarNotificacion(citaActualizada, 'REPROGRAMACIÓN');
        
        return responseHandler.success(res, citaActualizada, 'Cita reprogramada exitosamente', 200);
        
    } catch (error) {
        console.error('[CONTROLADOR CITA] Error al actualizar cita:', error.message);
        return responseHandler.error(res, `Error al reprogramar la cita: ${error.message}`, 500);
    }
};

// ============================================
// DELETE /api/citas/:id - Cancelar cita
// ============================================
const deleteCita = async (req, res) => {
    console.log('[CONTROLADOR CITA] Iniciando cancelación de cita...');
    const { id } = req.params;
    
    console.log(`[CONTROLADOR CITA] ID de cita a cancelar: ${id}`);
    
    try {
        // Validar que la cita exista
        const citaExistente = await CitaModel.findById(id);
        
        if (!citaExistente) {
            console.log('[CONTROLADOR CITA] Cita no encontrada');
            return responseHandler.error(res, 'Cita no encontrada', 404);
        }
        
        // Validar que la cita no esté ya cancelada
        if (citaExistente.estado === 'Cancelada') {
            console.log('[CONTROLADOR CITA] La cita ya está cancelada');
            return responseHandler.error(res, 'La cita ya está cancelada', 400);
        }
        
        // Cancelar la cita
        const citaCancelada = await CitaModel.cancel(id);
        
        console.log('[CONTROLADOR CITA] Cita cancelada con éxito');
        
        enviarNotificacion(citaCancelada, 'CANCELACIÓN');
        
        return responseHandler.success(res, citaCancelada, 'Cita cancelada exitosamente', 200);
        
    } catch (error) {
        console.error('[CONTROLADOR CITA] Error al cancelar cita:', error.message);
        return responseHandler.error(res, `Error al cancelar la cita: ${error.message}`, 500);
    }
};

// Exportar todas las funciones
module.exports = {
    createCita,
    getAllCitas,
    updateCita,
    deleteCita
};
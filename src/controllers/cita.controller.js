const CitaModel = require('../models/cita.model');
const ClienteModel = require('../models/cliente.model'); 
const responseHandler = require('../utils/responseHandler');
const emailService = require('../services/emailService');
const crypto = require('crypto'); // Necesario para generar el token de confirmación
const UsuarioModel = require('../models/usuario.model');

// Función  para  la notificación
const enviarNotificacion = async (cita, tipo = 'CONFIRMACIÓN') => {
// ... (código existente sin cambios) ...
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
            // El servicio de correo ahora enviará el token de confirmación
            resultado = await emailService.enviarConfirmacionCita(cita, cliente.correo, cliente.nombre_completo);
        } else if (tipo === 'REPROGRAMACIÓN') {
            resultado = await emailService.enviarNotificacionReprogramacion(cita, cliente.correo, cliente.nombre_completo);
        } else if (tipo === 'CANCELACIÓN') {
            resultado = await emailService.enviarNotificacionCancelacion(cita, cliente.correo, cliente.nombre_completo);
        }
        
        if (resultado.success) {
            console.info(`Notificación enviada exitosamente a ${cliente.correo}`);
        } else {
            console.error(`Error al enviar notificación: ${resultado.error}`);
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
// ... (código existente sin cambios) ...
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
        // PASO 2: VALIDACIÓN Y ASIGNACIÓN DE VETERINARIO
        // ===============================================

        const { fecha_cita, hora_cita, motivo, animal_id, mascota_id = null } = cita;
        let { veterinario_id } = cita;

        // Si no se manda veterinario desde el front, se elige automáticamente
        if (!veterinario_id) {
            console.log('[CONTROLADOR CITA] No se especificó veterinario. Buscando uno disponible...');
            const veterinarios = await UsuarioModel.getVeterinarios();

            if (veterinarios.length === 0) {
                return responseHandler.error(res, 'No hay veterinarios registrados en el sistema.', 400);
            }

            // Escoge uno aleatorio (podrías cambiar esto por el menos ocupado)
            const veterinarioSeleccionado = veterinarios[Math.floor(Math.random() * veterinarios.length)];
            veterinario_id = veterinarioSeleccionado.id;

            console.log(`[CONTROLADOR CITA] Se asignó automáticamente al veterinario: ${veterinarioSeleccionado.nombre_completo}`);
        }

        // Validar campos obligatorios
        if (!fecha_cita || !hora_cita || !motivo || !animal_id) {
            return responseHandler.error(res, 'Faltan campos obligatorios de la cita.', 400);
        }

        console.log('[CONTROLADOR CITA] Validando disponibilidad del veterinario...');
        const hayConflicto = await CitaModel.checkAvailability(fecha_cita, hora_cita, veterinario_id);
        
        if (hayConflicto) {
            return responseHandler.error(res, 'Conflicto de Horario: El veterinario ya tiene una cita en ese horario.', 409);
        }

        // ===============================================
        // PASO 3: REGISTRO DE CITA
        // ===============================================

        const token_confirmacion = crypto.randomUUID(); 
        
        console.log('[CONTROLADOR CITA] Registrando cita en la base de datos...');
        const nuevaCita = await CitaModel.create({
            cliente_id, 
            mascota_id, 
            veterinario_id, 
            fecha_cita, 
            hora_cita, 
            motivo, 
            animal_id,
            token_confirmacion,
            estado: 'Por Confirmar'
        });
        
        console.log(`[CONTROLADOR CITA] Cita registrada con ID: ${nuevaCita.id_cita} (Estado: Por Confirmar)`);
        
        enviarNotificacion(nuevaCita, 'CONFIRMACIÓN'); 
        
        return responseHandler.success(res, nuevaCita, 'Cita registrada con éxito. Se requiere confirmación por email.', 201);

    } catch (error) {
        console.error("[CONTROLADOR CITA] Error al registrar la cita:", error);
        return responseHandler.error(res, 'Error interno al registrar la cita.', 500);
    }
};

// ============================================
// GET /api/citas/confirmar/:token - Confirmar cita
// ============================================
const confirmarCita = async (req, res) => {
    const { token } = req.params;
    
    console.log(`[CONTROLADOR CITA] Intentando confirmar cita con token: ${token}`);
    
    try {
        const citaConfirmada = await CitaModel.confirmByToken(token);
        
        if (citaConfirmada) {
            console.log(`[CONTROLADOR CITA] Cita ID ${citaConfirmada.id_cita} confirmada!`);
            
            // RQF02 - Respuesta al cliente (DISEÑO ACTUALIZADO)
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Confirmación Exitosa</title>
                    <style>
                        /* Fondo color crema claro y texto oscuro, usando tu paleta */
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #FFFBF5; color: #333333; }
                        /* Borde superior con tu color primario (amarillo) */
                        .container { max-width: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-top: 5px solid #FFD95A; }
                        h1 { color: #333333; }
                        .date { font-size: 1.1em; font-weight: bold; margin-top: 15px; }
                        /* Botón con tu estilo primario (amarillo, texto oscuro) */
                        .button { display: inline-block; padding: 10px 20px; background-color: #FFD95A; color: #333; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>¡Tu cita ha sido confirmada con éxito!</h1>
                        <p>Hemos ratificado tu reserva en nuestro sistema.</p>
                        <div class="date">Fecha: ${citaConfirmada.fecha_cita} | Hora: ${citaConfirmada.hora_cita}</div>
                        <!-- Nombre de la veterinaria actualizado -->
                        <p>Te esperamos en Veterinaria "El Morralito".</p>
                        <a href="http://localhost:4200/" class="button">Volver a la web principal</a>
                    </div>
                </body>
                </html>
            `);
            
        } else {
            console.log('[CONTROLADOR CITA] Confirmación fallida: Token inválido o cita ya procesada.');
            
            // RQF02 - Respuesta de error (DISEÑO ACTUALIZADO)
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Error de Confirmación</title>
                    <style>
                        /* Fondo color crema claro y texto oscuro */
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #FFFBF5; color: #333333; }
                        /* Borde superior con tu color de peligro (rojo) */
                        .container { max-width: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-top: 5px solid #E74C3C; }
                        /* Texto de error con el color de peligro */
                        h1 { color: #E74C3C; }
                        /* Botón con tu estilo primario (amarillo) */
                        .button { display: inline-block; padding: 10px 20px; background-color: #FFD95A; color: #333; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Error al confirmar la cita</h1>
                        <p>El enlace de confirmación es inválido, ha expirado, o la cita ya fue confirmada o cancelada previamente.</p>
                        <p>Por favor, contacte a la clínica si necesita ayuda.</p>
                        <a href="http://localhost:4200/" class="button">Volver a la web principal</a>
                    </div>
                </body>
                </html>
            `);
        }
        
    } catch (error) {
        console.error('[CONTROLADOR CITA] Error al confirmar cita:', error.message);
        return res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Error del Servidor</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #FFFBF5; color: #333333; }
                    .container { max-width: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-top: 5px solid #E74C3C; }
                    h1 { color: #E74C3C; }
                    .button { display: inline-block; padding: 10px 20px; background-color: #FFD95A; color: #333; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Error del Servidor</h1>
                    <p>Ocurrió un error inesperado al procesar tu solicitud.</p>
                    <p>Por favor, intente más tarde o contacte a la clínica.</p>
                    <a href="http://localhost:4200/" class="button">Volver a la web principal</a>
                </div>
            </body>
            </html>
        `);
    }
};


// ============================================
// GET /api/citas - Obtener todas las citas
// ============================================
const getAllCitas = async (req, res) => {
// ... (código existente sin cambios) ...
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

// ... (updateCita y deleteCita se mantienen iguales) ...

const updateCita = async (req, res) => {
// ... (código existente sin cambios) ...
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
// ... (código existente sin cambios) ...
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
const getCitasByVeterinario = async (req, res) => {
  try {
    // El ID del veterinario vendrá en el token o en los params
    const veterinarioId = req.user?.id || req.params.id;

    console.log(`[CONTROLADOR CITA] Buscando citas del veterinario ID: ${veterinarioId}`);

    const citas = await CitaModel.findByVeterinario(veterinarioId);

    return responseHandler.success(res, citas, 'Citas del veterinario obtenidas correctamente.');
  } catch (error) {
    console.error('[CONTROLADOR CITA] Error al obtener citas por veterinario:', error);
    return responseHandler.error(res, 'Error al obtener las citas del veterinario.', 500);
  }
};

// Exportar todas las funciones
module.exports = {
    createCita,
    getAllCitas,
    updateCita,
    deleteCita,
    confirmarCita, // <-- NUEVA FUNCIÓN EXPORTADA
    getCitasByVeterinario
};

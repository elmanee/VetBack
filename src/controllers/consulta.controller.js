const ConsultaModel = require('../models/consulta.model');
const ExpedienteModel = require('../models/expediente.model');
const CitaModel = require('../models/cita.model');
const responseHandler = require('../utils/responseHandler');

const ConsultaController = {

    // ============================================
    // RQF02 - REGISTRAR CONSULTA COMPLETA
    // POST /api/consultas
    // ============================================
    registrarConsulta: async (req, res) => {
        console.log('[CONTROLADOR CONSULTA] Iniciando registro de consulta médica...');
        console.log('[CONTROLADOR CONSULTA] Datos recibidos:', req.body);

        const {
            cita_id,
            veterinario_id,
            mascota_id,
            // Signos vitales
            peso_actual,
            temperatura,
            frecuencia_cardiaca,
            frecuencia_respiratoria,
            // Datos de la consulta
            motivo_consulta,
            sintomas,
            observaciones,
            // Arrays de datos relacionados
            diagnosticos,
            tratamientos,
            vacunas,
            procedimientos,
            imagenes
        } = req.body;

        // ============================================
        // VALIDACIONES
        // ============================================
        if (!cita_id) {
            return responseHandler.error(res, 'El ID de la cita es obligatorio.', 400);
        }

        if (!veterinario_id) {
            return responseHandler.error(res, 'El ID del veterinario es obligatorio.', 400);
        }

        if (!mascota_id) {
            return responseHandler.error(res, 'El ID de la mascota es obligatorio.', 400);
        }

        if (!motivo_consulta) {
            return responseHandler.error(res, 'El motivo de la consulta es obligatorio.', 400);
        }

        // RQF02 VALIDACIÓN: Al menos un diagnóstico
        if (!diagnosticos || diagnosticos.length === 0) {
            return responseHandler.error(res, 'Debe proporcionar al menos un diagnóstico.', 400);
        }

        try {
            // ============================================
            // PASO 1: Verificar que la cita existe y está confirmada
            // ============================================
            const cita = await CitaModel.findById(cita_id);

            if (!cita) {
                return responseHandler.error(res, 'Cita no encontrada.', 404);
            }

            if (cita.estado !== 'Confirmada') {
                return responseHandler.error(
                    res,
                    `Solo se pueden atender citas confirmadas. Estado actual: ${cita.estado}`,
                    400
                );
            }

            // ============================================
            // PASO 2: Verificar que la cita no tenga ya una consulta
            // ============================================
            const tieneConsulta = await ConsultaModel.existeConsultaParaCita(cita_id);

            if (tieneConsulta) {
                return responseHandler.error(
                    res,
                    'Esta cita ya tiene una consulta registrada.',
                    409
                );
            }

            // ============================================
            // PASO 3: Verificar o crear expediente de la mascota
            // ============================================
            let expediente = await ExpedienteModel.findByMascotaId(mascota_id);

            if (!expediente) {
                console.log('[CONTROLADOR CONSULTA] Creando expediente para la mascota...');
                
                expediente = await ExpedienteModel.create({
                    mascota_id,
                    observaciones_generales: 'Expediente creado automáticamente al registrar primera consulta.'
                });

                // Registrar en historial
                await ExpedienteModel.registrarCambio({
                    expediente_id: expediente.id_expediente,
                    usuario_id: veterinario_id,
                    tipo_cambio: 'Creación',
                    tabla_afectada: 'tExpedientes',
                    descripcion_cambio: `Expediente ${expediente.numero_expediente} creado automáticamente`,
                    datos_nuevos: expediente,
                    ip_address: req.ip
                });
            }

            console.log(`[CONTROLADOR CONSULTA] Usando expediente: ${expediente.numero_expediente}`);

            // ============================================
            // PASO 4: Preparar datos de la consulta
            // ============================================
            const datosConsulta = {
                expediente_id: expediente.id_expediente,
                cita_id,
                veterinario_id,
                fecha_consulta: new Date().toISOString().split('T')[0],
                peso_actual,
                temperatura,
                frecuencia_cardiaca,
                frecuencia_respiratoria,
                motivo_consulta,
                sintomas,
                observaciones,
                diagnosticos,
                tratamientos: tratamientos || [],
                vacunas: vacunas || [],
                procedimientos: procedimientos || [],
                imagenes: imagenes || []
            };

            // ============================================
            // PASO 5: Registrar consulta completa (con transacción)
            // ============================================
            const consultaCreada = await ConsultaModel.create(datosConsulta);

            console.log(`[CONTROLADOR CONSULTA] Consulta registrada con ID: ${consultaCreada.id_consulta}`);

            // ============================================
            // PASO 6: Registrar en historial de cambios
            // ============================================
            await ExpedienteModel.registrarCambio({
                expediente_id: expediente.id_expediente,
                consulta_id: consultaCreada.id_consulta,
                usuario_id: veterinario_id,
                tipo_cambio: 'Creación',
                tabla_afectada: 'tConsultas',
                descripcion_cambio: `Nueva consulta registrada. Diagnósticos: ${diagnosticos.length}, Tratamientos: ${tratamientos?.length || 0}`,
                datos_nuevos: {
                    id_consulta: consultaCreada.id_consulta,
                    fecha_consulta: consultaCreada.fecha_consulta,
                    motivo: motivo_consulta
                },
                ip_address: req.ip
            });

            // ============================================
            // PASO 7: Obtener consulta completa para respuesta
            // ============================================
            const consultaCompleta = await ConsultaModel.findById(consultaCreada.id_consulta);

            return responseHandler.success(
                res,
                {
                    consulta: consultaCompleta,
                    expediente: {
                        numero_expediente: expediente.numero_expediente,
                        id_expediente: expediente.id_expediente
                    }
                },
                'Consulta médica registrada exitosamente. La cita ha sido marcada como completada.',
                201
            );

        } catch (error) {
            console.error('[CONTROLADOR CONSULTA] Error al registrar consulta:', error.message);
            return responseHandler.error(
                res,
                `Error al registrar consulta: ${error.message}`,
                500
            );
        }
    },

    // ============================================
    // RQF02 - OBTENER CONSULTA POR ID
    // GET /api/consultas/:id
    // ============================================
    getConsultaById: async (req, res) => {
        const { id } = req.params;

        console.log(`[CONTROLADOR CONSULTA] Buscando consulta ID: ${id}`);

        try {
            const consulta = await ConsultaModel.findById(id);

            if (!consulta) {
                return responseHandler.error(res, 'Consulta no encontrada.', 404);
            }

            return responseHandler.success(
                res,
                consulta,
                'Consulta encontrada.'
            );

        } catch (error) {
            console.error('[CONTROLADOR CONSULTA] Error al buscar consulta:', error.message);
            return responseHandler.error(
                res,
                `Error al buscar consulta: ${error.message}`,
                500
            );
        }
    },

    // ============================================
    // RQF02 - OBTENER CONSULTAS DE UN EXPEDIENTE
    // GET /api/consultas/expediente/:expediente_id
    // ============================================
    getConsultasByExpediente: async (req, res) => {
        const { expediente_id } = req.params;

        console.log(`[CONTROLADOR CONSULTA] Obteniendo consultas del expediente ID: ${expediente_id}`);

        try {
            // Verificar que el expediente existe
            const expediente = await ExpedienteModel.findById(expediente_id);

            if (!expediente) {
                return responseHandler.error(res, 'Expediente no encontrado.', 404);
            }

            const consultas = await ConsultaModel.findByExpedienteId(expediente_id);

            console.log(`[CONTROLADOR CONSULTA] Se encontraron ${consultas.length} consultas`);

            return responseHandler.success(
                res,
                {
                    expediente: {
                        numero_expediente: expediente.numero_expediente,
                        mascota_nombre: expediente.mascota_nombre,
                        propietario: expediente.propietario
                    },
                    consultas: consultas,
                    total: consultas.length
                },
                `Se encontraron ${consultas.length} consulta(s).`
            );

        } catch (error) {
            console.error('[CONTROLADOR CONSULTA] Error al obtener consultas:', error.message);
            return responseHandler.error(
                res,
                `Error al obtener consultas: ${error.message}`,
                500
            );
        }
    },

    // ============================================
    // RQF02 - ACTUALIZAR OBSERVACIONES DE CONSULTA
    // PUT /api/consultas/:id
    // ============================================
    updateConsulta: async (req, res) => {
        const { id } = req.params;
        const { observaciones, usuario_id } = req.body;

        console.log(`[CONTROLADOR CONSULTA] Actualizando observaciones de consulta ID: ${id}`);

        if (!observaciones) {
            return responseHandler.error(res, 'Las observaciones son obligatorias.', 400);
        }

        try {
            // Obtener datos anteriores
            const consultaAnterior = await ConsultaModel.findById(id);

            if (!consultaAnterior) {
                return responseHandler.error(res, 'Consulta no encontrada.', 404);
            }

            // Actualizar consulta
            const consultaActualizada = await ConsultaModel.update(id, { observaciones });

            // Registrar cambio en historial
            await ExpedienteModel.registrarCambio({
                expediente_id: consultaAnterior.expediente_id,
                consulta_id: id,
                usuario_id: usuario_id || 1,
                tipo_cambio: 'Modificación',
                tabla_afectada: 'tConsultas',
                descripcion_cambio: 'Observaciones actualizadas',
                datos_anteriores: {
                    observaciones: consultaAnterior.observaciones
                },
                datos_nuevos: {
                    observaciones: consultaActualizada.observaciones
                },
                ip_address: req.ip
            });

            console.log('[CONTROLADOR CONSULTA] Observaciones actualizadas exitosamente');

            return responseHandler.success(
                res,
                consultaActualizada,
                'Observaciones actualizadas exitosamente.'
            );

        } catch (error) {
            console.error('[CONTROLADOR CONSULTA] Error al actualizar consulta:', error.message);
            return responseHandler.error(
                res,
                `Error al actualizar consulta: ${error.message}`,
                500
            );
        }
    },

    // ============================================
    // RQF02 - VERIFICAR SI UNA CITA PUEDE SER ATENDIDA
    // GET /api/consultas/verificar-cita/:cita_id
    // ============================================
    verificarCita: async (req, res) => {
        const { cita_id } = req.params;

        console.log(`[CONTROLADOR CONSULTA] Verificando si cita ${cita_id} puede ser atendida...`);

        try {
            // Verificar que la cita existe
            const cita = await CitaModel.findById(cita_id);

            if (!cita) {
                return responseHandler.error(res, 'Cita no encontrada.', 404);
            }

            // Verificar si ya tiene consulta
            const tieneConsulta = await ConsultaModel.existeConsultaParaCita(cita_id);

            const respuesta = {
                puede_atender: !tieneConsulta && cita.estado === 'Confirmada',
                cita: cita,
                tiene_consulta: tieneConsulta,
                mensaje: tieneConsulta 
                    ? 'Esta cita ya fue atendida.' 
                    : cita.estado !== 'Confirmada'
                    ? `La cita debe estar confirmada para ser atendida. Estado actual: ${cita.estado}`
                    : 'La cita puede ser atendida.'
            };

            return responseHandler.success(res, respuesta, respuesta.mensaje);

        } catch (error) {
            console.error('[CONTROLADOR CONSULTA] Error al verificar cita:', error.message);
            return responseHandler.error(
                res,
                `Error al verificar cita: ${error.message}`,
                500
            );
        }
    }
};

module.exports = ConsultaController;
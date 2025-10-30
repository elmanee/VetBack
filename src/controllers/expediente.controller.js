const ExpedienteModel = require('../models/expediente.model');
const responseHandler = require('../utils/responseHandler');

const ExpedienteController = {

    // ============================================
    // RQF02 - CREAR EXPEDIENTE
    // POST /api/expedientes
    // ============================================
    createExpediente: async (req, res) => {
        console.log('[CONTROLADOR EXPEDIENTE] Iniciando creación de expediente...');
        console.log('[CONTROLADOR EXPEDIENTE] Datos recibidos:', req.body);

        const { mascota_id, observaciones_generales } = req.body;

        // Validación de datos
        if (!mascota_id) {
            return responseHandler.error(res, 'El ID de la mascota es obligatorio.', 400);
        }

        try {
            // Verificar si ya existe expediente para esta mascota
            const expedienteExistente = await ExpedienteModel.findByMascotaId(mascota_id);

            if (expedienteExistente) {
                console.log('[CONTROLADOR EXPEDIENTE] La mascota ya tiene expediente');
                return responseHandler.success(
                    res,
                    expedienteExistente,
                    'La mascota ya tiene un expediente registrado.',
                    200
                );
            }

            // Crear nuevo expediente
            const nuevoExpediente = await ExpedienteModel.create({
                mascota_id,
                observaciones_generales
            });

            console.log(`[CONTROLADOR EXPEDIENTE] Expediente creado: ${nuevoExpediente.numero_expediente}`);

            // Registrar en historial
            await ExpedienteModel.registrarCambio({
                expediente_id: nuevoExpediente.id_expediente,
                usuario_id: req.body.usuario_id || 1, // TODO: Obtener del token de sesión
                tipo_cambio: 'Creación',
                tabla_afectada: 'tExpedientes',
                descripcion_cambio: `Expediente ${nuevoExpediente.numero_expediente} creado`,
                datos_nuevos: nuevoExpediente,
                ip_address: req.ip
            });

            return responseHandler.success(
                res,
                nuevoExpediente,
                'Expediente creado exitosamente.',
                201
            );

        } catch (error) {
            console.error('[CONTROLADOR EXPEDIENTE] Error al crear expediente:', error.message);
            return responseHandler.error(
                res,
                `Error al crear expediente: ${error.message}`,
                500
            );
        }
    },

    // ============================================
    // RQF02 - OBTENER EXPEDIENTE POR MASCOTA
    // GET /api/expedientes/mascota/:mascota_id
    // ============================================
    getExpedienteByMascota: async (req, res) => {
        const { mascota_id } = req.params;

        console.log(`[CONTROLADOR EXPEDIENTE] Buscando expediente de mascota ID: ${mascota_id}`);

        try {
            const expediente = await ExpedienteModel.findByMascotaId(mascota_id);

            if (!expediente) {
                return responseHandler.error(
                    res,
                    'No se encontró expediente para esta mascota.',
                    404
                );
            }

            return responseHandler.success(
                res,
                expediente,
                'Expediente encontrado.'
            );

        } catch (error) {
            console.error('[CONTROLADOR EXPEDIENTE] Error al buscar expediente:', error.message);
            return responseHandler.error(
                res,
                `Error al buscar expediente: ${error.message}`,
                500
            );
        }
    },

    // ============================================
    // RQF02 - OBTENER EXPEDIENTE POR NÚMERO
    // GET /api/expedientes/numero/:numero_expediente
    // ============================================
    getExpedienteByNumero: async (req, res) => {
        const { numero_expediente } = req.params;

        console.log(`[CONTROLADOR EXPEDIENTE] Buscando expediente: ${numero_expediente}`);

        try {
            const expediente = await ExpedienteModel.findByNumero(numero_expediente);

            if (!expediente) {
                return responseHandler.error(
                    res,
                    'Expediente no encontrado.',
                    404
                );
            }

            return responseHandler.success(
                res,
                expediente,
                'Expediente encontrado.'
            );

        } catch (error) {
            console.error('[CONTROLADOR EXPEDIENTE] Error al buscar expediente:', error.message);
            return responseHandler.error(
                res,
                `Error al buscar expediente: ${error.message}`,
                500
            );
        }
    },

    // ============================================
    // RQF02 - OBTENER EXPEDIENTE POR ID
    // GET /api/expedientes/:id
    // ============================================
    getExpedienteById: async (req, res) => {
        const { id } = req.params;

        console.log(`[CONTROLADOR EXPEDIENTE] Buscando expediente ID: ${id}`);

        try {
            const expediente = await ExpedienteModel.findById(id);

            if (!expediente) {
                return responseHandler.error(
                    res,
                    'Expediente no encontrado.',
                    404
                );
            }

            return responseHandler.success(
                res,
                expediente,
                'Expediente encontrado.'
            );

        } catch (error) {
            console.error('[CONTROLADOR EXPEDIENTE] Error al buscar expediente:', error.message);
            return responseHandler.error(
                res,
                `Error al buscar expediente: ${error.message}`,
                500
            );
        }
    },

    // ============================================
    // RQF02 - BÚSQUEDA AVANZADA CON FILTROS
    // GET /api/expedientes/search?nombre_mascota=&propietario=&numero_expediente=...
    // ============================================
    searchExpedientes: async (req, res) => {
        console.log('[CONTROLADOR EXPEDIENTE] Iniciando búsqueda con filtros...');
        console.log('[CONTROLADOR EXPEDIENTE] Query params:', req.query);

        const filtros = {
            nombre_mascota: req.query.nombre_mascota || null,
            propietario: req.query.propietario || null,
            numero_expediente: req.query.numero_expediente || null,
            fecha_desde: req.query.fecha_desde || null,
            fecha_hasta: req.query.fecha_hasta || null,
            diagnostico: req.query.diagnostico || null,
            estado: req.query.estado || null
        };

        // Validar que al menos un filtro esté presente
        const filtrosActivos = Object.values(filtros).filter(v => v !== null);
        
        if (filtrosActivos.length === 0) {
            return responseHandler.error(
                res,
                'Debe proporcionar al menos un criterio de búsqueda.',
                400
            );
        }

        try {
            const expedientes = await ExpedienteModel.search(filtros);

            console.log(`[CONTROLADOR EXPEDIENTE] Se encontraron ${expedientes.length} expedientes`);

            return responseHandler.success(
                res,
                expedientes,
                `Se encontraron ${expedientes.length} expediente(s).`
            );

        } catch (error) {
            console.error('[CONTROLADOR EXPEDIENTE] Error en búsqueda:', error.message);
            return responseHandler.error(
                res,
                `Error al buscar expedientes: ${error.message}`,
                500
            );
        }
    },

    // ============================================
    // RQF02 - OBTENER HISTORIAL COMPLETO
    // GET /api/expedientes/:id/historial
    // ============================================
    getHistorialCompleto: async (req, res) => {
        const { id } = req.params;

        console.log(`[CONTROLADOR EXPEDIENTE] Obteniendo historial del expediente ID: ${id}`);

        try {
            // Verificar que el expediente exista
            const expediente = await ExpedienteModel.findById(id);

            if (!expediente) {
                return responseHandler.error(
                    res,
                    'Expediente no encontrado.',
                    404
                );
            }

            // Obtener historial completo
            const historial = await ExpedienteModel.getHistorialCompleto(id);

            const respuesta = {
                expediente: expediente,
                consultas: historial,
                total_consultas: historial.length
            };

            console.log(`[CONTROLADOR EXPEDIENTE] Historial obtenido: ${historial.length} consultas`);

            return responseHandler.success(
                res,
                respuesta,
                'Historial médico obtenido exitosamente.'
            );

        } catch (error) {
            console.error('[CONTROLADOR EXPEDIENTE] Error al obtener historial:', error.message);
            return responseHandler.error(
                res,
                `Error al obtener historial: ${error.message}`,
                500
            );
        }
    },

    // ============================================
    // RQF02 - ACTUALIZAR EXPEDIENTE
    // PUT /api/expedientes/:id
    // ============================================
    updateExpediente: async (req, res) => {
        const { id } = req.params;
        const { observaciones_generales, estado } = req.body;

        console.log(`[CONTROLADOR EXPEDIENTE] Actualizando expediente ID: ${id}`);

        try {
            // Obtener datos anteriores para el historial
            const expedienteAnterior = await ExpedienteModel.findById(id);

            if (!expedienteAnterior) {
                return responseHandler.error(
                    res,
                    'Expediente no encontrado.',
                    404
                );
            }

            // Actualizar expediente
            const expedienteActualizado = await ExpedienteModel.update(id, {
                observaciones_generales,
                estado
            });

            // Registrar cambio en historial
            await ExpedienteModel.registrarCambio({
                expediente_id: id,
                usuario_id: req.body.usuario_id || 1, // TODO: Obtener del token
                tipo_cambio: 'Modificación',
                tabla_afectada: 'tExpedientes',
                descripcion_cambio: 'Expediente actualizado',
                datos_anteriores: {
                    observaciones_generales: expedienteAnterior.observaciones_generales,
                    estado: expedienteAnterior.estado
                },
                datos_nuevos: {
                    observaciones_generales: expedienteActualizado.observaciones_generales,
                    estado: expedienteActualizado.estado
                },
                ip_address: req.ip
            });

            console.log('[CONTROLADOR EXPEDIENTE] Expediente actualizado exitosamente');

            return responseHandler.success(
                res,
                expedienteActualizado,
                'Expediente actualizado exitosamente.'
            );

        } catch (error) {
            console.error('[CONTROLADOR EXPEDIENTE] Error al actualizar expediente:', error.message);
            return responseHandler.error(
                res,
                `Error al actualizar expediente: ${error.message}`,
                500
            );
        }
    },

    // ============================================
    // RQF02 - OBTENER TODOS LOS EXPEDIENTES
    // GET /api/expedientes
    // ============================================
    getAllExpedientes: async (req, res) => {
        console.log('[CONTROLADOR EXPEDIENTE] Obteniendo todos los expedientes...');

        try {
            const expedientes = await ExpedienteModel.findAll();

            console.log(`[CONTROLADOR EXPEDIENTE] Se encontraron ${expedientes.length} expedientes`);

            return responseHandler.success(
                res,
                expedientes,
                `Se encontraron ${expedientes.length} expediente(s).`
            );

        } catch (error) {
            console.error('[CONTROLADOR EXPEDIENTE] Error al obtener expedientes:', error.message);
            return responseHandler.error(
                res,
                `Error al obtener expedientes: ${error.message}`,
                500
            );
        }
    }
};

module.exports = ExpedienteController;
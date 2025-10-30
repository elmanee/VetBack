const { pool } = require('../db/config');

const ExpedienteModel = {
    
    // ============================================
    // RQF02 - CREAR EXPEDIENTE
    // Se crea automáticamente al atender la primera cita de una mascota
    // ============================================
    create: async ({ mascota_id, observaciones_generales = null }) => {
        console.log(`[MODELO EXPEDIENTE] Creando expediente para mascota ID: ${mascota_id}`);
        
        const query = `
            INSERT INTO tExpedientes (mascota_id, observaciones_generales)
            VALUES ($1, $2)
            RETURNING *;
        `;
        
        try {
            const result = await pool.query(query, [mascota_id, observaciones_generales]);
            console.log(`[MODELO EXPEDIENTE] Expediente creado: ${result.rows[0].numero_expediente}`);
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO EXPEDIENTE] Error al crear expediente:', error.message);
            
            // RQF02 VALIDACIÓN: Si ya existe expediente para esta mascota
            if (error.code === '23505') {
                throw new Error('Esta mascota ya tiene un expediente registrado.');
            }
            throw error;
        }
    },

    // ============================================
    // RQF02 - BUSCAR EXPEDIENTE POR MASCOTA
    // ============================================
    findByMascotaId: async (mascota_id) => {
        console.log(`[MODELO EXPEDIENTE] Buscando expediente de mascota ID: ${mascota_id}`);
        
        const query = `
            SELECT * FROM tExpedientes 
            WHERE mascota_id = $1;
        `;
        
        try {
            const result = await pool.query(query, [mascota_id]);
            
            if (result.rows.length === 0) {
                console.log('[MODELO EXPEDIENTE] No se encontró expediente para esta mascota');
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO EXPEDIENTE] Error al buscar expediente:', error.message);
            throw error;
        }
    },

    // ============================================
    // RQF02 - BUSCAR EXPEDIENTE POR NÚMERO
    // ============================================
    findByNumero: async (numero_expediente) => {
        console.log(`[MODELO EXPEDIENTE] Buscando expediente: ${numero_expediente}`);
        
        const query = `
            SELECT 
                e.*,
                p.nombre AS mascota_nombre,
                p.raza,
                p.edad,
                p.peso,
                a.nombre AS tipo_animal,
                c.id AS cliente_id,
                c.nombre_completo AS propietario,
                c.correo AS propietario_correo,
                c.telefono AS propietario_telefono
            FROM tExpedientes e
            JOIN tPacientes p ON e.mascota_id = p.id
            JOIN tClientes c ON p.cliente_id = c.id
            JOIN tAnimales a ON p.animal_id = a.id_tipoanimal
            WHERE e.numero_expediente = $1;
        `;
        
        try {
            const result = await pool.query(query, [numero_expediente]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO EXPEDIENTE] Error al buscar por número:', error.message);
            throw error;
        }
    },

    // ============================================
    // RQF02 - BUSCAR EXPEDIENTE POR ID
    // ============================================
    findById: async (id_expediente) => {
        console.log(`[MODELO EXPEDIENTE] Buscando expediente ID: ${id_expediente}`);
        
        const query = `
            SELECT 
                e.*,
                p.id AS mascota_id,
                p.nombre AS mascota_nombre,
                p.raza,
                p.edad,
                p.peso,
                a.nombre AS tipo_animal,
                c.id AS cliente_id,
                c.nombre_completo AS propietario,
                c.correo AS propietario_correo,
                c.telefono AS propietario_telefono
            FROM tExpedientes e
            JOIN tPacientes p ON e.mascota_id = p.id
            JOIN tClientes c ON p.cliente_id = c.id
            JOIN tAnimales a ON p.animal_id = a.id_tipoanimal
            WHERE e.id_expediente = $1;
        `;
        
        try {
            const result = await pool.query(query, [id_expediente]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO EXPEDIENTE] Error al buscar por ID:', error.message);
            throw error;
        }
    },

    // ============================================
    // RQF02 - BÚSQUEDA AVANZADA CON MÚLTIPLES FILTROS
    // Búsqueda por: nombre mascota, propietario, número expediente, fecha
    // ============================================
    search: async (filtros) => {
        console.log('[MODELO EXPEDIENTE] Realizando búsqueda con filtros:', filtros);
        
        let query = `
            SELECT DISTINCT
                e.id_expediente,
                e.numero_expediente,
                e.fecha_apertura,
                e.estado,
                p.id AS mascota_id,
                p.nombre AS mascota_nombre,
                a.nombre AS tipo_animal,
                p.raza,
                p.edad,
                c.id AS cliente_id,
                c.nombre_completo AS propietario,
                c.correo AS propietario_correo,
                c.telefono AS propietario_telefono,
                (SELECT COUNT(*) FROM tConsultas WHERE expediente_id = e.id_expediente) AS total_consultas,
                (SELECT MAX(fecha_consulta) FROM tConsultas WHERE expediente_id = e.id_expediente) AS ultima_consulta
            FROM tExpedientes e
            JOIN tPacientes p ON e.mascota_id = p.id
            JOIN tClientes c ON p.cliente_id = c.id
            JOIN tAnimales a ON p.animal_id = a.id_tipoanimal
            LEFT JOIN tConsultas con ON e.id_expediente = con.expediente_id
            LEFT JOIN tDiagnosticos d ON con.id_consulta = d.consulta_id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        // Filtro 1: Por nombre de mascota
        if (filtros.nombre_mascota) {
            query += ` AND LOWER(p.nombre) LIKE LOWER($${paramIndex})`;
            params.push(`%${filtros.nombre_mascota}%`);
            paramIndex++;
        }
        
        // Filtro 2: Por propietario (nombre o correo)
        if (filtros.propietario) {
            query += ` AND (LOWER(c.nombre_completo) LIKE LOWER($${paramIndex}) OR LOWER(c.correo) LIKE LOWER($${paramIndex}))`;
            params.push(`%${filtros.propietario}%`);
            paramIndex++;
        }
        
        // Filtro 3: Por número de expediente
        if (filtros.numero_expediente) {
            query += ` AND e.numero_expediente LIKE $${paramIndex}`;
            params.push(`%${filtros.numero_expediente}%`);
            paramIndex++;
        }
        
        // Filtro 4: Por fecha de apertura (desde)
        if (filtros.fecha_desde) {
            query += ` AND e.fecha_apertura >= $${paramIndex}`;
            params.push(filtros.fecha_desde);
            paramIndex++;
        }
        
        // Filtro 5: Por fecha de apertura (hasta)
        if (filtros.fecha_hasta) {
            query += ` AND e.fecha_apertura <= $${paramIndex}`;
            params.push(filtros.fecha_hasta);
            paramIndex++;
        }
        
        // Filtro 6: Por diagnóstico (BONUS)
        if (filtros.diagnostico) {
            query += ` AND LOWER(d.descripcion) LIKE LOWER($${paramIndex})`;
            params.push(`%${filtros.diagnostico}%`);
            paramIndex++;
        }
        
        // Filtro 7: Por estado del expediente
        if (filtros.estado) {
            query += ` AND e.estado = $${paramIndex}`;
            params.push(filtros.estado);
            paramIndex++;
        }
        
        query += ` ORDER BY e.fecha_apertura DESC;`;
        
        try {
            const result = await pool.query(query, params);
            console.log(`[MODELO EXPEDIENTE] Se encontraron ${result.rows.length} expedientes`);
            return result.rows;
        } catch (error) {
            console.error('[MODELO EXPEDIENTE] Error en búsqueda:', error.message);
            throw error;
        }
    },

    // ============================================
    // RQF02 - OBTENER HISTORIAL COMPLETO DE UN EXPEDIENTE
    // Incluye todas las consultas con sus detalles
    // ============================================
    getHistorialCompleto: async (id_expediente) => {
        console.log(`[MODELO EXPEDIENTE] Obteniendo historial completo del expediente ID: ${id_expediente}`);
        
        const query = `
            SELECT 
                c.id_consulta,
                c.fecha_consulta,
                c.peso_actual,
                c.temperatura,
                c.frecuencia_cardiaca,
                c.frecuencia_respiratoria,
                c.motivo_consulta,
                c.sintomas,
                c.observaciones,
                u.nombre_completo AS veterinario,
                ci.hora_cita,
                ci.estado AS estado_cita,
                
                -- Diagnósticos (agregados como JSON)
                (
                    SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', d.id_diagnostico,
                            'descripcion', d.descripcion,
                            'tipo', d.tipo
                        )
                    )
                    FROM tDiagnosticos d
                    WHERE d.consulta_id = c.id_consulta
                ) AS diagnosticos,
                
                -- Tratamientos (agregados como JSON)
                (
                    SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', t.id_tratamiento,
                            'medicamento', t.medicamento,
                            'dosis', t.dosis,
                            'frecuencia', t.frecuencia,
                            'duracion_dias', t.duracion_dias,
                            'via_administracion', t.via_administracion,
                            'indicaciones', t.indicaciones
                        )
                    )
                    FROM tTratamientos t
                    WHERE t.consulta_id = c.id_consulta
                ) AS tratamientos,
                
                -- Vacunas (agregadas como JSON)
                (
                    SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', v.id_vacuna,
                            'nombre_vacuna', v.nombre_vacuna,
                            'fecha_aplicacion', v.fecha_aplicacion,
                            'proxima_dosis', v.proxima_dosis,
                            'lote', v.lote
                        )
                    )
                    FROM tVacunas v
                    WHERE v.consulta_id = c.id_consulta
                ) AS vacunas,
                
                -- Procedimientos (agregados como JSON)
                (
                    SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', pr.id_procedimiento,
                            'tipo', pr.tipo_procedimiento,
                            'nombre', pr.nombre_procedimiento,
                            'descripcion', pr.descripcion,
                            'fecha_realizacion', pr.fecha_realizacion
                        )
                    )
                    FROM tProcedimientos pr
                    WHERE pr.consulta_id = c.id_consulta
                ) AS procedimientos,
                
                -- Imágenes (agregadas como JSON)
                (
                    SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', i.id_imagen,
                            'url', i.url_imagen,
                            'descripcion', i.descripcion,
                            'tipo', i.tipo_imagen,
                            'fecha_subida', i.fecha_subida
                        )
                    )
                    FROM tImagenesExpediente i
                    WHERE i.consulta_id = c.id_consulta
                ) AS imagenes
                
            FROM tConsultas c
            JOIN tUsuarios u ON c.veterinario_id = u.id
            JOIN tCitas ci ON c.cita_id = ci.id_cita
            WHERE c.expediente_id = $1
            ORDER BY c.fecha_consulta DESC, ci.hora_cita DESC;
        `;
        
        try {
            const result = await pool.query(query, [id_expediente]);
            console.log(`[MODELO EXPEDIENTE] Se encontraron ${result.rows.length} consultas en el historial`);
            return result.rows;
        } catch (error) {
            console.error('[MODELO EXPEDIENTE] Error al obtener historial:', error.message);
            throw error;
        }
    },

    // ============================================
    // RQF02 - ACTUALIZAR EXPEDIENTE
    // ============================================
    update: async (id_expediente, datos) => {
        console.log(`[MODELO EXPEDIENTE] Actualizando expediente ID: ${id_expediente}`);
        
        const query = `
            UPDATE tExpedientes
            SET observaciones_generales = $1,
                estado = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id_expediente = $3
            RETURNING *;
        `;
        
        try {
            const result = await pool.query(query, [
                datos.observaciones_generales,
                datos.estado || 'Activo',
                id_expediente
            ]);
            
            if (result.rows.length === 0) {
                throw new Error('Expediente no encontrado');
            }
            
            console.log('[MODELO EXPEDIENTE] Expediente actualizado exitosamente');
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO EXPEDIENTE] Error al actualizar expediente:', error.message);
            throw error;
        }
    },

    // ============================================
    // RQF02 - OBTENER TODOS LOS EXPEDIENTES
    // ============================================
    findAll: async () => {
        console.log('[MODELO EXPEDIENTE] Obteniendo todos los expedientes');
        
        const query = `
            SELECT 
                e.*,
                p.nombre AS mascota_nombre,
                a.nombre AS tipo_animal,
                c.nombre_completo AS propietario,
                (SELECT COUNT(*) FROM tConsultas WHERE expediente_id = e.id_expediente) AS total_consultas
            FROM tExpedientes e
            JOIN tPacientes p ON e.mascota_id = p.id
            JOIN tClientes c ON p.cliente_id = c.id
            JOIN tAnimales a ON p.animal_id = a.id_tipoanimal
            ORDER BY e.fecha_apertura DESC;
        `;
        
        try {
            const result = await pool.query(query);
            console.log(`[MODELO EXPEDIENTE] Se encontraron ${result.rows.length} expedientes`);
            return result.rows;
        } catch (error) {
            console.error('[MODELO EXPEDIENTE] Error al obtener expedientes:', error.message);
            throw error;
        }
    },

    // ============================================
    // RQF02 - REGISTRAR CAMBIO EN HISTORIAL
    // ============================================
    registrarCambio: async (cambio) => {
        console.log('[MODELO EXPEDIENTE] Registrando cambio en historial');
        
        const query = `
            INSERT INTO tHistorialCambios (
                expediente_id, 
                consulta_id, 
                usuario_id, 
                tipo_cambio, 
                tabla_afectada,
                descripcion_cambio, 
                datos_anteriores, 
                datos_nuevos,
                ip_address
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        
        try {
            const result = await pool.query(query, [
                cambio.expediente_id,
                cambio.consulta_id || null,
                cambio.usuario_id,
                cambio.tipo_cambio,
                cambio.tabla_afectada || null,
                cambio.descripcion_cambio,
                cambio.datos_anteriores ? JSON.stringify(cambio.datos_anteriores) : null,
                cambio.datos_nuevos ? JSON.stringify(cambio.datos_nuevos) : null,
                cambio.ip_address || null
            ]);
            
            console.log('[MODELO EXPEDIENTE] Cambio registrado en historial');
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO EXPEDIENTE] Error al registrar cambio:', error.message);
            throw error;
        }
    }
};

module.exports = ExpedienteModel;
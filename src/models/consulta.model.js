const { pool } = require('../db/config');

const ConsultaModel = {
    create: async (datosConsulta) => {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            console.log('[MODELO CONSULTA] Iniciando creación de consulta completa...');
            
            // ============================================
            // PASO 1: Crear la consulta principal
            // ============================================
            const queryConsulta = `
                INSERT INTO tConsultas (
                    expediente_id,
                    cita_id,
                    veterinario_id,
                    fecha_consulta,
                    peso_actual,
                    temperatura,
                    frecuencia_cardiaca,
                    frecuencia_respiratoria,
                    motivo_consulta,
                    sintomas,
                    observaciones
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *;
            `;
            
            const resultConsulta = await client.query(queryConsulta, [
                datosConsulta.expediente_id,
                datosConsulta.cita_id,
                datosConsulta.veterinario_id,
                datosConsulta.fecha_consulta || new Date().toISOString().split('T')[0],
                datosConsulta.peso_actual || null,
                datosConsulta.temperatura || null,
                datosConsulta.frecuencia_cardiaca || null,
                datosConsulta.frecuencia_respiratoria || null,
                datosConsulta.motivo_consulta,
                datosConsulta.sintomas || null,
                datosConsulta.observaciones || null
            ]);
            
            const consulta = resultConsulta.rows[0];
            const id_consulta = consulta.id_consulta;
            
            console.log(`[MODELO CONSULTA] Consulta creada con ID: ${id_consulta}`);
            
            // ============================================
            // PASO 2: Guardar diagnósticos
            // ============================================
            if (datosConsulta.diagnosticos && datosConsulta.diagnosticos.length > 0) {
                console.log(`[MODELO CONSULTA] Guardando ${datosConsulta.diagnosticos.length} diagnósticos...`);
                
                for (const diag of datosConsulta.diagnosticos) {
                    await client.query(
                        `INSERT INTO tDiagnosticos (consulta_id, descripcion, tipo, codigo_cie)
                         VALUES ($1, $2, $3, $4)`,
                        [id_consulta, diag.descripcion, diag.tipo || 'Primario', diag.codigo_cie || null]
                    );
                }
            }
            
            // ============================================
            // PASO 3: Guardar tratamientos
            // ============================================
            if (datosConsulta.tratamientos && datosConsulta.tratamientos.length > 0) {
                console.log(`[MODELO CONSULTA] Guardando ${datosConsulta.tratamientos.length} tratamientos...`);
                
                for (const trat of datosConsulta.tratamientos) {
                    await client.query(
                        `INSERT INTO tTratamientos (
                            consulta_id, medicamento, principio_activo, dosis, frecuencia,
                            duracion_dias, via_administracion, indicaciones, fecha_inicio, fecha_fin
                         )
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            id_consulta,
                            trat.medicamento,
                            trat.principio_activo || null,
                            trat.dosis,
                            trat.frecuencia,
                            trat.duracion_dias || null,
                            trat.via_administracion || null,
                            trat.indicaciones || null,
                            trat.fecha_inicio || new Date().toISOString().split('T')[0],
                            trat.fecha_fin || null
                        ]
                    );
                }
            }
            
            // ============================================
            // PASO 4: Guardar vacunas
            // ============================================
            if (datosConsulta.vacunas && datosConsulta.vacunas.length > 0) {
                console.log(`[MODELO CONSULTA] Guardando ${datosConsulta.vacunas.length} vacunas...`);
                
                for (const vac of datosConsulta.vacunas) {
                    await client.query(
                        `INSERT INTO tVacunas (
                            consulta_id, nombre_vacuna, laboratorio, lote, fecha_aplicacion,
                            proxima_dosis, veterinario_aplica, via_administracion, sitio_aplicacion, reacciones_adversas
                         )
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            id_consulta,
                            vac.nombre_vacuna,
                            vac.laboratorio || null,
                            vac.lote || null,
                            vac.fecha_aplicacion || new Date().toISOString().split('T')[0],
                            vac.proxima_dosis || null,
                            vac.veterinario_aplica || datosConsulta.veterinario_id,
                            vac.via_administracion || null,
                            vac.sitio_aplicacion || null,
                            vac.reacciones_adversas || null
                        ]
                    );
                }
            }
            
            // ============================================
            // PASO 5: Guardar procedimientos
            // ============================================
            if (datosConsulta.procedimientos && datosConsulta.procedimientos.length > 0) {
                console.log(`[MODELO CONSULTA] Guardando ${datosConsulta.procedimientos.length} procedimientos...`);
                
                for (const proc of datosConsulta.procedimientos) {
                    await client.query(
                        `INSERT INTO tProcedimientos (
                            consulta_id, tipo_procedimiento, nombre_procedimiento, descripcion,
                            fecha_realizacion, hora_inicio, duracion_minutos, anestesia_utilizada,
                            complicaciones, resultado, observaciones
                         )
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                        [
                            id_consulta,
                            proc.tipo_procedimiento,
                            proc.nombre_procedimiento,
                            proc.descripcion,
                            proc.fecha_realizacion || new Date().toISOString().split('T')[0],
                            proc.hora_inicio || null,
                            proc.duracion_minutos || null,
                            proc.anestesia_utilizada || null,
                            proc.complicaciones || null,
                            proc.resultado || 'Exitoso',
                            proc.observaciones || null
                        ]
                    );
                }
            }
            
            // ============================================
            // PASO 6: Guardar imágenes
            // ============================================
            if (datosConsulta.imagenes && datosConsulta.imagenes.length > 0) {
                console.log(`[MODELO CONSULTA] Guardando ${datosConsulta.imagenes.length} imágenes...`);
                
                for (const img of datosConsulta.imagenes) {
                    await client.query(
                        `INSERT INTO tImagenesExpediente (
                            consulta_id, url_imagen, descripcion, tipo_imagen, subido_por
                         )
                         VALUES ($1, $2, $3, $4, $5)`,
                        [
                            id_consulta,
                            img.url_imagen,
                            img.descripcion || null,
                            img.tipo_imagen || 'Fotografía',
                            img.subido_por || datosConsulta.veterinario_id
                        ]
                    );
                }
            }
            
            // ============================================
            // PASO 7: Actualizar estado de la cita a 'Completada'
            // ============================================
            await client.query(
                `UPDATE tCitas SET estado = 'Completada' WHERE id_cita = $1`,
                [datosConsulta.cita_id]
            );
            
            console.log(`[MODELO CONSULTA] Cita ID ${datosConsulta.cita_id} marcada como Completada`);
            
            await client.query('COMMIT');
            console.log('[MODELO CONSULTA] Consulta completa guardada exitosamente');
            
            return consulta;
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('[MODELO CONSULTA] Error al crear consulta:', error.message);
            
            // RQF02 VALIDACIÓN: Una cita solo puede tener una consulta
            if (error.code === '23505' && error.constraint === 'unique_cita_consulta') {
                throw new Error('Esta cita ya tiene una consulta registrada.');
            }
            
            throw error;
        } finally {
            client.release();
        }
    },

    // ============================================
    // RQF02 - OBTENER CONSULTA POR ID
    // Con todos sus detalles (diagnósticos, tratamientos, etc.)
    // ============================================
    findById: async (id_consulta) => {
        console.log(`[MODELO CONSULTA] Buscando consulta ID: ${id_consulta}`);
        
        const query = `
            SELECT 
                c.*,
                u.nombre_completo AS veterinario,
                ci.fecha_cita,
                ci.hora_cita,
                e.numero_expediente,
                p.nombre AS mascota_nombre,
                
                -- Diagnósticos
                (
                    SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', d.id_diagnostico,
                            'descripcion', d.descripcion,
                            'tipo', d.tipo,
                            'codigo_cie', d.codigo_cie
                        )
                    )
                    FROM tDiagnosticos d
                    WHERE d.consulta_id = c.id_consulta
                ) AS diagnosticos,
                
                -- Tratamientos
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
                
                -- Vacunas
                (
                    SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', v.id_vacuna,
                            'nombre_vacuna', v.nombre_vacuna,
                            'fecha_aplicacion', v.fecha_aplicacion,
                            'proxima_dosis', v.proxima_dosis
                        )
                    )
                    FROM tVacunas v
                    WHERE v.consulta_id = c.id_consulta
                ) AS vacunas,
                
                -- Procedimientos
                (
                    SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', pr.id_procedimiento,
                            'tipo', pr.tipo_procedimiento,
                            'nombre', pr.nombre_procedimiento,
                            'descripcion', pr.descripcion
                        )
                    )
                    FROM tProcedimientos pr
                    WHERE pr.consulta_id = c.id_consulta
                ) AS procedimientos,
                
                -- Imágenes
                (
                    SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', i.id_imagen,
                            'url', i.url_imagen,
                            'descripcion', i.descripcion,
                            'tipo', i.tipo_imagen
                        )
                    )
                    FROM tImagenesExpediente i
                    WHERE i.consulta_id = c.id_consulta
                ) AS imagenes
                
            FROM tConsultas c
            JOIN tUsuarios u ON c.veterinario_id = u.id
            JOIN tCitas ci ON c.cita_id = ci.id_cita
            JOIN tExpedientes e ON c.expediente_id = e.id_expediente
            JOIN tPacientes p ON e.mascota_id = p.id
            WHERE c.id_consulta = $1;
        `;
        
        try {
            const result = await pool.query(query, [id_consulta]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO CONSULTA] Error al buscar consulta:', error.message);
            throw error;
        }
    },

    // ============================================
    // RQF02 - OBTENER CONSULTAS POR EXPEDIENTE
    // ============================================
    findByExpedienteId: async (expediente_id) => {
        console.log(`[MODELO CONSULTA] Buscando consultas del expediente ID: ${expediente_id}`);
        
        const query = `
            SELECT 
                c.id_consulta,
                c.fecha_consulta,
                c.peso_actual,
                c.temperatura,
                c.motivo_consulta,
                u.nombre_completo AS veterinario,
                ci.hora_cita,
                (SELECT COUNT(*) FROM tDiagnosticos WHERE consulta_id = c.id_consulta) AS total_diagnosticos,
                (SELECT COUNT(*) FROM tTratamientos WHERE consulta_id = c.id_consulta) AS total_tratamientos
            FROM tConsultas c
            JOIN tUsuarios u ON c.veterinario_id = u.id
            JOIN tCitas ci ON c.cita_id = ci.id_cita
            WHERE c.expediente_id = $1
            ORDER BY c.fecha_consulta DESC, ci.hora_cita DESC;
        `;
        
        try {
            const result = await pool.query(query, [expediente_id]);
            console.log(`[MODELO CONSULTA] Se encontraron ${result.rows.length} consultas`);
            return result.rows;
        } catch (error) {
            console.error('[MODELO CONSULTA] Error al buscar consultas:', error.message);
            throw error;
        }
    },

    // ============================================
    // RQF02 - VERIFICAR SI UNA CITA YA TIENE CONSULTA
    // ============================================
    existeConsultaParaCita: async (cita_id) => {
        console.log(`[MODELO CONSULTA] Verificando si cita ID ${cita_id} ya tiene consulta`);
        
        const query = `SELECT id_consulta FROM tConsultas WHERE cita_id = $1;`;
        
        try {
            const result = await pool.query(query, [cita_id]);
            return result.rows.length > 0;
        } catch (error) {
            console.error('[MODELO CONSULTA] Error al verificar consulta:', error.message);
            throw error;
        }
    },

    // ============================================
    // RQF02 - ACTUALIZAR CONSULTA (Solo observaciones)
    // Las consultas históricas no se modifican completamente
    // ============================================
    update: async (id_consulta, datos) => {
        console.log(`[MODELO CONSULTA] Actualizando observaciones de consulta ID: ${id_consulta}`);
        
        const query = `
            UPDATE tConsultas
            SET observaciones = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id_consulta = $2
            RETURNING *;
        `;
        
        try {
            const result = await pool.query(query, [datos.observaciones, id_consulta]);
            
            if (result.rows.length === 0) {
                throw new Error('Consulta no encontrada');
            }
            
            console.log('[MODELO CONSULTA] Consulta actualizada exitosamente');
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO CONSULTA] Error al actualizar consulta:', error.message);
            throw error;
        }
    }
};

module.exports = ConsultaModel;
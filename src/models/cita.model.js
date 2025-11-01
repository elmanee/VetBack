const { pool } = require('../db/config');

const CitaModel = {
    // RQF01 - VALIDACIÓN: Verifica si un veterinario ya tiene una cita en la misma fecha y hora.
    checkAvailability: async (fecha_cita, hora_cita, veterinarioId) => {
        const query = `
            SELECT * FROM tCitas 
            WHERE fecha_cita = $1 
              AND hora_cita = $2 
              AND veterinario_id = $3
              /* Se consideran ocupados los estados Pendiente, Confirmada y Por Confirmar */
              AND estado IN ('Pendiente', 'Confirmada', 'Por Confirmar'); 
        `;
        const values = [fecha_cita, hora_cita, veterinarioId];

        try {
            const result = await pool.query(query, values);
            return result.rows.length > 0; 
        } catch (error) {
            console.error("[MODELO CITA] Error al verificar disponibilidad:", error);
            throw error;
        }
    },

    // RQF01 - ALCANCE: Permite registrar citas.
    // MODIFICADO: Agregado token_confirmacion y estado inicial 'Por Confirmar'
    create: async ({ cliente_id, mascota_id, veterinario_id, fecha_cita, hora_cita, motivo, animal_id, token_confirmacion, estado = 'Por Confirmar' }) => {
        const query = `
            INSERT INTO tCitas (cliente_id, mascota_id, veterinario_id, animal_id, fecha_cita, hora_cita, motivo, estado, token_confirmacion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        // Nota: Asegúrate de que token_confirmacion siempre se envíe desde el controlador
        const values = [cliente_id, mascota_id, veterinario_id, animal_id, fecha_cita, hora_cita, motivo, estado, token_confirmacion];

        try {
            const result = await pool.query(query, values);
            return result.rows[0]; 
        } catch (error) {
            console.error("[MODELO CITA] Error al registrar la cita:", error);
            if (error.code === '23503') {
                throw new Error("Violación de clave foránea: El cliente, mascota, veterinario o tipo de animal no existe.");
            }
            throw error;
        }
    },

    // RQF01 - ALCANCE: Permite consultar citas programadas (Agenda).
    findAll: async () => {
        const query = `
            SELECT 
                c.id_cita, 
                c.fecha_cita, 
                c.hora_cita, 
                c.cliente_id, 
                c.mascota_id, 
                c.veterinario_id, 
                c.animal_id, 
                c.motivo, 
                c.estado, 
                c.created_at, 
                c.token_confirmacion,
                cl.nombre_completo AS cliente_nombre,
                cl.correo AS cliente_correo,
                COALESCE(p.nombre, 'Mascota Nueva') AS mascota_nombre
            FROM tCitas c
            JOIN tClientes cl ON c.cliente_id = cl.id
            LEFT JOIN tPacientes p ON c.mascota_id = p.id
            ORDER BY c.fecha_cita ASC, c.hora_cita ASC;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error("[MODELO CITA] Error al obtener todas las citas:", error);
            throw error;
        }
    },


    // RQF01 - Obtener una cita por ID
    findById: async (idCita) => {
        console.log(`[MODELO CITA] Buscando cita ID: ${idCita}`);
        
        // Se incluye token_confirmacion en el SELECT
        const query = 'SELECT id_cita, fecha_cita, hora_cita, cliente_id, mascota_id, veterinario_id, animal_id, motivo, estado, created_at, token_confirmacion FROM tCitas WHERE id_cita = $1;';
        
        try {
            const result = await pool.query(query, [idCita]);
            
            if (result.rows.length === 0) {
                console.log('[MODELO CITA] Cita no encontrada');
                return null;
            }
            
            console.log('[MODELO CITA] Cita encontrada');
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO CITA] Error al buscar cita:', error.message);
            throw error;
        }
    },
    
    // RQF02 - NUEVA FUNCIÓN: Confirma la cita por token
    confirmByToken: async (token) => {
        console.log(`[MODELO CITA] Buscando cita por token para confirmar...`);
        
        const updateQuery = `
            UPDATE tCitas 
            SET estado = 'Confirmada',
                token_confirmacion = NULL  /* Eliminar token después de usar */
            WHERE token_confirmacion = $1 AND estado = 'Por Confirmar'
            RETURNING *;
        `;
        
        try {
            const result = await pool.query(updateQuery, [token]);
            
            if (result.rows.length === 0) {
                console.log('[MODELO CITA] Token no encontrado o cita ya confirmada/cancelada');
                return null;
            }
            
            console.log('[MODELO CITA] Cita confirmada exitosamente por token');
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO CITA] Error al confirmar cita por token:', error.message);
            throw error;
        }
    },

    // RQF01 - Actualizar/Reprogramar una cita existente
    update: async (idCita, datos) => {
        console.log(`[MODELO CITA] Actualizando cita ID: ${idCita}`);
        console.log('[MODELO CITA] Nuevos datos:', datos);
        
        const query = `
            UPDATE tCitas 
            SET fecha_cita = $1, 
                hora_cita = $2, 
                veterinario_id = $3,
                estado = $4
            WHERE id_cita = $5
            RETURNING *;
        `;
        
        const values = [
            datos.fecha_cita,
            datos.hora_cita,
            datos.veterinario_id || 1,
            datos.estado || 'Pendiente', 
            idCita
        ];
        
        try {
            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error('Cita no encontrada');
            }
            
            console.log('[MODELO CITA] Cita actualizada exitosamente');
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO CITA] Error al actualizar cita:', error.message);
            throw error;
        }
    },

    // RQF01 - Cancelar una cita (cambiar estado a 'Cancelada')
    cancel: async (idCita) => {
        console.log(`[MODELO CITA] Cancelando cita ID: ${idCita}`);
        
        const query = `
            UPDATE tCitas 
            SET estado = 'Cancelada'
            WHERE id_cita = $1
            RETURNING *;
        `;
        
        try {
            const result = await pool.query(query, [idCita]);
            
            if (result.rows.length === 0) {
                throw new Error('Cita no encontrada');
            }
            
            console.log('[MODELO CITA] Cita cancelada exitosamente');
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO CITA] Error al cancelar cita:', error.message);
            throw error;
        }
    },

    async findByVeterinario(veterinarioId) {
        const query = `
SELECT 
    c.id_cita,
    c.cliente_id,
    c.mascota_id,
    c.veterinario_id,
    c.animal_id,
    c.fecha_cita,
    c.hora_cita,
    c.motivo,
    c.estado,
    c.created_at,
    c.token_confirmacion,
    cl.nombre_completo AS cliente_nombre,
    p.nombre AS mascota_nombre,
    a.nombre AS animal_nombre
FROM tcitas c
JOIN tclientes cl ON c.cliente_id = cl.id
LEFT JOIN tpacientes p ON c.mascota_id = p.id
JOIN tanimales a ON c.animal_id = a.id_tipoanimal
WHERE c.veterinario_id = $1
ORDER BY c.fecha_cita, c.hora_cita;

        `;
        const result = await pool.query(query, [veterinarioId]);
        return result.rows;
    }
};

module.exports = CitaModel;

// /home/agus/Documentos/VetHealth/VetBack/src/models/cliente.model.js

const { pool } = require('../db/config');

const ClienteModel = {
    /**
     * Buscar cliente por email
     */
    findByEmail: async (correo) => {
        console.log(`[MODELO CLIENTE] Buscando cliente con correo: ${correo}`);
        
        const query = 'SELECT * FROM tClientes WHERE correo = $1;';
        
        try {
            const result = await pool.query(query, [correo]);
            
            if (result.rows.length === 0) {
                console.log('[MODELO CLIENTE] Cliente no encontrado');
                return null;
            }
            
            console.log(`[MODELO CLIENTE] Cliente encontrado: ${result.rows[0].nombre_completo}`);
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO CLIENTE] Error al buscar cliente:', error);
            throw error;
        }
    },

    /**
     * NUEVO: Buscar cliente por ID
     */
    findById: async (id) => {
        console.log(`[MODELO CLIENTE] Buscando cliente con ID: ${id}`);
        
        const query = 'SELECT * FROM tClientes WHERE id = $1;';
        
        try {
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                console.log('[MODELO CLIENTE] Cliente no encontrado');
                return null;
            }
            
            console.log(`[MODELO CLIENTE] Cliente encontrado: ${result.rows[0].nombre_completo}`);
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO CLIENTE] Error al buscar cliente:', error);
            throw error;
        }
    },

    /**
     * Crear nuevo cliente
     */
    create: async ({ nombre_completo, correo, telefono, direccion = '' }) => {
        console.log('[MODELO CLIENTE] Creando nuevo cliente...');
        
        const query = `
            INSERT INTO tClientes (nombre_completo, correo, telefono, direccion)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        
        const values = [nombre_completo, correo, telefono, direccion];
        
        try {
            const result = await pool.query(query, values);
            console.log(`[MODELO CLIENTE] Cliente creado con ID: ${result.rows[0].id}`);
            return result.rows[0];
        } catch (error) {
            console.error('[MODELO CLIENTE] Error al crear cliente:', error);
            throw error;
        }
    },

    /**
     * Obtener mascotas de un cliente
     */
    getMascotas: async (clienteId) => {
        console.log(`[MODELO CLIENTE] Buscando mascotas del cliente ID: ${clienteId}`);
        
        const query = `
            SELECT m.*, a.nombre as tipo_animal
            FROM tMascotas m
            INNER JOIN tAnimales a ON m.animal_id = a.id
            WHERE m.cliente_id = $1;
        `;
        
        try {
            const result = await pool.query(query, [clienteId]);
            console.log(`[MODELO CLIENTE] Se encontraron ${result.rows.length} mascotas`);
            return result.rows;
        } catch (error) {
            console.error('[MODELO CLIENTE] Error al buscar mascotas:', error);
            throw error;
        }
    }
};

module.exports = ClienteModel;
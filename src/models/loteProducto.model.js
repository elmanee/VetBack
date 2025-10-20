const { pool } = require('../db/config');

const LoteProductoModel = {
    create: async ({ producto_id, num_lote, cantidad_inicial, cantidad_disponible, fecha_caducidad, proveedor_id }) => {
        const query = `
            INSERT INTO tLotes (producto_id, num_lote, cantidad_inicial, cantidad_disponible, fecha_caducidad, proveedor_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [producto_id, num_lote, cantidad_inicial, cantidad_disponible, fecha_caducidad, proveedor_id];

        try {
            if (cantidad_disponible === undefined) {
                values[3] = cantidad_inicial;
            }

            const result = await pool.query(query, values);
            return result.rows[0]; 
        } catch (error) {
            console.error("Error al registrar el lote:", error);
            if (error.code === '23503') {
                throw new Error("Violación de clave foránea: El producto_id no existe en la tabla tProductos.");
            }
            throw error;
        }
    },

    findAll: async () => {
        const query = 'SELECT * FROM tLotes ORDER BY fecha_caducidad ASC;';
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error("Error al obtener todos los lotes:", error);
            throw error;
        }
    },

    findByProductoId: async (producto_id) => {
        const query = 'SELECT * FROM tLotes WHERE producto_id = $1 AND cantidad_disponible > 0 ORDER BY fecha_caducidad ASC;';
        try {
            const result = await pool.query(query, [producto_id]);
            return result.rows;
        } catch (error) {
            console.error(`Error al buscar lotes para el producto ID ${producto_id}:`, error);
            throw error;
        }
    },

    updateInventory: async (lote_id, cantidad_vendida) => {
        const query = `
            UPDATE tLotes SET
            cantidad_disponible = cantidad_disponible - $1
            WHERE id = $2 AND cantidad_disponible >= $1 
            RETURNING id, cantidad_disponible;
        `;
        const values = [cantidad_vendida, lote_id];

        try {
            const result = await pool.query(query, values);
            return result.rows[0]; 
        } catch (error) {
            console.error(`Error al actualizar inventario del lote ID ${lote_id}:`, error);
            throw error;
        }
    },

    remove: async (id) => {
        const query = 'DELETE FROM tLotes WHERE id = $1 RETURNING *;';
        try {
            const result = await pool.query(query, [id]);
            return result.rows[0]; 
        } catch (error) {
            console.error(`Error al eliminar lote con ID ${id}:`, error);
            throw error;
        }
    }
};

module.exports = LoteProductoModel;

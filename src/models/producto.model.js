const { pool } = require('../db/config');

const ProductoModel = {
    create: async ({ nombre, descripcion, precio_venta, unidad_medida }) => {
        const query = `
            INSERT INTO tProductos (nombre, descripcion, precio_venta, unidad_medida)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [nombre, descripcion, precio_venta, unidad_medida];

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error("Error al crear el producto:", error);
            throw error;
        }
    },

    findAll: async () => {
        const query = 'SELECT * FROM tProductos ORDER BY nombre ASC;';
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error("Error al obtener todos los productos:", error);
            throw error;
        }
    },

    findById: async (id) => {
        const query = 'SELECT * FROM tProductos WHERE id = $1;';
        try {
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            console.error(`Error al buscar producto con ID ${id}:`, error);
            throw error;
        }
    },

    update: async (id, data) => {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const key in data) {
            fields.push(`${key} = $${paramIndex++}`);
            values.push(data[key]);
        }

        if (fields.length === 0) {
            return null; 
        }

        values.push(id);
        const query = `
            UPDATE tProductos SET ${fields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *;
        `;
        
        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error(`Error al actualizar producto con ID ${id}:`, error);
            throw error;
        }
    },

    // D - DELETE
    remove: async (id) => {
        const query = 'DELETE FROM tProductos WHERE id = $1 RETURNING *;';
        try {
            const result = await pool.query(query, [id]);
            return result.rows[0]; 
        } catch (error) {
            console.error(`Error al eliminar producto con ID ${id}:`, error);
            throw error;
        }
    }
};

module.exports = ProductoModel;
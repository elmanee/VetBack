const { pool } = require('../db/config');
const responseHandler = require('../utils/responseHandler');

const MovimientoController = {
  createMovimiento: async (req, res) => {
    const { tipo, producto_id, lote_id, cantidad, motivo, usuario_id = 1 } = req.body;

    if (!tipo || !producto_id || !cantidad || !lote_id) {
      return responseHandler.error(res, 'Campos obligatorios faltantes', 400);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const movimientoQuery = `
        INSERT INTO tMovimientos (tipo, producto_id, lote_id, cantidad, motivo, usuario_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const movimientoValues = [tipo, producto_id, lote_id, cantidad, motivo, usuario_id];
      const result = await client.query(movimientoQuery, movimientoValues);
      const nuevoMovimiento = result.rows[0];

      let updateQuery = '';
      if (tipo === 'salida') {
        updateQuery = `
          UPDATE tLotes
          SET cantidad_disponible = cantidad_disponible - $1
          WHERE id = $2 RETURNING *;
        `;
      } else if (tipo === 'ajuste') {
        updateQuery = `
          UPDATE tLotes
          SET cantidad_disponible = cantidad_disponible + $1
          WHERE id = $2 RETURNING *;
        `;
      }

      if (updateQuery) {
        const loteResult = await client.query(updateQuery, [cantidad, lote_id]);
        const loteActualizado = loteResult.rows[0];
        if (!loteActualizado) throw new Error('Lote no encontrado');

        if (loteActualizado.cantidad_disponible < 0) {
          throw new Error('Cantidad disponible no puede ser negativa.');
        }
      }

      await client.query('COMMIT');
      return responseHandler.success(res, nuevoMovimiento, 'Movimiento registrado correctamente.', 201);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al registrar movimiento:', error);
      return responseHandler.error(res, 'Error interno al registrar movimiento.');
    } finally {
      client.release();
    }
  },

  getAllMovimientos: async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT m.*, p.nombre AS producto_nombre, l.num_lote
        FROM tMovimientos m
        LEFT JOIN tProductos p ON m.producto_id = p.id
        LEFT JOIN tLotes l ON m.lote_id = l.id
        ORDER BY m.fecha DESC;
      `);
      return responseHandler.success(res, result.rows, `Se encontraron ${result.rowCount} movimientos.`);
    } catch (error) {
      console.error('Error al obtener movimientos:', error);
      return responseHandler.error(res, 'Error interno al obtener movimientos.');
    }
  },

  
};

module.exports = MovimientoController;

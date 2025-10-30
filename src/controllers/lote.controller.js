const { pool } = require('../db/config');
const responseHandler = require('../utils/responseHandler');

const LoteController = {
  createLote: async (req, res) => {
    const {
      producto_id,
      num_lote,
      cantidad_inicial,
      cantidad_disponible,
      fecha_caducidad,
      proveedor_id,
      usuario_id = 1 // temporal hasta implementar auth
    } = req.body;

    if (!producto_id || !num_lote || !cantidad_inicial || !fecha_caducidad || !proveedor_id) {
      return responseHandler.error(res, 'Faltan campos obligatorios', 400);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 🧩 Crear el lote
      const insertLoteQuery = `
        INSERT INTO tLotes (producto_id, num_lote, cantidad_inicial, cantidad_disponible, fecha_caducidad, proveedor_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const values = [
        producto_id,
        num_lote,
        cantidad_inicial,
        cantidad_disponible || cantidad_inicial,
        fecha_caducidad,
        proveedor_id
      ];

      const loteResult = await client.query(insertLoteQuery, values);
      const nuevoLote = loteResult.rows[0];

      // 🟩 Crear movimiento tipo ENTRADA
      const insertMovimientoQuery = `
        INSERT INTO tMovimientos (tipo, producto_id, lote_id, cantidad, motivo, usuario_id)
        VALUES ('entrada', $1, $2, $3, 'Ingreso de nuevo lote', $4)
      `;
      await client.query(insertMovimientoQuery, [
        producto_id,
        nuevoLote.id,
        cantidad_inicial,
        usuario_id
      ]);

      await client.query('COMMIT');
      return responseHandler.success(res, nuevoLote, 'Lote creado y movimiento registrado.', 201);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al crear lote:', error);
      return responseHandler.error(res, 'Error interno al registrar lote.');
    } finally {
      client.release();
    }
  },

  getAllLotes: async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT l.*, p.nombre AS producto_nombre, pr.nombre AS proveedor_nombre
        FROM tLotes l
        JOIN tProductos p ON l.producto_id = p.id
        JOIN tProveedores pr ON l.proveedor_id = pr.id
        ORDER BY l.fecha_ingreso DESC;
      `);
      return responseHandler.success(res, result.rows, `Se encontraron ${result.rowCount} lotes.`);
    } catch (error) {
      console.error('Error al obtener lotes:', error);
      return responseHandler.error(res, 'Error interno al obtener lotes.');
    }
  }
};

module.exports = LoteController;

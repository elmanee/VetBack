const { pool } = require('../db/config');
const responseHandler = require('../utils/responseHandler');

const UsuarioController = {
  getUsuarioById: async (req, res) => {
    const { id } = req.params;

    try {
      const query = `
        SELECT id, nombre_completo
        FROM tUsuarios
        WHERE id = $1;
      `;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return responseHandler.error(res, 'Usuario no encontrado', 404);
      }

      return responseHandler.success(res, result.rows[0], 'Usuario encontrado');
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      return responseHandler.error(res, 'Error interno al obtener el usuario');
    }
  }
};

module.exports = UsuarioController;

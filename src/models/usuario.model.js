const { pool } = require('../db/config');

const UsuarioModel = {
  async crearUsuario({ nombre_completo, correo, telefono, rol, password_hash }) {
    const query = `
      INSERT INTO tUsuarios (nombre_completo, correo, telefono, rol, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre_completo, correo, rol, activo;
    `;
    const values = [nombre_completo, correo, telefono, rol, password_hash];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async buscarPorCorreo(correo) {
    const result = await pool.query('SELECT * FROM tUsuarios WHERE correo = $1', [correo]);
    return result.rows[0];
<<<<<<< HEAD
  },

  async getVeterinarios() {
    const query = `
        SELECT id, nombre_completo, correo, telefono
        FROM tUsuarios
        WHERE rol = 'Veterinario' AND activo = true;
    `;
    const result = await pool.query(query);
    return result.rows;
=======
>>>>>>> 81fbbd2 (login con jwt y barrer)
  }
};

module.exports = UsuarioModel;

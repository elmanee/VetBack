const { pool } = require('../db/config');

const ExpedienteModel = {
  async create({ paciente_id, numero_expediente, observaciones_generales }) {
    const query = `
      INSERT INTO tExpedientes (paciente_id, numero_expediente, observaciones_generales)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [paciente_id, numero_expediente, observaciones_generales];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async findAll() {
    const query = `
      SELECT e.*, p.nombre AS paciente_nombre, c.nombre_completo AS cliente_nombre
      FROM tExpedientes e
      JOIN tPacientes p ON e.paciente_id = p.id
      JOIN tClientes c ON p.cliente_id = c.id
      ORDER BY e.created_at DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async findById(id) {
    const query = `
      SELECT * FROM tExpedientes WHERE id_expediente = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async update(id, data) {
    const query = `
      UPDATE tExpedientes
      SET observaciones_generales = $1,
          estado = $2,
          updated_at = NOW()
      WHERE id_expediente = $3
      RETURNING *;
    `;
    const result = await pool.query(query, [
      data.observaciones_generales,
      data.estado,
      id,
    ]);
    return result.rows[0];
  },
};

module.exports = ExpedienteModel;

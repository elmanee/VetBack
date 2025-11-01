const { pool } = require('../db/config');

const PacienteModel = {
  async create({ cliente_id, nombre, raza, edad, peso }) {
    const query = `
      INSERT INTO tPacientes (cliente_id, nombre, raza, edad, peso)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [cliente_id, nombre, raza, edad, peso];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async findAll() {
    const query = `SELECT * FROM tPacientes ORDER BY id DESC;`;
    const result = await pool.query(query);
    return result.rows;
  },

  async findById(id) {
    const query = `SELECT * FROM tPacientes WHERE id = $1;`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async update(id, data) {
    const query = `
      UPDATE tPacientes
      SET nombre = $1, raza = $2, edad = $3, peso = $4
      WHERE id = $5
      RETURNING *;
    `;
    const result = await pool.query(query, [
      data.nombre,
      data.raza,
      data.edad,
      data.peso,
      id,
    ]);
    return result.rows[0];
  },

  // Nuevos métodos para mejor performance
  async findByClienteId(clienteId) {
    const query = `SELECT * FROM tPacientes WHERE cliente_id = $1 ORDER BY nombre;`;
    const result = await pool.query(query, [clienteId]);
    return result.rows;
  },

  async findByClienteAndNombre(clienteId, nombre) {
    const query = `
      SELECT * FROM tPacientes 
      WHERE cliente_id = $1 AND LOWER(nombre) = LOWER($2);
    `;
    const result = await pool.query(query, [clienteId, nombre]);
    return result.rows[0];
  }
};

module.exports = PacienteModel;
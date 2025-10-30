require('dotenv').config(); 
const { Pool } = require('pg');


const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vet_db',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5433,
});


async function connectDB() {
  try {
    const client = await pool.connect();
    console.log('Conexión exitosa con la base de datos PostgreSQL');
    client.release();
  } catch (error) {
    console.error('Error de conexión:', error.message);
    process.exit(1);
  }
}


module.exports = { pool, connectDB };

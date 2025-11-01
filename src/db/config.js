const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',              
  host: 'localhost',             
  database: 'vet_db',            
  password: process.env.DB_PASSWORD, 
  port: 5433,                    
});

async function connectDB() {
    try {
        console.log('conexion exitosa con la bd');
    } catch (error) {
        console.error('erro de conexion:', error.message);
        process.exit(1); 
    }
}

module.exports = {
    pool,
    connectDB
};
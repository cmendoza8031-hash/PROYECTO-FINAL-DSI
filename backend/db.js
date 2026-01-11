import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Obligatorio para Supabase
});

pool.query('SELECT NOW()')
  .then(() => console.log('✅ Base de datos conectada (Supabase)'))
  .catch(err => console.error('❌ Error de conexión:', err.message));
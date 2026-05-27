import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en el pool de conexiones:', err.message);
  console.error('[DB] Stack:', err.stack);
});

pool.on('connect', () => {
  console.log('[DB] Nueva conexion establecida');
});

export const query = (text, params) => {
  const start = Date.now();
  return pool.query(text, params)
    .then(res => {
      const duration = Date.now() - start;
      console.log(`[DB] Query ejecutado en ${duration}ms | Filas afectadas: ${res.rowCount}`);
      return res;
    })
    .catch(err => {
      console.error('[DB] Error en query:', err.message);
      console.error('[DB] Query:', text);
      console.error('[DB] Parametros:', params);
      throw err;
    });
};

export default pool;

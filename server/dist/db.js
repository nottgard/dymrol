import pg from 'pg';
// La conexión viene de la variable de entorno DATABASE_URL
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

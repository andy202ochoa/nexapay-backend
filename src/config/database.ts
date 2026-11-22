/**
 * Configuración de la conexión a PostgreSQL.
 * Centraliza el pool de conexiones que utilizará
 * el backend para realizar consultas a la base de datos.
 */

import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // En Vercel cada instancia de la función abre su propio pool:
    // se limita a pocas conexiones para no agotar las de la base de datos
    // (en Neon conviene usar la cadena de conexión "pooled").
    max: process.env.VERCEL ? 3 : 10,
});

export default pool;

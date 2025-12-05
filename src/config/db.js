import { Pool } from 'pg';

// 🔧 CONFIGURACIÓN SIMPLE DEL POOL
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    max: 5, // Reducir conexiones máximas
    idleTimeoutMillis: 10000, // Reducir tiempo de idle
    connectionTimeoutMillis: 3000, // Reducir timeout de conexión
    acquireTimeoutMillis: 3000, // Timeout para obtener conexión del pool
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Manejo de errores del pool
pool.on('error', (err) => {
    console.error('❌ Error inesperado en el pool de BD:', err);
});

const query = async (text, params) => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query(text, params);
        return result;
    } catch (error) {
        console.error('❌ Database query error:', error.message);
        // Si es un error de conexión, intentar reconectar
        if (error.message.includes('Connection terminated') || 
            error.message.includes('connect ECONNREFUSED') ||
            error.code === 'ECONNRESET') {
            console.log('🔄 Intentando reconectar a la base de datos...');
            throw new Error('Database connection lost - please retry');
        }
        throw error;
    } finally {
        if (client) {
            try {
                client.release();
            } catch (releaseError) {
                console.error('⚠️ Error liberando conexión:', releaseError.message);
            }
        }
    }
};

const closePool = async () => {
    try {
        await pool.end();
    } catch (error) {
        console.error('❌ Error cerrando pool:', error.message);
    }
};

process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

export {
    pool,
    pool as default,
    query,
    closePool
};
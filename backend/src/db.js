const mysql = require('mysql2/promise');

// Validar variables de entorno críticas
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ ERROR: Variables de entorno faltantes:', missingVars);
  console.error('Por favor configura:', missingVars.join(', '));
  process.exit(1);
}

// Log de variables de conexión (sin contraseña)
console.log('🔧 Configuración de Database:');
console.log('  Host:', process.env.DB_HOST);
console.log('  Usuario:', process.env.DB_USER);
console.log('  Base de datos:', process.env.DB_NAME);
console.log('  Puerto:', process.env.DB_PORT || 3306);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sanilab_checklist',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 30000,
  connectTimeout: 20000,
  idleTimeout: 60000,
  decimalNumbers: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  namedPlaceholders: true,
});

// Test the connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ Database connection successful!');
    console.log('Connected to database:', process.env.DB_HOST);
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('Código de error:', err.code);
    console.error('Detalles completos:');
    console.error(err);
  });

module.exports = pool;

const mysql = require('mysql2/promise');

// Validar variables de entorno críticas
const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ ERROR: Variables de entorno faltantes:', missingVars);
  console.error('Por favor configura:', missingVars.join(', '));
  console.error('Variables disponibles:', Object.keys(process.env).filter(k => k.includes('MYSQL')));
  // No hacer exit aquí, esperar a que Railway inyecte las variables
}

// Log de variables de conexión (sin contraseña)
console.log('🔧 Configuración de Database (from Railway MySQL):');
console.log('  Host:', process.env.MYSQL_HOST);
console.log('  Usuario:', process.env.MYSQL_USER);
console.log('  Base de datos:', process.env.MYSQL_DATABASE);
console.log('  Puerto:', process.env.MYSQL_PORT || 3306);

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'railway',
  port: process.env.MYSQL_PORT || 3306,
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 30000,
  connectTimeout: 10000,
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
    console.log('Connected to:', process.env.MYSQL_HOST + ':' + (process.env.MYSQL_PORT || 3306));
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('Código de error:', err.code);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('La conexión se perdió');
    } else if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('La BD rechazó la conexión (demasiadas conexiones)');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Acceso denegado (verifica usuario/contraseña)');
    } else if (err.code === 'ER_PARSE_ERROR') {
      console.error('Error de SQL');
    }
    console.error('Detalles completos:', err);
  });

module.exports = pool;

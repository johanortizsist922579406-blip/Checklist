const mysql = require('mysql2/promise');

// Log de variables disponibles para debugging
console.log('🔧 Variables de entorno disponibles:');
const mysqlVars = Object.keys(process.env).filter(k => k.includes('MYSQL') || k.includes('DATABASE'));
mysqlVars.forEach(v => console.log('  -', v));

// Railway proporciona DATABASE_URL como la URL de conexión completa
// O proporciona MYSQL_* variables individuales
let pool;

if (process.env.DATABASE_URL) {
  // Usar DATABASE_URL si está disponible (más confiable)
  console.log('🔧 Usando DATABASE_URL para conectar a MySQL');
  pool = mysql.createPool(process.env.DATABASE_URL);
} else {
  // Fallback a variables individuales
  console.log('🔧 Usando MYSQL_* variables para conectar a MySQL');
  
  const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️ WARNING: Variables faltantes:', missingVars);
  }
  
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
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
}

// Test de conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ Database connection successful!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('Código de error:', err.code);
    console.error('Stack:', err.stack);
  });

module.exports = pool;

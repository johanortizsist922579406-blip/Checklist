const mysql = require('mysql2/promise');

// Log de variables disponibles para debugging
console.log('🔧 Variables de entorno disponibles:');
const mysqlVars = Object.keys(process.env).filter(k => k.includes('MYSQL') || k.includes('DATABASE'));
mysqlVars.forEach(v => console.log('  -', v));

// Railway inyecta variables MYSQL_* que SIEMPRE debemos usar primero
let pool;

const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length === 0) {
  // Todas las variables necesarias están disponibles - USAR ESTAS
  console.log('🔧 Usando MYSQL_* variables para conectar a MySQL');
  console.log('  Host:', process.env.MYSQL_HOST);
  console.log('  Usuario:', process.env.MYSQL_USER);
  console.log('  Base de datos:', process.env.MYSQL_DATABASE);
  console.log('  Puerto:', process.env.MYSQL_PORT || 3306);
  
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
} else if (process.env.DATABASE_URL) {
  // Si faltan variables individuales, intentar DATABASE_URL
  console.log('🔧 Usando DATABASE_URL para conectar a MySQL');
  pool = mysql.createPool(process.env.DATABASE_URL);
} else {
  console.error('❌ ERROR: No hay variables de conexión a BD disponibles');
  console.error('Faltantes:', missingVars);
  process.exit(1);
}

// Test de conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ ✅ Database connection successful!');
    console.log('   Connected to MySQL');
    conn.release();
  })
  .catch(err => {
    console.error('❌ ❌ Database connection failed:', err.message);
    console.error('   Código de error:', err.code);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('   La conexión se perdió (conexión rechazada)');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('   La conexión fue rechazada (MySQL no accesible)');
      console.error('   Verifica que MYSQL_HOST, MYSQL_PORT sean correctos');
      console.error('   Verifica que MySQL esté Online en Railway');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Acceso denegado (verifica usuario/contraseña)');
    }
    console.error('   Stack:', err.stack);
  });

module.exports = pool;

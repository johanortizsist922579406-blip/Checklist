const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sanilab_checklist',
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 30000,
  connectTimeout: 30000,
  idleTimeout: 60000,
  enableTLS: false,
  namedPlaceholders: true,
  decimalNumbers: true,
  supportBigNumbers: true,
  bigNumberStrings: true
});

// Test the connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ Database connection successful!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = pool;

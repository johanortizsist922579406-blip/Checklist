require('dotenv').config();
const mysql = require('mysql2/promise');

const host = process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost';
const user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'railway';
const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT) || 3306;

console.log('🔧 Conectando con variables...');
console.log('  Host:', host);
console.log('  Usuario:', user);
console.log('  Puerto:', port);
console.log('  Base:', database);

const pool = mysql.createPool({
  host,
  user,
  password,
  database,
  port,
  timezone: '-05:00',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

pool.getConnection()
  .then(conn => {
    console.log('✅ DATABASE CONNECTION SUCCESS!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ DATABASE CONNECTION FAILED:', err.message);
  });

module.exports = pool;

const mysql = require('mysql2/promise');

const port = Number(process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306);
const host = process.env.MYSQL_HOST || process.env.MYSQLHOST || 'mysql.railway.internal';
const user = process.env.MYSQL_USER || process.env.MYSQLUSER || 'root';
const password = process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || '';
const database = process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'railway';

console.log('🔧 Conectando con MYSQL_* variables...');
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
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

module.exports = pool;

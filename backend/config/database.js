const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQL_USER || process.env.MYSQLUSER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'railway',
  port: process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

module.exports = pool;
// Fixed: Using Railway's MYSQL_ environment variables

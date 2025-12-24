const mysql = require('mysql2/promise');

const pool = mysql.createPool({
process.env.MYSQL_HOST || process.env.MYSQLHOST || 'localhost',  user: process.env.MYSQL_USER,
process.env.MYSQL_USER || process.env.MYSQLUSER || 'root',  database: process.env.MYSQL_DATABASE,
process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || '',  waitForConnections: true,
process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'railway',  queueLimit: 0,
process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306,});

module.exports = pool;
// Fixed: Using mysql.railway.internal for DB_HOST

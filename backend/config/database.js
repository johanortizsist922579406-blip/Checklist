const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',     
  user: 'root',        
  password: 'root',
  database: 'sanilab_checklist',
  port: 3306,
  multipleStatements: true
});

module.exports = pool;
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'sanilab_checklist',
  multipleStatements: true
});

module.exports = pool;

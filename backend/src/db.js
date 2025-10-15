// backend/src/db.js

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',           // ← Cambia esto por tu usuario MySQL
  password: 'root',      // ← Cambia esto por tu password MySQL
  database: 'sanilab_checklist' // ← Cambia esto si tu base se llama diferente
});

module.exports = pool;

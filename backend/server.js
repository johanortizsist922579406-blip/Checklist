require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pool = require('./config/database');

const app = express();
const routes = require('./src/routes');

const projectRoot = path.dirname(__dirname);
const frontendPath = path.join(projectRoot, 'frontend');

console.log('Project root:', projectRoot);
console.log('Frontend path:', frontendPath);
console.log('Frontend exists:', fs.existsSync(frontendPath));
console.log('Index.html exists:', fs.existsSync(path.join(frontendPath, 'index.html')));

pool.getConnection()
  .then(conn => {
    console.log('✅ DATABASE CONNECTED SUCCESSFULLY');
    conn.release();
  })
  .catch(err => {
    console.error('❌ DATABASE CONNECTION FAILED:', err.message);
  });

app.use(cors());
app.use(express.json());

app.use(express.static(frontendPath, {
  dotfiles: 'ignore',
  index: false
}));

app.get('/', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  console.log('Attempting to serve:', indexPath);
  console.log('File exists:', fs.existsSync(indexPath));
  
  if (!fs.existsSync(indexPath)) {
    return res.status(404).json({
      error: 'index.html not found',
      path: indexPath,
      frontendPath: frontendPath,
      projectRoot: projectRoot
    });
  }
  
  res.sendFile(indexPath);
});

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error('ERROR GLOBAL =>', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving static files from: ${frontendPath}`);
});

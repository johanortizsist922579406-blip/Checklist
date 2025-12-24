require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const routes = require('./src/routes');

// Determine the correct path to the frontend
const frontendPath = path.resolve(__dirname, '../frontend');
console.log('Frontend path:', frontendPath);

app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static(frontendPath));

// Route for serving the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
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
});

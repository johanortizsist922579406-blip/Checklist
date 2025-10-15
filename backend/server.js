require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const routes = require('./src/routes'); // SOLO AQUÍ

// Permitir peticiones del frontend (si usas distintos orígenes)
app.use(cors());

// Para parsear JSON en body POST
app.use(express.json());

// Sirve archivos estáticos de la carpeta frontend (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, '../frontend')));

// Al abrir la raíz muestra el HTML principal (index.html de frontend)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Todas las rutas de tu API
app.use('/api', routes);

// Puerto desde el archivo .env o usa 3000 por defecto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

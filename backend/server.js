require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const routes = require('./src/routes');

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use('/api', routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

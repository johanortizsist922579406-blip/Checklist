// src/routes/asistenciaRoutes.js
const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');

router.get('/', asistenciaController.getAllAsistencias);
router.get('/:id', asistenciaController.getAsistenciaById);
router.post('/', asistenciaController.createAsistencia);
router.post('/salida', asistenciaController.marcarSalida);
// Puedes agregar PUT y DELETE si lo deseas

module.exports = router;

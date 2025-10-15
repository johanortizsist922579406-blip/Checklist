// src/routes.js  o  routes/index.js
const express = require('express');
const router = express.Router();

// IMPORTAS todos los routers específicos
router.use('/areas', require('./areaRoutes'));
router.use('/usuarios', require('./usuarios')); 
router.use('/asistencias', require('./asistenciaRoutes'));
router.use('/preguntas', require('./preguntas')); 
router.use('/autoevaluaciones', require('./autoevaluacionRoutes'));
router.use('/respuestas-autoevaluacion', require('./respuestaAutoevaluacionRoutes'));
router.use('/rankings', require('./rankingRoutes'));

module.exports = router;

const express = require('express');
const router = express.Router();

const asistenciaRoutes = require('./asistenciaRoutes');
const areaRoutes = require('./areaRoutes');
const usuarioRoutes = require('./usuarios');
const preguntaRoutes = require('./preguntas');
const autoevaluacionRoutes = require('./autoevaluacionRoutes');
const respuestaAutoevaluacionRoutes = require('./respuestaAutoevaluacionRoutes');
const rankingRoutes = require('./rankingRoutes');
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');

router.use('/auth', authRoutes);
router.use('/asistencias', asistenciaRoutes);
router.use('/areas', areaRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/preguntas', preguntaRoutes);
router.use('/autoevaluaciones', autoevaluacionRoutes);
router.use('/respuestas-autoevaluacion', respuestaAutoevaluacionRoutes);
router.use('/rankings', rankingRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

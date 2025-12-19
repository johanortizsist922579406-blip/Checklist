const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');

const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', asistenciaController.getAllAsistencias);
router.post('/entrada', asistenciaController.marcarEntrada);
router.post('/salida', asistenciaController.marcarSalida);

module.exports = router;

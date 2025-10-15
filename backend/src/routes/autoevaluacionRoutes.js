const express = require('express');
const router = express.Router();
const autoevaluacionController = require('../controllers/autoevaluacionController');

router.post('/', autoevaluacionController.crearAutoevaluacion);
router.get('/', autoevaluacionController.getAllAutoevaluaciones);
router.get('/:id', autoevaluacionController.getAutoevaluacionById);

// Elimina toda ruta .post/.get/.put/.delete que no tenga función exportada correspondiente

module.exports = router;

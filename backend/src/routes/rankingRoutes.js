const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController');

router.get('/', rankingController.getAllRankings);
router.get('/:id', rankingController.getRankingById);
router.post('/actualizar', rankingController.actualizarRankingUsuario);
router.post('/recalcular', rankingController.recalcularRanking);

module.exports = router;

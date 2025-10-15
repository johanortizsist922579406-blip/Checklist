// rankingRoutes.js
const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController');

router.get('/', rankingController.getAllRankings);
router.get('/:id', rankingController.getRankingById);
router.post('/recalcular', rankingController.recalcularRanking);
router.put('/recalcular', rankingController.recalcularRanking);

module.exports = router;

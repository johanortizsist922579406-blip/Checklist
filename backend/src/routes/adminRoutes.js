const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.get('/horas',    verifyToken, verifyAdmin, adminController.getHoras);
router.get('/puntajes', verifyToken, verifyAdmin, adminController.getPuntajes);

module.exports = router;
